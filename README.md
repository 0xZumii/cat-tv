# 🐱 Cat TV

A frictionless social pet platform where communities come together to care for cats. Built with React, TypeScript, Firebase, and Solidity.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Styling** | Tailwind CSS |
| **Backend** | Firebase (Auth, Firestore, Storage, Functions) |
| **Smart Contracts** | Solidity + Foundry |
| **Blockchain** | Base (Ethereum L2) |
| **Payments** | Stripe (fiat) |

## Project Structure

```
cat-tv/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Firebase config, utilities
│   └── types/              # TypeScript types
├── contracts/              # Solidity smart contracts
│   ├── CatFeeder.sol       # Main contract
│   ├── test/               # Foundry tests
│   └── script/             # Deployment scripts
├── functions/              # Firebase Cloud Functions
└── public/                 # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase CLI (`npm install -g firebase-tools`)
- Foundry (for contracts)

### Installation

```bash
# Install frontend dependencies
npm install

# Install function dependencies
cd functions && npm install && cd ..

# Start development server
npm run dev
```

### Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Anonymous)
3. Enable Firestore Database
4. Enable Storage
5. Update `src/lib/firebase.ts` with your config

### Deploy

```bash
# Build frontend
npm run build

# Deploy everything to Firebase
firebase deploy
```

## Token Economics

Cat TV uses $CATTV, a care-energy token with a circular economy:

```
User claims daily food (100 CATTV)
         ↓
User feeds cat (10 CATTV each)
         ↓
Food fills cat's bowl (100%)
         ↓
Bowl decays over 24h → Care Fund
         ↓
Care Fund refills faucet (admin)
         ↓
Cycle continues ♻️
```

**Key Parameters:**
- Daily claim: 100 CATTV
- Feed cost: 10 CATTV
- Max feeds/day: 50
- Decay period: 24 hours

## Smart Contract

The `CatFeeder.sol` contract handles:
- Feeding cats (tokens → bowl)
- Decay mechanics (bowl → Care Fund)
- Faucet operations (distribute to users)
- Daily feed limits (50/day)

### Testing

```bash
cd contracts
forge install OpenZeppelin/openzeppelin-contracts --no-commit
forge test -vvv
```

### Deployment

```bash
export PRIVATE_KEY="0x..."
export CATTV_TOKEN="0x..."
export FAUCET_OPERATOR="0x..."

forge script script/DeployCatFeeder.s.sol:DeployCatFeeder \
  --rpc-url https://mainnet.base.org \
  --broadcast
```

## Fiat Purchases

Stripe integration allows users to support Cat TV without knowing it's crypto:

| Tier | Price | CATTV | Cats Fed |
|------|-------|-------|----------|
| 1 | $1 | 100 | 10 |
| 2 | $5 | 500 | 50 |
| 3 | $10 | 1000 | 100 |

Purchases support the Care Fund, which funds:
- Real cat shelter donations
- Platform sustainability
- Community growth

## Contributing

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a PR

## License

MIT
