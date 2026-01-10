import { useState, useCallback } from 'react';
import { useApi } from '../contexts/ApiContext';
import { useTokenBalance } from './useTokenBalance';
import { User } from '../types';
import { canClaim, getTimeUntilClaim, CONFIG } from '../lib/constants';

interface UseBalanceProps {
  user: User | null;
  updateUser: (updates: Partial<User>) => void;
}

interface ClaimResult {
  success: boolean;
  claimed: number;
  txHash?: string;
}

export function useBalance({ user, updateUser }: UseBalanceProps) {
  const api = useApi();
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimisticAdd, setOptimisticAdd] = useState(0);

  // Read balance from blockchain instead of Firestore
  const { balance: onChainBalance, loading: balanceLoading, refetch: refetchBalance } = useTokenBalance(user?.walletAddress);

  // Display balance includes optimistic additions
  const balance = onChainBalance + optimisticAdd;

  const lastClaimAt = user?.lastClaimAt ?? null;
  const canClaimNow = canClaim(lastClaimAt);
  const timeUntilClaim = getTimeUntilClaim(lastClaimAt);

  const claim = useCallback(async () => {
    if (!user || claiming || !canClaimNow) return;

    setClaiming(true);
    setError(null);

    try {
      const result = await api.callClaimDaily();
      const data = result.data as ClaimResult;

      // Update lastClaimAt in local state
      updateUser({
        lastClaimAt: Date.now(),
      });

      // Optimistically add the claimed amount immediately for smooth UI
      setOptimisticAdd(prev => prev + data.claimed);

      // Refetch on-chain balance after a short delay to allow tx to confirm
      // Then clear optimistic add since real balance should reflect it
      setTimeout(async () => {
        await refetchBalance();
        setOptimisticAdd(0);
      }, 2000);

      return { success: true, claimed: data.claimed, txHash: data.txHash };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to claim';
      setError(message);
      return { success: false, error: message };
    } finally {
      setClaiming(false);
    }
  }, [api, user, claiming, canClaimNow, updateUser, refetchBalance]);

  const canAffordFeed = balance >= CONFIG.FEED_COST;

  // For optimistic UI updates when spending (e.g., feeding)
  const spendOptimistic = useCallback((amount: number) => {
    setOptimisticAdd(prev => prev - amount);
    // Sync with real balance after delay
    setTimeout(async () => {
      await refetchBalance();
      setOptimisticAdd(0);
    }, 2000);
  }, [refetchBalance]);

  return {
    balance,
    balanceLoading,
    claiming,
    canClaimNow,
    timeUntilClaim,
    canAffordFeed,
    error,
    claim,
    refetchBalance,
    spendOptimistic,
  };
}
