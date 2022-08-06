const { expect } = require("chai");
const { ethers, network, time } = require("hardhat");
const { balance, expectRevert} = require("@openzeppelin/test-helpers");
const { inTransaction } = require("@openzeppelin/test-environment");

describe("Staking functionality", async() => {
    let ArtistToken;
    let ArtistTokenSale;
    let Exchange;
    let Staking;

    let acc1, acc2, acc3;
    beforeEach(async() => {
        [acc1, acc2, acc3] = await ethers.getSigners();

        const ArtistTokenSaleContract = await ethers.getContractFactory("InitalRightsSale");
        const ArtistTokenSaleDeploy = await ArtistTokenSaleContract.deploy();
        ArtistTokenSale = await ArtistTokenSaleDeploy.deployed();

        const ArtistTokenContract = await ethers.getContractFactory("ArtistRightsToken");
        const ArtistTokenDeploy = await ArtistTokenContract.deploy("name", "ticker", 1000, ArtistTokenSale.address);
        ArtistToken = await ArtistTokenDeploy.deployed();

        const StakingContract = await ethers.getContractFactory("StakeArtistToken");
        const StakingDeploy = await StakingContract.deploy();
        Staking = await StakingDeploy.deployed();

        const ExchangeContract = await ethers.getContractFactory("Exchange");
        const ExchangeDeploy = await ExchangeContract.deploy(ArtistToken.address, acc1.address);
        Exchange = await ExchangeDeploy.deployed();
    })

    it("should allow a user to stake a token they own", async() => {
        await ArtistTokenSale.CreateSale(acc1.address, ArtistToken.address, Exchange.address, 1, 50, 25);
        await ArtistToken.connect(acc1).authorizeOperator(Staking.address, ArtistToken.balanceOf(acc1.address));
        
        let balOfStakingBefore = await ArtistToken.balanceOf(Staking.address);
        await Staking.connect(acc1).stake(ArtistToken.address, ArtistToken.balanceOf(acc1.address));
        
        let balOfStakingAfter = await ArtistToken.balanceOf(Staking.address);
        expect(balOfStakingAfter).to.be.greaterThan(balOfStakingBefore);
    })

    it("should allow a user to claim rewards from staking after a interval time has pass", async() => {
        await ArtistTokenSale.CreateSale(acc1.address, ArtistToken.address, Exchange.address, 1, 50, 25);

        //send 100 tokens to staking contract to see if percentage sent is correct
        await ArtistTokenSale.connect(acc2).BuyArtistTokens(acc1.address, {value: 250});
        //set false
        await ArtistToken.connect(acc2).transfer(acc2.address, Staking.address, 250, true, "0x");
        await Staking.setStakingInterval(ArtistToken.address, 500);
        await ArtistToken.connect(acc1).authorizeOperator(Staking.address, 100);

        await Staking.connect(acc1).stake(ArtistToken.address, 10);

        await network.provider.send("evm_increaseTime", [500])
        await network.provider.send("evm_mine");

        await Staking.connect(acc1).claimStake(ArtistToken.address);
        let bal1 = await ArtistToken.balanceOf(acc1.address);
        
        expect (bal1).to.be.equal(249);

        await network.provider.send("evm_increaseTime", [1000])
        await network.provider.send("evm_mine");

        await Staking.connect(acc1).claimStake(ArtistToken.address);
        let bal2 = await ArtistToken.balanceOf(acc1.address);
        expect(bal2).to.equal(267)
    })

    it("should allow a user unstake before reward is avalible", async() => {
        await ArtistTokenSale.CreateSale(acc1.address, ArtistToken.address, Exchange.address, 1, 50, 25);
        await ArtistToken.connect(acc1).authorizeOperator(Staking.address, ArtistToken.balanceOf(acc1.address));
        await Staking.connect(acc1).stake(ArtistToken.address, ArtistToken.balanceOf(acc1.address));
        
        let balOfAcc1Before = await ArtistToken.balanceOf(acc1.address);
    
        await Staking.connect(acc1).unstake(ArtistToken.address, acc1.address);

        let balOfAcc1After = await ArtistToken.balanceOf(acc1.address);
        expect(balOfAcc1After).to.be.greaterThan(balOfAcc1Before);
    })

    it("should allow a user to unstake when a reward is avaliable and receive the reward", async() => {
        await ArtistTokenSale.CreateSale(acc1.address, ArtistToken.address, Exchange.address, 1, 50, 25);
        await ArtistToken.connect(acc1).authorizeOperator(Staking.address, ArtistToken.balanceOf(acc1.address));
        await Staking.connect(acc1).stake(ArtistToken.address, ArtistToken.balanceOf(acc1.address));
        
        let balOfAcc1Before = await ArtistToken.balanceOf(acc1.address);
    
        await Staking.connect(acc1).unstake(ArtistToken.address, acc1.address);

        let balOfAcc1After = await ArtistToken.balanceOf(acc1.address);
        expect(balOfAcc1After).to.be.greaterThan(balOfAcc1Before);
    })
})