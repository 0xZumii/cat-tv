// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../CatFeeder.sol";

/**
 * @title DeployCatFeeder
 * @notice Deployment script for CatFeeder contract
 * 
 * Usage:
 *   # Set environment variables
 *   export PRIVATE_KEY=0x...
 *   export CATTV_TOKEN=0xbb0b50cc8efdf947b1808dabcc8bbd58121d5b07
 *   export FAUCET_OPERATOR=0x...  # Your backend wallet
 *   export BASE_RPC_URL=https://mainnet.base.org
 *   export BASESCAN_API_KEY=...
 * 
 *   # Deploy to Base mainnet
 *   forge script script/DeployCatFeeder.s.sol:DeployCatFeeder --rpc-url base --broadcast --verify
 * 
 *   # Deploy to Base Sepolia (testnet)
 *   forge script script/DeployCatFeeder.s.sol:DeployCatFeeder --rpc-url base_sepolia --broadcast --verify
 */
contract DeployCatFeeder is Script {
    function run() external {
        // Load config from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address cattvToken = vm.envAddress("CATTV_TOKEN");
        address faucetOperator = vm.envAddress("FAUCET_OPERATOR");
        
        console.log("Deploying CatFeeder...");
        console.log("Token:", cattvToken);
        console.log("Faucet Operator:", faucetOperator);
        
        vm.startBroadcast(deployerPrivateKey);
        
        CatFeeder feeder = new CatFeeder(cattvToken, faucetOperator);
        
        vm.stopBroadcast();
        
        console.log("CatFeeder deployed to:", address(feeder));
        console.log("");
        console.log("Next steps:");
        console.log("1. Fund the protocol pool:");
        console.log("   cattvToken.approve(feeder, amount)");
        console.log("   feeder.fundProtocolPool(amount)");
        console.log("");
        console.log("2. Update your backend with the contract address");
        console.log("3. Verify on Basescan if not auto-verified");
    }
}

/**
 * @title FundPool
 * @notice Script to fund the protocol pool after deployment
 * 
 * Usage:
 *   export CATFEEDER_ADDRESS=0x...
 *   export FUND_AMOUNT=1000000000000000000000000  # 1M tokens (with 18 decimals)
 *   forge script script/DeployCatFeeder.s.sol:FundPool --rpc-url base --broadcast
 */
contract FundPool is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address feederAddress = vm.envAddress("CATFEEDER_ADDRESS");
        address tokenAddress = vm.envAddress("CATTV_TOKEN");
        uint256 fundAmount = vm.envUint("FUND_AMOUNT");
        
        CatFeeder feeder = CatFeeder(feederAddress);
        IERC20 token = IERC20(tokenAddress);
        
        console.log("Funding protocol pool...");
        console.log("Amount:", fundAmount);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Approve and fund
        token.approve(feederAddress, fundAmount);
        feeder.fundProtocolPool(fundAmount);
        
        vm.stopBroadcast();
        
        console.log("Protocol pool funded!");
        console.log("New pool balance:", feeder.protocolPoolBalance());
    }
}
