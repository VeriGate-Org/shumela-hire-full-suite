'use client';

import React, { useState } from 'react';
import { FeatureGate } from '@/components/FeatureGate';
import AiAssistPanel from './AiAssistPanel';
import AiCandidateSummary from './AiCandidateSummary';
import AiCvScreeningPanel from './AiCvScreeningPanel';
import AiScreeningNotesDrafter from './AiScreeningNotesDrafter';
import AiEmailDrafter from './AiEmailDrafter';

interface AiCandidatePanelProps {
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  jobRequirements?: string[];
  onApplyNotes?: (notes: string) => void;
  onSendEmail?: (subject: string, body: string) => void;
}

export default function AiCandidatePanel({
  applicationId,
  candidateName,
  jobTitle,
  jobRequirements = [],
  onApplyNotes,
  onSendEmail,
}: AiCandidatePanelProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'screening' | 'notes' | 'email'>('summary');

  const tabs = [
    { id: 'summary' as const, label: 'Summary', feature: 'AI_SCREENING_SUMMARY' },
    { id: 'screening' as const, label: 'CV Screening', feature: 'AI_SCREENING_CV' },
    { id: 'notes' as const, label: 'Notes', feature: 'AI_SCREENING_NOTES' },
    { id: 'email' as const, label: 'Email', feature: 'AI_EMAIL_DRAFTER' },
  ];

  return (
    <AiAssistPanel title="AI Candidate Assist" feature="AI_ENABLED" description="AI-powered screening, summaries, notes, and communication for this candidate">
      <div className="space-y-4">
        {/* Tab navigation */}
        <div className="flex gap-1 border-b border-gray-200">
          {tabs.map(tab => (
            <FeatureGate key={tab.id} feature={tab.feature}>
              <button
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-teal-700 border-b-2 border-teal-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            </FeatureGate>
          ))}
        </div>

        {/* Tab content */}
        <div>
          {activeTab === 'summary' && (
            <FeatureGate feature="AI_SCREENING_SUMMARY">
              <AiCandidateSummary applicationId={applicationId} />
            </FeatureGate>
          )}
          {activeTab === 'screening' && (
            <FeatureGate feature="AI_SCREENING_CV">
              <AiCvScreeningPanel applicationId={applicationId} jobRequirements={jobRequirements} />
            </FeatureGate>
          )}
          {activeTab === 'notes' && (
            <FeatureGate feature="AI_SCREENING_NOTES">
              <AiScreeningNotesDrafter
                applicationId={applicationId}
                candidateName={candidateName}
                jobTitle={jobTitle}
                onApply={onApplyNotes}
              />
            </FeatureGate>
          )}
          {activeTab === 'email' && (
            <FeatureGate feature="AI_EMAIL_DRAFTER">
              <AiEmailDrafter
                candidateName={candidateName}
                jobTitle={jobTitle}
                onSend={onSendEmail}
              />
            </FeatureGate>
          )}
        </div>
      </div>
    </AiAssistPanel>
  );
}
