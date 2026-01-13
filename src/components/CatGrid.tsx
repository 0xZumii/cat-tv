import { CatVibe, CatWithHappiness } from '../types';
import { CatCard } from './CatCard';
import { UploadCard } from './UploadCard';

interface CatGridProps {
  cats: CatWithHappiness[];
  userId: string | undefined;
  canFeed: boolean;
  onFeed: (catId: string) => void;
  isFeedingCat: (catId: string) => boolean;
  onUpdateVibes: (catId: string, vibes: CatVibe[]) => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function CatGrid({
  cats,
  userId,
  canFeed,
  onFeed,
  isFeedingCat,
  onUpdateVibes,
  onSuccess,
  onError,
}: CatGridProps) {
  return (
    <section className="max-w-6xl mx-auto px-6 pb-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Upload Card */}
        <UploadCard
          userId={userId}
          onSuccess={onSuccess}
          onError={onError}
        />

        {/* Cat Cards */}
        {cats.map((cat) => (
          <CatCard
            key={cat.id}
            cat={cat}
            userId={userId}
            onFeed={onFeed}
            canFeed={canFeed}
            isFeeding={isFeedingCat(cat.id)}
            onUpdateVibes={onUpdateVibes}
          />
        ))}
      </div>

      {cats.length === 0 && (
        <div className="text-center py-12 text-text-soft">
          <p className="text-5xl mb-4">🐱</p>
          <p className="font-display text-xl">No cats yet!</p>
          <p className="mt-2">Be the first to add a furry friend.</p>
        </div>
      )}
    </section>
  );
}
