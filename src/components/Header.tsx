import { Fish, LogIn, LogOut } from 'lucide-react';
import { AnimatedNumber } from './AnimatedNumber';

interface HeaderProps {
  balance: number;
  canClaim: boolean;
  timeUntilClaim: string | null;
  claiming: boolean;
  onClaim: () => void;
  isAuthenticated: boolean;
  onLogin: () => void;
  onLogout: () => void;
}

export function Header({
  balance,
  canClaim,
  timeUntilClaim,
  claiming,
  onClaim,
  isAuthenticated,
  onLogin,
  onLogout,
}: HeaderProps) {
  return (
    <header className="px-6 py-5 flex justify-between items-center max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <span className="text-4xl">🐱</span>
        <h1 className="font-display text-2xl font-semibold text-text-main">
          Cat TV
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <>
            {/* Balance Display */}
            <div className="flex items-center gap-2 bg-white/70 backdrop-blur-xl border border-white/20 px-4 py-2 rounded-full shadow-soft">
              <Fish className="w-5 h-5 text-accent-orange" />
              <AnimatedNumber
                value={balance}
                className="font-bold text-text-main"
              />
            </div>

            {/* Claim Button */}
            <button
              onClick={onClaim}
              disabled={!canClaim || claiming}
              className={`
                px-5 py-2.5 rounded-full font-semibold text-sm transition-all
                ${canClaim && !claiming
                  ? 'bg-accent-orange text-white hover:bg-opacity-90 hover:scale-105 shadow-soft'
                  : 'bg-gray-100 text-text-soft cursor-not-allowed'
                }
              `}
            >
              {claiming ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">🐟</span>
                  Claiming...
                </span>
              ) : canClaim ? (
                'Claim Daily Food'
              ) : (
                timeUntilClaim || 'Claimed'
              )}
            </button>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="p-2.5 rounded-full bg-gray-100 text-text-soft hover:bg-gray-200 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </>
        ) : (
          /* Login Button */
          <button
            onClick={onLogin}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm bg-accent-orange text-white hover:bg-opacity-90 hover:scale-105 shadow-soft transition-all"
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}
