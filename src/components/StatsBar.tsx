import { formatNumber } from '../lib/constants';

interface StatsBarProps {
  totalFeeds: number;
  happyCats: number;
  totalCats: number;
}

export function StatsBar({ totalFeeds, happyCats, totalCats }: StatsBarProps) {
  return (
    <div className="flex justify-center gap-12 py-6 max-w-6xl mx-auto">
      <Stat value={formatNumber(totalFeeds)} label="Total Feeds" />
      <Stat value={happyCats.toString()} label="Happy Cats" />
      <Stat value={totalCats.toString()} label="Cats" />
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="font-display text-3xl font-semibold text-text-main">
        {value}
      </div>
      <div className="text-sm text-text-soft mt-1">{label}</div>
    </div>
  );
}
