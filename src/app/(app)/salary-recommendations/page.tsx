'use client';

import React from 'react';
import PageWrapper from '@/components/PageWrapper';
import SalaryRecommendationManager from '@/components/SalaryRecommendationManager';
import AiAssistPanel from '@/components/ai/AiAssistPanel';
import AiSalaryBenchmark from '@/components/ai/AiSalaryBenchmark';

export default function SalaryRecommendationsPage() {
  return (
    <PageWrapper
      title="Salary Recommendations"
      subtitle="Request, review, and approve salary recommendations for candidates"
    >
      <div className="space-y-6">
        <AiAssistPanel title="AI Salary Benchmark" feature="AI_SALARY_BENCHMARK" description="Analyse market salary data and get benchmark recommendations for any position">
          <AiSalaryBenchmark />
        </AiAssistPanel>

        <SalaryRecommendationManager />
      </div>
    </PageWrapper>
  );
}
