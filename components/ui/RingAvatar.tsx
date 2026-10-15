interface RingAvatarProps {
  initial: string;
  size?: 'sm' | 'lg';
}

/** Avatar con anelli concentrici — vetro chiaro + oro */
export function RingAvatar({ initial, size = 'lg' }: RingAvatarProps) {
  if (size === 'sm') {
    return (
      <div className="w-11 h-11 rounded-full glass flex items-center justify-center text-sm font-bold text-gold-600">
        {initial}
      </div>
    );
  }

  return (
    <div className="relative w-[168px] h-[168px] flex items-center justify-center mx-auto">
      <span className="absolute inset-0 rounded-full border border-[rgba(16,24,40,0.05)] scale-[1.12]" />
      <span className="absolute inset-2 rounded-full border border-[rgba(16,24,40,0.07)] scale-105" />
      <span className="absolute inset-5 rounded-full border border-[rgba(245,179,1,0.35)]" />
      <span
        className="relative w-[112px] h-[112px] rounded-full flex items-center justify-center text-4xl font-bold text-(--on-gold)"
        style={{
          background: 'linear-gradient(135deg, var(--gold-300), var(--gold-600))',
          boxShadow: '0 8px 28px rgba(245,179,1,0.4)',
          fontFamily: 'var(--font-display)',
        }}
      >
        {initial}
      </span>
    </div>
  );
}
