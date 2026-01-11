import { useState, useCallback, useEffect } from 'react';
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
  const [useFirestoreFallback, setUseFirestoreFallback] = useState(false);

  // Read balance from blockchain instead of Firestore
  const { balance: onChainBalance, loading: balanceLoading, error: chainError, refetch: refetchBalance } = useTokenBalance(user?.walletAddress);

  // Firestore fallback balance (generic food tracked in Firestore)
  const firestoreBalance = user?.balance ?? 0;

  // Use Firestore fallback if on-chain balance fails or times out
  useEffect(() => {
    if (chainError && !balanceLoading) {
      console.warn('[useBalance] On-chain balance failed, using Firestore fallback');
      setUseFirestoreFallback(true);
    } else if (!chainError && !balanceLoading && onChainBalance > 0) {
      setUseFirestoreFallback(false);
    }
  }, [chainError, balanceLoading, onChainBalance]);

  // Display balance: prefer on-chain, fallback to Firestore if chain fails
  const baseBalance = useFirestoreFallback ? firestoreBalance : onChainBalance;
  const balance = baseBalance + optimisticAdd;

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
      // Don't clear it - the on-chain balance will eventually reflect the tx
      // and the 30-second auto-refresh in useTokenBalance will sync up
      setOptimisticAdd(prev => prev + data.claimed);

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
    // The on-chain balance auto-refreshes every 30 seconds
    // so we don't need to manually sync here
  }, []);

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
    // Failsafe info
    isUsingFirestoreFallback: useFirestoreFallback,
    chainError,
  };
}
