import { useState, useMemo, useEffect } from 'react';
import { ChevronUp, ChevronDown, Tv, Fish } from 'lucide-react';
import clsx from 'clsx';
import { CatVibe, CatWithHappiness } from '../types';
import { CONFIG, getVibeInfo, VIBE_OPTIONS } from '../lib/constants';

interface ChannelTVProps {
  cats: CatWithHappiness[];
  canFeed: boolean;
  onFeed: (catId: string) => void;
  isFeedingCat: (catId: string) => boolean;
}

const FEATURED_COUNT = 5;

export function ChannelTV({ cats, canFeed, onFeed, isFeedingCat }: ChannelTVProps) {
  const [currentChannel, setCurrentChannel] = useState(0);
  const [selectedVibe, setSelectedVibe] = useState<CatVibe | 'all'>('all');
  const [showChannelSelect, setShowChannelSelect] = useState(false);
  const [channelChangeAnim, setChannelChangeAnim] = useState(false);

  // Filter cats by selected vibe
  const filteredCats = useMemo(() => {
    if (selectedVibe === 'all') return cats;
    return cats.filter((cat) => cat.vibes?.includes(selectedVibe));
  }, [cats, selectedVibe]);

  // Get featured channels (up to 5)
  const featuredChannels = useMemo(() => {
    return filteredCats.slice(0, FEATURED_COUNT);
  }, [filteredCats]);

  // Reset channel when filter changes or channels become empty
  useEffect(() => {
    if (currentChannel >= featuredChannels.length) {
      setCurrentChannel(0);
    }
  }, [featuredChannels.length, currentChannel]);

  const currentCat = featuredChannels[currentChannel];
  const isFeeding = currentCat ? isFeedingCat(currentCat.id) : false;

  const handleChannelUp = () => {
    if (featuredChannels.length === 0) return;
    setChannelChangeAnim(true);
    setTimeout(() => setChannelChangeAnim(false), 300);
    setCurrentChannel((prev) => (prev + 1) % featuredChannels.length);
  };

  const handleChannelDown = () => {
    if (featuredChannels.length === 0) return;
    setChannelChangeAnim(true);
    setTimeout(() => setChannelChangeAnim(false), 300);
    setCurrentChannel((prev) => (prev - 1 + featuredChannels.length) % featuredChannels.length);
  };

  const handleVibeSelect = (vibe: CatVibe | 'all') => {
    setSelectedVibe(vibe);
    setCurrentChannel(0);
    setShowChannelSelect(false);
  };

  const handleFeed = () => {
    if (currentCat && canFeed && !isFeeding) {
      onFeed(currentCat.id);
    }
  };

  if (cats.length === 0) {
    return null;
  }

  return (
    <section className="px-4 py-8 max-w-4xl mx-auto">
      {/* TV Frame */}
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl p-4 shadow-2xl">
        {/* TV Header */}
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="flex items-center gap-2">
            <Tv className="w-5 h-5 text-accent-orange" />
            <span className="font-display text-white font-semibold">Cat TV</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">CH</span>
            <span className="font-mono text-accent-orange font-bold text-lg">
              {featuredChannels.length > 0 ? currentChannel + 1 : '-'}
            </span>
          </div>
        </div>

        {/* TV Screen - 4:3 classic TV ratio */}
        <div className="relative bg-black rounded-2xl overflow-hidden aspect-[4/3]">
          {featuredChannels.length > 0 && currentCat ? (
            <>
              {/* Static/Channel Change Effect */}
              <div
                className={clsx(
                  'absolute inset-0 z-20 pointer-events-none transition-opacity duration-200',
                  channelChangeAnim ? 'opacity-100' : 'opacity-0'
                )}
                style={{
                  background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 2px)',
                }}
              />

              {/* Cat Media */}
              {currentCat.mediaType === 'video' ? (
                <video
                  key={currentCat.id}
                  src={currentCat.mediaUrl}
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : (
                <img
                  key={currentCat.id}
                  src={currentCat.mediaUrl}
                  alt={currentCat.name}
                  className="w-full h-full object-cover"
                />
              )}

              {/* TV Overlay - Info Bar */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-end justify-between">
                  <div>
                    {/* Live indicator */}
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-live-pulse" />
                      <span className="text-xs font-medium text-white/80">LIVE</span>
                    </div>
                    <h3 className="font-display text-2xl font-bold text-white">
                      {currentCat.name}
                    </h3>
                    {/* Vibes */}
                    {currentCat.vibes && currentCat.vibes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {currentCat.vibes.map((vibe) => {
                          const info = getVibeInfo(vibe);
                          return (
                            <span
                              key={vibe}
                              className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white"
                            >
                              {info.emoji} {info.label}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {/* Happiness Badge */}
                  <div
                    className={clsx(
                      'px-3 py-1.5 rounded-full text-sm font-semibold',
                      'bg-white/90 backdrop-blur-sm shadow-sm',
                      currentCat.happiness.level === 'happy' && 'text-happy',
                      currentCat.happiness.level === 'okay' && 'text-okay',
                      currentCat.happiness.level === 'sad' && 'text-sad'
                    )}
                  >
                    {currentCat.happiness.emoji} {currentCat.happiness.label}
                  </div>
                </div>
              </div>

              {/* Feeding Animation Overlay */}
              {isFeeding && (
                <div className="absolute inset-0 bg-accent-orange/20 flex items-center justify-center z-30">
                  <div className="text-8xl animate-bounce">🐟</div>
                </div>
              )}

              {/* Scanlines Effect */}
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{
                  background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 1px, rgba(0,0,0,0.3) 1px, rgba(0,0,0,0.3) 2px)',
                }}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Tv className="w-16 h-16 mb-4 opacity-50" />
              <p className="font-display text-lg">No channels available</p>
              {selectedVibe !== 'all' && (
                <p className="text-sm mt-1">Try selecting a different vibe</p>
              )}
            </div>
          )}
        </div>

        {/* TV Controls */}
        <div className="flex items-center justify-between mt-4 px-2">
          {/* Channel Select Button */}
          <div className="relative">
            <button
              onClick={() => setShowChannelSelect(!showChannelSelect)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all',
                'bg-gray-700 text-white hover:bg-gray-600'
              )}
            >
              <span>
                {selectedVibe === 'all' ? '📺 All Channels' : `${getVibeInfo(selectedVibe as CatVibe).emoji} ${getVibeInfo(selectedVibe as CatVibe).label}`}
              </span>
            </button>

            {/* Channel Select Dropdown */}
            {showChannelSelect && (
              <div className="absolute bottom-full left-0 mb-2 bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden z-50 min-w-[160px]">
                <button
                  onClick={() => handleVibeSelect('all')}
                  className={clsx(
                    'w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center gap-2',
                    selectedVibe === 'all'
                      ? 'bg-accent-orange text-white'
                      : 'text-white hover:bg-gray-700'
                  )}
                >
                  <span>📺</span>
                  <span>All Channels</span>
                </button>
                {VIBE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleVibeSelect(option.value)}
                    className={clsx(
                      'w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center gap-2',
                      selectedVibe === option.value
                        ? 'bg-accent-orange text-white'
                        : 'text-white hover:bg-gray-700'
                    )}
                  >
                    <span>{option.emoji}</span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Feed Button */}
          <button
            onClick={handleFeed}
            disabled={!canFeed || isFeeding || !currentCat}
            className={clsx(
              'flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all',
              canFeed && !isFeeding && currentCat
                ? 'bg-accent-orange text-white hover:bg-opacity-90 shadow-lg'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            )}
          >
            <Fish size={18} />
            <span>Vibe {CONFIG.FEED_COST}</span>
          </button>

          {/* Channel Up/Down Buttons */}
          <div className="flex flex-col gap-1">
            <button
              onClick={handleChannelUp}
              disabled={featuredChannels.length <= 1}
              className={clsx(
                'flex items-center justify-center w-12 h-8 rounded-lg font-semibold text-sm transition-all',
                featuredChannels.length > 1
                  ? 'bg-gray-700 text-white hover:bg-gray-600 active:scale-95'
                  : 'bg-gray-800 text-gray-600 cursor-not-allowed'
              )}
              title="Channel Up"
            >
              <ChevronUp size={20} />
            </button>
            <button
              onClick={handleChannelDown}
              disabled={featuredChannels.length <= 1}
              className={clsx(
                'flex items-center justify-center w-12 h-8 rounded-lg font-semibold text-sm transition-all',
                featuredChannels.length > 1
                  ? 'bg-gray-700 text-white hover:bg-gray-600 active:scale-95'
                  : 'bg-gray-800 text-gray-600 cursor-not-allowed'
              )}
              title="Channel Down"
            >
              <ChevronDown size={20} />
            </button>
          </div>
        </div>

        {/* Channel Dots */}
        {featuredChannels.length > 1 && (
          <div className="flex justify-center gap-2 mt-3">
            {featuredChannels.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setChannelChangeAnim(true);
                  setTimeout(() => setChannelChangeAnim(false), 300);
                  setCurrentChannel(idx);
                }}
                className={clsx(
                  'w-2 h-2 rounded-full transition-all',
                  idx === currentChannel
                    ? 'bg-accent-orange w-4'
                    : 'bg-gray-600 hover:bg-gray-500'
                )}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
