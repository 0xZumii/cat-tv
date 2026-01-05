// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../CatFeeder.sol";
import "./MockCATTV.sol";

contract CatFeederTest is Test {
    CatFeeder public feeder;
    MockCATTV public token;
    
    address public owner = address(1);
    address public faucetOperator = address(2);
    address public user1 = address(3);
    address public user2 = address(4);
    address public shelter = address(5);
    
    bytes32 public cat1 = keccak256("whiskers");
    bytes32 public cat2 = keccak256("mochi");
    
    uint256 public constant INITIAL_FAUCET = 200_000_000 * 10**18; // 200M tokens
    uint256 public constant FEED_AMOUNT = 10 * 10**18; // 10 tokens per feed
    
    function setUp() public {
        vm.startPrank(owner);
        
        // Deploy token
        token = new MockCATTV();
        
        // Deploy feeder
        feeder = new CatFeeder(address(token), faucetOperator);
        
        // Fund faucet
        token.approve(address(feeder), INITIAL_FAUCET);
        feeder.fundFaucet(INITIAL_FAUCET);
        
        // Give users some tokens
        token.transfer(user1, 10000 * 10**18);
        token.transfer(user2, 10000 * 10**18);
        
        vm.stopPrank();
    }
    
    // ============================================
    // BASIC FEED TESTS
    // ============================================
    
    function test_Feed_100PercentToBowl() public {
        vm.startPrank(user1);
        token.approve(address(feeder), FEED_AMOUNT);
        
        uint256 userBalanceBefore = token.balanceOf(user1);
        
        feeder.feed(cat1);
        
        vm.stopPrank();
        
        // Check user balance decreased by FEED_AMOUNT
        assertEq(token.balanceOf(user1), userBalanceBefore - FEED_AMOUNT);
        
        // 100% should be in bowl
        (uint256 currentAmount,,,,) = feeder.getCatBowl(cat1);
        assertEq(currentAmount, FEED_AMOUNT, "100% should be in bowl");
        
        // Care Fund should be 0 (tokens go there after decay)
        assertEq(feeder.careFundBalance(), 0, "Care Fund should be 0 before decay");
    }
    
    function test_Feed_UpdatesCatStats() public {
        vm.startPrank(user1);
        token.approve(address(feeder), FEED_AMOUNT * 3);
        
        feeder.feed(cat1);
        feeder.feed(cat1);
        feeder.feed(cat1);
        
        vm.stopPrank();
        
        (,, uint256 totalReceived, uint256 feedCount,) = feeder.getCatBowl(cat1);
        
        assertEq(totalReceived, FEED_AMOUNT * 3, "Total received incorrect");
        assertEq(feedCount, 3, "Feed count incorrect");
    }
    
    function test_Feed_EmitsEvent() public {
        vm.startPrank(user1);
        token.approve(address(feeder), FEED_AMOUNT);
        
        vm.expectEmit(true, true, false, true);
        emit CatFeeder.CatFed(cat1, user1, FEED_AMOUNT);
        
        feeder.feed(cat1);
        
        vm.stopPrank();
    }
    
    function test_Feed_RevertsWithZeroCatId() public {
        vm.startPrank(user1);
        token.approve(address(feeder), FEED_AMOUNT);
        
        vm.expectRevert("Invalid catId");
        feeder.feed(bytes32(0));
        
        vm.stopPrank();
    }
    
    // ============================================
    // DECAY TESTS - Tokens go to Care Fund
    // ============================================
    
    function test_Decay_GoesToCareFund() public {
        vm.startPrank(user1);
        token.approve(address(feeder), FEED_AMOUNT);
        feeder.feed(cat1);
        vm.stopPrank();
        
        // Fast forward 24 hours (full decay period)
        vm.warp(block.timestamp + 24 hours);
        
        // Process decay
        feeder.processDecayForCat(cat1);
        
        // Bowl should be empty
        (uint256 currentAmount,,,,) = feeder.getCatBowl(cat1);
        assertEq(currentAmount, 0, "Bowl should be empty");
        
        // Care Fund should have the decayed tokens
        assertEq(feeder.careFundBalance(), FEED_AMOUNT, "Care Fund should have decayed tokens");
    }
    
    function test_Decay_PartialAfterHalfPeriod() public {
        vm.startPrank(user1);
        token.approve(address(feeder), FEED_AMOUNT);
        feeder.feed(cat1);
        vm.stopPrank();
        
        // Fast forward 12 hours (half decay period)
        vm.warp(block.timestamp + 12 hours);
        
        (uint256 currentAmount, uint256 pendingDecay,,,) = feeder.getCatBowl(cat1);
        
        // Should have ~50% decayed
        assertApproxEqRel(pendingDecay, FEED_AMOUNT / 2, 0.01e18, "Decay should be ~50%");
        assertApproxEqRel(currentAmount, FEED_AMOUNT / 2, 0.01e18, "Remaining should be ~50%");
    }
    
    function test_Decay_ProcessedOnNextFeed() public {
        vm.startPrank(user1);
        token.approve(address(feeder), FEED_AMOUNT * 2);
        
        // First feed
        feeder.feed(cat1);
        
        // Fast forward 24 hours
        vm.warp(block.timestamp + 24 hours);
        
        // Second feed should trigger decay processing
        feeder.feed(cat1);
        
        vm.stopPrank();
        
        // Care Fund should have received decayed tokens from first feed
        assertEq(feeder.careFundBalance(), FEED_AMOUNT, "Decay should go to Care Fund");
        
        // Bowl should only have new feed amount
        (uint256 currentAmount,,,,) = feeder.getCatBowl(cat1);
        assertEq(currentAmount, FEED_AMOUNT, "Bowl should have new feed amount");
    }
    
    // ============================================
    // FAUCET TESTS
    // ============================================
    
    function test_ClaimFromFaucet_OnlyOperator() public {
        vm.prank(faucetOperator);
        feeder.claimFromFaucet(user1, 100 * 10**18);
        
        assertEq(token.balanceOf(user1), 10100 * 10**18, "User should receive tokens");
    }
    
    function test_ClaimFromFaucet_RevertsForNonOperator() public {
        vm.prank(user1);
        vm.expectRevert("Only faucet operator");
        feeder.claimFromFaucet(user1, 100 * 10**18);
    }
    
    function test_ClaimFromFaucet_RevertsIfInsufficientBalance() public {
        vm.prank(faucetOperator);
        vm.expectRevert("Insufficient faucet balance");
        feeder.claimFromFaucet(user1, INITIAL_FAUCET + 1);
    }
    
    // ============================================
    // CARE FUND TESTS
    // ============================================
    
    function test_WithdrawCareFund_OnlyOwner() public {
        // First accumulate some care fund via decay
        vm.startPrank(user1);
        token.approve(address(feeder), FEED_AMOUNT);
        feeder.feed(cat1);
        vm.stopPrank();
        
        // Fast forward and decay
        vm.warp(block.timestamp + 24 hours);
        feeder.processDecayForCat(cat1);
        
        uint256 careFund = feeder.careFundBalance();
        assertTrue(careFund > 0, "Care fund should have balance");
        
        // Withdraw as owner
        vm.prank(owner);
        feeder.withdrawCareFund(shelter, careFund);
        
        assertEq(token.balanceOf(shelter), careFund, "Shelter should receive funds");
        assertEq(feeder.careFundBalance(), 0, "Care fund should be empty");
    }
    
    function test_RefillFaucetFromCareFund() public {
        // First accumulate some care fund via decay
        vm.startPrank(user1);
        token.approve(address(feeder), FEED_AMOUNT);
        feeder.feed(cat1);
        vm.stopPrank();
        
        // Fast forward and decay
        vm.warp(block.timestamp + 24 hours);
        feeder.processDecayForCat(cat1);
        
        uint256 careFundBefore = feeder.careFundBalance();
        uint256 faucetBefore = feeder.faucetBalance();
        
        // Refill faucet from care fund
        vm.prank(owner);
        feeder.refillFaucetFromCareFund(careFundBefore);
        
        assertEq(feeder.careFundBalance(), 0, "Care fund should be empty");
        assertEq(feeder.faucetBalance(), faucetBefore + careFundBefore, "Faucet should increase");
    }
    
    // ============================================
    // DAILY FEED LIMIT TESTS
    // ============================================
    
    function test_DailyLimit_AllowsFiftyFeeds() public {
        vm.startPrank(user1);
        token.approve(address(feeder), FEED_AMOUNT * 50);
        
        // Should allow 50 feeds
        for (uint i = 0; i < 50; i++) {
            feeder.feed(cat1);
        }
        
        vm.stopPrank();
        
        (uint256 remaining,) = feeder.getRemainingFeeds(user1);
        assertEq(remaining, 0, "Should have 0 remaining feeds");
    }
    
    function test_DailyLimit_BlocksFiftyFirstFeed() public {
        vm.startPrank(user1);
        token.approve(address(feeder), FEED_AMOUNT * 51);
        
        // Feed 50 times
        for (uint i = 0; i < 50; i++) {
            feeder.feed(cat1);
        }
        
        // 51st should fail
        vm.expectRevert("Daily feed limit reached (50/day)");
        feeder.feed(cat1);
        
        vm.stopPrank();
    }
    
    function test_DailyLimit_ResetsAfter24Hours() public {
        vm.startPrank(user1);
        token.approve(address(feeder), FEED_AMOUNT * 100);
        
        // Feed 50 times
        for (uint i = 0; i < 50; i++) {
            feeder.feed(cat1);
        }
        
        // Fast forward 24 hours
        vm.warp(block.timestamp + 24 hours);
        
        // Should allow feeding again
        feeder.feed(cat1);
        
        vm.stopPrank();
        
        (uint256 remaining,) = feeder.getRemainingFeeds(user1);
        assertEq(remaining, 49, "Should have 49 remaining after reset + 1 feed");
    }
    
    // ============================================
    // FULL CYCLE TEST
    // ============================================
    
    function test_FullCycle_FeedDecayRefill() public {
        // 1. User feeds cat
        vm.startPrank(user1);
        token.approve(address(feeder), FEED_AMOUNT);
        feeder.feed(cat1);
        vm.stopPrank();
        
        // Verify bowl has tokens
        (uint256 currentAmount,,,,) = feeder.getCatBowl(cat1);
        assertEq(currentAmount, FEED_AMOUNT, "Bowl should have 100%");
        
        // 2. Wait for decay
        vm.warp(block.timestamp + 24 hours);
        
        // 3. Process decay
        feeder.processDecayForCat(cat1);
        
        // 4. Verify Care Fund received decayed tokens
        assertEq(feeder.careFundBalance(), FEED_AMOUNT, "Care Fund should have decayed tokens");
        
        // 5. Admin refills faucet from Care Fund
        uint256 faucetBefore = feeder.faucetBalance();
        vm.prank(owner);
        feeder.refillFaucetFromCareFund(FEED_AMOUNT);
        
        assertEq(feeder.faucetBalance(), faucetBefore + FEED_AMOUNT, "Faucet should be refilled");
        assertEq(feeder.careFundBalance(), 0, "Care Fund should be empty after refill");
        
        // 6. Faucet operator can distribute to new users
        vm.prank(faucetOperator);
        feeder.claimFromFaucet(user2, 100 * 10**18);
        
        // 7. New user feeds (continuing the cycle)
        vm.startPrank(user2);
        token.approve(address(feeder), FEED_AMOUNT);
        feeder.feed(cat2);
        vm.stopPrank();
        
        // Cycle continues!
    }
}
