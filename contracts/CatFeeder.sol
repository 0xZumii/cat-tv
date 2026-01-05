// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CatFeeder
 * @notice Core contract for Cat TV - handles feeding, decay, and the circular token economy
 * @dev Tokens flow: User → Bowl (100%) → Decay → Care Fund → Faucet (admin refill)
 * 
 * The Food Cycle:
 * 1. User calls feed(catId) - costs FEED_AMOUNT (10 CATTV)
 * 2. 100% locks in cat's bowl (visual: cat eating)
 * 3. Bowl tokens decay after DECAY_PERIOD (24h)
 * 4. Decayed tokens go to Care Fund
 * 5. Admin can refill Faucet from Care Fund when needed
 */
contract CatFeeder is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============================================
    // CONSTANTS
    // ============================================
    
    uint256 public constant DECAY_PERIOD = 24 hours;
    uint256 public constant MAX_DAILY_FEEDS = 50;  // Support paying users
    uint256 public constant FEED_AMOUNT = 10 * 10**18; // 10 CATTV per feed
    
    // ============================================
    // STATE
    // ============================================
    
    /// @notice The CATTV token contract
    IERC20 public immutable cattvToken;
    
    /// @notice Address that can claim from faucet (backend wallet)
    address public faucetOperator;
    
    /// @notice Care Fund balance (receives all fed tokens after decay)
    uint256 public careFundBalance;
    
    /// @notice Faucet balance (distributed to users daily)
    uint256 public faucetBalance;
    
    /// @notice Total tokens ever fed (lifetime stat)
    uint256 public totalFed;
    
    /// @notice Total tokens decayed to Care Fund (lifetime stat)
    uint256 public totalDecayed;
    
    /// @notice Tracks each cat's bowl
    struct CatBowl {
        uint256 amount;         // Current tokens in bowl
        uint256 lastFedAt;      // Timestamp of last feed
        uint256 totalReceived;  // Lifetime tokens received
        uint256 feedCount;      // Number of times fed
    }
    
    /// @notice Tracks daily feed count per user
    struct DailyFeedTracker {
        uint256 feedCount;      // Feeds today
        uint256 dayStartTime;   // Start of current day (resets counter)
    }
    
    /// @notice catId (bytes32) => CatBowl
    mapping(bytes32 => CatBowl) public catBowls;
    
    /// @notice user address => daily feed tracker
    mapping(address => DailyFeedTracker) public dailyFeeds;
    
    /// @notice Track all cat IDs that have been fed (for batch decay processing)
    bytes32[] public fedCatIds;
    mapping(bytes32 => bool) public isFedCat;
    
    // ============================================
    // EVENTS
    // ============================================
    
    event CatFed(
        bytes32 indexed catId,
        address indexed feeder,
        uint256 amount
    );
    
    event BowlDecayed(
        bytes32 indexed catId,
        uint256 decayedAmount,
        uint256 remainingAmount
    );
    
    event FaucetClaimed(
        address indexed operator,
        address indexed recipient,
        uint256 amount
    );
    
    event CareFundWithdrawn(
        address indexed recipient,
        uint256 amount
    );
    
    event FaucetFunded(
        address indexed funder,
        uint256 amount
    );
    
    event FaucetRefilledFromCareFund(
        uint256 amount
    );
    
    event FaucetOperatorUpdated(
        address indexed oldOperator,
        address indexed newOperator
    );
    
    event DailyLimitReset(
        address indexed user,
        uint256 newDayStart
    );

    // ============================================
    // CONSTRUCTOR
    // ============================================
    
    /**
     * @param _token Address of the CATTV token
     * @param _faucetOperator Address authorized to claim from pool (backend wallet)
     */
    constructor(address _token, address _faucetOperator) Ownable(msg.sender) {
        require(_token != address(0), "Invalid token address");
        require(_faucetOperator != address(0), "Invalid operator address");
        
        cattvToken = IERC20(_token);
        faucetOperator = _faucetOperator;
    }

    // ============================================
    // CORE FUNCTIONS
    // ============================================
    
    /**
     * @notice Feed a cat - 100% goes to cat's bowl, then decays to Care Fund
     * @dev Enforces MAX_DAILY_FEEDS per user per day
     * @param catId Unique identifier for the cat (from backend)
     */
    function feed(bytes32 catId) external nonReentrant {
        require(catId != bytes32(0), "Invalid catId");
        
        // Check and update daily feed limit
        _checkAndUpdateDailyLimit(msg.sender);
        
        // Transfer tokens from user to this contract
        cattvToken.safeTransferFrom(msg.sender, address(this), FEED_AMOUNT);
        
        // Process any existing decay for this cat first
        _processDecayForCat(catId);
        
        // Update cat bowl - 100% goes to bowl
        CatBowl storage bowl = catBowls[catId];
        bowl.amount += FEED_AMOUNT;
        bowl.lastFedAt = block.timestamp;
        bowl.totalReceived += FEED_AMOUNT;
        bowl.feedCount += 1;
        
        // Track cat for batch processing
        if (!isFedCat[catId]) {
            fedCatIds.push(catId);
            isFedCat[catId] = true;
        }
        
        // Update stats
        totalFed += FEED_AMOUNT;
        
        emit CatFed(catId, msg.sender, FEED_AMOUNT);
    }
    
    /**
     * @notice Check and update daily feed limit for a user
     * @dev Resets counter if 24 hours have passed since last reset
     */
    function _checkAndUpdateDailyLimit(address user) internal {
        DailyFeedTracker storage tracker = dailyFeeds[user];
        
        // Check if we need to reset (new day)
        if (block.timestamp >= tracker.dayStartTime + 24 hours) {
            tracker.feedCount = 0;
            tracker.dayStartTime = block.timestamp;
            emit DailyLimitReset(user, block.timestamp);
        }
        
        // Check limit
        require(tracker.feedCount < MAX_DAILY_FEEDS, "Daily feed limit reached (50/day)");
        
        // Increment
        tracker.feedCount += 1;
    }
    
    /**
     * @notice Get remaining feeds for a user today
     * @param user Address to check
     * @return remaining Number of feeds left today
     * @return resetTime Timestamp when limit resets
     */
    function getRemainingFeeds(address user) external view returns (uint256 remaining, uint256 resetTime) {
        DailyFeedTracker storage tracker = dailyFeeds[user];
        
        // If never fed or day has passed, full allowance
        if (tracker.dayStartTime == 0 || block.timestamp >= tracker.dayStartTime + 24 hours) {
            return (MAX_DAILY_FEEDS, block.timestamp + 24 hours);
        }
        
        remaining = tracker.feedCount >= MAX_DAILY_FEEDS ? 0 : MAX_DAILY_FEEDS - tracker.feedCount;
        resetTime = tracker.dayStartTime + 24 hours;
    }
    
    /**
     * @notice Process decay for a single cat's bowl
     * @dev Called automatically during feed, but can also be called manually
     * @param catId The cat to process decay for
     */
    function processDecayForCat(bytes32 catId) external {
        _processDecayForCat(catId);
    }
    
    /**
     * @notice Process decay for multiple cats (batch)
     * @param catIds Array of cat IDs to process
     */
    function processDecayBatch(bytes32[] calldata catIds) external {
        for (uint256 i = 0; i < catIds.length; i++) {
            _processDecayForCat(catIds[i]);
        }
    }
    
    /**
     * @notice Process decay for all tracked cats
     * @dev Can be called by anyone - useful for keepers/cron
     * @param maxCats Maximum number of cats to process (gas limit protection)
     */
    function processDecayAll(uint256 maxCats) external {
        uint256 toProcess = fedCatIds.length < maxCats ? fedCatIds.length : maxCats;
        
        for (uint256 i = 0; i < toProcess; i++) {
            _processDecayForCat(fedCatIds[i]);
        }
    }

    // ============================================
    // FAUCET OPERATIONS (Backend Only)
    // ============================================
    
    /**
     * @notice Claim tokens from faucet to distribute to users
     * @param recipient Address to send tokens to (user's embedded wallet)
     * @param amount Amount to claim
     */
    function claimFromFaucet(address recipient, uint256 amount) external {
        require(msg.sender == faucetOperator, "Only faucet operator");
        require(amount <= faucetBalance, "Insufficient faucet balance");
        require(recipient != address(0), "Invalid recipient");
        
        faucetBalance -= amount;
        cattvToken.safeTransfer(recipient, amount);
        
        emit FaucetClaimed(msg.sender, recipient, amount);
    }
    
    /**
     * @notice Fund the faucet directly (for initial setup)
     * @param amount Amount to add to faucet
     */
    function fundFaucet(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        
        cattvToken.safeTransferFrom(msg.sender, address(this), amount);
        faucetBalance += amount;
        
        emit FaucetFunded(msg.sender, amount);
    }
    
    /**
     * @notice Refill faucet from Care Fund (admin only)
     * @dev This is how the circular economy works - Care Fund sustains the faucet
     * @param amount Amount to transfer from Care Fund to Faucet
     */
    function refillFaucetFromCareFund(uint256 amount) external onlyOwner {
        require(amount <= careFundBalance, "Insufficient Care Fund balance");
        
        careFundBalance -= amount;
        faucetBalance += amount;
        
        emit FaucetRefilledFromCareFund(amount);
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================
    
    /**
     * @notice Update the faucet operator address
     * @param newOperator New operator address
     */
    function setFaucetOperator(address newOperator) external onlyOwner {
        require(newOperator != address(0), "Invalid operator");
        
        address oldOperator = faucetOperator;
        faucetOperator = newOperator;
        
        emit FaucetOperatorUpdated(oldOperator, newOperator);
    }
    
    /**
     * @notice Withdraw from Care Fund for real-world donations
     * @param recipient Address to send funds to (shelter, charity, etc)
     * @param amount Amount to withdraw
     */
    function withdrawCareFund(address recipient, uint256 amount) external onlyOwner {
        require(amount <= careFundBalance, "Insufficient care fund");
        require(recipient != address(0), "Invalid recipient");
        
        careFundBalance -= amount;
        cattvToken.safeTransfer(recipient, amount);
        
        emit CareFundWithdrawn(recipient, amount);
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================
    
    /**
     * @notice Get a cat's bowl info with current decay calculated
     * @param catId The cat to query
     * @return currentAmount Tokens currently in bowl (after decay)
     * @return pendingDecay Tokens that will decay on next interaction
     * @return totalReceived Lifetime tokens received
     * @return feedCount Number of times fed
     * @return lastFedAt Timestamp of last feed
     */
    function getCatBowl(bytes32 catId) external view returns (
        uint256 currentAmount,
        uint256 pendingDecay,
        uint256 totalReceived,
        uint256 feedCount,
        uint256 lastFedAt
    ) {
        CatBowl storage bowl = catBowls[catId];
        
        (currentAmount, pendingDecay) = _calculateDecay(bowl);
        totalReceived = bowl.totalReceived;
        feedCount = bowl.feedCount;
        lastFedAt = bowl.lastFedAt;
    }
    
    /**
     * @notice Check if a cat's bowl has fully decayed
     * @param catId The cat to check
     */
    function isBowlEmpty(bytes32 catId) external view returns (bool) {
        CatBowl storage bowl = catBowls[catId];
        if (bowl.amount == 0) return true;
        if (bowl.lastFedAt == 0) return true;
        
        return block.timestamp >= bowl.lastFedAt + DECAY_PERIOD;
    }
    
    /**
     * @notice Get contract balances and stats
     */
    function getStats() external view returns (
        uint256 _faucetBalance,
        uint256 _careFundBalance,
        uint256 _totalFed,
        uint256 _totalDecayed,
        uint256 _trackedCats
    ) {
        return (
            faucetBalance,
            careFundBalance,
            totalFed,
            totalDecayed,
            fedCatIds.length
        );
    }
    
    /**
     * @notice Get the number of tracked cats
     */
    function getTrackedCatCount() external view returns (uint256) {
        return fedCatIds.length;
    }
    
    /**
     * @notice Get tracked cat IDs (paginated)
     * @param offset Starting index
     * @param limit Max items to return
     */
    function getTrackedCats(uint256 offset, uint256 limit) external view returns (bytes32[] memory) {
        uint256 total = fedCatIds.length;
        if (offset >= total) {
            return new bytes32[](0);
        }
        
        uint256 remaining = total - offset;
        uint256 count = remaining < limit ? remaining : limit;
        
        bytes32[] memory result = new bytes32[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = fedCatIds[offset + i];
        }
        
        return result;
    }

    // ============================================
    // INTERNAL FUNCTIONS
    // ============================================
    
    /**
     * @notice Internal decay processing for a cat - decayed tokens go to Care Fund
     */
    function _processDecayForCat(bytes32 catId) internal {
        CatBowl storage bowl = catBowls[catId];
        
        if (bowl.amount == 0 || bowl.lastFedAt == 0) {
            return;
        }
        
        (uint256 remaining, uint256 decayed) = _calculateDecay(bowl);
        
        if (decayed > 0) {
            bowl.amount = remaining;
            careFundBalance += decayed;  // Decayed tokens go to Care Fund
            totalDecayed += decayed;
            
            emit BowlDecayed(catId, decayed, remaining);
        }
    }
    
    /**
     * @notice Calculate decay for a bowl without modifying state
     * @dev Linear decay over DECAY_PERIOD
     */
    function _calculateDecay(CatBowl storage bowl) internal view returns (
        uint256 remaining,
        uint256 decayed
    ) {
        if (bowl.amount == 0 || bowl.lastFedAt == 0) {
            return (0, 0);
        }
        
        uint256 elapsed = block.timestamp - bowl.lastFedAt;
        
        if (elapsed >= DECAY_PERIOD) {
            // Fully decayed
            return (0, bowl.amount);
        }
        
        // Linear decay: decayed = amount * (elapsed / DECAY_PERIOD)
        decayed = (bowl.amount * elapsed) / DECAY_PERIOD;
        remaining = bowl.amount - decayed;
        
        return (remaining, decayed);
    }
}
