"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

interface Order {
  id: string;
  listing_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: string;
  created_at: string;
  confirmed_at: string | null;
  delivered_at: string | null;
}

export default function Orders() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('buyer'); // buyer or seller

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }
    const parsed = JSON.parse(userData);
    setUser(parsed);
    fetchOrders('buyer');
  }, []);

  const fetchOrders = async (orderRole: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/v1/marketplace/orders?role=${orderRole}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setOrders(response.data.data.orders);
        setRole(orderRole);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`/api/v1/marketplace/orders/${orderId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        fetchOrders(role);
      }
    } catch (err) {
      console.error('Failed to update order:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-700',
      'confirmed': 'bg-blue-100 text-blue-700',
      'processing': 'bg-purple-100 text-purple-700',
      'shipped': 'bg-indigo-100 text-indigo-700',
      'delivered': 'bg-green-100 text-green-700',
      'cancelled': 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-purple-900 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">📋</span>
              <h1 className="text-xl font-bold text-white">AgroNexus Orders</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/marketplace" className="text-white hover:text-gray-300 transition text-sm">
                Marketplace
              </Link>
              <Link href="/marketplace/listings/new" className="text-white hover:text-gray-300 transition text-sm">
                + New Listing
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
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">📋 My Orders</h2>
            <p className="text-gray-600">Track your marketplace orders</p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <button
              onClick={() => fetchOrders('buyer')}
              className={`px-4 py-2 rounded-lg transition ${
                role === 'buyer' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              As Buyer
            </button>
            <button
              onClick={() => fetchOrders('seller')}
              className={`px-4 py-2 rounded-lg transition ${
                role === 'seller' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              As Seller
            </button>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-600">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-4xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-900">No Orders Found</h3>
            <p className="text-gray-500">Start buying or selling on the marketplace</p>
            <Link href="/marketplace" className="inline-block mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition">
              Browse Marketplace
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <span className="text-sm text-gray-500">Order #{order.id.slice(0, 8)}</span>
                    </div>
                    <div className="mt-2">
                      <p className="text-lg font-semibold text-gray-900">
                        {order.quantity} units × {order.unit_price} ETB
                      </p>
                      <p className="text-sm text-gray-500">
                        Total: <span className="font-bold text-purple-600">{order.total_price} ETB</span>
                      </p>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
                    {/* Status-specific actions */}
                    {order.status === 'pending' && role === 'seller' && (
                      <>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'confirmed')}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'cancelled')}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm"
                        >
                          Cancel
                        </button>
                      </>
                    )}

                    {order.status === 'confirmed' && role === 'seller' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'processing')}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm"
                      >
                        Start Processing
                      </button>
                    )}

                    {order.status === 'processing' && role === 'seller' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'shipped')}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm"
                      >
                        Mark Shipped
                      </button>
                    )}

                    {order.status === 'shipped' && role === 'buyer' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'delivered')}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm"
                      >
                        Confirm Delivery
                      </button>
                    )}

                    {order.status === 'delivered' && (
                      <span className="text-green-600 font-medium text-sm flex items-center">
                        ✅ Delivered
                      </span>
                    )}

                    {order.status === 'cancelled' && (
                      <span className="text-red-600 font-medium text-sm">❌ Cancelled</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
