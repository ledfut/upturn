const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { balance, expectRevert} = require("@openzeppelin/test-helpers");
// NEED TO UPDATE FOR PROFILES INSTEAD OF ADDRESSES
describe("Artist rights token functionality", async() => {
    let ArtistToken;
    let ArtistTokenSale;

    let acc1, acc2, acc3;
    beforeEach(async() => {
        [acc1, acc2, acc3] = await ethers.getSigners();

        const ArtistTokenSaleContract = await ethers.getContractFactory("InitalRightsSale");
        const ArtistTokenSaleDeploy = await ArtistTokenSaleContract.deploy();
        ArtistTokenSale = await ArtistTokenSaleDeploy.deployed();
    
        const ArtistTokenContract = await ethers.getContractFactory("ArtistRightsToken");
        await ArtistTokenSale.CreateSale(acc1.address, 1, 1, 50, 25, "artist name", "artist ticker", 1000);
        ArtistToken = await ArtistTokenContract.attach(ArtistTokenSale.getArtistToken(acc1.address));

    })

    it("should set royalties for each user that is holding the token based on how many tokens they have", async() => {
       //await ArtistToken.connect(acc1).transfer(acc2.address, 200, true);
       //let royalties = await ArtistToken.getUsersUnclaimedRoyalties(acc2.address);
       //console.log("royalty: " + royalties);

       let balance = await ArtistToken.balanceOf(acc1.address);
       console.log("bal: " + balance)

       console.log("results: " + await ArtistToken.transferTokens())
        //await ArtistToken.connect(acc1).transferTokens(acc2.address, 200, true);
    })
})