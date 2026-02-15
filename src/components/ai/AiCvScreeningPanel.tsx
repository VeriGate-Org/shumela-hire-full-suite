'use client';

import React, { useState } from 'react';
import { aiCvScreeningService } from '@/services/aiCvScreeningService';
import { CvScreeningResult } from '@/types/ai';

interface AiCvScreeningPanelProps {
  applicationId: string;
  jobRequirements?: string[];
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const getColor = (s: number) => {
    if (s >= 80) return 'bg-green-500';
    if (s >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div>
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span>{label}</span>
        <span className="font-medium">{score}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`h-2 rounded-full ${getColor(score)}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export default function AiCvScreeningPanel({ applicationId, jobRequirements = [] }: AiCvScreeningPanelProps) {
  const [result, setResult] = useState<CvScreeningResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleScreen = async () => {
    setLoading(true);
    try {
      const data = await aiCvScreeningService.screenCandidate(applicationId, jobRequirements);
      setResult(data);
    } catch (error) {
      console.error('Failed to screen candidate:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-violet-500" />
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">AI CV Screening</h3>
        </div>
        <button onClick={handleScreen} disabled={loading}
          className="px-3 py-1.5 text-xs bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50">
          {loading ? 'Screening...' : 'Screen Candidate'}
        </button>
      </div>

      {result && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
          {/* Scores */}
          <div className="space-y-3">
            <ScoreBar label="Overall Match" score={result.overallScore} />
            <ScoreBar label="Skills Match" score={result.skillsMatchScore} />
            <ScoreBar label="Experience Match" score={result.experienceMatchScore} />
          </div>

          {/* Matched / Missing Skills */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Matched Skills</h5>
              <div className="flex flex-wrap gap-1">
                {result.matchedSkills?.map((s, i) => (
                  <span key={i} className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">{s}</span>
                ))}
              </div>
            </div>
            <div>
              <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Missing Skills</h5>
              <div className="flex flex-wrap gap-1">
                {result.missingSkills?.map((s, i) => (
                  <span key={i} className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">{s}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Strengths / Concerns */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Strengths</h5>
              <ul className="space-y-1">
                {result.strengths?.map((s, i) => (
                  <li key={i} className="text-xs text-gray-700 flex items-start gap-1">
                    <span className="text-green-500 mt-0.5">+</span>{s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Concerns</h5>
              <ul className="space-y-1">
                {result.concerns?.map((c, i) => (
                  <li key={i} className="text-xs text-gray-700 flex items-start gap-1">
                    <span className="text-red-500 mt-0.5">-</span>{c}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Summary */}
          {result.summary && (
            <div className="pt-2 border-t border-gray-200">
              <p className="text-sm text-gray-700 leading-relaxed">{result.summary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
