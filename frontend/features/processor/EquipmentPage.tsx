'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

import { useSession, getAccessToken } from '@/features/auth/session';
import { useLocale } from '@/components/LocaleProvider';

const AI_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

interface Equipment {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  condition: string;
  location: string;
  image_urls?: string[];
  is_available: boolean;
  created_at: string;
}

export default function EquipmentMarketplace() {
  useSession();
  const { t } = useLocale();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    category: '',
    condition: '',
    search: '',
    min_price: '',
    max_price: '',
  });

  const authedFetch = useCallback(async (url: string) => {
    const token = getAccessToken();
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body?.message ?? 'Request failed');
    return body;
  }, []);

  const fetchEquipment = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.condition) params.append('condition', filters.condition);
      if (filters.search) params.append('search', filters.search);
      if (filters.min_price) params.append('min_price', filters.min_price);
      if (filters.max_price) params.append('max_price', filters.max_price);
      const body = await authedFetch(
        `${AI_BASE}/api/v1/equipment/listings?${params.toString()}`,
      );
      const data = body.data ?? body;
      setEquipment(data.listings ?? data ?? []);
    } catch (err) {
      setError((err as Error)?.message ?? 'Failed to load equipment');
    } finally {
      setLoading(false);
    }
  }, [authedFetch, filters]);

  useEffect(() => {
    void fetchEquipment();
  }, [fetchEquipment]);

  useEffect(() => {
    (async () => {
      try {
        const body = await authedFetch(`${AI_BASE}/api/v1/equipment/categories`);
        setCategories(body.data ?? body ?? []);
      } catch {
        // silent
      }
    })();
  }, [authedFetch]);

  return (
    <div className="py-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🔧 {t('navEquipment')}</h1>
          <p className="text-gray-600">{t('kpiEquipmentDesc')}</p>
        </div>
        <Link
          href="/processor/equipment/new"
          className="mt-4 md:mt-0 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
        >
          + List Equipment
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('searchProducts')}
            </label>
            <input
              type="text"
              placeholder="Search"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('category')}
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            >
              <option value="">{t('allCategories')}</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Condition
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              value={filters.condition}
              onChange={(e) => setFilters({ ...filters, condition: e.target.value })}
            >
              <option value="">All</option>
              <option value="new">New</option>
              <option value="used">Used</option>
              <option value="refurbished">Refurbished</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('minPrice')}
            </label>
            <input
              type="number"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              value={filters.min_price}
              onChange={(e) => setFilters({ ...filters, min_price: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('maxPrice')}
            </label>
            <input
              type="number"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              value={filters.max_price}
              onChange={(e) => setFilters({ ...filters, max_price: e.target.value })}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      ) : equipment.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-4xl mb-4">🔧</div>
          <h3 className="text-lg font-medium text-gray-900">
            No equipment found
          </h3>
          <p className="text-gray-500">Be the first to list!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {equipment.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow hover:shadow-lg transition">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      item.is_available
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {item.is_available ? 'Available' : 'Sold'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{item.category}</p>
                <p className="text-gray-600 mt-2 text-sm line-clamp-2">
                  {item.description}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-xl font-bold text-blue-600">{item.price} ETB</p>
                    <p className="text-sm text-gray-500">{item.condition}</p>
                  </div>
                  <div className="text-sm text-gray-500">{item.location}</div>
                </div>
                <Link
                  href={`/processor/equipment/${item.id}`}
                  className="block w-full mt-4 text-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  {t('viewDetails')}
                </Link>
              </div>
            </div>
          ))}
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
