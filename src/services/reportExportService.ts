import { apiFetch } from '@/lib/api-fetch';

export interface ReportExportJob {
  id: number;
  reportType: string;
  format: string;
  status: string;
  fileUrl: string | null;
  fileSize: number | null;
  parameters: string | null;
  requestedById: number;
  requestedByName: string;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface ReportExportRequest {
  reportType: string;
  format: string;
  requestedBy: number;
  parameters?: string;
}

export const reportExportService = {
  async exportReport(data: ReportExportRequest): Promise<ReportExportJob> {
    const response = await apiFetch('/api/reports/export', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to export report');
    }
    return await response.json();
  },

  async getJobs(employeeId?: number): Promise<ReportExportJob[]> {
    const params = employeeId ? `?employeeId=${employeeId}` : '';
    const response = await apiFetch(`/api/reports/export/jobs${params}`);
    if (!response.ok) return [];
    return await response.json();
  },

  async getJob(id: number): Promise<ReportExportJob> {
    const response = await apiFetch(`/api/reports/export/jobs/${id}`);
    if (!response.ok) throw new Error('Export job not found');
    return await response.json();
  },
};
