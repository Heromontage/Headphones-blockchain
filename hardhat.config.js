import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";
dotenv.config();

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: "0.8.20",
  networks: {
    // Local Hardhat network (free test ETH, no real wallet needed)
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    // Sepolia testnet (requires real Sepolia ETH from a faucet)
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  }
};