import { tryApi } from '@/services/aiService';
import { InterviewQuestionRequest, InterviewQuestionsResult } from '@/types/ai';

export const aiInterviewService = {
  async generateQuestions(request: InterviewQuestionRequest): Promise<InterviewQuestionsResult> {
    const data = await tryApi<InterviewQuestionsResult>('/api/ai/interview-questions/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    if (!data) throw new Error('AI service unavailable');
    return data;
  },
};
