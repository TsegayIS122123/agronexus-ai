'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

import { useSession } from '@/features/auth/session';
import { useLocale } from '@/components/LocaleProvider';
import { marketplaceApi, type MarketplaceListing } from './api';

/**
 * Browse listings.
 *
 * Public: a signed-out visitor sees the catalogue and is offered "Sign in to
 * order" rather than being redirected away. The list, category, and region
 * endpoints are @Public() on the backend.
 *
 * No inline header. SiteChrome already renders the global header for
 * /marketplace routes because 'marketplace' is not in its role-segment set.
 *
 * No local logout either — signing out is the header's job, and the header's
 * endSession() revokes the refresh token server-side. The previous local
 * logout only cleared dead localStorage keys, leaving the cookie in place,
 * so the next navigation bounced straight back in.
 */
export default function MarketplacePage() {
  const { user } = useSession();
  const { t } = useLocale();

  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    category: '',
    region: '',
    search: '',
    min_price: '',
    max_price: '',
  });

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await marketplaceApi.listListings(filters);
      setListings(result.listings);
    } catch (err) {
      setError(
        (err as Error)?.message ?? 'Could not load listings. Please try again.',
      );
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void fetchListings();
  }, [fetchListings]);

  useEffect(() => {
    void Promise.all([marketplaceApi.categories(), marketplaceApi.regions()])
      .then(([cats, regs]) => {
        setCategories(cats);
        setRegions(regs);
      })
      .catch(() => {
        // Filters failing is not worth a page-level error; the listing grid
        // still renders, just without the dropdown options.
      });
  }, []);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="py-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🏪 {t('marketplace')}</h1>
          <p className="text-gray-600">{t('kpiMarketplaceDesc')}</p>
        </div>
        {user ? (
          <Link
            href="/marketplace/listings/new"
            className="mt-4 md:mt-0 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm font-medium"
          >
            + {t('createListing')}
          </Link>
        ) : (
          <Link
            href="/auth/login"
            className="mt-4 md:mt-0 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm font-medium"
          >
            {t('signInToOrder')}
          </Link>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('searchProducts')}
            </label>
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('category')}
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">{t('allCategories')}</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('region')}
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              value={filters.region}
              onChange={(e) => handleFilterChange('region', e.target.value)}
            >
              <option value="">{t('allRegions')}</option>
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('minPrice')}
            </label>
            <input
              type="number"
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              value={filters.min_price}
              onChange={(e) => handleFilterChange('min_price', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('maxPrice')}
            </label>
            <input
              type="number"
              placeholder="100000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              value={filters.max_price}
              onChange={(e) => handleFilterChange('max_price', e.target.value)}
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
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">{t('loadingListings')}</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-4xl mb-4">📦</div>
          <h3 className="text-lg font-medium text-gray-900">
            {t('noListingsFound')}
          </h3>
          <p className="text-gray-500">{t('beTheFirst')}</p>
          {user ? (
            <Link
              href="/marketplace/listings/new"
              className="inline-block mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
            >
              {t('createListing')}
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="inline-block mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
            >
              {t('signIn')}
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition"
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {listing.title}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      listing.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {listing.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{listing.category}</p>
                <p className="text-gray-600 mt-2 text-sm line-clamp-2">
                  {listing.description}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-xl font-bold text-purple-600">
                      {listing.price} ETB
                    </p>
                    <p className="text-sm text-gray-500">
                      {listing.quantity} {listing.unit}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    <span className="block">{listing.region}</span>
                    {listing.qualityGrade && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {t('grade')} {listing.qualityGrade}
                      </span>
                    )}
                  </div>
                </div>
                <Link
                  href={`/marketplace/listings/${listing.id}`}
                  className="block w-full mt-4 text-center bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                >
                  {t('viewDetails')}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
