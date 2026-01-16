import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
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

// Grid: 4 columns x 2 rows = 8 slots
const SLOTS_PER_PAGE = 8;
// Page 1 has Add Cat button taking 1 slot, so only 7 cats
const CATS_ON_FIRST_PAGE = 7;

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
  const [currentPage, setCurrentPage] = useState(0);

  // Create pages of cats (first page has 7, rest have 8)
  const pages = useMemo(() => {
    if (cats.length === 0) return [[]];

    const result: CatWithHappiness[][] = [];
    // First page: 7 cats (Add Cat button takes 1 slot)
    result.push(cats.slice(0, CATS_ON_FIRST_PAGE));

    // Remaining pages: 8 cats each
    for (let i = CATS_ON_FIRST_PAGE; i < cats.length; i += SLOTS_PER_PAGE) {
      result.push(cats.slice(i, i + SLOTS_PER_PAGE));
    }

    return result;
  }, [cats]);

  const totalPages = pages.length;
  const currentCats = pages[currentPage] || [];

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
  };

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 0));
  };

  const hasNextPage = currentPage < totalPages - 1;
  const hasPrevPage = currentPage > 0;

  return (
    <section className="max-w-6xl mx-auto px-6 pb-12">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-semibold text-text-main">
          All Cats
        </h2>
        <div className="flex items-center gap-3">
          {/* Page indicator */}
          <span className="text-sm text-text-soft">
            Page {currentPage + 1} of {totalPages}
          </span>
          {/* Navigation buttons */}
          <div className="flex gap-2">
            <button
              onClick={goToPrevPage}
              disabled={!hasPrevPage}
              className={clsx(
                'flex items-center justify-center w-10 h-10 rounded-full transition-all',
                hasPrevPage
                  ? 'bg-accent-orange text-white hover:bg-opacity-90 shadow-soft'
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed'
              )}
              aria-label="Previous page"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={goToNextPage}
              disabled={!hasNextPage}
              className={clsx(
                'flex items-center justify-center w-10 h-10 rounded-full transition-all',
                hasNextPage
                  ? 'bg-accent-orange text-white hover:bg-opacity-90 shadow-soft'
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed'
              )}
              aria-label="Next page"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Carousel container - 4 cols x 2 rows */}
      <div className="relative overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Upload Card - only show on first page */}
          {currentPage === 0 && (
            <UploadCard
              userId={userId}
              onSuccess={onSuccess}
              onError={onError}
            />
          )}

          {/* Cat Cards for current page */}
          {currentCats.map((cat) => (
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
      </div>

      {/* Page dots */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {pages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentPage(idx)}
              className={clsx(
                'w-2.5 h-2.5 rounded-full transition-all',
                idx === currentPage
                  ? 'bg-accent-orange w-6'
                  : 'bg-gray-300 hover:bg-gray-400'
              )}
              aria-label={`Go to page ${idx + 1}`}
            />
          ))}
        </div>
      )}

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
