pragma solidity 0.8.15;

import "@lukso/lsp-smart-contracts/contracts/LSP8IdentifiableDigitalAsset/LSP8IdentifiableDigitalAsset.sol";

contract ArtistNft is LSP8IdentifiableDigitalAsset {
    bool allowedToMint;
    address deployer;
    uint maxSupply;

    constructor(string memory _name, string memory _symbol, uint _maxSupply) LSP8IdentifiableDigitalAsset(_name, _symbol, msg.sender) {
        allowedToMint = true;
        deployer = msg.sender;
        maxSupply = _maxSupply;
    }

    function mint(address _to) public {
        require(allowedToMint == true, "Nft is not allowed to be minted");
        _mint(_to, bytes32(totalSupply()), true, "0x");
        
        if (totalSupply() >= maxSupply) {
            allowedToMint = false;
        }
    }
}