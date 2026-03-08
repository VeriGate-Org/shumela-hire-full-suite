import { tryApi } from '@/services/aiService';
import { SentimentAnalysisRequest, SentimentAnalysisResult } from '@/types/ai';

export const aiEngagementService = {
  async analyzeSentiment(request: SentimentAnalysisRequest): Promise<SentimentAnalysisResult> {
    const data = await tryApi<SentimentAnalysisResult>('/api/ai/engagement/analyze-sentiment', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    if (!data) throw new Error('AI service unavailable');
    return data;
  },
};
