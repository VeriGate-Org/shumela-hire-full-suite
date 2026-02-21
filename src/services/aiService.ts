import { AiFeatureStatus } from '@/types/ai';
import { apiFetch } from '@/lib/api-fetch';

export async function tryApi<T>(path: string, options?: RequestInit): Promise<T | null> {
  try {
    const response = await apiFetch(path, options);
    if (response.ok) return response.json();
    if (response.status === 403) {
      console.warn('AI feature access denied');
      return null;
    }
  } catch {
    // API unavailable
  }
  return null;
}

export const aiService = {
  async getStatus(): Promise<AiFeatureStatus> {
    const data = await tryApi<AiFeatureStatus>('/api/ai/status');
    if (!data) throw new Error('AI status unavailable');
    return data;
  },
};
