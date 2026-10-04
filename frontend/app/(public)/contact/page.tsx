'use client';

import { useLocale } from '@/components/LocaleProvider';

export default function Contact() {
  const { t } = useLocale();

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('contactUs')}</h1>
        <div className="bg-white p-8 rounded-xl shadow">
          <p className="text-gray-600 mb-2">
            <strong>{t('email')}:</strong> tsegayassefa27@gmail.com
          </p>
          <p className="text-gray-600 mb-2">
            <strong>{t('phone')}:</strong> +251 979 416 992
          </p>
          <p className="text-gray-600">
            <strong>{t('location')}:</strong> {t('addisAbabaEthiopia')}
          </p>
        </div>
      </div>
    </div>
  );
}