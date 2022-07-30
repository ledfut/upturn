pragma solidity 0.8.15;

import "@lukso/lsp-smart-contracts/contracts/LSP7DigitalAsset/LSP7DigitalAsset.sol";

contract ArtistRightsToken is LSP7DigitalAsset {
    uint royaltyPercentage;
    uint maxSupply;

    address saleContract;

    mapping(address => uint) collectedRoyalties;
    mapping(address => uint) holdersIndex;

    constructor(string memory _tokenName, string memory _tokenSymbol, uint _supply, uint _royaltyPercentage, address _initalRightsSaleAddress) LSP7DigitalAsset(_tokenName, _tokenSymbol, _initalRightsSaleAddress, false) {
        //SET TO FALSE
        royaltyPercentage = _royaltyPercentage;
        saleContract = _initalRightsSaleAddress;
        maxSupply = _supply;
    }

    function transfer(address _receiverAddress, uint _amount, bool _royaltiesEnabled) public {
        _transfer(msg.sender, _receiverAddress, _amount, true, "0x");
    }

    function mint() public {
        require(msg.sender == saleContract, "Only the sales contract can call this function");
        _mint(msg.sender, maxSupply, true, "0x");
    }
}