'use client';

import { useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function TestLoading() {
  const [isLoading, setIsLoading] = useState(false);

  const simulateLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 3000);
  };

  return (
    <div className="min-h-screen bg-charter-navy p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-white">Loading Spinner Test</h1>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Inline Spinner</h2>
          <LoadingSpinner size={48} />
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Different Sizes</h2>
          <div className="flex items-center space-x-4">
            <LoadingSpinner size={24} />
            <LoadingSpinner size={36} />
            <LoadingSpinner size={48} />
            <LoadingSpinner size={64} />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Fullscreen Overlay</h2>
          <button
            onClick={simulateLoading}
            className="px-6 py-3 bg-charter-gold text-white rounded-md hover:bg-charter-gold-hover transition-colors"
          >
            Test Overlay (3s)
          </button>
        </div>

        {isLoading && (
          <div className="fixed inset-0 bg-charter-navy bg-opacity-80 backdrop-blur-sm flex items-center justify-center">
            <LoadingSpinner size={96} />
          </div>
        )}
      </div>
    </div>
  );
} 