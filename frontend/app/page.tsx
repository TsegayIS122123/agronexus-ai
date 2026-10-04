"use client";

import Link from 'next/link';

import { useLocale } from '@/components/LocaleProvider';

export default function Home() {
  const { t } = useLocale();

  return (
    <div className="min-h-screen">
      {/* ========== HERO SECTION ========== */}
      <section className="bg-gradient-to-br from-green-50 via-white to-green-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              {t('heroLineOne')}
              <br />
              <span className="text-green-600">{t('heroLineTwo')}</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">{t('heroSubtitle')}</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/auth/register?role=farmer"
                className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition text-lg font-medium"
              >
                🌾 {t('joinAsFarmer')}
              </Link>
              <Link
                href="/auth/register?role=processor"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition text-lg font-medium"
              >
                🏭 {t('joinAsProcessor')}
              </Link>
              <Link
                href="/auth/register?role=consumer"
                className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition text-lg font-medium"
              >
                🛒 {t('joinAsConsumer')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">{t('howItWorks')}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-xl hover:shadow-lg transition">
              <div className="text-5xl mb-4">🌾</div>
              <h3 className="text-xl font-semibold mb-2">{t('step1')}</h3>
              <p className="text-gray-600">{t('step1Desc')}</p>
            </div>
            <div className="text-center p-6 rounded-xl hover:shadow-lg transition">
              <div className="text-5xl mb-4">🏭</div>
              <h3 className="text-xl font-semibold mb-2">{t('step2')}</h3>
              <p className="text-gray-600">{t('step2Desc')}</p>
            </div>
            <div className="text-center p-6 rounded-xl hover:shadow-lg transition">
              <div className="text-5xl mb-4">🛒</div>
              <h3 className="text-xl font-semibold mb-2">{t('step3')}</h3>
              <p className="text-gray-600">{t('step3Desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/*
        These four figures are aspirations, not measurements.

        They were previously presented as achieved results ("1M+ Farmers
        Empowered") on a platform with no production users, which is a claim
        nobody can substantiate. The numbers are kept because they describe the
        intended scale, but the heading and note now say plainly that they are
        targets. If they are ever replaced with real figures, these two strings
        should go with them.
      */}
      <section className="py-16 bg-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">{t('goalsHeading')}</h2>
          <p className="text-center text-sm text-gray-600 mb-10 max-w-2xl mx-auto">
            {t('goalsDisclaimer')}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-green-700">1M+</div>
              <div className="text-gray-600">{t('farmersEmpowered')}</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-700">1,000+</div>
              <div className="text-gray-600">{t('processorsEnabled')}</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-700">$500M</div>
              <div className="text-gray-600">{t('importSubstitution')}</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-700">50K+</div>
              <div className="text-gray-600">{t('jobsCreated')}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}