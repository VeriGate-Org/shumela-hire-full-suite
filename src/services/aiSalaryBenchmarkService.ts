import { tryApi } from '@/services/aiService';
import { SalaryBenchmarkRequest, SalaryBenchmarkResult } from '@/types/ai';

const mockResult: SalaryBenchmarkResult = {
  suggestedMin: 650000,
  suggestedMax: 850000,
  suggestedTarget: 750000,
  currency: 'ZAR',
  justification: 'Based on market data for similar roles in the region, accounting for experience level and industry standards.',
  marketFactors: ['High demand for this skill set', 'Regional cost of living adjustments', 'Industry-standard compensation ranges'],
  dataPointsUsed: 12,
};

export const aiSalaryBenchmarkService = {
  async analyze(request: SalaryBenchmarkRequest): Promise<SalaryBenchmarkResult> {
    const data = await tryApi<SalaryBenchmarkResult>('/api/ai/salary-benchmark/analyze', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return data ?? mockResult;
  },
};
