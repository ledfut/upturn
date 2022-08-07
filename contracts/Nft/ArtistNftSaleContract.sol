pragma solidity 0.8.15;

import "./ArtistNft.sol";

contract ArtistNftSaleContract {
    mapping (address => bool) canAddressCreateNfts;
    //artist address => nft sale id =>  sale info
    mapping (address => mapping(uint => Sale)) sales;
    mapping (address => uint) lastSaleId;
    mapping (address => uint) artistBalance;
    uint contractBalance;

    event CreateSaleEvent(address indexed artistAddress, uint indexed saleId);
    event StartSaleEvent(address indexed artistAddress, uint indexed saleId);
    event StopSaleEvent(address indexed artistAddress, uint indexed saleId);
    event MintNftEvent(address indexed artistAddress, uint indexed saleId, address indexed buyerAddress);

    struct Sale {
        address nftAddress;
        uint nftPrice;
        bool isInSale;
    }

    address deployer;

    constructor() {
        deployer = msg.sender;
    }

    function CreateSale(uint _pricePerNft, string memory _nftName, string memory _nftSymbol, uint _maxSupply, bytes32 _dataKey, bytes memory _value) public {
        require (canAddressCreateNfts[msg.sender] == true, "Only approved addresses can create nfts");
        
        lastSaleId[msg.sender]++;
        ArtistNft artistNFT = new ArtistNft(_nftName, _nftSymbol, _maxSupply, _dataKey, _value);
        sales[msg.sender][lastSaleId[msg.sender]].nftPrice = _pricePerNft;
        sales[msg.sender][lastSaleId[msg.sender]].nftAddress = address(artistNFT);

        canAddressCreateNfts[msg.sender] = false;

        emit CreateSaleEvent(msg.sender, lastSaleId[msg.sender]);

        address(this).delegatecall(abi.encodeWithSignature("StartSale(uint256)",lastSaleId[msg.sender]));
    }

    function StartSale(uint _saleId) public {
        sales[msg.sender][_saleId].isInSale = true;

        emit StartSaleEvent(msg.sender, _saleId);
    }

    function StopSale(uint _saleId) public {
        sales[msg.sender][_saleId].isInSale = false;

        emit StopSaleEvent(msg.sender, _saleId);
    }

    function MintNft(address _artistAddress, uint _saleId) public payable {
        require (sales[_artistAddress][_saleId].isInSale == true, "This nft is not for sale right now");
        require (msg.value == sales[_artistAddress][_saleId].nftPrice, "incorrect amount of native token sent for purchese of NFT");
        
        address nftAddress = sales[_artistAddress][_saleId].nftAddress;
        ArtistNft artistNFT = ArtistNft(nftAddress);
        
        //mint nft
        artistBalance[_artistAddress] += msg.value/2;
        contractBalance += msg.value/2;
        artistNFT.mint(msg.sender);

        emit MintNftEvent(_artistAddress, _saleId, msg.sender);
    }

    function SetAddressToCreateNFT(address _artistAddress, bool _result) public {
        require(msg.sender == deployer, "Only the deployer of this contract can access this function");
        canAddressCreateNfts[_artistAddress] = _result;
    }
    
    function getCanNftCreateSale(address _address) public view returns(bool) {
        return canAddressCreateNfts[_address];
    }
    function getSaleInfo(address _artistAddress, uint _saleId) public view returns(Sale memory) {
        return sales[_artistAddress][_saleId];
    }
}