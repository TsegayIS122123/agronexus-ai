'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

import { useSession, getAccessToken } from '@/features/auth/session';
import { useLocale } from '@/components/LocaleProvider';

const AI_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

interface Product {
  name: string;
  category: string;
  description: string;
  min_capital: number;
  max_capital: number;
  avg_roi: number;
  payback_months: number;
}

export default function FactoryFeasibility() {
  useSession();
  const { t } = useLocale();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [location, setLocation] = useState('Addis Ababa');
  const [capital, setCapital] = useState(100000);
  const [quantity, setQuantity] = useState(1000);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<any[]>([]);

  const authedFetch = useCallback(
    async (url: string, init?: RequestInit) => {
      const token = getAccessToken();
      const res = await fetch(url, {
        ...init,
        headers: {
          ...(init?.headers ?? {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Content-Type': 'application/json',
        },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.message ?? 'Request failed');
      return body;
    },
    [],
  );

  const loadProducts = useCallback(async () => {
    try {
      const body = await authedFetch(`${AI_BASE}/api/v1/industry/products`);
      const data = body.data ?? body;
      setProducts(data);
      if (data.length > 0 && !selectedProduct) {
        setSelectedProduct(data[0].name);
      }
    } catch {
      // silent
    }
  }, [authedFetch, selectedProduct]);

  const loadReports = useCallback(async () => {
    try {
      const body = await authedFetch(`${AI_BASE}/api/v1/industry/reports`);
      setReports(body.data ?? body ?? []);
    } catch {
      // silent
    }
  }, [authedFetch]);

  useEffect(() => {
    void loadProducts();
    void loadReports();
  }, [loadProducts, loadReports]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnalyzing(true);
    setError(null);
    setResult(null);
    try {
      const body = await authedFetch(`${AI_BASE}/api/v1/industry/feasibility`, {
        method: 'POST',
        body: JSON.stringify({
          product_name: selectedProduct,
          location,
          capital,
          quantity,
        }),
      });
      setResult(body.data?.feasibility ?? body.data ?? body);
      await loadReports();
    } catch (err) {
      setError((err as Error)?.message ?? 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">🏗️ {t('navFactoryAdvisor')}</h1>
        <p className="text-gray-600">{t('kpiFactoryAdvisorDesc')}</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <form onSubmit={handleAnalyze} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('product')}
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              {products.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} (ROI: {p.avg_roi}%)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Capital (ETB)
            </label>
            <input
              type="number"
              required
              min="1"
              value={capital}
              onChange={(e) => setCapital(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Raw material (kg/month)
            </label>
            <input
              type="number"
              required
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={analyzing || !selectedProduct}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {analyzing ? t('loading') : 'Analyze Feasibility'}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Feasibility Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {result.scores?.feasibility_score ?? result.scores?.feasibilityScore ?? '—'}%
                </div>
                <div className="text-sm text-gray-500">Overall</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {result.scores?.financial_score ?? result.scores?.financialScore ?? '—'}%
                </div>
                <div className="text-sm text-gray-500">Financial</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {result.scores?.market_score ?? result.scores?.marketScore ?? '—'}%
                </div>
                <div className="text-sm text-gray-500">Market</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {result.scores?.resource_score ?? result.scores?.resourceScore ?? '—'}%
                </div>
                <div className="text-sm text-gray-500">Resources</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {result.scores?.location_score ?? result.scores?.locationScore ?? '—'}%
                </div>
                <div className="text-sm text-gray-500">Location</div>
              </div>
            </div>
          </div>

          {result.financials && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-500">Estimated ROI</p>
                <p className="text-2xl font-bold text-green-600">
                  {result.financials.estimated_roi ?? result.financials.estimatedRoi}%
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-500">Payback Period</p>
                <p className="text-2xl font-bold text-blue-600">
                  {result.financials.payback_period ?? result.financials.paybackPeriod} months
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-500">Monthly Profit</p>
                <p className="text-2xl font-bold text-green-600">
                  {result.financials.monthly_profit ?? result.financials.monthlyProfit} ETB
                </p>
              </div>
            </div>
          )}

          {result.recommendations && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h4 className="font-semibold text-green-700 mb-2">✅ Recommendations</h4>
                <ul className="list-disc list-inside text-sm text-green-600 space-y-1">
                  {result.recommendations.map((r: string, i: number) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
              {result.risks && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <h4 className="font-semibold text-red-700 mb-2">⚠️ Risks</h4>
                  <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                    {result.risks.map((r: string, i: number) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-8">
        <Link
          href="/processor/dashboard"
          className="text-blue-600 hover:text-blue-700"
        >
          ← {t('backToDashboard')}
        </Link>
      </div>
    </div>
  );
}
