pragma solidity 0.8.15;

import "./ArtistNft.sol";

contract ArtistNftSaleContract {
    mapping (address => bool) canAddressCreateNfts;
    mapping (address => mapping (uint => address)) nftAddresses;
    mapping (address => uint) nftPrices;

    mapping (address => uint) artistBalances;
    mapping (address => uint) contractBalances;

    address deployer;

    constructor() {
        deployer = msg.sender;
    }

    function CreateSale(uint _releaseId, uint _pricePerNft, uint _percentageArtistKeeps, string memory _nftName, string memory _nftSymbol, string memory _newBaseUri, uint _maxSupply) public {
        require (canAddressCreateNfts[msg.sender] == true, "Your address cannot create an nft");

        ArtistNft artistNFT = new ArtistNft(_nftName, _nftSymbol, _maxSupply);
        nftPrices[address(artistNFT)] = _pricePerNft;
        nftAddresses[msg.sender][_releaseId] = address(artistNFT);
    }

    function MintNft(address _artistAddress, uint _releaseId) public payable {
        //only mint 1 at a time (can change this)
        address nftAddress = nftAddresses[_artistAddress][_releaseId];

        require (msg.value == nftPrices[nftAddress], "incorrect amount of native token sent for purchese of NFT");
        ArtistNft artistNFT = ArtistNft(nftAddress);
        
        //mint nft
        artistBalances[nftAddress] += msg.value/2;
        contractBalances[nftAddress] += msg.value/2;
        artistNFT.mint(msg.sender);
    }

    function SetCanCreateNfts(address _artistAddress, bool _result) public {
        require(msg.sender == deployer, "Only the deployer of this contract can access this function");
        canAddressCreateNfts[_artistAddress] = _result;
    }
}