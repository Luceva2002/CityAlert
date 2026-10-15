'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, MessageCircle, SendHorizontal } from 'lucide-react';

import { useT } from '@/lib/i18n';
import { timeAgo } from '@/lib/time';
import type { ReportComment } from '@/types/civic';

const MAX_LENGTH = 300;

interface CommentsSectionProps {
  reportId: string;
  onCountChange: (count: number) => void;
}

/** Commenti della comunità: lista + composer */
export function CommentsSection({ reportId, onCountChange }: CommentsSectionProps) {
  const t = useT();
  const [comments, setComments] = useState<ReportComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);
  const listEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setComments([]);
    fetch(`/api/civic/report/${reportId}/comments`)
      .then((res) => (res.ok ? res.json() : { comments: [] }))
      .then((data) => {
        if (cancelled) return;
        const list = (data.comments ?? []) as ReportComment[];
        setComments(list);
        onCountChange(list.length);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reportId, onCountChange]);

  const send = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError(false);
    try {
      const res = await fetch(`/api/civic/report/${reportId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) {
        setError(true);
        return;
      }
      const { comment } = (await res.json()) as { comment: ReportComment };
      setComments((prev) => {
        const next = [...prev, comment];
        onCountChange(next.length);
        return next;
      });
      setDraft('');
      requestAnimationFrame(() => listEndRef.current?.scrollIntoView({ behavior: 'smooth' }));
    } catch {
      setError(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <section>
      <p className="flex items-center gap-1.5 text-[11px] font-bold text-low uppercase tracking-[0.14em] mb-3">
        <MessageCircle className="w-3.5 h-3.5" />
        {t('reportDetail.comments.title')}
        {comments.length > 0 && <span>({comments.length})</span>}
      </p>

      {loading ? (
        <div className="flex justify-center py-5">
          <Loader2 className="w-5 h-5 animate-spin text-gold-500" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-low text-center py-4">{t('reportDetail.comments.empty')}</p>
      ) : (
        <ul className="space-y-2.5 mb-1">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className={`rounded-2xl px-4 py-3 ${
                comment.is_mine ? 'bg-(--gold-500)/10 border border-(--gold-500)/20' : 'glass'
              }`}
            >
              <p className="flex items-baseline justify-between gap-3 mb-1">
                <span className="text-[13px] font-bold text-hi truncate">@{comment.author}</span>
                <span className="text-[11px] text-low shrink-0">
                  {timeAgo(comment.created_at, t)}
                </span>
              </p>
              <p className="text-sm text-(--text-hi)/85 leading-relaxed break-words">
                {comment.body}
              </p>
            </li>
          ))}
          <div ref={listEndRef} />
        </ul>
      )}

      {error && (
        <p className="text-xs text-danger text-center mb-2 font-medium">
          {t('reportDetail.comments.error')}
        </p>
      )}

      {/* Composer */}
      <div className="mt-3 flex items-end gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, MAX_LENGTH))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={t('reportDetail.comments.placeholder')}
          rows={1}
          maxLength={MAX_LENGTH}
          className="flex-1 min-h-[48px] max-h-32 rounded-3xl bg-white border border-(--stroke-dark) focus:border-gold-500 focus:shadow-[0_0_0_3px_rgba(245,179,1,0.15)] px-5 py-3 text-sm text-hi resize-none outline-none placeholder:text-low transition-all"
        />
        <button
          type="button"
          onClick={send}
          disabled={!draft.trim() || sending}
          aria-label={t('reportDetail.comments.send')}
          className="w-12 h-12 shrink-0 rounded-full bg-linear-to-b from-gold-400 to-gold-600 text-(--on-gold) flex items-center justify-center shadow-[0_6px_18px_rgba(245,179,1,0.35)] active:scale-95 hover:brightness-105 transition-all disabled:opacity-40 disabled:shadow-none"
        >
          {sending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <SendHorizontal className="w-5 h-5" />
          )}
        </button>
      </div>
    </section>
  );
}
