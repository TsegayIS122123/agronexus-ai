'use client';

import { useLocale } from './LocaleProvider';
import type { Locale } from '@/lib/i18n';

const OPTIONS: { value: Locale; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'am', label: 'አማ' },
];

function asLocale(value: string): Locale | null {
  return OPTIONS.some((option) => option.value === value) ? (value as Locale) : null;
}

/**
 * Language picker, shared by the global header and the dashboards.
 *
 * The dashboards render their own header, so without a shared control each one
 * would have to grow its own copy of this select and they would drift apart.
 *
 * `tone` is for placing it on the dark dashboard bars rather than the global
 * header; the two use the same markup so the option list can never diverge.
 */
export function LanguageToggle({
  tone = 'dark',
  className = '',
}: {
  tone?: 'dark' | 'light';
  className?: string;
}) {
  const { locale, setLocale } = useLocale();

  const shared =
    'text-sm rounded-lg px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500';
  const styled =
    tone === 'dark'
      ? `${shared} bg-gray-700 text-white border border-gray-600`
      : `${shared} bg-white text-gray-900 border border-gray-300`;

  return (
    <select
      value={locale}
      onChange={(event) => {
        const next = asLocale(event.target.value);
        if (next) setLocale(next);
      }}
      className={`${styled} ${className}`.trim()}
      aria-label="Language"
    >
      {OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}