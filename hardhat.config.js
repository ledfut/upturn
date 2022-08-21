require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  gasReporter: {
    currency: 'CHF',
    gasPrice: 21
  },
  solidity: "0.8.15",
  settings: {
    optimizer: {
      enabled: true,
      runs: 2000,
      details: {
        yul: true,
        yulDetails: {
          stackAllocation: true,
          optimizerSteps: "dhfoDgvulfnTUtnIf"
        }
      }
    }
  },
  //  settings: {
  //    optimizer: {
  //      enabled: true,
  //      runs: 200
  //    }
  //  }
};
