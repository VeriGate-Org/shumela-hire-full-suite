import { tryApi } from '@/services/aiService';
import {
  JobDescriptionRequest,
  JobDescriptionResult,
  BiasCheckResult,
} from '@/types/ai';

export const aiJobDescriptionService = {
  async generate(request: JobDescriptionRequest): Promise<JobDescriptionResult> {
    const data = await tryApi<JobDescriptionResult>('/api/ai/job-description/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    if (!data) throw new Error('AI service unavailable');
    return data;
  },

  async checkBias(text: string): Promise<BiasCheckResult> {
    const data = await tryApi<BiasCheckResult>('/api/ai/job-description/check-bias', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
    if (!data) throw new Error('AI service unavailable');
    return data;
  },
};
