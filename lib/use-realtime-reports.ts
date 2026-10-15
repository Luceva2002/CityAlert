'use client';

import { useEffect } from 'react';

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { CivicReportRecord, ReportStatus } from '@/types/civic';

type ReportRow = {
  id: string;
  user_id: string;
  category: string;
  description: string;
  address: string | null;
  city: string | null;
  photo_url: string | null;
  status: ReportStatus | null;
  rewarded: boolean;
  created_at: string;
  latitude: number;
  longitude: number;
};

/**
 * Segnalazioni in tempo reale: push di ogni nuovo insert su civic_reports
 * verso tutti i client connessi (richiede la publication in schema.sql).
 */
export function useRealtimeReports(
  currentUserId: string | undefined,
  onInsert: (report: CivicReportRecord) => void,
) {
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel('civic-reports-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'civic_reports' },
        (payload: { new: ReportRow }) => {
          const row = payload.new;
          if (!row?.id) return;
          const { user_id, ...rest } = row;
          onInsert({
            ...rest,
            status: rest.status ?? 'open',
            is_mine: user_id === currentUserId,
            likes: 0,
            dislikes: 0,
            comments_count: 0,
            my_vote: 0,
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, onInsert]);
}
