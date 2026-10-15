'use client';

import { MessageCircle, ThumbsUp } from 'lucide-react';

import { LiveBadge } from '@/components/map/LiveBadge';
import { useT } from '@/lib/i18n';
import { timeAgo } from '@/lib/time';
import { getCategoryMeta, STATUS_META, type CivicReportRecord } from '@/types/civic';

interface RecentReportsPanelProps {
  reports: CivicReportRecord[];
  openCount: number;
  onSelect: (report: CivicReportRecord) => void;
}

/** Pannello desktop (lg+): lista live delle segnalazioni recenti */
export function RecentReportsPanel({ reports, openCount, onSelect }: RecentReportsPanelProps) {
  const t = useT();

  return (
    <aside className="hidden lg:flex absolute left-6 top-[120px] bottom-8 w-[350px] z-20 flex-col glass-heavy rounded-[26px] overflow-hidden">
      <div className="shrink-0 px-5 pt-5 pb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-hi" style={{ fontFamily: 'var(--font-display)' }}>
          {t('map.recent.title')}
        </h2>
        <LiveBadge label={String(openCount)} />
      </div>

      {reports.length === 0 ? (
        <p className="flex-1 flex items-center justify-center text-sm text-low text-center whitespace-pre-line px-8 leading-relaxed">
          {t('map.recent.empty')}
        </p>
      ) : (
        <ul className="flex-1 overflow-y-auto no-scrollbar px-3 pb-3 space-y-1.5">
          {reports.map((report) => {
            const meta = getCategoryMeta(report.category);
            const status = STATUS_META[report.status ?? 'open'];
            return (
              <li key={report.id}>
                <button
                  type="button"
                  onClick={() => onSelect(report)}
                  className="w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 hover:bg-(--surface-muted) active:scale-[0.99] transition-all text-left"
                >
                  <span
                    className="w-11 h-11 rounded-full flex items-center justify-center text-xl shrink-0 bg-white"
                    style={{ border: `2px solid ${meta.color}` }}
                  >
                    {meta.emoji}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-bold text-hi truncate">
                      {t(meta.labelKey)}
                    </span>
                    <span className="block text-xs text-mid truncate">
                      {report.city ? `${report.city} · ` : ''}
                      {timeAgo(report.created_at, t)}
                    </span>
                  </span>
                  {(report.likes > 0 || report.comments_count > 0) && (
                    <span className="flex items-center gap-2 text-[11px] font-bold text-low shrink-0">
                      {report.likes > 0 && (
                        <span className="flex items-center gap-0.5">
                          <ThumbsUp className="w-3 h-3" />
                          {report.likes}
                        </span>
                      )}
                      {report.comments_count > 0 && (
                        <span className="flex items-center gap-0.5">
                          <MessageCircle className="w-3 h-3" />
                          {report.comments_count}
                        </span>
                      )}
                    </span>
                  )}
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: status.color }}
                    title={t(status.labelKey)}
                    aria-hidden
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
