'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import MapGL, { Marker, type MapRef } from 'react-map-gl/mapbox';
import { AlertTriangle, Loader2, Locate, Megaphone, User, X } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

import { CityAlertLogo } from '@/components/CityAlertLogo';
import { LiveBadge } from '@/components/map/LiveBadge';
import { RecentReportsPanel } from '@/components/map/RecentReportsPanel';
import { ReportPin, UserLocationDot } from '@/components/map/ReportPin';
import { ReportSheet } from '@/components/report/ReportSheet';
import {
  ReportDetailSheet,
  type ReportSocialPatch,
} from '@/components/report/ReportDetailSheet';
import { GlassIconButton } from '@/components/ui/GlassIconButton';
import { MAPBOX_TOKEN, MAP_STYLES, MAP_LIGHT_PRESET, DEFAULT_CENTER, ZOOM } from '@/config/mapbox';
import { useAuth } from '@/lib/auth/use-auth';
import { useGeolocation } from '@/lib/use-geolocation';
import { useRealtimeReports } from '@/lib/use-realtime-reports';
import { useT } from '@/lib/i18n';
import { spreadOverlappingReports } from '@/lib/map-utils';
import { getCategoryMeta, type CivicReportRecord } from '@/types/civic';

export function MapScreen() {
  const mapRef = useRef<MapRef>(null);
  const geo = useGeolocation();
  const t = useT();
  const { user } = useAuth();

  const [reportOpen, setReportOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [reports, setReports] = useState<CivicReportRecord[]>([]);
  const [selectedReport, setSelectedReport] = useState<CivicReportRecord | null>(null);

  const loadReports = useCallback(async () => {
    try {
      const res = await fetch('/api/civic/reports');
      if (res.ok) setReports((await res.json()).reports ?? []);
    } catch {
      // silenzioso: la mappa resta usabile, riproverà alla prossima apertura
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const addReport = useCallback((report: CivicReportRecord) => {
    setReports((prev) => {
      if (prev.some((r) => r.id === report.id)) return prev;
      return [report, ...prev];
    });
  }, []);

  useRealtimeReports(user?.id, addReport);

  const patchReportSocial = useCallback((reportId: string, patch: ReportSocialPatch) => {
    setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, ...patch } : r)));
  }, []);

  const flyToReport = useCallback((report: CivicReportRecord) => {
    mapRef.current?.flyTo({
      center: [report.longitude, report.latitude],
      zoom: ZOOM.selected,
      pitch: 55,
      bearing: 0,
      duration: 1400,
      essential: true,
    });
  }, []);

  const openDetail = useCallback(
    (report: CivicReportRecord) => {
      flyToReport(report);
      setSelectedReport(report);
    },
    [flyToReport],
  );

  const handleReportCreated = useCallback(
    (report: CivicReportRecord) => {
      addReport(report);
      flyToReport(report);
    },
    [addReport, flyToReport],
  );

  const centerToUser = useCallback(() => {
    if (!geo.location) return;
    mapRef.current?.flyTo({
      center: [geo.location.longitude, geo.location.latitude],
      zoom: ZOOM.selected,
      pitch: 55,
      duration: 1200,
      essential: true,
    });
  }, [geo.location]);

  const onMapLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    try {
      // Preset giorno per lo stile Mapbox Standard (coerente col tema chiaro)
      (map as unknown as { setConfigProperty: (s: string, k: string, v: string) => void })
        .setConfigProperty('basemap', 'lightPreset', MAP_LIGHT_PRESET);
    } catch {
      // stile senza config → mantiene il preset di default
    }
    map.setPitch(50);
    if (geo.location) {
      map.flyTo({
        center: [geo.location.longitude, geo.location.latitude],
        zoom: ZOOM.overview,
        pitch: 50,
        duration: 0,
      });
    }
  }, [geo.location]);

  const openReport = useCallback(async () => {
    if (!geo.hasLocation) {
      const loc = await geo.requestAccess();
      if (!loc) return;
    }
    setReportOpen(true);
  }, [geo]);

  // Pin sovrapposti → disposti in cerchio attorno alla posizione reale
  const positionedReports = useMemo(() => spreadOverlappingReports(reports), [reports]);

  const openCount = reports.filter((r) => r.status !== 'resolved').length;
  const countLabel =
    openCount === 0
      ? t('map.reportCountZero')
      : openCount === 1
        ? t('map.reportCountOne')
        : t('map.reportCount', { count: openCount });

  return (
    <div className="h-full w-full relative overflow-hidden bg-(--bg)">
      <MapGL
        ref={mapRef}
        initialViewState={{
          longitude: DEFAULT_CENTER.longitude,
          latitude: DEFAULT_CENTER.latitude,
          zoom: ZOOM.overview,
          pitch: 50,
          bearing: 0,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAP_STYLES.standard3d}
        mapboxAccessToken={MAPBOX_TOKEN}
        maxPitch={65}
        dragRotate={false}
        touchPitch={true}
        onLoad={onMapLoad}
      >
        {geo.location && (
          <Marker
            longitude={geo.location.longitude}
            latitude={geo.location.latitude}
            anchor="center"
          >
            <UserLocationDot />
          </Marker>
        )}

        {positionedReports.map(({ report, offset }) => (
          <Marker
            key={report.id}
            longitude={report.longitude}
            latitude={report.latitude}
            anchor="bottom"
            offset={offset}
          >
            <ReportPin
              report={report}
              label={t(getCategoryMeta(report.category).labelKey)}
              onClick={() => openDetail(report)}
            />
          </Marker>
        ))}
      </MapGL>

      {/* Velo in alto per leggibilità header */}
      <div
        className="absolute top-0 left-0 right-0 h-32 pointer-events-none z-10"
        style={{ background: 'linear-gradient(to bottom, rgba(242,244,250,0.85), transparent)' }}
        aria-hidden
      />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 sm:px-6 pt-safe pb-3 pointer-events-none">
        <div className="flex items-center justify-between pointer-events-auto">
          <div className="glass-heavy rounded-full h-[52px] px-5 flex items-center">
            <CityAlertLogo className="text-[22px]" />
          </div>

          {/* Contatore live inline (tablet: il pannello lo copre su desktop) */}
          <div className="hidden sm:flex lg:hidden">
            <LiveBadge label={countLabel} />
          </div>

          <GlassIconButton href="/profile" ariaLabel={t('profile.title')} size={52} heavy>
            <User className="w-[22px] h-[22px]" />
          </GlassIconButton>
        </div>

        {/* Contatore live sotto l'header, solo mobile */}
        <div className="flex sm:hidden justify-center mt-3 pointer-events-auto">
          <LiveBadge label={countLabel} />
        </div>
      </div>

      {/* Pannello desktop: segnalazioni recenti */}
      <RecentReportsPanel reports={reports} openCount={openCount} onSelect={openDetail} />

      {/* Controlli in basso */}
      <div className="absolute bottom-0 right-4 sm:right-8 z-20 pb-safe flex flex-col items-center gap-3">
        <GlassIconButton
          onClick={centerToUser}
          disabled={!geo.location}
          ariaLabel={t('map.center')}
          size={48}
          heavy
        >
          {geo.loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Locate className="w-5 h-5" />
          )}
        </GlassIconButton>

        {/* FAB segnalazione */}
        <button
          type="button"
          onClick={openReport}
          className="group relative w-[70px] lg:w-auto h-[70px] rounded-full flex items-center justify-center active:scale-95 hover:brightness-105 transition-all"
          aria-label={t('civicReport.mapHint')}
        >
          <span
            className="absolute inset-0 rounded-full animate-radar border border-(--gold-500)/60"
            aria-hidden
          />
          <span
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(135deg, var(--gold-300), var(--gold-600))',
              boxShadow: '0 10px 32px rgba(245,179,1,0.5), inset 0 1px 0 rgba(255,255,255,0.5)',
            }}
            aria-hidden
          />
          <span className="relative flex items-center gap-2 lg:px-6">
            <Megaphone className="w-8 h-8 text-(--on-gold)" strokeWidth={2.2} />
            <span
              className="hidden lg:block text-[15px] font-bold text-(--on-gold) whitespace-nowrap"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {t('civicReport.mapHint')}
            </span>
          </span>
        </button>
      </div>

      {/* Modale richiesta GPS */}
      <AnimatePresence>
        {geo.needsPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[rgba(16,24,40,0.35)] backdrop-blur-[2px] z-30 flex items-end sm:items-center justify-center p-5"
          >
            <motion.div
              initial={{ y: 48 }}
              animate={{ y: 0 }}
              exit={{ y: 48 }}
              transition={{ type: 'spring', damping: 26, stiffness: 260 }}
              className="w-full max-w-sm glass-heavy rounded-[28px] p-6"
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(245,179,1,0.15)' }}
              >
                <Locate className="w-6 h-6 text-gold-600" />
              </div>
              <h2
                className="text-lg font-bold text-hi mb-1"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {t('map.gps.prompt.title')}
              </h2>
              <p className="text-sm text-mid mb-5">{t('map.gps.prompt.desc')}</p>
              <button
                type="button"
                onClick={() => geo.requestAccess()}
                disabled={geo.loading}
                className="w-full h-12 rounded-full bg-linear-to-b from-gold-400 to-gold-600 text-(--on-gold) font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {geo.loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('map.gps.prompt.allow')}
              </button>
              <button
                type="button"
                onClick={geo.dismissPrompt}
                className="w-full mt-2 py-2 text-sm font-semibold text-mid"
              >
                {t('map.gps.prompt.later')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Banner errore GPS */}
      <AnimatePresence>
        {geo.error && !geo.location && !bannerDismissed && !geo.needsPrompt && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="absolute bottom-28 left-4 right-4 sm:left-auto sm:right-8 sm:w-[360px] z-20 glass-heavy rounded-2xl p-4 flex gap-3"
          >
            <AlertTriangle className="w-5 h-5 shrink-0 text-gold-600" />
            <div className="flex-1 text-sm">
              <p className="font-semibold text-hi">{t('map.gps.unavailable')}</p>
              <p className="text-mid text-xs mt-1">{t(geo.error)}</p>
              <button
                type="button"
                onClick={() => geo.requestAccess()}
                className="text-xs font-bold mt-2 underline text-gold-600"
              >
                {t('map.gps.prompt.allow')}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setBannerDismissed(true)}
              className="text-low self-start"
              aria-label={t('reportDetail.close')}
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <ReportSheet
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        geo={geo}
        onReportCreated={handleReportCreated}
      />
      <ReportDetailSheet
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
        onSocialChange={patchReportSocial}
      />
    </div>
  );
}
