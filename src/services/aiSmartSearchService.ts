import { tryApi } from '@/services/aiService';
import { SmartSearchResult } from '@/types/ai';

const mockResult: SmartSearchResult = {
  interpretedQuery: 'Find candidates with Java experience applied in the last 30 days',
  parsedFilters: { skills: ['Java'], dateRange: 'LAST_30_DAYS', status: 'ACTIVE' },
  results: [],
  totalResults: 0,
};

export const aiSmartSearchService = {
  async search(query: string): Promise<SmartSearchResult> {
    const data = await tryApi<SmartSearchResult>('/api/ai/smart-search', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
    return data ?? mockResult;
  },
};
