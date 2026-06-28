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
            <div key={i} className="h-4 loading-shimmer rounded"></div>
          ))}
        </div>
        
        {/* Table rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-4 gap-4 p-4 border-b border-border">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={colIndex} className="h-4 loading-shimmer rounded"></div>
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
        <div key={i} className="enterprise-card p-6 animate-pulse">
          <div className="h-6 loading-shimmer rounded mb-4"></div>
          <div className="h-4 loading-shimmer rounded mb-2"></div>
          <div className="h-4 loading-shimmer rounded mb-2"></div>
          <div className="h-4 loading-shimmer rounded w-2/3"></div>
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 enterprise-card animate-pulse">
          <div className="w-12 h-12 loading-shimmer rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 loading-shimmer rounded mb-2"></div>
            <div className="h-3 loading-shimmer rounded w-2/3"></div>
          </div>
          <div className="w-20 h-8 loading-shimmer rounded"></div>
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="enterprise-card p-6 animate-pulse">
      <div className="h-6 loading-shimmer rounded mb-6"></div>
      
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div className="h-4 loading-shimmer rounded mb-2 w-24"></div>
            <div className="h-10 loading-shimmer rounded"></div>
          </div>
        ))}
        
        <div className="flex justify-end space-x-4 mt-6">
          <div className="w-20 h-10 loading-shimmer rounded"></div>
          <div className="w-20 h-10 loading-shimmer rounded"></div>
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
        <div className="h-8 loading-shimmer rounded mb-4 w-64"></div>
        <div className="h-4 loading-shimmer rounded w-96"></div>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="enterprise-card p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="h-4 loading-shimmer rounded w-20"></div>
              <div className="w-8 h-8 loading-shimmer rounded"></div>
            </div>
            <div className="h-8 loading-shimmer rounded mt-4 w-16"></div>
            <div className="h-3 loading-shimmer rounded mt-2 w-24"></div>
          </div>
        ))}
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="enterprise-card p-6 animate-pulse">
          <div className="h-6 loading-shimmer rounded mb-4 w-32"></div>
          <div className="h-64 loading-shimmer rounded"></div>
        </div>
        <div className="enterprise-card p-6 animate-pulse">
          <div className="h-6 loading-shimmer rounded mb-4 w-32"></div>
          <div className="h-64 loading-shimmer rounded"></div>
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
    blue: 'text-primary',
    gray: 'text-muted-foreground',
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
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

// Inline loading state
export function InlineLoading({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-8">
      <LoadingSpinner />
      <span className="ml-3 text-muted-foreground">{message}</span>
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

// Kanban pipeline skeleton
export function KanbanSkeleton({ columns = 6, cardsPerColumn = 3 }: { columns?: number; cardsPerColumn?: number }) {
  return (
    <div className="space-y-4">
      {/* Metric cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="enterprise-card p-4 animate-pulse">
            <div className="h-3 loading-shimmer rounded w-24 mb-2" />
            <div className="h-7 loading-shimmer rounded w-16 mb-1" />
            <div className="h-3 loading-shimmer rounded w-20" />
          </div>
        ))}
      </div>

      {/* Filter bar skeleton */}
      <div className="enterprise-card p-4 animate-pulse flex items-center gap-4">
        <div className="h-9 loading-shimmer rounded flex-1 max-w-xs" />
        <div className="h-9 loading-shimmer rounded w-32" />
      </div>

      {/* Kanban columns skeleton */}
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: columns }).map((_, col) => (
          <div key={col} className="min-w-[256px] flex-shrink-0">
            <div className="enterprise-card animate-pulse">
              <div className="p-3 border-b border-border flex items-center justify-between">
                <div className="h-4 loading-shimmer rounded w-20" />
                <div className="h-5 loading-shimmer rounded-full w-8" />
              </div>
              <div className="p-2 space-y-2">
                {Array.from({ length: Math.max(1, cardsPerColumn - col) }).map((_, card) => (
                  <div key={card} className="p-3 rounded border border-border space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 loading-shimmer rounded-full" />
                      <div className="flex-1">
                        <div className="h-3.5 loading-shimmer rounded w-24 mb-1" />
                        <div className="h-3 loading-shimmer rounded w-16" />
                      </div>
                    </div>
                    <div className="h-3 loading-shimmer rounded w-full" />
                    <div className="h-2 loading-shimmer rounded-full w-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Error boundary fallback
export function ErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-foreground mb-4">Something went wrong</h2>
        <p className="text-muted-foreground mb-6">
          {process.env.NODE_ENV === 'development' ? error.message : 
           'We encountered an error while loading this page. Please try again.'}
        </p>
        <button
          onClick={resetError}
          className="btn-primary"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
