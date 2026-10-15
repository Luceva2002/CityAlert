'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Coins, Loader2, Settings, Zap } from 'lucide-react';

import { ReportCard } from '@/components/report/ReportCard';
import {
  ReportDetailSheet,
  type ReportSocialPatch,
} from '@/components/report/ReportDetailSheet';
import { GlassIconButton } from '@/components/ui/GlassIconButton';
import { RingAvatar } from '@/components/ui/RingAvatar';
import { useAuth } from '@/lib/auth/use-auth';
import { useI18n } from '@/lib/i18n';
import {
  getCategoryMeta,
  levelProgress,
  type CivicReportRecord,
  type UserProfile,
} from '@/types/civic';

export function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { t } = useI18n();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reports, setReports] = useState<CivicReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [selectedReport, setSelectedReport] = useState<CivicReportRecord | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [p, r] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/civic/reports?scope=mine'),
      ]);
      if (!p.ok) throw new Error('profile');
      setProfile(await p.json());
      if (r.ok) setReports((await r.json()).reports ?? []);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const patchReportSocial = useCallback((reportId: string, patch: ReportSocialPatch) => {
    setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, ...patch } : r)));
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-(--bg)">
        <Loader2 className="w-10 h-10 text-gold-500 animate-spin" />
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 bg-(--bg) px-8">
        <p className="text-mid text-sm text-center">{t('profile.loadError')}</p>
        <button
          type="button"
          onClick={load}
          className="text-sm font-bold text-gold-600 underline"
        >
          {t('profile.retry')}
        </button>
      </div>
    );
  }

  const email = profile.email ?? '';
  const username = profile.displayName ?? email.split('@')[0] ?? t('profile.fallbackUser');
  const initial = username.charAt(0).toUpperCase();
  const progress = levelProgress(profile.xp);
  const countLabel =
    reports.length === 1
      ? t('profile.reports.countOne')
      : t('profile.reports.count', { count: reports.length });

  return (
    <div className="h-full overflow-y-auto bg-(--bg) dot-grid pb-12">
      {/* Alone dorato dietro l'avatar */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[520px] h-[400px] rounded-full opacity-30"
        style={{
          background: 'radial-gradient(circle, rgba(245,179,1,0.35) 0%, transparent 65%)',
        }}
        aria-hidden
      />

      <div className="relative max-w-2xl mx-auto">
        <div className="flex items-center justify-between px-5 pt-safe pb-4">
          <GlassIconButton href="/" ariaLabel={t('reportDetail.backToMap')}>
            <ArrowLeft className="w-5 h-5" />
          </GlassIconButton>
          <GlassIconButton href="/profile/account" ariaLabel={t('profile.account.edit')}>
            <Settings className="w-5 h-5" />
          </GlassIconButton>
        </div>

        <div className="px-6">
          <RingAvatar initial={initial} />

          <p
            className="text-center text-xl font-bold text-hi mt-5"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            @{username}
          </p>
          <p className="text-center text-sm text-mid mt-1 underline underline-offset-4 decoration-[rgba(16,24,40,0.25)]">
            {countLabel}
          </p>

          {/* Statistiche gamification */}
          <div className="grid grid-cols-3 gap-3 mt-7 max-w-md mx-auto">
            <div className="glass rounded-2xl py-4 flex flex-col items-center gap-1">
              <span
                className="text-xl font-bold text-gold-600"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {profile.level}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-low">
                {t('profile.level')}
              </span>
            </div>
            <div className="glass rounded-2xl py-4 flex flex-col items-center gap-1">
              <span
                className="text-xl font-bold text-hi flex items-center gap-1"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <Zap className="w-4 h-4 text-info" />
                {profile.xp}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-low">
                {t('profile.xp')}
              </span>
            </div>
            <div className="glass rounded-2xl py-4 flex flex-col items-center gap-1">
              <span
                className="text-xl font-bold text-hi flex items-center gap-1"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <Coins className="w-4 h-4 text-gold-600" />
                {profile.coins}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-low">
                {t('profile.coins')}
              </span>
            </div>
          </div>

          {/* Barra progresso livello */}
          <div className="mt-4 max-w-md mx-auto">
            <div className="h-2 rounded-full bg-[rgba(16,24,40,0.08)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progress.pct}%`,
                  background: 'linear-gradient(90deg, var(--gold-400), var(--gold-600))',
                  boxShadow: '0 0 10px rgba(245,179,1,0.4)',
                }}
              />
            </div>
            <p className="text-[11px] text-low mt-1.5 text-center font-medium">
              {t('profile.xpToNext', { current: progress.current, target: progress.target })}
            </p>
          </div>

          {/* Griglia segnalazioni */}
          <h2
            className="text-base font-bold text-hi mt-9 mb-3"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t('profile.reports.title')}
          </h2>

          {reports.length === 0 ? (
            <p className="text-center text-sm text-low mt-8 px-4 whitespace-pre-line leading-relaxed">
              {t('profile.reports.empty')}
            </p>
          ) : (
            <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2">
              {reports.map((r) => (
                <ReportCard
                  key={r.id}
                  report={r}
                  onClick={() => setSelectedReport(r)}
                  ariaLabel={t(getCategoryMeta(r.category).labelKey)}
                />
              ))}
            </div>
          )}

          <button
            type="button"
            disabled={signingOut}
            onClick={async () => {
              setSigningOut(true);
              await signOut();
              router.replace('/auth');
            }}
            className="w-full mt-12 text-center text-sm font-bold text-low hover:text-danger transition-colors disabled:opacity-50"
          >
            {signingOut ? t('profile.signingOut') : t('profile.account.signOut')}
          </button>
        </div>
      </div>

      <ReportDetailSheet
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
        onSocialChange={patchReportSocial}
      />
    </div>
  );
}
