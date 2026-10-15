'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/lib/auth/use-auth';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace('/auth');
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="h-dvh flex items-center justify-center bg-(--bg)">
        <div className="relative w-12 h-12">
          <span className="absolute inset-0 rounded-full border-2 border-(--gold-500)/25" />
          <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-gold-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-dvh bg-(--bg) overflow-hidden">
      <main className="h-full w-full">{children}</main>
    </div>
  );
}
