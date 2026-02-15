'use client';

import React, { useState } from 'react';
import { aiCvScreeningService } from '@/services/aiCvScreeningService';
import { CvRankingEntry } from '@/types/ai';

interface AiCandidateRankingProps {
  jobId: string;
  jobRequirements?: string[];
}

export default function AiCandidateRanking({ jobId, jobRequirements = [] }: AiCandidateRankingProps) {
  const [rankings, setRankings] = useState<CvRankingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-violet-500" />
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">AI Candidate Ranking</h3>
        </div>
        <button onClick={handleRank} disabled={loading}
          className="px-3 py-1.5 text-xs bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50">
          {loading ? 'Ranking...' : 'Rank Candidates'}
        </button>
      </div>

      {rankings.length > 0 && (
        <div className="space-y-2">
          {rankings.map(entry => (
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
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
