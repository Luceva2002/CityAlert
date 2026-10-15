import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import {
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
  hasSupabaseConfig,
} from '@/lib/supabase/config';

/** Cookie-backed Supabase client for Route Handlers and Server Components. */
export async function getSupabaseRouteClient() {
  if (!hasSupabaseConfig) return null;

  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}
