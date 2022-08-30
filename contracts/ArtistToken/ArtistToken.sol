pragma solidity 0.8.15;

import "@lukso/lsp-smart-contracts/contracts/LSP7DigitalAsset/LSP7DigitalAsset.sol";
import "./StakeArtistToken.sol";

contract ArtistToken is LSP7DigitalAsset {
    uint maxSupply;
    address saleContract;
    
    constructor(string memory _tokenName, string memory _tokenSymbol, uint _supply, address _initalRightsSaleAddress, address _owner) LSP7DigitalAsset(_tokenName, _tokenSymbol, _initalRightsSaleAddress, false) {
        saleContract = _initalRightsSaleAddress;
        _mint(_owner, _supply, false, "0x");
        maxSupply = _supply;
    }

}