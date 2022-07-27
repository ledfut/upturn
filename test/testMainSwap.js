const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");

describe("testing the main contract", async() => {
    let exchangeContract
    let mainSwap;
    let lsp7_1;
    let lsp7_2;

    let acc1, acc2;

    beforeEach(async() => {
        [acc1, acc2] = await ethers.getSigners();

        const MainSwapContract = await ethers.getContractFactory("Main");
        const mainSwapDeploy = await MainSwapContract.deploy();
        mainSwap = await mainSwapDeploy.deployed();

        const LSP7_1_contract = await ethers.getContractFactory("ArtistRightsToken");
        const lsp7_1_deploy = await LSP7_1_contract.deploy("Arist Rights Token 1", "Token1", 1000, 0, acc1.address);
        lsp7_1 = await lsp7_1_deploy.deployed();

        const LSP7_2_contract = await ethers.getContractFactory("ArtistRightsToken");
        const lsp7_2_deploy = await LSP7_2_contract.deploy("Arist Rights Token 2", "Token2", 1000, 0, acc1.address);
        lsp7_2 = await lsp7_2_deploy.deployed();

        exchangeContract = await ethers.getContractFactory("Exchange")
    })

    it("Should be able to create an exchange contract and return its address", async() => {
        await mainSwap.createExchange(lsp7_1.address);

        let LSP7_1ExchangeAddress = await mainSwap.returnExchangeAddress(1);

        expect(await String(LSP7_1ExchangeAddress)).to.not.equal("0x0000000000000000000000000000000000000000")
    })

    it("Should be able to create an exchange and deposit liquidity of selected token", async() => {
        await mainSwap.createExchange(lsp7_1.address);

        let LSP7_1ExchangeAddress = await mainSwap.returnExchangeAddress(1);
        let exchangeInstance = await exchangeContract.attach(LSP7_1ExchangeAddress);

        await lsp7_1.connect(acc1).authorizeOperator(exchangeInstance.address, 1000);
        await exchangeInstance.connect(acc1).addLiquidity(100, {value: 100});

        expect (await exchangeInstance.getNativeTokenBalance()).to.not.equal(0);
        expect (await exchangeInstance.getTokenBalance()).to.not.equal(0);
    })

    it("Exchange contract should swap native tokens for tokens", async() => {
        const provider = waffle.provider;
        await mainSwap.createExchange(lsp7_1.address);

        let LSP7_1ExchangeAddress = await mainSwap.returnExchangeAddress(1);
        let exchangeInstance = await exchangeContract.attach(LSP7_1ExchangeAddress);

        await lsp7_1.connect(acc1).authorizeOperator(exchangeInstance.address, 1000);
        await exchangeInstance.connect(acc1).addLiquidity(100, {value: 100});

        let acc2NativeBalBefore = await provider.getBalance(acc2.address);
        let acc2TokenBalBefore = await lsp7_1.balanceOf(acc2.address);

        let exchangeNativeBalBefore = await provider.getBalance(LSP7_1ExchangeAddress);
        let exchangeTokenBalBefore = await lsp7_1.balanceOf(LSP7_1ExchangeAddress);

        await exchangeInstance.connect(acc2).nativeToTokenSwap({value: 100});

        let acc2NativeBalAfter = await provider.getBalance(acc2.address);
        let acc2TokenBalAfter = await lsp7_1.balanceOf(acc2.address);

        let exchangeNativeBalAfter = await provider.getBalance(LSP7_1ExchangeAddress);
        let exchangeTokenBalAfter = await lsp7_1.balanceOf(LSP7_1ExchangeAddress);

        expect (BigNumber.from(acc2NativeBalAfter)).to.be.lessThan(await BigNumber.from(acc2NativeBalBefore).sub(100))
        expect (acc2TokenBalAfter).to.be.greaterThan(acc2TokenBalBefore);

        expect (BigNumber.from(exchangeNativeBalAfter)).to.be.greaterThan(await BigNumber.from(exchangeNativeBalBefore));
        expect (exchangeTokenBalAfter).to.be.lessThan(exchangeTokenBalBefore)
    })

    it("Exchange contract should swap tokens for native tokens", async() => {
        const provider = waffle.provider;
        await mainSwap.createExchange(lsp7_1.address);

        LSP7_1ExchangeAddress = await mainSwap.returnExchangeAddress(1);
        let exchangeInstance = await exchangeContract.attach(LSP7_1ExchangeAddress);

        await lsp7_1.connect(acc1).authorizeOperator( exchangeInstance.address, 1000);
        await exchangeInstance.connect(acc1).addLiquidity(100, {value: ethers.utils.parseEther('10')});

        let acc1NativeBalBefore = await provider.getBalance(acc1.address);
        let acc1TokenBalBefore = await lsp7_1.balanceOf(acc1.address);

        let exchangeNativeBalBefore = await provider.getBalance(LSP7_1ExchangeAddress);
        let exchangeTokenBalBefore = await lsp7_1.balanceOf(LSP7_1ExchangeAddress);

        await lsp7_1.connect(acc1).authorizeOperator(LSP7_1ExchangeAddress, 100);
        await exchangeInstance.connect(acc1).tokenToNativeSwap(100);

        let acc1NativeBalAfter = await provider.getBalance(acc1.address);
        let acc1TokenBalAfter = await lsp7_1.balanceOf(acc1.address);

        let exchangeNativeBalAfter = await provider.getBalance(LSP7_1ExchangeAddress);
        let exchangeTokenBalAfter = await lsp7_1.balanceOf(LSP7_1ExchangeAddress);

        expect (BigNumber.from(acc1NativeBalAfter)).to.be.greaterThan(await BigNumber.from(acc1NativeBalBefore))
        expect (acc1TokenBalAfter).to.be.lessThan(acc1TokenBalBefore);

        expect (BigNumber.from(exchangeNativeBalAfter)).to.be.lessThan(await BigNumber.from(exchangeNativeBalBefore));
        expect (exchangeTokenBalAfter).to.be.greaterThan(exchangeTokenBalBefore)
    })
})