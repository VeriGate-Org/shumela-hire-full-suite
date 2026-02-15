import { tryApi } from '@/services/aiService';
import { OfferPredictionRequest, OfferPredictionResult } from '@/types/ai';

const mockResult: OfferPredictionResult = {
  acceptanceProbability: 72,
  riskLevel: 'MEDIUM',
  positiveFactors: ['Competitive salary offer', 'Strong employer brand', 'Role alignment with career goals'],
  riskFactors: ['Extended hiring timeline', 'Candidate has competing offers'],
  recommendations: ['Consider expediting the offer process', 'Highlight unique benefits and growth opportunities'],
};

export const aiOfferPredictionService = {
  async predict(request: OfferPredictionRequest): Promise<OfferPredictionResult> {
    const data = await tryApi<OfferPredictionResult>(`/api/ai/offer-prediction/predict/${request.applicationId}`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return data ?? mockResult;
  },
};
