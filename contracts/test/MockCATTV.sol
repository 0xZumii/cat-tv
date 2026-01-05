// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockCATTV
 * @notice Mock token for testing CatFeeder locally
 */
contract MockCATTV is ERC20 {
    constructor() ERC20("Cat TV Token", "CATTV") {
        // Mint 100 billion tokens (matching real supply)
        _mint(msg.sender, 100_000_000_000 * 10**18);
    }
    
    /// @notice Anyone can mint for testing
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
