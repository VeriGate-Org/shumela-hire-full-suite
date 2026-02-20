import { tryApi } from '@/services/aiService';
import { InterviewQuestionRequest, InterviewQuestionsResult } from '@/types/ai';

const mockQuestions: any = {}; // TODO: Remove mock fallback

export const aiInterviewService = {
  async generateQuestions(request: InterviewQuestionRequest): Promise<InterviewQuestionsResult> {
    const data = await tryApi<InterviewQuestionsResult>('/api/ai/interview-questions/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return data ?? mockQuestions;
  },
};
