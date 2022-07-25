const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { balance, expectRevert} = require("@openzeppelin/test-helpers");
// NEED TO UPDATE FOR PROFILES INSTEAD OF ADDRESSES
describe("Marketplace functionality", async() => {
    let Marketplace;
    let ArtistNft;

    let acc1, acc2, acc3;
    
    beforeEach(async() => {
        [acc1, acc2, acc3] = await ethers.getSigners();

        const MarketplaceContract = await ethers.getContractFactory("Marketplace");
        const MarketplaceDeploy = await MarketplaceContract.deploy();
        Marketplace = await MarketplaceDeploy.deployed();

        const ArtistNftContract = await ethers.getContractFactory("ArtistNft");
        const ArtistNftDeploy = await ArtistNftContract.deploy("artistNft", "ANFT", 1000);
        ArtistNft = await ArtistNftDeploy.deployed();
       
        await ArtistNft.mint(acc1.address);
    })
    
    it("should be able to list nft with the correct details", async() => {
         await ArtistNft.authorizeOperator(Marketplace.address, ethers.utils.formatBytes32String(0));
         await Marketplace.connect(acc1).listNft(ArtistNft.address, ethers.utils.formatBytes32String(0), 20);

         let priceResult = await Marketplace.getListingPrice(ArtistNft.address, ethers.utils.formatBytes32String(0));
         expect(priceResult).to.equal(20);

         let ownerResult = await Marketplace.getNftOwner(ArtistNft.address, ethers.utils.formatBytes32String(0));
         expect(ownerResult).to.equal(acc1.address);

         let listedIdResults = await Marketplace.getListedIdsInCollection(ArtistNft.address);
         expect(listedIdResults[0]).to.equal(ethers.utils.formatBytes32String(0));
    })  
    it("should be able to delete a listing of nft and expect previous data held about the listing to be removed", async() => {
        await ArtistNft.authorizeOperator(Marketplace.address, ethers.utils.formatBytes32String(0));
        await Marketplace.connect(acc1).listNft(ArtistNft.address, ethers.utils.formatBytes32String(0), 20);
        await Marketplace.connect(acc1).deleteListing(ArtistNft.address, ethers.utils.formatBytes32String(0)); 
        
        let priceResult = await Marketplace.getListingPrice(ArtistNft.address, ethers.utils.formatBytes32String(0));
        expect(priceResult).to.equal(0);

        let ownerResult = await Marketplace.getNftOwner(ArtistNft.address, ethers.utils.formatBytes32String(0));
        expect(ownerResult).to.equal("0x0000000000000000000000000000000000000000"); 

        let listedIdResults = await Marketplace.getListedIdsInCollection(ArtistNft.address);
        expect(listedIdResults[0]).to.equal(ethers.utils.formatBytes32String(0));
    })  
    it("SHOULD NOT allow a user that isn't an owner of a certain nft to remove that nft from listing", async() => {
        await ArtistNft.authorizeOperator(Marketplace.address, ethers.utils.formatBytes32String(0));
        await Marketplace.connect(acc1).listNft(ArtistNft.address, ethers.utils.formatBytes32String(0), 20);
        await expectRevert(
            Marketplace.connect(acc2).deleteListing(ArtistNft.address, ethers.utils.formatBytes32String(0)),
            "Only the owner of this NFT can remove its lisiting"
        )
    })

    it("should allow an owner of a listed nft to change its listing price", async() => {
        await ArtistNft.authorizeOperator(Marketplace.address, ethers.utils.formatBytes32String(0));
        await Marketplace.connect(acc1).listNft(ArtistNft.address, ethers.utils.formatBytes32String(0), 20);
        await Marketplace.connect(acc1).changeListingPrice(ArtistNft.address, ethers.utils.formatBytes32String(0), 10);

        let priceResult = await Marketplace.getListingPrice(ArtistNft.address, ethers.utils.formatBytes32String(0));
        expect(priceResult).to.equal(10);
    })

    it("SHOULD NOT allow an address that is not the owner of a listed nft to change its listing price", async() => {
        await ArtistNft.authorizeOperator(Marketplace.address, ethers.utils.formatBytes32String(0));
        await Marketplace.connect(acc1).listNft(ArtistNft.address, ethers.utils.formatBytes32String(0), 20);
        await expectRevert(
            Marketplace.connect(acc2).changeListingPrice(ArtistNft.address, ethers.utils.formatBytes32String(0), 10),
            "Only the owner of this NFT can change its price"
        )
    })

    it("should allow a user that sends the correct amount of native currency for a listed nft to buy it and transfer it to their account, as well as remove the listing after it has been been purchesed", async() => {
        await ArtistNft.authorizeOperator(Marketplace.address, ethers.utils.formatBytes32String(0));
        await Marketplace.connect(acc1).listNft(ArtistNft.address, ethers.utils.formatBytes32String(0), 20);
        await Marketplace.connect(acc2).buyNft(ArtistNft.address, ethers.utils.formatBytes32String(0), {value: 20});

        let nftOwnerFromNftContract = await ArtistNft.tokenOwnerOf(ethers.utils.formatBytes32String(0));
        expect(nftOwnerFromNftContract).to.equal(acc2.address);

        let nftOwnerFromMarketplaceContract = await Marketplace.getNftOwner(ArtistNft.address, ethers.utils.formatBytes32String(0));
        expect(nftOwnerFromMarketplaceContract).to.equal("0x0000000000000000000000000000000000000000");

        let nftListingPrice = await Marketplace.getListingPrice(ArtistNft.address, ethers.utils.formatBytes32String(0));
        expect(nftListingPrice).to.equal(0)
    })

    it("SHOULD NOT allow a user to buy an NFT with the wrong amount of native token sent", async() => {
        await ArtistNft.authorizeOperator(Marketplace.address, ethers.utils.formatBytes32String(0));
        await Marketplace.connect(acc1).listNft(ArtistNft.address, ethers.utils.formatBytes32String(0), 20);
        
        //too low
        await expectRevert(
            Marketplace.connect(acc2).buyNft(ArtistNft.address, ethers.utils.formatBytes32String(0), {value: 19}),
            "You have not sent the exact amount to buy this NFT"
        )
        
        //too high
        await expectRevert(
            Marketplace.connect(acc2).buyNft(ArtistNft.address, ethers.utils.formatBytes32String(0), {value: 21}),
            "You have not sent the exact amount to buy this NFT"
        )
    })
})