import "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import "dotenv/config";

const { PRIVATE_KEY, SEPOLIA_RPC_URL } = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      type: "http",
      url: SEPOLIA_RPC_URL,
      accounts: [] // TODO: add private key from env when deploying
    }
  }
};