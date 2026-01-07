// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/CatTVFaucet.sol";

contract DeployFaucet is Script {
    // $CATTV token address on Base mainnet
    address constant CATTV_TOKEN = 0xBb0B50CC8EFDF947b1808dabcc8Bbd58121D5B07;

    // Default claim amount: 100 tokens (with 18 decimals)
    uint256 constant CLAIM_AMOUNT = 100 * 10 ** 18;

    // Default cooldown: 24 hours
    uint256 constant CLAIM_COOLDOWN = 24 hours;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy the faucet
        CatTVFaucet faucet = new CatTVFaucet(
            CATTV_TOKEN,
            CLAIM_AMOUNT,
            CLAIM_COOLDOWN
        );

        console.log("CatTVFaucet deployed at:", address(faucet));
        console.log("Token:", CATTV_TOKEN);
        console.log("Claim amount:", CLAIM_AMOUNT);
        console.log("Cooldown:", CLAIM_COOLDOWN, "seconds");

        vm.stopBroadcast();
    }
}

contract AddDistributor is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address faucetAddress = vm.envAddress("FAUCET_ADDRESS");
        address distributorAddress = vm.envAddress("DISTRIBUTOR_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        CatTVFaucet faucet = CatTVFaucet(faucetAddress);
        faucet.setDistributor(distributorAddress, true);

        console.log("Added distributor:", distributorAddress);

        vm.stopBroadcast();
    }
}

contract FundFaucet is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address faucetAddress = vm.envAddress("FAUCET_ADDRESS");
        uint256 amount = vm.envUint("FUND_AMOUNT");

        address tokenAddress = 0xBb0B50CC8EFDF947b1808dabcc8Bbd58121D5B07;

        vm.startBroadcast(deployerPrivateKey);

        // Approve faucet to spend tokens
        IERC20(tokenAddress).approve(faucetAddress, amount);

        // Fund the faucet
        CatTVFaucet faucet = CatTVFaucet(faucetAddress);
        faucet.fundFaucet(amount);

        console.log("Funded faucet with:", amount);

        vm.stopBroadcast();
    }
}
