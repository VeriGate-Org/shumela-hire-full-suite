import { tryApi } from '@/services/aiService';
import { InterviewQuestionRequest, InterviewQuestionsResult } from '@/types/ai';

const mockQuestions: InterviewQuestionsResult = {
  questions: [
    {
      question: 'Describe a technically challenging project you led and the architectural decisions you made.',
      category: 'Technical',
      expectedAnswer: 'Look for clear problem decomposition, trade-off analysis, and measurable outcomes.',
      difficulty: 'SENIOR',
    },
    {
      question: 'How do you approach mentoring junior team members while maintaining your own productivity?',
      category: 'Leadership',
      expectedAnswer: 'Look for structured mentoring approaches, delegation skills, and time management.',
      difficulty: 'SENIOR',
    },
    {
      question: 'Walk me through how you would design a system to handle 10x traffic growth.',
      category: 'System Design',
      expectedAnswer: 'Look for scalability patterns: caching, load balancing, database sharding, async processing.',
      difficulty: 'SENIOR',
    },
  ],
};

export const aiInterviewService = {
  async generateQuestions(request: InterviewQuestionRequest): Promise<InterviewQuestionsResult> {
    const data = await tryApi<InterviewQuestionsResult>('/api/ai/interview-questions/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return data ?? mockQuestions;
  },
};
