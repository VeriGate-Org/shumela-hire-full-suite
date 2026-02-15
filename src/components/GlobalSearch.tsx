import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import EmptyState from '@/components/EmptyState';

interface SearchResult {
  id: string;
  type: 'application' | 'candidate' | 'job' | 'template' | 'report';
  title: string;
  subtitle: string;
  href: string;
  metadata?: {
    status?: string;
    date?: string;
    priority?: 'high' | 'medium' | 'low';
  };
}

const GlobalSearch: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const focusTrapRef = useFocusTrap(isOpen, () => {
    setIsOpen(false);
    setQuery('');
  });

  // Sample search results data
  const sampleResults: SearchResult[] = [
    {
      id: '1',
      type: 'application',
      title: 'Sarah Johnson - Senior Developer',
      subtitle: 'Applied 2 days ago',
      href: '/applications/1',
      metadata: { status: 'Interview Scheduled', priority: 'high' }
    },
    {
      id: '2',
      type: 'candidate',
      title: 'Michael Chen',
      subtitle: 'Full Stack Developer • 5 years experience',
      href: '/candidates/2',
      metadata: { status: 'Active' }
    },
    {
      id: '3',
      type: 'job',
      title: 'Product Manager - Remote',
      subtitle: '15 applications • Posted last week',
      href: '/jobs/3',
      metadata: { status: 'Active', priority: 'medium' }
    },
    {
      id: '4',
      type: 'template',
      title: 'Senior Developer Interview Template',
      subtitle: 'Technical assessment template',
      href: '/templates/4'
    },
    {
      id: '5',
      type: 'report',
      title: 'Q4 Hiring Analytics Report',
      subtitle: 'Generated yesterday',
      href: '/reports/5',
      metadata: { date: '2024-01-15' }
    }
  ];

  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      return;
    }

    setIsLoading(true);
    // Simulate API call
    const timer = setTimeout(() => {
      const filtered = sampleResults.filter(
        result =>
          result.title.toLowerCase().includes(query.toLowerCase()) ||
          result.subtitle.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
      setIsLoading(false);
      setSelectedIndex(-1);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open search with Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }

      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          setIsOpen(false);
          setQuery('');
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < results.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          if (selectedIndex >= 0 && results[selectedIndex]) {
            window.location.href = results[selectedIndex].href;
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'application': return '📄';
      case 'candidate': return '👤';
      case 'job': return '💼';
      case 'template': return '📋';
      case 'report': return '📊';
      default: return '🔍';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'application': return 'bg-violet-100 text-violet-800';
      case 'candidate': return 'bg-green-100 text-green-800';
      case 'job': return 'bg-purple-100 text-purple-800';
      case 'template': return 'bg-orange-100 text-orange-800';
      case 'report': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        className="hidden md:flex items-center space-x-2 px-3 py-2 text-sm text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
      >
        <span>🔍</span>
        <span>Search...</span>
        <kbd className="inline-flex items-center px-1.5 py-0.5 text-xs font-mono bg-white border border-gray-200 rounded">
          ⌘K
        </kbd>
      </button>

      {/* Mobile Search Button */}
      <button
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        className="md:hidden p-2 text-gray-500 hover:text-gray-700 transition-colors"
      >
        <span className="text-xl">🔍</span>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setIsOpen(false)}
          />

          {/* Search Panel */}
          <div
            ref={focusTrapRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="search-dialog-title"
            className="fixed top-20 left-1/2 transform -translate-x-1/2 w-full max-w-2xl bg-white rounded-lg shadow-2xl z-50 mx-4"
          >
            <h2 id="search-dialog-title" className="sr-only">Search</h2>
            {/* Search Input */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">
                🔍
              </span>
              <input
                ref={inputRef}
                type="text"
                placeholder="Search applications, candidates, jobs..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-lg border-none focus:outline-none focus:ring-0 rounded-t-lg"
              />
              {isLoading && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-violet-500 border-t-transparent"></div>
                </div>
              )}
            </div>

            {/* Search Results */}
            <div
              ref={resultsRef}
              role="listbox"
              className="max-h-96 overflow-y-auto border-t border-gray-200"
            >
              {query.trim() === '' ? (
                <div className="p-6 text-center text-gray-500">
                  <span className="text-4xl mb-4 block">🔍</span>
                  <p className="text-lg mb-2">Quick Search</p>
                  <p className="text-sm">Search for applications, candidates, jobs, and more</p>
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    <kbd className="px-2 py-1 text-xs bg-gray-100 rounded">↑↓</kbd>
                    <span className="text-xs text-gray-400">to navigate</span>
                    <kbd className="px-2 py-1 text-xs bg-gray-100 rounded">↵</kbd>
                    <span className="text-xs text-gray-400">to select</span>
                    <kbd className="px-2 py-1 text-xs bg-gray-100 rounded">esc</kbd>
                    <span className="text-xs text-gray-400">to close</span>
                  </div>
                </div>
              ) : results.length === 0 && !isLoading ? (
                <div className="p-6">
                  <EmptyState
                    icon={MagnifyingGlassIcon}
                    title="No results found"
                    description="Try different keywords or check your spelling"
                  />
                </div>
              ) : (
                <div className="py-2">
                  {results.map((result, index) => (
                    <Link
                      key={result.id}
                      href={result.href}
                      onClick={() => setIsOpen(false)}
                      role="option"
                      aria-selected={index === selectedIndex}
                      className={`block px-4 py-3 hover:bg-gray-50 transition-colors ${
                        index === selectedIndex ? 'bg-violet-50 border-r-2 border-r-violet-500' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <span className="text-lg">{getTypeIcon(result.type)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {result.title}
                            </p>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(result.type)}`}>
                              {result.type}
                            </span>
                            {result.metadata?.priority && (
                              <span className={`text-xs font-medium ${getPriorityColor(result.metadata.priority)}`}>
                                ● {result.metadata.priority}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {result.subtitle}
                          </p>
                          {result.metadata?.status && (
                            <p className="text-xs text-gray-500 mt-1">
                              Status: {result.metadata.status}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>
                  {results.length > 0 && `${results.length} result${results.length === 1 ? '' : 's'}`}
                </span>
                <div className="flex items-center space-x-4">
                  <span>Press <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded">⌘K</kbd> to search</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default GlobalSearch;
