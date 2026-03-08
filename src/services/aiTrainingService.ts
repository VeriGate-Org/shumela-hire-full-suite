import { tryApi } from '@/services/aiService';
import {
  LearningPathRequest, LearningPathResult,
  TrainingRoiRequest, TrainingRoiResult,
} from '@/types/ai';

export const aiTrainingService = {
  async generateLearningPath(request: LearningPathRequest): Promise<LearningPathResult> {
    const data = await tryApi<LearningPathResult>('/api/ai/training/learning-path', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    if (!data) throw new Error('AI service unavailable');
    return data;
  },

  async analyzeRoi(request: TrainingRoiRequest): Promise<TrainingRoiResult> {
    const data = await tryApi<TrainingRoiResult>('/api/ai/training/roi-analysis', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    if (!data) throw new Error('AI service unavailable');
    return data;
  },
};
