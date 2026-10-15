'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';

import en from '@/messages/en.json';
import it from '@/messages/it.json';

type Messages = Record<string, unknown>;

const ALL_MESSAGES: Record<string, Messages> = { en, it };

function resolve(obj: Messages, path: string): string | undefined {
  const dotIdx = path.indexOf('.');
  if (dotIdx !== -1) {
    const namespace = path.slice(0, dotIdx);
    const subKey = path.slice(dotIdx + 1);
    const ns = obj[namespace];
    if (ns != null && typeof ns === 'object') {
      const flat = (ns as Record<string, unknown>)[subKey];
      if (typeof flat === 'string') return flat;
      let cur: unknown = ns;
      for (const seg of subKey.split('.')) {
        if (cur == null || typeof cur !== 'object') {
          cur = undefined;
          break;
        }
        cur = (cur as Record<string, unknown>)[seg];
      }
      if (typeof cur === 'string') return cur;
    }
  }
  const direct = obj[path];
  if (typeof direct === 'string') return direct;
  return undefined;
}

export type TFunction = (key: string, params?: Record<string, string | number>) => string;

interface I18nContextValue {
  locale: string;
  setLocale: (locale: string) => void;
  t: TFunction;
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'it',
  setLocale: () => {},
  t: (key) => key,
});

export function I18nProvider({
  defaultLocale = 'it',
  children,
}: {
  defaultLocale?: string;
  children: ReactNode;
}) {
  const [locale, setLocale] = useState(defaultLocale);
  const messages = useMemo(() => ALL_MESSAGES[locale] ?? ALL_MESSAGES.it ?? {}, [locale]);
  const fallback = useMemo(() => (locale === 'it' ? ALL_MESSAGES.en : ALL_MESSAGES.it) ?? null, [locale]);

  const t: TFunction = useCallback(
    (key, params) => {
      let text = resolve(messages, key) ?? (fallback ? resolve(fallback, key) : undefined) ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        }
      }
      return text;
    },
    [messages, fallback],
  );

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

export function useT() {
  return useContext(I18nContext).t;
}
