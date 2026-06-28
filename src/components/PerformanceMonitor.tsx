'use client';

import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay  
  cls: number | null; // Cumulative Layout Shift
  
  // Other metrics
  fcp: number | null; // First Contentful Paint
  ttfb: number | null; // Time to First Byte
  
  // Navigation timing
  domContentLoaded: number | null;
  loadComplete: number | null;
  
  // Memory usage (if available)
  usedJSHeapSize: number | null;
  totalJSHeapSize: number | null;
}

export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    domContentLoaded: null,
    loadComplete: null,
    usedJSHeapSize: null,
    totalJSHeapSize: null,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const observers: PerformanceObserver[] = [];

    // Function to collect and report metrics
    const collectMetrics = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      if (navigation) {
        setMetrics(prev => ({
          ...prev,
          ttfb: navigation.responseStart - navigation.requestStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        }));
      }

      // Memory usage (if available)
      if ((performance as any).memory) {
        const memory = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
        }));
      }
    };

    // Collect basic metrics immediately
    collectMetrics();

    // Core Web Vitals using PerformanceObserver
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          setMetrics(prev => ({ ...prev, lcp: lastEntry.startTime }));
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        observers.push(lcpObserver);
      } catch {
        // LCP monitoring not supported
      }

      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            setMetrics(prev => ({ ...prev, fid: entry.processingStart - entry.startTime }));
          });
        });
        fidObserver.observe({ type: 'first-input', buffered: true });
        observers.push(fidObserver);
      } catch {
        // FID monitoring not supported
      }

      // Cumulative Layout Shift
      try {
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          list.getEntries().forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          setMetrics(prev => ({ ...prev, cls: clsValue }));
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
        observers.push(clsObserver);
      } catch {
        // CLS monitoring not supported
      }

      // First Contentful Paint
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (entry.name === 'first-contentful-paint') {
              setMetrics(prev => ({ ...prev, fcp: entry.startTime }));
            }
          });
        });
        fcpObserver.observe({ type: 'paint', buffered: true });
        observers.push(fcpObserver);
      } catch {
        // FCP monitoring not supported
      }
    }

    // Cleanup: disconnect all observers
    return () => {
      observers.forEach(observer => observer.disconnect());
    };
  }, []); // No dependencies — observers are set up once

  return metrics;
}

// Component to display performance metrics (dev only)
export function PerformanceMonitor() {
  const metrics = usePerformanceMonitoring();
  
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white text-xs p-3 rounded-control max-w-xs">
      <h4 className="font-bold mb-2">Performance Metrics</h4>
      <div className="space-y-1">
        {metrics.lcp && (
          <div className={`${metrics.lcp > 2500 ? 'text-red-400' : metrics.lcp > 1200 ? 'text-yellow-400' : 'text-green-400'}`}>
            LCP: {Math.round(metrics.lcp)}ms
          </div>
        )}
        {metrics.fid && (
          <div className={`${metrics.fid > 100 ? 'text-red-400' : metrics.fid > 25 ? 'text-yellow-400' : 'text-green-400'}`}>
            FID: {Math.round(metrics.fid)}ms
          </div>
        )}
        {metrics.cls !== null && (
          <div className={`${metrics.cls > 0.25 ? 'text-red-400' : metrics.cls > 0.1 ? 'text-yellow-400' : 'text-green-400'}`}>
            CLS: {metrics.cls.toFixed(3)}
          </div>
        )}
        {metrics.fcp && (
          <div>FCP: {Math.round(metrics.fcp)}ms</div>
        )}
        {metrics.ttfb && (
          <div>TTFB: {Math.round(metrics.ttfb)}ms</div>
        )}
        {metrics.usedJSHeapSize && (
          <div>Memory: {Math.round(metrics.usedJSHeapSize / 1024 / 1024)}MB</div>
        )}
      </div>
    </div>
  );
}

// Hook to report performance to analytics
export function usePerformanceReporting() {
  usePerformanceMonitoring();
  // Performance reporting can be wired to a real analytics backend when available
}
