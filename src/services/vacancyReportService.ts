import { apiFetch } from '@/lib/api-fetch';

export interface VacancySummaryData {
  jobId: string;
  reportGeneratedAt: string;
  totalApplications: number;
  applicationsByStatus: Record<string, number>;
  applicationsBySource: Record<string, number>;
  shortlistedCount: number;
  demographics: {
    totalApplicants: number;
    totalWithConsent: number;
    genderBreakdown: Record<string, number>;
    raceBreakdown: Record<string, number>;
    disabilityBreakdown: Record<string, number>;
    citizenshipBreakdown: Record<string, number>;
  };
}

export const vacancyReportService = {
  async getVacancySummary(jobId: string): Promise<VacancySummaryData> {
    const response = await apiFetch(`/api/vacancy-reports/${jobId}/summary`);
    if (!response.ok) throw new Error('Failed to fetch vacancy summary');
    return response.json();
  },

  async downloadVacancySummaryPdf(jobId: string): Promise<void> {
    const response = await apiFetch(`/api/vacancy-reports/${jobId}/summary/pdf`);
    if (!response.ok) throw new Error('Failed to download vacancy summary PDF');
    const blob = await response.blob();
    downloadBlob(blob, `vacancy-summary-${jobId}.pdf`);
  },

  async downloadShortlistPackPdf(jobId: string): Promise<void> {
    const response = await apiFetch(`/api/vacancy-reports/${jobId}/shortlist-pack/pdf`);
    if (!response.ok) throw new Error('Failed to download shortlist pack PDF');
    const blob = await response.blob();
    downloadBlob(blob, `shortlist-pack-${jobId}.pdf`);
  },

  async downloadDemographicsReportPdf(jobId: string): Promise<void> {
    const response = await apiFetch(`/api/vacancy-reports/${jobId}/demographics/pdf`);
    if (!response.ok) throw new Error('Failed to download demographics report PDF');
    const blob = await response.blob();
    downloadBlob(blob, `demographics-report-${jobId}.pdf`);
  },
};

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
}
