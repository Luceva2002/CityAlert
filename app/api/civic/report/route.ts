import { NextResponse } from 'next/server';

import { requireAuth } from '@/lib/auth/api-auth';
import { civicReportBodySchema } from '@/lib/civic/validation';
import { levelForXp, type ReportReward } from '@/types/civic';

export async function POST(request: Request) {
  const auth = await requireAuth();
  if ('error' in auth) return auth.error;

  const { user, supabase } = auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = civicReportBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { category, description, latitude, longitude, photo_url, city, country, address } =
    parsed.data;

  const { data: report, error } = await supabase
    .from('civic_reports')
    .insert({
      user_id: user.id,
      category,
      description,
      latitude,
      longitude,
      photo_url: photo_url ?? null,
      city: city ?? null,
      country: country ?? null,
      address: address ?? null,
    })
    .select(
      'id, category, description, address, city, photo_url, status, rewarded, created_at, latitude, longitude',
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Reward XP/monete (best-effort: se la RPC non esiste ancora il report resta valido)
  let reward: ReportReward | null = null;
  const { data: rewardRows, error: rewardError } = await supabase.rpc('award_report', {
    p_report_id: report.id,
  });

  if (!rewardError && Array.isArray(rewardRows) && rewardRows[0]) {
    const row = rewardRows[0] as {
      xp: number;
      coins: number;
      level: number;
      xp_awarded: number;
      coins_awarded: number;
    };
    reward = {
      xp: row.xp,
      coins: row.coins,
      level: row.level,
      xpAwarded: row.xp_awarded,
      coinsAwarded: row.coins_awarded,
      leveledUp: row.xp_awarded > 0 && levelForXp(row.xp - row.xp_awarded) < row.level,
    };
  }

  return NextResponse.json({
    report: {
      ...report,
      rewarded: reward ? reward.xpAwarded > 0 : report.rewarded,
      is_mine: true,
      likes: 0,
      dislikes: 0,
      comments_count: 0,
      my_vote: 0,
    },
    reward,
  });
}
