import type { TFunction } from '@/lib/i18n';

/** Tempo relativo localizzato ("2 h fa") */
export function timeAgo(iso: string, t: TFunction): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return t('reportDetail.time.now');
  if (minutes < 60) return t('reportDetail.time.minutes', { n: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('reportDetail.time.hours', { n: hours });
  return t('reportDetail.time.days', { n: Math.floor(hours / 24) });
}
