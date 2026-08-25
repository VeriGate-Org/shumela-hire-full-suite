'use client';

import React from 'react';
import PageWrapper from '@/components/PageWrapper';
import SalaryRecommendationManager from '@/components/SalaryRecommendationManager';
import AiAssistPanel from '@/components/ai/AiAssistPanel';
import AiSalaryBenchmark from '@/components/ai/AiSalaryBenchmark';

export default function SalaryRecommendationsPage() {
  // No title, subtitle or actions: SalaryRecommendationManager renders the IdentityBand, which is
  // this queue's page header. Passing one here is what produced two headers on the screen.
  return (
    <PageWrapper>
      <div className="space-y-6">
        <AiAssistPanel title="AI Salary Benchmark" feature="AI_SALARY_BENCHMARK" description="Analyse market salary data and get benchmark recommendations for any position">
          <AiSalaryBenchmark />
        </AiAssistPanel>

        <SalaryRecommendationManager />
      </div>
    </PageWrapper>
  );
}
