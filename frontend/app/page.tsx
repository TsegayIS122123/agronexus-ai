"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  FaGithub,
  FaLinkedin,
  FaFacebook,
  FaInstagram,
  FaWhatsapp,
  FaTelegramPlane,
} from "react-icons/fa";

import { FaXTwitter } from "react-icons/fa6";
import { MdEmail } from "react-icons/md";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('farmer');

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      if (token && userData) {
        setIsLoggedIn(true);
        try {
          const user = JSON.parse(userData);
          const role = (user.role || 'farmer').toLowerCase();
          setUserRole(role);
        } catch (e) {
          setUserRole('farmer');
        }
      } else {
        setIsLoggedIn(false);
      }
    };

    // Check on mount
    checkAuth();

    // Re-check when page becomes visible again (after logout/refresh)
    window.addEventListener('focus', checkAuth);

    return () => {
      window.removeEventListener('focus', checkAuth);
    };
  }, []);

  return (
    <div className="min-h-screen">
      {/* ========== HEADER ========== */}
      <header className="bg-gray-700 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">🌾</span>
              <span className="text-xl font-bold text-white">AgroNexus AI</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-white hover:text-gray-300 transition font-medium">
                Home
              </Link>
              <Link href="/about" className="text-white hover:text-gray-300 transition font-medium">
                About
              </Link>
              <div className="relative group">
                <button className="text-white hover:text-gray-300 transition font-medium flex items-center gap-1">
                  Solutions
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {/* Fixed dropdown with pt-2 to bridge gap */}
                <div className="absolute left-0 pt-2 w-56 bg-white rounded-lg shadow-lg py-2 hidden group-hover:block">
                  <Link href="/solutions/farmers" className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50">
                    🌾 For Farmers
                  </Link>
                  <Link href="/solutions/processors" className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50">
                    🏭 For Processors
                  </Link>
                  <Link href="/solutions/consumers" className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50">
                    🛒 For Consumers
                  </Link>
                </div>
              </div>
              <Link href="/marketplace" className="text-white hover:text-gray-300 transition font-medium">
                Marketplace
              </Link>
              <Link href="/contact" className="text-white hover:text-gray-300 transition font-medium">
                Contact
              </Link>
            </nav>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="hidden md:block">
                <input
                  type="text"
                  placeholder="Search..."
                  className="px-3 py-1 rounded-lg text-sm bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Language */}
              <select className="text-sm rounded-lg px-2 py-1 bg-gray-700 text-white border border-gray-600">
                <option value="en" className="text-white-900">EN</option>
                <option value="am" className="text-white-900">አማ</option>
                <option value="om" className="text-white-900">OR</option>
                <option value="ti" className="text-white-900">ትግ</option>
              </select>

              {/* Auth buttons */}
              {isLoggedIn ? (
                <Link
                  href={`/${userRole}/dashboard`}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-medium"
                >
                  Dashboard
                </Link>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    href="/auth/login"
                    className="text-gray-300 hover:text-white transition text-sm font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-medium"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ========== HERO SECTION ========== */}
      <section className="bg-gradient-to-br from-green-50 via-white to-green-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Connecting Ethiopian
              <br />
              <span className="text-green-600">Agriculture to Industry</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              AI-powered platform for disease detection, price prediction,
              and direct market access for farmers, processors, and consumers.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/auth/register?role=farmer"
                className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition text-lg font-medium"
              >
                🌾 Join as Farmer
              </Link>
              <Link
                href="/auth/register?role=processor"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition text-lg font-medium"
              >
                🏭 Join as Processor
              </Link>
              <Link
                href="/auth/register?role=consumer"
                className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition text-lg font-medium"
              >
                🛒 Join as Consumer
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How AgroNexus AI Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-xl hover:shadow-lg transition">
              <div className="text-5xl mb-4">🌾</div>
              <h3 className="text-xl font-semibold mb-2">1. Farmers Grow</h3>
              <p className="text-gray-600">
                Farmers grow crops and use AI to detect diseases, predict prices,
                and get expert advice.
              </p>
            </div>
            <div className="text-center p-6 rounded-xl hover:shadow-lg transition">
              <div className="text-5xl mb-4">🏭</div>
              <h3 className="text-xl font-semibold mb-2">2. Processors Transform</h3>
              <p className="text-gray-600">
                Processors buy raw materials, use AI for quality control,
                and manufacture finished products.
              </p>
            </div>
            <div className="text-center p-6 rounded-xl hover:shadow-lg transition">
              <div className="text-5xl mb-4">🛒</div>
              <h3 className="text-xl font-semibold mb-2">3. Consumers Access</h3>
              <p className="text-gray-600">
                Consumers discover and buy local products, supporting
                Ethiopian agriculture and industry.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== STATS ========== */}
      <section className="py-16 bg-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-green-700">1M+</div>
              <div className="text-gray-600">Farmers Empowered</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-700">1,000+</div>
              <div className="text-gray-600">Processors Enabled</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-700">$500M</div>
              <div className="text-gray-600">Import Substitution</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-700">50K+</div>
              <div className="text-gray-600">Jobs Created</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="bg-gray-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-2xl">🌾</span>
                <span className="text-xl font-bold text-green-400">AgroNexus AI</span>
              </div>
              <p className="text-gray-400 text-sm">
                AI Operating System for Ethiopia's Agricultural Value Chain.
                From Soil to Shelf — Powered by AI.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-300 mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/about" className="hover:text-white transition">About Us</Link></li>
                <li><Link href="/solutions" className="hover:text-white transition">Solutions</Link></li>
                <li><Link href="/marketplace" className="hover:text-white transition">Marketplace</Link></li>
                <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-300 mb-3">For Users</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/auth/register?role=farmer" className="hover:text-white transition">Farmers</Link></li>
                <li><Link href="/auth/register?role=processor" className="hover:text-white transition">Processors</Link></li>
                <li><Link href="/auth/register?role=consumer" className="hover:text-white transition">Consumers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-300 mb-3">Connect</h4>

              <div className="flex items-center space-x-4 mb-4 text-2xl">
                <a href="https://github.com/TsegayIS122123" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white hover:scale-110 transition-all duration-300" title="GitHub"><FaGithub /></a>

                <a href="https://www.linkedin.com/in/tsegay-assefa-95a397336" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#0A66C2] hover:scale-110 transition-all duration-300" title="LinkedIn"><FaLinkedin /></a>

                <a href="https://x.com/TsegayAsse64592" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white hover:scale-110 transition-all duration-300" title="X"><FaXTwitter /></a>

                <a href="https://www.facebook.com/tsegay.assefa.942" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#1877F2] hover:scale-110 transition-all duration-300" title="Facebook"><FaFacebook /></a>

                <a href="https://www.instagram.com/tsegay.assefa.942" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500 hover:scale-110 transition-all duration-300" title="Instagram"><FaInstagram /></a>

                <a href="https://wa.me/251979416992" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-green-500 hover:scale-110 transition-all duration-300" title="WhatsApp"><FaWhatsapp /></a>

                <a href="https://t.me/jekibreak" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-sky-500 hover:scale-110 transition-all duration-300" title="Telegram"><FaTelegramPlane /></a>
              </div>

              <p className="flex items-center gap-2 text-gray-400 text-sm">
                <MdEmail className="text-lg" />
                <span>tsegayassefa27@gmail.com</span>
              </p>

              <p className="text-gray-400 text-sm mt-2">
                © 2026 AgroNexus AI. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}