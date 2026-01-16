import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Heart } from 'lucide-react';

interface FeedEvent {
  id: string;
  catId: string;
  catName?: string;
  timestamp: number;
}

interface LiveFeedTickerProps {
  cats: Array<{ id: string; name: string }>;
}

export function LiveFeedTicker({ cats }: LiveFeedTickerProps) {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Create a map for quick cat name lookup
  const catNameMap = new Map(cats.map(c => [c.id, c.name]));

  // Listen to recent feed events (only from last 6 hours)
  useEffect(() => {
    const sixHoursAgo = Date.now() - (6 * 60 * 60 * 1000);

    const q = query(
      collection(db, 'feedEvents'),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newEvents: FeedEvent[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Only include events from the last 6 hours
        if (data.timestamp >= sixHoursAgo) {
          newEvents.push({
            id: doc.id,
            catId: data.catId,
            catName: catNameMap.get(data.catId) || 'A cat',
            timestamp: data.timestamp,
          });
        }
      });

      // Reset to show newest event when new events arrive
      setCurrentIndex(0);
      setEvents(newEvents);
    });

    return () => unsubscribe();
  }, [cats]);

  // Rotate through events
  useEffect(() => {
    if (events.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.min(events.length, 5));
    }, 4000);

    return () => clearInterval(interval);
  }, [events.length]);

  if (events.length === 0) {
    return null;
  }

  const currentEvent = events[currentIndex];
  const timeAgo = getTimeAgo(currentEvent?.timestamp);

  return (
    <div className="bg-white/80 backdrop-blur-sm border-b border-warm-bg">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center justify-center gap-2 text-sm">
          <Heart size={14} className="text-accent-pink animate-pulse" fill="currentColor" />
          <span className="text-text-soft">
            Someone vibed with{' '}
            <span className="font-semibold text-text-main">{currentEvent?.catName}</span>
            {' '}{timeAgo}
          </span>
          <Heart size={14} className="text-accent-pink animate-pulse" fill="currentColor" />
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(timestamp: number): string {
  if (!timestamp) return 'just now';

  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
