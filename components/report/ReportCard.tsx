'use client';

import { Clock, MapPin, MessageCircle, ThumbsDown, ThumbsUp } from 'lucide-react';

import { ReportMapThumbnail } from '@/components/report/ReportMapThumbnail';
import { useT } from '@/lib/i18n';
import { timeAgo } from '@/lib/time';
import { getCategoryMeta, STATUS_META, type CivicReportRecord } from '@/types/civic';

interface ReportCardProps {
  report: CivicReportRecord;
  onClick: () => void;
  ariaLabel: string;
}

function CountChip({ icon, value }: { icon: React.ReactNode; value: number }) {
  return (
    <span className="flex items-center gap-1 text-[12px] font-semibold text-mid">
      {icon}
      {value}
    </span>
  );
}

/**
 * Card segnalazione: anteprima mappa con badge categoria a sinistra,
 * a destra categoria, luogo, tempo, stato e contatori della comunità.
 */
export function ReportCard({ report, onClick, ariaLabel }: ReportCardProps) {
  const t = useT();
  const meta = getCategoryMeta(report.category);
  const status = STATUS_META[report.status ?? 'open'];
  const place = report.address ?? report.city;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="w-full card rounded-3xl p-2.5 flex gap-3.5 text-left hover:shadow-(--shadow-float) active:scale-[0.99] transition-all"
    >
      {/* Mappa con badge categoria */}
      <div className="relative w-[104px] h-[104px] shrink-0 rounded-[18px] overflow-hidden">
        <ReportMapThumbnail report={report} withPin={false} />
        <span
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: `${meta.color}22` }}
          aria-hidden
        >
          <span
            className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-[22px] leading-none"
            style={{ border: `2.5px solid ${meta.color}`, boxShadow: '0 4px 12px rgba(15,23,42,0.18)' }}
          >
            {meta.emoji}
          </span>
        </span>
      </div>

      {/* Testo */}
      <div className="flex-1 min-w-0 flex flex-col py-1 pr-1.5">
        <div className="flex items-start justify-between gap-2">
          <p
            className="text-[16px] font-bold text-hi leading-tight truncate"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t(meta.labelKey)}
          </p>
          <span
            className="shrink-0 flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
            style={{ background: `${status.color}17`, color: status.color }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: status.color }} aria-hidden />
            {t(status.labelKey)}
          </span>
        </div>

        {place && (
          <p className="mt-1.5 flex items-center gap-1 text-[13px] text-mid truncate">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-low" />
            <span className="truncate">{place}</span>
          </p>
        )}
        <p className="mt-0.5 flex items-center gap-1 text-[13px] text-low">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          {timeAgo(report.created_at, t)}
        </p>

        <div className="mt-auto pt-2 flex items-center gap-3.5">
          <CountChip icon={<ThumbsUp className="w-3.5 h-3.5 text-success" />} value={report.likes} />
          {report.dislikes > 0 && (
            <CountChip
              icon={<ThumbsDown className="w-3.5 h-3.5 text-danger" />}
              value={report.dislikes}
            />
          )}
          <CountChip
            icon={<MessageCircle className="w-3.5 h-3.5 text-info" />}
            value={report.comments_count}
          />
        </div>
      </div>
    </button>
  );
}
