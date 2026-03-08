import { apiFetch } from '@/lib/api-fetch';

export interface ConsentRecord {
  id: number;
  employeeId: number;
  employeeName: string;
  consentType: string;
  purpose: string | null;
  isGranted: boolean;
  grantedAt: string | null;
  withdrawnAt: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface DataSubjectRequest {
  id: number;
  requesterName: string;
  requesterEmail: string;
  requestType: string;
  description: string | null;
  status: string;
  response: string | null;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceReminder {
  id: number;
  reminderType: string;
  entityType: string | null;
  entityId: number | null;
  employeeId: number | null;
  employeeName: string | null;
  title: string;
  description: string | null;
  dueDate: string;
  status: string;
  sentAt: string | null;
  acknowledgedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const complianceService = {
  // ---- POPIA Dashboard ----
  async getDashboard(): Promise<Record<string, any>> {
    const response = await apiFetch('/api/compliance/popia/dashboard');
    if (!response.ok) return {};
    return await response.json();
  },

  // ---- Consents ----
  async grantConsent(employeeId: number, consentType: string, purpose?: string, ipAddress?: string): Promise<ConsentRecord> {
    const params = new URLSearchParams({ employeeId: employeeId.toString(), consentType });
    if (purpose) params.set('purpose', purpose);
    if (ipAddress) params.set('ipAddress', ipAddress);
    const response = await apiFetch(`/api/compliance/popia/consents?${params}`, { method: 'POST' });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to grant consent');
    }
    return await response.json();
  },

  async withdrawConsent(employeeId: number, consentType: string): Promise<ConsentRecord> {
    const response = await apiFetch(`/api/compliance/popia/consents/withdraw?employeeId=${employeeId}&consentType=${consentType}`, { method: 'PUT' });
    if (!response.ok) throw new Error('Failed to withdraw consent');
    return await response.json();
  },

  async getConsentsForEmployee(employeeId: number): Promise<ConsentRecord[]> {
    const response = await apiFetch(`/api/compliance/popia/consents/employee/${employeeId}`);
    if (!response.ok) return [];
    return await response.json();
  },

  async getAllConsents(page = 0, size = 20): Promise<PageResponse<ConsentRecord>> {
    const response = await apiFetch(`/api/compliance/popia/consents?page=${page}&size=${size}`);
    if (!response.ok) return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 };
    return await response.json();
  },

  async getConsentStats(): Promise<Record<string, any>> {
    const response = await apiFetch('/api/compliance/popia/consents/stats');
    if (!response.ok) return {};
    return await response.json();
  },

  // ---- DSARs ----
  async createDsar(requesterName: string, requesterEmail: string, requestType: string, description?: string): Promise<DataSubjectRequest> {
    const params = new URLSearchParams({ requesterName, requesterEmail, requestType });
    if (description) params.set('description', description);
    const response = await apiFetch(`/api/compliance/popia/dsar?${params}`, { method: 'POST' });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to create DSAR');
    }
    return await response.json();
  },

  async getDsar(id: number): Promise<DataSubjectRequest> {
    const response = await apiFetch(`/api/compliance/popia/dsar/${id}`);
    if (!response.ok) throw new Error('DSAR not found');
    return await response.json();
  },

  async getAllDsars(status?: string, page = 0, size = 20): Promise<PageResponse<DataSubjectRequest>> {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
    if (status) params.set('status', status);
    const response = await apiFetch(`/api/compliance/popia/dsar?${params}`);
    if (!response.ok) return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 };
    return await response.json();
  },

  async updateDsarStatus(id: number, status: string, responseText?: string): Promise<DataSubjectRequest> {
    const params = new URLSearchParams({ status });
    if (responseText) params.set('response', responseText);
    const response = await apiFetch(`/api/compliance/popia/dsar/${id}/status?${params}`, { method: 'PUT' });
    if (!response.ok) throw new Error('Failed to update DSAR');
    return await response.json();
  },

  async getDsarStats(): Promise<Record<string, any>> {
    const response = await apiFetch('/api/compliance/popia/dsar/stats');
    if (!response.ok) return {};
    return await response.json();
  },

  // ---- Compliance Reminders ----
  async createReminder(data: { reminderType: string; title: string; dueDate: string; entityType?: string; entityId?: number; employeeId?: number; description?: string }): Promise<ComplianceReminder> {
    const params = new URLSearchParams({ reminderType: data.reminderType, title: data.title, dueDate: data.dueDate });
    if (data.entityType) params.set('entityType', data.entityType);
    if (data.entityId) params.set('entityId', data.entityId.toString());
    if (data.employeeId) params.set('employeeId', data.employeeId.toString());
    if (data.description) params.set('description', data.description);
    const response = await apiFetch(`/api/compliance/reminders?${params}`, { method: 'POST' });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to create reminder');
    }
    return await response.json();
  },

  async getReminders(params?: { status?: string; employeeId?: number; page?: number; size?: number }): Promise<PageResponse<ComplianceReminder>> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.employeeId) searchParams.set('employeeId', params.employeeId.toString());
    searchParams.set('page', (params?.page ?? 0).toString());
    searchParams.set('size', (params?.size ?? 20).toString());
    const response = await apiFetch(`/api/compliance/reminders?${searchParams}`);
    if (!response.ok) return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 };
    return await response.json();
  },

  async getUpcomingReminders(daysAhead = 30): Promise<ComplianceReminder[]> {
    const response = await apiFetch(`/api/compliance/reminders/upcoming?daysAhead=${daysAhead}`);
    if (!response.ok) return [];
    return await response.json();
  },

  async acknowledgeReminder(id: number): Promise<ComplianceReminder> {
    const response = await apiFetch(`/api/compliance/reminders/${id}/acknowledge`, { method: 'PUT' });
    if (!response.ok) throw new Error('Failed to acknowledge reminder');
    return await response.json();
  },

  async getReminderStats(): Promise<Record<string, any>> {
    const response = await apiFetch('/api/compliance/reminders/stats');
    if (!response.ok) return {};
    return await response.json();
  },

  // ---- Labour Relations ----
  async getLabourDashboard(): Promise<Record<string, any>> {
    const response = await apiFetch('/api/labour-relations/dashboard');
    if (!response.ok) return {};
    return await response.json();
  },

  async createDisciplinaryCase(data: { employeeId: number; offenceCategory: string; offenceDescription: string; incidentDate: string; createdBy: number }): Promise<any> {
    const params = new URLSearchParams({
      employeeId: data.employeeId.toString(),
      offenceCategory: data.offenceCategory,
      offenceDescription: data.offenceDescription,
      incidentDate: data.incidentDate,
      createdBy: data.createdBy.toString(),
    });
    const response = await apiFetch(`/api/labour-relations/disciplinary?${params}`, { method: 'POST' });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to create case');
    }
    return await response.json();
  },

  async getDisciplinaryCases(params?: { employeeId?: number; status?: string; page?: number; size?: number }): Promise<PageResponse<any>> {
    const searchParams = new URLSearchParams();
    if (params?.employeeId) searchParams.set('employeeId', params.employeeId.toString());
    if (params?.status) searchParams.set('status', params.status);
    searchParams.set('page', (params?.page ?? 0).toString());
    searchParams.set('size', (params?.size ?? 20).toString());
    const response = await apiFetch(`/api/labour-relations/disciplinary?${searchParams}`);
    if (!response.ok) return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 };
    return await response.json();
  },

  async updateDisciplinaryCase(id: number, data: { status?: string; outcome?: string; hearingDate?: string; notes?: string }): Promise<any> {
    const params = new URLSearchParams();
    if (data.status) params.set('status', data.status);
    if (data.outcome) params.set('outcome', data.outcome);
    if (data.hearingDate) params.set('hearingDate', data.hearingDate);
    if (data.notes) params.set('notes', data.notes);
    const response = await apiFetch(`/api/labour-relations/disciplinary/${id}?${params}`, { method: 'PUT' });
    if (!response.ok) throw new Error('Failed to update case');
    return await response.json();
  },

  async fileGrievance(data: { employeeId: number; grievanceType: string; description: string; assignedToId?: number }): Promise<any> {
    const params = new URLSearchParams({
      employeeId: data.employeeId.toString(),
      grievanceType: data.grievanceType,
      description: data.description,
    });
    if (data.assignedToId) params.set('assignedToId', data.assignedToId.toString());
    const response = await apiFetch(`/api/labour-relations/grievances?${params}`, { method: 'POST' });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to file grievance');
    }
    return await response.json();
  },

  async getGrievances(params?: { employeeId?: number; status?: string; page?: number; size?: number }): Promise<PageResponse<any>> {
    const searchParams = new URLSearchParams();
    if (params?.employeeId) searchParams.set('employeeId', params.employeeId.toString());
    if (params?.status) searchParams.set('status', params.status);
    searchParams.set('page', (params?.page ?? 0).toString());
    searchParams.set('size', (params?.size ?? 20).toString());
    const response = await apiFetch(`/api/labour-relations/grievances?${searchParams}`);
    if (!response.ok) return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 };
    return await response.json();
  },

  async updateGrievance(id: number, data: { status?: string; resolution?: string }): Promise<any> {
    const params = new URLSearchParams();
    if (data.status) params.set('status', data.status);
    if (data.resolution) params.set('resolution', data.resolution);
    const response = await apiFetch(`/api/labour-relations/grievances/${id}?${params}`, { method: 'PUT' });
    if (!response.ok) throw new Error('Failed to update grievance');
    return await response.json();
  },
};
