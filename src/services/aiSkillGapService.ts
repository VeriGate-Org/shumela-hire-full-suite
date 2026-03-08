import { tryApi } from '@/services/aiService';
import { SkillGapAiRequest, SkillGapAiResult } from '@/types/ai';

export const aiSkillGapService = {
  async analyze(request: SkillGapAiRequest): Promise<SkillGapAiResult> {
    const data = await tryApi<SkillGapAiResult>('/api/ai/skill-gap/analyze', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    if (!data) throw new Error('AI service unavailable');
    return data;
  },
};
