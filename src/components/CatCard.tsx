import { useState } from 'react';
import { Fish, Pencil } from 'lucide-react';
import clsx from 'clsx';
import { CatVibe, CatWithHappiness } from '../types';
import { CONFIG, getVibeInfo, VIBE_OPTIONS } from '../lib/constants';
import { ProofOfCatBadge } from './ProofOfCatBadge';

interface CatCardProps {
  cat: CatWithHappiness;
  userId: string | undefined;
  onFeed: (catId: string) => void;
  canFeed: boolean;
  isFeeding: boolean;
  onUpdateVibes: (catId: string, vibes: CatVibe[]) => void;
}

export function CatCard({ cat, userId, onFeed, canFeed, isFeeding, onUpdateVibes }: CatCardProps) {
  const { happiness } = cat;
  const [isEditingVibes, setIsEditingVibes] = useState(false);
  const [editVibes, setEditVibes] = useState<CatVibe[]>(cat.vibes || []);

  const isOwner = userId && cat.createdBy === userId;

  const handleFeed = () => {
    if (canFeed && !isFeeding) {
      onFeed(cat.id);
    }
  };

  const toggleEditVibe = (vibe: CatVibe) => {
    setEditVibes((prev) =>
      prev.includes(vibe) ? prev.filter((v) => v !== vibe) : [...prev, vibe]
    );
  };

  const handleSaveVibes = () => {
    onUpdateVibes(cat.id, editVibes);
    setIsEditingVibes(false);
  };

  const handleCancelEdit = () => {
    setEditVibes(cat.vibes || []);
    setIsEditingVibes(false);
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

        {/* Now Watching Blip */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-live-pulse" />
          <span className="text-xs font-medium text-white">LIVE</span>
        </div>

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

        {/* Proof of Cat Badge */}
        {cat.proofOfCat && (
          <div className="absolute bottom-3 left-3">
            <ProofOfCatBadge proof={cat.proofOfCat} size="sm" />
          </div>
        )}

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
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg font-semibold text-text-main">
              {cat.name}
            </h3>
            {/* Vibe Tags */}
            {isEditingVibes ? (
              <div className="mt-2">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {VIBE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggleEditVibe(option.value)}
                      className={clsx(
                        'text-xs px-2 py-1 rounded-full transition-all',
                        editVibes.includes(option.value)
                          ? 'bg-accent-lavender text-white'
                          : 'bg-gray-100 text-text-soft hover:bg-gray-200'
                      )}
                    >
                      {option.emoji} {option.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCancelEdit}
                    className="text-xs px-2 py-1 rounded-full bg-gray-100 text-text-soft hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveVibes}
                    className="text-xs px-2 py-1 rounded-full bg-accent-orange text-white hover:bg-opacity-90"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-1 mt-1">
                {cat.vibes && cat.vibes.length > 0 ? (
                  cat.vibes.map((vibe) => {
                    const info = getVibeInfo(vibe);
                    return (
                      <span
                        key={vibe}
                        className="text-xs px-1.5 py-0.5 rounded-full bg-accent-lavender/20 text-text-soft"
                      >
                        {info.emoji} {info.label}
                      </span>
                    );
                  })
                ) : isOwner ? (
                  <span className="text-xs text-text-soft/50">No vibes yet</span>
                ) : null}
                {isOwner && (
                  <button
                    onClick={() => setIsEditingVibes(true)}
                    className="text-xs p-1 rounded-full text-text-soft/50 hover:text-text-soft hover:bg-gray-100 transition-colors"
                    title="Edit vibes"
                  >
                    <Pencil size={12} />
                  </button>
                )}
              </div>
            )}
            <p className="text-sm text-text-soft mt-1">
              {cat.totalFed || 0} vibes
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
