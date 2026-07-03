require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    mumbai: {
      url: process.env.API_URL || "",
      accounts: process.env.TOKEN_MINTING_PRIVATE_KEY ? [process.env.TOKEN_MINTING_PRIVATE_KEY] : []
    }
  }
};