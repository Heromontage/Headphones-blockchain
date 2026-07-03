import { expect } from "chai";
import pkg from 'hardhat';
const { ethers } = pkg;

describe("ATPToken", function () {
  let token;
  let owner;
  let addr1;
  let addr2;
  let addrs;
  const initialSupply = ethers.parseEther("1000000"); // 1,000,000 tokens

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    const ATPToken = await ethers.getContractFactory("ATPToken");
    token = await ATPToken.deploy(initialSupply);
    await token.waitForDeployment();
  });

  it("Should have correct name and symbol", async function () {
    expect(await token.name()).to.equal("ATP Token");
    expect(await token.symbol()).to.equal("ATP");
  });

  it("Should set the correct initial supply", async function () {
    const ownerBalance = await token.balanceOf(owner.address);
    expect(await token.totalSupply()).to.equal(ownerBalance);
  });

  it("Should mint tokens correctly", async function () {
    const mintAmount = ethers.parseEther("100"); // 100 tokens
    await token.connect(owner).mint(addr1.address, mintAmount);
    expect(await token.balanceOf(addr1.address)).to.equal(mintAmount);
    expect(await token.totalSupply()).to.equal(initialSupply + mintAmount);
  });

  it("Should burn tokens correctly", async function () {
    const burnAmount = ethers.parseEther("50"); // 50 tokens
    // First, mint some tokens to addr1 to burn
    await token.connect(owner).mint(addr1.address, ethers.parseEther("100"));
    await token.connect(owner).burn(addr1.address, burnAmount);
    expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("50"));
    expect(await token.totalSupply()).to.equal(initialSupply + ethers.parseEther("50"));
  });

  it("Should only allow owner to mint and burn", async function () {
    const mintAmount = ethers.parseEther("10");
    await expect(
      token.connect(addr1).mint(addr2.address, mintAmount)
    ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");

    const burnAmount = ethers.parseEther("10");
    // First, mint some tokens to addr1 so we can try to burn from it
    await token.connect(owner).mint(addr1.address, ethers.parseEther("20"));
    await expect(
      token.connect(addr1).burn(addr1.address, burnAmount)
    ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
  });
});