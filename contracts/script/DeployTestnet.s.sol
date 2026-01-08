// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/TestCATTV.sol";
import "../src/CatTVFaucet.sol";

/**
 * @title DeployTestnet
 * @notice Deploys TestCATTV token and CatTVFaucet to Base Sepolia testnet
 */
contract DeployTestnet is Script {
    // Default claim amount: 100 tokens (with 18 decimals)
    uint256 constant CLAIM_AMOUNT = 100 * 10 ** 18;

    // Default cooldown: 24 hours (use shorter for testing if needed)
    uint256 constant CLAIM_COOLDOWN = 24 hours;

    // Amount to fund faucet: 10 million tokens
    uint256 constant FAUCET_FUND_AMOUNT = 10_000_000 * 10 ** 18;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy test token
        TestCATTV token = new TestCATTV();
        console.log("TestCATTV deployed at:", address(token));

        // 2. Deploy faucet with test token
        CatTVFaucet faucet = new CatTVFaucet(
            address(token),
            CLAIM_AMOUNT,
            CLAIM_COOLDOWN
        );
        console.log("CatTVFaucet deployed at:", address(faucet));

        // 3. Approve and fund the faucet
        token.approve(address(faucet), FAUCET_FUND_AMOUNT);
        faucet.fundFaucet(FAUCET_FUND_AMOUNT);
        console.log("Faucet funded with:", FAUCET_FUND_AMOUNT / 10 ** 18, "tokens");

        // 4. Log summary
        console.log("");
        console.log("=== DEPLOYMENT SUMMARY ===");
        console.log("Token:", address(token));
        console.log("Faucet:", address(faucet));
        console.log("Claim amount:", CLAIM_AMOUNT / 10 ** 18, "tokens per claim");
        console.log("Cooldown:", CLAIM_COOLDOWN, "seconds");
        console.log("");
        console.log("Next steps:");
        console.log("1. Add distributor: FAUCET_ADDRESS=<faucet> DISTRIBUTOR_ADDRESS=<your_distributor> forge script script/DeployTestnet.s.sol:AddDistributorTestnet --rpc-url base_sepolia --broadcast");
        console.log("2. Update Firebase secrets with testnet addresses");

        vm.stopBroadcast();
    }
}

/**
 * @title AddDistributorTestnet
 * @notice Adds a distributor to the faucet on testnet
 */
contract AddDistributorTestnet is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address faucetAddress = vm.envAddress("FAUCET_ADDRESS");
        address distributorAddress = vm.envAddress("DISTRIBUTOR_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        CatTVFaucet faucet = CatTVFaucet(faucetAddress);
        faucet.setDistributor(distributorAddress, true);

        console.log("Added distributor:", distributorAddress);
        console.log("To faucet:", faucetAddress);

        vm.stopBroadcast();
    }
}

/**
 * @title SetShortCooldown
 * @notice Sets a shorter cooldown for faster testing (e.g., 1 minute)
 */
contract SetShortCooldown is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address faucetAddress = vm.envAddress("FAUCET_ADDRESS");
        uint256 newCooldown = vm.envOr("COOLDOWN", uint256(60)); // Default 60 seconds

        vm.startBroadcast(deployerPrivateKey);

        CatTVFaucet faucet = CatTVFaucet(faucetAddress);
        faucet.setClaimCooldown(newCooldown);

        console.log("Cooldown set to:", newCooldown, "seconds");

        vm.stopBroadcast();
    }
}
