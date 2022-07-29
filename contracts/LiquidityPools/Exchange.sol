pragma solidity 0.8.15;

import "@lukso/lsp-smart-contracts/contracts/LSP7DigitalAsset/LSP7DigitalAsset.sol";

contract Exchange {
    address tokenAddress;
    address artistAddress;

    address deployer;

    uint nativeTokenBalance;
    uint tokenBalance;
    uint deployedTime;
    uint claimTimeLimit = 2592000; //1 month
    uint artistClaimedAmount = 0;
    uint claimAmount = 10;

    constructor (address _tokenAddress, address _artistAddress) {
        deployer = msg.sender;
        tokenAddress = _tokenAddress;
        artistAddress = _artistAddress;
        deployedTime = block.timestamp;
    }

    receive() external payable {nativeTokenBalance += msg.value;}

    function addLiquidity(uint _tokenAmount) public payable {
        //this contract must be approved to spend tokens before calling this function
       LSP7DigitalAsset Token = LSP7DigitalAsset(tokenAddress);
       
       nativeTokenBalance += msg.value;
       tokenBalance += _tokenAmount;
       //SET FALSE
       Token.transfer(msg.sender, address(this), _tokenAmount, true, "0x");
    }

    function nativeToTokenSwap() public payable returns (uint) {
        LSP7DigitalAsset Token = LSP7DigitalAsset(tokenAddress);

        uint invariant = nativeTokenBalance * tokenBalance;
        nativeTokenBalance += msg.value;
        uint tokenBalDifference = invariant / nativeTokenBalance;
        uint tokensOut = tokenBalance - tokenBalDifference;
        tokenBalance -= tokensOut;
        
        //SET FALSE
        Token.transfer(address(this), msg.sender, tokensOut, true, "0x");
        return (tokensOut);
    }

    function nativeToTokenSwapNonPayable(uint _nativeAmount) public returns (uint) {
        LSP7DigitalAsset Token = LSP7DigitalAsset(tokenAddress);

        uint invariant = nativeTokenBalance * tokenBalance;
        nativeTokenBalance += _nativeAmount;
        uint tokenBalDifference = invariant / nativeTokenBalance;
        uint tokensOut = tokenBalance - tokenBalDifference;
        tokenBalance -= tokensOut;
        
        //SET FALSE
        Token.transfer(address(this), msg.sender, tokensOut, true, "0x");
        return (tokensOut);
    }

    function tokenToNativeSwap(uint _tokenAmount) public returns (uint){
        //user must approve this contract and token amount before calling this function
        LSP7DigitalAsset Token = LSP7DigitalAsset(tokenAddress);

        //SET FALSE
        Token.transfer(msg.sender, address(this), _tokenAmount, true, "0x");

        uint invariant = nativeTokenBalance * tokenBalance;
        tokenBalance += _tokenAmount;
        uint nativeBalDifference = invariant / tokenBalance;
        uint nativeOut = nativeTokenBalance - nativeBalDifference;

        nativeTokenBalance -= nativeOut;

        payable(msg.sender).transfer(nativeOut);
        return (nativeOut);
    }

    function artistClaim() public {
        require(msg.sender == artistAddress, "Only the artist can call this function");
        uint time = block.timestamp - deployedTime;

        // always rounds down
        uint claimMultiplyer = deployedTime / claimTimeLimit;
        uint claimAmount = claimMultiplyer * claimAmount;

        LSP7DigitalAsset(tokenAddress).transfer(address(this), artistAddress, claimAmount, true, "0x");
    }

    function getNativeTokenBalance() public view returns(uint) {
        return nativeTokenBalance;
    }

    function getTokenBalance() public view returns(uint) {
        return tokenBalance;
    }
}