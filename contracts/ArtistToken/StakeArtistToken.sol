pragma solidity 0.8.15;

import "./ArtistToken.sol";

contract StakeArtistToken {
    // token address => user address    => time
    mapping (address => mapping(address => uint)) addressStakeStartTime;
    // token address => user address    => stake amount
    mapping (address => mapping(address => uint)) stakedAmount;
    mapping (address => uint) stakingInterval;

    address deployer;

    constructor() {
        deployer = msg.sender;
    }

    function stake(address _tokenAddress, uint _stakeAmount) public {
        //address must approve this contract before calling this function on the token
        require (stakedAmount[_tokenAddress][msg.sender] == 0, "Address has tokens currently staked");
    
        ArtistToken artistToken = ArtistToken(_tokenAddress);
        artistToken.transfer(msg.sender, address(this), _stakeAmount, true, "0x");

        addressStakeStartTime[_tokenAddress][msg.sender] = block.timestamp;
        stakedAmount[_tokenAddress][msg.sender] = _stakeAmount;
    }

    function unstake(address _tokenAddress, address _user) public {
        require (stakedAmount[_tokenAddress][msg.sender] != 0, "Address hasn't got any tokens staked");
        
        uint withdraw = stakedAmount[_tokenAddress][msg.sender];
        stakedAmount[_tokenAddress][msg.sender] = 0;

        ArtistToken artistToken = ArtistToken(_tokenAddress);
        artistToken.transfer(address(this), msg.sender, withdraw, true, "0x");
        address(this).delegatecall(abi.encodeWithSignature("claimStake(address)", _tokenAddress)
        );

        addressStakeStartTime[_tokenAddress][msg.sender] = 0;
    }

    function claimStake(address _tokenAddress) public{
        require (stakedAmount[_tokenAddress][msg.sender] != 0, "Address hasn't got any tokens staked");
        if (block.timestamp - addressStakeStartTime[_tokenAddress][msg.sender] >= stakingInterval[_tokenAddress]) {
            ArtistToken artistToken = ArtistToken(_tokenAddress);

            uint difference = block.timestamp - addressStakeStartTime[_tokenAddress][msg.sender];
            uint intervalsPassed = difference/stakingInterval[_tokenAddress];

            //calculate what percentage the address owns of this contracts balance of token
            //use that percentage for how much the address receices based on this contracts balance of token
            uint percentageOwned = stakedAmount[_tokenAddress][msg.sender] * 10000 / artistToken.balanceOf(address(this));
            uint rewardBase = artistToken.balanceOf(address(this)) * percentageOwned / 10000;
            uint reward = rewardBase * intervalsPassed;
            
            artistToken.transfer(address(this), msg.sender, reward, true, "0x");
            addressStakeStartTime[_tokenAddress][msg.sender] = block.timestamp;
        }
    }

    function setStakingInterval(address _tokenAddress, uint _interval) public {
        //require(msg.sender == deployer);
        stakingInterval[_tokenAddress] = _interval;
    }

    function getStakedAmount(address _tokenAddress, address _user) public view returns(uint) {
        return stakedAmount[_tokenAddress][_user];
    }

    function getStakedStartTime(address _tokenAddress, address _user) public view returns(uint) {
        return addressStakeStartTime[_tokenAddress][_user];
    }

    function getStakingInterval(address _tokenAddress) public view returns(uint) {
        return stakingInterval[_tokenAddress];
    }

    function getBlockTime() public view returns(uint) {
        return block.timestamp;
    }
}