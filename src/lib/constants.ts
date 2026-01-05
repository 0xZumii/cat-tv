import { Happiness, HappinessLevel } from '../types';

export const CONFIG = {
  DAILY_AMOUNT: 100,
  FEED_COST: 10,
  MAX_DAILY_FEEDS: 50,
  CLAIM_COOLDOWN_MS: 24 * 60 * 60 * 1000,
} as const;

export const PURCHASE_TIERS = [
  { id: 'tier1', priceUsd: 1, cattv: 100, catsCanFeed: 10 },
  { id: 'tier2', priceUsd: 5, cattv: 500, catsCanFeed: 50 },
  { id: 'tier3', priceUsd: 10, cattv: 1000, catsCanFeed: 100 },
] as const;

/**
 * Calculate cat happiness based on last fed time
 */
export function getHappiness(lastFedAt: number | null): Happiness {
  if (!lastFedAt) {
    return { level: 'sad', emoji: '😿', label: 'Hungry' };
  }

  const now = Date.now();
  const hoursSinceFed = (now - lastFedAt) / (1000 * 60 * 60);

  if (hoursSinceFed < 6) {
    return { level: 'happy', emoji: '😸', label: 'Happy' };
  }
  if (hoursSinceFed < 24) {
    return { level: 'okay', emoji: '🙂', label: 'Okay' };
  }
  return { level: 'sad', emoji: '😿', label: 'Hungry' };
}

/**
 * Check if user can claim daily tokens
 */
export function canClaim(lastClaimAt: number | null): boolean {
  if (!lastClaimAt) return true;
  return Date.now() - lastClaimAt >= CONFIG.CLAIM_COOLDOWN_MS;
}

/**
 * Get time remaining until next claim
 */
export function getTimeUntilClaim(lastClaimAt: number | null): string | null {
  if (!lastClaimAt) return null;
  
  const remaining = CONFIG.CLAIM_COOLDOWN_MS - (Date.now() - lastClaimAt);
  if (remaining <= 0) return null;

  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Get happiness color class
 */
export function getHappinessColor(level: HappinessLevel): string {
  switch (level) {
    case 'happy':
      return 'text-happy';
    case 'okay':
      return 'text-okay';
    case 'sad':
      return 'text-sad';
  }
}
