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
  applicationId: number | string;
  candidateName: string;
  candidateEmail: string;
  jobPostingId?: number | string;
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
  jobPostingId,
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
  const [requiredCheckTypes, setRequiredCheckTypes] = useState<string[]>([]);
  const [uploadedReports, setUploadedReports] = useState<Record<string, { name: string; url: string }>>({});
  const [uploading, setUploading] = useState<string | null>(null);

  const loadChecks = useCallback(async () => {
    try {
      const response = await apiFetch(`/api/background-checks/applications/${applicationId}`);
      if (!response.ok) return;
      const data = await response.json();
      if (Array.isArray(data)) setChecks(data);
    } catch (err) {
      console.error('Failed to load background checks:', err);
    }
  }, [applicationId]);

  const loadCheckTypes = useCallback(async () => {
    try {
      const response = await apiFetch('/api/background-checks/check-types');
      if (!response.ok) return;
      const data = await response.json();
      if (Array.isArray(data)) setCheckTypes(data);
    } catch (err) {
      console.error('Failed to load check types:', err);
    }
  }, []);

  const loadRequiredCheckTypes = useCallback(async () => {
    try {
      const response = await apiFetch(`/api/background-checks/applications/${applicationId}/required-check-types`);
      if (!response.ok) return;
      const data = await response.json();
      if (data.requiredCheckTypes) {
        try {
          const parsed = JSON.parse(data.requiredCheckTypes);
          if (Array.isArray(parsed)) {
            setRequiredCheckTypes(parsed);
            setSelectedCheckTypes(prev => {
              if (prev.length === 0) return parsed;
              return prev;
            });
          }
        } catch { /* ignore parse errors */ }
      }
    } catch {
      // gracefully ignore — job posting may not have required checks
    }
  }, [applicationId]);

  useEffect(() => {
    Promise.all([loadChecks(), loadCheckTypes(), loadRequiredCheckTypes()]).finally(() => setLoading(false));
  }, [loadChecks, loadCheckTypes, loadRequiredCheckTypes]);

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

  const handleUploadReport = (referenceId: string, file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are accepted');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be under 10 MB');
      return;
    }
    setUploading(referenceId);
    setError(null);

    // Mock upload — simulate a delay then store locally
    setTimeout(() => {
      const url = URL.createObjectURL(file);
      setUploadedReports(prev => ({ ...prev, [referenceId]: { name: file.name, url } }));
      setUploading(null);
    }, 1200);
  };

  const toggleCheckType = (code: string) => {
    setSelectedCheckTypes(prev => {
      if (prev.includes(code)) {
        if (requiredCheckTypes.includes(code)) {
          setError(`"${code.replace(/_/g, ' ')}" is a required check for this role. You can still deselect it, but it may block pipeline progression.`);
        }
        return prev.filter(c => c !== code);
      }
      setError(null);
      return [...prev, code];
    });
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
                    <span className="text-sm font-medium text-gray-900">
                      {ct.name}
                      {requiredCheckTypes.includes(ct.code) && (
                        <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-100 text-violet-700">
                          Required
                        </span>
                      )}
                    </span>
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

                  {/* Upload / View Screening Results PDF */}
                  <div className="mt-3 pt-3 border-t border-gray-200/60">
                    {uploadedReports[check.referenceId] ? (
                      <div className="flex items-center justify-between bg-white rounded-md border border-gray-200 px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <svg className="w-4 h-4 text-red-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M7 18h10V6H7v12zm2-10h2v4h1.5L10 15.5 7.5 12H9V8zm12-4h-3.17L14.17 2H9.83L8.17 4H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" />
                          </svg>
                          <span className="text-xs font-medium text-gray-700 truncate">
                            {uploadedReports[check.referenceId].name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <a
                            href={uploadedReports[check.referenceId].url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-2 py-1 text-[#05527E] hover:text-[#033d5e] font-medium"
                          >
                            View PDF
                          </a>
                          <button
                            onClick={() => setUploadedReports(prev => {
                              const next = { ...prev };
                              URL.revokeObjectURL(next[check.referenceId].url);
                              delete next[check.referenceId];
                              return next;
                            })}
                            className="text-xs px-2 py-1 text-red-500 hover:text-red-700 font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label
                        className={`flex items-center justify-center gap-2 px-3 py-3 border-2 border-dashed rounded-md cursor-pointer transition-colors ${
                          uploading === check.referenceId
                            ? 'border-gold-300 bg-gold-50'
                            : 'border-gray-300 hover:border-[#05527E] hover:bg-gray-50'
                        }`}
                      >
                        {uploading === check.referenceId ? (
                          <>
                            <svg className="animate-spin h-4 w-4 text-gold-500" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            <span className="text-xs text-gold-700 font-medium">Uploading...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                            </svg>
                            <span className="text-xs text-gray-500">
                              Upload screening results PDF <span className="text-gray-400">(max 10 MB)</span>
                            </span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadReport(check.referenceId, file);
                            e.target.value = '';
                          }}
                          disabled={uploading !== null}
                        />
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
