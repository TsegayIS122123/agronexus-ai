'use client';

import { useLocale } from '@/components/LocaleProvider';

export default function About() {
  const { t } = useLocale();

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('aboutTagline')}</h1>
        <div className="bg-white p-8 rounded-xl shadow">
          <p className="text-gray-600 mb-4">{t('aboutMissionOne')}</p>
          <p className="text-gray-600 mb-4">{t('aboutMissionTwo')}</p>
          <p className="text-gray-600">{t('aboutBuiltBy')}</p>
        </div>
      </div>
    </div>
  );
}