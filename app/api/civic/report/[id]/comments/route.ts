import { NextResponse } from 'next/server';

import { requireAuth } from '@/lib/auth/api-auth';
import { commentBodySchema } from '@/lib/civic/validation';

type CommentRow = {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  profiles: { display_name: string | null } | null;
};

function toComment(row: CommentRow, currentUserId: string) {
  return {
    id: row.id,
    body: row.body,
    created_at: row.created_at,
    author: row.profiles?.display_name ?? 'utente',
    is_mine: row.user_id === currentUserId,
  };
}

const COMMENT_SELECT = 'id, body, created_at, user_id, profiles (display_name)';

/** GET /api/civic/report/[id]/comments — lista commenti (dal più vecchio) */
export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ('error' in auth) return auth.error;

  const { user, supabase } = auth;
  const { id: reportId } = await ctx.params;

  const { data, error } = await supabase
    .from('report_comments')
    .select(COMMENT_SELECT)
    .eq('report_id', reportId)
    .order('created_at', { ascending: true })
    .limit(200)
    .overrideTypes<CommentRow[]>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comments: (data ?? []).map((row) => toComment(row, user.id)) });
}

/** POST /api/civic/report/[id]/comments — { body } → commento creato */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ('error' in auth) return auth.error;

  const { user, supabase } = auth;
  const { id: reportId } = await ctx.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = commentBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('report_comments')
    .insert({ report_id: reportId, user_id: user.id, body: parsed.data.body })
    .select(COMMENT_SELECT)
    .single<CommentRow>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comment: toComment(data, user.id) });
}
