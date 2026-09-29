'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import {
  Locale,
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  normalizeLocale,
  TRANSLATIONS,
  LOCALE_LABELS,
  type Locale as LocaleType,
} from '@/lib/i18n';

interface LocaleContextValue {
  locale: LocaleType;
  setLocale: (locale: LocaleType) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  ready: boolean;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

interface LocaleProviderProps {
  children: ReactNode;
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<LocaleType>(DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setLocale = useCallback(
    (next: LocaleType) => {
      if (next === locale) return;
      setLocaleState(next);
    },
    [locale]
  );

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('locale') : null;
    if (saved) {
      const normalized = normalizeLocale(saved);
      setLocaleState(normalized);
    }
    setMounted(true);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('locale', locale);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      document.documentElement.lang = locale;
    }, 0);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [locale, mounted]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const messages = TRANSLATIONS[locale] || TRANSLATIONS.en;
      const message = messages[key];
      if (!message) {
        const fallback = TRANSLATIONS.en[key];
        if (!fallback) return key;
        return interpolate(fallback, params);
      }
      return interpolate(message, params);
    },
    [locale]
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, ready }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return context;
}

export function useLocaleValue() {
  const { locale, setLocale, t, ready } = useLocale();
  return { locale, setLocale, t, ready };
}

function interpolate(message: string, params?: Record<string, string | number>): string {
  if (!params) return message;
  return message.replace(/\{(\w+)\}/g, (_, key) => {
    const value = params[key];
    return value !== undefined ? String(value) : `{${key}}`;
  });
}
