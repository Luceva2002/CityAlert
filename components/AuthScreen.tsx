'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Mail, Lock } from 'lucide-react';

import { CityAlertLogo } from '@/components/CityAlertLogo';
import { PillButton } from '@/components/ui/PillButton';
import { useAuth } from '@/lib/auth/use-auth';
import { useT } from '@/lib/i18n';

type Phase = 'splash' | 'login' | 'register';

const SPLASH_MS = 2200;

const inputWrapClass =
  'flex items-center gap-3 w-full h-[52px] px-4 rounded-2xl bg-(--surface-muted) border border-(--stroke-dark) focus-within:bg-white focus-within:border-gold-500 focus-within:shadow-[0_0_0_4px_rgba(245,179,1,0.18)] transition-all';
const inputClass =
  'flex-1 bg-transparent text-base text-hi outline-none placeholder:text-low min-w-0';

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[13px] font-semibold text-hi mb-1.5 ml-0.5">
      {children}
    </label>
  );
}

export function AuthScreen() {
  const router = useRouter();
  const t = useT();
  const { user, loading: authLoading, signIn, signUp } = useAuth();

  const [phase, setPhase] = useState<Phase>('splash');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length >= 6;
  const isRegister = phase === 'register';

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (phase !== 'splash') return;
    const timer = setTimeout(() => setPhase('login'), SPLASH_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  const skipSplash = useCallback(() => {
    if (phase === 'splash') setPhase('login');
  }, [phase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (isRegister && password !== confirmPassword) {
      setError(t('auth.passwordsNoMatch'));
      return;
    }

    setSubmitting(true);
    try {
      if (isRegister) {
        const { needsEmailConfirmation } = await signUp(email, password);
        if (needsEmailConfirmation) {
          setSuccessMessage(t('auth.emailConfirmation'));
          return;
        }
        router.replace('/');
      } else {
        await signIn(email, password);
        router.replace('/');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="h-dvh w-full flex items-center justify-center bg-(--bg)">
        <Loader2 className="w-10 h-10 animate-spin text-gold-500" />
      </div>
    );
  }

  return (
    <div className="h-dvh w-full bg-(--bg) relative overflow-hidden flex flex-col dot-grid">
      {/* Alone dorato di fondo */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[620px] h-[620px] rounded-full opacity-40"
        style={{
          background:
            'radial-gradient(circle, rgba(245,179,1,0.22) 0%, rgba(245,179,1,0.05) 45%, transparent 70%)',
        }}
        aria-hidden
      />

      <AnimatePresence mode="wait">
        {phase === 'splash' && (
          <motion.button
            key="splash"
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            onClick={skipSplash}
            className="relative flex-1 flex flex-col items-center justify-center w-full cursor-pointer select-none"
            aria-label={t('auth.splash.continue')}
          >
            {/* Radar dietro il logo */}
            <div className="relative flex items-center justify-center mb-10" aria-hidden>
              <span className="absolute w-24 h-24 rounded-full border border-(--gold-500)/50 animate-radar" />
              <span
                className="absolute w-24 h-24 rounded-full border border-(--gold-500)/50 animate-radar"
                style={{ animationDelay: '0.8s' }}
              />
              <span
                className="absolute w-24 h-24 rounded-full border border-(--gold-500)/50 animate-radar"
                style={{ animationDelay: '1.6s' }}
              />
              <span
                className="relative w-5 h-5 rounded-full bg-gold-500"
                style={{ boxShadow: '0 0 24px rgba(245,179,1,0.8)' }}
              />
            </div>

            <motion.div
              animate={{ scale: [1, 1.015, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <CityAlertLogo className="text-[56px]" />
            </motion.div>

            <p className="text-mid text-sm mt-4 font-medium">{t('auth.tagline')}</p>

            <span className="absolute bottom-14 text-low text-[11px] font-semibold tracking-[0.22em] uppercase">
              {t('auth.splash.hint')}
            </span>
          </motion.button>
        )}

        {(phase === 'login' || phase === 'register') && (
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ type: 'spring', damping: 24, stiffness: 220 }}
            className="relative flex-1 flex flex-col items-center overflow-y-auto px-4 sm:px-6 pt-safe pb-safe"
          >
            <div className="w-full max-w-[420px] flex flex-col my-auto">
              <div className="pb-8 flex flex-col items-center shrink-0">
                <CityAlertLogo className="text-[38px]" />
                <p className="text-mid text-[15px] mt-3 text-center max-w-[290px] leading-snug">
                  {isRegister ? t('auth.register.subtitle') : t('auth.login.subtitle')}
                </p>
              </div>

              {/* Card del modulo */}
              <div className="card rounded-[28px] px-5 py-6 sm:px-7 sm:py-8">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div>
                    <FieldLabel>{t('auth.email')}</FieldLabel>
                    <div className={inputWrapClass}>
                      <Mail className="w-[18px] h-[18px] text-low shrink-0" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        required
                        placeholder={t('auth.emailPlaceholder')}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <FieldLabel>{t('auth.password')}</FieldLabel>
                    <div className={inputWrapClass}>
                      <Lock className="w-[18px] h-[18px] text-low shrink-0" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete={isRegister ? 'new-password' : 'current-password'}
                        required
                        minLength={6}
                        placeholder="••••••••"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {isRegister && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <FieldLabel>{t('auth.confirmPassword')}</FieldLabel>
                      <div className={inputWrapClass}>
                        <Lock className="w-[18px] h-[18px] text-low shrink-0" />
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          autoComplete="new-password"
                          required
                          minLength={6}
                          placeholder="••••••••"
                          className={inputClass}
                        />
                      </div>
                    </motion.div>
                  )}

                  {error && (
                    <p className="text-sm text-danger text-center font-semibold">{error}</p>
                  )}
                  {successMessage && (
                    <p className="text-sm text-success text-center font-semibold">
                      {successMessage}
                    </p>
                  )}

                  <div className="mt-1">
                    <PillButton
                      type="submit"
                      variant="gold"
                      disabled={!canSubmit}
                      loading={submitting}
                    >
                      {isRegister ? t('auth.register') : t('auth.submit')}
                    </PillButton>
                  </div>
                </form>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPhase(isRegister ? 'login' : 'register');
                  setError('');
                  setSuccessMessage('');
                }}
                className="mt-6 h-11 text-[15px] font-semibold text-mid hover:text-hi transition-colors text-center"
              >
                {isRegister ? t('auth.hasAccount') : t('auth.noAccount')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
