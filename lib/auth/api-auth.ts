import 'server-only';

import { NextResponse } from 'next/server';

import { getSupabaseRouteClient } from '@/lib/supabase/server';

export async function requireAuth() {
  const supabase = await getSupabaseRouteClient();
  if (!supabase) {
    return {
      error: NextResponse.json({ error: 'Supabase not configured' }, { status: 500 }),
    };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return { user, supabase };
}
