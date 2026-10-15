'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  FileText,
  KeyRound,
  LifeBuoy,
  Loader2,
  Pencil,
  ShieldCheck,
  X,
} from 'lucide-react';

import { CloseButton } from '@/components/ui/CloseButton';
import { GlassIconButton } from '@/components/ui/GlassIconButton';
import { PillButton } from '@/components/ui/PillButton';
import { useAuth } from '@/lib/auth/use-auth';
import { useI18n } from '@/lib/i18n';
import type { UserProfile } from '@/types/civic';

const USERNAME_RE = /^[\p{L}\p{N}._-]{2,24}$/u;

function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPassword('');
    setConfirm('');
    setError('');
    setDone(false);
    setSaving(false);
  }, [open]);

  const canSubmit = password.length >= 6 && !saving;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError(t('auth.passwordsNoMatch'));
      return;
    }
    setSaving(true);
    try {
      await updatePassword(password);
      setDone(true);
      setTimeout(onClose, 1600);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.error'));
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full h-[52px] px-5 rounded-2xl bg-white border border-(--stroke-dark) focus:border-gold-500 focus:shadow-[0_0_0_3px_rgba(245,179,1,0.15)] text-base text-hi outline-none placeholder:text-low transition-all';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-[rgba(16,24,40,0.35)] backdrop-blur-[2px] flex items-end sm:items-center justify-center p-5"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 48 }}
            animate={{ y: 0 }}
            exit={{ y: 48 }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            className="w-full max-w-md glass-heavy rounded-[28px] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2
                className="text-lg font-bold text-hi"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {t('profile.account.password.title')}
              </h2>
              <CloseButton onClick={onClose} />
            </div>

            {done ? (
              <div className="flex flex-col items-center py-8 gap-3">
                <span className="w-14 h-14 rounded-full bg-[rgba(5,150,105,0.12)] flex items-center justify-center">
                  <Check className="w-7 h-7 text-success" />
                </span>
                <p className="text-sm font-bold text-success">
                  {t('profile.account.password.updated')}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-low mb-2 ml-1 uppercase tracking-[0.14em]">
                    {t('profile.account.password.new')}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-low mb-2 ml-1 uppercase tracking-[0.14em]">
                    {t('profile.account.password.confirm')}
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className={inputClass}
                  />
                </div>

                {error && (
                  <p className="text-sm text-danger text-center font-medium">{error}</p>
                )}

                <PillButton type="submit" disabled={!canSubmit} loading={saving}>
                  {t('profile.account.password.submit')}
                </PillButton>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function AccountScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { t } = useI18n();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState('');
  const [nameSaved, setNameSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setProfile(data);
        if (!cancelled) setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-(--bg)">
        <Loader2 className="w-10 h-10 text-gold-500 animate-spin" />
      </div>
    );
  }

  const email = profile?.email ?? '';
  const username = profile?.displayName ?? email.split('@')[0] ?? '';

  const startEditName = () => {
    setNameDraft(username);
    setNameError('');
    setNameSaved(false);
    setEditingName(true);
  };

  const saveName = async () => {
    const trimmed = nameDraft.trim();
    if (!USERNAME_RE.test(trimmed)) {
      setNameError(t('profile.account.usernameInvalid'));
      return;
    }
    setNameSaving(true);
    setNameError('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNameError(typeof data.error === 'string' ? data.error : t('auth.error'));
        return;
      }
      setProfile((prev) => (prev ? { ...prev, displayName: trimmed } : prev));
      setEditingName(false);
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
    } catch {
      setNameError(t('auth.error'));
    } finally {
      setNameSaving(false);
    }
  };

  const menuItems = [
    {
      key: 'profile.account.menu.password',
      icon: KeyRound,
      onClick: () => setPasswordOpen(true),
    },
    { key: 'profile.account.menu.terms', icon: FileText, href: '/legal/terms' },
    { key: 'profile.account.menu.privacy', icon: ShieldCheck, href: '/legal/privacy' },
    { key: 'profile.account.menu.support', icon: LifeBuoy, href: '/support' },
  ];

  return (
    <div className="h-full overflow-y-auto bg-(--bg) dot-grid pb-10">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center gap-3 px-5 pt-safe pb-6">
          <GlassIconButton href="/profile" ariaLabel={t('profile.title')}>
            <ArrowLeft className="w-5 h-5" />
          </GlassIconButton>
          <h1
            className="text-lg font-bold text-hi"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t('profile.account.settings')}
          </h1>
        </div>

        <div className="px-6 space-y-3">
          {/* Username modificabile */}
          <div className="glass rounded-2xl px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-low uppercase tracking-[0.14em]">
                  {t('profile.account.username')}
                </p>
                {editingName ? (
                  <input
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveName();
                      if (e.key === 'Escape') setEditingName(false);
                    }}
                    autoFocus
                    maxLength={24}
                    className="mt-1 w-full bg-white rounded-xl border border-gold-500 px-3 py-2 text-base font-semibold text-hi outline-none shadow-[0_0_0_3px_rgba(245,179,1,0.15)]"
                  />
                ) : (
                  <p className="text-base font-semibold text-hi mt-1 truncate">
                    {username || '—'}
                    {nameSaved && (
                      <span className="ml-2 text-xs font-bold text-success">
                        {t('profile.account.usernameUpdated')}
                      </span>
                    )}
                  </p>
                )}
              </div>

              {editingName ? (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={saveName}
                    disabled={nameSaving}
                    className="w-10 h-10 rounded-full bg-linear-to-b from-gold-400 to-gold-600 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
                    aria-label={t('profile.account.save')}
                  >
                    {nameSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin text-(--on-gold)" />
                    ) : (
                      <Check className="w-4 h-4 text-(--on-gold)" />
                    )}
                  </button>
                  <GlassIconButton
                    onClick={() => setEditingName(false)}
                    ariaLabel={t('profile.account.cancel')}
                    size={40}
                  >
                    <X className="w-4 h-4" />
                  </GlassIconButton>
                </div>
              ) : (
                <GlassIconButton
                  onClick={startEditName}
                  ariaLabel={t('profile.account.editUsername')}
                  size={40}
                  className="shrink-0"
                >
                  <Pencil className="w-4 h-4 text-mid" />
                </GlassIconButton>
              )}
            </div>
            {nameError && <p className="text-xs text-danger mt-2">{nameError}</p>}
          </div>

          {/* Email (sola lettura) */}
          <div className="glass rounded-2xl px-5 py-4">
            <p className="text-[10px] font-bold text-low uppercase tracking-[0.14em]">
              {t('profile.account.email')}
            </p>
            <p className="text-base font-semibold text-hi mt-1 break-all">
              {email || '—'}
            </p>
          </div>
        </div>

        <ul className="mt-8 mx-6 glass rounded-3xl overflow-hidden divide-y divide-[rgba(16,24,40,0.06)]">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const content = (
              <>
                <span className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-(--gold-500)/12 flex items-center justify-center">
                    <Icon className="w-[18px] h-[18px] text-gold-600" />
                  </span>
                  {t(item.key)}
                </span>
                <ChevronRight className="w-4 h-4 text-low" />
              </>
            );
            const itemClass =
              'w-full flex items-center justify-between px-5 py-4 text-[15px] font-semibold text-hi hover:bg-white/60 active:bg-white/80 transition-colors';
            return (
              <li key={item.key}>
                {item.href ? (
                  <Link href={item.href} className={itemClass}>
                    {content}
                  </Link>
                ) : (
                  <button type="button" onClick={item.onClick} className={itemClass}>
                    {content}
                  </button>
                )}
              </li>
            );
          })}
        </ul>

        <div className="px-6 mt-10">
          <button
            type="button"
            disabled={signingOut}
            onClick={async () => {
              setSigningOut(true);
              await signOut();
              router.replace('/auth');
            }}
            className="w-full text-center text-sm font-bold text-low hover:text-danger transition-colors disabled:opacity-50"
          >
            {signingOut ? t('profile.signingOut') : t('profile.account.signOut')}
          </button>
        </div>
      </div>

      <ChangePasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </div>
  );
}
