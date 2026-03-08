import { tryApi } from '@/services/aiService';
import {
  AttritionAnalysisRequest, AttritionAnalysisResult,
  WorkforceAnalysisRequest, WorkforceAnalysisResult,
} from '@/types/ai';

export const aiAttritionService = {
  async analyzeEmployee(request: AttritionAnalysisRequest): Promise<AttritionAnalysisResult> {
    const data = await tryApi<AttritionAnalysisResult>('/api/ai/attrition/analyze-employee', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    if (!data) throw new Error('AI service unavailable');
    return data;
  },

  async analyzeWorkforce(request: WorkforceAnalysisRequest): Promise<WorkforceAnalysisResult> {
    const data = await tryApi<WorkforceAnalysisResult>('/api/ai/attrition/analyze-workforce', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    if (!data) throw new Error('AI service unavailable');
    return data;
  },
};
