"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface QualityReport {
  id: string;
  product_name: string;
  product_category: string;
  overall_grade: number;
  grade_letter: string;
  export_ready: boolean;
  standard_met: string;
  status: string;
  created_at: string;
}

interface GradeResult {
  overall_grade: number;
  grade_letter: string;
  scores: {
    color: number;
    texture: number;
    size: number;
    moisture: number;
    defects: number;
  };
  defects: string[];
  export_ready: boolean;
  standard_met: string;
  recommendations: string[];
  status: string;
  created_at: string;
}

export default function QualityControl() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [productName, setProductName] = useState('');
  const [productCategory, setProductCategory] = useState('flour');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<QualityReport[]>([]);
  const [standards, setStandards] = useState<any[]>([]);

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
      fetchReports();
      fetchStandards();
    } catch (e) {
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/v1/quality/reports', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setReports(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    }
  };

  const fetchStandards = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/v1/quality/standards', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setStandards(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch standards:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileInputRef.current?.files?.length) {
      setError('Please select an image');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', fileInputRef.current.files[0]);
    formData.append('product_name', productName);
    formData.append('product_category', productCategory);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/v1/quality/grade', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setResult(response.data.data);
        fetchReports();
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Quality analysis failed. Please try again.');
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
          <div className="text-4xl mb-4">✅</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const getGradeColor = (grade: number) => {
    if (grade >= 85) return 'text-green-600';
    if (grade >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-700',
      'processed': 'bg-blue-100 text-blue-700',
      'certified': 'bg-green-100 text-green-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-900 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">✅</span>
              <h1 className="text-xl font-bold text-white">AgroNexus Quality</h1>
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
            <h2 className="text-2xl font-bold text-gray-900">✅ Quality Control AI</h2>
            <p className="text-gray-600">AI-powered product quality grading and certification</p>
          </div>
          <button
            onClick={() => router.push('/processor/dashboard')}
            className="mt-4 md:mt-0 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Upload Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g., Teff Flour, Sunflower Oil"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                disabled={isAnalyzing}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Category</label>
              <select
                value={productCategory}
                onChange={(e) => setProductCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={isAnalyzing}
              >
                <option value="flour">Flour</option>
                <option value="oil">Oil</option>
                <option value="coffee">Coffee</option>
                <option value="spice">Spice</option>
                <option value="pulse">Pulse</option>
                <option value="dairy">Dairy</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload Product Image</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="quality-upload"
                  disabled={isAnalyzing}
                />
                <label htmlFor="quality-upload" className="cursor-pointer">
                  <div className="text-4xl mb-2">📸</div>
                  <p className="text-gray-600">Click to upload product image</p>
                  <p className="text-sm text-gray-400">JPG, PNG, JPEG up to 10MB</p>
                </label>
              </div>
            </div>

            {imagePreview && (
              <div className="md:col-span-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full max-h-64 object-contain rounded-lg border border-gray-200"
                />
              </div>
            )}

            {error && (
              <div className="md:col-span-2 bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={isAnalyzing || !imagePreview}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-lg font-medium"
              >
                {isAnalyzing ? '🔬 Analyzing Quality...' : '🔍 Grade Product'}
              </button>
            </div>
          </form>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Grade Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Grade Results</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className={`text-3xl font-bold ${getGradeColor(result.overall_grade)}`}>
                    {result.overall_grade}%
                  </div>
                  <div className="text-sm text-gray-500">Overall Grade</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">{result.grade_letter}</div>
                  <div className="text-sm text-gray-500">Grade Letter</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className={`text-3xl font-bold ${result.export_ready ? 'text-green-600' : 'text-yellow-600'}`}>
                    {result.export_ready ? '✅' : '⚠️'}
                  </div>
                  <div className="text-sm text-gray-500">Export Ready</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-gray-700">{result.standard_met || '-'}</div>
                  <div className="text-sm text-gray-500">Standard Met</div>
                </div>
              </div>
            </div>

            {/* Detailed Scores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="font-semibold text-gray-700 mb-4">📊 Quality Metrics</h4>
                <div className="space-y-3">
                  {Object.entries(result.scores).map(([key, value]) => (
                    <div key={key}>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 capitalize">{key}</span>
                        <span className={`font-medium ${value >= 70 ? 'text-green-600' : 'text-yellow-600'}`}>
                          {value}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${value >= 70 ? 'bg-green-600' : 'bg-yellow-600'}`}
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="font-semibold text-gray-700 mb-4">📋 Details</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Defects Detected</p>
                    {result.defects.length > 0 ? (
                      <ul className="list-disc list-inside text-sm text-gray-700">
                        {result.defects.map((defect, i) => (
                          <li key={i}>{defect}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-green-600">No defects detected ✅</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Recommendations</p>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                      {result.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History */}
        {reports.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Quality History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-gray-600">Product</th>
                    <th className="px-4 py-2 text-left text-gray-600">Grade</th>
                    <th className="px-4 py-2 text-left text-gray-600">Export</th>
                    <th className="px-4 py-2 text-left text-gray-600">Status</th>
                    <th className="px-4 py-2 text-left text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">{r.product_name}</td>
                      <td className="px-4 py-2">
                        <span className={`font-bold ${getGradeColor(r.overall_grade)}`}>
                          {r.overall_grade}% ({r.grade_letter})
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        {r.export_ready ? '✅ Ready' : '⚠️ Check'}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(r.status)}`}>
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
