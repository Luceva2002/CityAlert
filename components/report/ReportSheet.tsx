'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, CheckCircle2, Images, Locate, Sparkles } from 'lucide-react';

import { CategoryCarousel } from '@/components/report/CategoryCarousel';
import { CloseButton } from '@/components/ui/CloseButton';
import { PillButton } from '@/components/ui/PillButton';
import { reverseGeocode } from '@/lib/geo';
import { useGeolocation } from '@/lib/use-geolocation';
import { useI18n } from '@/lib/i18n';
import {
  getCategoryMeta,
  type CivicCategory,
  type CivicReportRecord,
  type ReportReward,
} from '@/types/civic';

const CHAR_LIMIT = 250;

type ReportStep = 'location' | 'category' | 'photo' | 'comment' | 'success';

const STEP_ORDER: ReportStep[] = ['category', 'photo', 'comment'];

interface ReportSheetProps {
  open: boolean;
  onClose: () => void;
  geo: ReturnType<typeof useGeolocation>;
  onReportCreated?: (report: CivicReportRecord) => void;
}

function StepDots({ step }: { step: ReportStep }) {
  const idx = STEP_ORDER.indexOf(step);
  if (idx === -1) return <div className="h-1.5" aria-hidden />;
  return (
    <div className="flex items-center gap-2" aria-hidden>
      {STEP_ORDER.map((s, i) => (
        <span
          key={s}
          className="h-1.5 rounded-full transition-all duration-300"
          style={{
            width: i === idx ? 24 : 8,
            background: i <= idx ? 'var(--gold-500)' : 'rgba(16,24,40,0.14)',
          }}
        />
      ))}
    </div>
  );
}

export function ReportSheet({ open, onClose, geo, onReportCreated }: ReportSheetProps) {
  const { t } = useI18n();
  const [step, setStep] = useState<ReportStep>('location');
  const [category, setCategory] = useState<CivicCategory | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [reward, setReward] = useState<ReportReward | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setStep(geo.hasLocation ? 'category' : 'location');
    setCategory(null);
    setDescription('');
    setLocationError(null);
    setSubmitError(null);
    setPhotoError(null);
    setPhotoPreview(null);
    setPhotoFile(null);
    setReward(null);
  }, [open, geo.hasLocation]);

  useEffect(() => {
    if (step === 'success') {
      const timer = setTimeout(onClose, 4200);
      return () => clearTimeout(timer);
    }
  }, [step, onClose]);

  const handleRequestLocation = useCallback(async () => {
    setLocationError(null);
    const loc = await geo.requestAccess();
    if (loc) setStep('category');
    else setLocationError(geo.error ? t(geo.error) : t('civicReport.location.required'));
  }, [geo, t]);

  const handlePhotoChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setPhotoError(null);
      const allowed = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowed.includes(file.type)) {
        setPhotoError(t('civicReport.photo.typeError'));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setPhotoError(t('civicReport.photo.sizeError'));
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
      e.target.value = '';
    },
    [t],
  );

  const resolveLocation = useCallback(async () => {
    const fresh = await geo.getFreshLocation();
    if (fresh) return fresh;
    return geo.location;
  }, [geo]);

  const handleSubmit = useCallback(async () => {
    if (!category) {
      setSubmitError(t('civicReport.submit.noCategory'));
      return;
    }

    setSubmitting(true);
    setLocationError(null);
    setSubmitError(null);

    try {
      const coords = await resolveLocation();
      if (!coords) {
        setLocationError(geo.error ? t(geo.error) : t('civicReport.location.required'));
        setSubmitting(false);
        return;
      }

      const addressInfo = await reverseGeocode(coords.latitude, coords.longitude);

      let photo_url: string | undefined;
      if (photoFile) {
        setPhotoUploading(true);
        const formData = new FormData();
        formData.append('photo', photoFile);
        const uploadRes = await fetch('/api/civic/upload', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json().catch(() => ({}));
        if (!uploadRes.ok) {
          setSubmitError(
            typeof uploadData.error === 'string'
              ? uploadData.error
              : t('civicReport.submit.uploadFailed'),
          );
          setSubmitting(false);
          setPhotoUploading(false);
          return;
        }
        if (typeof uploadData.url === 'string') photo_url = uploadData.url;
        setPhotoUploading(false);
      }

      const res = await fetch('/api/civic/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          description: description.trim(),
          latitude: coords.latitude,
          longitude: coords.longitude,
          ...(photo_url ? { photo_url } : {}),
          city: addressInfo?.city ?? null,
          country: addressInfo?.country ?? null,
          address: addressInfo?.address ?? null,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          typeof data.error === 'string'
            ? data.error
            : typeof data.details === 'object'
              ? t('civicReport.submit.invalid')
              : t('civicReport.submit.failed');
        setSubmitError(msg);
        setSubmitting(false);
        return;
      }

      if (data.report) {
        onReportCreated?.(data.report as CivicReportRecord);
      }
      setReward((data.reward as ReportReward | null) ?? null);

      setStep('success');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('civicReport.submit.failed'));
    } finally {
      setSubmitting(false);
      setPhotoUploading(false);
    }
  }, [category, description, photoFile, geo, resolveLocation, onReportCreated, t]);

  if (!open) return null;

  const catMeta = category ? getCategoryMeta(category) : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col sm:items-center sm:justify-center bg-[rgba(16,24,40,0.35)] backdrop-blur-[2px] sm:p-6"
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 280 }}
          className="relative flex-1 sm:flex-none sm:w-full sm:max-w-[480px] sm:h-[min(760px,92dvh)] flex flex-col overflow-hidden bg-(--bg) dot-grid sm:rounded-[32px] sm:shadow-2xl sm:border sm:border-white/60"
        >
          {/* Alone colore categoria in alto */}
          <div
            className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[480px] h-[380px] rounded-full transition-all duration-700 opacity-[0.14]"
            style={{
              background: catMeta
                ? `radial-gradient(circle, ${catMeta.color} 0%, transparent 65%)`
                : 'radial-gradient(circle, var(--gold-500) 0%, transparent 65%)',
            }}
            aria-hidden
          />

          <div className="relative flex items-center justify-between px-5 pt-safe sm:pt-5 pb-2 shrink-0">
            <StepDots step={step} />
            <CloseButton onClick={onClose} />
          </div>

          <div className="relative flex-1 overflow-y-auto px-6 pb-8 flex flex-col min-h-0">
            <AnimatePresence mode="wait">
              {step === 'location' && (
                <motion.div
                  key="location"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  className="flex-1 flex flex-col"
                >
                  <h2
                    className="text-[24px] font-bold text-hi mb-2 pt-4"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {t('civicReport.location.title')}
                  </h2>
                  <p className="text-sm text-mid mb-8">
                    {t('civicReport.location.desc')}
                  </p>
                  <div className="flex-1 flex items-center justify-center">
                    <div className="relative flex items-center justify-center">
                      <span className="absolute w-28 h-28 rounded-full border border-(--gold-500)/50 animate-radar" />
                      <span
                        className="absolute w-28 h-28 rounded-full border border-(--gold-500)/50 animate-radar"
                        style={{ animationDelay: '1.2s' }}
                      />
                      <div className="w-24 h-24 rounded-full glass flex items-center justify-center">
                        <Locate className="w-10 h-10 text-gold-600" />
                      </div>
                    </div>
                  </div>
                  {locationError && (
                    <p className="text-sm text-danger text-center mb-4">{locationError}</p>
                  )}
                  <PillButton
                    onClick={handleRequestLocation}
                    loading={geo.loading}
                    disabled={geo.loading}
                  >
                    {t('civicReport.location.allow')}
                  </PillButton>
                </motion.div>
              )}

              {step === 'category' && (
                <motion.div
                  key="category"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  className="flex-1 flex flex-col min-h-0"
                >
                  <h2
                    className="text-[24px] font-bold text-hi text-center mb-1 leading-snug px-2 shrink-0 pt-2"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {t('civicReport.step1.title')}
                  </h2>
                  <p className="text-[13px] text-low text-center shrink-0">
                    {t('civicReport.step1.notice')}
                  </p>

                  <CategoryCarousel
                    value={category}
                    onChange={(id) => {
                      setCategory(id);
                      setSubmitError(null);
                    }}
                    label={t}
                  />

                  {submitError && (
                    <p className="text-sm text-danger font-semibold text-center mb-2">
                      {submitError}
                    </p>
                  )}

                  <PillButton
                    disabled={!category}
                    onClick={() => {
                      if (category) setStep('photo');
                    }}
                  >
                    {t('civicReport.next')}
                  </PillButton>
                </motion.div>
              )}

              {step === 'photo' && (
                <motion.div
                  key="photo"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  className="flex-1 flex flex-col pt-2"
                >
                  <h2
                    className="text-[24px] font-bold text-hi text-center mb-1"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {t('civicReport.photo.title')}
                  </h2>
                  <p className="text-sm text-mid text-center mb-6">
                    {t('civicReport.photo.subtitle')}
                  </p>

                  {photoPreview ? (
                    <div className="relative flex-1 max-h-[46vh] rounded-3xl overflow-hidden border border-(--stroke-dark) shadow-sm mb-5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photoPreview} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoFile(null);
                          setPhotoPreview(null);
                        }}
                        className="absolute top-3 right-3 px-3 py-1.5 rounded-full glass-heavy text-hi text-xs font-bold"
                      >
                        {t('civicReport.photo.remove')}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex-1 min-h-[200px] max-h-[46vh] rounded-3xl border-2 border-dashed border-[rgba(16,24,40,0.15)] bg-white/50 flex flex-col items-center justify-center gap-4 mb-5 active:bg-white/80 hover:bg-white/70 transition-colors"
                    >
                      <span
                        className="w-16 h-16 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(245,179,1,0.15)' }}
                      >
                        <Camera className="w-8 h-8 text-gold-600" />
                      </span>
                      <span className="text-base font-bold text-hi">
                        {t('civicReport.photo.take')}
                      </span>
                    </button>
                  )}

                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    capture="environment"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />

                  {photoError && (
                    <p className="text-sm text-danger text-center mb-3 font-medium">
                      {photoError}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 text-sm font-semibold text-mid mb-5 hover:text-hi transition-colors"
                  >
                    <Images className="w-4 h-4" />
                    {t('civicReport.photo.gallery')}
                  </button>

                  <PillButton onClick={() => setStep('comment')}>
                    {t('civicReport.next')}
                  </PillButton>
                  {!photoPreview && (
                    <button
                      type="button"
                      onClick={() => setStep('comment')}
                      className="mt-3 text-sm font-semibold text-low text-center"
                    >
                      {t('civicReport.photo.skip')}
                    </button>
                  )}
                </motion.div>
              )}

              {step === 'comment' && (
                <motion.div
                  key="comment"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  className="flex-1 flex flex-col pt-2"
                >
                  <h2
                    className="text-[24px] font-bold text-hi text-center mb-1"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {t('civicReport.comment.title')}
                  </h2>
                  <p className="text-sm text-mid text-center mb-6">
                    {t('civicReport.comment.subtitle')}
                  </p>

                  {catMeta && (
                    <div className="self-center mb-5 flex items-center gap-2.5 glass rounded-full pl-2 pr-4 py-1.5">
                      <span
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xl bg-white"
                        style={{ border: `2px solid ${catMeta.color}` }}
                      >
                        {catMeta.emoji}
                      </span>
                      <span className="text-sm font-bold text-hi">
                        {t(catMeta.labelKey)}
                      </span>
                    </div>
                  )}

                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value.slice(0, CHAR_LIMIT))}
                    placeholder={t('civicReport.comment.placeholder')}
                    maxLength={CHAR_LIMIT}
                    rows={6}
                    className="w-full flex-1 min-h-[140px] rounded-3xl bg-white border border-(--stroke-dark) focus:border-gold-500 focus:shadow-[0_0_0_3px_rgba(245,179,1,0.15)] px-5 py-4 text-base text-hi resize-none outline-none placeholder:text-low transition-all mb-2"
                  />
                  <p className="text-right text-xs text-low mb-4">
                    {description.length}/{CHAR_LIMIT}
                  </p>

                  {(locationError || submitError) && (
                    <p className="text-sm text-danger text-center mb-4 font-medium">
                      {submitError ?? locationError}
                    </p>
                  )}

                  <PillButton
                    onClick={handleSubmit}
                    loading={submitting}
                    disabled={submitting || !category}
                  >
                    {submitting
                      ? photoUploading
                        ? t('civicReport.uploading')
                        : t('civicReport.sending')
                      : t('civicReport.submit')}
                  </PillButton>
                  <button
                    type="button"
                    onClick={() => setStep('photo')}
                    className="mt-4 text-sm font-semibold text-low text-center"
                  >
                    {t('civicReport.back')}
                  </button>
                </motion.div>
              )}

              {step === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', damping: 18, stiffness: 220 }}
                  className="flex-1 flex flex-col items-center justify-center text-center py-12"
                >
                  <div className="relative flex items-center justify-center mb-6">
                    <span className="absolute w-24 h-24 rounded-full border border-(--success)/40 animate-radar" />
                    <span
                      className="w-20 h-20 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(5,150,105,0.12)' }}
                    >
                      <CheckCircle2 className="w-11 h-11 text-success" />
                    </span>
                  </div>

                  <h3
                    className="text-2xl font-bold text-hi"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {t('civicReport.success.title')}
                  </h3>
                  <p className="text-sm text-mid mt-2 max-w-[260px]">
                    {t('civicReport.success.desc')}
                  </p>

                  {reward && reward.xpAwarded > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                      className="mt-6 flex flex-col items-center gap-2"
                    >
                      <span className="flex items-center gap-2 glass rounded-full px-5 py-2.5 text-gold-600 font-bold text-base">
                        <Sparkles className="w-4 h-4" />
                        {t('civicReport.success.reward', {
                          xp: reward.xpAwarded,
                          coins: reward.coinsAwarded,
                        })}
                      </span>
                      {reward.leveledUp && (
                        <span className="text-sm font-bold text-success">
                          {t('civicReport.success.levelUp', { level: reward.level })}
                        </span>
                      )}
                    </motion.div>
                  )}

                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-10 text-sm font-semibold text-mid hover:text-hi transition-colors"
                  >
                    {t('civicReport.success.done')}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
