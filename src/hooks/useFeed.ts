import { useState, useCallback } from 'react';
import { callFeed } from '../lib/firebase';
import { FeedResponse, User } from '../types';
import { CONFIG } from '../lib/constants';

interface UseFeedProps {
  user: User | null;
  updateUser: (updates: Partial<User>) => void;
}

export function useFeed({ user, updateUser }: UseFeedProps) {
  const [feeding, setFeeding] = useState<string | null>(null); // catId being fed
  const [error, setError] = useState<string | null>(null);

  const feedsToday = user?.feedsToday ?? 0;
  const feedsRemaining = CONFIG.MAX_DAILY_FEEDS - feedsToday;

  const feed = useCallback(async (catId: string) => {
    if (!user || feeding) return { success: false, error: 'Not ready' };

    if (user.balance < CONFIG.FEED_COST) {
      return { success: false, error: 'Not enough food!' };
    }

    setFeeding(catId);
    setError(null);

    try {
      const result = await callFeed({ catId });
      const data = result.data as FeedResponse;

      updateUser({
        balance: data.balance,
        feedsToday: CONFIG.MAX_DAILY_FEEDS - data.feedsRemaining,
        totalFeeds: (user.totalFeeds || 0) + 1,
      });

      return { success: true, message: data.message };
    } catch (err: any) {
      const message = err.message || 'Failed to feed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setFeeding(null);
    }
  }, [user, feeding, updateUser]);

  const isFeedingCat = useCallback((catId: string) => {
    return feeding === catId;
  }, [feeding]);

  return {
    feeding: !!feeding,
    feedsRemaining,
    feedsToday,
    error,
    feed,
    isFeedingCat,
  };
}
