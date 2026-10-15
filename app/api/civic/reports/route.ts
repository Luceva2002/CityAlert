import { NextResponse } from 'next/server';

import { requireAuth } from '@/lib/auth/api-auth';

const BASE_COLUMNS =
  'id, user_id, category, description, address, city, photo_url, status, rewarded, created_at, latitude, longitude';

/** La vista feed esiste solo dopo l'ultimo schema.sql: prima si ripiega sulla tabella */
const MISSING_VIEW_CODE = '42P01';

/**
 * GET /api/civic/reports          → tutte le segnalazioni (mappa comunitaria)
 * GET /api/civic/reports?scope=mine → solo le proprie (profilo)
 * Legge dalla vista `civic_reports_feed` (like, dislike, commenti, mio voto).
 */
export async function GET(request: Request) {
  const auth = await requireAuth();
  if ('error' in auth) return auth.error;

  const { user, supabase } = auth;
  const scope = new URL(request.url).searchParams.get('scope');

  const buildQuery = (source: string, columns: string) => {
    let query = supabase
      .from(source)
      .select(columns)
      .order('created_at', { ascending: false })
      .limit(500);
    if (scope === 'mine') query = query.eq('user_id', user.id);
    return query;
  };

  let { data: reports, error } = await buildQuery(
    'civic_reports_feed',
    `${BASE_COLUMNS}, likes, dislikes, comments_count, my_vote`,
  );

  if (error?.code === MISSING_VIEW_CODE) {
    ({ data: reports, error } = await buildQuery('civic_reports', BASE_COLUMNS));
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type FeedRow = {
    user_id: string;
    status: string | null;
    likes?: number;
    dislikes?: number;
    comments_count?: number;
    my_vote?: number | null;
    [key: string]: unknown;
  };

  return NextResponse.json({
    reports: ((reports ?? []) as unknown as FeedRow[]).map(({ user_id, ...r }) => ({
      ...r,
      status: r.status ?? 'open',
      likes: r.likes ?? 0,
      dislikes: r.dislikes ?? 0,
      comments_count: r.comments_count ?? 0,
      my_vote: r.my_vote ?? 0,
      is_mine: user_id === user.id,
    })),
  });
}
