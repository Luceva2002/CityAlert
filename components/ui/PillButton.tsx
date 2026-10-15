'use client';

import { Loader2 } from 'lucide-react';

interface PillButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  loading?: boolean;
  variant?: 'gold' | 'ghost' | 'glass';
  className?: string;
}

/** Bottone pill principale — oro segnale con glow, o vetro liquido */
export function PillButton({
  children,
  onClick,
  type = 'button',
  disabled,
  loading,
  variant = 'gold',
  className = '',
}: PillButtonProps) {
  const base =
    'w-full h-[54px] rounded-2xl font-semibold text-[16px] flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] select-none';

  const variants = {
    gold: disabled
      ? 'bg-gold-500/35 text-(--on-gold)/50 cursor-not-allowed'
      : 'bg-gold-500 text-(--on-gold) shadow-(--shadow-gold) hover:bg-gold-400',
    ghost: disabled
      ? 'text-low cursor-not-allowed'
      : 'text-mid hover:text-hi',
    glass: disabled
      ? 'card text-low cursor-not-allowed'
      : 'card text-hi hover:bg-(--surface-muted)',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${className}`}
      style={{ fontFamily: 'var(--font-display)' }}
    >
      {loading && <Loader2 className="w-5 h-5 animate-spin" />}
      {children}
    </button>
  );
}
