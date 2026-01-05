# 🐱 Cat TV

A collective digital pet care platform where the community shares responsibility for cats' wellbeing. Built on Base with crypto-invisible UX.

## Token Details

- **Contract**: `0xbb0b50cc8efdf947b1808dabcc8bbd58121d5b07`
- **Network**: Base Mainnet
- **Tokenomics**: 90% burn / 10% treasury on each feed

## Project Structure

```
cat-tv/
├── public/
│   └── index.html          # Frontend (single file)
├── functions/
│   ├── index.js            # Cloud Functions (backend)
│   ├── package.json        # Dependencies
│   └── .env.example        # Environment vars template
├── firebase.json           # Firebase config
├── firestore.rules         # Database security rules
├── firestore.indexes.json  # Database indexes
├── storage.rules           # File storage rules
└── README.md
```

## Setup Guide

### 1. Prerequisites

- Node.js 18+ 
- Firebase CLI: `npm install -g firebase-tools`
- A Firebase project (free tier works)
- A wallet with your token + ETH for gas on Base

### 2. Firebase Setup

```bash
# Login to Firebase
firebase login

# Initialize project (select existing project or create new)
firebase init

# Select these features:
# - Firestore
# - Functions  
# - Hosting
# - Storage
```

### 3. Get Your Firebase Config

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project → Project Settings → General
3. Scroll to "Your apps" → Click web icon `</>`
4. Copy the `firebaseConfig` object

### 4. Update Frontend Config

Edit `public/index.html` and replace the placeholder config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### 5. Configure Server Wallet

Create `functions/.env` (copy from `.env.example`):

```bash
cd functions
cp .env.example .env
```

Edit `.env` with your values:

```
SERVER_WALLET_PRIVATE_KEY=0xYourPrivateKeyHere
TREASURY_ADDRESS=0xYourTreasuryAddress
```

⚠️ **IMPORTANT**: 
- This wallet will sign transactions on behalf of users
- Fund it with your token (for user claims) + Base ETH (for gas)
- Never commit `.env` to git!

### 6. Install Dependencies

```bash
cd functions
npm install
```

### 7. Deploy

```bash
# Deploy everything
firebase deploy

# Or deploy individually:
firebase deploy --only firestore:rules
firebase deploy --only functions
firebase deploy --only hosting
```

### 8. Fund the Faucet

Transfer tokens to your server wallet address. Each daily claim gives users 5 tokens, so budget accordingly.

---

## Local Development

```bash
# Start emulators (Firestore, Functions, Auth, Storage)
firebase emulators:start

# Frontend will auto-connect to emulators on localhost
```

Uncomment the emulator lines in `public/index.html`:

```javascript
if (location.hostname === 'localhost') {
  auth.useEmulator('http://localhost:9099');
  db.useEmulator('localhost', 8080);
  storage.useEmulator('localhost', 9199);
  functions.useEmulator('localhost', 5001);
}
```

---

## Token Flow

```
User clicks "Claim"
       │
       ▼
Cloud Function: claimDaily()
       │
       ├── Check 24h cooldown
       ├── Add 5 to off-chain balance (Firestore)
       └── Return new balance

User clicks "Feed"
       │
       ▼
Cloud Function: feed()
       │
       ├── Check balance ≥ 1
       ├── Deduct from off-chain balance
       ├── Update cat happiness
       ├── Log feed event
       │
       └── Async: executeOnChainFeed()
              │
              ├── 10% → Treasury wallet
              └── 90% → Burn address (0x...dEaD)
```

---

## API Reference

### Cloud Functions

| Function | Description |
|----------|-------------|
| `getUser()` | Get or create user document |
| `claimDaily()` | Claim daily token allowance |
| `feed({ catId })` | Feed a cat (costs 1 token) |
| `addCat({ name, mediaUrl, mediaType })` | Add a new cat |
| `getCats()` | Get all cats |
| `getStats()` | Get global statistics |

---

## Firestore Schema

```javascript
// users/{odUserId}
{
  balance: number,        // Off-chain token balance
  lastClaimAt: timestamp, // Last daily claim
  totalFeeds: number,     // Lifetime feeds given
  createdAt: timestamp
}

// cats/{catId}
{
  name: string,
  mediaUrl: string,       // Firebase Storage URL
  mediaType: 'image' | 'video',
  totalFed: number,
  lastFedAt: timestamp,
  createdAt: timestamp,
  createdBy: string       // userId
}

// feedEvents/{eventId}
{
  userId: string,
  catId: string,
  amount: number,
  timestamp: timestamp
}

// stats/global
{
  totalFeeds: number
}
```

---

## Security Notes

1. **Server wallet**: Only the backend can execute on-chain transactions
2. **Rate limiting**: Users can only claim once per 24h (enforced server-side)
3. **File uploads**: Limited to 5MB, images/videos only
4. **Firestore rules**: Users can only read their own data, all writes go through Functions

---

## Troubleshooting

**"Firebase config not found"**
- Make sure you replaced the placeholder config in `public/index.html`

**"Permission denied" on Firestore**
- Deploy the security rules: `firebase deploy --only firestore:rules`

**"Function not found"**
- Deploy functions: `firebase deploy --only functions`

**On-chain transactions failing**
- Check server wallet has enough ETH for gas
- Check server wallet has enough tokens
- Verify RPC_URL is correct

---

## Future Enhancements

- [ ] 24/7 cat livestream integration
- [ ] Stripe integration (buy food with credit card)
- [ ] Real cat shelter feeding (IoT dispensers)
- [ ] Cat adoption/sponsorship
- [ ] Community moderation tools

---

Built with 💛 for cats everywhere
