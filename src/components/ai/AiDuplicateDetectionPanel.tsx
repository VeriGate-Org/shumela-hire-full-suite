'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { aiDuplicateDetectionService } from '@/services/aiDuplicateDetectionService';
import AiDisclaimer from './AiDisclaimer';
import { DuplicateCandidate } from '@/types/ai';

interface AiDuplicateDetectionPanelProps {
  fullName: string;
  email: string;
  phone?: string;
  idNumber?: string;
  autoCheck?: boolean;
  onViewCandidate?: (applicantId: string) => void;
}

export default function AiDuplicateDetectionPanel({
  fullName, email, phone, idNumber, autoCheck = false, onViewCandidate
}: AiDuplicateDetectionPanelProps) {
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  const handleCheck = useCallback(async () => {
    setLoading(true);
    try {
      const data = await aiDuplicateDetectionService.check({
        fullName, email, phone: phone || '', idNumber: idNumber || '',
      });
      setDuplicates(data.duplicates);
      setMessage(data.message);
      setChecked(true);
    } catch (error) {
      console.error('Failed to check duplicates:', error);
    } finally {
      setLoading(false);
    }
  }, [fullName, email, phone, idNumber]);

  useEffect(() => {
    if (autoCheck && fullName && email && !checked) {
      handleCheck();
    }
  }, [autoCheck, fullName, email, checked, handleCheck]);

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return 'text-red-700 bg-red-100';
    if (score >= 70) return 'text-orange-700 bg-orange-100';
    return 'text-yellow-700 bg-yellow-100';
  };

  return (
    <div className="space-y-3">
      {!autoCheck && (
        <div className="flex justify-end">
          <button onClick={handleCheck} disabled={loading}
            className="px-3 py-1.5 text-xs bg-gold-500 text-violet-950 rounded-full hover:bg-gold-600 disabled:opacity-50">
            {loading ? 'Checking...' : 'Check Duplicates'}
          </button>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="animate-spin h-4 w-4 border-2 border-gold-500 border-t-transparent rounded-full" />
          Checking for duplicates...
        </div>
      )}

      {checked && duplicates.length === 0 && (
        <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-sm px-3 py-2">
          {message}
        </div>
      )}

      {duplicates.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-sm px-3 py-2">
            {message}
          </div>
          {duplicates.map((dup, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-sm">
              <div>
                <p className="text-sm font-medium text-gray-900">{dup.fullName}</p>
                <p className="text-xs text-gray-500">{dup.email}</p>
                <p className="text-xs text-gray-500 mt-0.5">{dup.matchReason}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getConfidenceColor(dup.confidenceScore)}`}>
                  {dup.confidenceScore}% match
                </span>
                {onViewCandidate && (
                  <button onClick={() => onViewCandidate(dup.applicantId)}
                    className="text-xs px-2 py-1 text-violet-700 border border-violet-200 rounded hover:bg-gold-50">
                    View
                  </button>
                )}
              </div>
            </div>
          ))}
          <AiDisclaimer level="high-risk" />
        </div>
      )}
    </div>
  );
}
