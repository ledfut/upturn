const { expect } = require("chai");
const { ethers, waffle, network, hre } = require("hardhat");
const { balance, expectRevert} = require("@openzeppelin/test-helpers");

describe("nft sale functionality", async() => {
    let nftSale;
    let nftContract;

    let acc1, acc2, acc3;
    
    beforeEach(async() => {
        [acc1, acc2, acc3] = await ethers.getSigners();
    
        const nftSaleContract = await ethers.getContractFactory("ArtistNftSaleContract");
        const nftSaleDeploy = await nftSaleContract.deploy();
        nftSale = await nftSaleDeploy.deployed();
    
        nftContract = await ethers.getContractFactory("ArtistNft");
    
    })
    
    it("should let contract deployer set address to create nft to true", async() => {
        await nftSale.SetAddressToCreateNFT(acc1.address, true);
        let result = await nftSale.getCanNftCreateSale(acc1.address);
        expect(result).to.equal(true);
    })

    it("should let contract deployer set address to create nft to false", async() => {
        await nftSale.SetAddressToCreateNFT(acc1.address, true);
        await nftSale.SetAddressToCreateNFT(acc1.address, false);
        let result = await nftSale.getCanNftCreateSale(acc1.address);

        expect(result).to.equal(false);
    })

    it("SHOULD NOT let an address that isn't the contract deployer to call SetAddressToCreateNFT", async() => {
        await expectRevert(
            nftSale.connect(acc2).SetAddressToCreateNFT(acc1.address, true),
            "Only the deployer of this contract can access this function"
        )
    })

    it("should create sale if address has been approved to", async() => {
        await nftSale.SetAddressToCreateNFT(acc1.address, true);
        await nftSale.connect(acc1).CreateSale(1, "name", "symbol", 1000, 1, acc1.address, "0x737472696e670000000000000000000000000000000000000000000000000000", "0x737472696e670000000000000000000000000000000000000000000000000000");
        let saleInfo = await nftSale.getSaleInfo(acc1.address, 1);

        //nft price
        expect(saleInfo[1]).to.equal(1);
        //is nft in sale
        expect(saleInfo[2]).to.equal(true);
    })

    it("SHOULD NOT allow to create a sale if not approved to", async() => {
        await expectRevert(
            nftSale.connect(acc1).CreateSale(1, "name", "symbol", 1000, 1, acc1.address, "0x737472696e670000000000000000000000000000000000000000000000000000", "0x737472696e670000000000000000000000000000000000000000000000000000"),
            "Only approved addresses can create nfts"
        )
    })

    it("should allow owner to stop the sale", async() => {
        await nftSale.SetAddressToCreateNFT(acc1.address, true);
        await nftSale.connect(acc1).CreateSale(1, "name", "symbol", 1000, 1, acc1.address, "0x737472696e670000000000000000000000000000000000000000000000000000", "0x737472696e670000000000000000000000000000000000000000000000000000");
        await nftSale.connect(acc1).StopSale(1)
        let saleInfo = await nftSale.getSaleInfo(acc1.address, 1);

        //is nft in sale
        expect(saleInfo[2]).to.equal(false);
    })

    it("should allow owner to start the sale", async() => {
        await nftSale.SetAddressToCreateNFT(acc1.address, true);
        await nftSale.connect(acc1).CreateSale(1, "name", "symbol", 1000, 1, acc1.address, "0x737472696e670000000000000000000000000000000000000000000000000000", "0x737472696e670000000000000000000000000000000000000000000000000000");
        await nftSale.connect(acc1).StopSale(1)
        await nftSale.connect(acc1).StartSale(1)
        let saleInfo = await nftSale.getSaleInfo(acc1.address, 1);

        //is nft in sale
        expect(saleInfo[2]).to.equal(true);
    })

    it("should allow an address to mint an nft if they send enough native tokens", async() => {
        await nftSale.SetAddressToCreateNFT(acc1.address, true);
        await nftSale.connect(acc1).CreateSale(1, "name", "symbol", 1000, 1, acc1.address, "0x737472696e670000000000000000000000000000000000000000000000000000", "0x737472696e670000000000000000000000000000000000000000000000000000");

        let saleInfo = await nftSale.getSaleInfo(acc1.address, 1);
        let nft = await nftContract.attach(saleInfo[0]);
        await nftSale.connect(acc2).MintNft(acc1.address, 1, {value: 1});

        expect(await nft.tokenOwnerOf(ethers.utils.formatBytes32String(0))).to.equal(acc2.address)
    })

    it("SHOULD NOT mint an nft if address sends too much or too little amount of native tokens", async() => {
        await nftSale.SetAddressToCreateNFT(acc1.address, true);
        await nftSale.connect(acc1).CreateSale(2, "name", "symbol", 1000, 1, acc1.address, "0x737472696e670000000000000000000000000000000000000000000000000000", "0x737472696e670000000000000000000000000000000000000000000000000000");

        let saleInfo = await nftSale.getSaleInfo(acc1.address, 1);
        let nft = await nftContract.attach(saleInfo[0]);

        await expectRevert(
            nftSale.connect(acc2).MintNft(acc1.address, 1, {value: 1}),
            "incorrect amount of native token sent for purchese of NFT"
        )

        await expectRevert(
            nftSale.connect(acc2).MintNft(acc1.address, 1, {value: 3}),
            "incorrect amount of native token sent for purchese of NFT"
        )
    })
    

})