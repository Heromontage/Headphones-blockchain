import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
  const initialSupply = ethers.parseEther("1000000"); // 1,000,000 tokens

  const ATPToken = await ethers.getContractFactory("ATPToken");
  const token = await ATPToken.deploy(initialSupply);

  await token.waitForDeployment();

  console.log("ATPToken deployed to:", await token.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });