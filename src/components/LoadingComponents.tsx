'use client';

import React from 'react';

// Skeleton loading components
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full">
      <div className="animate-pulse">
        {/* Table header */}
        <div className="grid grid-cols-4 gap-4 p-4 border-b">
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded"></div>
          ))}
        </div>
        
        {/* Table rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-4 gap-4 p-4 border-b border-gray-100">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={colIndex} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-sm shadow p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 bg-white rounded-sm shadow animate-pulse">
          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
          <div className="w-20 h-8 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="bg-white rounded-sm shadow p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded mb-6"></div>
      
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div className="h-4 bg-gray-200 rounded mb-2 w-24"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        ))}
        
        <div className="flex justify-end space-x-4 mt-6">
          <div className="w-20 h-10 bg-gray-200 rounded"></div>
          <div className="w-20 h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4 w-64"></div>
        <div className="h-4 bg-gray-200 rounded w-96"></div>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-sm shadow p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded mt-4 w-16"></div>
            <div className="h-3 bg-gray-200 rounded mt-2 w-24"></div>
          </div>
        ))}
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-sm shadow p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-32"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
        <div className="bg-white rounded-sm shadow p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-32"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}

// Loading spinner component
export function LoadingSpinner({ size = 'md', color = 'blue' }: { 
  size?: 'sm' | 'md' | 'lg'; 
  color?: 'blue' | 'gray' | 'white'; 
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };
  
  const colorClasses = {
    blue: 'text-gold-600',
    gray: 'text-gray-400',
    white: 'text-white'
  };
  
  return (
    <div className="flex justify-center items-center">
      <div className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`}>
        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24">
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          ></circle>
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
    </div>
  );
}

// Page loading wrapper
export function PageLoading({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">{message}</p>
      </div>
    </div>
  );
}

// Inline loading state
export function InlineLoading({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-8">
      <LoadingSpinner />
      <span className="ml-3 text-gray-600">{message}</span>
    </div>
  );
}

// Button loading state
export function LoadingButton({ 
  children, 
  loading = false, 
  disabled = false,
  ...props 
}: { 
  children: React.ReactNode; 
  loading?: boolean; 
  disabled?: boolean;
  [key: string]: any;
}) {
  return (
    <button 
      disabled={loading || disabled}
      className={`inline-flex items-center justify-center ${
        loading || disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${props.className || ''}`}
      {...props}
    >
      {loading && <LoadingSpinner size="sm" color="white" />}
      <span className={loading ? 'ml-2' : ''}>{children}</span>
    </button>
  );
}

// Error boundary fallback
export function ErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
        <p className="text-gray-600 mb-6">
          {process.env.NODE_ENV === 'development' ? error.message : 
           'We encountered an error while loading this page. Please try again.'}
        </p>
        <button 
          onClick={resetError}
          className="bg-transparent border-2 border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider px-6 py-2 rounded-sm transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
