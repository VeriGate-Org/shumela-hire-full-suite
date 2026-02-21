import { tryApi } from '@/services/aiService';
import { ScreeningNotesRequest, ScreeningNotesResult } from '@/types/ai';

export const aiScreeningNotesService = {
  async draft(request: ScreeningNotesRequest): Promise<ScreeningNotesResult> {
    const data = await tryApi<ScreeningNotesResult>('/api/ai/screening-notes/draft', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    if (!data) throw new Error('AI service unavailable');
    return data;
  },
};
