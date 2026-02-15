'use client';

import React, { useState } from 'react';
import { aiSalaryBenchmarkService } from '@/services/aiSalaryBenchmarkService';
import { SalaryBenchmarkRequest, SalaryBenchmarkResult } from '@/types/ai';

interface AiSalaryBenchmarkProps {
  positionTitle?: string;
  department?: string;
  level?: string;
  onApply?: (min: number, max: number, target: number) => void;
}

function formatCurrency(value: number, currency: string = 'ZAR'): string {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
}

export default function AiSalaryBenchmark({ positionTitle, department, level, onApply }: AiSalaryBenchmarkProps) {
  const [form, setForm] = useState<SalaryBenchmarkRequest>({
    positionTitle: positionTitle || '',
    department: department || '',
    jobGrade: '',
    level: level || '',
    location: 'South Africa',
  });
  const [result, setResult] = useState<SalaryBenchmarkResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const data = await aiSalaryBenchmarkService.analyze(form);
      setResult(data);
    } catch (error) {
      console.error('Failed to analyze salary benchmark:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-violet-500" />
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">AI Salary Benchmark</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Position</label>
          <input type="text" value={form.positionTitle} onChange={e => setForm(prev => ({ ...prev, positionTitle: e.target.value }))}
            className="w-full text-sm p-2 border border-gray-300 rounded-md" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Department</label>
          <input type="text" value={form.department} onChange={e => setForm(prev => ({ ...prev, department: e.target.value }))}
            className="w-full text-sm p-2 border border-gray-300 rounded-md" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Level</label>
          <input type="text" value={form.level} onChange={e => setForm(prev => ({ ...prev, level: e.target.value }))}
            className="w-full text-sm p-2 border border-gray-300 rounded-md" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Location</label>
          <input type="text" value={form.location} onChange={e => setForm(prev => ({ ...prev, location: e.target.value }))}
            className="w-full text-sm p-2 border border-gray-300 rounded-md" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Current Salary (optional)</label>
          <input type="number" value={form.candidateCurrentSalary || ''} onChange={e => setForm(prev => ({ ...prev, candidateCurrentSalary: e.target.value ? Number(e.target.value) : undefined }))}
            className="w-full text-sm p-2 border border-gray-300 rounded-md" placeholder="e.g. 600000" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Expected Salary (optional)</label>
          <input type="number" value={form.candidateExpectedSalary || ''} onChange={e => setForm(prev => ({ ...prev, candidateExpectedSalary: e.target.value ? Number(e.target.value) : undefined }))}
            className="w-full text-sm p-2 border border-gray-300 rounded-md" placeholder="e.g. 750000" />
        </div>
      </div>

      <button onClick={handleAnalyze} disabled={loading || !form.positionTitle}
        className="px-4 py-2 text-sm bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed">
        {loading ? 'Analysing...' : 'Analyse Salary'}
      </button>

      {result && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
          {/* Range bar */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{formatCurrency(result.suggestedMin, result.currency)}</span>
              <span className="font-semibold text-violet-700">{formatCurrency(result.suggestedTarget, result.currency)}</span>
              <span>{formatCurrency(result.suggestedMax, result.currency)}</span>
            </div>
            <div className="relative w-full h-3 bg-gray-200 rounded-full">
              <div className="absolute h-3 bg-violet-200 rounded-full" style={{
                left: '0%',
                width: '100%',
              }} />
              <div className="absolute h-3 bg-violet-500 rounded-full" style={{
                left: `${((result.suggestedTarget - result.suggestedMin) / (result.suggestedMax - result.suggestedMin)) * 100}%`,
                width: '4px',
                transform: 'translateX(-50%)',
              }} />
            </div>
          </div>

          {/* Justification */}
          <p className="text-sm text-gray-700 leading-relaxed">{result.justification}</p>

          {/* Market Factors */}
          {result.marketFactors && result.marketFactors.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Market Factors</h5>
              <ul className="space-y-1">
                {result.marketFactors.map((f, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                    <span className="text-violet-500 mt-0.5">&#8226;</span>{f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <span className="text-xs text-gray-500">Based on {result.dataPointsUsed} data points</span>
            {onApply && (
              <button onClick={() => onApply(result.suggestedMin, result.suggestedMax, result.suggestedTarget)}
                className="px-3 py-1.5 text-xs bg-violet-600 text-white rounded-md hover:bg-violet-700">
                Apply Suggestion
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
