import { tryApi } from '@/services/aiService';
import { CvScreeningResult, CvRankingEntry } from '@/types/ai';

export const aiCvScreeningService = {
  async screenCandidate(applicationId: string, jobRequirements: string[]): Promise<CvScreeningResult> {
    const data = await tryApi<CvScreeningResult>(`/api/ai/cv-screening/screen/${applicationId}`, {
      method: 'POST',
      body: JSON.stringify({ applicationId, jobRequirements }),
    });
    if (!data) throw new Error('AI service unavailable');
    return data;
  },

  async rankCandidates(jobId: string, jobRequirements: string[]): Promise<CvRankingEntry[]> {
    const data = await tryApi<{ rankings: CvRankingEntry[] }>(`/api/ai/cv-screening/rank/${jobId}`, {
      method: 'POST',
      body: JSON.stringify({ jobId, jobRequirements }),
    });
    if (!data) throw new Error('AI service unavailable');
    return data.rankings;
  },
};
