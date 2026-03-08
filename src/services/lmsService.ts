import { apiFetch } from '@/lib/api-fetch';

export interface LmsConnector {
  id: number;
  name: string;
  providerType: string;
  baseUrl: string;
  isActive: boolean;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LmsSyncLog {
  id: number;
  connectorId: number;
  connectorName: string;
  syncType: string;
  status: string;
  recordsSynced: number;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
}

export interface LmsPageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const lmsService = {
  // Connectors
  async getConnectors(): Promise<LmsConnector[]> {
    const response = await apiFetch('/api/integrations/lms/connectors');
    if (!response.ok) return [];
    return await response.json();
  },

  async getConnector(id: number): Promise<LmsConnector> {
    const response = await apiFetch(`/api/integrations/lms/connectors/${id}`);
    if (!response.ok) throw new Error('Connector not found');
    return await response.json();
  },

  async createConnector(data: {
    name: string;
    providerType: string;
    baseUrl: string;
    apiKey: string;
    isActive: boolean;
  }): Promise<LmsConnector> {
    const response = await apiFetch('/api/integrations/lms/connectors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to create connector');
    }
    return await response.json();
  },

  async updateConnector(id: number, data: Partial<LmsConnector & { apiKey: string }>): Promise<LmsConnector> {
    const response = await apiFetch(`/api/integrations/lms/connectors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to update connector');
    }
    return await response.json();
  },

  async deleteConnector(id: number): Promise<void> {
    const response = await apiFetch(`/api/integrations/lms/connectors/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete connector');
  },

  async testConnection(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiFetch(`/api/integrations/lms/connectors/${id}/test`, { method: 'POST' });
    if (!response.ok) throw new Error('Connection test failed');
    return await response.json();
  },

  async triggerSync(id: number, syncType: string = 'COURSES'): Promise<LmsSyncLog> {
    const response = await apiFetch(`/api/integrations/lms/connectors/${id}/sync?syncType=${syncType}`, {
      method: 'POST',
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to trigger sync');
    }
    return await response.json();
  },

  // Sync Logs
  async getSyncLogs(page = 0, size = 20): Promise<LmsPageResponse<LmsSyncLog>> {
    const response = await apiFetch(`/api/integrations/lms/logs?page=${page}&size=${size}`);
    if (!response.ok) return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 };
    return await response.json();
  },

  async getSyncLogsByConnector(connectorId: number, page = 0, size = 20): Promise<LmsPageResponse<LmsSyncLog>> {
    const response = await apiFetch(`/api/integrations/lms/logs/${connectorId}?page=${page}&size=${size}`);
    if (!response.ok) return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 };
    return await response.json();
  },
};
