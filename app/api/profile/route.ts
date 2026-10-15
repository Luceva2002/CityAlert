import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAuth } from '@/lib/auth/api-auth';

export async function GET() {
  const auth = await requireAuth();
  if ('error' in auth) return auth.error;

  const { user, supabase } = auth;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('display_name, xp, coins, level')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    email: user.email ?? '',
    displayName: profile?.display_name ?? null,
    xp: profile?.xp ?? 0,
    coins: profile?.coins ?? 0,
    level: profile?.level ?? 1,
  });
}

const patchSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2)
    .max(24)
    .regex(/^[\p{L}\p{N}._-]+$/u),
});

export async function PATCH(request: Request) {
  const auth = await requireAuth();
  if ('error' in auth) return auth.error;

  const { user, supabase } = auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
  }

  const { error } = await supabase
    .from('profiles')
    .update({ display_name: parsed.data.displayName })
    .eq('id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ displayName: parsed.data.displayName });
}
