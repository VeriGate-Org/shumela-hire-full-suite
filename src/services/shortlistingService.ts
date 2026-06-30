import { apiFetch } from '@/lib/api-fetch';
import type { ShortlistScore, ShortlistingSummary, ShortlistOverrideRequest } from '@/types/shortlisting';

export const shortlistingService = {
  async calculateScores(jobPostingId: string): Promise<ShortlistScore[]> {
    const response = await apiFetch(`/api/shortlisting/job-postings/${jobPostingId}/calculate`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to calculate shortlisting scores');
    return response.json();
  },

  async autoShortlist(jobPostingId: string, threshold: number): Promise<ShortlistScore[]> {
    const response = await apiFetch(
      `/api/shortlisting/job-postings/${jobPostingId}/auto-shortlist?threshold=${threshold}`,
      { method: 'POST' },
    );
    if (!response.ok) throw new Error('Failed to auto-shortlist candidates');
    return response.json();
  },

  async getSummary(jobPostingId: string): Promise<ShortlistingSummary> {
    const response = await apiFetch(`/api/shortlisting/job-postings/${jobPostingId}/scores`);
    if (!response.ok) throw new Error('Failed to fetch shortlisting summary');
    return response.json();
  },

  async overrideDecision(scoreId: string, request: ShortlistOverrideRequest): Promise<ShortlistScore> {
    const response = await apiFetch(`/api/shortlisting/scores/${scoreId}/override`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error('Failed to override shortlist decision');
    return response.json();
  },
};
