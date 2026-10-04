"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useLocale } from '@/components/LocaleProvider';

export default function Solutions() {
  const router = useRouter();
  const { t } = useLocale();

  useEffect(() => {
    router.push('/');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">🌾</div>
        <p className="text-gray-600">{t('redirecting')}</p>
      </div>
    </div>
  );
}