'use client';

import React, { useState } from 'react';
import { aiCvScreeningService } from '@/services/aiCvScreeningService';
import AiDisclaimer from './AiDisclaimer';
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

const WEIGHT_COLORS = [
  'bg-teal-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
];

export default function AiCvScreeningPanel({ applicationId, jobRequirements = [] }: AiCvScreeningPanelProps) {
  const [result, setResult] = useState<CvScreeningResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMethodology, setShowMethodology] = useState(false);

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

  const handleDisagree = () => {
    console.log('User disagreed with AI assessment', {
      applicationId,
      overallScore: result?.overallScore,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={handleScreen} disabled={loading}
          className="px-3 py-1.5 text-xs bg-gold-500 text-violet-950 rounded-full hover:bg-gold-600 disabled:opacity-50">
          {loading ? 'Screening...' : 'Screen Candidate'}
        </button>
      </div>

      {result && (
        <div className="border border-gray-200 rounded-sm p-4 bg-gray-50 space-y-4">
          {/* Scores */}
          <div className="space-y-3">
            <div>
              <ScoreBar label="Overall Match" score={result.overallScore} />
              {result.confidenceInterval && (
                <p className="text-[11px] text-gray-500 mt-1">
                  Score: {result.overallScore}% (range: {result.confidenceInterval.low}-{result.confidenceInterval.high}%)
                </p>
              )}
            </div>
            <ScoreBar label="Skills Match" score={result.skillsMatchScore} />
            <ScoreBar label="Experience Match" score={result.experienceMatchScore} />
          </div>

          {/* Explainability section */}
          {(result.scoringMethodology || result.weightBreakdown) && (
            <div className="border border-gray-200 rounded-sm bg-white">
              <button
                onClick={() => setShowMethodology(!showMethodology)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span>How was this score calculated?</span>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${showMethodology ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showMethodology && (
                <div className="px-3 pb-3 space-y-3 border-t border-gray-100">
                  {/* Scoring Methodology */}
                  {result.scoringMethodology && (
                    <div className="mt-3">
                      <h5 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Scoring Methodology
                      </h5>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {result.scoringMethodology}
                      </p>
                    </div>
                  )}

                  {/* Stacked weight bar */}
                  {result.weightBreakdown && result.weightBreakdown.length > 0 && (
                    <div>
                      <h5 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Weight Distribution
                      </h5>
                      <div className="flex w-full h-3 rounded-full overflow-hidden">
                        {result.weightBreakdown.map((item, idx) => (
                          <div
                            key={idx}
                            className={`${WEIGHT_COLORS[idx % WEIGHT_COLORS.length]} h-full`}
                            style={{ width: `${item.weight}%` }}
                            title={`${item.factor}: ${item.weight}%`}
                          />
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                        {result.weightBreakdown.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-sm ${WEIGHT_COLORS[idx % WEIGHT_COLORS.length]}`} />
                            <span className="text-[10px] text-gray-500">{item.factor} {item.weight}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Factor breakdown bars */}
                  {result.weightBreakdown && result.weightBreakdown.length > 0 && (
                    <div>
                      <h5 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Factor Breakdown
                      </h5>
                      <div className="space-y-2">
                        {result.weightBreakdown.map((item, idx) => (
                          <div key={idx}>
                            <div className="flex items-center justify-between text-[11px] mb-0.5">
                              <span className="text-gray-700 font-medium">{item.factor}</span>
                              <span className="text-gray-500">
                                {item.score}% (weight: {item.weight}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${WEIGHT_COLORS[idx % WEIGHT_COLORS.length]}`}
                                style={{ width: `${item.score}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-0.5">{item.explanation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Disagree button */}
                  <div className="pt-2 border-t border-gray-100">
                    <button
                      onClick={handleDisagree}
                      className="text-xs text-gray-500 hover:text-gray-700 underline underline-offset-2 transition-colors"
                    >
                      I disagree with this assessment
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

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
          <AiDisclaimer level="high-risk" />
        </div>
      )}
    </div>
  );
}
