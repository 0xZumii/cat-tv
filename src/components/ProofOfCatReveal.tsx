import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { X, Sparkles } from 'lucide-react';
import { ProofOfCat, ProofOfCatVerdict } from '../types';
import { ProofOfCatBadge } from './ProofOfCatBadge';

interface ProofOfCatRevealProps {
  proof: ProofOfCat;
  catName: string;
  catImageUrl: string;
  onClose: () => void;
}

const VERDICT_HEADLINES: Record<ProofOfCatVerdict, string[]> = {
  certified_cat: [
    'VERIFIED!',
    'PAWSITIVELY AUTHENTIC!',
    'CERTIFIED FELINE!',
    '100% REAL CAT!',
  ],
  probably_cat: [
    'PROBABLY A CAT...',
    'CAT-ISH...',
    'LIKELY FELINE...',
    'ALMOST CERTAIN!',
  ],
  suspicious_critter: [
    'SUSPICIOUS...',
    'HMMMM...',
    'INVESTIGATING...',
    'CAT...?',
  ],
  ai_imposter: [
    'AI DETECTED!',
    'DIGITAL WHISKERS!',
    'SYNTHETIC MEOW!',
    'BEEP BOOP!',
  ],
  unknown_entity: [
    '???',
    'UNKNOWN!',
    'MYSTERIOUS...',
    'UNCLASSIFIED!',
  ],
  chaos_agent: [
    'CHAOS!',
    'BEYOND CLASSIFICATION!',
    'SYSTEM OVERLOAD!',
    'THE PROPHECY!',
  ],
};

export function ProofOfCatReveal({ proof, catName, catImageUrl, onClose }: ProofOfCatRevealProps) {
  const [stage, setStage] = useState<'scanning' | 'reveal' | 'complete'>('scanning');
  const [scanProgress, setScanProgress] = useState(0);

  const headlines = VERDICT_HEADLINES[proof.verdict];
  const headline = headlines[Math.floor(Math.random() * headlines.length)];

  useEffect(() => {
    // Scanning animation
    const scanInterval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(scanInterval);
          return 100;
        }
        return prev + Math.random() * 15 + 5;
      });
    }, 100);

    // Transition to reveal after scanning
    const revealTimeout = setTimeout(() => {
      setStage('reveal');
    }, 1500);

    // Transition to complete
    const completeTimeout = setTimeout(() => {
      setStage('complete');
    }, 2000);

    return () => {
      clearInterval(scanInterval);
      clearTimeout(revealTimeout);
      clearTimeout(completeTimeout);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && stage === 'complete' && onClose()}
    >
      <div
        className={clsx(
          'bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden',
          'transform transition-all duration-500',
          stage === 'scanning' && 'scale-95',
          stage === 'reveal' && 'scale-105',
          stage === 'complete' && 'scale-100'
        )}
      >
        {/* Close button */}
        {stage === 'complete' && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
          >
            <X size={24} />
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-2 text-accent-lavender mb-1">
            <Sparkles size={20} />
            <span className="text-sm font-medium uppercase tracking-wider">
              Proof of Cat
            </span>
            <Sparkles size={20} />
          </div>
          <h2 className="font-display text-2xl font-bold text-text-main">
            {catName}
          </h2>
        </div>

        {/* Cat image with scan effect */}
        <div className="relative aspect-square rounded-xl overflow-hidden mb-4">
          <img
            src={catImageUrl}
            alt={catName}
            className="w-full h-full object-cover"
          />

          {/* Scanning overlay */}
          {stage === 'scanning' && (
            <>
              <div className="absolute inset-0 bg-gradient-to-b from-accent-lavender/30 to-transparent animate-scan" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2">
                  <p className="text-white text-sm font-mono">
                    Analyzing... {Math.min(100, Math.floor(scanProgress))}%
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Reveal flash */}
          {stage === 'reveal' && (
            <div className="absolute inset-0 bg-white animate-flash" />
          )}
        </div>

        {/* Result */}
        <div
          className={clsx(
            'transition-all duration-500 transform',
            stage === 'complete' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          {/* Headline */}
          <div className="text-center mb-4">
            <p
              className={clsx(
                'font-display text-3xl font-black tracking-tight',
                proof.verdict === 'certified_cat' && 'text-green-600',
                proof.verdict === 'probably_cat' && 'text-blue-600',
                proof.verdict === 'suspicious_critter' && 'text-amber-600',
                proof.verdict === 'ai_imposter' && 'text-purple-600',
                proof.verdict === 'unknown_entity' && 'text-gray-600',
                proof.verdict === 'chaos_agent' && 'text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-purple-600 to-cyan-600'
              )}
            >
              {headline}
            </p>
          </div>

          {/* Certificate */}
          <ProofOfCatBadge proof={proof} size="lg" showMessage />

          {/* Dismiss hint */}
          <p className="text-center text-sm text-gray-400 mt-4">
            Tap anywhere to dismiss
          </p>
        </div>

        {/* Loading state */}
        {stage !== 'complete' && (
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 text-accent-lavender">
              <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {stage === 'scanning' ? 'Verifying cat authenticity...' : 'Processing results...'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
