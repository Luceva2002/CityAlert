'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import MapGL, { Marker } from 'react-map-gl/mapbox';
import { Clock, MapPin, UserCheck, Users } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

import { CommentsSection } from '@/components/report/CommentsSection';
import { VoteBar } from '@/components/report/VoteBar';
import { PillButton } from '@/components/ui/PillButton';
import { CloseButton } from '@/components/ui/CloseButton';
import { MAPBOX_TOKEN, MAP_STYLES } from '@/config/mapbox';
import { useT } from '@/lib/i18n';
import { timeAgo } from '@/lib/time';
import {
  getCategoryMeta,
  STATUS_META,
  type CivicReportRecord,
  type VoteSummary,
} from '@/types/civic';

/** Campi sociali che il dettaglio può aggiornare sulla lista del genitore */
export type ReportSocialPatch = Partial<
  Pick<CivicReportRecord, 'likes' | 'dislikes' | 'my_vote' | 'comments_count'>
>;

interface ReportDetailSheetProps {
  report: CivicReportRecord | null;
  onClose: () => void;
  /** Sincronizza like/commenti sulla lista che ha aperto il dettaglio */
  onSocialChange?: (reportId: string, patch: ReportSocialPatch) => void;
}

export function ReportDetailSheet({ report, onClose, onSocialChange }: ReportDetailSheetProps) {
  const t = useT();
  const cat = report ? getCategoryMeta(report.category) : null;
  const status = report ? STATUS_META[report.status ?? 'open'] : null;

  // Stato sociale locale (inizializzato a ogni apertura, poi sincronizzato col genitore)
  const [votes, setVotes] = useState<VoteSummary>({ likes: 0, dislikes: 0, my_vote: 0 });
  const reportId = report?.id;

  useEffect(() => {
    if (!report) return;
    setVotes({
      likes: report.likes ?? 0,
      dislikes: report.dislikes ?? 0,
      my_vote: report.my_vote ?? 0,
    });
    // Solo al cambio di segnalazione aperta
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId]);

  const handleVote = useCallback(
    (summary: VoteSummary) => {
      setVotes(summary);
      if (reportId) onSocialChange?.(reportId, summary);
    },
    [reportId, onSocialChange],
  );

  const handleCommentCount = useCallback(
    (count: number) => {
      if (reportId) onSocialChange?.(reportId, { comments_count: count });
    },
    [reportId, onSocialChange],
  );

  return (
    <AnimatePresence>
      {report && cat && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-[rgba(16,24,40,0.35)] backdrop-blur-[2px] flex flex-col justify-end sm:items-center sm:justify-center sm:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative max-h-[88dvh] sm:max-h-[92dvh] w-full sm:max-w-[520px] bg-(--bg) rounded-t-[28px] sm:rounded-[32px] border-t border-white/60 sm:border sm:shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Alone colore categoria */}
            <div
              className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[420px] h-[280px] rounded-full opacity-[0.12]"
              style={{ background: `radial-gradient(circle, ${cat.color} 0%, transparent 65%)` }}
              aria-hidden
            />

            {/* Maniglia + chiudi */}
            <div className="relative shrink-0 pt-3 pb-1 flex flex-col items-center">
              <span
                className="w-10 h-1.5 rounded-full bg-[rgba(16,24,40,0.12)] sm:hidden"
                aria-hidden
              />
              <div className="absolute right-4 top-3 scale-90 origin-top-right">
                <CloseButton onClick={onClose} />
              </div>
            </div>

            <div className="relative flex-1 overflow-y-auto px-6 pb-8 pt-2">
              {/* Testata categoria */}
              <div className="flex items-center gap-4 mb-5">
                <span
                  className="w-16 h-16 rounded-full flex items-center justify-center text-[32px] shrink-0 bg-white"
                  style={{
                    border: `2.5px solid ${cat.color}`,
                    boxShadow: `0 6px 20px ${cat.color}33`,
                  }}
                >
                  {cat.emoji}
                </span>
                <div className="min-w-0">
                  <h2
                    className="text-xl font-bold text-hi leading-tight"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {t(cat.labelKey)}
                  </h2>
                  {report.city && <p className="text-sm text-mid mt-0.5 truncate">{report.city}</p>}
                </div>
              </div>

              {/* Chips: status, tempo, autore */}
              <div className="flex flex-wrap items-center gap-2 mb-6">
                {status && (
                  <span
                    className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
                    style={{ background: `${status.color}1a`, color: status.color }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: status.color }}
                      aria-hidden
                    />
                    {t(status.labelKey)}
                  </span>
                )}
                <span className="flex items-center gap-1.5 glass rounded-full px-3 py-1.5 text-xs font-semibold text-mid">
                  <Clock className="w-3.5 h-3.5" />
                  {timeAgo(report.created_at, t)}
                </span>
                <span className="flex items-center gap-1.5 glass rounded-full px-3 py-1.5 text-xs font-semibold text-mid">
                  {report.is_mine ? (
                    <UserCheck className="w-3.5 h-3.5 text-gold-600" />
                  ) : (
                    <Users className="w-3.5 h-3.5" />
                  )}
                  {report.is_mine
                    ? t('reportDetail.reportedBy.you')
                    : t('reportDetail.reportedBy.community')}
                </span>
              </div>

              {report.photo_url && (
                <div className="rounded-3xl overflow-hidden border border-(--stroke-dark) shadow-sm mb-5 aspect-video">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={report.photo_url} alt="" className="w-full h-full object-cover" />
                </div>
              )}

              {report.description && (
                <p className="text-[15px] text-(--text-hi)/85 leading-relaxed mb-5">
                  {report.description}
                </p>
              )}

              {report.address && (
                <p className="flex items-center gap-2 text-sm text-mid mb-5">
                  <MapPin className="w-4 h-4 shrink-0 text-gold-600" />
                  {report.address}
                </p>
              )}

              <div className="h-[170px] rounded-3xl overflow-hidden border border-(--stroke-dark) shadow-sm mb-6 bg-(--bg-deep)">
                <MapGL
                  initialViewState={{
                    longitude: report.longitude,
                    latitude: report.latitude,
                    zoom: 15,
                  }}
                  style={{ width: '100%', height: '100%' }}
                  mapStyle={MAP_STYLES.standard3d}
                  mapboxAccessToken={MAPBOX_TOKEN}
                  interactive={false}
                  dragRotate={false}
                  touchZoomRotate={false}
                >
                  <Marker longitude={report.longitude} latitude={report.latitude} anchor="center">
                    <span
                      className="w-9 h-9 rounded-full flex items-center justify-center text-lg bg-white"
                      style={{
                        border: `2px solid ${cat.color}`,
                        boxShadow: `0 3px 10px ${cat.color}44`,
                      }}
                    >
                      {cat.emoji}
                    </span>
                  </Marker>
                </MapGL>
              </div>

              {/* Validazione comunità */}
              <div className="mb-7">
                <VoteBar
                  reportId={report.id}
                  likes={votes.likes}
                  dislikes={votes.dislikes}
                  myVote={votes.my_vote}
                  onChange={handleVote}
                />
              </div>

              {/* Commenti */}
              <div className="mb-7">
                <CommentsSection reportId={report.id} onCountChange={handleCommentCount} />
              </div>

              <PillButton onClick={onClose}>{t('reportDetail.backToMap')}</PillButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
