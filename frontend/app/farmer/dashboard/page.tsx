"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  language: string;
  role: string;
  created_at: string;
}

export default function FarmerDashboard() {
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
      
      // Redirect if wrong role
      if (parsed.role && parsed.role !== 'farmer') {
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
          <div className="text-4xl mb-4">🌾</div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ========== DASHBOARD HEADER ========== */}
      <header className="bg-green-900 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🌾</span>
              <h1 className="text-xl font-bold text-white">AgroNexus AI</h1>
              <span className="ml-2 text-xs bg-green-700 text-green-100 px-2 py-1 rounded">Farmer</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-white text-sm hidden md:block">Welcome, {user.name}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ========== DASHBOARD CONTENT ========== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Farmer Dashboard</h2>
          <p className="text-gray-600">Your AI-powered farming assistant</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">12</div>
            <div className="text-sm text-gray-600">Active Crops</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">5</div>
            <div className="text-sm text-gray-600">Detections This Month</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">₿ 45K</div>
            <div className="text-sm text-gray-600">Estimated Revenue</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">95%</div>
            <div className="text-sm text-gray-600">Crop Health</div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/farmer/disease" className="block">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition hover:scale-105 cursor-pointer">
              <div className="text-4xl mb-4">🔬</div>
              <h3 className="text-xl font-semibold mb-2">Disease Detection</h3>
              <p className="text-gray-600 mb-4">Upload crop photo for instant AI diagnosis</p>
              <span className="text-green-600 font-medium">Try Now →</span>
            </div>
          </Link>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-semibold mb-2">AI Assistant</h3>
            <p className="text-gray-600 mb-4">Get farming advice in your language</p>
            <button disabled className="text-green-600 font-medium opacity-50 cursor-not-allowed">
              Coming Soon →
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-4xl mb-4">📈</div>
            <h3 className="text-xl font-semibold mb-2">Price Prediction</h3>
            <p className="text-gray-600 mb-4">Know best time to sell your crops</p>
            <button disabled className="text-green-600 font-medium opacity-50 cursor-not-allowed">
              Coming Soon →
            </button>
          </div>
        </div>

        {/* Profile Section */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Your Profile</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600">
            <div><strong>Name:</strong> {user.name}</div>
            <div><strong>Email:</strong> {user.email}</div>
            <div><strong>Phone:</strong> {user.phone}</div>
            <div><strong>Language:</strong> {user.language}</div>
            <div><strong>Role:</strong> {user.role}</div>
            <div><strong>Member since:</strong> {new Date(user.created_at).toLocaleDateString()}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
