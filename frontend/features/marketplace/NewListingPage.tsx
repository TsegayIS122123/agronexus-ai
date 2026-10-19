'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { useSession, getAccessToken } from '@/features/auth/session';
import { useLocale } from '@/components/LocaleProvider';
import { marketplaceApi } from './api';

/**
 * Create-listing form.
 *
 * The signed-out visitor is redirected to /auth/login only when they actually
 * submit — the form is visible either way. This is deliberate: a signed-out
 * visitor who reaches this URL through a shared link should see what they are
 * being asked to sign in for.
 *
 * Field names match CreateListingInput: qualityGrade (camelCase),
 * expiresDays (camelCase). The previous version posted snake_case, which the
 * NestJS ValidationPipe rejects under forbidNonWhitelisted.
 */
export default function NewListing() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const { t } = useLocale();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'crop',
    quantity: 0,
    unit: 'kg',
    price: 0,
    region: '',
    district: '',
    qualityGrade: '',
  });

  // A signed-out visitor who lands here should not be kicked out mid-form;
  // they can read it, then either sign in or leave. But if they never sign
  // in, submitting would do nothing — so send them to login on submit.
  useEffect(() => {
    if (!sessionLoading && !user) {
      // Soft redirect: leave the page visible until submit. The submit
      // handler is what actually enforces sign-in.
    }
  }, [sessionLoading, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const accessToken = getAccessToken();
    if (!accessToken) {
      router.push('/auth/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await marketplaceApi.createListing(
        {
          title: formData.title,
          description: formData.description || undefined,
          category: formData.category,
          quantity: Number(formData.quantity),
          unit: formData.unit,
          price: Number(formData.price),
          region: formData.region,
          district: formData.district || undefined,
          qualityGrade: formData.qualityGrade || undefined,
          expiresDays: 30,
        },
        accessToken,
      );
      router.push('/marketplace');
    } catch (err) {
      setError((err as Error)?.message ?? 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <Link
          href="/marketplace"
          className="text-purple-600 hover:text-purple-700 text-sm font-medium"
        >
          ← {t('backToMarketplace')}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-4">
          {t('newListingTitle')}
        </h1>
        <p className="text-gray-600">{t('kpiSellProductsDesc')}</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('titleField')}
            </label>
            <input
              type="text"
              required
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="Premium Teff Flour"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('descriptionField')}
            </label>
            <textarea
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              rows={3}
              placeholder="Describe your product"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('category')}
              </label>
              <select
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              >
                <option value="crop">Crop</option>
                <option value="processed">Processed</option>
                <option value="equipment">Equipment</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('qualityGradeField')}
              </label>
              <select
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                value={formData.qualityGrade}
                onChange={(e) =>
                  setFormData({ ...formData, qualityGrade: e.target.value })
                }
              >
                <option value="">—</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="Premium">Premium</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('quantity')}
              </label>
              <input
                type="number"
                required
                min="0.1"
                step="0.1"
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                value={formData.quantity || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quantity: parseFloat(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('unitField')}
              </label>
              <select
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                value={formData.unit}
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
              >
                <option value="kg">kg</option>
                <option value="ton">ton</option>
                <option value="piece">piece</option>
                <option value="liter">liter</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('priceField')}
              </label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                value={formData.price || ''}
                onChange={(e) =>
                  setFormData({ ...formData, price: parseFloat(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('region')}
              </label>
              <input
                type="text"
                required
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Shewa"
                value={formData.region}
                onChange={(e) =>
                  setFormData({ ...formData, region: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('districtField')}
              </label>
              <input
                type="text"
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Addis Ababa"
                value={formData.district}
                onChange={(e) =>
                  setFormData({ ...formData, district: e.target.value })
                }
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 text-lg font-medium"
          >
            {loading ? t('loading') : t('newListingSubmit')}
          </button>
        </form>
      </div>
    </div>
  );
}
