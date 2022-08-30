const { expect } = require("chai");
const { BigNumber} = require("ethers");
const { ethers, waffle  } = require("hardhat");

describe("testing the main contract", async() => {
    let exchange
    let token1;
    let tokenSale;
    
    let acc1, acc2;

    beforeEach(async() => {
        [acc1, acc2] = await ethers.getSigners();

        const tokenSaleContract = await ethers.getContractFactory("ArtistTokenSale");
        const tokenSaleDeploy = await tokenSaleContract.deploy();
        tokenSale = await tokenSaleDeploy.deployed();

        const tokenContract = await ethers.getContractFactory("ArtistToken");
        const token1Deploy = await tokenContract.deploy("name1", "ticker1", 1000, tokenSale.address);
        token1 = await token1Deploy.deployed();

        const exchangeContract = await ethers.getContractFactory("Exchange")
        const exchangeDeploy = await exchangeContract.deploy(token1.address, acc1.address);
        exchange = await exchangeDeploy.deployed();
    })

    it("Liquidity should be deposited once all artist tokens have been bought", async() => {
        let nativeBalOfExchangeBefore = await exchange.getNativeTokenBalance();
        let tokenBalOfExchangeBefore = await exchange.getTokenBalance();

        expect(nativeBalOfExchangeBefore).to.equal(0);
        expect(tokenBalOfExchangeBefore).to.equal(0);
        
        await tokenSale.CreateSale(acc1.address, token1.address, exchange.address, 1, 50, 25, 50, 2630000, 12); // 1 month for 12 months
        await tokenSale.connect(acc2).BuyArtistTokens(acc1.address, {value: 250});
        
        let nativeBalOfExchangeAfter = await exchange.getNativeTokenBalance();
        let tokenBalOfExchangeAfter = await exchange.getTokenBalance();

        expect(nativeBalOfExchangeAfter).to.not.equal(0);
        expect(tokenBalOfExchangeAfter).to.not.equal(0);
    })

    it("should exchange native to token", async() => {
        await tokenSale.CreateSale(acc1.address, token1.address, exchange.address, 1, 50, 25, 50, 2630000, 12); // 1 month for 12 months
        await tokenSale.connect(acc2).BuyArtistTokens(acc1.address, {value: 250});

        let acc2TokenBalBefore = await token1.balanceOf(acc2.address);
        await exchange.connect(acc2).nativeToTokenSwap({value: 10});
        let acc2TokenBalAfter = await token1.balanceOf(acc2.address);

        expect(acc2TokenBalAfter).to.be.greaterThan(acc2TokenBalBefore);
    })

    it("should exchange token to native", async() => {
        await tokenSale.CreateSale(acc1.address, token1.address, exchange.address, 1, 50, 25, 50, 2630000, 12); // 1 month for 12 months
        await tokenSale.connect(acc2).BuyArtistTokens(acc1.address, {value: 250});

        let exchangeBalBefore = await waffle.provider.getBalance(exchange.address);
        await token1.connect(acc2).authorizeOperator(exchange.address, 100);
        await exchange.connect(acc2).tokenToNativeSwap(100);
        let exchangeBalAfter = await waffle.provider.getBalance(exchange.address);

        expect(exchangeBalAfter).to.be.lessThan(exchangeBalBefore);
    })
})