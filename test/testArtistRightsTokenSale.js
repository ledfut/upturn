const { expect } = require("chai");
const { ethers, waffle, network, hre } = require("hardhat");
const { balance, expectRevert} = require("@openzeppelin/test-helpers");
// NEED TO UPDATE FOR PROFILES INSTEAD OF ADDRESSES
describe("Artist rights token sale functionality", async() => {
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

    it("should return addresses for artist token and artist token exchange to not be a 0 address", async() => {
        await ArtistTokenSale.CreateSale(acc1.address, ArtistToken.address, Exchange.address, 1, 50, 25);
        const saleInfo = await ArtistTokenSale.getSaleInfo(acc1.address);
        expect(saleInfo[0]).to.equal(ArtistToken.address);
        //artist token exchange address
        expect(saleInfo[1]).to.equal(Exchange.address);
        //price for tokens
        expect(saleInfo[2]).to.equal(1);
        //is token for sale bool
        expect(saleInfo[3]).to.equal(true);
        //amount of tokens for liquidity
        expect(saleInfo[4]).to.equal(250);
        //amount of tokens for the artist
        expect(saleInfo[5]).to.equal(500);
        //amount of tokens for sale
        expect(saleInfo[6]).to.equal(250);
        //amount of native tokens for liquidity
        expect(saleInfo[7]).to.equal(250);
        //tokens for rico
        expect(saleInfo[8]).to.equal(250);
        //rico interval
        expect(saleInfo[10]).to.equal(2630000);
        //rico claim per interval
        expect(saleInfo[11]).to.equal(9);
    })

    it("should set token for sale bool to true once artist creates sale", async() => {
        await ArtistTokenSale.CreateSale(acc1.address, ArtistToken.address, Exchange.address, 1, 50, 25);

        const saleInfo = await ArtistTokenSale.getSaleInfo(acc1.address);
        expect(saleInfo[3]).to.equal(true);
    })

    it ("should set token for sale bool to false once artist disallows sales of token", async() => {
        await ArtistTokenSale.CreateSale(acc1.address, ArtistToken.address, Exchange.address, 1, 50, 25);
        await ArtistTokenSale.connect(acc1).StopSale();

        const saleInfo = await ArtistTokenSale.getSaleInfo(acc1.address);
        expect(saleInfo[3]).to.equal(false);
    })

    it("SHOULD NOT allow an address that has already set their token for sale to be able to set it for sale again", async() => {
        await ArtistTokenSale.CreateSale(acc1.address, ArtistToken.address, Exchange.address, 1, 50, 25);

        await expectRevert(
            ArtistTokenSale.connect(acc1).StartSale(),
            "Artist Token must not be in sale"
        )
    })

    it("SHOULD NOT allow an address that has their artist token not for sale to be able to set it for not for sale", async() => {
        await ArtistTokenSale.CreateSale(acc1.address, ArtistToken.address, Exchange.address, 1, 50, 25);
        await ArtistTokenSale.connect(acc1).StopSale();

        await expectRevert(
            ArtistTokenSale.connect(acc1).StopSale(),
            "Artist Token must be in sale"
        )
    })

    it("balance of the artist should be the correct amount based on the percentage inputted", async() => {
        await ArtistTokenSale.CreateSale(acc1.address, ArtistToken.address, Exchange.address, 1, 50, 25);
        let balanceOfAcc1  = await ArtistToken.balanceOf(acc1.address);
        expect(balanceOfAcc1).to.equal(250)
    })

    it("should allow an address to buy tokens if enough native tokens was sent and token for sale bool is set to true", async() => {
        await ArtistTokenSale.CreateSale(acc1.address, ArtistToken.address, Exchange.address, 1, 50, 25);
        await ArtistTokenSale.connect(acc2).BuyArtistTokens(acc1.address, {value: 100});
        let balanceOfAcc2 = await ArtistToken.balanceOf(acc2.address);
        expect(balanceOfAcc2).to.equal(100);
    })

    it("SHOULD NOT allow an address to buy tokens if not enough native tokens was sent", async() => {
        await ArtistTokenSale.CreateSale(acc1.address, ArtistToken.address, Exchange.address, 10, 50, 25);
        await expectRevert( 
            ArtistTokenSale.connect(acc2).BuyArtistTokens(acc1.address, {value: 1}),
            "Token price is greater than native token that has been sent")
    })

    it("SHOULD NOT allow the user to attempt to buy tokens if all tokens where bought as well as turning sale bool to false", async() => {
        await ArtistTokenSale.CreateSale(acc1.address, ArtistToken.address, Exchange.address, 1, 50, 25);
        await ArtistTokenSale.connect(acc2).BuyArtistTokens(acc1.address, {value: 250});
        
        const saleInfo = await ArtistTokenSale.getSaleInfo(acc1.address);
        expect(saleInfo[3]).to.equal(false);

        await expectRevert(
            ArtistTokenSale.connect(acc3).BuyArtistTokens(acc1.address, {value: 1}),
            "Token is currently not for sale"
        )
    })

    it("should allow acc1 balance to increase only after the correct time has passed and only allow to claim again once that time has passed again", async() => {
        await ArtistTokenSale.CreateSale(acc1.address, ArtistToken.address, Exchange.address, 1, 50, 25);
        
        let bal1 = await ArtistToken.balanceOf(acc1.address);
        await network.provider.send("evm_increaseTime", [2630000])
        await network.provider.send("evm_mine")
        
        await ArtistTokenSale.connect(acc1).ArtistClaim();

        let bal2 = await ArtistToken.balanceOf(acc1.address);
        await ArtistTokenSale.connect(acc1).ArtistClaim();
        let bal3 = await ArtistToken.balanceOf(acc1.address);

        expect(bal1).to.be.lessThan(bal2);
        expect(bal2).to.equal(bal3);

        await network.provider.send("evm_increaseTime", [5260000])
        await network.provider.send("evm_mine")
  
        await ArtistTokenSale.connect(acc1).ArtistClaim();
        let bal4 = await ArtistToken.balanceOf(acc1.address);

        expect(bal3).to.be.lessThan(bal4);
    })

    it("should allow an address to return tokens", async() => {
        await ArtistTokenSale.CreateSale(acc1.address, ArtistToken.address, Exchange.address, 1, 50, 25);
        
        await ArtistTokenSale.connect(acc2).BuyArtistTokens(acc1.address, {value:100})
        let tokenBal1 = await ArtistToken.balanceOf(acc2.address);
        let saleNativeBal1 = await waffle.provider.getBalance(ArtistTokenSale.address);

        await ArtistToken.connect(acc2).authorizeOperator(ArtistTokenSale.address, 100);
        await ArtistTokenSale.connect(acc2).ReturnTokens(acc1.address, 100);
    
        let tokenBal2 = await ArtistToken.balanceOf(acc2.address);
        let saleNativeBal2 = await waffle.provider.getBalance(ArtistTokenSale.address);

        //expect(tokenBal2).to.be.lessThan(tokenBal1);
        expect(saleNativeBal2).to.be.lessThan(saleNativeBal1);
    })

})