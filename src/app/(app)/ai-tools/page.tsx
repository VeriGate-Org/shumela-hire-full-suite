'use client';

import React from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import AiSmartSearch from '@/components/ai/AiSmartSearch';
import AiEmailDrafter from '@/components/ai/AiEmailDrafter';
import AiJobDescriptionWriter from '@/components/ai/AiJobDescriptionWriter';
import AiSalaryBenchmark from '@/components/ai/AiSalaryBenchmark';
import AiAssistPanel from '@/components/ai/AiAssistPanel';
import AiDisclaimer from '@/components/ai/AiDisclaimer';

export default function AiToolsPage() {
  return (
    <FeatureGate feature="AI_ENABLED">
      <PageWrapper
        title="AI Tools"
        subtitle="AI-powered tools to accelerate your recruitment workflows"
      >
        <div className="space-y-8">
          {/* Disclaimer banner */}
          <AiDisclaimer level="advisory" provider="ShumelaHire AI" />

          {/* Smart Search — primary, full-width */}
          <AiAssistPanel
            title="Smart Search"
            feature="AI_SEARCH"
            description="Search candidates using natural language queries instead of manual filters"
            defaultExpanded
          >
            <AiSmartSearch />
          </AiAssistPanel>

          {/* Two-column layout for drafting tools */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AiAssistPanel
              title="Email Drafter"
              feature="AI_EMAIL_DRAFTER"
              description="Draft interview invitations, rejections, offers, and follow-ups"
            >
              <AiEmailDrafter />
            </AiAssistPanel>

            <AiAssistPanel
              title="Job Description Writer"
              feature="AI_JOB_DESCRIPTION"
              description="Generate complete job descriptions with built-in bias checking"
            >
              <AiJobDescriptionWriter />
            </AiAssistPanel>
          </div>

          {/* Salary Benchmark — full-width */}
          <AiAssistPanel
            title="Salary Benchmark"
            feature="AI_SALARY_BENCHMARK"
            description="Analyse market salary data and get recommendations for any position"
          >
            <AiSalaryBenchmark />
          </AiAssistPanel>
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
