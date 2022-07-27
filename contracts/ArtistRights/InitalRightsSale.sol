pragma solidity 0.8.15;
import "./ArtistRightsToken.sol";

contract InitalRightsSale {
    //Artist address => Artist Token
    mapping (address => address) artistAddressToToken;
    //Artist token   => Artist Address
    mapping (address => address) artistTokenToAddress;
    mapping (address => uint) tokensForSale;
    mapping (address => bool) isTokenInSale;

    mapping (address => uint) pricePerToken;
    mapping (address => uint) artistBalance;
    mapping (address => uint) collectedRoyalties; 

    address contractDeployer;

    constructor() {
        contractDeployer = msg.sender;
    }

    modifier onlyContractDeployer() {
        require(msg.sender == contractDeployer, "Only the contract deployer of this contract can call this function");
        _;
    }

    function CreateSale(address _artistAddress, uint _royaltyPercentage, uint _pricePerToken, uint _percentageArtistKeeps, uint _percentageForLiquidity, string memory _tokenName, string memory _tokenTicker, uint _tokenSupply) public onlyContractDeployer {
        require(artistAddressToToken[_artistAddress] == 0x0000000000000000000000000000000000000000, "Artist token is already created");
        
        ArtistRightsToken artistToken = new ArtistRightsToken(_tokenName, _tokenTicker, _tokenSupply, _royaltyPercentage, address(this));
        address artistTokenAddress = address(artistToken);
        
        artistAddressToToken[_artistAddress] = artistTokenAddress;
        artistTokenToAddress[artistTokenAddress] = _artistAddress;
        isTokenInSale[artistTokenAddress] = true;
        pricePerToken[artistTokenAddress] = _pricePerToken;
        // return 50% of supply to the artist

        uint artistKeeps = artistToken.totalSupply() * _percentageArtistKeeps / 100;
        uint percentageForLiquidity = artistToken.totalSupply() * _percentageForLiquidity / 100;

        uint percentageForSale = 100 - _percentageArtistKeeps - _percentageForLiquidity;

        //set amount of tokens sale to the public
        tokensForSale[artistTokenAddress] = artistToken.totalSupply() * percentageForSale / 100;

        //transfer liquidity pool tokens
        artistToken.transfer(0x1000000000000000000000000000000000000000, percentageForLiquidity, false);
        //transfer artist their tokens
        artistToken.transfer(_artistAddress, artistKeeps, false);
    }

    function BuyArtistTokens(address _tokenAddress) public payable{
        require (isTokenInSale[_tokenAddress] == true, "Token is not for sale");
        
        uint tokenPrice = pricePerToken[_tokenAddress];
        require (msg.value >= tokenPrice, "Token price is greater than native token that has been sent");

        uint amount = tokenPrice * msg.value;
        ArtistRightsToken artistToken = ArtistRightsToken (_tokenAddress);
        require (amount <= artistToken.balanceOf(address(this)), "Not enough tokens to buy");

        artistToken.transfer(msg.sender, amount, false);
    }

    function addRoyalties(uint _amount) public {
        //function to be called by artist tokens only
        require (artistTokenToAddress[msg.sender] != 0x0000000000000000000000000000000000000000, "this function can only be called by artist tokens");
        collectedRoyalties[msg.sender] += _amount;
    }

    //for testing
    function getArtistToken(address _artistAddress) public view returns(address) {
        return artistAddressToToken[_artistAddress];
    }

}