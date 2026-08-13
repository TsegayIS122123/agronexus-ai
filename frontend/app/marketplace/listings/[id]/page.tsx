"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

interface Listing {
  id: string;
  title: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  price: number;
  region: string;
  district: string;
  quality_grade: string;
  certifications: string[];
  image_urls: string[];
  delivery_options: any;
  status: string;
  created_at: string;
}

export default function ListingDetail() {
  const router = useRouter();
  const params = useParams();
  const listingId = params.id as string;
  
  const [user, setUser] = useState<any>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [orderLoading, setOrderLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }
    setUser(JSON.parse(userData));
    fetchListing();
  }, [listingId]);

  const fetchListing = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/v1/marketplace/listings/${listingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setListing(response.data.data);
      }
    } catch (err) {
      setError('Failed to load listing');
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = async () => {
    if (!listing) return;
    
    setOrderLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/v1/marketplace/orders', {
        listing_id: listingId,
        quantity: quantity,
        delivery_address: 'To be confirmed'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        router.push('/marketplace/orders');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to place order');
    } finally {
      setOrderLoading(false);
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
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="text-4xl mb-4">📦</div>
          <p className="text-gray-600">Listing not found</p>
          <Link href="/marketplace" className="text-purple-600 hover:underline">Back to Marketplace</Link>
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
              <span className="text-2xl">🏪</span>
              <h1 className="text-xl font-bold text-white">AgroNexus Market</h1>
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/marketplace" className="text-purple-600 hover:text-purple-700 text-sm font-medium">
            ← Back to Marketplace
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-start">
              <h1 className="text-2xl font-bold text-gray-900">{listing.title}</h1>
              <span className={`px-3 py-1 rounded-full text-sm ${
                listing.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {listing.status}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              <span className="text-sm bg-gray-100 px-2 py-1 rounded">{listing.category}</span>
              {listing.quality_grade && (
                <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">Grade {listing.quality_grade}</span>
              )}
              {listing.certifications?.map((cert: string) => (
                <span key={cert} className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded">✓ {cert}</span>
              ))}
            </div>

            <div className="mt-4 text-gray-600 whitespace-pre-wrap">{listing.description}</div>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Price</p>
                <p className="text-2xl font-bold text-purple-600">{listing.price} ETB</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Quantity Available</p>
                <p className="text-lg font-semibold">{listing.quantity} {listing.unit}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="text-gray-700">{listing.region}{listing.district ? `, ${listing.district}` : ''}</p>
              </div>
            </div>

            <div className="mt-6 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Place Order</h3>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}
              <div className="flex items-end gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity ({listing.unit})</label>
                  <input
                    type="number"
                    min="1"
                    max={listing.quantity}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.min(Number(e.target.value), listing.quantity))}
                    className="mt-1 w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <button
                  onClick={handleOrder}
                  disabled={orderLoading || listing.status !== 'active'}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {orderLoading ? 'Processing...' : 'Buy Now'}
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Total: {(quantity * listing.price).toFixed(2)} ETB
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
