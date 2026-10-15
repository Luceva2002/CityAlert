'use client';

import { MessageCircle, ThumbsDown, ThumbsUp } from 'lucide-react';

import { ReportMapThumbnail } from '@/components/report/ReportMapThumbnail';
import { getCategoryMeta, type CivicReportRecord } from '@/types/civic';

interface ReportCardProps {
  report: CivicReportRecord;
  onClick: () => void;
  ariaLabel: string;
}

function CountChip({ icon, value }: { icon: React.ReactNode; value: number }) {
  return (
    <span className="flex items-center gap-1 rounded-full glass-heavy px-2.5 py-1 text-[11px] font-bold text-hi">
      {icon}
      {value}
    </span>
  );
}

/**
 * Card segnalazione (mockup Figma): metà sinistra nel colore categoria
 * con anelli concentrici e icona in cerchio bianco, metà destra mappa
 * con i contatori della validazione comunitaria.
 */
export function ReportCard({ report, onClick, ariaLabel }: ReportCardProps) {
  const meta = getCategoryMeta(report.category);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="w-full h-[168px] rounded-[28px] overflow-hidden flex text-left border border-white/70 shadow-[0_4px_20px_rgba(16,24,40,0.1)] hover:shadow-[0_10px_32px_rgba(16,24,40,0.16)] active:scale-[0.98] transition-all bg-white"
      style={{ opacity: report.status === 'resolved' ? 0.65 : 1 }}
    >
      {/* Blocco colore con anelli concentrici */}
      <div
        className="relative w-[45%] shrink-0 overflow-hidden flex items-center justify-center"
        style={{ background: meta.color }}
      >
        {[92, 140, 190, 240].map((size) => (
          <span
            key={size}
            className="absolute rounded-full border-[6px] border-white/25"
            style={{ width: size, height: size }}
            aria-hidden
          />
        ))}
        <span className="relative w-[72px] h-[72px] rounded-full bg-white flex items-center justify-center text-[34px] leading-none shadow-[0_4px_14px_rgba(16,24,40,0.2)]">
          {meta.emoji}
        </span>
      </div>

      {/* Mappa + contatori sociali */}
      <div className="relative flex-1 min-w-0">
        <ReportMapThumbnail report={report} />
        <div className="absolute bottom-2.5 right-2.5 flex gap-1.5">
          {report.likes > 0 && (
            <CountChip icon={<ThumbsUp className="w-3 h-3 text-success" />} value={report.likes} />
          )}
          {report.dislikes > 0 && (
            <CountChip
              icon={<ThumbsDown className="w-3 h-3 text-danger" />}
              value={report.dislikes}
            />
          )}
          {report.comments_count > 0 && (
            <CountChip
              icon={<MessageCircle className="w-3 h-3 text-info" />}
              value={report.comments_count}
            />
          )}
        </div>
      </div>
    </button>
  );
}
