import { useState, useEffect, useCallback } from 'react';
import { createPublicClient, http, formatUnits } from 'viem';
import { base } from 'viem/chains';

// $CATTV token on Base
const CATTV_TOKEN_ADDRESS = '0xbb0b50cc8efdf947b1808dabcc8bbd58121d5b07' as const;
const TOKEN_DECIMALS = 18;

// ERC-20 balanceOf ABI
const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Create a public client for Base mainnet
const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

interface UseTokenBalanceResult {
  balance: number;
  rawBalance: bigint;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTokenBalance(walletAddress: string | null | undefined): UseTokenBalanceResult {
  const [balance, setBalance] = useState<number>(0);
  const [rawBalance, setRawBalance] = useState<bigint>(BigInt(0));
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!walletAddress) {
      setBalance(0);
      setRawBalance(BigInt(0));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await publicClient.readContract({
        address: CATTV_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [walletAddress as `0x${string}`],
      });

      setRawBalance(result);
      // Convert from wei (18 decimals) to human-readable number
      const formattedBalance = parseFloat(formatUnits(result, TOKEN_DECIMALS));
      setBalance(Math.floor(formattedBalance)); // Round down for display as "food"
    } catch (err) {
      console.error('[useTokenBalance] Failed to fetch balance:', err);
      setError('Failed to fetch balance');
      setBalance(0);
      setRawBalance(BigInt(0));
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  // Fetch balance on mount and when wallet address changes
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Auto-refresh balance every 30 seconds
  useEffect(() => {
    if (!walletAddress) return;

    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [walletAddress, fetchBalance]);

  return {
    balance,
    rawBalance,
    loading,
    error,
    refetch: fetchBalance,
  };
}
