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
    'w-full h-[54px] rounded-full font-bold text-[16px] tracking-wide flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.97] select-none';

  const variants = {
    gold: disabled
      ? 'bg-(--bg-deep) text-low cursor-not-allowed'
      : 'bg-linear-to-b from-gold-400 to-gold-600 text-(--on-gold) shadow-[0_8px_28px_rgba(245,179,1,0.4)] hover:brightness-105',
    ghost: disabled
      ? 'text-low cursor-not-allowed'
      : 'text-mid hover:text-hi',
    glass: disabled
      ? 'glass text-low cursor-not-allowed'
      : 'glass text-hi hover:bg-white/80',
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
