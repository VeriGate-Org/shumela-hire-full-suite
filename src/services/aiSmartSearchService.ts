import { tryApi } from '@/services/aiService';
import { SmartSearchResult } from '@/types/ai';

const mockResult: any = {}; // TODO: Remove mock fallback

export const aiSmartSearchService = {
  async search(query: string): Promise<SmartSearchResult> {
    const data = await tryApi<SmartSearchResult>('/api/ai/smart-search', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
    return data ?? mockResult;
  },
};
