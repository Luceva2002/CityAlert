'use client';

import Link from 'next/link';

interface GlassIconButtonProps {
  ariaLabel: string;
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  size?: number;
  heavy?: boolean;
  disabled?: boolean;
  className?: string;
}

/** Bottone circolare in vetro liquido con icona (o Link se `href`) */
export function GlassIconButton({
  ariaLabel,
  children,
  onClick,
  href,
  size = 44,
  heavy = false,
  disabled,
  className = '',
}: GlassIconButtonProps) {
  const cls = `${heavy ? 'glass-heavy' : 'glass'} rounded-full flex items-center justify-center text-hi active:scale-95 hover:bg-white transition-all disabled:opacity-40 ${className}`;
  const style = { width: size, height: size };

  if (href) {
    return (
      <Link href={href} aria-label={ariaLabel} className={cls} style={style}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cls}
      style={style}
    >
      {children}
    </button>
  );
}
