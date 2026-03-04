'use client';

import React, { useState } from 'react';
import { aiReportNarrativeService } from '@/services/aiReportNarrativeService';
import AiDisclaimer from './AiDisclaimer';
import { ReportNarrativeResult } from '@/types/ai';

interface AiReportNarrativeProps {
  reportType?: string;
  jobId?: string;
  reportData?: Record<string, unknown>;
  onIncludeInReport?: (narrative: ReportNarrativeResult) => void;
}

export default function AiReportNarrative({ reportType, jobId, reportData, onIncludeInReport }: AiReportNarrativeProps) {
  const [audience, setAudience] = useState<'executive' | 'hr' | 'hiring_manager'>('executive');
  const [tone, setTone] = useState<'formal' | 'concise' | 'detailed'>('formal');
  const [result, setResult] = useState<ReportNarrativeResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = await aiReportNarrativeService.generate({
        reportType: reportType || 'vacancy',
        jobId,
        reportData: reportData || {},
        audience,
        tone,
      });
      setResult(data);
    } catch (error) {
      console.error('Failed to generate narrative:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Audience</label>
          <div className="flex gap-2">
            {(['executive', 'hr', 'hiring_manager'] as const).map(a => (
              <button key={a} onClick={() => setAudience(a)}
                className={`px-3 py-1.5 text-xs rounded-sm border ${audience === a ? 'bg-gold-500 text-violet-950 border-gold-500' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>
                {a === 'hiring_manager' ? 'Hiring Mgr' : a.charAt(0).toUpperCase() + a.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Tone</label>
          <div className="flex gap-2">
            {(['formal', 'concise', 'detailed'] as const).map(t => (
              <button key={t} onClick={() => setTone(t)}
                className={`px-3 py-1.5 text-xs rounded-sm border ${tone === t ? 'bg-gold-500 text-violet-950 border-gold-500' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button onClick={handleGenerate} disabled={loading}
        className="px-4 py-2 text-sm bg-gold-500 text-violet-950 rounded-sm hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed">
        {loading ? 'Generating...' : 'Generate Executive Summary'}
      </button>

      {result && (
        <div className="border border-gray-200 rounded-sm p-4 bg-gray-50 space-y-4">
          {result.executiveSummary && (
            <div>
              <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Executive Summary</h5>
              <p className="text-sm text-gray-700 leading-relaxed">{result.executiveSummary}</p>
            </div>
          )}

          {result.keyFindings && result.keyFindings.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Key Findings</h5>
              <ul className="space-y-1">
                {result.keyFindings.map((f, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-violet-500 mt-1">&#8226;</span>{f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.recommendations && result.recommendations.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Recommendations</h5>
              <ul className="space-y-1">
                {result.recommendations.map((r, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-violet-500 mt-1">&#8226;</span>{r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t border-gray-200">
            <button onClick={() => {
              const text = `Executive Summary:\n${result.executiveSummary}\n\nKey Findings:\n${result.keyFindings?.map(f => `- ${f}`).join('\n')}\n\nRecommendations:\n${result.recommendations?.map(r => `- ${r}`).join('\n')}`;
              navigator.clipboard.writeText(text);
            }} className="px-3 py-1.5 text-xs border border-gray-300 rounded-sm text-gray-700 hover:bg-gray-100">
              Copy
            </button>
            {onIncludeInReport && (
              <button onClick={() => onIncludeInReport(result)}
                className="px-3 py-1.5 text-xs bg-gold-500 text-violet-950 rounded-sm hover:bg-gold-600">
                Include in Report
              </button>
            )}
          </div>
          <AiDisclaimer level="advisory" />
        </div>
      )}
    </div>
  );
}
