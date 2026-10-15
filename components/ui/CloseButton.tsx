'use client';

import { X } from 'lucide-react';

import { GlassIconButton } from '@/components/ui/GlassIconButton';
import { useT } from '@/lib/i18n';

interface CloseButtonProps {
  onClick: () => void;
  className?: string;
}

/** Cerchio vetro con ✕ */
export function CloseButton({ onClick, className = '' }: CloseButtonProps) {
  const t = useT();
  return (
    <GlassIconButton onClick={onClick} ariaLabel={t('reportDetail.close')} className={className}>
      <X className="w-5 h-5" />
    </GlassIconButton>
  );
}
