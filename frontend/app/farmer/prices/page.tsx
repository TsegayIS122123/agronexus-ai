"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
  AreaChart,
  Bar,
  Scatter
} from 'recharts';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  language: string;
  role: string;
  created_at: string;
}

interface Prediction {
  date: string;
  price: number;
  lower: number;
  upper: number;
}

interface ForecastData {
  crop: string;
  region: string;
  forecast_days: number;
  predictions: Prediction[];
  summary: {
    min_price: number;
    max_price: number;
    avg_price: number;
    trend: string;
  };
}

export default function PricePrediction() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [historical, setHistorical] = useState<any[]>([]);
  const [crops, setCrops] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<string>('teff');
  const [selectedRegion, setSelectedRegion] = useState<string>('shewa');
  const [forecastDays, setForecastDays] = useState<number>(30);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }
    
    try {
      const parsed = JSON.parse(userData);
      const role = (parsed.role || 'farmer').toLowerCase();
      if (role !== 'farmer') {
        router.push(`/${role}/dashboard`);
        return;
      }
      setUser({ ...parsed, role });
      fetchCropsAndRegions();
    } catch (e) {
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchCropsAndRegions = async () => {
    try {
      const token = localStorage.getItem('token');
      const [cropsRes, regionsRes] = await Promise.all([
        axios.get('/api/v1/prices/crops', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/v1/prices/regions', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      if (cropsRes.data.data && cropsRes.data.data.length > 0) {
        setCrops(cropsRes.data.data);
        setSelectedCrop(cropsRes.data.data[0]);
      }
      
      if (regionsRes.data.data && regionsRes.data.data.length > 0) {
        setRegions(regionsRes.data.data);
        setSelectedRegion(regionsRes.data.data[0]);
      }
      
      // Auto-fetch forecast for first crop/region
      if (cropsRes.data.data?.length > 0 && regionsRes.data.data?.length > 0) {
        await fetchForecast(cropsRes.data.data[0], regionsRes.data.data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch crops/regions:', err);
    }
  };

  const fetchForecast = async (crop?: string, region?: string) => {
    const cropName = crop || selectedCrop;
    const regionName = region || selectedRegion;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const [forecastRes, historyRes] = await Promise.all([
        axios.get(`/api/v1/prices/forecast?crop=${cropName}&region=${regionName}&days=${forecastDays}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`/api/v1/prices/historical?crop=${cropName}&region=${regionName}&limit=90`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      if (forecastRes.data.success) {
        setForecast(forecastRes.data.data);
      } else {
        setError('Failed to generate forecast');
      }
      
      if (historyRes.data.success) {
        setHistorical(historyRes.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch price data');
      console.error('Forecast error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCropChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCrop(e.target.value);
    fetchForecast(e.target.value, selectedRegion);
  };

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRegion(e.target.value);
    fetchForecast(selectedCrop, e.target.value);
  };

  const handleDaysChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForecastDays(Number(e.target.value));
    // Auto-refetch with new days
    setTimeout(() => fetchForecast(selectedCrop, selectedRegion), 100);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="text-4xl mb-4">📈</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">📈 Price Prediction</h2>
            <p className="text-gray-600">AI-powered price forecasts for Ethiopian crops</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-4">
            <button
              onClick={() => router.push('/farmer/dashboard')}
              className="text-green-600 hover:text-green-700 text-sm font-medium"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Crop</label>
              <select
                value={selectedCrop}
                onChange={handleCropChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                disabled={isLoading}
              >
                {crops.length > 0 ? (
                  crops.map(crop => (
                    <option key={crop} value={crop}>
                      {crop.charAt(0).toUpperCase() + crop.slice(1)}
                    </option>
                  ))
                ) : (
                  <option value="">No crops available</option>
                )}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
              <select
                value={selectedRegion}
                onChange={handleRegionChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                disabled={isLoading}
              >
                {regions.length > 0 ? (
                  regions.map(region => (
                    <option key={region} value={region}>
                      {region.charAt(0).toUpperCase() + region.slice(1)}
                    </option>
                  ))
                ) : (
                  <option value="">No regions available</option>
                )}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Forecast Days</label>
              <select
                value={forecastDays}
                onChange={handleDaysChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                disabled={isLoading}
              >
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
                <option value="60">60 days</option>
                <option value="90">90 days</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => fetchForecast(selectedCrop, selectedRegion)}
                disabled={isLoading}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {isLoading ? 'Loading...' : 'Update Forecast'}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-8">
            {error}
          </div>
        )}

        {/* Forecast Results */}
        {forecast && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Summary Cards */}
            <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">Current Price</p>
                <p className="text-2xl font-bold text-green-600">
                  {forecast.predictions[0]?.price?.toFixed(2) || 'N/A'}
                </p>
                <p className="text-xs text-gray-400">per quintal</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">Predicted (30 days)</p>
                <p className="text-2xl font-bold text-blue-600">
                  {forecast.predictions[forecast.predictions.length - 1]?.price?.toFixed(2) || 'N/A'}
                </p>
                <p className="text-xs text-gray-400">per quintal</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">Trend</p>
                <p className={`text-2xl font-bold ${forecast.summary.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {forecast.summary.trend === 'up' ? '📈 Up' : '📉 Down'}
                </p>
                <p className="text-xs text-gray-400">
                  {forecast.summary.trend === 'up' ? 'Increasing' : 'Decreasing'}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">Confidence Range</p>
                <p className="text-sm font-semibold text-gray-700">
                  ±{((forecast.predictions[0]?.upper - forecast.predictions[0]?.lower) / 2)?.toFixed(2) || 'N/A'}
                </p>
                <p className="text-xs text-gray-400">95% confidence interval</p>
              </div>
            </div>

            {/* Price Chart */}
            <div className="lg:col-span-3 bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Forecast</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={forecast.predictions.map(p => ({
                      ...p,
                      formattedDate: formatDate(p.date)
                    }))}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="formattedDate" />
                    <YAxis domain={['auto', 'auto']} />
                    <Tooltip
                      formatter={(value: any) => [`${Number(value).toFixed(2)}`, 'Price']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="upper"
                      fill="#dbeafe"
                      stroke="none"
                      name="Upper Bound"
                    />
                    <Area
                      type="monotone"
                      dataKey="lower"
                      fill="#dbeafe"
                      stroke="none"
                      name="Lower Bound"
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#16a34a"
                      strokeWidth={2}
                      dot={false}
                      name="Predicted Price"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-gray-400 mt-4">
                * Forecast based on historical data and AI model. Prices are estimates per quintal.
              </p>
            </div>

            {/* Price Table */}
            <div className="lg:col-span-3 bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Forecast</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left text-gray-600">Date</th>
                      <th className="px-4 py-2 text-left text-gray-600">Predicted Price</th>
                      <th className="px-4 py-2 text-left text-gray-600">Lower Bound</th>
                      <th className="px-4 py-2 text-left text-gray-600">Upper Bound</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecast.predictions.map((pred, idx) => (
                      <tr key={idx} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-2">{formatDate(pred.date)}</td>
                        <td className="px-4 py-2 font-medium text-green-600">
                          {pred.price.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-gray-500">{pred.lower.toFixed(2)}</td>
                        <td className="px-4 py-2 text-gray-500">{pred.upper.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {!forecast && !isLoading && !error && (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900">No Forecast Available</h3>
            <p className="text-gray-500">Select a crop and region to generate a price forecast.</p>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin text-4xl mb-4">⏳</div>
            <p className="text-gray-600">Generating price forecast...</p>
          </div>
        )}
      </main>
    </div>
  );
}
