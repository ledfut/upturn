const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { balance, expectRevert} = require("@openzeppelin/test-helpers");
// NEED TO UPDATE FOR PROFILES INSTEAD OF ADDRESSES
describe.only("Artist rights token sale functionality", async() => {
    let ArtistTokenContract
    let ArtistTokenSale;

    let acc1, acc2, acc3;

    beforeEach(async() => {
        [acc1, acc2, acc3] = await ethers.getSigners();
        
        const ArtistTokenSaleContract = await ethers.getContractFactory("InitalRightsSale");
        const ArtistTokenSaleDeploy = await ArtistTokenSaleContract.deploy();
       // ArtistTokenSale = await ArtistTokenSaleDeploy.deployed();
    //
       // ArtistTokenContract = await ethers.getContractFactory("ArtistRightsToken");
    })

    it.only("should create artist token through create sale by checking balance. As well checking if the right about of balances was sent to addresses", async() => {
       //await ArtistTokenSale.CreateSale(acc1.address, 1, 1, 50, 25, "artist name", "artist ticker", 1000);

       //let ArtistToken = await ArtistTokenContract.attach(ArtistTokenSale.getArtistToken(acc1.address));

       //let balanceOfSalesContract = await ArtistToken.balanceOf(ArtistTokenSale.address);
       //let balanceOfArtist = await ArtistToken.balanceOf(acc1.address);

       //expect(balanceOfSalesContract).to.equal(250);
       //expect(balanceOfArtist).to.equal(500);
    })

    it("should allow a user to buy an artist token depending on how many native tokens they send", async() => {
        await ArtistTokenSale.CreateSale(acc1.address, 1, 1, 50, 25, "artist name", "artist ticker", 1000);

        let ArtistToken = await ArtistTokenContract.attach(ArtistTokenSale.getArtistToken(acc1.address));
        await ArtistTokenSale.connect(acc2).BuyArtistTokens(ArtistToken.address, {value: 25})

        let balanceOfAcc2 = await ArtistToken.balanceOf(acc2.address);
        expect(balanceOfAcc2).to.equal(25);
    })
})