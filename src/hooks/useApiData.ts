'use client';

import useSWR, { SWRConfiguration, mutate } from 'swr';
import useSWRInfinite from 'swr/infinite';
import { useCallback, useMemo } from 'react';
import { fetcher, swrConfig } from '@/lib/swr-config';

// Generic API response type
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

// Paginated response type
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  success: boolean;
}

// Base hook for fetching data with SWR
export function useApiData<T>(
  endpoint: string | null,
  config?: SWRConfiguration
) {
  const { data, error, isLoading, mutate: mutateFn } = useSWR<ApiResponse<T>>(
    endpoint ? `/api${endpoint}` : null,
    fetcher,
    { ...swrConfig, ...config }
  );

  return {
    data: data?.data,
    error,
    isLoading,
    isError: !!error,
    mutate: mutateFn,
    refresh: () => mutateFn(),
  };
}

// Hook for paginated data
export function usePaginatedData<T>(
  endpoint: string,
  config?: SWRConfiguration
) {
  const getKey = useCallback((pageIndex: number, previousPageData: PaginatedResponse<T> | null) => {
    // If we've reached the end, return null
    if (previousPageData && !previousPageData.pagination.hasNextPage) return null;
    
    // First page
    if (pageIndex === 0) return `/api${endpoint}?page=1`;
    
    // Next pages
    return `/api${endpoint}?page=${pageIndex + 1}`;
  }, [endpoint]);

  const {
    data,
    error,
    isLoading,
    isValidating: _isValidating,
    mutate: mutateFn,
    size,
    setSize,
  } = useSWRInfinite<PaginatedResponse<T>>(
    getKey,
    fetcher,
    { ...swrConfig, ...config }
  );

  const flatData = useMemo(
    () => data?.flatMap(page => page.data) ?? [],
    [data]
  );

  const totalItems = data?.[0]?.pagination?.totalItems ?? 0;
  const hasNextPage = data?.[data.length - 1]?.pagination?.hasNextPage ?? false;
  const isLoadingMore = isLoading || (size > 0 && data && typeof data[size - 1] === 'undefined');

  const loadMore = useCallback(() => {
    if (hasNextPage && !isLoadingMore) {
      setSize(size + 1);
    }
  }, [hasNextPage, isLoadingMore, setSize, size]);

  return {
    data: flatData,
    error,
    isLoading: isLoading && size === 1,
    isLoadingMore,
    isError: !!error,
    hasNextPage,
    totalItems,
    loadMore,
    mutate: mutateFn,
    refresh: () => mutateFn(),
  };
}

// Specific hooks for different entities
export function useApplications(config?: SWRConfiguration) {
  return useApiData<any[]>('/applications', config);
}

export function useApplication(id: string | number, config?: SWRConfiguration) {
  return useApiData<any>(`/applications/${id}`, config);
}

export function useJobs(config?: SWRConfiguration) {
  return usePaginatedData('/ads', config);
}

export function useJob(id: string, config?: SWRConfiguration) {
  return useApiData<any>(`/ads/${id}`, config);
}

export function useApplicants(config?: SWRConfiguration) {
  return usePaginatedData('/applicants', config);
}

export function useInterviews(config?: SWRConfiguration) {
  return useApiData<any[]>('/interviews', config);
}

export function useReports(config?: SWRConfiguration) {
  return useApiData<any>('/reports', config);
}

export function useAnalytics(type: string, config?: SWRConfiguration) {
  return useApiData<any>(`/analytics/${type}`, config);
}

// Real-time data hooks with shorter refresh intervals
export function useNotifications() {
  return useApiData<any[]>('/notifications', {
    refreshInterval: 5000, // 5 seconds for real-time updates
    dedupingInterval: 1000,
  });
}

export function useRealtimeMetrics() {
  return useApiData<any>('/analytics/realtime', {
    refreshInterval: 10000, // 10 seconds
    revalidateOnFocus: true,
  });
}

// Mutation helpers
export class ApiMutations {
  // Generic mutation helper
  static async mutateEndpoint<T>(
    endpoint: string,
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST',
    data?: any
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Get auth token
    try {
      const { fetchAuthSession } = await import('aws-amplify/auth');
      const session = await fetchAuthSession({ forceRefresh: false });
      const token = session.tokens?.accessToken?.toString();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    } catch {
      // Cognito not configured — try session storage
      if (typeof window !== 'undefined') {
        const token = sessionStorage.getItem('jwt_token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(`/api${endpoint}`, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Application mutations
  static async createApplication(data: any) {
    const result = await this.mutateEndpoint('/applications', 'POST', data);
    // Revalidate related data
    mutate('/api/applications');
    mutate('/api/analytics/applications');
    return result;
  }

  static async updateApplication(id: string | number, data: any) {
    const result = await this.mutateEndpoint(`/applications/${id}`, 'PUT', data);
    // Revalidate related data
    mutate(`/api/applications/${id}`);
    mutate('/api/applications');
    return result;
  }

  static async deleteApplication(id: string | number) {
    const result = await this.mutateEndpoint(`/applications/${id}`, 'DELETE');
    // Revalidate related data
    mutate('/api/applications');
    return result;
  }

  // Job mutations
  static async createJob(data: any) {
    const result = await this.mutateEndpoint('/job-ads', 'POST', data);
    mutate('/api/job-ads');
    return result;
  }

  static async updateJob(id: string, data: any) {
    const result = await this.mutateEndpoint(`/job-ads/${id}`, 'PUT', data);
    mutate(`/api/job-ads/${id}`);
    mutate('/api/job-ads');
    return result;
  }

  static async publishJob(id: string) {
    const result = await this.mutateEndpoint(`/job-ads/${id}/publish`, 'POST');
    mutate(`/api/job-ads/${id}`);
    mutate('/api/job-ads');
    return result;
  }

  // Interview mutations
  static async scheduleInterview(data: any) {
    const result = await this.mutateEndpoint('/interviews', 'POST', data);
    mutate('/api/interviews');
    return result;
  }

  static async updateInterview(id: string, data: any) {
    const result = await this.mutateEndpoint(`/interviews/${id}`, 'PUT', data);
    mutate(`/api/interviews/${id}`);
    mutate('/api/interviews');
    return result;
  }
}

// Cache management utilities
export class CacheManager {
  // Clear all cache
  static clearAll() {
    mutate(() => true, undefined, { revalidate: false });
  }

  // Clear specific endpoint cache
  static clear(endpoint: string) {
    mutate(`/api${endpoint}`, undefined, { revalidate: false });
  }

  // Refresh specific endpoint
  static refresh(endpoint: string) {
    mutate(`/api${endpoint}`);
  }

  // Preload data
  static async preload(endpoint: string) {
    return mutate(`/api${endpoint}`, fetcher(`/api${endpoint}`));
  }

  // Optimistic update
  static optimisticUpdate<T>(endpoint: string, data: T) {
    mutate(`/api${endpoint}`, data, { revalidate: false });
  }
}

// Custom hook for optimistic updates
export function useOptimisticUpdate<T>() {
  const update = useCallback((endpoint: string, data: T, shouldRevalidate = true) => {
    mutate(`/api${endpoint}`, data, { revalidate: shouldRevalidate });
  }, []);

  return { update };
}

// Utility for managing loading states across multiple endpoints using SWR directly.
// Note: This is not a hook that calls other hooks dynamically — it uses SWR's mutate
// to refresh endpoints and fetches data independently.
export function useMultipleRequests(endpoints: string[]) {
  const key = endpoints.join(',');

  const { data, error, isLoading, mutate: mutateFn } = useSWR<Record<string, ApiResponse<unknown>>>(
    key ? `multi:${key}` : null,
    async () => {
      const results: Record<string, ApiResponse<unknown>> = {};
      await Promise.all(
        endpoints.map(async (endpoint) => {
          try {
            results[endpoint] = await fetcher(`/api${endpoint}`);
          } catch (err) {
            results[endpoint] = { data: null, success: false, error: String(err) };
          }
        })
      );
      return results;
    },
    swrConfig
  );

  const refresh = useCallback(() => {
    mutateFn();
  }, [mutateFn]);

  return {
    data,
    isLoading,
    isError: !!error,
    errors: error ? [error] : [],
    refresh,
  };
}
