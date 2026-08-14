"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

interface Equipment {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  condition: string;
  location: string;
  image_urls: string[];
  specs: any;
  is_available: boolean;
  created_at: string;
}

export default function EquipmentMarketplace() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    category: '',
    condition: '',
    search: '',
    min_price: '',
    max_price: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }
    setUser(JSON.parse(userData));
    fetchEquipment();
    fetchCategories();
  }, []);

  const fetchEquipment = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.condition) params.append('condition', filters.condition);
      if (filters.search) params.append('search', filters.search);
      if (filters.min_price) params.append('min_price', filters.min_price);
      if (filters.max_price) params.append('max_price', filters.max_price);
      
      const response = await axios.get(`/api/v1/equipment/listings?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setEquipment(response.data.data.listings);
      }
    } catch (err) {
      console.error('Failed to fetch equipment:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/v1/equipment/categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🔧</span>
              <h1 className="text-xl font-bold text-white">Equipment Marketplace</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/processor/dashboard" className="text-white hover:text-gray-300 transition text-sm">
                Dashboard
              </Link>
              <span className="text-white text-sm hidden md:block">Welcome, {user.name}</span>
              <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm font-medium">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">🔧 Equipment Marketplace</h2>
            <p className="text-gray-600">Buy and sell processing equipment</p>
          </div>
          <Link href="/processor/equipment/new" className="mt-4 md:mt-0 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
            + List Equipment
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search equipment..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                value={filters.condition}
                onChange={(e) => setFilters({...filters, condition: e.target.value})}
              >
                <option value="">All</option>
                <option value="new">New</option>
                <option value="used">Used</option>
                <option value="refurbished">Refurbished</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Price</label>
              <input
                type="number"
                placeholder="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                value={filters.min_price}
                onChange={(e) => setFilters({...filters, min_price: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
              <input
                type="number"
                placeholder="100000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                value={filters.max_price}
                onChange={(e) => setFilters({...filters, max_price: e.target.value})}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={fetchEquipment} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
              Apply Filters
            </button>
          </div>
        </div>

        {/* Equipment Listings */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-600">Loading equipment...</p>
          </div>
        ) : equipment.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-4xl mb-4">🔧</div>
            <h3 className="text-lg font-medium text-gray-900">No Equipment Found</h3>
            <p className="text-gray-500">Be the first to list equipment!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {equipment.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow hover:shadow-lg transition">
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs ${item.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {item.is_available ? 'Available' : 'Sold'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{item.category}</p>
                  <p className="text-gray-600 mt-2 text-sm line-clamp-2">{item.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-xl font-bold text-blue-600">{item.price} ETB</p>
                      <p className="text-sm text-gray-500">{item.condition}</p>
                    </div>
                    <div className="text-sm text-gray-500">{item.location}</div>
                  </div>
                  <Link href={`/processor/equipment/${item.id}`} className="block w-full mt-4 text-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
