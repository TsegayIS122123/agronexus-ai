"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { useSession } from '../auth/session';
import { DashboardShell } from '@/components/DashboardShell';
import { StatCard } from '@/components/StatCard';
import { useLocale } from '@/components/LocaleProvider';

export default function ProcessorDashboard() {
  const router = useRouter();
  const { user, loading } = useSession();
  const { t } = useLocale();

  useEffect(() => {
    if (!loading && user && user.role !== 'processor') {
      router.replace(`/${user.role}/dashboard`);
    }
  }, [user, loading, router]);

  // Render nothing while redirecting: painting this dashboard and then swapping
  // it is what made the page blink between roles.
  if (loading) return null;
  if (!user) return null;
  if (user.role !== 'processor') return null;

  return (
    <DashboardShell role="processor">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">{t('dashboard')}</h2>
        <p className="text-gray-600">{t('kpiProcessorSubtitle')}</p>
      </div>

      {/* No endpoint backs these; see FarmerDashboardPage for the same decision. */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label={t('kpiActiveOrders')} accentClass="text-blue-600" />
        <StatCard label={t('kpiQualityScore')} accentClass="text-blue-600" />
        <StatCard label={t('kpiRevenue')} accentClass="text-blue-600" />
        <StatCard label={t('kpiSuppliers')} accentClass="text-blue-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Link href="/processor/feasibility" className="block">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition hover:scale-105 cursor-pointer">
            <div className="text-4xl mb-4" aria-hidden="true">🏗️</div>
            <h3 className="text-xl font-semibold mb-2">{t('navFactoryAdvisor')}</h3>
            <p className="text-gray-600 mb-4">{t('kpiFactoryAdvisorDesc')}</p>
            <span className="text-blue-600 font-medium">{t('tryNow')}</span>
          </div>
        </Link>

        <Link href="/processor/quality" className="block">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition hover:scale-105 cursor-pointer">
            <div className="text-4xl mb-4" aria-hidden="true">✅</div>
            <h3 className="text-xl font-semibold mb-2">{t('navQualityControl')}</h3>
            <p className="text-gray-600 mb-4">{t('kpiQualityControlDesc')}</p>
            <span className="text-blue-600 font-medium">{t('tryNow')}</span>
          </div>
        </Link>

        <Link href="/processor/equipment" className="block">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition hover:scale-105 cursor-pointer">
            <div className="text-4xl mb-4" aria-hidden="true">🔧</div>
            <h3 className="text-xl font-semibold mb-2">{t('navEquipment')}</h3>
            <p className="text-gray-600 mb-4">{t('kpiEquipmentDesc')}</p>
            <span className="text-blue-600 font-medium">{t('browseNow')}</span>
          </div>
        </Link>
      </div>

      {/*
        These two have no route at all, so they are plain cards rather than links.
        A disabled card that looks clickable is worse than one that does not.
      */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/marketplace/listings/new" className="block">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition hover:scale-105 cursor-pointer">
            <div className="text-4xl mb-4" aria-hidden="true">📦</div>
            <h3 className="text-xl font-semibold mb-2">{t('kpiListEquipment')}</h3>
            <p className="text-gray-600 mb-4">{t('kpiListEquipmentDesc')}</p>
            <span className="text-blue-600 font-medium">{t('createListing')}</span>
          </div>
        </Link>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-4xl mb-4" aria-hidden="true">💰</div>
          <h3 className="text-xl font-semibold mb-2">{t('kpiCostCalculator')}</h3>
          <p className="text-gray-600 mb-4">{t('kpiCostCalculatorDesc')}</p>
          <span className="text-gray-400 font-medium">{t('comingSoon')}</span>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-4xl mb-4" aria-hidden="true">⚡</div>
          <h3 className="text-xl font-semibold mb-2">{t('kpiEnergyOptimization')}</h3>
          <p className="text-gray-600 mb-4">{t('kpiEnergyOptimizationDesc')}</p>
          <span className="text-gray-400 font-medium">{t('comingSoon')}</span>
        </div>
      </div>
    </DashboardShell>
  );
}