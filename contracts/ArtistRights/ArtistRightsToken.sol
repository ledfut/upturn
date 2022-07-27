pragma solidity 0.8.15;

import "@lukso/lsp-smart-contracts/contracts/LSP7DigitalAsset/LSP7DigitalAsset.sol";
import "./InitalRightsSale.sol";

contract ArtistRightsToken is LSP7DigitalAsset {
    uint royaltyPercentage;

    address saleContract;
    address[] public holders;

    mapping(address => uint) collectedRoyalties;
    mapping(address => uint) holdersIndex;

    constructor(string memory _tokenName, string memory _tokenSymbol, uint _supply, uint _royaltyPercentage, address _initalRightsSaleAddress) LSP7DigitalAsset(_tokenName, _tokenSymbol, _initalRightsSaleAddress, false) {
        //SET TO FALSE
        _mint(_initalRightsSaleAddress, _supply, true, "0x");
        royaltyPercentage = _royaltyPercentage;
        saleContract = msg.sender;

        holders.push(saleContract);
    }

    function transfer(address _receiverAddress, uint _amount, bool _royaltiesEnabled) public {
        if (_royaltiesEnabled == false) {
            require(msg.sender == saleContract || msg.sender == address(this), "Only sale contract can disable royalties");
            //SET TO FALSE
            if (balanceOf(_receiverAddress) == 0) {
                holders.push(_receiverAddress);
            }

            _transfer(msg.sender, _receiverAddress, _amount, true, "0x");
        }
        else {
            uint percentage = royaltyPercentage * 100;
            uint royaltiesToCollect = (_amount / 1000) * percentage;
            uint amountForReceiver = _amount - royaltiesToCollect;

            setRoyaltyForAddresses();

            if (balanceOf(_receiverAddress) == 0) {
                holdersIndex[_receiverAddress] = holders.length;
                holders.push(_receiverAddress);
            }
            //SET TO FALSE
            _transfer(msg.sender, _receiverAddress, amountForReceiver, true, "0x");
        }

        if (balanceOf(msg.sender) == 0) {
            //remove user with 0 balance
            //move the rest of the array down so the length of the array is correct
            for (uint i = holdersIndex[msg.sender]; i < holders.length - 1; i++) {
                holders[i] = holders[i + 1];
            }
            holders.pop();
        }
    }

    //test if lukso blockchain can handle doing this with a lot of addresses
    function setRoyaltyForAddresses() private {
        for (uint i = 0; i < holders.length; i++) {

            uint userPercent = balanceOf(msg.sender) / totalSupply() * 100;
            uint percentage = userPercent * 100;
            uint royaltyForUser = totalSupply() * percentage / 10000;
            collectedRoyalties[holders[i]] += royaltyForUser;
        }
    }

    function collectRoyalties() public {
        require(collectedRoyalties[msg.sender] > 0, "You have no royalties to collect");

        uint sendAmount = collectedRoyalties[msg.sender];
        collectedRoyalties[msg.sender] = 0;
        transfer(msg.sender, sendAmount, false);
    }

    function getUsersUnclaimedRoyalties(address _address) public returns (uint){
        return collectedRoyalties[_address];
    }
}