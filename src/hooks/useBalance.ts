import { useState, useCallback } from 'react';
import { callClaimDaily } from '../lib/firebase';
import { ClaimResponse, User } from '../types';
import { canClaim, getTimeUntilClaim, CONFIG } from '../lib/constants';

interface UseBalanceProps {
  user: User | null;
  updateUser: (updates: Partial<User>) => void;
}

export function useBalance({ user, updateUser }: UseBalanceProps) {
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const balance = user?.balance ?? 0;
  const lastClaimAt = user?.lastClaimAt ?? null;
  const canClaimNow = canClaim(lastClaimAt);
  const timeUntilClaim = getTimeUntilClaim(lastClaimAt);

  const claim = useCallback(async () => {
    if (!user || claiming || !canClaimNow) return;

    setClaiming(true);
    setError(null);

    try {
      const result = await callClaimDaily();
      const data = result.data as ClaimResponse;

      updateUser({
        balance: data.balance,
        lastClaimAt: Date.now(),
      });

      return { success: true, claimed: data.claimed };
    } catch (err: any) {
      const message = err.message || 'Failed to claim';
      setError(message);
      return { success: false, error: message };
    } finally {
      setClaiming(false);
    }
  }, [user, claiming, canClaimNow, updateUser]);

  const canAffordFeed = balance >= CONFIG.FEED_COST;

  return {
    balance,
    claiming,
    canClaimNow,
    timeUntilClaim,
    canAffordFeed,
    error,
    claim,
  };
}
