import { useState } from 'react';
import { ChevronUp, ChevronDown, Tv } from 'lucide-react';
import clsx from 'clsx';

// Featured YouTube cat compilation channels
const YOUTUBE_CHANNELS = [
  { id: 'dQrN2bkbhdQ', title: 'Cats Playing', description: 'Epic 1 hour compilation' },
  { id: 'B5ftxJmY10I', title: 'Cat Vibes', description: 'Relaxing cat content' },
  { id: 'ej35VF57Ekw', title: 'Funny Cats', description: 'Cats being cats' },
  { id: 'YJ3yB0ne3Hw', title: 'Cat Moments', description: 'Peak cat content' },
];

export function ChannelTV() {
  const [currentChannel, setCurrentChannel] = useState(0);
  const [channelChangeAnim, setChannelChangeAnim] = useState(false);

  const currentVideo = YOUTUBE_CHANNELS[currentChannel];

  const handleChannelUp = () => {
    setChannelChangeAnim(true);
    setTimeout(() => setChannelChangeAnim(false), 300);
    setCurrentChannel((prev) => (prev + 1) % YOUTUBE_CHANNELS.length);
  };

  const handleChannelDown = () => {
    setChannelChangeAnim(true);
    setTimeout(() => setChannelChangeAnim(false), 300);
    setCurrentChannel((prev) => (prev - 1 + YOUTUBE_CHANNELS.length) % YOUTUBE_CHANNELS.length);
  };

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
              {currentChannel + 1}
            </span>
          </div>
        </div>

        {/* TV Screen - 16:9 for YouTube */}
        <div className="relative bg-black rounded-2xl overflow-hidden aspect-video">
          {/* Static/Channel Change Effect */}
          <div
            className={clsx(
              'absolute inset-0 z-20 pointer-events-none transition-opacity duration-200',
              channelChangeAnim ? 'opacity-100' : 'opacity-0'
            )}
            style={{
              background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 1px, transparent 1px, transparent 2px)',
            }}
          />

          {/* YouTube Embed */}
          <iframe
            key={currentVideo.id}
            src={`https://www.youtube.com/embed/${currentVideo.id}?feature=oembed&autoplay=1&mute=1`}
            className="w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            title={currentVideo.title}
          />

          {/* TV Overlay - Info Bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pointer-events-none">
            <div className="flex items-end justify-between">
              <div>
                {/* Live indicator */}
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-live-pulse" />
                  <span className="text-xs font-medium text-white/80">FEATURED</span>
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-white">
                  {currentVideo.title}
                </h3>
                <p className="text-sm text-white/60 mt-1">
                  {currentVideo.description}
                </p>
              </div>
            </div>
          </div>

          {/* Scanlines Effect */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.02]"
            style={{
              background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 1px, rgba(0,0,0,0.3) 1px, rgba(0,0,0,0.3) 2px)',
            }}
          />
        </div>

        {/* TV Controls */}
        <div className="flex items-center justify-between mt-4 px-2">
          {/* Channel Info */}
          <div className="text-white text-sm">
            <span className="text-gray-400">Now Playing:</span>{' '}
            <span className="font-semibold">{currentVideo.title}</span>
          </div>

          {/* Channel Up/Down Buttons */}
          <div className="flex flex-col gap-1">
            <button
              onClick={handleChannelUp}
              className="flex items-center justify-center w-12 h-8 rounded-lg font-semibold text-sm transition-all bg-gray-700 text-white hover:bg-gray-600 active:scale-95"
              title="Channel Up"
            >
              <ChevronUp size={20} />
            </button>
            <button
              onClick={handleChannelDown}
              className="flex items-center justify-center w-12 h-8 rounded-lg font-semibold text-sm transition-all bg-gray-700 text-white hover:bg-gray-600 active:scale-95"
              title="Channel Down"
            >
              <ChevronDown size={20} />
            </button>
          </div>
        </div>

        {/* Channel Dots */}
        <div className="flex justify-center gap-2 mt-3">
          {YOUTUBE_CHANNELS.map((_, idx) => (
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
      </div>
    </section>
  );
}
