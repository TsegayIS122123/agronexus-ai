"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Solutions() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/');
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">🌾</div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
