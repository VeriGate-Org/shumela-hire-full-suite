import { tryApi } from '@/services/aiService';
import { CandidateSummaryResult } from '@/types/ai';

export const aiCandidateSummaryService = {
  async summarize(applicationId: string): Promise<CandidateSummaryResult> {
    const data = await tryApi<CandidateSummaryResult>(`/api/ai/candidate-summary/${applicationId}`);
    if (!data) throw new Error('AI service unavailable');
    return data;
  },
};
