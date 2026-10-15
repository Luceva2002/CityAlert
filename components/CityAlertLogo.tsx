interface CityAlertLogoProps {
  className?: string;
  /** Mostra solo il simbolo, senza scritta */
  markOnly?: boolean;
}

/**
 * Logo CityAlert — pin di segnalazione con "!" e onde radar + wordmark.
 * Scala con il font-size del contenitore (usa className tipo `text-[42px]`).
 */
export function CityAlertLogo({ className = '', markOnly = false }: CityAlertLogoProps) {
  return (
    <span
      className={`inline-flex items-center gap-[0.26em] leading-none select-none ${className}`}
      style={{ fontFamily: 'var(--font-display)' }}
    >
      <svg
        viewBox="0 0 48 48"
        style={{ width: '1.08em', height: '1.08em' }}
        aria-hidden
        className="shrink-0"
      >
        <defs>
          <linearGradient id="ca-mark-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffd23e" />
            <stop offset="55%" stopColor="#f5b301" />
            <stop offset="100%" stopColor="#d89b00" />
          </linearGradient>
        </defs>

        {/* Onde radar */}
        <path
          d="M36.5 8.5a14.5 14.5 0 0 1 4.3 4.6"
          fill="none"
          stroke="#f5b301"
          strokeOpacity="0.45"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path
          d="M39.8 3.9a20 20 0 0 1 5.9 6.3"
          fill="none"
          stroke="#f5b301"
          strokeOpacity="0.25"
          strokeWidth="2.6"
          strokeLinecap="round"
        />

        {/* Pin */}
        <path
          d="M22.5 4.5C13.9 4.5 7 11.4 7 20c0 10.6 13 22.4 14.6 23.8a1.4 1.4 0 0 0 1.8 0C25 42.4 38 30.6 38 20c0-8.6-6.9-15.5-15.5-15.5z"
          fill="url(#ca-mark-gold)"
        />

        {/* Riflesso liquid */}
        <ellipse cx="17" cy="12.5" rx="7.5" ry="4.6" fill="#ffffff" opacity="0.32" transform="rotate(-24 17 12.5)" />

        {/* Punto esclamativo */}
        <rect x="20.3" y="11.5" width="4.4" height="11.5" rx="2.2" fill="#ffffff" />
        <circle cx="22.5" cy="28.4" r="2.6" fill="#ffffff" />
      </svg>

      {!markOnly && (
        <span className="font-bold tracking-tight inline-flex items-baseline">
          <span className="text-hi">City</span>
          <span className="text-gold-gradient">Alert</span>
        </span>
      )}
    </span>
  );
}
