'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { useSession, getAccessToken } from '@/features/auth/session';
import { useLocale } from '@/components/LocaleProvider';
import { marketplaceApi, type MarketplaceOrder } from './api';

/**
 * Buyer/seller order list with status transitions.
 *
 * The signed-out gate is gone — a visitor sees "sign in to view orders" rather
 * than being bounced. Field names are camelCase (totalPrice, unitPrice,
 * createdAt) because that is what the NestJS controller serializes.
 */
export default function Orders() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const { t } = useLocale();

  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer');

  const fetchOrders = useCallback(
    async (orderRole: 'buyer' | 'seller') => {
      const accessToken = getAccessToken();
      if (!accessToken) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const result = await marketplaceApi.listOrders(
          orderRole,
          undefined,
          accessToken,
        );
        setOrders(result.orders);
        setRole(orderRole);
      } catch (err) {
        setError((err as Error)?.message ?? 'Failed to fetch orders');
        setOrders([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!sessionLoading && user) {
      void fetchOrders('buyer');
    } else if (!sessionLoading && !user) {
      setLoading(false);
    }
  }, [sessionLoading, user, fetchOrders]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    const accessToken = getAccessToken();
    if (!accessToken) return;
    try {
      await marketplaceApi.updateOrderStatus(
        orderId,
        status as 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled',
        accessToken,
      );
      await fetchOrders(role);
    } catch (err) {
      setError((err as Error)?.message ?? 'Failed to update order');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-blue-100 text-blue-700',
      processing: 'bg-purple-100 text-purple-700',
      shipped: 'bg-indigo-100 text-indigo-700',
      delivered: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (sessionLoading) {
    return (
      <div className="text-center py-24">
        <div className="text-4xl mb-4">⏳</div>
        <p className="text-gray-600">{t('loading')}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-24 bg-white rounded-lg shadow max-w-lg mx-auto mt-8">
        <div className="text-4xl mb-4">🔒</div>
        <h2 className="text-lg font-medium text-gray-900">
          {t('signInToOrder')}
        </h2>
        <Link
          href="/auth/login"
          className="inline-block mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
        >
          {t('signIn')}
        </Link>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📋 {t('myOrders')}</h1>
          <p className="text-gray-600">{t('kpiMyOrdersDesc')}</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <button
            onClick={() => fetchOrders('buyer')}
            className={`px-4 py-2 rounded-lg transition ${
              role === 'buyer'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            As Buyer
          </button>
          <button
            onClick={() => fetchOrders('seller')}
            className={`px-4 py-2 rounded-lg transition ${
              role === 'seller'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            As Seller
          </button>
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
          <p className="text-gray-600">{t('loadingOrders')}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-4xl mb-4">📦</div>
          <h3 className="text-lg font-medium text-gray-900">
            {t('noOrdersFound')}
          </h3>
          <p className="text-gray-500">{t('startBuyingSelling')}</p>
          <Link
            href="/marketplace"
            className="inline-block mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
          >
            {t('browseMarketplace')}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(
                        order.status,
                      )}`}
                    >
                      {order.status.charAt(0).toUpperCase() +
                        order.status.slice(1)}
                    </span>
                    <span className="text-sm text-gray-500">
                      Order #{order.id.slice(0, 8)}
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-lg font-semibold text-gray-900">
                      {order.quantity} × {order.unitPrice} ETB
                    </p>
                    <p className="text-sm text-gray-500">
                      {t('orderTotal')}:{' '}
                      <span className="font-bold text-purple-600">
                        {order.totalPrice} ETB
                      </span>
                    </p>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
                  {order.status === 'pending' && role === 'seller' && (
                    <>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'confirmed')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                      >
                        {t('markConfirmed')}
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'cancelled')}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm"
                      >
                        {t('cancelOrder')}
                      </button>
                    </>
                  )}
                  {order.status === 'confirmed' && role === 'seller' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'processing')}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm"
                    >
                      {t('markProcessing')}
                    </button>
                  )}
                  {order.status === 'processing' && role === 'seller' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'shipped')}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm"
                    >
                      {t('markShipped')}
                    </button>
                  )}
                  {order.status === 'shipped' && role === 'buyer' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'delivered')}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm"
                    >
                      {t('markDelivered')}
                    </button>
                  )}
                  {order.status === 'delivered' && (
                    <span className="text-green-600 font-medium text-sm">
                      ✅ {order.status}
                    </span>
                  )}
                  {order.status === 'cancelled' && (
                    <span className="text-red-600 font-medium text-sm">
                      ❌ {order.status}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
