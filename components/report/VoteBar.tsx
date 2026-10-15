'use client';

import { useState } from 'react';
import { ThumbsDown, ThumbsUp } from 'lucide-react';

import { useT } from '@/lib/i18n';
import type { VoteSummary } from '@/types/civic';

interface VoteBarProps {
  reportId: string;
  likes: number;
  dislikes: number;
  myVote: number;
  onChange: (summary: VoteSummary) => void;
}

/** Like/dislike per validare la segnalazione (un voto per utente, togglabile) */
export function VoteBar({ reportId, likes, dislikes, myVote, onChange }: VoteBarProps) {
  const t = useT();
  const [pending, setPending] = useState(false);

  const vote = async (value: 1 | -1) => {
    if (pending) return;
    setPending(true);
    try {
      const next = myVote === value ? 0 : value;
      const res = await fetch(`/api/civic/report/${reportId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: next }),
      });
      if (res.ok) onChange((await res.json()) as VoteSummary);
    } catch {
      // rete assente: lo stato resta invariato
    } finally {
      setPending(false);
    }
  };

  const base =
    'flex-1 h-12 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold transition-all active:scale-[0.97] disabled:opacity-60';

  return (
    <div>
      <p className="eyebrow mb-2.5">
        {t('reportDetail.votes.title')}
      </p>
      <div className="flex gap-2.5">
        <button
          type="button"
          disabled={pending}
          onClick={() => vote(1)}
          aria-label={t('reportDetail.votes.like')}
          aria-pressed={myVote === 1}
          className={`${base} ${
            myVote === 1
              ? 'bg-success text-white shadow-[0_6px_20px_rgba(5,150,105,0.35)]'
              : 'card text-hi hover:bg-(--surface-muted)'
          }`}
        >
          <ThumbsUp className="w-[18px] h-[18px]" />
          {likes}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => vote(-1)}
          aria-label={t('reportDetail.votes.dislike')}
          aria-pressed={myVote === -1}
          className={`${base} ${
            myVote === -1
              ? 'bg-danger text-white shadow-[0_6px_20px_rgba(220,38,38,0.35)]'
              : 'card text-hi hover:bg-(--surface-muted)'
          }`}
        >
          <ThumbsDown className="w-[18px] h-[18px]" />
          {dislikes}
        </button>
      </div>
    </div>
  );
}
