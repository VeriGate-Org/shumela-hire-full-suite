'use client';

import React from 'react';
import Link from 'next/link';

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  const cachedPages = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Applications', href: '/applications', icon: '📝' },
    { name: 'Interviews', href: '/interviews', icon: '🎤' },
    { name: 'Analytics', href: '/analytics', icon: '📈' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-control shadow-lg p-8 text-center">
        {/* Offline icon */}
        <div className="w-20 h-20 mx-auto mb-6 bg-orange-100 rounded-full flex items-center justify-center">
          <span className="text-4xl">📱</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          You&apos;re Offline
        </h1>

        {/* Description */}
                <p className="text-gray-600 mb-6">
          You&apos;re currently offline. Some features may be limited, but you can still:
        </p>

        {/* Connection status */}
        <div className="flex items-center justify-center space-x-2 mb-6">
          <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-orange-600 font-medium">Offline Mode</span>
        </div>

        {/* Retry button */}
        <button
          onClick={handleRetry}
          className="w-full bg-gold-500 text-violet-950 py-3 px-4 rounded-control font-medium hover:bg-gold-600 transition-colors mb-6"
        >
          Try Again
        </button>

        {/* Available cached pages */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">
            Available Pages (Cached)
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {cachedPages.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className="flex flex-col items-center p-3 bg-gray-50 rounded-control hover:bg-gray-100 transition-colors"
              >
                <span className="text-2xl mb-2">{page.icon}</span>
                <span className="text-sm font-medium text-gray-700">
                  {page.name}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Offline features notice */}
        <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-control">
          <h4 className="text-sm font-medium text-orange-800 mb-2">
            Offline Features Available:
          </h4>
          <ul className="text-xs text-orange-700 space-y-1 text-left">
            <li>• View cached application data</li>
            <li>• Browse saved reports</li>
            <li>• Access interview schedules</li>
            <li>• Queue actions for later sync</li>
          </ul>
        </div>

        {/* Tips */}
        <div className="mt-4 text-xs text-gray-500 text-left">
          <p className="mb-2">💡 Tips for offline use:</p>
          <ul className="space-y-1 pl-4">
            <li>• Your actions will be saved and synced when online</li>
            <li>• Cached data may be up to 24 hours old</li>
            <li>• Check your internet connection and try again</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
