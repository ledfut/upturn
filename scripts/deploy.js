const hre = require("hardhat");

async function main() {
    const InitalRightsSaleContract = await hre.ethers.getContractFactory("InitalRightsSale");
    const InitalRightsSaleDeploy = await InitalRightsSaleContract.deploy();
    await InitalRightsSaleDeploy.deployed();

    const StakeArtistTokenContract = await hre.ethers.getContractFactory("InitalRightsSale");
    const StakeArtistTokenDeploy = await StakeArtistTokenContract.deploy();
    await StakeArtistTokenDeploy.deployed();

    const MarketplaceContract = await hre.ethers.getContractFactory("InitalRightsSale");
    const MarketplaceDeploy = await MarketplaceContract.deploy();
    await MarketplaceDeploy.deployed();

    const ArtistNftSaleContract =     await hre.ethers.getContractFactory("InitalRightsSale");
    const ArtistNftSaleDeploy = await ArtistNftSaleContract.deploy();
    await ArtistNftSaleDeploy.deployed();

    console.log("Inital Rights Sale contract: " + InitalRightsSaleDeploy.address);
    console.log("Stake Artist Token contract: " + StakeArtistTokenDeploy.address);
    console.log("Marketplace contract: " + MarketplaceDeploy.address);
    console.log("Artist Nft Sale contract: " + ArtistNftSaleDeploy.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });