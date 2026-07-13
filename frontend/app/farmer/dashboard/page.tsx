"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function FarmerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }
    
    setUser(JSON.parse(userData));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="text-2xl mb-2">🌾</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🌾</span>
              <h1 className="text-xl font-bold text-green-700">AgroNexus AI</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.name}</span>
              <button onClick={handleLogout} className="text-red-600 hover:text-red-700 transition">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Farmer Dashboard</h2>
          <p className="text-gray-600">Your AI-powered farming assistant</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Disease Detection Card */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="text-4xl mb-4">🔬</div>
            <h3 className="text-xl font-semibold mb-2">Disease Detection</h3>
            <p className="text-gray-600 mb-4">Upload crop photo for instant AI diagnosis</p>
            <button disabled className="text-green-600 font-medium opacity-50 cursor-not-allowed">
              Coming Soon →
            </button>
          </div>

          {/* AI Assistant Card */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-semibold mb-2">AI Assistant</h3>
            <p className="text-gray-600 mb-4">Get farming advice in your language</p>
            <button disabled className="text-green-600 font-medium opacity-50 cursor-not-allowed">
              Coming Soon →
            </button>
          </div>

          {/* Price Prediction Card */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="text-4xl mb-4">📈</div>
            <h3 className="text-xl font-semibold mb-2">Price Prediction</h3>
            <p className="text-gray-600 mb-4">Know best time to sell your crops</p>
            <button disabled className="text-green-600 font-medium opacity-50 cursor-not-allowed">
              Coming Soon →
            </button>
          </div>
        </div>

        {/* User Info Section */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Your Profile</h3>
          <div className="space-y-2 text-gray-600">
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Phone:</strong> {user.phone}</p>
            <p><strong>Language:</strong> {user.language}</p>
            <p><strong>Member since:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
