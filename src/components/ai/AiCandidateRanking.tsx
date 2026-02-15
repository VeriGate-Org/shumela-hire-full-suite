'use client';

import React, { useState, useMemo } from 'react';
import { aiCvScreeningService } from '@/services/aiCvScreeningService';
import AiDisclaimer from './AiDisclaimer';
import { CvRankingEntry } from '@/types/ai';

interface AiCandidateRankingProps {
  jobId: string;
  jobRequirements?: string[];
}

const DEFAULT_WEIGHTS: Record<string, number> = {
  skills: 40,
  experience: 30,
  education: 20,
  keywords: 10,
};

const FACTOR_COLORS: Record<string, string> = {
  skills: 'bg-violet-500',
  experience: 'bg-blue-500',
  education: 'bg-emerald-500',
  keywords: 'bg-amber-500',
};

function getFactorColor(factor: string): string {
  const key = factor.toLowerCase();
  for (const [name, color] of Object.entries(FACTOR_COLORS)) {
    if (key.includes(name)) return color;
  }
  return 'bg-gray-400';
}

export default function AiCandidateRanking({ jobId, jobRequirements = [] }: AiCandidateRankingProps) {
  const [rankings, setRankings] = useState<CvRankingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showWeightAdjust, setShowWeightAdjust] = useState(false);
  const [customWeights, setCustomWeights] = useState<Record<string, number>>({});

  const activeWeights = useMemo(() => {
    const hasCustom = Object.keys(customWeights).length > 0;
    return hasCustom ? customWeights : DEFAULT_WEIGHTS;
  }, [customWeights]);

  const sortedRankings = useMemo(() => {
    if (Object.keys(customWeights).length === 0) return rankings;

    const totalWeight = Object.values(customWeights).reduce((sum, w) => sum + w, 0);
    if (totalWeight === 0) return rankings;

    const scored = rankings.map(entry => {
      if (!entry.scoringFactors || entry.scoringFactors.length === 0) {
        return { entry, weightedScore: entry.overallScore };
      }

      let weightedScore = 0;
      for (const factor of entry.scoringFactors) {
        const key = factor.factor.toLowerCase();
        let matchedWeight = 0;
        for (const [wKey, wVal] of Object.entries(customWeights)) {
          if (key.includes(wKey.toLowerCase())) {
            matchedWeight = wVal;
            break;
          }
        }
        if (matchedWeight > 0) {
          weightedScore += (factor.contribution / 100) * (matchedWeight / totalWeight) * 100;
        }
      }

      return { entry, weightedScore: Math.round(weightedScore) || entry.overallScore };
    });

    scored.sort((a, b) => b.weightedScore - a.weightedScore);

    return scored.map((item, idx) => ({
      ...item.entry,
      rank: idx + 1,
      overallScore: item.weightedScore,
    }));
  }, [rankings, customWeights]);

  const handleRank = async () => {
    setLoading(true);
    try {
      const data = await aiCvScreeningService.rankCandidates(jobId, jobRequirements);
      setRankings(data);
    } catch (error) {
      console.error('Failed to rank candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-700 bg-green-100';
    if (score >= 60) return 'text-yellow-700 bg-yellow-100';
    return 'text-red-700 bg-red-100';
  };

  const handleWeightChange = (factor: string, value: number) => {
    setCustomWeights(prev => ({ ...prev, [factor]: value }));
  };

  const handleResetWeights = () => {
    setCustomWeights({});
  };

  const displayRankings = sortedRankings;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-violet-500" />
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">AI Candidate Ranking</h3>
          <span className="text-[10px] font-medium bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded">AI-generated</span>
        </div>
        <button onClick={handleRank} disabled={loading}
          className="px-3 py-1.5 text-xs bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50">
          {loading ? 'Ranking...' : 'Rank Candidates'}
        </button>
      </div>

      {rankings.length > 0 && (
        <div className="space-y-2">
          {/* Adjust weights section */}
          <div className="border border-gray-200 rounded-lg bg-white">
            <button
              onClick={() => setShowWeightAdjust(!showWeightAdjust)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span>Adjust weights</span>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${showWeightAdjust ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showWeightAdjust && (
              <div className="px-3 pb-3 border-t border-gray-100 space-y-3 mt-0">
                <p className="text-[11px] text-gray-500 mt-2">
                  Adjust the relative importance of each factor. Rankings will re-sort automatically.
                </p>
                {Object.entries(DEFAULT_WEIGHTS).map(([factor, defaultVal]) => {
                  const currentVal = activeWeights[factor] ?? defaultVal;
                  return (
                    <div key={factor}>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-gray-700 font-medium capitalize">{factor}</span>
                        <span className="text-gray-500 tabular-nums">{currentVal}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={currentVal}
                        onChange={e => handleWeightChange(factor, parseInt(e.target.value, 10))}
                        className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-violet-600"
                      />
                    </div>
                  );
                })}
                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleResetWeights}
                    className="text-xs text-gray-500 hover:text-gray-700 underline underline-offset-2 transition-colors"
                  >
                    Reset to default
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Ranking entries */}
          {displayRankings.map(entry => (
            <div key={entry.applicationId}
              className="border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
              <div className="flex items-center justify-between p-3 cursor-pointer"
                onClick={() => toggleExpand(entry.applicationId)}>
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 flex items-center justify-center rounded-full bg-violet-100 text-violet-700 text-xs font-bold">
                    #{entry.rank}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{entry.candidateName}</span>
                </div>
                <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getScoreColor(entry.overallScore)}`}>
                  {entry.overallScore}%
                </span>
              </div>
              {expanded.has(entry.applicationId) && (
                <div className="px-3 pb-3 pt-0 border-t border-gray-200">
                  <p className="text-xs text-gray-600 mt-2">{entry.quickSummary}</p>

                  {/* Ranking factors */}
                  {entry.scoringFactors && entry.scoringFactors.length > 0 && (
                    <div className="mt-3">
                      <h5 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Ranking Factors
                      </h5>
                      <div className="space-y-1.5">
                        {entry.scoringFactors.map((sf, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="text-[11px] text-gray-600 w-20 shrink-0 truncate" title={sf.factor}>
                              {sf.factor}
                            </span>
                            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${getFactorColor(sf.factor)}`}
                                style={{ width: `${Math.min(sf.contribution, 100)}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-gray-500 tabular-nums w-8 text-right">
                              {sf.contribution}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          <AiDisclaimer level="high-risk" />
        </div>
      )}
    </div>
  );
}
