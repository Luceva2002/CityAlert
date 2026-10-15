import { NextResponse } from 'next/server';

import { requireAuth } from '@/lib/auth/api-auth';
import { voteBodySchema } from '@/lib/civic/validation';

/**
 * POST /api/civic/report/[id]/vote — { value: 1 | -1 | 0 }
 * 1 = like, -1 = dislike, 0 = rimuove il voto. Ritorna gli aggregati aggiornati.
 */
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

  const parsed = voteBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
  }

  const { value } = parsed.data;

  const { error } =
    value === 0
      ? await supabase
          .from('report_votes')
          .delete()
          .eq('report_id', reportId)
          .eq('user_id', user.id)
      : await supabase
          .from('report_votes')
          .upsert(
            { report_id: reportId, user_id: user.id, value },
            { onConflict: 'report_id,user_id' },
          );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: votes, error: countError } = await supabase
    .from('report_votes')
    .select('value')
    .eq('report_id', reportId);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  const rows = votes ?? [];
  return NextResponse.json({
    likes: rows.filter((v) => v.value === 1).length,
    dislikes: rows.filter((v) => v.value === -1).length,
    my_vote: value,
  });
}
