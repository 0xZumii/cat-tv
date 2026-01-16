import { useMemo } from 'react';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { CatWithHappiness } from '../types';

interface HungryCatAlertProps {
  cats: CatWithHappiness[];
  onScrollToCat?: (catId: string) => void;
}

export function HungryCatAlert({ cats, onScrollToCat }: HungryCatAlertProps) {
  // Find cats that are sad (hungry) and sort by longest time since fed
  const hungryCats = useMemo(() => {
    return cats
      .filter(cat => cat.happiness.level === 'sad')
      .sort((a, b) => (a.lastFedAt || 0) - (b.lastFedAt || 0))
      .slice(0, 3);
  }, [cats]);

  if (hungryCats.length === 0) {
    return null;
  }

  const handleClick = (catId: string) => {
    if (onScrollToCat) {
      onScrollToCat(catId);
    } else {
      // Fallback: scroll to cat grid
      const element = document.getElementById(`cat-${catId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add a brief highlight effect
        element.classList.add('ring-4', 'ring-accent-orange', 'ring-opacity-50');
        setTimeout(() => {
          element.classList.remove('ring-4', 'ring-accent-orange', 'ring-opacity-50');
        }, 2000);
      }
    }
  };

  return (
    <div className="bg-gradient-to-r from-accent-pink/10 to-accent-orange/10 border-b border-accent-pink/20">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sad">
            <AlertCircle size={18} />
            <span className="font-semibold text-sm">These cats need some love!</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
            {hungryCats.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleClick(cat.id)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow text-sm whitespace-nowrap group"
              >
                <span>{cat.happiness.emoji}</span>
                <span className="font-medium text-text-main">{cat.name}</span>
                <ChevronRight size={14} className="text-text-soft group-hover:text-accent-orange transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
