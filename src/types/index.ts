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
}

// Config
export const CONFIG = {
  DAILY_AMOUNT: 100,
  FEED_COST: 10,
  MAX_DAILY_FEEDS: 50,
  CLAIM_COOLDOWN_MS: 24 * 60 * 60 * 1000,
} as const;
