const { expect } = require("chai");
const { ethers, waffle, network, hre } = require("hardhat");
const { balance, expectRevert} = require("@openzeppelin/test-helpers");
const { LSPFactory } = require("@lukso/lsp-factory.js")
// NEED TO UPDATE FOR PROFILES INSTEAD OF ADDRESSES
describe.only("Artist rights token sale functionality", async() => {
    let ArtistToken;
    let ArtistTokenSale;
    let Exchange;

    let acc1, acc2, acc3;

    const oneDay = 86400;
    const oneMonth = 2630000;

    const pricePerToken = 1000;
    const percentageForArtist = 50;
    const percentageForLiquidity = 25;
    const percentageOfCommitedFunds = 15;
    const intervalLenth = oneMonth;
    const intervalTotalLength = 8;

    beforeEach(async() => {
        [acc1, acc2, acc3] = await ethers.getSigners();

        const ArtistTokenSaleContract = await ethers.getContractFactory("InitialRightsSale");
        const ArtistTokenSaleDeploy = await ArtistTokenSaleContract.deploy();
        ArtistTokenSale = await ArtistTokenSaleDeploy.deployed();
        
        const ArtistTokenContract = await ethers.getContractFactory("ArtistRightsToken");
        const ArtistTokenDeploy = await ArtistTokenContract.deploy("name", "ticker", 1000, ArtistTokenSale.address);
        ArtistToken = await ArtistTokenDeploy.deployed();

        const ExchangeContract = await ethers.getContractFactory("Exchange");
        const ExchangeDeploy = await ExchangeContract.deploy(ArtistToken.address, acc1.address);
        Exchange = await ExchangeDeploy.deployed();

        await ArtistTokenSale.CreateSale(acc1.address, 
                                         ArtistToken.address, 
                                         Exchange.address, 
                                         pricePerToken, 
                                         percentageForArtist, 
                                         percentageForLiquidity, 
                                         percentageOfCommitedFunds, 
                                         intervalLenth, 
                                         intervalTotalLength);
    })

    it("should return addresses for artist token and artist token exchange to not be a 0 address", async() => {
        
        
        const saleInfo = await ArtistTokenSale.getSaleInfo(acc1.address);
        //artist address
        expect(saleInfo[0]).to.equal(ArtistToken.address);
        //artist token exchange address
        expect(saleInfo[1]).to.equal(Exchange.address);
        //price per token
        expect(saleInfo[2]).to.equal(pricePerToken);
        //percentage for funds & tokens for liquidity
        expect(saleInfo[3]).to.equal(percentageForLiquidity);
        //tokens for sale
        expect(saleInfo[4]).to.equal(250);
        //initial commited native tokens
        expect(saleInfo[5]).to.equal(150000);
        //initial unlocked native tokens
        
        let totalNativeTokens = await saleInfo[2] * await ArtistToken.totalSupply();
        //15% of total as set in create sale
        let expectLiquidityNativeTokens = await (totalNativeTokens/100) * 15;

        expect(saleInfo[6]).to.equal(expectLiquidityNativeTokens);
        //initial return price per coin
        expect(saleInfo[7]).to.equal(85);
        //return price reduction per interval
        expect(saleInfo[8]).to.equal(10);
        //locked per interval
        expect(saleInfo[9]).to.equal(10)
        //interval length
        expect(saleInfo[10]).to.equal(2630000);
        //interval total length
        expect(saleInfo[11]).to.equal(intervalTotalLength);
    })
  
    it("balance of the artist should be the correct amount based on the percentage inputted", async() => {
        let balanceOfAcc1 = await ArtistToken.balanceOf(acc1.address);
        expect(balanceOfAcc1).to.equal(500);
    })
  
    it("should allow an address to buy tokens if enough native tokens was sent and token for sale bool is set to true", async() => {
        await ArtistTokenSale.connect(acc2).BuyArtistTokens(acc1.address, {value: pricePerToken});
        let balanceOfAcc2 = await ArtistToken.balanceOf(acc2.address);
        expect(balanceOfAcc2).to.equal(1);
    })
  
    it("SHOULD NOT allow an address to buy tokens if not enough native tokens was sent", async() => {
        await expectRevert( 
            ArtistTokenSale.connect(acc2).BuyArtistTokens(acc1.address, {value: 1}),
            "Token price is greater than native token that has been sent")
    })
  
    it.only("SHOULD NOT allow the user to attempt to buy tokens if all tokens where bought as well", async() => {
        //await ArtistToken.connect(acc1).authorizeOperator(acc1.address, ArtistTokenSale.address, ArtistToken.balanceOf(acc1.address));
        await ArtistTokenSale.connect(acc2).BuyArtistTokens(acc1.address, {value: 250000});

        const saleInfo = await ArtistTokenSale.getSaleInfo(acc1.address); 
        expect (saleInfo[4]).to.equal(0);

        await expectRevert(
            ArtistTokenSale.connect(acc3).BuyArtistTokens(acc1.address, {value: pricePerToken}),
            "No artist tokens for sale right now"
        )
    })
  
    it("allow artist (acc1) to claim their rico after the set period of time has passed", async() => {
        let bal1 = await ArtistToken.balanceOf(acc1.address);
        let saleInfo = await ArtistTokenSale.getSaleInfo(acc1.address);
        //LockedPerInterval
        let claimAmount = await parseInt(saleInfo[9]);

        await network.provider.send("evm_increaseTime", [oneMonth])
        await network.provider.send("evm_mine")

        await ArtistTokenSale.connect(acc1).ArtistClaim();  
        
        let bal2 = await ArtistToken.balanceOf(acc1.address);
        expect(bal2).to.equal(await parseInt(bal1) + claimAmount)
    })

    it("artist should be able to claim multiple times as long as the correct amount of time has passed", async() => {
        let bal1 = await ArtistToken.balanceOf(acc1.address);
        let saleInfo = await ArtistTokenSale.getSaleInfo(acc1.address);
        //LockedPerInterval
        let claimAmount = await parseInt(saleInfo[9]);

        await network.provider.send("evm_increaseTime", [oneMonth])
        await network.provider.send("evm_mine")

        await ArtistTokenSale.connect(acc1).ArtistClaim();  
        
        let bal2 = await ArtistToken.balanceOf(acc1.address);
        expect(bal2).to.equal(await parseInt(bal1) + claimAmount)

        await network.provider.send("evm_increaseTime", [oneMonth])
        await network.provider.send("evm_mine")

        await ArtistTokenSale.connect(acc1).ArtistClaim();  

        let bal3 = await ArtistToken.balanceOf(acc1.address);
        expect(bal3).to.equal(await parseInt(bal2) + claimAmount)
    
        await network.provider.send("evm_increaseTime", [await oneMonth + oneMonth])
        await network.provider.send("evm_mine")

        await ArtistTokenSale.connect(acc1).ArtistClaim();  

        let bal4 = await ArtistToken.balanceOf(acc1.address);
        expect(bal4).to.equal(await parseInt(bal3) + (claimAmount * 2))
    })

    it("SHOULD NOT allow an address to claim (once all tokens have been claimed) any more claims", async() => {
        let bal1 = await ArtistToken.balanceOf(acc1.address);
        let saleInfo = await ArtistTokenSale.getSaleInfo(acc1.address);
        let claimAmount = await parseInt(saleInfo[9]);

        await network.provider.send("evm_increaseTime", [await oneMonth * 8])
        await network.provider.send("evm_mine")

        await ArtistTokenSale.connect(acc1).ArtistClaim();  

        await network.provider.send("evm_increaseTime", [await oneMonth])
        await network.provider.send("evm_mine")

        await expectRevert(
            ArtistTokenSale.connect(acc1).ArtistClaim(),
            "no more claims avaliable for artist") ; 
    })
  
    it("should allow address that invested to funds back on refund", async() => {
        await ArtistTokenSale.connect(acc2).BuyArtistTokens(acc1.address, {value:100000})
        let tokenBal1 = await ArtistToken.balanceOf(acc2.address);
        let saleNativeBal1 = await waffle.provider.getBalance(ArtistTokenSale.address); 

        await ArtistToken.connect(acc2).authorizeOperator(ArtistTokenSale.address, 100);
        await ArtistTokenSale.connect(acc2).ReturnTokens(acc1.address, 100); 

        let tokenBal2 = await ArtistToken.balanceOf(acc2.address);
        let saleNativeBal2 = await waffle.provider.getBalance(ArtistTokenSale.address); 
        expect(tokenBal2).to.be.lessThan(tokenBal1);
        expect(saleNativeBal2).to.be.lessThan(saleNativeBal1);
    })

})