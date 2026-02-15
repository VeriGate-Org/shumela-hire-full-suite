import { tryApi } from '@/services/aiService';
import { ReportNarrativeRequest, ReportNarrativeResult } from '@/types/ai';

const mockResult: ReportNarrativeResult = {
  executiveSummary: 'The recruitment process for this vacancy has progressed according to plan with strong candidate engagement.',
  keyFindings: [
    'Application volume exceeded expectations by 20%',
    'Average time-to-shortlist was 5 business days',
    'Diversity metrics are tracking above target',
  ],
  recommendations: [
    'Consider expanding sourcing channels for future similar roles',
    'Streamline the technical assessment stage to reduce candidate drop-off',
  ],
};

export const aiReportNarrativeService = {
  async generate(request: ReportNarrativeRequest): Promise<ReportNarrativeResult> {
    const path = request.jobId
      ? `/api/ai/report-narrative/generate/${request.jobId}`
      : '/api/ai/report-narrative/generate';
    const data = await tryApi<ReportNarrativeResult>(path, {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return data ?? mockResult;
  },
};
