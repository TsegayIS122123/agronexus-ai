"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { useSession, endSession } from '../auth/session';
import { LanguageToggle } from '@/components/LanguageToggle';

export default function ConsumerDashboard() {
  const router = useRouter();
  const { user, loading } = useSession();

  useEffect(() => {
    if (!loading && user && user.role !== 'consumer') {
      router.replace(`/${user.role}/dashboard`);
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await endSession();
    router.push('/');
  };

  // Render nothing while redirecting: painting this dashboard and then swapping
  // it is what made the page blink between roles.
  if (loading) return null;
  if (!user) return null;
  if (user.role !== 'consumer') return null;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-purple-900 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🛒</span>
              <h1 className="text-xl font-bold text-white">AgroNexus Market</h1>
              <span className="ml-2 text-xs bg-purple-700 text-purple-100 px-2 py-1 rounded">Consumer</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-white text-sm hidden md:block">Welcome, {user.name}</span>
              <LanguageToggle />
              <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm font-medium">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Consumer Dashboard</h2>
          <p className="text-gray-600">Discover and buy local Ethiopian products</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">24</div>
            <div className="text-sm text-gray-600">Products Available</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">12</div>
            <div className="text-sm text-gray-600">Orders Placed</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">4.8⭐</div>
            <div className="text-sm text-gray-600">Average Rating</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">5</div>
            <div className="text-sm text-gray-600">Favorite Products</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/marketplace" className="block">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition hover:scale-105 cursor-pointer">
              <div className="text-4xl mb-4">🛍️</div>
              <h3 className="text-xl font-semibold mb-2">Product Catalog</h3>
              <p className="text-gray-600 mb-4">Browse Ethiopian-made products</p>
              <span className="text-purple-600 font-medium">Browse Now →</span>
            </div>
          </Link>

          <Link href="/marketplace/orders" className="block">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition hover:scale-105 cursor-pointer">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-xl font-semibold mb-2">My Orders</h3>
              <p className="text-gray-600 mb-4">Track your orders</p>
              <span className="text-purple-600 font-medium">View Orders →</span>
            </div>
          </Link>

          <Link href="/consumer/price-comparison" className="block">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition hover:scale-105 cursor-pointer">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-semibold mb-2">Price Comparison</h3>
              <p className="text-gray-600 mb-4">Compare local vs imported prices</p>
              <span className="text-purple-600 font-medium">Compare Now →</span>
            </div>
          </Link>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Your Profile</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600">
            <div><strong>Name:</strong> {user.name}</div>
            <div><strong>Email:</strong> {user.email}</div>
            <div><strong>Phone:</strong> {user.phone}</div>
            <div><strong>Role:</strong> {user.role}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
