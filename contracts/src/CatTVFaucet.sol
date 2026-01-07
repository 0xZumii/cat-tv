// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CatTVFaucet
 * @notice A faucet contract that distributes $CATTV tokens to users daily
 * @dev Users can claim tokens once every 24 hours. The contract owner can
 *      fund the faucet and adjust claim parameters.
 */
contract CatTVFaucet is Ownable, ReentrancyGuard {
    // ============================================
    // STATE VARIABLES
    // ============================================

    /// @notice The $CATTV token contract
    IERC20 public immutable token;

    /// @notice Amount of tokens distributed per claim (in wei, 18 decimals)
    uint256 public claimAmount;

    /// @notice Cooldown period between claims (in seconds)
    uint256 public claimCooldown;

    /// @notice Mapping of user address to their last claim timestamp
    mapping(address => uint256) public lastClaimTime;

    /// @notice Total number of claims made
    uint256 public totalClaims;

    /// @notice Total tokens distributed
    uint256 public totalDistributed;

    /// @notice Authorized distributors who can claim on behalf of users
    mapping(address => bool) public authorizedDistributors;

    // ============================================
    // EVENTS
    // ============================================

    event Claimed(address indexed user, uint256 amount, uint256 timestamp);
    event ClaimAmountUpdated(uint256 oldAmount, uint256 newAmount);
    event ClaimCooldownUpdated(uint256 oldCooldown, uint256 newCooldown);
    event FaucetFunded(address indexed funder, uint256 amount);
    event FaucetDrained(address indexed to, uint256 amount);
    event DistributorUpdated(address indexed distributor, bool authorized);

    // ============================================
    // ERRORS
    // ============================================

    error ClaimTooSoon(uint256 timeRemaining);
    error InsufficientFaucetBalance();
    error ZeroAddress();
    error NotAuthorized();

    // ============================================
    // CONSTRUCTOR
    // ============================================

    /**
     * @notice Initialize the faucet with token address and default parameters
     * @param _token Address of the $CATTV token contract
     * @param _claimAmount Initial claim amount (in wei, with 18 decimals)
     * @param _claimCooldown Initial cooldown period in seconds (default: 86400 = 24 hours)
     */
    constructor(
        address _token,
        uint256 _claimAmount,
        uint256 _claimCooldown
    ) Ownable(msg.sender) {
        if (_token == address(0)) revert ZeroAddress();

        token = IERC20(_token);
        claimAmount = _claimAmount;
        claimCooldown = _claimCooldown;

        // Owner is automatically an authorized distributor
        authorizedDistributors[msg.sender] = true;
    }

    // ============================================
    // USER FUNCTIONS
    // ============================================

    /**
     * @notice Claim daily tokens (user calls directly)
     * @dev Reverts if cooldown hasn't passed or faucet is empty
     */
    function claim() external nonReentrant {
        _processClaim(msg.sender);
    }

    /**
     * @notice Check if a user can claim
     * @param user Address to check
     * @return canClaim Whether the user can claim now
     * @return timeRemaining Seconds until next claim (0 if can claim)
     */
    function canUserClaim(address user) external view returns (bool canClaim, uint256 timeRemaining) {
        uint256 lastClaim = lastClaimTime[user];
        uint256 nextClaimTime = lastClaim + claimCooldown;

        if (block.timestamp >= nextClaimTime) {
            return (true, 0);
        } else {
            return (false, nextClaimTime - block.timestamp);
        }
    }

    /**
     * @notice Get the faucet's current token balance
     * @return balance Current balance of tokens in the faucet
     */
    function faucetBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }

    // ============================================
    // DISTRIBUTOR FUNCTIONS
    // ============================================

    /**
     * @notice Claim on behalf of a user (for gasless/delegated claims)
     * @dev Only authorized distributors can call this
     * @param recipient Address to receive the tokens
     */
    function claimFor(address recipient) external nonReentrant {
        if (!authorizedDistributors[msg.sender]) revert NotAuthorized();
        if (recipient == address(0)) revert ZeroAddress();

        _processClaim(recipient);
    }

    /**
     * @notice Batch claim for multiple users
     * @dev Only authorized distributors can call this. Useful for processing queued claims.
     * @param recipients Array of addresses to receive tokens
     */
    function batchClaimFor(address[] calldata recipients) external nonReentrant {
        if (!authorizedDistributors[msg.sender]) revert NotAuthorized();

        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i] != address(0)) {
                // Skip if user can't claim yet (don't revert entire batch)
                uint256 lastClaim = lastClaimTime[recipients[i]];
                if (block.timestamp >= lastClaim + claimCooldown) {
                    _processClaimUnchecked(recipients[i]);
                }
            }
        }
    }

    // ============================================
    // OWNER FUNCTIONS
    // ============================================

    /**
     * @notice Fund the faucet with tokens
     * @dev Caller must have approved this contract to spend tokens
     * @param amount Amount of tokens to add to faucet
     */
    function fundFaucet(uint256 amount) external {
        token.transferFrom(msg.sender, address(this), amount);
        emit FaucetFunded(msg.sender, amount);
    }

    /**
     * @notice Withdraw tokens from the faucet (owner only)
     * @param to Address to send tokens to
     * @param amount Amount to withdraw
     */
    function drainFaucet(address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        token.transfer(to, amount);
        emit FaucetDrained(to, amount);
    }

    /**
     * @notice Update the claim amount
     * @param newAmount New amount per claim (in wei)
     */
    function setClaimAmount(uint256 newAmount) external onlyOwner {
        uint256 oldAmount = claimAmount;
        claimAmount = newAmount;
        emit ClaimAmountUpdated(oldAmount, newAmount);
    }

    /**
     * @notice Update the cooldown period
     * @param newCooldown New cooldown in seconds
     */
    function setClaimCooldown(uint256 newCooldown) external onlyOwner {
        uint256 oldCooldown = claimCooldown;
        claimCooldown = newCooldown;
        emit ClaimCooldownUpdated(oldCooldown, newCooldown);
    }

    /**
     * @notice Add or remove an authorized distributor
     * @param distributor Address to update
     * @param authorized Whether to authorize or revoke
     */
    function setDistributor(address distributor, bool authorized) external onlyOwner {
        if (distributor == address(0)) revert ZeroAddress();
        authorizedDistributors[distributor] = authorized;
        emit DistributorUpdated(distributor, authorized);
    }

    // ============================================
    // INTERNAL FUNCTIONS
    // ============================================

    /**
     * @dev Process a claim with all checks
     */
    function _processClaim(address recipient) internal {
        uint256 lastClaim = lastClaimTime[recipient];
        uint256 nextClaimTime = lastClaim + claimCooldown;

        if (block.timestamp < nextClaimTime) {
            revert ClaimTooSoon(nextClaimTime - block.timestamp);
        }

        _processClaimUnchecked(recipient);
    }

    /**
     * @dev Process a claim without cooldown check (for batch operations)
     */
    function _processClaimUnchecked(address recipient) internal {
        uint256 balance = token.balanceOf(address(this));
        if (balance < claimAmount) revert InsufficientFaucetBalance();

        lastClaimTime[recipient] = block.timestamp;
        totalClaims++;
        totalDistributed += claimAmount;

        token.transfer(recipient, claimAmount);

        emit Claimed(recipient, claimAmount, block.timestamp);
    }
}
