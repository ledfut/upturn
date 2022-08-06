const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { balance, expectRevert} = require("@openzeppelin/test-helpers");
// NEED TO UPDATE FOR PROFILES INSTEAD OF ADDRESSES
describe("Artist rights token functionality", async() => {
    let ArtistToken;
    let ArtistTokenSale;
    let Exchange;

    let acc1, acc2, acc3;
    beforeEach(async() => {
        [acc1, acc2, acc3] = await ethers.getSigners();

        const ArtistTokenSaleContract = await ethers.getContractFactory("InitalRightsSale");
        const ArtistTokenSaleDeploy = await ArtistTokenSaleContract.deploy();
        ArtistTokenSale = await ArtistTokenSaleDeploy.deployed();
        
        const ArtistTokenContract = await ethers.getContractFactory("ArtistRightsToken");
        const ArtistTokenDeploy = await ArtistTokenContract.deploy("name", "ticker", 1000, ArtistTokenSale.address);
        ArtistToken = await ArtistTokenDeploy.deployed();

        const ExchangeContract = await ethers.getContractFactory("Exchange");
        const ExchangeDeploy = await ExchangeContract.deploy(ArtistToken.address, acc1.address);
        Exchange = await ExchangeDeploy.deployed();  
    })

    it("should allow the sales contract to mint tokens", async() => {
        let BalOfSalesBefore = await ArtistToken.balanceOf(ArtistTokenSale.address);
        
        await ArtistTokenSale.CreateSale(acc1.address, ArtistToken.address, Exchange.address, 1, 50, 25);
        let BalOfSalesAfter = await ArtistToken.balanceOf(ArtistTokenSale.address);

        expect(BalOfSalesAfter).to.be.greaterThan(BalOfSalesBefore);
    })
    
    it("SHOULD NOT allow anyone but the sales contract to mint tokens", async() => {
        await expectRevert(
            ArtistToken.mint(),
            "Only the sales contract can call this function"
        )
        await expectRevert(
            ArtistToken.connect(acc1).mint(),
            "Only the sales contract can call this function"
        )
    })

    it("should allow an address to transfer funds to another address", async() => {
        await ArtistTokenSale.CreateSale(acc1.address, ArtistToken.address, Exchange.address, 1, 50, 25);
        
        let balOfAcc1Before = await ArtistToken.balanceOf(acc1.address);
        let balOfAcc2Before = await ArtistToken.balanceOf(acc2.address);
        await ArtistToken.connect(acc1).transfer(acc1.address, acc2.address, 10, true, "0x");

        let balOfAcc1After = await ArtistToken.balanceOf(acc1.address);
        let balOfAcc2After = await ArtistToken.balanceOf(acc2.address);

        expect (balOfAcc1After).to.be.lessThan(balOfAcc1Before)
        expect (balOfAcc2After).to.be.greaterThan(balOfAcc2Before)
    })

    it("SHOULD NOT allow an address to transfer funds that they haven't been approved to transfer", async() => {
        await ArtistTokenSale.CreateSale(acc1.address, ArtistToken.address, Exchange.address, 1, 50, 25);

        await expectRevert(
            ArtistToken.connect(acc2).transfer(acc1.address, acc2.address, 10, true, "0x"),
            "LSP7AmountExceedsAuthorizedAmount"
        )
    })

    it("should allow an address to burn tokens they own", async() => {
        await ArtistTokenSale.CreateSale(acc1.address, ArtistToken.address, Exchange.address, 1, 50, 25);
        
        let balBefore = await ArtistToken.balanceOf(acc1.address);
        await ArtistToken.connect(acc1).burn(acc1.address, 10);
        let balAfter = await ArtistToken.balanceOf(acc1.address);
        
        expect(balAfter).to.be.lessThan(balBefore);
    })

    it("SHOULD NOT allow an address to burn tokens that they do not own or are authorized to burn", async() => {
        await ArtistTokenSale.CreateSale(acc1.address, ArtistToken.address, Exchange.address, 1, 50, 25);

        await expectRevert(
            ArtistToken.connect(acc2).burn(acc1.address, 10),
            "LSP7AmountExceedsAuthorizedAmount"
        )
    })

    it("should allow an address to burn tokens that where authoized to", async() => {
        await ArtistTokenSale.CreateSale(acc1.address, ArtistToken.address, Exchange.address, 1, 50, 25);
        await ArtistToken.connect(acc1).authorizeOperator(acc2.address, 10);
        
        let balBefore = await ArtistToken.balanceOf(acc1.address);
        await ArtistToken.burn(acc1.address, 10);
        let balAfter = await ArtistToken.balanceOf(acc1.address);

        expect(balAfter).to.be.lessThan(balBefore);
    })

})