require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");
require("@cofhe/hardhat-plugin"); 

module.exports = {
  solidity: {
    version: "0.8.28", 
    settings: {
      evmVersion: "cancun",
    },
  },
  networks: {
    sepolia: {
      url: process.env.BLOCKCHAIN_RPC_URL,
      accounts: [process.env.SERVER_WALLET_PRIVATE_KEY],
      chainId: 11155111
    },
    "eth-sepolia": {
      url: process.env.BLOCKCHAIN_RPC_URL,
      accounts: [process.env.SERVER_WALLET_PRIVATE_KEY]
    }
  }
};