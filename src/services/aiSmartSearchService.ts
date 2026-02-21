import { tryApi } from '@/services/aiService';
import { SmartSearchResult } from '@/types/ai';

export const aiSmartSearchService = {
  async search(query: string): Promise<SmartSearchResult> {
    const data = await tryApi<SmartSearchResult>('/api/ai/smart-search', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
    if (!data) throw new Error('AI service unavailable');
    return data;
  },
};
