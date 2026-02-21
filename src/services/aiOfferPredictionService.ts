import { tryApi } from '@/services/aiService';
import { OfferPredictionRequest, OfferPredictionResult } from '@/types/ai';

export const aiOfferPredictionService = {
  async predict(request: OfferPredictionRequest): Promise<OfferPredictionResult> {
    const data = await tryApi<OfferPredictionResult>(`/api/ai/offer-prediction/predict/${request.applicationId}`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
    if (!data) throw new Error('AI service unavailable');
    return data;
  },
};
