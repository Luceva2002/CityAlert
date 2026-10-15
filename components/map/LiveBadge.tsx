'use client';

/** Badge "LIVE" con pallino pulsante e contatore/etichetta */
export function LiveBadge({ label }: { label: string }) {
  return (
    <div className="glass rounded-full h-8 px-4 flex items-center gap-2">
      <span className="relative flex w-2 h-2" aria-hidden>
        <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-50 animate-ping" />
        <span className="relative inline-flex rounded-full w-2 h-2 bg-success" />
      </span>
      <span className="text-[11px] font-bold tracking-[0.08em] text-mid uppercase">{label}</span>
    </div>
  );
}
