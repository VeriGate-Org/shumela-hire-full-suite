'use client';

import React, { useState } from 'react';
import { aiSmartSearchService } from '@/services/aiSmartSearchService';
import AiDisclaimer from './AiDisclaimer';
import { SmartSearchResult } from '@/types/ai';

export default function AiSmartSearch() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<SmartSearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await aiSmartSearchService.search(query);
      setResult(data);
    } catch (error) {
      console.error('Smart search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-teal-500" />
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">AI Smart Search</h3>
        <span className="text-[10px] font-medium bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded">AI-generated</span>
      </div>

      <div className="flex gap-2">
        <input type="text" value={query} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          className="flex-1 text-sm p-2.5 border border-gray-300 rounded-md"
          placeholder="e.g. Find senior Java developers who applied in the last month" />
        <button onClick={handleSearch} disabled={loading || !query.trim()}
          className="px-4 py-2 text-sm bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {result && (
        <div className="space-y-3">
          {/* Interpreted query */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="font-medium">Interpreted as:</span>
            <span className="italic">{result.interpretedQuery}</span>
          </div>

          {/* Filter chips */}
          {result.parsedFilters && Object.keys(result.parsedFilters).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(result.parsedFilters).map(([key, value]) => (
                <span key={key} className="inline-flex items-center px-2.5 py-1 bg-violet-50 text-violet-700 text-xs rounded-full border border-violet-200">
                  <span className="font-medium mr-1">{key}:</span>
                  {Array.isArray(value) ? value.join(', ') : String(value)}
                </span>
              ))}
            </div>
          )}

          {/* Results */}
          {result.results && result.results.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">{result.totalResults} result{result.totalResults !== 1 ? 's' : ''} found</p>
              {result.results.map((item, i) => (
                <div key={i} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap">{JSON.stringify(item, null, 2)}</pre>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500">
              {result.totalResults === 0 ? 'No results found. Try adjusting your search query.' : `${result.totalResults} results matched the filters.`}
            </p>
          )}
          <AiDisclaimer level="advisory" />
        </div>
      )}
    </div>
  );
}
