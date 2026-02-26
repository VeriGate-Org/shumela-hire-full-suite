'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api-fetch';

interface CheckType {
  code: string;
  name: string;
  description: string;
  turnaround: string;
  price: number;
  currency: string;
}

interface BackgroundCheck {
  id: number;
  referenceId: string;
  candidateIdNumber: string;
  candidateName: string;
  candidateEmail: string;
  checkTypes: string;
  status: string;
  overallResult: string | null;
  resultsJson: string | null;
  consentObtained: boolean;
  provider: string;
  errorMessage: string | null;
  createdAt: string;
  submittedAt: string | null;
  completedAt: string | null;
}

interface BackgroundCheckPanelProps {
  applicationId: number;
  candidateName: string;
  candidateEmail: string;
  onClose: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
  INITIATED: { label: 'Initiated', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200', icon: 'clock' },
  PENDING_CONSENT: { label: 'Pending Consent', color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200', icon: 'shield' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-indigo-700', bgColor: 'bg-indigo-50 border-indigo-200', icon: 'spinner' },
  PARTIAL_RESULTS: { label: 'Partial Results', color: 'text-purple-700', bgColor: 'bg-purple-50 border-purple-200', icon: 'chart' },
  COMPLETED: { label: 'Completed', color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200', icon: 'check' },
  FAILED: { label: 'Failed', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200', icon: 'x' },
  CANCELLED: { label: 'Cancelled', color: 'text-gray-700', bgColor: 'bg-gray-50 border-gray-200', icon: 'ban' },
};

const RESULT_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
  CLEAR: { label: 'Clear', color: 'text-emerald-700', bgColor: 'bg-emerald-50', icon: 'check-circle' },
  ADVERSE: { label: 'Adverse', color: 'text-red-700', bgColor: 'bg-red-50', icon: 'exclamation-circle' },
  PENDING_REVIEW: { label: 'Pending Review', color: 'text-amber-700', bgColor: 'bg-amber-50', icon: 'eye' },
  INCONCLUSIVE: { label: 'Inconclusive', color: 'text-gray-700', bgColor: 'bg-gray-50', icon: 'question-circle' },
};

export default function BackgroundCheckPanel({
  applicationId,
  candidateName,
  candidateEmail,
  onClose,
}: BackgroundCheckPanelProps) {
  const [checks, setChecks] = useState<BackgroundCheck[]>([]);
  const [checkTypes, setCheckTypes] = useState<CheckType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showInitForm, setShowInitForm] = useState(false);
  const [selectedCheckTypes, setSelectedCheckTypes] = useState<string[]>([]);
  const [candidateIdNumber, setCandidateIdNumber] = useState('');
  const [consentObtained, setConsentObtained] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadChecks = useCallback(async () => {
    try {
      const response = await apiFetch(`/api/background-checks/applications/${applicationId}`);
      setChecks(await response.json());
    } catch (err) {
      console.error('Failed to load background checks:', err);
    }
  }, [applicationId]);

  const loadCheckTypes = useCallback(async () => {
    try {
      const response = await apiFetch('/api/background-checks/check-types');
      setCheckTypes(await response.json());
    } catch (err) {
      console.error('Failed to load check types:', err);
    }
  }, []);

  useEffect(() => {
    Promise.all([loadChecks(), loadCheckTypes()]).finally(() => setLoading(false));
  }, [loadChecks, loadCheckTypes]);

  const handleInitiate = async () => {
    if (!candidateIdNumber.trim()) {
      setError('Candidate ID number is required');
      return;
    }
    if (selectedCheckTypes.length === 0) {
      setError('Select at least one check type');
      return;
    }
    if (!consentObtained) {
      setError('Candidate consent is required before initiating checks');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await apiFetch(`/api/background-checks/applications/${applicationId}/initiate`, {
        method: 'POST',
        body: JSON.stringify({
          candidateIdNumber,
          candidateName,
          candidateEmail,
          checkTypes: selectedCheckTypes,
          consentObtained,
          initiatedBy: 1, // Current user — replaced by auth context in production
        }),
      });

      setShowInitForm(false);
      setSelectedCheckTypes([]);
      setCandidateIdNumber('');
      setConsentObtained(false);
      await loadChecks();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to initiate background check');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (referenceId: string) => {
    try {
      await apiFetch(`/api/background-checks/${referenceId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Cancelled by user' }),
      });
      await loadChecks();
    } catch (err) {
      console.error('Failed to cancel check:', err);
    }
  };

  const handleDownloadReport = async (referenceId: string) => {
    try {
      const response = await fetch(`/api/background-checks/${referenceId}/report`, {
        headers: { 'Accept': 'application/pdf' },
      });
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `verification-report-${referenceId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download report:', err);
    }
  };

  const toggleCheckType = (code: string) => {
    setSelectedCheckTypes(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const totalCost = selectedCheckTypes.reduce((sum, code) => {
    const ct = checkTypes.find(t => t.code === code);
    return sum + (ct?.price || 0);
  }, 0);

  const parseResults = (resultsJson: string | null): Record<string, { status: string; details?: string }> => {
    if (!resultsJson) return {};
    try {
      return JSON.parse(resultsJson);
    } catch {
      return {};
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div className="flex items-center justify-center space-x-2 text-gray-500">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Loading verification checks...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-semibold text-violet-950">Background Verification</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {candidateName} &mdash; Powered by Dots Africa (NCR: NCRCB38)
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {!showInitForm && (
            <button
              onClick={() => setShowInitForm(true)}
              className="px-4 py-2 bg-gold-500 text-white text-sm font-medium rounded-lg hover:bg-gold-600 transition-colors"
            >
              + New Check
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Initiate Form */}
      {showInitForm && (
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-semibold text-violet-950 mb-4">Initiate Verification Check</h3>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* ID Number */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SA ID Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={candidateIdNumber}
              onChange={e => setCandidateIdNumber(e.target.value)}
              placeholder="e.g. 9501015800088"
              maxLength={13}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
            />
          </div>

          {/* Check Types */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Check Types <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {checkTypes.map(ct => (
                <label
                  key={ct.code}
                  className={`flex items-start p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedCheckTypes.includes(ct.code)
                      ? 'bg-gold-50 border-gold-300'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedCheckTypes.includes(ct.code)}
                    onChange={() => toggleCheckType(ct.code)}
                    className="mt-0.5 h-4 w-4 text-gold-500 border-gray-300 rounded focus:ring-gold-500"
                  />
                  <div className="ml-3 flex-1">
                    <span className="text-sm font-medium text-gray-900">{ct.name}</span>
                    <p className="text-xs text-gray-500 mt-0.5">{ct.description}</p>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className="text-xs text-gray-400">{ct.turnaround}</span>
                      <span className="text-xs font-medium text-gray-600">
                        R{ct.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Cost Summary */}
          {selectedCheckTypes.length > 0 && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-violet-50 border border-violet-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-violet-700">
                  {selectedCheckTypes.length} check{selectedCheckTypes.length > 1 ? 's' : ''} selected
                </span>
                <span className="text-sm font-semibold text-violet-900">
                  Total: R{totalCost.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Consent */}
          <div className="mb-5">
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={consentObtained}
                onChange={e => setConsentObtained(e.target.checked)}
                className="mt-0.5 h-4 w-4 text-gold-500 border-gray-300 rounded focus:ring-gold-500"
              />
              <span className="text-sm text-gray-700">
                I confirm that written POPIA-compliant consent has been obtained from the candidate
                for these verification checks.
                <span className="text-red-500"> *</span>
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleInitiate}
              disabled={submitting}
              className="px-5 py-2 bg-gold-500 text-white text-sm font-medium rounded-lg hover:bg-gold-600 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Initiating...' : 'Initiate Checks'}
            </button>
            <button
              onClick={() => {
                setShowInitForm(false);
                setError(null);
              }}
              className="px-5 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Checks List */}
      <div className="px-6 py-4">
        {checks.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <p className="mt-3 text-sm text-gray-500">No verification checks initiated yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {checks.map(check => {
              const statusCfg = STATUS_CONFIG[check.status] || STATUS_CONFIG.INITIATED;
              const resultCfg = check.overallResult ? RESULT_CONFIG[check.overallResult] : null;
              const results = parseResults(check.resultsJson);
              const checkTypeList: string[] = (() => {
                try { return JSON.parse(check.checkTypes || '[]'); } catch { return []; }
              })();

              return (
                <div key={check.id} className={`border rounded-lg p-4 ${statusCfg.bgColor}`}>
                  {/* Check Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusCfg.color} ${statusCfg.bgColor}`}>
                        {statusCfg.label}
                      </span>
                      {resultCfg && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${resultCfg.color} ${resultCfg.bgColor}`}>
                          {resultCfg.label}
                        </span>
                      )}
                      <span className="text-xs text-gray-500 font-mono">{check.referenceId}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {check.status === 'COMPLETED' && (
                        <button
                          onClick={() => handleDownloadReport(check.referenceId)}
                          className="text-xs px-3 py-1 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 transition-colors"
                        >
                          Download Report
                        </button>
                      )}
                      {['INITIATED', 'PENDING_CONSENT', 'IN_PROGRESS'].includes(check.status) && (
                        <button
                          onClick={() => handleCancel(check.referenceId)}
                          className="text-xs px-3 py-1 bg-white border border-red-200 rounded-md hover:bg-red-50 text-red-600 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Check Types */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {checkTypeList.map(ct => {
                      const result = results[ct];
                      const resultColor = result?.status === 'CLEAR'
                        ? 'bg-emerald-100 text-emerald-700'
                        : result?.status === 'ADVERSE'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-600';

                      return (
                        <span
                          key={ct}
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${resultColor}`}
                          title={result?.details || ct}
                        >
                          {ct.replace(/_/g, ' ')}
                          {result?.status === 'CLEAR' && ' \u2713'}
                          {result?.status === 'ADVERSE' && ' \u2717'}
                        </span>
                      );
                    })}
                  </div>

                  {/* Meta */}
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>Initiated {new Date(check.createdAt).toLocaleDateString('en-ZA')}</span>
                    {check.completedAt && (
                      <span>Completed {new Date(check.completedAt).toLocaleDateString('en-ZA')}</span>
                    )}
                    <span className="font-mono">{check.candidateIdNumber}</span>
                  </div>

                  {/* Error Message */}
                  {check.errorMessage && (
                    <div className="mt-2 text-xs text-red-600 bg-red-50 rounded px-3 py-2">
                      {check.errorMessage}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
