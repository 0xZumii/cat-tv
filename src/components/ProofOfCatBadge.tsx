import clsx from 'clsx';
import { ProofOfCat, ProofOfCatVerdict } from '../types';
import { ShieldCheck, ShieldQuestion, ShieldAlert, Bot, HelpCircle, Zap } from 'lucide-react';

interface ProofOfCatBadgeProps {
  proof: ProofOfCat;
  size?: 'sm' | 'md' | 'lg';
  showMessage?: boolean;
}

const VERDICT_CONFIG: Record<
  ProofOfCatVerdict,
  {
    label: string;
    emoji: string;
    icon: typeof ShieldCheck;
    bgColor: string;
    textColor: string;
    borderColor: string;
  }
> = {
  certified_cat: {
    label: 'Certified Cat',
    emoji: '✅',
    icon: ShieldCheck,
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
  },
  probably_cat: {
    label: 'Probably Cat',
    emoji: '🤔',
    icon: ShieldQuestion,
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
  },
  suspicious_critter: {
    label: 'Suspicious Critter',
    emoji: '🕵️',
    icon: ShieldAlert,
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
  },
  ai_imposter: {
    label: 'AI Imposter',
    emoji: '🤖',
    icon: Bot,
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
  },
  unknown_entity: {
    label: 'Unknown Entity',
    emoji: '👽',
    icon: HelpCircle,
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-200',
  },
  chaos_agent: {
    label: 'Chaos Agent',
    emoji: '🌀',
    icon: Zap,
    bgColor: 'bg-gradient-to-r from-pink-50 via-purple-50 to-cyan-50',
    textColor: 'text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-purple-600 to-cyan-600',
    borderColor: 'border-purple-300',
  },
};

export function ProofOfCatBadge({ proof, size = 'sm', showMessage = false }: ProofOfCatBadgeProps) {
  const config = VERDICT_CONFIG[proof.verdict];
  const Icon = config.icon;

  if (size === 'sm') {
    return (
      <div
        className={clsx(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
          config.bgColor,
          config.textColor,
          config.borderColor
        )}
        title={proof.funnyMessage}
      >
        <span>{config.emoji}</span>
        <span>{config.label}</span>
      </div>
    );
  }

  if (size === 'md') {
    return (
      <div
        className={clsx(
          'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border',
          config.bgColor,
          config.textColor,
          config.borderColor
        )}
        title={proof.funnyMessage}
      >
        <Icon size={14} />
        <span>{config.emoji}</span>
        <span>{config.label}</span>
        <span className="opacity-60">({proof.confidence}%)</span>
      </div>
    );
  }

  // Large size - full certificate style
  return (
    <div
      className={clsx(
        'rounded-xl border-2 p-4',
        config.bgColor,
        config.borderColor
      )}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={clsx('p-2 rounded-full', config.bgColor, 'border', config.borderColor)}>
          <Icon size={24} className={config.textColor} />
        </div>
        <div>
          <div className={clsx('font-display font-bold text-lg', config.textColor)}>
            {config.emoji} {config.label}
          </div>
          <div className="text-sm text-gray-500">
            Confidence: {proof.confidence}%
          </div>
        </div>
      </div>
      {showMessage && (
        <p className={clsx('text-sm mt-2', config.textColor, 'opacity-80')}>
          {proof.funnyMessage}
        </p>
      )}
    </div>
  );
}
