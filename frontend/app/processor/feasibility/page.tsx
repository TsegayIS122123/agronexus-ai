"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface Product {
  name: string;
  category: string;
  description: string;
  min_capital: number;
  max_capital: number;
  min_quantity: number;
  avg_roi: number;
  payback_months: number;
  image_url?: string;
}

interface FeasibilityResult {
  product_name: string;
  location: string;
  capital: number;
  quantity: number;
  scores: {
    feasibility_score: number;
    financial_score: number;
    market_score: number;
    resource_score: number;
    location_score: number;
  };
  financials: {
    estimated_roi: number;
    payback_period: number;
    monthly_revenue: number;
    monthly_cost: number;
    monthly_profit: number;
    annual_profit: number;
  };
  recommendations: string[];
  risks: string[];
  product_spec: {
    name: string;
    category: string;
    description: string;
    equipment: string[];
    steps: string[];
    avg_roi: number;
    payback_months: number;
  };
  status: string;
}

export default function FactoryFeasibility() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [capital, setCapital] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(0);
  const [result, setResult] = useState<FeasibilityResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }
    
    try {
      const parsed = JSON.parse(userData);
      const role = (parsed.role || 'processor').toLowerCase();
      if (role !== 'processor') {
        router.push(`/${role}/dashboard`);
        return;
      }
      setUser({ ...parsed, role });
      fetchProducts();
      fetchReports();
    } catch (e) {
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/v1/industry/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setProducts(response.data.data);
        if (response.data.data.length > 0) {
          setSelectedProduct(response.data.data[0].name);
        }
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/v1/industry/reports', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setReports(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/v1/industry/feasibility', {
        product_name: selectedProduct,
        location: location || 'Addis Ababa',
        capital: capital,
        quantity: quantity
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setResult(response.data.data.feasibility);
        fetchReports(); // Refresh reports list
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
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
          <div className="text-4xl mb-4">🏭</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'High Feasibility';
    if (score >= 60) return 'Medium Feasibility';
    return 'Low Feasibility';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-900 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🏭</span>
              <h1 className="text-xl font-bold text-white">AgroNexus Industry</h1>
              <span className="ml-2 text-xs bg-blue-700 text-blue-100 px-2 py-1 rounded">Processor</span>
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
            <h2 className="text-2xl font-bold text-gray-900">🏗️ Factory Feasibility Advisor</h2>
            <p className="text-gray-600">Assess if you can process local crops into finished products</p>
          </div>
          <button
            onClick={() => router.push('/processor/dashboard')}
            className="mt-4 md:mt-0 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Analysis Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <form onSubmit={handleAnalyze} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product to Process</label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={isAnalyzing}
              >
                {products.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name} (ROI: {p.avg_roi}%, Min: {p.min_capital.toLocaleString()} ETB)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Addis Ababa"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={isAnalyzing}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capital Investment (ETB)
              </label>
              <input
                type="number"
                value={capital || ''}
                onChange={(e) => setCapital(Number(e.target.value))}
                placeholder="e.g., 100000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                disabled={isAnalyzing}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Available Raw Material (kg/month)
              </label>
              <input
                type="number"
                value={quantity || ''}
                onChange={(e) => setQuantity(Number(e.target.value))}
                placeholder="e.g., 1000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                disabled={isAnalyzing}
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={isAnalyzing}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-lg font-medium"
              >
                {isAnalyzing ? 'Analyzing...' : '🔍 Analyze Feasibility'}
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-8">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Score Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Feasibility Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className={`text-2xl font-bold ${getScoreColor(result.scores.feasibility_score)}`}>
                    {result.scores.feasibility_score}%
                  </div>
                  <div className="text-sm text-gray-500">Overall</div>
                  <div className="text-xs font-medium text-gray-600">{getScoreLabel(result.scores.feasibility_score)}</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{result.scores.financial_score}%</div>
                  <div className="text-sm text-gray-500">Financial</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{result.scores.market_score}%</div>
                  <div className="text-sm text-gray-500">Market</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{result.scores.resource_score}%</div>
                  <div className="text-sm text-gray-500">Resources</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{result.scores.location_score}%</div>
                  <div className="text-sm text-gray-500">Location</div>
                </div>
              </div>
            </div>

            {/* Financial Projections */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-500">Estimated ROI</p>
                <p className="text-2xl font-bold text-green-600">{result.financials.estimated_roi}%</p>
                <p className="text-xs text-gray-400">Annual return on investment</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-500">Payback Period</p>
                <p className="text-2xl font-bold text-blue-600">{result.financials.payback_period} months</p>
                <p className="text-xs text-gray-400">Time to recover investment</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-500">Monthly Profit</p>
                <p className="text-2xl font-bold text-green-600">{result.financials.monthly_profit.toFixed(0)} ETB</p>
                <p className="text-xs text-gray-400">After all costs</p>
              </div>
            </div>

            {/* Product Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Product Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Product</p>
                  <p className="font-medium">{result.product_spec.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="font-medium">{result.product_spec.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Equipment Needed</p>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {result.product_spec.equipment.slice(0, 3).map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Processing Steps</p>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {result.product_spec.steps.slice(0, 3).map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Recommendations & Risks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h4 className="font-semibold text-green-700 mb-2">✅ Recommendations</h4>
                <ul className="list-disc list-inside text-sm text-green-600 space-y-1">
                  {result.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h4 className="font-semibold text-red-700 mb-2">⚠️ Risks</h4>
                <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                  {result.risks.map((risk, i) => (
                    <li key={i}>{risk}</li>
                  ))}
                </ul>
              </div>
            </div>

            {result.status === 'review' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
                <p className="font-medium">📋 Under Review</p>
                <p className="text-sm">This feasibility report requires additional review before approval.</p>
              </div>
            )}
          </div>
        )}

        {/* History */}
        {reports.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Your Feasibility Reports</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-gray-600">Product</th>
                    <th className="px-4 py-2 text-left text-gray-600">Score</th>
                    <th className="px-4 py-2 text-left text-gray-600">ROI</th>
                    <th className="px-4 py-2 text-left text-gray-600">Payback</th>
                    <th className="px-4 py-2 text-left text-gray-600">Status</th>
                    <th className="px-4 py-2 text-left text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">{r.product_type}</td>
                      <td className="px-4 py-2">
                        <span className={`font-medium ${r.feasibility_score >= 70 ? 'text-green-600' : 'text-yellow-600'}`}>
                          {r.feasibility_score}%
                        </span>
                      </td>
                      <td className="px-4 py-2">{r.estimated_roi}%</td>
                      <td className="px-4 py-2">{r.payback_period} months</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          r.status === 'approved' ? 'bg-green-100 text-green-700' :
                          r.status === 'review' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-500">{new Date(r.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
