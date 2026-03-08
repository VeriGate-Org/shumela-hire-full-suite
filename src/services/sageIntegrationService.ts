import { apiFetch } from '@/lib/api-fetch';

export interface SageConnectorConfig {
  id: number;
  name: string;
  connectorType: string;
  authMethod: string;
  baseUrl: string;
  isActive: boolean;
  lastTestedAt: string | null;
  lastTestSuccess: boolean | null;
  createdAt: string;
}

export interface SageSyncSchedule {
  id: number;
  connectorId: number;
  connectorName: string;
  entityType: string;
  direction: string;
  frequency: string;
  cronExpression: string;
  isActive: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
}

export interface SageSyncLog {
  id: number;
  connectorId: number;
  connectorName: string;
  entityType: string;
  direction: string;
  status: string;
  recordsProcessed: number;
  recordsSucceeded: number;
  recordsFailed: number;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
}

export interface SageConnectionTestResult {
  success: boolean;
  message: string;
  testedAt: string;
}

export interface CreateConnectorRequest {
  name: string;
  connectorType: string;
  authMethod: string;
  baseUrl: string;
  credentials?: Record<string, string>;
}

export interface UpdateConnectorRequest {
  name?: string;
  connectorType?: string;
  authMethod?: string;
  baseUrl?: string;
  credentials?: Record<string, string>;
  isActive?: boolean;
}

export interface CreateScheduleRequest {
  connectorId: number;
  entityType: string;
  direction: string;
  frequency: string;
  cronExpression: string;
}

export interface UpdateScheduleRequest {
  entityType?: string;
  direction?: string;
  frequency?: string;
  cronExpression?: string;
  isActive?: boolean;
}

export interface PaginatedSyncLogs {
  content: SageSyncLog[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const sageIntegrationService = {
  async getConnectors(): Promise<SageConnectorConfig[]> {
    const response = await apiFetch('/api/integrations/sage/connectors');
    if (!response.ok) throw new Error('Failed to fetch Sage connectors');
    return response.json();
  },

  async getConnector(id: number): Promise<SageConnectorConfig> {
    const response = await apiFetch(`/api/integrations/sage/connectors/${id}`);
    if (!response.ok) throw new Error('Failed to fetch Sage connector');
    return response.json();
  },

  async createConnector(data: CreateConnectorRequest): Promise<SageConnectorConfig> {
    const response = await apiFetch('/api/integrations/sage/connectors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create Sage connector');
    return response.json();
  },

  async updateConnector(id: number, data: UpdateConnectorRequest): Promise<SageConnectorConfig> {
    const response = await apiFetch(`/api/integrations/sage/connectors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update Sage connector');
    return response.json();
  },

  async testConnector(id: number): Promise<SageConnectionTestResult> {
    const response = await apiFetch(`/api/integrations/sage/connectors/${id}/test`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to test Sage connector');
    return response.json();
  },

  async getSchedules(): Promise<SageSyncSchedule[]> {
    const response = await apiFetch('/api/integrations/sage/schedules');
    if (!response.ok) throw new Error('Failed to fetch sync schedules');
    return response.json();
  },

  async createSchedule(data: CreateScheduleRequest): Promise<SageSyncSchedule> {
    const response = await apiFetch('/api/integrations/sage/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create sync schedule');
    return response.json();
  },

  async updateSchedule(id: number, data: UpdateScheduleRequest): Promise<SageSyncSchedule> {
    const response = await apiFetch(`/api/integrations/sage/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update sync schedule');
    return response.json();
  },

  async runSchedule(id: number): Promise<void> {
    const response = await apiFetch(`/api/integrations/sage/schedules/${id}/run`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to trigger sync schedule');
  },

  async getLogs(page: number = 0, size: number = 20): Promise<PaginatedSyncLogs> {
    const response = await apiFetch(`/api/integrations/sage/logs?page=${page}&size=${size}`);
    if (!response.ok) throw new Error('Failed to fetch sync logs');
    return response.json();
  },
};
