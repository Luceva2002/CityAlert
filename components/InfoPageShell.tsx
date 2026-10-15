'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { CityAlertLogo } from '@/components/CityAlertLogo';
import { GlassIconButton } from '@/components/ui/GlassIconButton';
import { useT } from '@/lib/i18n';

interface InfoPageShellProps {
  titleKey: string;
  subtitle?: string;
  children: React.ReactNode;
}

/** Guscio per pagine informative (termini, privacy, assistenza): header con back + contenuto scrollabile */
export function InfoPageShell({ titleKey, subtitle, children }: InfoPageShellProps) {
  const router = useRouter();
  const t = useT();

  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.push('/');
  };

  return (
    <div className="min-h-dvh bg-(--bg) dot-grid">
      <div className="max-w-2xl mx-auto px-5 sm:px-8 pt-safe pb-16">
        <div className="flex items-center justify-between py-5">
          <GlassIconButton onClick={goBack} ariaLabel={t('civicReport.back')}>
            <ArrowLeft className="w-5 h-5" />
          </GlassIconButton>
          <span className="text-xl">
            <CityAlertLogo markOnly />
          </span>
        </div>

        <h1
          className="text-[26px] sm:text-3xl font-bold text-hi mt-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t(titleKey)}
        </h1>
        {subtitle && <p className="text-sm text-mid mt-2">{subtitle}</p>}

        <div className="mt-7 space-y-4">{children}</div>
      </div>
    </div>
  );
}

/** Sezione vetro con titolo per le pagine informative */
export function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass rounded-3xl px-6 py-5">
      <h2
        className="text-base font-bold text-hi mb-2.5"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h2>
      <div className="text-sm leading-relaxed text-mid space-y-2">{children}</div>
    </section>
  );
}
