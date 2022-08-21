pragma solidity 0.8.15;

import "@lukso/lsp-smart-contracts/contracts/LSP8IdentifiableDigitalAsset/LSP8IdentifiableDigitalAsset.sol";

contract ArtistNft is LSP8IdentifiableDigitalAsset {
    bool allowedToMint;
    address deployer;
    address artist;
    uint maxSupply;
    uint royaltyPercentage;

    constructor(string memory _name, string memory _symbol, uint _maxSupply, uint _royaltyPercentage, address _artist, bytes32 _dataKey, bytes memory _value) LSP8IdentifiableDigitalAsset(_name, _symbol, msg.sender) {
        allowedToMint = true;
        deployer = msg.sender;
        maxSupply = _maxSupply;
        royaltyPercentage = _royaltyPercentage;
        artist = _artist;
        setData(_dataKey, _value);
    }

    function mint(address _to) public {
        require(allowedToMint == true, "Nft is not allowed to be minted");

        _mint(_to, bytes32(totalSupply()), true, "0x");
        
        if (totalSupply() >= maxSupply) {
            allowedToMint = false;
        }
    }

    function getRoyaltyPercentage() public view returns(uint) {
        return royaltyPercentage;
    }

    function getArtist() public view returns(address) {
        return artist;
    }
}