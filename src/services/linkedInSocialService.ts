import { apiFetch } from '@/lib/api-fetch';

export interface LinkedInConnectionStatus {
  connected: boolean;
  organizationName: string | null;
  organizationId: string | null;
  connectedAt: string | null;
  tokenExpired: boolean;
}

export interface LinkedInPostResponse {
  success: boolean;
  postUrl: string | null;
  message: string;
}

export interface LinkedInPostRequest {
  jobPostingId: string | number;
  customText?: string;
}

export const linkedInSocialService = {
  async getAuthUrl(): Promise<string> {
    const response = await apiFetch('/api/linkedin/social/auth/url');
    if (!response.ok) throw new Error('Failed to get LinkedIn auth URL');
    const data = await response.json();
    return data.authUrl;
  },

  async getStatus(): Promise<LinkedInConnectionStatus> {
    const response = await apiFetch('/api/linkedin/social/status');
    if (!response.ok) {
      return { connected: false, organizationName: null, organizationId: null, connectedAt: null, tokenExpired: false };
    }
    return response.json();
  },

  async disconnect(): Promise<void> {
    const response = await apiFetch('/api/linkedin/social/disconnect', { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to disconnect LinkedIn');
  },

  async createPost(request: LinkedInPostRequest): Promise<LinkedInPostResponse> {
    const response = await apiFetch('/api/linkedin/social/posts', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error('Failed to create LinkedIn post');
    return response.json();
  },
};
