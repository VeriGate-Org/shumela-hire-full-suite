import { tryApi } from '@/services/aiService';
import { SalaryBenchmarkRequest, SalaryBenchmarkResult } from '@/types/ai';

const mockResult: any = {}; // TODO: Remove mock fallback

export const aiSalaryBenchmarkService = {
  async analyze(request: SalaryBenchmarkRequest): Promise<SalaryBenchmarkResult> {
    const data = await tryApi<SalaryBenchmarkResult>('/api/ai/salary-benchmark/analyze', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return data ?? mockResult;
  },
};
