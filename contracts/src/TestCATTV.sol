// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title TestCATTV
 * @notice A test ERC20 token for testing the CatTV faucet on testnets
 * @dev Anyone can mint tokens for testing purposes
 */
contract TestCATTV is ERC20 {
    constructor() ERC20("Test CATTV", "tCATTV") {
        // Mint 1 billion tokens to deployer for initial distribution
        _mint(msg.sender, 1_000_000_000 * 10 ** 18);
    }

    /**
     * @notice Mint tokens to any address (for testing only!)
     * @param to Address to receive tokens
     * @param amount Amount to mint (in wei, 18 decimals)
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
