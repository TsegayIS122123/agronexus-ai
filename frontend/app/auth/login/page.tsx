"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Sending login data:', formData);
      const response = await axios.post('/api/auth/login', formData);
      console.log('Login response:', response.data);
      
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      router.push('/farmer/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      console.error('Error response:', err.response?.data);
      
      const errorMsg = err.response?.data?.detail || 'Invalid email or password';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
          <div className="text-center">
            <div className="text-4xl mb-2">🌾</div>
            <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
            <p className="mt-2 text-gray-600">Sign in to your AgroNexus AI account</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 pr-10"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <p className="text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/auth/register" className="text-green-600 hover:text-green-700 font-medium">
                Create one now
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
