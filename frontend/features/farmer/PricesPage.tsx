'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardShell } from '@/components/DashboardShell';
import { getAccessToken, useSession } from '@/features/auth/session';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const AI_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

interface Prediction {
  date: string;
  price: number;
  lower: number;
  upper: number;
}

interface HistoricalPoint {
  date: string;
  price: number;
}

interface ForecastData {
  predictions: Prediction[];
  summary?: { trend?: string };
}

export default function PricePrediction() {
  useSession();
  const [loading, setLoading] = useState(true);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [historical, setHistorical] = useState<HistoricalPoint[]>([]);
  const [crops, setCrops] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [selectedCrop, setSelectedCrop] = useState('teff');
  const [selectedRegion, setSelectedRegion] = useState('shewa');
  const [forecastDays, setForecastDays] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authedFetch = useCallback(async <T,>(url: string): Promise<T> => {
    const token = getAccessToken();
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg =
        (body as { message?: string; detail?: string })?.message ??
        (body as { detail?: string })?.detail ??
        `Request failed (${res.status})`;
      throw new Error(msg);
    }
    return body as T;
  }, []);

  const fetchForecast = useCallback(
    async (crop: string, region: string, days: number) => {
      setIsLoading(true);
      setError(null);
      try {
        const [forecastBody, historicalBody] = await Promise.all([
          authedFetch<{ data?: ForecastData } | ForecastData>(
            `${AI_BASE}/api/v1/prices/forecast?crop=${crop}&region=${region}&days=${days}`,
          ),
          authedFetch<{ data?: HistoricalPoint[] } | HistoricalPoint[]>(
            `${AI_BASE}/api/v1/prices/historical?crop=${crop}&region=${region}&limit=90`,
          ),
        ]);
        const fData =
          'data' in forecastBody && forecastBody.data
            ? forecastBody.data
            : (forecastBody as ForecastData);
        setForecast(fData);
        const hData = Array.isArray(historicalBody)
          ? historicalBody
          : historicalBody.data ?? [];
        setHistorical(hData);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    },
    [authedFetch],
  );

  useEffect(() => {
    (async () => {
      try {
        const [cropsBody, regionsBody] = await Promise.all([
          authedFetch<{ data?: string[] } | string[]>(
            `${AI_BASE}/api/v1/prices/crops`,
          ),
          authedFetch<{ data?: string[] } | string[]>(
            `${AI_BASE}/api/v1/prices/regions`,
          ),
        ]);
        const cs = Array.isArray(cropsBody) ? cropsBody : cropsBody.data ?? [];
        const rs = Array.isArray(regionsBody) ? regionsBody : regionsBody.data ?? [];
        setCrops(cs);
        setRegions(rs);
        if (cs.length && rs.length) {
          setSelectedCrop(cs[0]);
          setSelectedRegion(rs[0]);
          await fetchForecast(cs[0], rs[0], 30);
        }
      } catch {
        // controls failing is not page-level
      } finally {
        setLoading(false);
      }
    })();
  }, [authedFetch, fetchForecast]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const chartData = (() => {
    const historicalPoints = historical.map((h) => ({
      date: h.date,
      formattedDate: formatDate(h.date),
      historical: h.price,
    }));
    const forecastPoints = (forecast?.predictions ?? []).map((p) => ({
      date: p.date,
      formattedDate: formatDate(p.date),
      price: p.price,
      lower: p.lower,
      upper: p.upper,
    }));
    return [...historicalPoints, ...forecastPoints];
  })();

  return (
    <DashboardShell role="farmer">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📈 Price Prediction</h2>
          <p className="text-gray-600">AI-powered price forecasts for Ethiopian crops</p>
        </div>
        <Link
          href="/farmer/dashboard"
          className="mt-4 md:mt-0 text-green-600 hover:text-green-700 text-sm font-medium"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Crop</label>
            <select
              value={selectedCrop}
              onChange={(e) => {
                setSelectedCrop(e.target.value);
                void fetchForecast(e.target.value, selectedRegion, forecastDays);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              disabled={isLoading}
            >
              {crops.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
            <select
              value={selectedRegion}
              onChange={(e) => {
                setSelectedRegion(e.target.value);
                void fetchForecast(selectedCrop, e.target.value, forecastDays);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              disabled={isLoading}
            >
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Forecast Days
            </label>
            <select
              value={forecastDays}
              onChange={(e) => {
                const d = Number(e.target.value);
                setForecastDays(d);
                void fetchForecast(selectedCrop, selectedRegion, d);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              disabled={isLoading}
            >
              {[7, 14, 30, 60, 90].map((d) => (
                <option key={d} value={d}>
                  {d} days
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => fetchForecast(selectedCrop, selectedRegion, forecastDays)}
              disabled={isLoading}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Update Forecast'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-8">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-16">
          <p className="text-gray-600">Loading...</p>
        </div>
      )}

      {forecast && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Current Price</p>
              <p className="text-2xl font-bold text-green-600">
                {forecast.predictions[0]?.price?.toFixed(2) ?? 'N/A'}
              </p>
              <p className="text-xs text-gray-400">per quintal</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Predicted ({forecastDays}d)</p>
              <p className="text-2xl font-bold text-blue-600">
                {forecast.predictions[forecast.predictions.length - 1]?.price?.toFixed(
                  2,
                ) ?? 'N/A'}
              </p>
              <p className="text-xs text-gray-400">per quintal</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Trend</p>
              <p className="text-2xl font-bold text-green-600">
                {forecast.summary?.trend === 'down' ? '📉 Down' : '📈 Up'}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Confidence Range</p>
              <p className="text-sm font-semibold text-gray-700">
                ±
                {forecast.predictions[0]?.upper && forecast.predictions[0]?.lower
                  ? (
                      (forecast.predictions[0].upper -
                        forecast.predictions[0].lower) /
                      2
                    ).toFixed(2)
                  : 'N/A'}
              </p>
              <p className="text-xs text-gray-400">95% interval</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Forecast</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="formattedDate" />
                  <YAxis domain={['auto', 'auto']} />
                  <Tooltip
                    formatter={(value: number | string) => [Number(value).toFixed(2), 'Price']}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="historical"
                    stroke="#6b7280"
                    strokeWidth={2}
                    dot={false}
                    name="Historical"
                  />
                  <Area
                    type="monotone"
                    dataKey="upper"
                    fill="#dbeafe"
                    stroke="none"
                    name="Upper Bound"
                  />
                  <Area
                    type="monotone"
                    dataKey="lower"
                    fill="#dbeafe"
                    stroke="none"
                    name="Lower Bound"
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#16a34a"
                    strokeWidth={2}
                    dot={false}
                    name="Predicted"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Forecast</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left text-gray-600">Date</th>
                    <th className="px-4 py-2 text-left text-gray-600">Predicted Price</th>
                    <th className="px-4 py-2 text-left text-gray-600">Lower Bound</th>
                    <th className="px-4 py-2 text-left text-gray-600">Upper Bound</th>
                  </tr>
                </thead>
                <tbody>
                  {forecast.predictions.map((pred, idx) => (
                    <tr key={idx} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-2">{formatDate(pred.date)}</td>
                      <td className="px-4 py-2 font-medium text-green-600">
                        {pred.price.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-gray-500">{pred.lower.toFixed(2)}</td>
                      <td className="px-4 py-2 text-gray-500">{pred.upper.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!forecast && !isLoading && !error && (
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900">No Forecast Available</h3>
          <p className="text-gray-500">Select a crop and region to generate a forecast.</p>
        </div>
      )}
    </DashboardShell>
  );
}
