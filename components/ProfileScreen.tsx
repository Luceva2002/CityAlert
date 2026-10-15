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
    <div className="h-full overflow-y-auto bg-(--bg) pb-12">
      <div className="relative max-w-2xl mx-auto px-4 sm:px-6">
        {/* Barra superiore */}
        <div className="flex items-center justify-between pt-safe pb-4">
          <GlassIconButton href="/" ariaLabel={t('reportDetail.backToMap')} className="rounded-2xl!">
            <ArrowLeft className="w-5 h-5" />
          </GlassIconButton>
          <h1
            className="text-[17px] font-bold text-hi"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t('profile.title')}
          </h1>
          <GlassIconButton
            href="/profile/account"
            ariaLabel={t('profile.account.edit')}
            className="rounded-2xl!"
          >
            <Settings className="w-5 h-5" />
          </GlassIconButton>
        </div>

        {/* Scheda identità + progressi */}
        <section className="card rounded-[28px] p-5 overflow-hidden relative">
          <div
            className="pointer-events-none absolute -top-24 -right-16 w-64 h-64 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(245,179,1,0.18) 0%, transparent 70%)' }}
            aria-hidden
          />

          <div className="relative flex items-center gap-4">
            <RingAvatar initial={initial} size="md" />
            <div className="min-w-0 flex-1">
              <p
                className="text-[22px] font-bold text-hi leading-tight truncate"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                @{username}
              </p>
              <p className="text-sm text-mid mt-0.5">{countLabel}</p>
            </div>
          </div>

          {/* Livello e barra progresso */}
          <div className="relative mt-5">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-[13px] font-bold text-hi">
                {t('profile.level')} {profile.level}
              </span>
              <span className="text-[12px] font-medium text-low">
                {t('profile.xpToNext', { current: progress.current, target: progress.target })}
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-(--bg-deep) overflow-hidden">
              <div
                className="h-full rounded-full bg-gold-500 transition-all duration-700"
                style={{ width: `${progress.pct}%` }}
              />
            </div>
          </div>

          {/* Statistiche gamification */}
          <div className="relative grid grid-cols-2 gap-2.5 mt-5">
            <div className="rounded-2xl bg-(--surface-muted) border border-(--stroke) py-3 flex flex-col items-center gap-0.5">
              <span
                className="text-xl font-bold text-hi flex items-center gap-1"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <Zap className="w-4 h-4 text-info" />
                {profile.xp}
              </span>
              <span className="eyebrow text-[10px]!">{t('profile.xp')}</span>
            </div>
            <div className="rounded-2xl bg-(--surface-muted) border border-(--stroke) py-3 flex flex-col items-center gap-0.5">
              <span
                className="text-xl font-bold text-hi flex items-center gap-1"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <Coins className="w-4 h-4 text-gold-600" />
                {profile.coins}
              </span>
              <span className="eyebrow text-[10px]!">{t('profile.coins')}</span>
            </div>
          </div>
        </section>

        {/* Lista segnalazioni */}
        <h2
          className="text-[17px] font-bold text-hi mt-8 mb-3 px-1"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t('profile.reports.title')}
        </h2>

        {reports.length === 0 ? (
          <p className="card rounded-3xl text-center text-sm text-mid py-10 px-6 whitespace-pre-line leading-relaxed">
            {t('profile.reports.empty')}
          </p>
        ) : (
          <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2">
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
          className="w-full mt-10 h-12 rounded-2xl card text-center text-sm font-bold text-danger hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          {signingOut ? t('profile.signingOut') : t('profile.account.signOut')}
        </button>
      </div>

      <ReportDetailSheet
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
        onSocialChange={patchReportSocial}
      />
    </div>
  );
}
