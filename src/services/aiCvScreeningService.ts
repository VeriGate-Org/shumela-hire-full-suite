import { tryApi } from '@/services/aiService';
import { CvScreeningResult, CvRankingEntry } from '@/types/ai';

const mockScreeningResult: any = {}; // TODO: Remove mock fallback

const mockRankingResult: any[] = []; // TODO: Remove mock fallback

export const aiCvScreeningService = {
  async screenCandidate(applicationId: string, jobRequirements: string[]): Promise<CvScreeningResult> {
    const data = await tryApi<CvScreeningResult>(`/api/ai/cv-screening/screen/${applicationId}`, {
      method: 'POST',
      body: JSON.stringify({ applicationId, jobRequirements }),
    });
    return data ?? mockScreeningResult;
  },

  async rankCandidates(jobId: string, jobRequirements: string[]): Promise<CvRankingEntry[]> {
    const data = await tryApi<{ rankings: CvRankingEntry[] }>(`/api/ai/cv-screening/rank/${jobId}`, {
      method: 'POST',
      body: JSON.stringify({ jobId, jobRequirements }),
    });
    return data?.rankings ?? mockRankingResult;
  },
};
