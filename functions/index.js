const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const { ethers } = require('ethers');
const cors = require('cors')({ origin: true });
const { PrivyClient } = require('@privy-io/server-auth');

// Define secrets
const serverWalletKey = defineSecret('SERVER_WALLET_PRIVATE_KEY');
const privySecret = defineSecret('PRIVY_APP_SECRET');

admin.initializeApp();
const db = admin.firestore();

// Privy configuration
const PRIVY_APP_ID = 'cmk3cnogu0517ky0dl6r7k98d';

// Helper to get Privy client (initialized lazily to access secret at runtime)
function getPrivyClient() {
  return new PrivyClient(PRIVY_APP_ID, process.env.PRIVY_APP_SECRET);
}

// Helper to verify Privy token and get user ID
async function verifyPrivyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const privy = getPrivyClient();
    const verifiedClaims = await privy.verifyAuthToken(token);
    return verifiedClaims.userId;
  } catch (error) {
    console.error('[Privy] Token verification failed:', error.message);
    return null;
  }
}

// Helper to create authenticated HTTP endpoints
function createAuthenticatedEndpoint(handler) {
  return onRequest({ secrets: [serverWalletKey, privySecret] }, async (req, res) => {
    // Handle CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    // Verify Privy token
    const userId = await verifyPrivyToken(req.headers.authorization);
    if (!userId) {
      res.status(401).json({ error: { message: 'Must be logged in', status: 'UNAUTHENTICATED' } });
      return;
    }

    try {
      const data = req.body?.data || {};
      const result = await handler(data, userId);
      res.json({ result });
    } catch (error) {
      console.error('[Function Error]', error);
      const status = error.httpErrorCode?.status || 500;
      const message = error.message || 'Internal error';
      res.status(status).json({ error: { message, status: error.code || 'INTERNAL' } });
    }
  });
}

// Helper to create public (unauthenticated) HTTP endpoints
function createPublicEndpoint(handler) {
  return onRequest(async (req, res) => {
    // Handle CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    try {
      const data = req.body?.data || {};
      const result = await handler(data);
      res.json({ result });
    } catch (error) {
      console.error('[Function Error]', error);
      const status = error.httpErrorCode?.status || 500;
      const message = error.message || 'Internal error';
      res.status(status).json({ error: { message, status: error.code || 'INTERNAL' } });
    }
  });
}

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
  // Token contract on Base
  TOKEN_ADDRESS: '0xBb0B50CC8EFDF947b1808dabcc8Bbd58121D5B07',

  // CatTVFaucet contract (deploy and update this!)
  FAUCET_ADDRESS: process.env.FAUCET_ADDRESS || '0x0000000000000000000000000000000000000000',

  // CatFeeder contract (for feeding cats - optional)
  CATFEEDER_ADDRESS: process.env.CATFEEDER_ADDRESS || '0x0000000000000000000000000000000000000000',

  // Base Mainnet RPC (use your own for production)
  RPC_URL: process.env.RPC_URL || 'https://mainnet.base.org',

  // Game parameters (adjusted for 100B supply)
  DAILY_AMOUNT: 100,      // 100 tokens per day
  FEED_COST: 10,          // 10 tokens per feed
  MAX_DAILY_FEEDS: 100,   // 100 feeds per day (supports paying users)
  CLAIM_COOLDOWN_MS: 24 * 60 * 60 * 1000, // 24 hours

  // Token decimals (standard ERC-20)
  TOKEN_DECIMALS: 18,

  // Stripe purchase tiers (fixed in-app rate: $1 = 100 CATTV)
  PURCHASE_TIERS: {
    tier1: { priceUsd: 1, priceCents: 100, cattv: 100, catsCanFeed: 10 },
    tier2: { priceUsd: 5, priceCents: 500, cattv: 500, catsCanFeed: 50 },
    tier3: { priceUsd: 10, priceCents: 1000, cattv: 1000, catsCanFeed: 100 },
  },
};

// ERC-20 ABI (minimal)
const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
];

// CatTVFaucet ABI (for daily claims)
const FAUCET_ABI = [
  'function claimFor(address recipient) external',
  'function batchClaimFor(address[] recipients) external',
  'function canUserClaim(address user) view returns (bool canClaim, uint256 timeRemaining)',
  'function faucetBalance() view returns (uint256)',
  'function claimAmount() view returns (uint256)',
  'function claimCooldown() view returns (uint256)',
  'function lastClaimTime(address user) view returns (uint256)',
  'function totalClaims() view returns (uint256)',
  'function totalDistributed() view returns (uint256)',
  'event Claimed(address indexed user, uint256 amount, uint256 timestamp)',
];

// CatFeeder ABI (for feeding cats - optional future use)
const CATFEEDER_ABI = [
  'function feed(bytes32 catId) external',
  'function claimFromFaucet(address recipient, uint256 amount) external',
  'function fundFaucet(uint256 amount) external',
  'function refillFaucetFromCareFund(uint256 amount) external',
  'function processDecayForCat(bytes32 catId) external',
  'function processDecayAll(uint256 maxCats) external',
  'function getCatBowl(bytes32 catId) view returns (uint256 currentAmount, uint256 pendingDecay, uint256 totalReceived, uint256 feedCount, uint256 lastFedAt)',
  'function getStats() view returns (uint256 faucetBalance, uint256 careFundBalance, uint256 totalFed, uint256 totalDecayed, uint256 trackedCats)',
  'function faucetBalance() view returns (uint256)',
  'function careFundBalance() view returns (uint256)',
  'function FEED_AMOUNT() view returns (uint256)',
  'event CatFed(bytes32 indexed catId, address indexed feeder, uint256 amount)',
];

// ============================================
// HELPERS
// ============================================

// Get provider and wallet for on-chain interactions
function getWallet() {
  let secret = process.env.SERVER_WALLET_PRIVATE_KEY;
  if (!secret) {
    throw new Error('SERVER_WALLET_PRIVATE_KEY not configured');
  }
  const provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);

  // Strip 0x prefix if accidentally added to mnemonic
  if (secret.startsWith('0x') && secret.includes(' ')) {
    secret = secret.slice(2);
  }

  // Support both mnemonic phrases and hex private keys
  if (secret.includes(' ')) {
    // Target address we need to match
    const TARGET = '0x4A5AD5dA80ffA5de85Ca7f578B9dfEa4e411E30b'.toLowerCase();

    // Try many derivation paths
    const hdNode = ethers.HDNodeWallet.fromPhrase(secret);
    const paths = [
      "44'/60'/0'/0/0", "44'/60'/0'/0/1", "44'/60'/0'/0/2",
      "44'/60'/0'/0", "44'/60'/0'", "44'/60'/1'/0/0",
      "44'/60'/0'/1/0", "44'/60'/0'/0/3", "44'/60'/0'/0/4",
    ];

    for (const path of paths) {
      try {
        const derived = hdNode.derivePath(path);
        if (derived.address.toLowerCase() === TARGET) {
          console.log(`[getWallet] Found matching path: ${path}`);
          return derived.connect(provider);
        }
      } catch (e) { /* skip invalid paths */ }
    }

    // Fallback to standard if no match
    console.log('[getWallet] No matching path found, using default');
    return ethers.Wallet.fromPhrase(secret, provider);
  } else {
    return new ethers.Wallet(secret, provider);
  }
}

// Get token contract instance
function getTokenContract(wallet) {
  return new ethers.Contract(CONFIG.TOKEN_ADDRESS, ERC20_ABI, wallet);
}

// Get CatTVFaucet contract instance
function getFaucetContract(wallet) {
  return new ethers.Contract(CONFIG.FAUCET_ADDRESS, FAUCET_ABI, wallet);
}

// Get CatFeeder contract instance
function getCatFeederContract(wallet) {
  return new ethers.Contract(CONFIG.CATFEEDER_ADDRESS, CATFEEDER_ABI, wallet);
}

// Convert to token units (with decimals)
function toTokenUnits(amount) {
  return ethers.parseUnits(amount.toString(), CONFIG.TOKEN_DECIMALS);
}

// Convert cat ID string to bytes32
function catIdToBytes32(catId) {
  return ethers.id(catId);
}

// Calculate happiness based on last fed time
function calculateHappiness(lastFedAt) {
  if (!lastFedAt) return { level: 'sad', emoji: '😿', label: 'Hungry' };

  const now = Date.now();
  const hoursSinceFed = (now - lastFedAt) / (1000 * 60 * 60);

  if (hoursSinceFed < 6) return { level: 'happy', emoji: '😸', label: 'Happy' };
  if (hoursSinceFed < 24) return { level: 'okay', emoji: '🙂', label: 'Okay' };
  return { level: 'sad', emoji: '😿', label: 'Hungry' };
}

/**
 * Fallback claim function using direct token transfer (when faucet not deployed)
 */
async function claimDailyFallback(userData, userRef, userId) {
  // Check cooldown
  const now = Date.now();
  if (userData.lastClaimAt && (now - userData.lastClaimAt) < CONFIG.CLAIM_COOLDOWN_MS) {
    const remaining = CONFIG.CLAIM_COOLDOWN_MS - (now - userData.lastClaimAt);
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const error = new Error(`Already claimed today. Next claim in ${hours}h ${minutes}m`);
    error.httpErrorCode = { status: 400 };
    error.code = 'FAILED_PRECONDITION';
    throw error;
  }

  // Send real tokens to user's wallet via direct transfer
  let txHash = null;
  try {
    const wallet = getWallet();
    const token = getTokenContract(wallet);
    const amount = toTokenUnits(CONFIG.DAILY_AMOUNT);

    console.log(`[claimDailyFallback] Sending ${CONFIG.DAILY_AMOUNT} CATTV to ${userData.walletAddress}`);

    const tx = await token.transfer(userData.walletAddress, amount);
    await tx.wait();
    txHash = tx.hash;

    console.log(`[claimDailyFallback] Token transfer successful: ${txHash}`);
  } catch (err) {
    console.error('[claimDailyFallback] Token transfer failed:', err);
    const error = new Error('Failed to claim tokens. Please try again later.');
    error.httpErrorCode = { status: 500 };
    throw error;
  }

  // Update user record
  const updatedUser = {
    ...userData,
    balance: (userData.balance || 0) + CONFIG.DAILY_AMOUNT,
    lastClaimAt: now,
    lastClaimTxHash: txHash,
  };

  await userRef.set(updatedUser, { merge: true });

  return {
    success: true,
    claimed: CONFIG.DAILY_AMOUNT,
    txHash,
  };
}

// ============================================
// CLOUD FUNCTIONS
// ============================================

/**
 * Upload media file (image/video) for a cat
 * Receives base64-encoded file data and uploads to Storage
 */
exports.uploadMedia = createAuthenticatedEndpoint(async (data, userId) => {
  const { fileData, contentType, fileName } = data;

  if (!fileData || !contentType) {
    const error = new Error('fileData and contentType required');
    error.httpErrorCode = { status: 400 };
    error.code = 'INVALID_ARGUMENT';
    throw error;
  }

  // Validate content type
  if (!contentType.startsWith('image/') && !contentType.startsWith('video/')) {
    const error = new Error('Only images and videos are allowed');
    error.httpErrorCode = { status: 400 };
    error.code = 'INVALID_ARGUMENT';
    throw error;
  }

  // Decode base64 file
  const buffer = Buffer.from(fileData, 'base64');

  // Check file size (5MB max)
  if (buffer.length > 5 * 1024 * 1024) {
    const error = new Error('File too large. Max 5MB');
    error.httpErrorCode = { status: 400 };
    error.code = 'INVALID_ARGUMENT';
    throw error;
  }

  // Generate unique filename
  const ext = fileName?.split('.').pop() || contentType.split('/')[1] || 'jpg';
  const storagePath = `cats/${userId}/${Date.now()}.${ext}`;

  try {
    const bucket = admin.storage().bucket();
    const file = bucket.file(storagePath);

    await file.save(buffer, {
      metadata: {
        contentType: contentType,
        metadata: {
          uploadedBy: userId,
          uploadedAt: Date.now().toString(),
        },
      },
    });

    // Make the file publicly readable
    await file.makePublic();

    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

    return {
      success: true,
      mediaUrl: publicUrl,
      mediaType: contentType.startsWith('video/') ? 'video' : 'image',
    };
  } catch (error) {
    console.error('Upload error:', error);
    const err = new Error('Failed to upload file');
    err.httpErrorCode = { status: 500 };
    throw err;
  }
});

/**
 * Get or create user document
 * Also stores the user's wallet address for on-chain token transfers
 */
exports.getUser = createAuthenticatedEndpoint(async (data, userId) => {
  console.log('[getUser] User ID:', userId, 'Wallet:', data.walletAddress);

  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    console.log('[getUser] Creating new user');
    const newUser = {
      walletAddress: data.walletAddress || null,
      balance: 0,
      lastClaimAt: null,
      totalFeeds: 0,
      createdAt: Date.now(),
    };
    await userRef.set(newUser);
    console.log('[getUser] New user created:', newUser);
    return newUser;
  }

  // Update wallet address if provided and changed
  const existingData = userDoc.data();
  if (data.walletAddress && data.walletAddress !== existingData.walletAddress) {
    console.log('[getUser] Updating wallet address');
    await userRef.update({ walletAddress: data.walletAddress });
    existingData.walletAddress = data.walletAddress;
  }

  console.log('[getUser] Returning existing user:', existingData);
  return existingData;
});

/**
 * Claim daily food allowance
 * Uses the CatTVFaucet smart contract for transparent, on-chain distribution
 */
exports.claimDaily = createAuthenticatedEndpoint(async (data, userId) => {
  const userRef = db.collection('users').doc(userId);

  // Get user data
  const userDoc = await userRef.get();

  let userData;
  if (!userDoc.exists) {
    userData = {
      walletAddress: null,
      lastClaimAt: null,
      totalFeeds: 0,
      createdAt: Date.now(),
    };
  } else {
    userData = userDoc.data();
  }

  // Check if user has a wallet address
  if (!userData.walletAddress) {
    const error = new Error('No wallet address found. Please reload the page.');
    error.httpErrorCode = { status: 400 };
    error.code = 'FAILED_PRECONDITION';
    throw error;
  }

  // Check if faucet contract is configured
  if (CONFIG.FAUCET_ADDRESS === '0x0000000000000000000000000000000000000000') {
    // Fallback to direct transfer if faucet not deployed yet
    return claimDailyFallback(userData, userRef, userId);
  }

  // Use the faucet contract
  let txHash = null;
  try {
    const wallet = getWallet();
    const faucet = getFaucetContract(wallet);

    // Check if user can claim on-chain (faucet enforces cooldown)
    const [canClaim, timeRemaining] = await faucet.canUserClaim(userData.walletAddress);

    if (!canClaim) {
      const hours = Math.floor(Number(timeRemaining) / 3600);
      const minutes = Math.floor((Number(timeRemaining) % 3600) / 60);
      const error = new Error(`Already claimed today. Next claim in ${hours}h ${minutes}m`);
      error.httpErrorCode = { status: 400 };
      error.code = 'FAILED_PRECONDITION';
      throw error;
    }

    console.log(`[claimDaily] Claiming via faucet for ${userData.walletAddress}`);

    // Call claimFor on the faucet contract (server is authorized distributor)
    const tx = await faucet.claimFor(userData.walletAddress);
    await tx.wait();
    txHash = tx.hash;

    console.log(`[claimDaily] Faucet claim successful: ${txHash}`);
  } catch (err) {
    // If it's our custom error, re-throw it
    if (err.httpErrorCode) {
      throw err;
    }

    console.error('[claimDaily] Faucet claim failed:', err);
    const error = new Error('Failed to claim tokens. Please try again later.');
    error.httpErrorCode = { status: 500 };
    throw error;
  }

  // Update user record with claim time and balance
  const now = Date.now();
  const updatedUser = {
    ...userData,
    balance: (userData.balance || 0) + CONFIG.DAILY_AMOUNT,
    lastClaimAt: now,
    lastClaimTxHash: txHash,
  };

  await userRef.set(updatedUser, { merge: true });

  return {
    success: true,
    claimed: CONFIG.DAILY_AMOUNT,
    txHash,
  };
});

/**
 * Feed a cat
 */
exports.feed = createAuthenticatedEndpoint(async (data, userId) => {
  const { catId } = data;
  if (!catId) {
    const error = new Error('catId is required');
    error.httpErrorCode = { status: 400 };
    error.code = 'INVALID_ARGUMENT';
    throw error;
  }

  const userRef = db.collection('users').doc(userId);
  const catRef = db.collection('cats').doc(catId);
  const statsRef = db.collection('stats').doc('global');
  
  // Run transaction
  const result = await db.runTransaction(async (transaction) => {
    const [userDoc, catDoc, statsDoc] = await Promise.all([
      transaction.get(userRef),
      transaction.get(catRef),
      transaction.get(statsRef),
    ]);
    
    if (!userDoc.exists) {
      const error = new Error('User not found');
      error.httpErrorCode = { status: 404 };
      throw error;
    }
    if (!catDoc.exists) {
      const error = new Error('Cat not found');
      error.httpErrorCode = { status: 404 };
      throw error;
    }

    const userData = userDoc.data();
    const catData = catDoc.data();
    const statsData = statsDoc.exists ? statsDoc.data() : { totalFeeds: 0 };

    // Check balance
    if (userData.balance < CONFIG.FEED_COST) {
      const error = new Error('Not enough food! Come back tomorrow.');
      error.httpErrorCode = { status: 400 };
      throw error;
    }

    // Check daily feed limit
    const now = Date.now();
    const todayStart = new Date().setHours(0, 0, 0, 0);

    let feedsToday = userData.feedsToday || 0;
    let lastFeedDate = userData.lastFeedDate || 0;

    // Reset if new day
    if (lastFeedDate < todayStart) {
      feedsToday = 0;
    }

    // Check limit (max 50 feeds per day)
    if (feedsToday >= CONFIG.MAX_DAILY_FEEDS) {
      const error = new Error(`Daily limit reached! You can feed ${CONFIG.MAX_DAILY_FEEDS} cats per day. Come back tomorrow!`);
      error.httpErrorCode = { status: 429 };
      throw error;
    }
    
    // Update user
    transaction.update(userRef, {
      balance: userData.balance - CONFIG.FEED_COST,
      totalFeeds: (userData.totalFeeds || 0) + 1,
      feedsToday: feedsToday + 1,
      lastFeedDate: now,
    });
    
    // Update cat
    transaction.update(catRef, {
      totalFed: (catData.totalFed || 0) + 1,
      lastFedAt: now,
    });
    
    // Update global stats
    transaction.set(statsRef, {
      totalFeeds: statsData.totalFeeds + 1,
    }, { merge: true });
    
    // Create feed event
    const eventRef = db.collection('feedEvents').doc();
    transaction.set(eventRef, {
      userId,
      catId,
      amount: CONFIG.FEED_COST,
      timestamp: now,
    });
    
    return {
      newBalance: userData.balance - CONFIG.FEED_COST,
      catName: catData.name,
      feedsRemaining: CONFIG.MAX_DAILY_FEEDS - (feedsToday + 1),
    };
  });
  
  // Execute on-chain token feed via CatFeeder contract (async, don't block response)
  // In production, you'd want better error handling and retry logic
  executeOnChainFeed(catId).catch(err => {
    console.error('On-chain feed failed:', err);
    // TODO: Queue for retry
  });
  
  return {
    success: true,
    balance: result.newBalance,
    feedsRemaining: result.feedsRemaining,
    message: `${result.catName} says thank you! 😸`,
  };
});

/**
 * Execute on-chain feed via CatFeeder contract
 * Called after successful off-chain feed
 */
async function executeOnChainFeed(catId) {
  try {
    const wallet = getWallet();
    const token = getTokenContract(wallet);
    const feeder = getCatFeederContract(wallet);
    
    const catIdBytes = catIdToBytes32(catId);
    
    // Get feed amount from contract
    const feedAmount = await feeder.FEED_AMOUNT();
    
    // Check and set approval if needed
    const currentAllowance = await token.allowance(wallet.address, CONFIG.CATFEEDER_ADDRESS);
    if (currentAllowance < feedAmount) {
      const approveTx = await token.approve(CONFIG.CATFEEDER_ADDRESS, ethers.MaxUint256);
      await approveTx.wait();
      console.log('Approved CatFeeder:', approveTx.hash);
    }
    
    // Execute feed on contract
    // 100% goes to bowl, then decays to Care Fund
    const feedTx = await feeder.feed(catIdBytes);
    await feedTx.wait();
    console.log('On-chain feed executed:', feedTx.hash);
    
    return { success: true, txHash: feedTx.hash };
  } catch (error) {
    console.error('On-chain execution failed:', error);
    throw error;
  }
}

/**
 * Add a new cat
 */
exports.addCat = createAuthenticatedEndpoint(async (data, userId) => {
  const { name, mediaUrl, mediaType } = data;

  if (!name || !mediaUrl) {
    const error = new Error('name and mediaUrl required');
    error.httpErrorCode = { status: 400 };
    throw error;
  }

  if (name.length > 20) {
    const error = new Error('Name too long (max 20 chars)');
    error.httpErrorCode = { status: 400 };
    throw error;
  }

  const catRef = db.collection('cats').doc();
  const now = Date.now();

  const catData = {
    name: name.trim(),
    mediaUrl,
    mediaType: mediaType || 'image',
    totalFed: 0,
    lastFedAt: null,
    createdAt: now,
    createdBy: userId,
  };

  await catRef.set(catData);

  return {
    success: true,
    catId: catRef.id,
    cat: { id: catRef.id, ...catData },
  };
});

/**
 * Get all cats (public endpoint)
 */
exports.getCats = createPublicEndpoint(async () => {
  const catsSnapshot = await db.collection('cats')
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();

  const cats = [];
  catsSnapshot.forEach(doc => {
    const catData = doc.data();
    cats.push({
      id: doc.id,
      ...catData,
      happiness: calculateHappiness(catData.lastFedAt),
    });
  });

  return { cats };
});

/**
 * Get global stats (public endpoint)
 */
exports.getStats = createPublicEndpoint(async () => {
  const [statsDoc, catsSnapshot] = await Promise.all([
    db.collection('stats').doc('global').get(),
    db.collection('cats').get(),
  ]);

  const stats = statsDoc.exists ? statsDoc.data() : { totalFeeds: 0 };

  // Count happy cats
  let happyCats = 0;
  catsSnapshot.forEach(doc => {
    const cat = doc.data();
    const happiness = calculateHappiness(cat.lastFedAt);
    if (happiness.level === 'happy') happyCats++;
  });

  return {
    totalFeeds: stats.totalFeeds || 0,
    totalCats: catsSnapshot.size,
    happyCats,
  };
});

/**
 * HTTP endpoint for health check
 */
exports.health = onRequest((req, res) => {
  cors(req, res, () => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });
});

// NOTE: Scheduled functions require firebase-functions v2 scheduler API
// To enable, use: const {onSchedule} = require("firebase-functions/v2/scheduler");
// exports.processDecay = onSchedule("every 1 hours", async (event) => { ... });

/**
 * Manual decay processing (can be called by admin)
 */
exports.triggerDecay = createAuthenticatedEndpoint(async (data) => {
  // Optional: Add admin check here
  try {
    const wallet = getWallet();
    const feeder = getCatFeederContract(wallet);

    const maxCats = data.maxCats || 50;
    const tx = await feeder.processDecayAll(maxCats);
    await tx.wait();

    return { success: true, txHash: tx.hash };
  } catch (error) {
    console.error('Manual decay failed:', error);
    throw error;
  }
});

/**
 * Get on-chain contract stats (public endpoint)
 */
exports.getContractStats = createPublicEndpoint(async () => {
  try {
    const wallet = getWallet();
    const feeder = getCatFeederContract(wallet);

    const stats = await feeder.getStats();

    return {
      faucetBalance: ethers.formatUnits(stats[0], CONFIG.TOKEN_DECIMALS),
      careFundBalance: ethers.formatUnits(stats[1], CONFIG.TOKEN_DECIMALS),
      totalFed: ethers.formatUnits(stats[2], CONFIG.TOKEN_DECIMALS),
      totalDecayed: ethers.formatUnits(stats[3], CONFIG.TOKEN_DECIMALS),
      trackedCats: stats[4].toString(),
    };
  } catch (error) {
    console.error('Get contract stats failed:', error);
    throw error;
  }
});

// ============================================
// STRIPE PURCHASING
// ============================================

/**
 * Get available purchase tiers (public endpoint)
 */
exports.getPurchaseTiers = createPublicEndpoint(async () => {
  return {
    tiers: Object.entries(CONFIG.PURCHASE_TIERS).map(([id, tier]) => ({
      id,
      priceUsd: tier.priceUsd,
      cattv: tier.cattv,
      catsCanFeed: tier.catsCanFeed,
      label: `$${tier.priceUsd} → ${tier.cattv} Food → Feed ${tier.catsCanFeed} cats`,
    })),
    disclaimer: "Your purchase supports the Care Fund, which funds real cat shelter donations and keeps Cat TV free for everyone.",
  };
});

/**
 * Create Stripe checkout session
 */
exports.createCheckoutSession = createAuthenticatedEndpoint(async (data, userId) => {
  const { tierId } = data;
  const tier = CONFIG.PURCHASE_TIERS[tierId];

  if (!tier) {
    const error = new Error('Invalid tier');
    error.httpErrorCode = { status: 400 };
    throw error;
  }

  // Initialize Stripe
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    const error = new Error('Stripe not configured');
    error.httpErrorCode = { status: 500 };
    throw error;
  }

  const stripe = require('stripe')(stripeKey);
  
  try {
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Cat TV Food Pack`,
            description: `${tier.cattv} cat food - Feed up to ${tier.catsCanFeed} cats!`,
            images: ['https://cat-tv.web.app/cat-food-pack.png'], // Update with your image
          },
          unit_amount: tier.priceCents, // Stripe uses cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${data.successUrl || 'https://cat-tv.web.app'}?purchase=success`,
      cancel_url: `${data.cancelUrl || 'https://cat-tv.web.app'}?purchase=cancelled`,
      metadata: {
        userId,
        tierId,
        cattv: tier.cattv.toString(),
      },
      // Custom text for checkout
      custom_text: {
        submit: {
          message: '💛 Your purchase supports the Care Fund and real cat shelters!',
        },
      },
    });
    
    // Log pending purchase
    await db.collection('purchases').doc(session.id).set({
      userId,
      tierId,
      cattv: tier.cattv,
      priceUsd: tier.priceUsd,
      status: 'pending',
      createdAt: Date.now(),
    });
    
    return {
      sessionId: session.id,
      url: session.url,
    };
  } catch (error) {
    console.error('Stripe checkout error:', error);
    const err = new Error('Failed to create checkout');
    err.httpErrorCode = { status: 500 };
    throw err;
  }
});

/**
 * Stripe webhook handler
 * Receives payment confirmations and credits user accounts
 */
exports.stripeWebhook = onRequest(async (req, res) => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!stripeKey || !webhookSecret) {
    console.error('Stripe not configured');
    return res.status(500).send('Stripe not configured');
  }
  
  const stripe = require('stripe')(stripeKey);
  const sig = req.headers['stripe-signature'];
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    try {
      await handleSuccessfulPurchase(session);
      console.log('Purchase processed:', session.id);
    } catch (error) {
      console.error('Failed to process purchase:', error);
      return res.status(500).send('Failed to process purchase');
    }
  }
  
  res.json({ received: true });
});

/**
 * Handle successful purchase - credit user's account
 */
async function handleSuccessfulPurchase(session) {
  const { userId, tierId, cattv } = session.metadata;
  const cattvAmount = parseInt(cattv, 10);
  
  if (!userId || !cattvAmount) {
    throw new Error('Invalid session metadata');
  }
  
  const userRef = db.collection('users').doc(userId);
  const purchaseRef = db.collection('purchases').doc(session.id);
  
  await db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    
    let userData = userDoc.exists ? userDoc.data() : {
      balance: 0,
      lastClaimAt: null,
      totalFeeds: 0,
      totalPurchased: 0,
      createdAt: Date.now(),
    };
    
    // Credit the user's balance
    transaction.set(userRef, {
      ...userData,
      balance: (userData.balance || 0) + cattvAmount,
      totalPurchased: (userData.totalPurchased || 0) + cattvAmount,
    }, { merge: true });
    
    // Update purchase record
    transaction.update(purchaseRef, {
      status: 'completed',
      completedAt: Date.now(),
      stripePaymentId: session.payment_intent,
    });
  });
  
  console.log(`Credited ${cattvAmount} CATTV to user ${userId}`);
}
