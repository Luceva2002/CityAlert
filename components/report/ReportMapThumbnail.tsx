'use client';

import { useMemo } from 'react';

import { MAP_PLACEHOLDER, reportStaticMapUrl } from '@/lib/mapbox-static';
import { getCategoryMeta, type CivicReportRecord } from '@/types/civic';

interface ReportMapThumbnailProps {
  report: CivicReportRecord;
  className?: string;
  /** Disegna il pin oro nella mappa statica */
  withPin?: boolean;
}

/** Anteprima mappa statica chiara (usata nelle card segnalazione) */
export function ReportMapThumbnail({ report, className = '', withPin = true }: ReportMapThumbnailProps) {
  const meta = getCategoryMeta(report.category);
  const mapUrl = useMemo(
    () => reportStaticMapUrl(report.longitude, report.latitude, 320, 220, 15, withPin),
    [report.longitude, report.latitude, withPin],
  );

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={{ backgroundColor: MAP_PLACEHOLDER }}
    >
      {mapUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mapUrl}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-4xl">{meta.emoji}</div>
      )}
    </div>
  );
}
