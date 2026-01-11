import { useState } from 'react';
import clsx from 'clsx';
import { useApi } from '../contexts/ApiContext';
import { PURCHASE_TIERS } from '../lib/constants';

interface SupportSectionProps {
  isAuthenticated: boolean;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function SupportSection({ isAuthenticated, onError }: SupportSectionProps) {
  const api = useApi();
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const handlePurchase = async (tierId: string) => {
    if (!isAuthenticated || purchasing) return;

    setPurchasing(tierId);

    try {
      const result = await api.callCreateCheckout({
        tierId,
        successUrl: window.location.origin,
        cancelUrl: window.location.origin,
      });

      const data = result.data as { url?: string };

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: unknown) {
      console.error('Purchase error:', err);
      const message = err instanceof Error ? err.message : 'Failed to start checkout';

      if (message?.includes('not configured')) {
        onError('Purchases coming soon!');
      } else {
        onError(message);
      }
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <section className="bg-gradient-to-br from-orange-50 to-orange-100 py-16 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="font-display text-3xl font-semibold text-text-main mb-3">
          Support Cat TV
        </h2>
        <p className="text-lg text-text-soft mb-8">
          Want to feed more cats? Your support keeps Cat TV running and helps real shelters.
        </p>

        {/* Purchase Tiers */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-8">
          {PURCHASE_TIERS.map((tier, index) => (
            <button
              key={tier.id}
              onClick={() => handlePurchase(tier.id)}
              disabled={purchasing !== null}
              className={clsx(
                'bg-white rounded-card p-6 min-w-[180px] shadow-card transition-all',
                'hover:scale-105 hover:shadow-lg border-3',
                purchasing === tier.id && 'opacity-75',
                index === 1
                  ? 'border-accent-orange relative'
                  : 'border-transparent hover:border-accent-orange'
              )}
            >
              {/* Popular Badge */}
              {index === 1 && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent-orange text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                  Most Popular
                </span>
              )}

              <div className="font-display text-4xl font-semibold text-accent-orange mb-2">
                ${tier.priceUsd}
              </div>
              <div className="font-bold text-text-main mb-1">
                {tier.cattv} Food
              </div>
              <div className="text-sm text-text-soft">
                Feed {tier.catsCanFeed} cats
              </div>
            </button>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="bg-accent-orange/10 rounded-2xl px-6 py-4 max-w-lg mx-auto">
          <p className="text-sm text-text-main leading-relaxed">
            <strong className="text-accent-orange">Your purchase supports:</strong>{' '}
            The Care Fund, which funds real cat shelter donations, keeps Cat TV free for everyone, and sustains the community. Thank you for caring!
          </p>
        </div>
      </div>
    </section>
  );
}
