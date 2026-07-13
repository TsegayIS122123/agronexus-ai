"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🌾</span>
              <h1 className="text-xl font-bold text-green-700">AgroNexus AI</h1>
            </div>
            <div className="flex items-center space-x-4">
              {isLoggedIn ? (
                <Link href="/farmer/dashboard" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/auth/login" className="text-gray-700 hover:text-green-600 transition">
                    Login
                  </Link>
                  <Link href="/auth/register" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Connecting Ethiopian
              <span className="text-green-600"> Farmers to Industry</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              AI-powered platform for disease detection, price prediction, and direct market access. 
              Empowering Ethiopian farmers with cutting-edge technology.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/auth/register" className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition text-lg">
                Start Farming Smarter
              </Link>
              <button className="bg-gray-200 text-gray-800 px-8 py-3 rounded-lg hover:bg-gray-300 transition text-lg">
                Watch Demo
              </button>
            </div>
          </div>

          {/* Features */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
              <div className="text-4xl mb-4">🔬</div>
              <h3 className="text-xl font-semibold mb-2">Disease Detection</h3>
              <p className="text-gray-600">Upload a photo and get instant diagnosis using AI</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-xl font-semibold mb-2">AI Assistant</h3>
              <p className="text-gray-600">24/7 farming advice in Amharic, Oromo, and Tigrinya</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
              <div className="text-4xl mb-4">📈</div>
              <h3 className="text-xl font-semibold mb-2">Price Prediction</h3>
              <p className="text-gray-600">Know when to sell for maximum profit</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
