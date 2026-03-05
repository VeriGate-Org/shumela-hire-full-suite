import {
  JobAd,
  JobAdStatus,
  PublishingChannel,
  PublishingRequest,
  PublishingHistoryEntry,
  JobAdFilters,
  JobAdStats,
  generateSlug,
  DEFAULT_PUBLISHING_SETTINGS
} from '../types/jobAd';
import { JobAdDraft } from '../types/jobTemplate';
import { apiFetch } from '@/lib/api-fetch';

/**
 * Job Ad Service
 * Handles business logic for job ad publishing and management
 */
export class JobAdService {
  async publishJobAd(
    draft: JobAdDraft,
    publishingRequest: PublishingRequest,
    publishedBy: string
  ): Promise<JobAd> {
    const now = new Date();
    const maxExpiry = new Date(now.getTime() + DEFAULT_PUBLISHING_SETTINGS.maxExpiryDays * 24 * 60 * 60 * 1000);

    if (publishingRequest.expiresAt <= now) {
      throw new Error('Expiry date must be in the future');
    }

    if (publishingRequest.expiresAt > maxExpiry) {
      throw new Error(`Expiry date cannot be more than ${DEFAULT_PUBLISHING_SETTINGS.maxExpiryDays} days in the future`);
    }

    const response = await apiFetch('/api/ads', {
      method: 'POST',
      body: JSON.stringify({
        draft,
        publishingRequest,
        publishedBy,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to publish job ad');
    }

    const result = await response.json();
    return result.data || result;
  }

  async getJobAd(id: string): Promise<JobAd | null> {
    const response = await apiFetch(`/api/ads/${id}`);
    if (!response.ok) return null;
    const result = await response.json();
    return result.data || result;
  }

  async getJobAdBySlug(slug: string): Promise<JobAd | null> {
    const response = await apiFetch(`/api/ads/slug/${slug}`);
    if (!response.ok) return null;
    const result = await response.json();
    return result.data || result;
  }

  async getAllJobAds(filters?: JobAdFilters): Promise<JobAd[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.channels?.length) params.set('channels', filters.channels.join(','));
    if (filters?.location) params.set('location', filters.location);
    if (filters?.employmentType) params.set('employmentType', filters.employmentType);
    if (filters?.department) params.set('department', filters.department);
    if (filters?.featured !== undefined) params.set('featured', String(filters.featured));
    if (filters?.search) params.set('search', filters.search);

    const query = params.toString();
    const response = await apiFetch(`/api/ads${query ? `?${query}` : ''}`);
    if (!response.ok) return [];
    const result = await response.json();
    return result.data || result || [];
  }

  async getPublishedJobAds(channel?: PublishingChannel): Promise<JobAd[]> {
    const filters: JobAdFilters = { status: JobAdStatus.PUBLISHED };
    if (channel) {
      filters.channels = [channel];
    }
    return this.getAllJobAds(filters);
  }

  async updateJobAd(id: string, updates: Partial<JobAd>): Promise<JobAd | null> {
    const response = await apiFetch(`/api/ads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    if (!response.ok) return null;
    const result = await response.json();
    return result.data || result;
  }

  async unpublishJobAd(id: string, performedBy: string, reason?: string): Promise<JobAd | null> {
    const response = await apiFetch(`/api/ads/${id}/unpublish`, {
      method: 'POST',
      body: JSON.stringify({ performedBy, reason }),
    });
    if (!response.ok) return null;
    const result = await response.json();
    return result.data || result;
  }

  async republishJobAd(
    id: string,
    channels: PublishingChannel[],
    expiresAt: Date,
    performedBy: string
  ): Promise<JobAd | null> {
    const response = await apiFetch(`/api/ads/${id}/republish`, {
      method: 'POST',
      body: JSON.stringify({ channels, expiresAt, performedBy }),
    });
    if (!response.ok) return null;
    const result = await response.json();
    return result.data || result;
  }

  async deleteJobAd(id: string): Promise<boolean> {
    const response = await apiFetch(`/api/ads/${id}`, {
      method: 'DELETE',
    });
    return response.ok;
  }

  async recordView(id: string): Promise<void> {
    await apiFetch(`/api/ads/${id}/view`, { method: 'POST' });
  }

  async recordApplication(id: string): Promise<void> {
    await apiFetch(`/api/ads/${id}/apply`, { method: 'POST' });
  }

  async getPublishingHistory(jobAdId: string): Promise<PublishingHistoryEntry[]> {
    const response = await apiFetch(`/api/ads/${jobAdId}/history`);
    if (!response.ok) return [];
    const result = await response.json();
    return result.data || result || [];
  }

  async getStats(): Promise<JobAdStats> {
    const response = await apiFetch('/api/ads/stats');
    if (!response.ok) {
      return {
        totalAds: 0,
        publishedAds: 0,
        expiredAds: 0,
        totalViews: 0,
        totalApplications: 0,
        internalAds: 0,
        externalAds: 0,
        featuredAds: 0,
        averageViewsPerAd: 0,
        conversionRate: 0,
      };
    }
    const result = await response.json();
    return result.data || result;
  }

  async checkAndExpireJobAds(): Promise<void> {
    await apiFetch('/api/ads/expire-check', { method: 'POST' });
  }

  generateSlug(title: string, id?: string): string {
    return generateSlug(title, id);
  }

  validateSlug(slug: string): boolean {
    return /^[a-z0-9-]+$/.test(slug) && slug.length >= 3 && slug.length <= 100;
  }

  async isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
    const params = new URLSearchParams({ slug });
    if (excludeId) params.set('excludeId', excludeId);
    const response = await apiFetch(`/api/ads/slug-available?${params}`);
    if (!response.ok) return false;
    const result = await response.json();
    return result.data ?? result ?? false;
  }
}

// Export singleton instance
export const jobAdService = new JobAdService();
