pragma solidity 0.8.15;

import "../Nft/ArtistNft.sol";  
contract Marketplace {
    //  nft address => IDs listed
    mapping(address => bytes32[]) listedIdsInCollection;
    mapping(address => mapping(bytes32 => address)) nftOwner;
    mapping(address => mapping(bytes32 => uint)) listingPrice;

    event listNftEvent(address indexed nftOwner, address indexed nftAddress, bytes32 indexed nftID, uint listingPrice);
    event buyNftEvent(address indexed buyerAddress, address indexed nftAddress, bytes32 indexed nftID);
    event changeListingPriceEvent(address indexed nftAddress, bytes32 indexed nftID, uint indexed newPrice);
    event deleteListingEvent(address indexed nftOwner, address indexed nftAddress, bytes32 indexed nftID);

    function listNft(address _nftAddress, bytes32 _nftID, uint _listingPrice) public {
        //address must approve this contract with nft collection before calling this function
        LSP8IdentifiableDigitalAsset NFT = LSP8IdentifiableDigitalAsset(_nftAddress);
        
        //SET FALSE
        NFT.transfer(msg.sender, address(this), _nftID, true, "0x");
        nftOwner[_nftAddress][_nftID] = msg.sender;
        listingPrice[_nftAddress][_nftID] = _listingPrice;
        listedIdsInCollection[_nftAddress].push(_nftID);

        emit listNftEvent(msg.sender, _nftAddress, _nftID, _listingPrice);
    }

    function buyNft(address _nftAddress, bytes32 _nftID) public payable {
        ArtistNft NFT = ArtistNft(_nftAddress);
        
        require(NFT.tokenOwnerOf(_nftID) == address(this), "This NFT is not listed on the marketplace");
        require(msg.value == listingPrice[_nftAddress][_nftID],"You have not sent the exact amount to buy this NFT");

        //remove nft as listed on marketplace
        for (uint i = 0; i < listedIdsInCollection[_nftAddress].length; i++) {
            if (listedIdsInCollection[_nftAddress][i] == _nftID) {
                delete listedIdsInCollection[_nftAddress][i];
                break;
            }
        }
        delete nftOwner[_nftAddress][_nftID];
        delete listingPrice[_nftAddress][_nftID];
        //SET FALSE
        NFT.transfer(address(this), msg.sender, _nftID, true, "0x");
        
        uint percentage = NFT.getRoyaltyPercentage() * 100;
        uint fee = msg.value * percentage / 10000;

        payable (NFT.getArtist()).transfer(fee);
    
        emit buyNftEvent(msg.sender, _nftAddress, _nftID);
    }

    function changeListingPrice(address _nftAddress, bytes32 _nftID, uint _newPrice) public {
        require (nftOwner[_nftAddress][_nftID] == msg.sender, "Only the owner of this NFT can change its price");
        listingPrice[_nftAddress][_nftID] = _newPrice;

        emit changeListingPriceEvent(_nftAddress, _nftID, _newPrice);
    }

    function deleteListing(address _nftAddress, bytes32 _nftID) public {
        require (nftOwner[_nftAddress][_nftID] == msg.sender, "Only the owner of this NFT can remove its lisiting");
        
        LSP8IdentifiableDigitalAsset NFT = LSP8IdentifiableDigitalAsset(_nftAddress);
        //SET FALSE
        NFT.transfer(address(this), msg.sender, _nftID, true, "0x");

        //remove nft as listed on marketplace
        for (uint i = 0; i < listedIdsInCollection[_nftAddress].length; i++) {
            if (listedIdsInCollection[_nftAddress][i] == _nftID) {
                delete listedIdsInCollection[_nftAddress][i];
                break;
            }
        }
        emit deleteListingEvent(nftOwner[_nftAddress][_nftID], _nftAddress, _nftID);

        delete nftOwner[_nftAddress][_nftID];
        delete listingPrice[_nftAddress][_nftID];
    }

    //for testing
    function getListedIdsInCollection(address _nftAddress) public view returns(bytes32[] memory){
        return(listedIdsInCollection[_nftAddress]);
    }

    function getNftOwner(address _nftAddress, bytes32 _nftID) public view returns(address) {
        return nftOwner[_nftAddress][_nftID];
    }

    function getListingPrice(address _nftAddress, bytes32 _nftID) public view returns(uint) {
        return listingPrice[_nftAddress][_nftID];
    }
}