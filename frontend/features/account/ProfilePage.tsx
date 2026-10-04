'use client';

import { useLocale } from '@/components/LocaleProvider';
import { DashboardShell } from '@/components/DashboardShell';
import { useSession } from '@/features/auth/session';
import type { Role } from '@/lib/navigation';

/**
 * Shared read-only account page for all three roles.
 *
 * This is deliberately not editable. There is no update-profile endpoint on the
 * backend yet, so a form here would either post to nothing or, worse, look like
 * it saved while quietly discarding what was typed. A read-only page that says so
 * is honest about where the product actually is; a fake form is not.
 *
 * The three route files are one-liners that pass a role. That keeps the role
 * prefix in the URL and the navigation highlighting honest without triplicating
 * the markup.
 */

interface Field {
  label: string;
  value: string;
}

/** Region is nullable on the user record; saying "not set" beats rendering nothing. */
function orNotSet(value: string | null | undefined, fallback: string): string {
  return value && value.trim().length > 0 ? value : fallback;
}

export function ProfilePage({ role }: { role: Role }) {
  const { user, loading } = useSession();
  const { t } = useLocale();

  if (loading) {
    return (
      <DashboardShell role={role}>
        <div className="mx-auto max-w-2xl px-4 py-10" aria-busy="true">
          <p className="text-gray-500">{t('loading')}</p>
        </div>
      </DashboardShell>
    );
  }

  if (!user) return null;

  const fields: Field[] = [
    { label: t('name'), value: orNotSet(user.name, t('notProvided')) },
    { label: t('email'), value: orNotSet(user.email, t('notProvided')) },
    { label: t('phone'), value: orNotSet(user.phone, t('notProvided')) },
    { label: t('region'), value: orNotSet(user.region, t('notProvided')) },
    { label: t('language'), value: orNotSet(user.language, t('notProvided')) },
    {
      label: t('role'),
      value: user.role ? t(`role${user.role.charAt(0).toUpperCase()}${user.role.slice(1)}`) : t('notProvided'),
    },
  ];

  return (
    <DashboardShell role={role}>
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h2 className="text-2xl font-bold text-gray-900">{t('profile')}</h2>

        {/*
          Stated up front rather than implied by the absence of an edit button.
          Someone who cannot change their phone number deserves to be told why,
          not left to wonder whether they missed a control.
        */}
        <p className="mt-2 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t('profileReadOnlyNotice')}
        </p>

        <dl className="mt-6 divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
          {fields.map((field) => (
            <div key={field.label} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:gap-4">
              <dt className="text-sm font-medium text-gray-500 sm:w-40">{field.label}</dt>
              <dd className="text-sm text-gray-900">{field.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </DashboardShell>
  );
}