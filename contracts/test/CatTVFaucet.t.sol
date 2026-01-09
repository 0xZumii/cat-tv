// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/CatTVFaucet.sol";
import "../src/TestCATTV.sol";

contract CatTVFaucetTest is Test {
        CatTVFaucet public faucet;
            TestCATTV public token;

                address public owner = address(this);
                    address public distributor = makeAddr("distributor");
                        address public user1 = makeAddr("user1");
                            address public user2 = makeAddr("user2");
                                address public user3 = makeAddr("user3");

                                    uint256 public constant CLAIM_AMOUNT = 100 * 10 ** 18; // 100 tokens
                                        uint256 public constant CLAIM_COOLDOWN = 24 hours;
                                            uint256 public constant INITIAL_FAUCET_BALANCE = 10_000_000 * 10 ** 18;

                                                function setUp() public {
                                                            // Warp to a realistic timestamp (avoids issues with timestamp 0/1)
                                                                    vm.warp(1700000000);

                                                                            // Deploy token
                                                                                    token = new TestCATTV();

                                                                                            // Deploy faucet
                                                                                                    faucet = new CatTVFaucet(
                                                                                                                    address(token),
                                                                                                                                CLAIM_AMOUNT,
                                                                                                                                            CLAIM_COOLDOWN
                                                                                                    );

                                                                                                            // Fund the faucet
                                                                                                                    token.approve(address(faucet), INITIAL_FAUCET_BALANCE);
                                                                                                                            faucet.fundFaucet(INITIAL_FAUCET_BALANCE);

                                                                                                                                    // Add distributor
                                                                                                                                            faucet.setDistributor(distributor, true);
                                                }

                                                    // ============================================
                                                        // DEPLOYMENT TESTS
                                                            // ============================================

                                                                function test_DeploymentSetsCorrectValues() public view {
                                                                            assertEq(address(faucet.token()), address(token));
                                                                                    assertEq(faucet.claimAmount(), CLAIM_AMOUNT);
                                                                                            assertEq(faucet.claimCooldown(), CLAIM_COOLDOWN);
                                                                                                    assertEq(faucet.owner(), owner);
                                                                }

                                                                    function test_FaucetIsFunded() public view {
                                                                                assertEq(faucet.faucetBalance(), INITIAL_FAUCET_BALANCE);
                                                                    }

                                                                        function test_OwnerIsAuthorizedDistributor() public view {
                                                                                    assertTrue(faucet.authorizedDistributors(owner));
                                                                        }

                                                                            function test_DistributorIsAuthorized() public view {
                                                                                        assertTrue(faucet.authorizedDistributors(distributor));
                                                                            }

                                                                                // ============================================
                                                                                    // DIRECT CLAIM TESTS
                                                                                        // ============================================

                                                                                            function test_UserCanClaim() public {
                                                                                                        vm.prank(user1);
                                                                                                                faucet.claim();

                                                                                                                        assertEq(token.balanceOf(user1), CLAIM_AMOUNT);
                                                                                                                                assertEq(faucet.totalClaims(), 1);
                                                                                                                                        assertEq(faucet.totalDistributed(), CLAIM_AMOUNT);
                                                                                            }

                                                                                                function test_CanUserClaim_ReturnsTrue_WhenNeverClaimed() public view {
                                                                                                            (bool canClaim, uint256 timeRemaining) = faucet.canUserClaim(user1);
                                                                                                                    assertTrue(canClaim);
                                                                                                                            assertEq(timeRemaining, 0);
                                                                                                }

                                                                                                    function test_CanUserClaim_ReturnsFalse_AfterClaim() public {
                                                                                                                vm.prank(user1);
                                                                                                                        faucet.claim();

                                                                                                                                (bool canClaim, uint256 timeRemaining) = faucet.canUserClaim(user1);
                                                                                                                                        assertFalse(canClaim);
                                                                                                                                                assertGt(timeRemaining, 0);
                                                                                                                                                        assertLe(timeRemaining, CLAIM_COOLDOWN);
                                                                                                    }

                                                                                                        function test_UserCannotClaimTwiceInCooldown() public {
                                                                                                                    vm.prank(user1);
                                                                                                                            faucet.claim();

                                                                                                                                    vm.prank(user1);
                                                                                                                                            vm.expectRevert();
                                                                                                                                                    faucet.claim();
                                                                                                        }

                                                                                                            function test_UserCanClaimAfterCooldown() public {
                                                                                                                        vm.prank(user1);
                                                                                                                                faucet.claim();

                                                                                                                                        // Fast forward past cooldown
                                                                                                                                                vm.warp(block.timestamp + CLAIM_COOLDOWN + 1);

                                                                                                                                                        vm.prank(user1);
                                                                                                                                                                faucet.claim();

                                                                                                                                                                        assertEq(token.balanceOf(user1), CLAIM_AMOUNT * 2);
                                                                                                                                                                                assertEq(faucet.totalClaims(), 2);
                                                                                                            }

                                                                                                                // ============================================
                                                                                                                    // CLAIM FOR (DISTRIBUTOR) TESTS
                                                                                                                        // ============================================

                                                                                                                            function test_DistributorCanClaimFor() public {
                                                                                                                                        vm.prank(distributor);
                                                                                                                                                faucet.claimFor(user1);

                                                                                                                                                        assertEq(token.balanceOf(user1), CLAIM_AMOUNT);
                                                                                                                            }

                                                                                                                                function test_ClaimFor_RevertsIfNotAuthorized() public {
                                                                                                                                            vm.prank(user2);
                                                                                                                                                    vm.expectRevert(CatTVFaucet.NotAuthorized.selector);
                                                                                                                                                            faucet.claimFor(user1);
                                                                                                                                }

                                                                                                                                    function test_ClaimFor_RevertsForZeroAddress() public {
                                                                                                                                                vm.prank(distributor);
                                                                                                                                                        vm.expectRevert(CatTVFaucet.ZeroAddress.selector);
                                                                                                                                                                faucet.claimFor(address(0));
                                                                                                                                    }

                                                                                                                                        function test_ClaimFor_RespectsUserCooldown() public {
                                                                                                                                                    // User claims directly
                                                                                                                                                            vm.prank(user1);
                                                                                                                                                                    faucet.claim();

                                                                                                                                                                            // Distributor tries to claim for same user
                                                                                                                                                                                    vm.prank(distributor);
                                                                                                                                                                                            vm.expectRevert();
                                                                                                                                                                                                    faucet.claimFor(user1);
                                                                                                                                        }

                                                                                                                                            // ============================================
                                                                                                                                                // BATCH CLAIM TESTS
                                                                                                                                                    // ============================================

                                                                                                                                                        function test_BatchClaimFor() public {
                                                                                                                                                                    address[] memory recipients = new address[](3);
                                                                                                                                                                            recipients[0] = user1;
                                                                                                                                                                                    recipients[1] = user2;
                                                                                                                                                                                            recipients[2] = user3;

                                                                                                                                                                                                    vm.prank(distributor);
                                                                                                                                                                                                            faucet.batchClaimFor(recipients);

                                                                                                                                                                                                                    assertEq(token.balanceOf(user1), CLAIM_AMOUNT);
                                                                                                                                                                                                                            assertEq(token.balanceOf(user2), CLAIM_AMOUNT);
                                                                                                                                                                                                                                    assertEq(token.balanceOf(user3), CLAIM_AMOUNT);
                                                                                                                                                                                                                                            assertEq(faucet.totalClaims(), 3);
                                                                                                                                                        }

                                                                                                                                                            function test_BatchClaimFor_SkipsUsersOnCooldown() public {
                                                                                                                                                                        // User1 claims first
                                                                                                                                                                                vm.prank(user1);
                                                                                                                                                                                        faucet.claim();

                                                                                                                                                                                                address[] memory recipients = new address[](3);
                                                                                                                                                                                                        recipients[0] = user1; // On cooldown - should be skipped
                                                                                                                                                                                                                recipients[1] = user2;
                                                                                                                                                                                                                        recipients[2] = user3;

                                                                                                                                                                                                                                vm.prank(distributor);
                                                                                                                                                                                                                                        faucet.batchClaimFor(recipients);

                                                                                                                                                                                                                                                // User1 still only has 1 claim worth
                                                                                                                                                                                                                                                        assertEq(token.balanceOf(user1), CLAIM_AMOUNT);
                                                                                                                                                                                                                                                                assertEq(token.balanceOf(user2), CLAIM_AMOUNT);
                                                                                                                                                                                                                                                                        assertEq(token.balanceOf(user3), CLAIM_AMOUNT);
                                                                                                                                                                                                                                                                                assertEq(faucet.totalClaims(), 3); // Only 3, not 4
                                                                                                                                                            }

                                                                                                                                                                function test_BatchClaimFor_SkipsZeroAddress() public {
                                                                                                                                                                            address[] memory recipients = new address[](3);
                                                                                                                                                                                    recipients[0] = user1;
                                                                                                                                                                                            recipients[1] = address(0); // Should be skipped
                                                                                                                                                                                                    recipients[2] = user2;

                                                                                                                                                                                                            vm.prank(distributor);
                                                                                                                                                                                                                    faucet.batchClaimFor(recipients);

                                                                                                                                                                                                                            assertEq(faucet.totalClaims(), 2);
                                                                                                                                                                }

                                                                                                                                                                    // ============================================
                                                                                                                                                                        // OWNER FUNCTION TESTS
                                                                                                                                                                            // ============================================

                                                                                                                                                                                function test_OwnerCanSetClaimAmount() public {
                                                                                                                                                                                            uint256 newAmount = 200 * 10 ** 18;
                                                                                                                                                                                                    faucet.setClaimAmount(newAmount);
                                                                                                                                                                                                            assertEq(faucet.claimAmount(), newAmount);
                                                                                                                                                                                }

                                                                                                                                                                                    function test_OwnerCanSetCooldown() public {
                                                                                                                                                                                                uint256 newCooldown = 1 hours;
                                                                                                                                                                                                        faucet.setClaimCooldown(newCooldown);
                                                                                                                                                                                                                assertEq(faucet.claimCooldown(), newCooldown);
                                                                                                                                                                                    }

                                                                                                                                                                                        function test_OwnerCanAddDistributor() public {
                                                                                                                                                                                                    address newDistributor = makeAddr("newDistributor");
                                                                                                                                                                                                            faucet.setDistributor(newDistributor, true);
                                                                                                                                                                                                                    assertTrue(faucet.authorizedDistributors(newDistributor));
                                                                                                                                                                                        }

                                                                                                                                                                                            function test_OwnerCanRemoveDistributor() public {
                                                                                                                                                                                                        faucet.setDistributor(distributor, false);
                                                                                                                                                                                                                assertFalse(faucet.authorizedDistributors(distributor));
                                                                                                                                                                                            }

                                                                                                                                                                                                function test_OwnerCanDrainFaucet() public {
                                                                                                                                                                                                            address recipient = makeAddr("recipient");
                                                                                                                                                                                                                    uint256 drainAmount = 1000 * 10 ** 18;

                                                                                                                                                                                                                            faucet.drainFaucet(recipient, drainAmount);

                                                                                                                                                                                                                                    assertEq(token.balanceOf(recipient), drainAmount);
                                                                                                                                                                                                }

                                                                                                                                                                                                    function test_NonOwnerCannotSetClaimAmount() public {
                                                                                                                                                                                                                vm.prank(user1);
                                                                                                                                                                                                                        vm.expectRevert();
                                                                                                                                                                                                                                faucet.setClaimAmount(200 * 10 ** 18);
                                                                                                                                                                                                    }

                                                                                                                                                                                                        function test_NonOwnerCannotDrainFaucet() public {
                                                                                                                                                                                                                    vm.prank(user1);
                                                                                                                                                                                                                            vm.expectRevert();
                                                                                                                                                                                                                                    faucet.drainFaucet(user1, 1000 * 10 ** 18);
                                                                                                                                                                                                        }

                                                                                                                                                                                                            // ============================================
                                                                                                                                                                                                                // EDGE CASE TESTS
                                                                                                                                                                                                                    // ============================================

                                                                                                                                                                                                                        function test_ClaimRevertsWhenFaucetEmpty() public {
                                                                                                                                                                                                                                    // Drain the faucet
                                                                                                                                                                                                                                            faucet.drainFaucet(owner, INITIAL_FAUCET_BALANCE);

                                                                                                                                                                                                                                                    vm.prank(user1);
                                                                                                                                                                                                                                                            vm.expectRevert(CatTVFaucet.InsufficientFaucetBalance.selector);
                                                                                                                                                                                                                                                                    faucet.claim();
                                                                                                                                                                                                                        }

                                                                                                                                                                                                                            function test_AnyoneCanFundFaucet() public {
                                                                                                                                                                                                                                        uint256 fundAmount = 1000 * 10 ** 18;

                                                                                                                                                                                                                                                // Mint tokens to user1
                                                                                                                                                                                                                                                        token.mint(user1, fundAmount);

                                                                                                                                                                                                                                                                // User1 funds the faucet
                                                                                                                                                                                                                                                                        vm.startPrank(user1);
                                                                                                                                                                                                                                                                                token.approve(address(faucet), fundAmount);
                                                                                                                                                                                                                                                                                        faucet.fundFaucet(fundAmount);
                                                                                                                                                                                                                                                                                                vm.stopPrank();

                                                                                                                                                                                                                                                                                                        assertEq(faucet.faucetBalance(), INITIAL_FAUCET_BALANCE + fundAmount);
                                                                                                                                                                                                                            }

                                                                                                                                                                                                                                function test_MultipleUsersCanClaimIndependently() public {
                                                                                                                                                                                                                                            vm.prank(user1);
                                                                                                                                                                                                                                                    faucet.claim();

                                                                                                                                                                                                                                                            vm.prank(user2);
                                                                                                                                                                                                                                                                    faucet.claim();

                                                                                                                                                                                                                                                                            vm.prank(user3);
                                                                                                                                                                                                                                                                                    faucet.claim();

                                                                                                                                                                                                                                                                                            assertEq(token.balanceOf(user1), CLAIM_AMOUNT);
                                                                                                                                                                                                                                                                                                    assertEq(token.balanceOf(user2), CLAIM_AMOUNT);
                                                                                                                                                                                                                                                                                                            assertEq(token.balanceOf(user3), CLAIM_AMOUNT);
                                                                                                                                                                                                                                                                                                                    assertEq(faucet.totalClaims(), 3);
                                                                                                                                                                                                                                                                                                                            assertEq(faucet.totalDistributed(), CLAIM_AMOUNT * 3);
                                                                                                                                                                                                                                }

                                                                                                                                                                                                                                    // ============================================
                                                                                                                                                                                                                                        // FUZZ TESTS
                                                                                                                                                                                                                                            // ============================================

                                                                                                                                                                                                                                                function testFuzz_ClaimAmount(uint256 amount) public {
                                                                                                                                                                                                                                                            // Bound to reasonable values
                                                                                                                                                                                                                                                                    amount = bound(amount, 1, 1000 * 10 ** 18);

                                                                                                                                                                                                                                                                            faucet.setClaimAmount(amount);

                                                                                                                                                                                                                                                                                    vm.prank(user1);
                                                                                                                                                                                                                                                                                            faucet.claim();

                                                                                                                                                                                                                                                                                                    assertEq(token.balanceOf(user1), amount);
                                                                                                                                                                                                                                                }

                                                                                                                                                                                                                                                    function testFuzz_Cooldown(uint256 cooldown) public {
                                                                                                                                                                                                                                                                // Bound to 1 second to 7 days
                                                                                                                                                                                                                                                                        cooldown = bound(cooldown, 1, 7 days);

                                                                                                                                                                                                                                                                                faucet.setClaimCooldown(cooldown);

                                                                                                                                                                                                                                                                                        vm.prank(user1);
                                                                                                                                                                                                                                                                                                faucet.claim();

                                                                                                                                                                                                                                                                                                        // Can't claim during cooldown
                                                                                                                                                                                                                                                                                                                vm.warp(block.timestamp + cooldown - 1);
                                                                                                                                                                                                                                                                                                                        vm.prank(user1);
                                                                                                                                                                                                                                                                                                                                vm.expectRevert();
                                                                                                                                                                                                                                                                                                                                        faucet.claim();

                                                                                                                                                                                                                                                                                                                                                // Can claim after cooldown
                                                                                                                                                                                                                                                                                                                                                        vm.warp(block.timestamp + 2);
                                                                                                                                                                                                                                                                                                                                                                vm.prank(user1);
                                                                                                                                                                                                                                                                                                                                                                        faucet.claim();

                                                                                                                                                                                                                                                                                                                                                                                assertEq(token.balanceOf(user1), faucet.claimAmount() * 2);
                                                                                                                                                                                                                                                    }
}

                                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                }
                                                                                                                                                                                                                            }
                                                                                                                                                                                                                        }
                                                                                                                                                                                                        }
                                                                                                                                                                                                    }
                                                                                                                                                                                                }
                                                                                                                                                                                            }
                                                                                                                                                                                        }
                                                                                                                                                                                    }
                                                                                                                                                                                }
                                                                                                                                                                }
                                                                                                                                                            }
                                                                                                                                                        }
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            }
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                                                                    )
                                                }
}