'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import MapGL, { Marker, type MapRef } from 'react-map-gl/mapbox';
import { AlertTriangle, Loader2, Locate, Megaphone, User, X } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

import { CityAlertLogo } from '@/components/CityAlertLogo';
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
      // Mappa più pulita: i pin delle segnalazioni restano protagonisti
      const setConfig = (map as unknown as { setConfigProperty: (s: string, k: string, v: boolean) => void })
        .setConfigProperty.bind(map);
      setConfig('basemap', 'showPointOfInterestLabels', false);
      setConfig('basemap', 'showTransitLabels', false);
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
        className="absolute top-0 left-0 right-0 h-36 pointer-events-none z-10"
        style={{ background: 'linear-gradient(to bottom, rgba(244,245,247,0.9), rgba(244,245,247,0))' }}
        aria-hidden
      />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 sm:px-6 pt-safe pointer-events-none">
        <div className="flex items-center justify-between gap-3 pointer-events-auto">
          <div className="glass-heavy rounded-2xl h-12 pl-3.5 pr-4 flex items-center">
            <CityAlertLogo className="text-[20px]" />
          </div>

          <GlassIconButton href="/profile" ariaLabel={t('profile.title')} size={48} heavy className="rounded-2xl!">
            <User className="w-5 h-5" />
          </GlassIconButton>
        </div>
      </div>

      {/* Pannello desktop: segnalazioni recenti */}
      <RecentReportsPanel reports={reports} openCount={openCount} onSelect={openDetail} />

      {/* Barra azioni in basso (mobile/tablet) · FAB esteso su desktop */}
      <div className="absolute bottom-0 left-0 right-0 lg:left-auto z-20 px-4 sm:px-6 lg:px-8 pb-safe pointer-events-none">
        <div className="flex justify-end mb-3 pointer-events-auto">
          <GlassIconButton
            onClick={centerToUser}
            disabled={!geo.location}
            ariaLabel={t('map.center')}
            size={48}
            heavy
            className="rounded-2xl!"
          >
            {geo.loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Locate className="w-5 h-5" />
            )}
          </GlassIconButton>
        </div>

        <div className="pointer-events-auto glass-heavy rounded-[26px] p-2.5 sm:max-w-md sm:ml-auto lg:w-auto lg:p-0 lg:bg-transparent lg:border-0 lg:shadow-none lg:backdrop-blur-none">
          <div className="flex items-center justify-between px-2.5 pt-1 pb-3 lg:hidden">
            <span className="flex items-center gap-2 text-[13px] font-semibold text-mid">
              <span className="relative flex w-2 h-2" aria-hidden>
                <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-50 animate-ping" />
                <span className="relative inline-flex rounded-full w-2 h-2 bg-success" />
              </span>
              {countLabel}
            </span>
            <span className="text-[11px] font-bold tracking-[0.12em] text-low">{t('map.live')}</span>
          </div>

          <button
            type="button"
            onClick={openReport}
            className="w-full lg:w-auto h-14 lg:h-16 lg:px-7 rounded-[18px] lg:rounded-full flex items-center justify-center gap-2.5 bg-gold-500 hover:bg-gold-400 text-(--on-gold) shadow-(--shadow-gold) active:scale-[0.98] transition-all"
            aria-label={t('civicReport.mapHint')}
          >
            <Megaphone className="w-[22px] h-[22px]" strokeWidth={2.2} />
            <span
              className="text-[16px] font-bold whitespace-nowrap"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {t('civicReport.mapHint')}
            </span>
          </button>
        </div>
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
              className="w-full max-w-sm card rounded-[28px] p-6"
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'var(--gold-tint)' }}
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
                className="w-full h-12 rounded-2xl bg-gold-500 hover:bg-gold-400 text-(--on-gold) font-bold text-[15px] disabled:opacity-50 flex items-center justify-center gap-2 shadow-(--shadow-gold) transition-colors"
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
            className="absolute bottom-[200px] lg:bottom-32 left-4 right-4 sm:left-auto sm:right-6 sm:w-[360px] z-20 glass-heavy rounded-2xl p-4 flex gap-3"
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
