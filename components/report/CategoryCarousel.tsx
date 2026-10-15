'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { CIVIC_CATEGORIES, type CivicCategory } from '@/types/civic';

const ITEM_SIZE = 104;
const GAP = 20;

interface CategoryCarouselProps {
  value: CivicCategory | null;
  onChange: (category: CivicCategory) => void;
  label: (key: string) => string;
}

/** Carosello categorie: attiva centrata, anello e glow nel colore categoria */
export function CategoryCarousel({ value, onChange, label }: CategoryCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const rafRef = useRef<number | null>(null);

  const scrollToIndex = useCallback((index: number, smooth = true) => {
    const el = scrollRef.current;
    if (!el) return;
    const itemStride = ITEM_SIZE + GAP;
    el.scrollTo({ left: index * itemStride, behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  const updateActiveFromScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const itemStride = ITEM_SIZE + GAP;
    const index = Math.round(el.scrollLeft / itemStride);
    const clamped = Math.max(0, Math.min(CIVIC_CATEGORIES.length - 1, index));
    setActiveIndex(clamped);
    const cat = CIVIC_CATEGORIES[clamped];
    if (cat && value !== cat.id) {
      onChange(cat.id);
    }
  }, [onChange, value]);

  const onScroll = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(updateActiveFromScroll);
  }, [updateActiveFromScroll]);

  useEffect(() => {
    if (value == null && CIVIC_CATEGORIES[0]) {
      onChange(CIVIC_CATEGORIES[0].id);
    }
  }, [value, onChange]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || value == null) return;
    const idx = CIVIC_CATEGORIES.findIndex((c) => c.id === value);
    const safeIdx = idx >= 0 ? idx : 0;
    setActiveIndex(safeIdx);
    requestAnimationFrame(() => scrollToIndex(safeIdx, false));
  }, [scrollToIndex, value]);

  const activeMeta = CIVIC_CATEGORIES[activeIndex] ?? CIVIC_CATEGORIES[0];

  return (
    <div className="flex-1 min-h-0 flex flex-col justify-center -mx-6">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex items-center gap-5 overflow-x-auto snap-x snap-mandatory no-scrollbar py-8"
        style={{
          scrollPaddingLeft: 'calc(50% - 52px)',
          scrollPaddingRight: 'calc(50% - 52px)',
          paddingLeft: 'calc(50% - 52px)',
          paddingRight: 'calc(50% - 52px)',
        }}
      >
        {CIVIC_CATEGORIES.map((cat, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setActiveIndex(index);
                onChange(cat.id);
                scrollToIndex(index);
              }}
              className="snap-center shrink-0 flex flex-col items-center transition-all duration-300"
              style={{
                transform: isActive ? 'scale(1)' : 'scale(0.78)',
                opacity: isActive ? 1 : 0.5,
              }}
            >
              <span
                className="w-[104px] h-[104px] rounded-full flex items-center justify-center text-[46px] transition-all duration-300"
                style={
                  isActive
                    ? {
                        background: '#ffffff',
                        border: `3px solid ${cat.color}`,
                        boxShadow: `0 8px 28px ${cat.color}44, 0 0 0 6px ${cat.color}14`,
                      }
                    : {
                        background: 'rgba(255,255,255,0.65)',
                        border: '3px solid rgba(16,24,40,0.08)',
                      }
                }
              >
                {cat.emoji}
              </span>
            </button>
          );
        })}
      </div>

      {/* Etichetta + descrizione della categoria attiva */}
      <div className="text-center px-8 min-h-[64px]">
        <p
          className="text-[22px] font-bold text-hi"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {label(activeMeta.labelKey)}
        </p>
        <p className="text-sm text-mid mt-1">{label(activeMeta.descKey)}</p>
      </div>
    </div>
  );
}
