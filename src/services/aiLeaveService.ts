import { tryApi } from '@/services/aiService';
import { LeavePatternRequest, LeavePatternResult } from '@/types/ai';

export const aiLeaveService = {
  async analyzePatterns(request: LeavePatternRequest): Promise<LeavePatternResult> {
    const data = await tryApi<LeavePatternResult>('/api/ai/leave/analyze-patterns', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    if (!data) throw new Error('AI service unavailable');
    return data;
  },
};
