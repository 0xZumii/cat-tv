# 🧪 Cat TV Testing Guide

This guide walks you through testing Cat TV at each level.

---

## Quick Start (5 minutes)

### Test #1: Smart Contract (in Codespace)

```bash
# From project root
cd contracts

# Install dependencies (first time only)
forge install OpenZeppelin/openzeppelin-contracts --no-commit

# Run all tests
forge test

# Run with details (see what's happening)
forge test -vvv

# Run a specific test
forge test --match-test test_Feed_100PercentToBowl -vvv
```

**What you should see:**
```
[PASS] test_Feed_100PercentToBowl() (gas: 156789)
[PASS] test_Decay_GoesToCareFund() (gas: 198234)
[PASS] test_DailyLimit_AllowsFiftyFeeds() (gas: 2345678)
...
```

All green = contract logic works! ✅

---

### Test #2: Frontend Only (no backend)

The standalone `index.html` works with localStorage - no Firebase needed.

```bash
# From project root
cd /home/claude/cat-tv

# Start a simple web server
python3 -m http.server 8080
```

Then open: `http://localhost:8080/index.html`

**What to test:**
1. ✅ Click "Claim Daily Food" → Balance goes to 100
2. ✅ Upload a cat photo → Cat appears in grid
3. ✅ Click "Feed" → Balance decreases by 10, cat shows happy
4. ✅ Wait or refresh → Cat happiness decays over time
5. ✅ Try to claim again → Shows cooldown timer

This tests the UI without any backend or blockchain.

---

## Full Stack Testing (Firebase Emulators)

This tests everything locally before deploying.

### Step 1: Set up Firebase project

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Create/select project
firebase use --add
```

### Step 2: Update Firebase config

Edit `public/index.html` and add your Firebase config (from Firebase Console → Project Settings):

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123:web:abc"
};
```

### Step 3: Install function dependencies

```bash
cd functions
npm install
cd ..
```

### Step 4: Start emulators

```bash
firebase emulators:start
```

This starts:
- 🔥 Firestore (database) on localhost:8080
- ⚡ Functions (backend) on localhost:5001
- 🔐 Auth on localhost:9099
- 📁 Storage on localhost:9199
- 🌐 Hosting on localhost:5000

### Step 5: Enable emulator mode in frontend

Edit `public/index.html` and uncomment these lines (around line 870):

```javascript
if (location.hostname === 'localhost') {
  auth.useEmulator('http://localhost:9099');
  db.useEmulator('localhost', 8080);
  storage.useEmulator('localhost', 9199);
  functions.useEmulator('localhost', 5001);
}
```

### Step 6: Open and test

Go to: `http://localhost:5000`

**What to test:**
1. ✅ Page loads, anonymous auth works
2. ✅ Claim daily food → Check Firestore emulator UI for user document
3. ✅ Upload cat → Check Storage emulator for image
4. ✅ Feed cat → Check feedEvents in Firestore
5. ✅ Try feeding 51 times → Should get "Daily limit reached"

### Viewing Emulator Data

Open: `http://localhost:4000` (Emulator UI)

You can see:
- All users in Authentication
- All documents in Firestore
- All files in Storage
- Function logs

---

## Testnet Testing (Base Sepolia)

This tests real blockchain transactions with fake money.

### Step 1: Get test ETH

1. Set up MetaMask for Base Sepolia (see DEPLOYMENT_GUIDE.md)
2. Get test ETH from: https://www.alchemy.com/faucets/base-sepolia

### Step 2: Deploy contract to testnet

```bash
cd contracts

# Set environment
export PRIVATE_KEY="0xYourPrivateKey"
export CATTV_TOKEN="0xbb0b50cc8efdf947b1808dabcc8bbd58121d5b07"
export FAUCET_OPERATOR="0xYourWalletAddress"

# Deploy
forge script script/DeployCatFeeder.s.sol:DeployCatFeeder \
  --rpc-url https://sepolia.base.org \
  --broadcast \
  -vvvv
```

Save the deployed contract address!

### Step 3: Update backend config

Edit `functions/.env`:
```
SERVER_WALLET_PRIVATE_KEY=0x...
CATFEEDER_ADDRESS=0x... (from step 2)
RPC_URL=https://sepolia.base.org
```

### Step 4: Deploy Firebase

```bash
firebase deploy
```

### Step 5: Test the full flow

1. Open your deployed URL
2. Claim daily food
3. Feed a cat
4. Check Basescan Sepolia for the transaction!

---

## Test Checklist

### Contract Tests
- [ ] `forge test` passes all tests
- [ ] Feed goes 100% to bowl
- [ ] Decay sends tokens to Care Fund
- [ ] Daily limit blocks 51st feed
- [ ] Limit resets after 24 hours
- [ ] Faucet can be refilled from Care Fund

### Frontend Tests
- [ ] Page loads without errors
- [ ] Balance displays correctly
- [ ] Claim button works (and shows cooldown)
- [ ] Cat upload works (drag & drop + click)
- [ ] Feed button works
- [ ] Happiness badge updates
- [ ] Toast notifications appear
- [ ] Support section displays

### Backend Tests (with emulators)
- [ ] Anonymous auth works
- [ ] User document created in Firestore
- [ ] Balance updates persist
- [ ] Feed events logged
- [ ] Daily limit enforced
- [ ] Cat images stored

### Integration Tests (testnet)
- [ ] Contract deployed successfully
- [ ] Transactions appear on Basescan
- [ ] Gas costs are reasonable
- [ ] Full loop works (claim → feed → decay)

---

## Common Issues

### "forge: command not found"
```bash
source ~/.bashrc
# or
foundryup
```

### "No such file: openzeppelin"
```bash
cd contracts
forge install OpenZeppelin/openzeppelin-contracts --no-commit
```

### Firebase emulator won't start
```bash
# Kill existing processes
lsof -ti:8080 | xargs kill -9
lsof -ti:5001 | xargs kill -9

# Try again
firebase emulators:start
```

### "auth/configuration-not-found"
Make sure you've added your Firebase config to `public/index.html`

### Contract test fails with "insufficient balance"
The test setup gives users 10,000 tokens. If you're testing 50+ feeds, you need more:
```solidity
token.transfer(user1, 10000 * 10**18);  // Increase this
```

---

## Testing Without a Token

For testnet, you might not have the real CATTV token. Options:

### Option A: Deploy a mock token

```bash
cd contracts

# Create deployment script for mock token
forge create test/MockCATTV.sol:MockCATTV \
  --rpc-url https://sepolia.base.org \
  --private-key $PRIVATE_KEY
```

Use this mock token address instead of the real CATTV for testing.

### Option B: Test off-chain only

Set `CATFEEDER_ADDRESS` to the zero address - the on-chain calls will fail silently but the off-chain (Firebase) flow still works.

---

## Ready for Mainnet?

Before going live:
- [ ] All tests pass
- [ ] Tested full flow on Sepolia
- [ ] Contract verified on Basescan
- [ ] Firebase security rules deployed
- [ ] Wallet funded with real ETH + CATTV
- [ ] Faucet funded with 200M CATTV

Then follow DEPLOYMENT_GUIDE.md Step 7!
