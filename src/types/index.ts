// User types
export interface User {
  id: string;
  walletAddress: string | null;
  balance: number;
  lastClaimAt: number | null;
  totalFeeds: number;
  feedsToday: number;
  lastFeedDate: number;
  totalPurchased: number;
  createdAt: number;
}

// Proof of Cat verification types
export type ProofOfCatVerdict =
  | 'certified_cat'      // Definitely a real cat
  | 'probably_cat'       // Looks like a cat but we're not 100% sure
  | 'suspicious_critter' // Might be a dog, hamster, or other animal in disguise
  | 'ai_imposter'        // Detected as AI-generated
  | 'unknown_entity'     // We have no idea what this is
  | 'chaos_agent';       // Too chaotic to classify

export interface ProofOfCat {
  verdict: ProofOfCatVerdict;
  confidence: number;      // 0-100 confidence score
  funnyMessage: string;    // A playful message about the verdict
  verifiedAt: number;      // Timestamp of verification
}

// Cat vibe types
export type CatVibe =
  | 'sleepy'
  | 'menace'
  | 'void'
  | 'derp'
  | 'chonk'
  | 'zoomies'
  | 'happy'
  | 'grumpy'
  | 'floof'
  | 'loaf'
  | 'majestic'
  | 'chaos';

// Cat types
export interface Cat {
  id: string;
  name: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  totalFed: number;
  lastFedAt: number | null;
  createdAt: number;
  createdBy: string;
  vibes?: CatVibe[];
  proofOfCat?: ProofOfCat;
}

export interface CatWithHappiness extends Cat {
  happiness: Happiness;
}

// Happiness levels
export type HappinessLevel = 'happy' | 'okay' | 'sad';

export interface Happiness {
  level: HappinessLevel;
  emoji: string;
  label: string;
}

// Stats
export interface GlobalStats {
  totalFeeds: number;
  happyCats: number;
  totalCats: number;
}

// Purchase tiers
export interface PurchaseTier {
  id: string;
  priceUsd: number;
  cattv: number;
  catsCanFeed: number;
  label: string;
}

// Feed event
export interface FeedEvent {
  id: string;
  userId: string;
  catId: string;
  amount: number;
  timestamp: number;
}

// Firebase function responses
export interface ClaimResponse {
  success: boolean;
  balance: number;
  claimed: number;
}

export interface FeedResponse {
  success: boolean;
  balance: number;
  feedsRemaining: number;
  message: string;
}

export interface AddCatResponse {
  success: boolean;
  catId: string;
  cat: Cat;
  proofOfCat: ProofOfCat;
}

// Config
export const CONFIG = {
  DAILY_AMOUNT: 100,
  FEED_COST: 10,
  MAX_DAILY_FEEDS: 50,
  CLAIM_COOLDOWN_MS: 24 * 60 * 60 * 1000,
} as const;
