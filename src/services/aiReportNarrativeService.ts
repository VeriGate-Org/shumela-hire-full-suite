import { tryApi } from '@/services/aiService';
import { ReportNarrativeRequest, ReportNarrativeResult } from '@/types/ai';

export const aiReportNarrativeService = {
  async generate(request: ReportNarrativeRequest): Promise<ReportNarrativeResult> {
    const path = request.jobId
      ? `/api/ai/report-narrative/generate/${request.jobId}`
      : '/api/ai/report-narrative/generate';
    const data = await tryApi<ReportNarrativeResult>(path, {
      method: 'POST',
      body: JSON.stringify(request),
    });
    if (!data) throw new Error('AI service unavailable');
    return data;
  },
};
