import { CatVibe, Happiness, HappinessLevel } from '../types';

export const VIBE_OPTIONS: { value: CatVibe; label: string; emoji: string }[] = [
  { value: 'happy', label: 'Happy', emoji: '😸' },
  { value: 'sleepy', label: 'Sleepy', emoji: '😴' },
  { value: 'grumpy', label: 'Grumpy', emoji: '😾' },
  { value: 'menace', label: 'Menace', emoji: '😈' },
  { value: 'void', label: 'Void', emoji: '🕳️' },
  { value: 'derp', label: 'Derp', emoji: '🤪' },
  { value: 'chonk', label: 'Chonk', emoji: '🍔' },
  { value: 'floof', label: 'Floof', emoji: '☁️' },
  { value: 'loaf', label: 'Loaf', emoji: '🍞' },
  { value: 'zoomies', label: 'Zoomies', emoji: '💨' },
  { value: 'majestic', label: 'Majestic', emoji: '👑' },
  { value: 'chaos', label: 'Chaos', emoji: '🌀' },
];

export const CONFIG = {
  DAILY_AMOUNT: 100,
  FEED_COST: 10,
  MAX_DAILY_FEEDS: 100,
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
    return { level: 'sad', emoji: '😺', label: 'Chillin' };
  }

  const now = Date.now();
  const hoursSinceFed = (now - lastFedAt) / (1000 * 60 * 60);

  if (hoursSinceFed < 6) {
    return { level: 'happy', emoji: '😸', label: 'Vibing' };
  }
  if (hoursSinceFed < 24) {
    return { level: 'okay', emoji: '🐱', label: 'Cozy' };
  }
  return { level: 'sad', emoji: '😺', label: 'Chillin' };
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

export function getVibeInfo(vibe: CatVibe) {
  return VIBE_OPTIONS.find((v) => v.value === vibe) || { value: vibe, label: vibe, emoji: '🐱' };
}
