"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  language: string;
  role: string;
  created_at: string;
}

export default function ConsumerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }
    
    try {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      if (parsed.role && parsed.role !== 'consumer') {
        router.push(`/${parsed.role}/dashboard`);
      }
    } catch (e) {
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.cookie = 'access_token=; path=/; max-age=0; SameSite=Lax';
    document.cookie = 'user_role=; path=/; max-age=0; SameSite=Lax';
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="text-4xl mb-4">🛒</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

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
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-4xl mb-4">🛍️</div>
            <h3 className="text-xl font-semibold mb-2">Product Catalog</h3>
            <p className="text-gray-600 mb-4">Browse Ethiopian-made products</p>
            <button disabled className="text-purple-600 font-medium opacity-50 cursor-not-allowed">Coming Soon →</button>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">Price Comparison</h3>
            <p className="text-gray-600 mb-4">Compare local vs imported</p>
            <button disabled className="text-purple-600 font-medium opacity-50 cursor-not-allowed">Coming Soon →</button>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-4xl mb-4">🚚</div>
            <h3 className="text-xl font-semibold mb-2">Direct Delivery</h3>
            <p className="text-gray-600 mb-4">Get products delivered</p>
            <button disabled className="text-purple-600 font-medium opacity-50 cursor-not-allowed">Coming Soon →</button>
          </div>
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
