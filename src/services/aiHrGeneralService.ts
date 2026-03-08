import { tryApi } from '@/services/aiService';
import {
  CaseAnalysisRequest, CaseAnalysisResult,
  OnboardingPlanRequest, OnboardingPlanResult,
  PayrollAnomalyRequest, PayrollAnomalyResult,
} from '@/types/ai';

export const aiHrGeneralService = {
  async analyzeCase(request: CaseAnalysisRequest): Promise<CaseAnalysisResult> {
    const data = await tryApi<CaseAnalysisResult>('/api/ai/hr/analyze-case', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    if (!data) throw new Error('AI service unavailable');
    return data;
  },

  async generateOnboardingPlan(request: OnboardingPlanRequest): Promise<OnboardingPlanResult> {
    const data = await tryApi<OnboardingPlanResult>('/api/ai/hr/generate-onboarding-plan', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    if (!data) throw new Error('AI service unavailable');
    return data;
  },

  async detectPayrollAnomalies(request: PayrollAnomalyRequest): Promise<PayrollAnomalyResult> {
    const data = await tryApi<PayrollAnomalyResult>('/api/ai/hr/detect-payroll-anomalies', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    if (!data) throw new Error('AI service unavailable');
    return data;
  },
};
