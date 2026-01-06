import { useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useCats } from './hooks/useCats';
import { useBalance } from './hooks/useBalance';
import { useFeed } from './hooks/useFeed';
import { useToast } from './hooks/useToast';

import { LoadingScreen } from './components/LoadingScreen';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { CatGrid } from './components/CatGrid';
import { SupportSection } from './components/SupportSection';
import { AboutSection } from './components/AboutSection';
import { Footer } from './components/Footer';
import { ToastContainer } from './components/Toast';

function App() {
  const { user, loading: authLoading, isAuthenticated, updateUser } = useAuth();
  const { cats, happyCatsCount, totalCats, loading: catsLoading } = useCats();
  const { balance, claiming, canClaimNow, timeUntilClaim, canAffordFeed, claim } = useBalance({ user, updateUser });
  const { feed, isFeedingCat } = useFeed({ user, updateUser });
  const { toasts, showToast, removeToast } = useToast();

  // Check for purchase success on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const purchaseStatus = params.get('purchase');

    if (purchaseStatus === 'success') {
      showToast('Thank you for supporting Cat TV! 💛 Your food has been added.');
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
      showToast(`Claimed ${result.claimed} cat food! 🐟`);
    } else if (result?.error) {
      showToast(result.error, 'error');
    }
  };

  // Handle feed
  const handleFeed = async (catId: string) => {
    const result = await feed(catId);
    if (result?.success) {
      showToast(result.message || 'Fed successfully! 😸');
    } else if (result?.error) {
      showToast(result.error, 'error');
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
      {/* Background Gradient */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `
            radial-gradient(ellipse at 20% 20%, rgba(255, 180, 180, 0.3) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(184, 224, 210, 0.3) 0%, transparent 50%),
            radial-gradient(ellipse at 60% 10%, rgba(212, 165, 255, 0.2) 0%, transparent 40%)
          `
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        <Header
          balance={balance}
          canClaim={canClaimNow}
          timeUntilClaim={timeUntilClaim}
          claiming={claiming}
          onClaim={handleClaim}
        />

        <main>
          <StatsBar
            totalFeeds={totalFeeds}
            happyCats={happyCatsCount}
            totalCats={totalCats}
          />

          <CatGrid
            cats={cats}
            userId={user?.id}
            canFeed={canAffordFeed}
            onFeed={handleFeed}
            isFeedingCat={isFeedingCat}
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
