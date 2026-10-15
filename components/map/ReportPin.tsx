'use client';

import { memo } from 'react';

import { getCategoryMeta, STATUS_META, type CivicReportRecord } from '@/types/civic';

interface ReportPinProps {
  report: CivicReportRecord;
  label: string;
  onClick: () => void;
}

/**
 * Pin mappa a goccia nel colore della categoria, emoji in cerchio bianco,
 * pallino di stato (aperta/in lavorazione/risolta) in alto a destra.
 * Da usare con <Marker anchor="bottom">: la punta tocca la posizione esatta.
 */
export const ReportPin = memo(function ReportPin({ report, label, onClick }: ReportPinProps) {
  const meta = getCategoryMeta(report.category);
  const status = STATUS_META[report.status ?? 'open'];
  const resolved = report.status === 'resolved';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="relative block cursor-pointer hover:scale-110 active:scale-95 transition-transform"
      style={{ width: 46, height: 56, opacity: resolved ? 0.72 : 1 }}
    >
      {/* Ombra a terra */}
      <span
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[18px] h-[6px] rounded-full"
        style={{ background: 'rgba(16,24,40,0.3)', filter: 'blur(3px)' }}
        aria-hidden
      />

      {/* Corpo a goccia */}
      <span
        className="absolute top-0 left-1/2 w-[40px] h-[40px]"
        style={{
          background: `linear-gradient(135deg, ${meta.color}, ${meta.color}dd)`,
          border: '2.5px solid #ffffff',
          borderRadius: '50% 50% 50% 0',
          transform: 'translateX(-50%) rotate(-45deg)',
          transformOrigin: 'center',
          boxShadow: '0 6px 16px rgba(16,24,40,0.3)',
        }}
        aria-hidden
      />

      {/* Emoji in cerchio bianco */}
      <span
        className="absolute top-[6px] left-1/2 -translate-x-1/2 w-[28px] h-[28px] rounded-full bg-white flex items-center justify-center text-[15px] leading-none"
        aria-hidden
      >
        {meta.emoji}
      </span>

      {/* Stato */}
      <span
        className="absolute top-[-2px] right-[2px] w-[13px] h-[13px] rounded-full border-2 border-white"
        style={{ background: status.color }}
        aria-hidden
      />
    </button>
  );
});

/** Posizione dell'utente: punto oro con onde radar */
export function UserLocationDot() {
  return (
    <div className="relative flex items-center justify-center" aria-hidden>
      <span className="absolute w-10 h-10 rounded-full border border-(--gold-500)/60 animate-radar" />
      <span
        className="absolute w-10 h-10 rounded-full border border-(--gold-500)/60 animate-radar"
        style={{ animationDelay: '1.2s' }}
      />
      <span
        className="relative w-[15px] h-[15px] rounded-full bg-gold-500 border-2 border-white"
        style={{ boxShadow: '0 2px 10px rgba(245,179,1,0.7)' }}
      />
    </div>
  );
}
