'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

interface VirtualScrollProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
  loadMore?: () => void;
  hasNextPage?: boolean;
  isLoading?: boolean;
}

export function VirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = '',
  onScroll,
  loadMore,
  hasNextPage = false,
  isLoading = false,
}: VirtualScrollProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);
  
  const visibleRange = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(items.length, start + visibleCount + overscan * 2);
    return { start, end };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setScrollTop(scrollTop);
    onScroll?.(scrollTop);
    
    // Load more when near the bottom
    if (loadMore && hasNextPage && !isLoading) {
      const scrollBottom = scrollTop + containerHeight;
      const threshold = totalHeight - itemHeight * 10; // Load when 10 items from bottom
      
      if (scrollBottom >= threshold) {
        loadMore();
      }
    }
  }, [onScroll, loadMore, hasNextPage, isLoading, containerHeight, totalHeight, itemHeight]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      item,
      index: visibleRange.start + index,
    }));
  }, [items, visibleRange.start, visibleRange.end]);

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map(({ item, index }) => (
            <div key={index} style={{ height: itemHeight }}>
              {renderItem(item, index)}
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full"></div>
              <span className="ml-2 text-gray-600">Loading more...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Hook for intersection observer-based lazy loading
export function useIntersectionObserver(
  ref: React.RefObject<HTMLElement | null>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasBeenSeen, setHasBeenSeen] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasBeenSeen) {
          setHasBeenSeen(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [ref, options, hasBeenSeen]);

  return { isIntersecting, hasBeenSeen };
}

// Lazy loading component
interface LazyComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  once?: boolean;
}

export function LazyComponent({ 
  children, 
  fallback = <div className="h-32 bg-gray-100 animate-pulse rounded"></div>, 
  className = '',
  once = true 
}: LazyComponentProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { isIntersecting, hasBeenSeen } = useIntersectionObserver(ref);

  const shouldRender = once ? hasBeenSeen : isIntersecting;

  return (
    <div ref={ref} className={className}>
      {shouldRender ? children : fallback}
    </div>
  );
}

// Infinite scroll hook
interface UseInfiniteScrollOptions<T> {
  fetchMore: (page: number) => Promise<T[]>;
  initialData?: T[];
  pageSize?: number;
  threshold?: number;
}

export function useInfiniteScroll<T>({
  fetchMore,
  initialData = [],
  pageSize = 20,
  threshold = 5,
}: UseInfiniteScrollOptions<T>) {
  const [items, setItems] = useState<T[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentPage = useRef(1);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasNextPage) return;

    setIsLoading(true);
    setError(null);

    try {
      const newItems = await fetchMore(currentPage.current);
      
      if (newItems.length === 0 || newItems.length < pageSize) {
        setHasNextPage(false);
      }

      setItems(prev => [...prev, ...newItems]);
      currentPage.current += 1;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more items');
    } finally {
      setIsLoading(false);
    }
  }, [fetchMore, isLoading, hasNextPage, pageSize]);

  const reset = useCallback(() => {
    setItems(initialData);
    setHasNextPage(true);
    setError(null);
    currentPage.current = 1;
  }, [initialData]);

  return {
    items,
    isLoading,
    hasNextPage,
    error,
    loadMore,
    reset,
  };
}

// Optimized list component with virtual scrolling
interface OptimizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight?: number;
  maxHeight?: number;
  className?: string;
  emptyMessage?: string;
  loadMore?: () => void;
  hasNextPage?: boolean;
  isLoading?: boolean;
}

export function OptimizedList<T>({
  items,
  renderItem,
  itemHeight = 80,
  maxHeight = 400,
  className = '',
  emptyMessage = 'No items found',
  loadMore,
  hasNextPage = false,
  isLoading = false,
}: OptimizedListProps<T>) {
  if (items.length === 0 && !isLoading) {
    return (
      <div role="status" aria-live="polite" className={`flex items-center justify-center py-8 text-gray-500 ${className}`}>
        {emptyMessage}
      </div>
    );
  }

  // Use virtual scrolling for large lists
  if (items.length > 50) {
    return (
      <VirtualScroll
        items={items}
        itemHeight={itemHeight}
        containerHeight={maxHeight}
        renderItem={renderItem}
        className={className}
        loadMore={loadMore}
        hasNextPage={hasNextPage}
        isLoading={isLoading}
      />
    );
  }

  // Regular rendering for smaller lists
  return (
    <div className={`space-y-2 ${className}`} style={{ maxHeight, overflowY: 'auto' }}>
      {items.map((item, index) => (
        <div key={index}>
          {renderItem(item, index)}
        </div>
      ))}
      {isLoading && (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full"></div>
          <span className="ml-2 text-gray-600">Loading more...</span>
        </div>
      )}
    </div>
  );
}
