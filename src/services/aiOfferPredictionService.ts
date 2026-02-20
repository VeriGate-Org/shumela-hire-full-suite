import { tryApi } from '@/services/aiService';
import { OfferPredictionRequest, OfferPredictionResult } from '@/types/ai';

const mockResult: any = {}; // TODO: Remove mock fallback

export const aiOfferPredictionService = {
  async predict(request: OfferPredictionRequest): Promise<OfferPredictionResult> {
    const data = await tryApi<OfferPredictionResult>(`/api/ai/offer-prediction/predict/${request.applicationId}`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return data ?? mockResult;
  },
};
