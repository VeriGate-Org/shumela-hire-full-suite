import { tryApi } from '@/services/aiService';
import { CvScreeningResult, CvRankingEntry } from '@/types/ai';

const mockScreeningResult: CvScreeningResult = {
  overallScore: 78,
  skillsMatchScore: 82,
  experienceMatchScore: 75,
  matchedSkills: ['Java', 'Spring Boot', 'REST APIs', 'SQL'],
  missingSkills: ['Kubernetes', 'GraphQL'],
  strengths: ['Strong backend development experience', 'Relevant industry background'],
  concerns: ['Limited cloud infrastructure experience'],
  summary: 'Solid candidate with strong core technical skills. Minor gaps in cloud-native technologies that could be addressed through on-the-job training.',
};

const mockRankingResult: CvRankingEntry[] = [
  { applicationId: '1', candidateName: 'Mock Candidate A', rank: 1, overallScore: 85, quickSummary: 'Excellent match across all criteria' },
  { applicationId: '2', candidateName: 'Mock Candidate B', rank: 2, overallScore: 72, quickSummary: 'Strong technical skills, less industry experience' },
];

export const aiCvScreeningService = {
  async screenCandidate(applicationId: string, jobRequirements: string[]): Promise<CvScreeningResult> {
    const data = await tryApi<CvScreeningResult>(`/api/ai/cv-screening/screen/${applicationId}`, {
      method: 'POST',
      body: JSON.stringify({ applicationId, jobRequirements }),
    });
    return data ?? mockScreeningResult;
  },

  async rankCandidates(jobId: string, jobRequirements: string[]): Promise<CvRankingEntry[]> {
    const data = await tryApi<{ rankings: CvRankingEntry[] }>(`/api/ai/cv-screening/rank/${jobId}`, {
      method: 'POST',
      body: JSON.stringify({ jobId, jobRequirements }),
    });
    return data?.rankings ?? mockRankingResult;
  },
};
