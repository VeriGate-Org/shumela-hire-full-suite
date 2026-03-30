import { SWRConfiguration } from 'swr';

// NEXT_PUBLIC_API_URL must be set at build time for static export.
// Falls back to localhost:8080 for local development only.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

async function getAuthToken(): Promise<string | null> {
  try {
    const { fetchAuthSession } = await import('aws-amplify/auth');
    const session = await fetchAuthSession({ forceRefresh: false });
    return session.tokens?.accessToken?.toString() || null;
  } catch {
    // Cognito not configured or no session
  }
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('jwt_token');
  }
  return null;
}

// Resolve a URL: relative paths like /api/foo go to the backend base URL
function resolveUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${API_BASE_URL}${url}`;
}

// Default fetcher function with auth headers and error handling
export const fetcher = async (url: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = await getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(resolveUrl(url), { headers });

  if (!response.ok) {
    const error = new Error('Failed to fetch');
    try {
      (error as any).info = await response.json();
    } catch {
      (error as any).info = { message: response.statusText };
    }
    (error as any).status = response.status;
    throw error;
  }

  return response.json();
};

// Optimized SWR configuration
export const swrConfig: SWRConfiguration = {
  fetcher,
  // Cache configuration
  dedupingInterval: 2000, // Dedupe requests within 2 seconds
  focusThrottleInterval: 5000, // Throttle revalidation on window focus
  
  // Background revalidation
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  revalidateIfStale: true,
  
  // Error handling
  shouldRetryOnError: true,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  
  // Performance optimizations
  refreshInterval: 30000, // 30 seconds for frequently changing data
  refreshWhenHidden: false, // Don't refresh when tab is hidden
  refreshWhenOffline: false, // Don't refresh when offline
  
  // Loading states
  loadingTimeout: 3000, // Show loading state after 3 seconds
  
  // Cache provider for better performance
  provider: () => new Map(),
  
  // Global error handler
  onError: (error, key) => {
    console.error('SWR Error:', error, 'Key:', key);
    
    // Report to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Analytics service integration would go here
    }
  },
  
  // Global success handler
  onSuccess: (data, key, _config) => {
    // Optional: Log successful requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log('SWR Success:', key, 'Data length:', JSON.stringify(data).length);
    }
  },
  
  // Global loading state handler
  onLoadingSlow: (key, _config) => {
    console.warn('SWR Loading Slow:', key);
  },
};

// Specialized configurations for different data types
export const fastUpdateConfig: SWRConfiguration = {
  ...swrConfig,
  refreshInterval: 5000, // 5 seconds for real-time data
  dedupingInterval: 1000,
};

export const slowUpdateConfig: SWRConfiguration = {
  ...swrConfig,
  refreshInterval: 300000, // 5 minutes for static data
  dedupingInterval: 10000,
};

export const criticalConfig: SWRConfiguration = {
  ...swrConfig,
  errorRetryCount: 5,
  errorRetryInterval: 2000,
  refreshInterval: 10000,
};

// Custom hooks for different use cases
export const useRealtimeData = (key: string) => {
  // For data that changes frequently (notifications, live updates)
  return { key, config: fastUpdateConfig };
};

export const useStaticData = (key: string) => {
  // For data that rarely changes (user profile, settings)
  return { key, config: slowUpdateConfig };
};

export const useCriticalData = (key: string) => {
  // For critical business data (applications, interviews)
  return { key, config: criticalConfig };
};

// Cache utilities
export const swrCache = {
  // Preload data
  preload: (key: string) => {
    return fetcher(key);
  },
  
  // Clear specific cache
  clear: (key: string) => {
    // This would be implemented with SWR's mutate function
    console.log('Clearing cache for:', key);
  },
  
  // Clear all cache
  clearAll: () => {
    // This would be implemented with SWR's cache clearing
    console.log('Clearing all SWR cache');
  },
};

// Performance monitoring utilities
export const performanceUtils = {
  // Measure fetch performance
  measureFetch: async (key: string, fetchFn: () => Promise<any>) => {
    const startTime = performance.now();
    
    try {
      const result = await fetchFn();
      const endTime = performance.now();
      
      console.log(`Fetch performance for ${key}: ${endTime - startTime} milliseconds`);
      
      // Report to analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'fetch_performance', {
          event_category: 'Performance',
          event_label: key,
          value: Math.round(endTime - startTime),
        });
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      console.error(`Fetch error for ${key} after ${endTime - startTime}ms:`, error);
      throw error;
    }
  },
};
