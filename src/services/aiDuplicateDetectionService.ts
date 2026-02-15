import { tryApi } from '@/services/aiService';
import { DuplicateCheckRequest, DuplicateCandidate } from '@/types/ai';

export const aiDuplicateDetectionService = {
  async check(request: DuplicateCheckRequest): Promise<{ duplicates: DuplicateCandidate[]; message: string }> {
    const data = await tryApi<{ duplicates: DuplicateCandidate[]; message: string }>('/api/ai/duplicate-detection/check', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return data ?? { duplicates: [], message: 'No duplicate candidates detected (mock).' };
  },
};
