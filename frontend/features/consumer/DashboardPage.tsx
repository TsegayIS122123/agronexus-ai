"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { useSession } from '../auth/session';
import { DashboardShell } from '@/components/DashboardShell';
import { StatCard } from '@/components/StatCard';
import { useLocale } from '@/components/LocaleProvider';

export default function ConsumerDashboard() {
  const router = useRouter();
  const { user, loading } = useSession();
  const { t } = useLocale();

  useEffect(() => {
    if (!loading && user && user.role !== 'consumer') {
      router.replace(`/${user.role}/dashboard`);
    }
  }, [user, loading, router]);

  // Render nothing while redirecting: painting this dashboard and then swapping
  // it is what made the page blink between roles.
  if (loading) return null;
  if (!user) return null;
  if (user.role !== 'consumer') return null;

  return (
    <DashboardShell role="consumer">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">{t('dashboard')}</h2>
        <p className="text-gray-600">{t('kpiConsumerSubtitle')}</p>
      </div>

      {/* No endpoint backs these; see FarmerDashboardPage for the same decision. */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label={t('kpiProductsAvailable')} accentClass="text-purple-600" />
        <StatCard label={t('kpiOrdersPlaced')} accentClass="text-purple-600" />
        <StatCard label={t('kpiAverageRating')} accentClass="text-purple-600" />
        <StatCard label={t('kpiFavoriteProducts')} accentClass="text-purple-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/marketplace" className="block">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition hover:scale-105 cursor-pointer">
            <div className="text-4xl mb-4" aria-hidden="true">🛍️</div>
            <h3 className="text-xl font-semibold mb-2">{t('browseCatalog')}</h3>
            <p className="text-gray-600 mb-4">{t('kpiCatalogDesc')}</p>
            <span className="text-purple-600 font-medium">{t('browseNow')}</span>
          </div>
        </Link>

        <Link href="/marketplace/orders" className="block">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition hover:scale-105 cursor-pointer">
            <div className="text-4xl mb-4" aria-hidden="true">📋</div>
            <h3 className="text-xl font-semibold mb-2">{t('myOrders')}</h3>
            <p className="text-gray-600 mb-4">{t('kpiMyOrdersDesc')}</p>
            <span className="text-purple-600 font-medium">{t('viewOrders')}</span>
          </div>
        </Link>

        {/*
          /consumer/price-comparison does not exist. The card used to link to it,
          which produced a 404 behind a styled button. Listed as a gap rather than
          removed, because the feature is planned — it just needs a route first.
        */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-4xl mb-4" aria-hidden="true">💰</div>
          <h3 className="text-xl font-semibold mb-2">{t('kpiPriceComparison')}</h3>
          <p className="text-gray-600 mb-4">{t('kpiPriceComparisonDesc')}</p>
          <span className="text-gray-400 font-medium">{t('comingSoon')}</span>
        </div>
      </div>
    </DashboardShell>
  );
}