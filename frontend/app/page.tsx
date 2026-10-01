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
  return (
    <div className="min-h-screen">
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
    </div>
  );
}