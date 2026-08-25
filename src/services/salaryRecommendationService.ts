import {
  SalaryRecommendation,
  SalaryRecommendationCreateRequest,
  SalaryRecommendationProvideRequest,
} from '@/types/salaryRecommendation';
import { apiFetch } from '@/lib/api-fetch';

export const salaryRecommendationService = {
  async getAll(): Promise<SalaryRecommendation[]> {
    const response = await apiFetch('/api/salary-recommendations');
    if (!response.ok) return [];
    const result = await response.json();
    return result.content || result.data || result || [];
  },

  /** Counts across every recommendation. Returns null on failure — never a zeroed object. */
  async summary(): Promise<unknown | null> {
    const response = await apiFetch('/api/salary-recommendations/summary');
    if (!response.ok) return null;
    return response.json();
  },

  /**
   * Send a recommendation back for rework.
   *
   * Distinct from reject: a rejection ends the recommendation, a return expects it back. The
   * transition this calls did not exist until recently — RETURNED was declared and accepted by
   * submitForReview, but nothing could set it.
   */
  async returnForRework(id: number | string, reason: string): Promise<void> {
    const response = await apiFetch(`/api/salary-recommendations/${id}/return`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error ?? 'Could not return the recommendation');
    }
  },

  async getById(id: number): Promise<SalaryRecommendation> {
    const response = await apiFetch(`/api/salary-recommendations/${id}`);
    if (!response.ok) throw new Error('Recommendation not found');
    const result = await response.json();
    return result.data || result;
  },

  async create(request: SalaryRecommendationCreateRequest): Promise<SalaryRecommendation> {
    const response = await apiFetch('/api/salary-recommendations', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error('Failed to create recommendation');
    const result = await response.json();
    return result.data || result;
  },

  async submitForReview(id: number): Promise<SalaryRecommendation> {
    const response = await apiFetch(`/api/salary-recommendations/${id}/submit`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to submit for review');
    const result = await response.json();
    return result.data || result;
  },

  async provideRecommendation(id: number, request: SalaryRecommendationProvideRequest): Promise<SalaryRecommendation> {
    const response = await apiFetch(`/api/salary-recommendations/${id}/recommend`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error('Failed to provide recommendation');
    const result = await response.json();
    return result.data || result;
  },

  async approve(id: number, approvalNotes?: string): Promise<SalaryRecommendation> {
    const response = await apiFetch(`/api/salary-recommendations/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approvalNotes }),
    });
    if (!response.ok) throw new Error('Failed to approve recommendation');
    const result = await response.json();
    return result.data || result;
  },

  async reject(id: number, rejectionReason: string): Promise<SalaryRecommendation> {
    const response = await apiFetch(`/api/salary-recommendations/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejectionReason }),
    });
    if (!response.ok) throw new Error('Failed to reject recommendation');
    const result = await response.json();
    return result.data || result;
  },

  async getPendingReview(): Promise<SalaryRecommendation[]> {
    const response = await apiFetch('/api/salary-recommendations/pending-review');
    if (!response.ok) return [];
    const result = await response.json();
    return result.content || result.data || result || [];
  },

  async getPendingApproval(): Promise<SalaryRecommendation[]> {
    const response = await apiFetch('/api/salary-recommendations/pending-approval');
    if (!response.ok) return [];
    const result = await response.json();
    return result.content || result.data || result || [];
  },
};
