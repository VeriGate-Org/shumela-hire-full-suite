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

/* ------------------------------------------------------------------ */
/*  Icon components matching the mock SVGs                             */
/* ------------------------------------------------------------------ */

function SearchIcon() {
  return (
    <svg
      className="w-[22px] h-[22px]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <path d="M11 8a3 3 0 0 1 3 3" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      className="w-[22px] h-[22px]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function FileTextIcon() {
  return (
    <svg
      className="w-[22px] h-[22px]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function DollarIcon() {
  return (
    <svg
      className="w-[22px] h-[22px]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AiToolsPage() {
  return (
    <FeatureGate feature="AI_ENABLED">
      <PageWrapper
        title="AI Tools"
        subtitle="AI-powered features to streamline your recruitment workflow"
      >
        {/* 2x2 AI tool card grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* 1. Smart Search -- navy */}
          <AiAssistPanel
            title="Smart Search"
            feature="AI_SEARCH"
            description="Natural language candidate discovery"
            variant="navy"
            icon={<SearchIcon />}
            defaultExpanded
          >
            <AiSmartSearch />
          </AiAssistPanel>

          {/* 2. Email Drafter -- teal */}
          <AiAssistPanel
            title="Email Drafter"
            feature="AI_EMAIL_DRAFTER"
            description="AI-generated recruitment communications"
            variant="teal"
            icon={<MailIcon />}
          >
            <AiEmailDrafter />
          </AiAssistPanel>

          {/* 3. Job Description Writer -- gold */}
          <AiAssistPanel
            title="Job Description Writer"
            feature="AI_JOB_DESCRIPTION"
            description="Auto-generate inclusive, compliant JDs"
            variant="gold"
            icon={<FileTextIcon />}
          >
            <AiJobDescriptionWriter />
          </AiAssistPanel>

          {/* 4. Salary Benchmark -- pink */}
          <AiAssistPanel
            title="Salary Benchmark"
            feature="AI_SALARY_BENCHMARK"
            description="Market-aligned compensation insights"
            variant="pink"
            icon={<DollarIcon />}
          >
            <AiSalaryBenchmark />
          </AiAssistPanel>
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
