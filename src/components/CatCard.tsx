import { Fish } from 'lucide-react';
import clsx from 'clsx';
import { CatWithHappiness } from '../types';
import { CONFIG } from '../lib/constants';

interface CatCardProps {
  cat: CatWithHappiness;
  onFeed: (catId: string) => void;
  canFeed: boolean;
  isFeeding: boolean;
}

export function CatCard({ cat, onFeed, canFeed, isFeeding }: CatCardProps) {
  const { happiness } = cat;

  const handleFeed = () => {
    if (canFeed && !isFeeding) {
      onFeed(cat.id);
    }
  };

  return (
    <div
      id={`cat-${cat.id}`}
      className="bg-white/70 backdrop-blur-xl border border-white/20 rounded-card shadow-card overflow-hidden transition-all hover:scale-[1.02] hover:bg-white/80"
    >
      {/* Image Container */}
      <div className="relative aspect-square bg-warm-bg">
        {cat.mediaType === 'video' ? (
          <video
            src={cat.mediaUrl}
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <img
            src={cat.mediaUrl}
            alt={cat.name}
            className="w-full h-full object-cover"
          />
        )}

        {/* Happiness Badge */}
        <div
          className={clsx(
            'absolute top-3 right-3 px-3 py-1.5 rounded-full text-sm font-semibold',
            'bg-white/90 backdrop-blur-sm shadow-sm',
            happiness.level === 'happy' && 'text-happy',
            happiness.level === 'okay' && 'text-okay',
            happiness.level === 'sad' && 'text-sad'
          )}
        >
          {happiness.emoji} {happiness.label}
        </div>

        {/* Feeding Animation Overlay */}
        {isFeeding && (
          <div className="absolute inset-0 bg-accent-orange/20 flex items-center justify-center">
            <div className="text-6xl animate-bounce">🐟</div>
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-semibold text-text-main">
              {cat.name}
            </h3>
            <p className="text-sm text-text-soft">
              Fed {cat.totalFed || 0} times
            </p>
          </div>

          <button
            onClick={handleFeed}
            disabled={!canFeed || isFeeding}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all',
              canFeed && !isFeeding
                ? 'bg-accent-orange text-white hover:bg-opacity-90 shadow-soft'
                : 'bg-gray-100 text-text-soft cursor-not-allowed'
            )}
          >
            <Fish size={16} />
            <span>{CONFIG.FEED_COST}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
