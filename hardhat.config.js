import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";
dotenv.config();

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: "0.8.20",
  networks: {
    mumbai: {
      url: process.env.API_URL || "",
      accounts: process.env.TOKEN_MINTING_PRIVATE_KEY ? [process.env.TOKEN_MINTING_PRIVATE_KEY] : []
    }
  }
};