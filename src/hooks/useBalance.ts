import { useState, useCallback } from 'react';
import { useApi } from '../contexts/ApiContext';
import { ClaimResponse, User } from '../types';
import { canClaim, getTimeUntilClaim, CONFIG } from '../lib/constants';

interface UseBalanceProps {
  user: User | null;
  updateUser: (updates: Partial<User>) => void;
}

export function useBalance({ user, updateUser }: UseBalanceProps) {
  const api = useApi();
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
      const result = await api.callClaimDaily();
      const data = result.data as ClaimResponse;

      updateUser({
        balance: data.balance,
        lastClaimAt: Date.now(),
      });

      return { success: true, claimed: data.claimed };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to claim';
      setError(message);
      return { success: false, error: message };
    } finally {
      setClaiming(false);
    }
  }, [api, user, claiming, canClaimNow, updateUser]);

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
