'use client';

import React, { useState } from 'react';
import { useApiData } from '@/hooks/useApiData';
import { LoadingSpinner, CardSkeleton } from '@/components/LoadingComponents';
import { apiFetch } from '@/lib/api-fetch';
import { useToast } from '@/components/Toast';

interface PerformanceMetrics {
  responseTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  activeConnections: number;
}

interface SystemHealth {
  totalMemory: number;
  freeMemory: number;
  usedMemory: number;
  maxMemory: number;
  availableProcessors: number;
  timestamp: number;
}

export default function PerformanceDashboard() {
  const { data: metrics, isLoading: metricsLoading } = useApiData<PerformanceMetrics>('/performance/metrics');
  const { data: health, isLoading: healthLoading } = useApiData<SystemHealth>('/performance/health');
  const { data: dashboardData, isLoading: dashboardLoading } = useApiData<any>('/performance/dashboard');

  const [cacheWarming, setCacheWarming] = useState(false);
  const [memoryOptimizing, setMemoryOptimizing] = useState(false);
  const { toast } = useToast();

  const handleWarmUpCache = async () => {
    setCacheWarming(true);
    try {
      const response = await apiFetch('/api/performance/cache/warmup', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed');
      await response.json();
      toast('Cache warmed up successfully', 'success');
    } catch {
      toast('Cache warmup failed', 'error');
    } finally {
      setCacheWarming(false);
    }
  };

  const handleOptimizeMemory = async () => {
    setMemoryOptimizing(true);
    try {
      const response = await apiFetch('/api/performance/memory/optimize', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed');
      await response.json();
      toast('Memory optimized successfully', 'success');
    } catch {
      toast('Memory optimization failed', 'error');
    } finally {
      setMemoryOptimizing(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPerformanceStatus = (responseTime: number) => {
    if (responseTime < 100) return { status: 'excellent', color: 'green' };
    if (responseTime < 300) return { status: 'good', color: 'blue' };
    if (responseTime < 500) return { status: 'fair', color: 'yellow' };
    return { status: 'poor', color: 'red' };
  };

  if (metricsLoading || healthLoading || dashboardLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Performance Dashboard</h1>
          <p className="text-gray-600">Loading performance metrics...</p>
        </div>
        <CardSkeleton count={6} />
      </div>
    );
  }

  const performanceStatus = metrics ? getPerformanceStatus(metrics.responseTime) : null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Dashboard</h1>
          <p className="text-gray-600">Monitor system performance and optimize resources</p>
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={handleWarmUpCache}
            disabled={cacheWarming}
            className="bg-violet-600 hover:bg-gold-600 disabled:bg-violet-400 text-white px-4 py-2 rounded-control transition-colors flex items-center"
          >
            {cacheWarming && <LoadingSpinner size="sm" color="white" />}
            <span className={cacheWarming ? 'ml-2' : ''}>Warm Cache</span>
          </button>
          
          <button
            onClick={handleOptimizeMemory}
            disabled={memoryOptimizing}
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-control transition-colors flex items-center"
          >
            {memoryOptimizing && <LoadingSpinner size="sm" color="white" />}
            <span className={memoryOptimizing ? 'ml-2' : ''}>Optimize Memory</span>
          </button>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Response Time */}
        <div className="bg-white rounded-control shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
              <div className="flex items-center">
                <p className="text-2xl font-bold text-gray-900">
                  {metrics?.responseTime || 0}ms
                </p>
                {performanceStatus && (
                  <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full bg-${performanceStatus.color}-100 text-${performanceStatus.color}-800`}>
                    {performanceStatus.status}
                  </span>
                )}
              </div>
            </div>
            <div className="w-12 h-12 bg-gold-100 rounded-control flex items-center justify-center">
              <span className="text-gold-600 text-xl">⚡</span>
            </div>
          </div>
        </div>

        {/* Cache Hit Rate */}
        <div className="bg-white rounded-control shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cache Hit Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics?.cacheHitRate || 0}%
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-control flex items-center justify-center">
              <span className="text-green-600 text-xl">💾</span>
            </div>
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${metrics?.cacheHitRate || 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Memory Usage */}
        <div className="bg-white rounded-control shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Memory Usage</p>
              <p className="text-2xl font-bold text-gray-900">
                {health ? formatBytes(health.usedMemory) : '0 MB'}
              </p>
              <p className="text-xs text-gray-500">
                of {health ? formatBytes(health.maxMemory) : '0 MB'}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-control flex items-center justify-center">
              <span className="text-purple-600 text-xl">🧠</span>
            </div>
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${health ? (health.usedMemory / health.maxMemory) * 100 : 0}%` 
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Active Connections */}
        <div className="bg-white rounded-control shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Connections</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics?.activeConnections || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-control flex items-center justify-center">
              <span className="text-orange-600 text-xl">🔗</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white rounded-control shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">CPU Cores</p>
            <p className="text-xl font-bold text-gray-900">
              {health?.availableProcessors || 0}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Free Memory</p>
            <p className="text-xl font-bold text-gray-900">
              {health ? formatBytes(health.freeMemory) : '0 MB'}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Total Memory</p>
            <p className="text-xl font-bold text-gray-900">
              {health ? formatBytes(health.totalMemory) : '0 MB'}
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Performance */}
      {dashboardData && (
        <div className="bg-white rounded-control shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Analytics Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-control p-4">
              <h3 className="font-medium text-gray-900 mb-2">Application Analytics</h3>
              <p className="text-sm text-gray-600">
                Last updated: {dashboardData.analytics?.applications?.processedAt ? 
                  new Date(dashboardData.analytics.applications.processedAt).toLocaleTimeString() : 
                  'Never'
                }
              </p>
            </div>
            <div className="bg-gray-50 rounded-control p-4">
              <h3 className="font-medium text-gray-900 mb-2">Job Analytics</h3>
              <p className="text-sm text-gray-600">
                Last updated: {dashboardData.analytics?.jobs?.processedAt ? 
                  new Date(dashboardData.analytics.jobs.processedAt).toLocaleTimeString() : 
                  'Never'
                }
              </p>
            </div>
            <div className="bg-gray-50 rounded-control p-4">
              <h3 className="font-medium text-gray-900 mb-2">Performance Analytics</h3>
              <p className="text-sm text-gray-600">
                Last updated: {dashboardData.analytics?.performance?.processedAt ? 
                  new Date(dashboardData.analytics.performance.processedAt).toLocaleTimeString() : 
                  'Never'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Performance Tips */}
      <div className="bg-gold-50 rounded-control p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Tips</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">✓</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Cache Optimization</p>
              <p className="text-sm text-gray-600">
                Maintain cache hit rates above 70% for optimal performance
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">✓</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Memory Management</p>
              <p className="text-sm text-gray-600">
                Keep memory usage below 80% to avoid performance degradation
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">✓</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Response Time</p>
              <p className="text-sm text-gray-600">
                Target response times below 200ms for best user experience
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">✓</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Regular Maintenance</p>
              <p className="text-sm text-gray-600">
                Schedule regular cache warming and memory optimization
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
