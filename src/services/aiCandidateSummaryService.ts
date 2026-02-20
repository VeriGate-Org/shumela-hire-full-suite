import { tryApi } from '@/services/aiService';
import { CandidateSummaryResult } from '@/types/ai';

const mockSummary: any = {}; // TODO: Remove mock fallback

export const aiCandidateSummaryService = {
  async summarize(applicationId: string): Promise<CandidateSummaryResult> {
    const data = await tryApi<CandidateSummaryResult>(`/api/ai/candidate-summary/${applicationId}`);
    return data ?? mockSummary;
  },
};
