import { AnimatedNumber } from './AnimatedNumber';

interface StatsBarProps {
  totalFeeds: number;
  happyCats: number;
  totalCats: number;
}

export function StatsBar({ totalFeeds, happyCats, totalCats }: StatsBarProps) {
  return (
    <div className="flex justify-center py-6 max-w-6xl mx-auto px-4">
      <div className="flex gap-8 sm:gap-12 bg-white/50 backdrop-blur-xl border border-white/30 rounded-full px-8 py-4 shadow-soft">
        <Stat value={totalFeeds} label="Total Vibes" />
        <Stat value={happyCats} label="Happy Cats" />
        <Stat value={totalCats} label="Cats" />
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <AnimatedNumber
        value={value}
        className="font-display text-3xl font-semibold text-text-main block"
      />
      <div className="text-sm text-text-soft mt-1">{label}</div>
    </div>
  );
}
