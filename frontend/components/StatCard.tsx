'use client';

import { useLocale } from './LocaleProvider';

/**
 * A dashboard figure, or an honest admission that it is not connected yet.
 *
 * This component exists because the dashboards previously rendered invented
 * numbers — 12 crops, 95% crop health, ₿45K revenue — as though they were
 * measured. No endpoint backs those figures, so a person reading the dashboard
 * was reading fiction that looked like data. The empty state is deliberately
 * visible rather than hidden: "not yet connected" is the truthful answer and it
 * is what a reviewer should see until Phase 5 supplies a real route.
 */

export interface StatCardProps {
  label: string;
  /** Omit to render the not-connected state. */
  value?: string | number;
  /** Tailwind text colour class for the value. Must be a literal string. */
  accentClass?: string;
}

export function StatCard({ label, value, accentClass = 'text-gray-900' }: StatCardProps) {
  const { t } = useLocale();

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      {value === undefined || value === null || value === '' ? (
        <>
          <div className="text-sm text-gray-400" aria-hidden="true">
            —
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {t('notYetConnected')}
          </div>
        </>
      ) : (
        <div className={`text-2xl font-bold ${accentClass}`}>{value}</div>
      )}
      <div className="text-sm text-gray-600 mt-1">{label}</div>
    </div>
  );
}