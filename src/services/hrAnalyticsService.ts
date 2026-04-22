import { apiFetch } from '@/lib/api-fetch';

export interface AnalyticsMetrics {
  [key: string]: unknown;
}

export const hrAnalyticsService = {
  async getHROverview(): Promise<AnalyticsMetrics> {
    const response = await apiFetch('/api/analytics/hr-overview');
    if (!response.ok) return {};
    return await response.json();
  },

  async getAttendanceAnalytics(): Promise<AnalyticsMetrics> {
    const response = await apiFetch('/api/analytics/attendance');
    if (!response.ok) return {};
    return await response.json();
  },

  async getTrainingAnalytics(): Promise<AnalyticsMetrics> {
    const response = await apiFetch('/api/analytics/training');
    if (!response.ok) return {};
    return await response.json();
  },

  async getEngagementAnalytics(): Promise<AnalyticsMetrics> {
    const response = await apiFetch('/api/analytics/engagement');
    if (!response.ok) return {};
    return await response.json();
  },

  async getComplianceAnalytics(): Promise<AnalyticsMetrics> {
    const response = await apiFetch('/api/analytics/compliance');
    if (!response.ok) return {};
    return await response.json();
  },

  async getPerformanceAnalytics(): Promise<AnalyticsMetrics> {
    const response = await apiFetch('/api/analytics/performance-reviews');
    if (!response.ok) return {};
    return await response.json();
  },

  async getAttritionRisk(): Promise<AnalyticsMetrics[]> {
    const response = await apiFetch('/api/analytics/attrition-risk');
    if (!response.ok) return [];
    return await response.json();
  },

  async calculateAttritionRisk(): Promise<AnalyticsMetrics> {
    const response = await apiFetch('/api/analytics/attrition-risk/calculate', {
      method: 'POST',
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to calculate attrition risk');
    }
    return await response.json();
  },

  async getSuccessionPlans(): Promise<AnalyticsMetrics[]> {
    const response = await apiFetch('/api/analytics/succession-plans');
    if (!response.ok) return [];
    return await response.json();
  },

  async createSuccessionPlan(data: Record<string, unknown>): Promise<AnalyticsMetrics> {
    const response = await apiFetch('/api/analytics/succession-plans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to create succession plan');
    }
    return await response.json();
  },
};
