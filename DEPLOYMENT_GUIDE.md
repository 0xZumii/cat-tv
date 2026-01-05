# 🐱 Cat TV: Deployment Guide for Beginners

This guide assumes you've never deployed a smart contract or web app before. We'll go step by step, with pictures in your head.

---

## 📋 What We're Doing (The Big Picture)

```
┌─────────────────────────────────────────────────────────────┐
│                   CAT TV DEPLOYMENT                         │
└─────────────────────────────────────────────────────────────┘

Step 1: Set up your workspace (GitHub Codespace)
         ↓
Step 2: Get some test money (Base Sepolia ETH)
         ↓
Step 3: Deploy the smart contract (CatFeeder.sol)
         ↓
Step 4: Set up the database (Firebase)
         ↓
Step 5: Deploy the website (Firebase Hosting)
         ↓
Step 6: Test everything works!
         ↓
Step 7: Go live on Base Mainnet (when ready)
```

---

## 🛠 What You Need Before Starting

1. **A GitHub account** (free) - https://github.com/signup
2. **A Google account** (for Firebase) - you probably have one
3. **A crypto wallet** (MetaMask) - https://metamask.io/download/
4. **20 minutes of focused time**

---

## STEP 1: Set Up GitHub Codespace

### 1.1 Create a new repository

1. Go to https://github.com/new
2. Name it `cat-tv`
3. Make it **Public** (required for free Codespaces)
4. Check "Add a README file"
5. Click **Create repository**

### 1.2 Upload the Cat TV code

1. On your new repo page, click **Add file** → **Upload files**
2. Drag and drop all the Cat TV files (from the zip I gave you)
3. Click **Commit changes**

### 1.3 Open a Codespace

1. On your repo page, click the green **Code** button
2. Click the **Codespaces** tab
3. Click **Create codespace on main**
4. Wait 1-2 minutes for it to load

🎉 **You now have a cloud computer with all the tools installed!**

The Codespace looks like VS Code but runs in your browser. Everything you need is here.

---

## STEP 2: Get Test Money

We'll practice on Base Sepolia (testnet) first. Fake money, real practice.

### 2.1 Set up MetaMask for Base Sepolia

1. Open MetaMask in your browser
2. Click the network dropdown (says "Ethereum Mainnet")
3. Click **Add network** → **Add a network manually**
4. Enter these details:

```
Network Name: Base Sepolia
RPC URL: https://sepolia.base.org
Chain ID: 84532
Currency Symbol: ETH
Block Explorer: https://sepolia.basescan.org
```

5. Click **Save**
6. Switch to "Base Sepolia" network

### 2.2 Get free test ETH

1. Copy your wallet address from MetaMask (click the address to copy)
2. Go to: https://www.alchemy.com/faucets/base-sepolia
3. Paste your address and request ETH
4. Wait ~30 seconds, you'll get 0.1 test ETH

### 2.3 Export your private key (CAREFUL!)

⚠️ **NEVER share your private key. NEVER use a wallet with real money for testing.**

1. In MetaMask, click the three dots → **Account details**
2. Click **Show private key**
3. Enter your password
4. Copy the private key (starts with 0x)
5. Save it somewhere safe temporarily

---

## STEP 3: Deploy the Smart Contract

Back in your GitHub Codespace terminal:

### 3.1 Install Foundry (the tool that deploys contracts)

```bash
# Copy and paste this whole block
curl -L https://foundry.paradigm.xyz | bash
source /home/codespace/.bashrc
foundryup
```

Wait for it to install (~1 minute).

### 3.2 Go to the contracts folder

```bash
cd contracts
```

### 3.3 Install the contract dependencies

```bash
forge install OpenZeppelin/openzeppelin-contracts --no-commit
```

### 3.4 Make sure it compiles

```bash
forge build
```

You should see "Compiler run successful". If you see errors, let me know!

### 3.5 Run the tests

```bash
forge test
```

You should see all tests passing (green checkmarks). This proves the code works!

### 3.6 Set up your deployment secrets

```bash
# Replace the parts in quotes with your actual values

export PRIVATE_KEY="0xYourPrivateKeyFromMetaMask"
export CATTV_TOKEN="0xbb0b50cc8efdf947b1808dabcc8bbd58121d5b07"
export FAUCET_OPERATOR="0xYourWalletAddressFromMetaMask"
```

⚠️ For testnet, the CATTV_TOKEN might not exist. We can use a mock token. Let me know if you want to deploy one.

### 3.7 Deploy to Base Sepolia (testnet)

```bash
forge script script/DeployCatFeeder.s.sol:DeployCatFeeder \
  --rpc-url https://sepolia.base.org \
  --broadcast \
  -vvvv
```

**What to look for:**
- "Contract deployed at: 0x..." ← **SAVE THIS ADDRESS!**
- "Transaction hash: 0x..."

### 3.8 Verify the contract (so people can read the code)

```bash
# Replace YOUR_CONTRACT_ADDRESS with the address from step 3.7
export CATFEEDER_ADDRESS="0xYourContractAddressHere"

forge verify-contract $CATFEEDER_ADDRESS \
  --chain-id 84532 \
  --watch \
  --constructor-args $(cast abi-encode "constructor(address,address)" $CATTV_TOKEN $FAUCET_OPERATOR) \
  contracts/CatFeeder.sol:CatFeeder
```

🎉 **Your smart contract is live on the blockchain!**

---

## STEP 4: Set Up Firebase

Firebase handles:
- User accounts (anonymous login)
- Database (who has how much food, cat info)
- File storage (cat photos)
- Website hosting

### 4.1 Create a Firebase project

1. Go to https://console.firebase.google.com/
2. Click **Add project**
3. Name it `cat-tv` (or whatever)
4. Disable Google Analytics (not needed)
5. Click **Create project**
6. Wait for it to set up, then click **Continue**

### 4.2 Enable the services we need

**Authentication:**
1. In the left sidebar, click **Build** → **Authentication**
2. Click **Get started**
3. Click **Anonymous** 
4. Toggle **Enable** ON
5. Click **Save**

**Firestore Database:**
1. Click **Build** → **Firestore Database**
2. Click **Create database**
3. Select **Start in test mode** (we'll fix security later)
4. Choose a location close to you
5. Click **Enable**

**Storage:**
1. Click **Build** → **Storage**
2. Click **Get started**
3. Click **Start in test mode**
4. Click **Next** → **Done**

### 4.3 Get your Firebase config

1. Click the gear icon ⚙️ next to "Project Overview"
2. Click **Project settings**
3. Scroll down to "Your apps"
4. Click the **</>** icon (Web)
5. Name it `cat-tv-web`
6. Click **Register app**
7. You'll see code like this - **COPY IT**:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "cat-tv-xxxxx.firebaseapp.com",
  projectId: "cat-tv-xxxxx",
  storageBucket: "cat-tv-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123..."
};
```

### 4.4 Update your code with Firebase config

Back in Codespace:

1. Open `public/index.html`
2. Find the section that says:
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
```
3. Replace it with YOUR config from step 4.3
4. Save the file (Ctrl+S or Cmd+S)

---

## STEP 5: Deploy to Firebase

### 5.1 Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 5.2 Log in to Firebase

```bash
firebase login --no-localhost
```

This will give you a URL. 
1. Copy the URL
2. Open it in a new browser tab
3. Log in with your Google account
4. Copy the authorization code
5. Paste it back in the terminal

### 5.3 Connect to your project

```bash
firebase use --add
```

Select your project from the list, then give it an alias like `default`.

### 5.4 Set up your backend secrets

```bash
cd functions
cp .env.example .env
```

Now edit the `.env` file:

```bash
# Open the file
code .env
```

Fill in:
```
SERVER_WALLET_PRIVATE_KEY=0xYourPrivateKey
CATFEEDER_ADDRESS=0xYourContractAddress
```

### 5.5 Install function dependencies

```bash
npm install
cd ..
```

### 5.6 Deploy everything!

```bash
firebase deploy
```

This deploys:
- ✅ Website (Hosting)
- ✅ Backend functions (Functions)
- ✅ Database rules (Firestore)
- ✅ File storage rules (Storage)

**Look for:** "Deploy complete!" and a URL like:
```
https://cat-tv-xxxxx.web.app
```

🎉 **Your website is LIVE!**

---

## STEP 6: Test Everything

1. Open your deployed URL in a browser
2. You should see the Cat TV homepage
3. Click "Claim Daily Food"
4. Upload a cat photo
5. Try feeding the cat

If something doesn't work, check the browser console (F12 → Console tab) for errors.

---

## STEP 7: Go Live (Mainnet)

When you're ready for real tokens:

### 7.1 Switch to Base Mainnet in MetaMask

Same steps as before, but with these settings:

```
Network Name: Base
RPC URL: https://mainnet.base.org
Chain ID: 8453
Currency Symbol: ETH
Block Explorer: https://basescan.org
```

### 7.2 Get real ETH on Base

You need ~$5-10 worth of ETH for deployment and gas:
1. Buy ETH on Coinbase
2. Send to your MetaMask address on Base network

### 7.3 Deploy for real

```bash
# Set mainnet environment
export PRIVATE_KEY="0xYourMainnetPrivateKey"
export CATTV_TOKEN="0xbb0b50cc8efdf947b1808dabcc8bbd58121d5b07"
export FAUCET_OPERATOR="0xYourMainnetWallet"

# Deploy
forge script script/DeployCatFeeder.s.sol:DeployCatFeeder \
  --rpc-url https://mainnet.base.org \
  --broadcast \
  -vvvv
```

### 7.4 Fund the Protocol Pool

After deploying, you need to send CATTV tokens to the contract:

1. Get some CATTV tokens (from your hackathon allocation)
2. Call `fundProtocolPool(amount)` on the contract

This is the "faucet reserve" that gets distributed to users.

---

## 🚨 Troubleshooting

### "forge: command not found"
```bash
source /home/codespace/.bashrc
```

### "insufficient funds"
You need test ETH. Go back to step 2.2.

### Firebase deploy fails
```bash
firebase login --reauth
```

### Contract verification fails
Try manually on Basescan:
1. Go to your contract address on basescan
2. Click "Contract" → "Verify and Publish"
3. Follow the prompts

### Website loads but functions don't work
Check that your `.env` file has the correct values:
```bash
cat functions/.env
```

---

## 💳 Stripe Setup (Optional - for fiat purchases)

If you want to accept credit card payments:

### 1. Create Stripe Account

1. Go to https://dashboard.stripe.com/register
2. Create an account (you can use test mode for hackathon)

### 2. Get API Keys

1. In Stripe dashboard, go to **Developers** → **API keys**
2. Copy your **Secret key** (starts with `sk_test_` for test mode)

### 3. Set Up Webhook

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set URL to: `https://YOUR-PROJECT.cloudfunctions.net/stripeWebhook`
4. Select event: `checkout.session.completed`
5. Copy the **Signing secret** (starts with `whsec_`)

### 4. Add to Firebase Config

```bash
firebase functions:config:set stripe.secret_key="sk_test_..." stripe.webhook_secret="whsec_..."
```

Or add to `functions/.env`:
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 5. Test Purchase

1. Open your app
2. Click a purchase tier ($1, $5, $10)
3. Use test card: `4242 4242 4242 4242` (any future date, any CVC)
4. Complete purchase
5. Check that food was added to your balance!

---

## 📞 Need Help?

Common issues:
1. **Copy/paste errors** - Make sure no extra spaces
2. **Wrong network** - Check MetaMask is on the right network
3. **Expired session** - Run `firebase login` again

---

## 🎉 Congratulations!

You just:
- ✅ Deployed a smart contract to Base
- ✅ Set up a serverless backend
- ✅ Deployed a web app
- ✅ Built crypto infrastructure invisible to users

You're a blockchain developer now. 🐱
