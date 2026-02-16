'use client';

import React, { useState } from 'react';
import { aiCandidateSummaryService } from '@/services/aiCandidateSummaryService';
import AiDisclaimer from './AiDisclaimer';
import { CandidateSummaryResult } from '@/types/ai';

interface AiCandidateSummaryProps {
  applicationId: string;
}

export default function AiCandidateSummary({ applicationId }: AiCandidateSummaryProps) {
  const [result, setResult] = useState<CandidateSummaryResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSummarize = async () => {
    setLoading(true);
    try {
      const data = await aiCandidateSummaryService.summarize(applicationId);
      setResult(data);
    } catch (error) {
      console.error('Failed to summarize candidate:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-teal-500" />
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">AI Candidate Summary</h3>
          <span className="text-[10px] font-medium bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded">AI-generated</span>
        </div>
        <button onClick={handleSummarize} disabled={loading}
          className="px-3 py-1.5 text-xs bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50">
          {loading ? 'Summarizing...' : 'Summarize'}
        </button>
      </div>

      {result && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
          {result.executiveSummary && (
            <div>
              <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Executive Summary</h5>
              <p className="text-sm text-gray-700 leading-relaxed">{result.executiveSummary}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {result.educationSummary && (
              <div>
                <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Education</h5>
                <p className="text-sm text-gray-700">{result.educationSummary}</p>
              </div>
            )}
            {result.experienceSummary && (
              <div>
                <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Experience</h5>
                <p className="text-sm text-gray-700">{result.experienceSummary}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {result.keyStrengths && result.keyStrengths.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Key Strengths</h5>
                <ul className="space-y-1">
                  {result.keyStrengths.map((s, i) => (
                    <li key={i} className="text-xs text-gray-700 flex items-start gap-1">
                      <span className="text-green-500 mt-0.5">+</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.potentialGaps && result.potentialGaps.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Potential Gaps</h5>
                <ul className="space-y-1">
                  {result.potentialGaps.map((g, i) => (
                    <li key={i} className="text-xs text-gray-700 flex items-start gap-1">
                      <span className="text-orange-500 mt-0.5">!</span>{g}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {result.fitAssessment && (
            <div className="pt-2 border-t border-gray-200">
              <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Fit Assessment</h5>
              <p className="text-sm text-gray-700 leading-relaxed">{result.fitAssessment}</p>
            </div>
          )}
          <AiDisclaimer level="high-risk" />
        </div>
      )}
    </div>
  );
}
