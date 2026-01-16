import { useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useCats } from './hooks/useCats';
import { useBalance } from './hooks/useBalance';
import { useFeed } from './hooks/useFeed';
import { useToast } from './hooks/useToast';
import { useApi } from './contexts/ApiContext';
import { CONFIG } from './lib/constants';
import { CatVibe } from './types';

import { LoadingScreen } from './components/LoadingScreen';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { LiveFeedTicker } from './components/LiveFeedTicker';
import { HungryCatAlert } from './components/HungryCatAlert';
import { CatGrid } from './components/CatGrid';
import { ChannelTV } from './components/ChannelTV';
import { CatFacts } from './components/CatFacts';
import { SupportSection } from './components/SupportSection';
import { AboutSection } from './components/AboutSection';
import { Footer } from './components/Footer';
import { ToastContainer } from './components/Toast';

function App() {
  const { user, loading: authLoading, isAuthenticated, updateUser, login, logout } = useAuth();
  const { cats, happyCatsCount, totalCats, loading: catsLoading } = useCats();
  const { balance, claiming, canClaimNow, timeUntilClaim, canAffordFeed, claim, spendOptimistic } = useBalance({ user, updateUser });
  const { feed, isFeedingCat } = useFeed({ user, updateUser, balance });
  const { toasts, showToast, removeToast } = useToast();
  const api = useApi();

  // Check for purchase success on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const purchaseStatus = params.get('purchase');

    if (purchaseStatus === 'success') {
      showToast('Thank you for supporting Cat TV! 💛 Your treats have been added.');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (purchaseStatus === 'cancelled') {
      showToast('Purchase cancelled', 'error');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [showToast]);

  // Handle claim
  const handleClaim = async () => {
    const result = await claim();
    if (result?.success) {
      showToast(`Claimed ${result.claimed} treats! 🐟`);
    } else if (result?.error) {
      showToast(result.error, 'error');
    }
  };

  // Handle feed
  const handleFeed = async (catId: string) => {
    const result = await feed(catId);
    if (result?.success) {
      spendOptimistic(CONFIG.FEED_COST);
      showToast(result.message || 'Vibed! 😸');
    } else if (result?.error) {
      showToast(result.error, 'error');
    }
  };

  // Handle update cat vibes
  const handleUpdateVibes = async (catId: string, vibes: CatVibe[]) => {
    try {
      await api.callUpdateCatVibes({ catId, vibes });
      showToast('Vibes updated! ✨');
    } catch {
      showToast('Failed to update vibes', 'error');
    }
  };

  // Show loading screen
  if (authLoading || catsLoading) {
    return <LoadingScreen />;
  }

  // Calculate total feeds (from cats data)
  const totalFeeds = cats.reduce((sum, cat) => sum + (cat.totalFed || 0), 0);

  return (
    <div className="min-h-screen bg-warm-bg">
      {/* Animated Background Gradient */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Animated gradient base */}
        <div
          className="absolute inset-0 animate-gradient opacity-60"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 180, 180, 0.4) 0%, rgba(255, 248, 240, 0.2) 25%, rgba(184, 224, 210, 0.4) 50%, rgba(255, 248, 240, 0.2) 75%, rgba(212, 165, 255, 0.4) 100%)',
          }}
        />
        {/* Floating orbs */}
        <div
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full animate-float-slow opacity-40"
          style={{ background: 'radial-gradient(circle, rgba(255, 180, 180, 0.6) 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/3 -right-32 w-[500px] h-[500px] rounded-full animate-float-slower opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(184, 224, 210, 0.6) 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-32 left-1/4 w-[400px] h-[400px] rounded-full animate-float-slow opacity-35"
          style={{ background: 'radial-gradient(circle, rgba(212, 165, 255, 0.5) 0%, transparent 70%)' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Header
          balance={balance}
          canClaim={canClaimNow}
          timeUntilClaim={timeUntilClaim}
          claiming={claiming}
          onClaim={handleClaim}
          isAuthenticated={isAuthenticated}
          onLogin={login}
          onLogout={logout}
        />

        <main>
          <StatsBar
            totalFeeds={totalFeeds}
            happyCats={happyCatsCount}
            totalCats={totalCats}
          />

          <LiveFeedTicker cats={cats} />
          <HungryCatAlert cats={cats} />

          <ChannelTV
            cats={cats}
            canFeed={canAffordFeed}
            onFeed={handleFeed}
            isFeedingCat={isFeedingCat}
          />

          <CatFacts />

          <CatGrid
            cats={cats}
            userId={user?.id}
            canFeed={canAffordFeed}
            onFeed={handleFeed}
            isFeedingCat={isFeedingCat}
            onUpdateVibes={handleUpdateVibes}
            onSuccess={(msg) => showToast(msg)}
            onError={(msg) => showToast(msg, 'error')}
          />

          <SupportSection
            isAuthenticated={isAuthenticated}
            onSuccess={(msg) => showToast(msg)}
            onError={(msg) => showToast(msg, 'error')}
          />

          <AboutSection />
        </main>

        <Footer />
      </div>

      {/* Toasts */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default App;
