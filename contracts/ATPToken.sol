// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ATPToken
 * @dev ERC20 token with mint and burn functionality, owned by the contract deployer.
 */
contract ATPToken is ERC20, Ownable {
    /**
     * @dev Constructor that gives msg.sender an initial supply of 1,000,000 tokens.
     * @param initialSupply Initial supply in tokens (will be multiplied by 10 by 10 ** decimals())
     */
    constructor(uint256 initialSupply) ERC20("ATP Token", "ATP") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }

    /**
     * @dev Mints new tokens and assigns them to `account`.
     * Only callable by the owner.
     * @param account Address to receive the newly minted tokens.
     * @param amount Amount of tokens to mint (in token units, not wei).
     */
    function mint(address account, uint256 amount) public onlyOwner {
        _mint(account, amount * 10 ** decimals());
    }

    /**
     * @dev Burns tokens from `account`.
     * Only callable by the owner.
     * @param account Address whose tokens will be burned.
     * @param amount Amount of tokens to burn (in token units, not wei).
     */
    function burn(address account, uint256 amount) public onlyOwner {
        _burn(account, amount * 10 ** decimals());
    }
}