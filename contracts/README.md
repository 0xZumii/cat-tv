# 🐱 Cat TV Smart Contracts

On-chain token mechanics for the Cat TV circular economy.

## The Food Cycle

```
┌─────────────────────────────────────────────────────────────────┐
│                    CATTV CIRCULAR ECONOMY                       │
└─────────────────────────────────────────────────────────────────┘

         ┌──────────────────┐
         │  Protocol Pool   │◄──────────────────────┐
         │   (Faucet Source)│                       │
         └────────┬─────────┘                       │
                  │                                 │
                  ▼ claim (backend)                 │
         ┌──────────────────┐                       │
         │   User Balance   │                       │
         │  (off-chain)     │                       │
         └────────┬─────────┘                       │
                  │                                 │
                  ▼ feed()                          │
         ┌──────────────────┐                       │
         │   CatFeeder      │                       │
         │   Contract       │                       │
         └────────┬─────────┘                       │
                  │                                 │
        ┌─────────┴─────────┐                       │
        ▼                   ▼                       │
  ┌───────────┐      ┌───────────┐                  │
  │ Cat Bowl  │      │ Care Fund │                  │
  │   (70%)   │      │   (30%)   │                  │
  └─────┬─────┘      └───────────┘                  │
        │                   │                       │
        ▼ decay (24h)       ▼ withdraw              │
        │              ┌───────────┐                │
        │              │  Shelter  │                │
        │              │ Donation  │                │
        │              └───────────┘                │
        │                                           │
        └───────────────────────────────────────────┘
                    (tokens return to pool)
```

## Token Economics

| Parameter | Value | Purpose |
|-----------|-------|---------|
| Bowl Split | 70% | Tokens lock in cat's bowl |
| Care Fund | 30% | Accumulates for real donations |
| Decay Period | 24 hours | Full decay after 24h |
| Decay Type | Linear | Gradual return to pool |

**No burn. Circular.** Tokens aren't destroyed — they're used, then recirculate.

## Contracts

### CatFeeder.sol

Main contract handling all token mechanics:

| Function | Access | Description |
|----------|--------|-------------|
| `feed(catId, amount)` | Public | Feed a cat (splits 70/30) |
| `processDecayForCat(catId)` | Public | Process decay for one cat |
| `processDecayBatch(catIds[])` | Public | Batch decay processing |
| `processDecayAll(maxCats)` | Public | Process all cats (keeper) |
| `claimFromPool(recipient, amount)` | Operator | Faucet claims for users |
| `fundProtocolPool(amount)` | Public | Add tokens to pool |
| `withdrawCareFund(recipient, amount)` | Owner | Withdraw for donations |
| `setFaucetOperator(address)` | Owner | Update backend wallet |

### View Functions

| Function | Returns |
|----------|---------|
| `getCatBowl(catId)` | Bowl state with decay calculated |
| `isBowlEmpty(catId)` | Whether bowl has fully decayed |
| `getStats()` | Pool, fund, totals, cat count |
| `getTrackedCats(offset, limit)` | Paginated cat list |

## Setup

### Prerequisites

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### Install Dependencies

```bash
cd contracts
forge install OpenZeppelin/openzeppelin-contracts
```

### Build

```bash
forge build
```

### Test

```bash
# Run all tests
forge test

# Run with verbosity
forge test -vvv

# Run specific test
forge test --match-test test_FullCycle
```

### Deploy

1. Set environment variables:

```bash
export PRIVATE_KEY=0x...               # Deployer wallet
export CATTV_TOKEN=0xbb0b50cc8efdf947b1808dabcc8bbd58121d5b07
export FAUCET_OPERATOR=0x...           # Backend wallet address
export BASE_RPC_URL=https://mainnet.base.org
export BASESCAN_API_KEY=...            # For verification
```

2. Deploy to Base:

```bash
# Testnet first (recommended)
forge script script/DeployCatFeeder.s.sol:DeployCatFeeder \
  --rpc-url base_sepolia \
  --broadcast \
  --verify

# Mainnet
forge script script/DeployCatFeeder.s.sol:DeployCatFeeder \
  --rpc-url base \
  --broadcast \
  --verify
```

3. Fund the protocol pool:

```bash
export CATFEEDER_ADDRESS=0x...  # Deployed address
export FUND_AMOUNT=1000000000000000000000000  # 1M tokens

forge script script/DeployCatFeeder.s.sol:FundPool \
  --rpc-url base \
  --broadcast
```

## Integration

### Backend (Firebase Functions)

```javascript
const { ethers } = require('ethers');

const CATFEEDER_ADDRESS = '0x...';
const CATFEEDER_ABI = [...]; // See below

// User feeds a cat
async function feedCat(catId, amount) {
  const wallet = getServerWallet();
  const feeder = new ethers.Contract(CATFEEDER_ADDRESS, CATFEEDER_ABI, wallet);
  const token = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, wallet);
  
  // User's tokens are held by backend, so backend executes
  const catIdBytes = ethers.id(catId); // Convert string to bytes32
  
  await token.approve(feeder.target, amount);
  const tx = await feeder.feed(catIdBytes, amount);
  await tx.wait();
  
  return tx.hash;
}

// Faucet claim (give tokens to user)
async function claimFromPool(userAddress, amount) {
  const wallet = getServerWallet();
  const feeder = new ethers.Contract(CATFEEDER_ADDRESS, CATFEEDER_ABI, wallet);
  
  const tx = await feeder.claimFromPool(userAddress, amount);
  await tx.wait();
  
  return tx.hash;
}
```

### Keeper (Decay Processing)

Set up a cron job or keeper to process decay periodically:

```javascript
// Run every hour
async function processDecay() {
  const feeder = new ethers.Contract(CATFEEDER_ADDRESS, CATFEEDER_ABI, wallet);
  
  // Process up to 100 cats at a time
  const tx = await feeder.processDecayAll(100);
  await tx.wait();
}
```

## ABI (Minimal)

```json
[
  "function feed(bytes32 catId, uint256 amount) external",
  "function claimFromPool(address recipient, uint256 amount) external",
  "function fundProtocolPool(uint256 amount) external",
  "function processDecayForCat(bytes32 catId) external",
  "function processDecayAll(uint256 maxCats) external",
  "function getCatBowl(bytes32 catId) view returns (uint256, uint256, uint256, uint256, uint256)",
  "function getStats() view returns (uint256, uint256, uint256, uint256, uint256)",
  "function protocolPoolBalance() view returns (uint256)",
  "function careFundBalance() view returns (uint256)",
  "event CatFed(bytes32 indexed catId, address indexed feeder, uint256 amount, uint256 toBowl, uint256 toCareFund)",
  "event BowlDecayed(bytes32 indexed catId, uint256 decayedAmount, uint256 remainingAmount)"
]
```

## Security Notes

1. **Faucet Operator**: Only this address can claim from pool — keep this key secure
2. **Owner**: Can withdraw Care Fund and change operator — use a multisig for mainnet
3. **Reentrancy**: Contract uses ReentrancyGuard
4. **Approvals**: Users must approve CatFeeder to spend their CATTV

## Gas Estimates

| Operation | Estimated Gas |
|-----------|---------------|
| feed() | ~80,000 |
| processDecayForCat() | ~50,000 |
| claimFromPool() | ~60,000 |
| fundProtocolPool() | ~70,000 |

At 0.001 gwei on Base, these are effectively free.

---

Built for cats 🐱
