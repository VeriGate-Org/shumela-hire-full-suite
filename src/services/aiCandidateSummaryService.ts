import { tryApi } from '@/services/aiService';
import { CandidateSummaryResult } from '@/types/ai';

const mockSummary: CandidateSummaryResult = {
  executiveSummary: 'Experienced professional with a strong track record in software engineering and team leadership.',
  educationSummary: 'BSc Computer Science from a recognised institution.',
  experienceSummary: '8 years of progressive experience in software development roles.',
  keyStrengths: ['Technical leadership', 'Problem solving', 'Cross-functional collaboration'],
  potentialGaps: ['Limited exposure to the specific industry vertical'],
  fitAssessment: 'Strong overall fit for the role with minor development areas.',
};

export const aiCandidateSummaryService = {
  async summarize(applicationId: string): Promise<CandidateSummaryResult> {
    const data = await tryApi<CandidateSummaryResult>(`/api/ai/candidate-summary/${applicationId}`);
    return data ?? mockSummary;
  },
};
