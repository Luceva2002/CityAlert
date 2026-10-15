import { createBrowserClient } from '@supabase/ssr';

import {
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
  hasSupabaseConfig,
} from '@/lib/supabase/config';

export { hasSupabaseConfig };

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!hasSupabaseConfig) return null;
  if (browserClient) return browserClient;

  browserClient = createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  return browserClient;
}
