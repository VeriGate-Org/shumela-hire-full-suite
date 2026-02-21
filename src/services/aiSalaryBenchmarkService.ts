import { tryApi } from '@/services/aiService';
import { SalaryBenchmarkRequest, SalaryBenchmarkResult } from '@/types/ai';

export const aiSalaryBenchmarkService = {
  async analyze(request: SalaryBenchmarkRequest): Promise<SalaryBenchmarkResult> {
    const data = await tryApi<SalaryBenchmarkResult>('/api/ai/salary-benchmark/analyze', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    if (!data) throw new Error('AI service unavailable');
    return data;
  },
};
