'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User, Session } from '@supabase/supabase-js';

import { getSupabaseBrowserClient } from '@/lib/supabase/client';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export function useAuth() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    if (!supabase) {
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setState({ user: session?.user ?? null, session, loading: false });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      setState({ user: session?.user ?? null, session, loading: false });
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signUp = useCallback(
    async (email: string, password: string): Promise<{ needsEmailConfirmation: boolean }> => {
      if (!supabase) throw new Error('Supabase not configured');
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      return { needsEmailConfirmation: !data.session };
    },
    [supabase],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase) throw new Error('Supabase not configured');
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    [supabase],
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push('/auth');
  }, [supabase, router]);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  }, [supabase]);

  const updatePassword = useCallback(
    async (newPassword: string) => {
      if (!supabase) throw new Error('Supabase not configured');
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
    },
    [supabase],
  );

  return { ...state, signUp, signIn, signInWithGoogle, signOut, updatePassword };
}
