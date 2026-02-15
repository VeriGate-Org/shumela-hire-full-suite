import { tryApi } from '@/services/aiService';
import {
  JobDescriptionRequest,
  JobDescriptionResult,
  BiasCheckResult,
} from '@/types/ai';

const mockJobDescription: JobDescriptionResult = {
  title: 'Senior Software Engineer',
  intro: 'We are seeking a talented Senior Software Engineer to join our growing team and drive technical excellence across our platform.',
  responsibilities: [
    'Design and implement scalable software solutions',
    'Collaborate with cross-functional teams to define requirements',
    'Mentor junior developers and conduct code reviews',
    'Participate in architectural decisions and technical planning',
  ],
  requirements: [
    '5+ years of professional software development experience',
    'Strong proficiency in Java or similar languages',
    'Experience with cloud platforms (AWS, Azure, or GCP)',
    'Excellent communication and collaboration skills',
  ],
  benefits: [
    'Competitive salary and equity package',
    'Flexible working arrangements',
    'Professional development budget',
    'Comprehensive health benefits',
  ],
  biasWarnings: [],
};

export const aiJobDescriptionService = {
  async generate(request: JobDescriptionRequest): Promise<JobDescriptionResult> {
    const data = await tryApi<JobDescriptionResult>('/api/ai/job-description/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return data ?? mockJobDescription;
  },

  async checkBias(text: string): Promise<BiasCheckResult> {
    const data = await tryApi<BiasCheckResult>('/api/ai/job-description/check-bias', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
    return data ?? { biasWarnings: [], overallAssessment: 'No significant bias detected (mock).' };
  },
};
