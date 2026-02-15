'use client';

import React, { useState } from 'react';
import { aiOfferPredictionService } from '@/services/aiOfferPredictionService';
import { OfferPredictionResult } from '@/types/ai';

interface AiOfferPredictionProps {
  applicationId: string;
}

export default function AiOfferPrediction({ applicationId }: AiOfferPredictionProps) {
  const [proposedSalary, setProposedSalary] = useState<number>(0);
  const [benefitInput, setBenefitInput] = useState('');
  const [benefits, setBenefits] = useState<string[]>([]);
  const [result, setResult] = useState<OfferPredictionResult | null>(null);
  const [loading, setLoading] = useState(false);

  const addBenefit = () => {
    if (!benefitInput.trim()) return;
    setBenefits(prev => [...prev, benefitInput.trim()]);
    setBenefitInput('');
  };

  const handlePredict = async () => {
    setLoading(true);
    try {
      const data = await aiOfferPredictionService.predict({
        applicationId,
        proposedSalary,
        additionalBenefits: benefits,
      });
      setResult(data);
    } catch (error) {
      console.error('Failed to predict offer acceptance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HIGH': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getGaugeColor = (prob: number) => {
    if (prob >= 70) return 'border-green-500';
    if (prob >= 40) return 'border-yellow-500';
    return 'border-red-500';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-violet-500" />
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">AI Offer Prediction</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Proposed Salary (ZAR)</label>
          <input type="number" value={proposedSalary || ''} onChange={e => setProposedSalary(Number(e.target.value))}
            className="w-full text-sm p-2 border border-gray-300 rounded-md" placeholder="e.g. 750000" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Additional Benefits</label>
          <div className="flex gap-2">
            <input type="text" value={benefitInput} onChange={e => setBenefitInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addBenefit()}
              className="flex-1 text-sm p-2 border border-gray-300 rounded-md" placeholder="Add benefit" />
            <button onClick={addBenefit} className="px-2 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">+</button>
          </div>
          {benefits.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {benefits.map((b, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-50 text-violet-700 text-xs rounded-md">
                  {b}
                  <button onClick={() => setBenefits(prev => prev.filter((_, j) => j !== i))} className="text-violet-400 hover:text-violet-600">&times;</button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <button onClick={handlePredict} disabled={loading || !proposedSalary}
        className="px-4 py-2 text-sm bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed">
        {loading ? 'Predicting...' : 'Predict Acceptance'}
      </button>

      {result && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
          {/* Probability gauge */}
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full border-4 ${getGaugeColor(result.acceptanceProbability)} flex items-center justify-center`}>
              <span className="text-lg font-bold text-gray-900">{result.acceptanceProbability}%</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Acceptance Probability</p>
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getRiskColor(result.riskLevel)}`}>
                {result.riskLevel} Risk
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {result.positiveFactors && result.positiveFactors.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Positive Factors</h5>
                <ul className="space-y-1">
                  {result.positiveFactors.map((f, i) => (
                    <li key={i} className="text-xs text-gray-700 flex items-start gap-1">
                      <span className="text-green-500 mt-0.5">+</span>{f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.riskFactors && result.riskFactors.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Risk Factors</h5>
                <ul className="space-y-1">
                  {result.riskFactors.map((f, i) => (
                    <li key={i} className="text-xs text-gray-700 flex items-start gap-1">
                      <span className="text-red-500 mt-0.5">-</span>{f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {result.recommendations && result.recommendations.length > 0 && (
            <div className="pt-2 border-t border-gray-200">
              <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Recommendations</h5>
              <ul className="space-y-1">
                {result.recommendations.map((r, i) => (
                  <li key={i} className="text-xs text-gray-700 flex items-start gap-1">
                    <span className="text-violet-500 mt-0.5">&#8226;</span>{r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
