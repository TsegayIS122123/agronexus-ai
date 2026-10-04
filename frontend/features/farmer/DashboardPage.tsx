"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { useSession } from "../auth/session";
import { DashboardShell } from "@/components/DashboardShell";
import { StatCard } from "@/components/StatCard";
import { useLocale } from "@/components/LocaleProvider";

export default function FarmerDashboard() {
  const router = useRouter();
  const { user, loading } = useSession();
  const { t } = useLocale();

  useEffect(() => {
    if (!loading && user && user.role !== 'farmer') {
      router.replace(`/${user.role}/dashboard`);
    }
  }, [user, loading, router]);

  // Render nothing while signed out or while a wrong-role visit is being
  // redirected. Painting the spinner or the farmer chrome first and then
  // swapping it is what made the page appear to blink between dashboards;
  // router.replace above swaps the history entry too, so Back does not return
  // the person to the dashboard that rejected them.
  if (loading) return null;
  if (!user) return null;
  if (user.role !== 'farmer') return null;

  return (
    <DashboardShell role="farmer">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">{t('dashboard')}</h2>
        <p className="text-gray-600">{t('taglineShort')}</p>
      </div>

      {/*
        No value is passed: no endpoint returns these yet. They previously showed
        invented numbers (12 crops, 5 detections, ₿45K revenue, 95% crop health).
        Phase 5 supplies real routes; until then the honest empty state is better
        than fiction that reads as measurement.
      */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label={t('kpiActiveCrops')} accentClass="text-green-600" />
        <StatCard label={t('kpiDetectionsThisMonth')} accentClass="text-green-600" />
        <StatCard label={t('kpiEstimatedRevenue')} accentClass="text-green-600" />
        <StatCard label={t('kpiCropHealth')} accentClass="text-green-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Link href="/farmer/disease" className="block">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition hover:scale-105 cursor-pointer">
            <div className="text-4xl mb-4" aria-hidden="true">🔬</div>
            <h3 className="text-xl font-semibold mb-2">{t('kpiDiseaseDetection')}</h3>
            <p className="text-gray-600 mb-4">{t('kpiDiseaseDetectionDesc')}</p>
            <span className="text-green-600 font-medium">{t('tryNow')}</span>
          </div>
        </Link>

        <Link href="/farmer/chat" className="block">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition hover:scale-105 cursor-pointer">
            <div className="text-4xl mb-4" aria-hidden="true">💬</div>
            <h3 className="text-xl font-semibold mb-2">{t('navAiAssistant')}</h3>
            <p className="text-gray-600 mb-4">{t('kpiAssistantDesc')}</p>
            <span className="text-green-600 font-medium">{t('chatNow')}</span>
          </div>
        </Link>

        <Link href="/farmer/prices" className="block">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition hover:scale-105 cursor-pointer">
            <div className="text-4xl mb-4" aria-hidden="true">📈</div>
            <h3 className="text-xl font-semibold mb-2">{t('kpiPricePrediction')}</h3>
            <p className="text-gray-600 mb-4">{t('kpiPricePredictionDesc')}</p>
            <span className="text-green-600 font-medium">{t('viewForecast')}</span>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/marketplace" className="block">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition hover:scale-105 cursor-pointer">
            <div className="text-4xl mb-4" aria-hidden="true">🏪</div>
            <h3 className="text-xl font-semibold mb-2">{t('marketplace')}</h3>
            <p className="text-gray-600 mb-4">{t('kpiMarketplaceDesc')}</p>
            <span className="text-purple-600 font-medium">{t('browseNow')}</span>
          </div>
        </Link>

        <Link href="/marketplace/listings/new" className="block">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition hover:scale-105 cursor-pointer">
            <div className="text-4xl mb-4" aria-hidden="true">📦</div>
            <h3 className="text-xl font-semibold mb-2">{t('kpiSellProducts')}</h3>
            <p className="text-gray-600 mb-4">{t('kpiSellProductsDesc')}</p>
            <span className="text-purple-600 font-medium">{t('createListing')}</span>
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
      </div>
    </DashboardShell>
  );
}