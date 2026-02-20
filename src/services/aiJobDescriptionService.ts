import { tryApi } from '@/services/aiService';
import {
  JobDescriptionRequest,
  JobDescriptionResult,
  BiasCheckResult,
} from '@/types/ai';

const mockJobDescription: any = {}; // TODO: Remove mock fallback

export const aiJobDescriptionService = {
  async generate(request: JobDescriptionRequest): Promise<JobDescriptionResult> {
    const data = await tryApi<JobDescriptionResult>('/api/ai/job-description/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return data ?? mockJobDescription;
  },

  async checkBias(text: string): Promise<BiasCheckResult> {
    const data = await tryApi<BiasCheckResult>('/api/ai/job-description/check-bias', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
    return data ?? { biasWarnings: [], overallAssessment: 'No significant bias detected (mock).' };
  },
};
