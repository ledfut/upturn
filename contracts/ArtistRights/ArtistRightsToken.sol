pragma solidity 0.8.15;

import "@lukso/lsp-smart-contracts/contracts/LSP7DigitalAsset/LSP7DigitalAsset.sol";
import "./StakeArtistToken.sol";

contract ArtistRightsToken is LSP7DigitalAsset {
    uint maxSupply;
    address saleContract;
    
    constructor(string memory _tokenName, string memory _tokenSymbol, uint _supply, address _initalRightsSaleAddress) LSP7DigitalAsset(_tokenName, _tokenSymbol, _initalRightsSaleAddress, false) {
        //SET TO FALSE
        saleContract = _initalRightsSaleAddress;
        maxSupply = _supply;
    }

    function mint() public {
        require(msg.sender == saleContract, "Only the sales contract can call this function");
        _mint(msg.sender, maxSupply, true, "0x");
    }

    function burn(address _from, uint _amount) public {
        _burn(_from, _amount, "0x");
    }

}