import { apiFetch } from '@/lib/api-fetch';

export interface SsoConfig {
  id: number;
  provider: 'AZURE_AD' | 'ON_PREM_AD' | 'OKTA' | 'CUSTOM_SAML';
  displayName: string;
  clientId: string | null;
  clientSecret: string | null;
  tenantIdentifier: string | null;
  discoveryUrl: string | null;
  metadataXml: string | null;
  isEnabled: boolean;
  autoProvisionUsers: boolean;
  defaultRole: string;
  groupMappings: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SsoConfigRequest {
  provider: string;
  displayName: string;
  clientId?: string;
  clientSecret?: string;
  tenantIdentifier?: string;
  discoveryUrl?: string;
  metadataXml?: string;
  isEnabled?: boolean;
  autoProvisionUsers?: boolean;
  defaultRole?: string;
  groupMappings?: string;
}

export interface SsoGroupMapping {
  adGroupName: string;
  mappedRole: string;
}

export interface SsoTestResult {
  success: boolean;
  message: string;
  discoveredEndpoints: Record<string, string>;
}

export const ssoService = {
  async getConfig(): Promise<SsoConfig | null> {
    const response = await apiFetch('/api/integrations/sso/config');
    if (response.status === 204) return null;
    if (!response.ok) return null;
    return await response.json();
  },

  async saveConfig(data: SsoConfigRequest): Promise<SsoConfig> {
    const response = await apiFetch('/api/integrations/sso/config', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Failed to save SSO configuration' }));
      throw new Error(err.error || 'Failed to save SSO configuration');
    }
    return await response.json();
  },

  async testConnection(): Promise<SsoTestResult> {
    const response = await apiFetch('/api/integrations/sso/test', {
      method: 'POST',
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Connection test failed' }));
      throw new Error(err.error || 'Connection test failed');
    }
    return await response.json();
  },

  async getMappings(): Promise<SsoGroupMapping[]> {
    const response = await apiFetch('/api/integrations/sso/mappings');
    if (!response.ok) return [];
    return await response.json();
  },

  async updateMappings(mappings: SsoGroupMapping[]): Promise<SsoGroupMapping[]> {
    const response = await apiFetch('/api/integrations/sso/mappings', {
      method: 'PUT',
      body: JSON.stringify(mappings),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Failed to update mappings' }));
      throw new Error(err.error || 'Failed to update mappings');
    }
    return await response.json();
  },
};
