'use client';

export function generateStaticParams() {
  return [];
}

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { apiFetch } from '@/lib/api-fetch';
import { complianceService } from '@/services/complianceService';
import { useToast } from '@/components/Toast';
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  ScaleIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface DisciplinaryCase {
  id: number;
  employeeId: number;
  employeeName: string;
  offenceCategory: string;
  offenceDescription: string;
  incidentDate: string;
  hearingDate: string | null;
  status: string;
  outcome: string | null;
  outcomeDate: string | null;
  notes: string | null;
  ccmaReferral: boolean | null;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export default function DisciplinaryCaseDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();

  const [caseData, setCaseData] = useState<DisciplinaryCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [updateForm, setUpdateForm] = useState<{
    status?: string;
    outcome?: string;
    hearingDate?: string;
    notes?: string;
  }>({});

  useEffect(() => {
    loadCase();
  }, [id]);

  async function loadCase() {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch(`/api/labour-relations/disciplinary/${id}`);
      if (!response.ok) throw new Error('Failed to load case');
      const data: DisciplinaryCase = await response.json();
      setCaseData(data);
      setUpdateForm({
        status: data.status,
        hearingDate: data.hearingDate || '',
        outcome: data.outcome || '',
        notes: data.notes || '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load disciplinary case');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate() {
    if (!caseData) return;
    setSaving(true);
    try {
      await complianceService.updateDisciplinaryCase(caseData.id, updateForm);
      toast('Case updated successfully', 'success');
      await loadCase();
    } catch (err: any) {
      toast(err.message || 'Failed to update case', 'error');
    } finally {
      setSaving(false);
    }
  }

  const categoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      MINOR: 'bg-yellow-100 text-yellow-800',
      SERIOUS: 'bg-orange-100 text-orange-800',
      GROSS: 'bg-red-100 text-red-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      OPEN: 'bg-red-100 text-red-800',
      INVESTIGATION: 'bg-orange-100 text-orange-800',
      HEARING_SCHEDULED: 'bg-yellow-100 text-yellow-800',
      HEARING_COMPLETED: 'bg-blue-100 text-blue-800',
      CLOSED: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const outcomeBadge = (outcome: string) => {
    const colors: Record<string, string> = {
      VERBAL_WARNING: 'bg-yellow-100 text-yellow-800',
      WRITTEN_WARNING: 'bg-orange-100 text-orange-800',
      FINAL_WARNING: 'bg-red-100 text-red-800',
      SUSPENSION: 'bg-purple-100 text-purple-800',
      DISMISSAL: 'bg-red-200 text-red-900',
      ACQUITTED: 'bg-green-100 text-green-800',
    };
    return colors[outcome] || 'bg-gray-100 text-gray-800';
  };

  const formatLabel = (s: string) => s.replace(/_/g, ' ');

  return (
    <FeatureGate feature="LABOUR_RELATIONS">
      <PageWrapper title="Disciplinary Case Details" subtitle="View and manage disciplinary case">
        <div className="space-y-6">
          {/* Back Link */}
          <Link
            href="/admin/labour-relations/disciplinary"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Disciplinary Cases
          </Link>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500" />
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="bg-white rounded-[10px] border border-gray-200 p-6 text-center">
              <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-4 text-red-400" />
              <p className="text-gray-700 mb-4">{error}</p>
              <button
                onClick={loadCase}
                className="px-4 py-2 text-sm bg-gold-500 text-white rounded-lg hover:bg-gold-600"
              >
                Retry
              </button>
              <div className="mt-3">
                <Link
                  href="/admin/labour-relations/disciplinary"
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Go back to list
                </Link>
              </div>
            </div>
          )}

          {/* Case Details */}
          {caseData && !loading && (
            <>
              {/* Main Details Card */}
              <div className="bg-white rounded-[10px] border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{caseData.employeeName}</h2>
                    <p className="text-sm text-gray-500 mt-1">Case #{caseData.id}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${categoryBadge(caseData.offenceCategory)}`}>
                      {caseData.offenceCategory}
                    </span>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusBadge(caseData.status)}`}>
                      {formatLabel(caseData.status)}
                    </span>
                    {caseData.outcome && (
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${outcomeBadge(caseData.outcome)}`}>
                        {formatLabel(caseData.outcome)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Offence Description</h3>
                    <p className="text-gray-900">{caseData.offenceDescription}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Incident Date</h3>
                      <p className="text-gray-900">{new Date(caseData.incidentDate).toLocaleDateString()}</p>
                    </div>
                    {caseData.hearingDate && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Hearing Date</h3>
                        <p className="text-gray-900">{new Date(caseData.hearingDate).toLocaleDateString()}</p>
                      </div>
                    )}
                    {caseData.outcomeDate && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Outcome Date</h3>
                        <p className="text-gray-900">{new Date(caseData.outcomeDate).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>

                  {caseData.notes && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Notes</h3>
                      <p className="text-gray-700 italic">{caseData.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* CCMA Referral Status */}
              <div className="bg-white rounded-[10px] border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">CCMA Referral</h3>
                <div className="flex items-center gap-3">
                  {caseData.ccmaReferral === true ? (
                    <>
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="text-sm text-gray-700">This case has been referred to the CCMA</span>
                    </>
                  ) : caseData.ccmaReferral === false ? (
                    <>
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm text-gray-700">No CCMA referral</span>
                    </>
                  ) : (
                    <>
                      <div className="w-3 h-3 rounded-full bg-gray-400" />
                      <span className="text-sm text-gray-500">CCMA referral status not recorded</span>
                    </>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white rounded-[10px] border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Case Timeline</h3>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                  <div className="space-y-8">
                    {/* Incident Date */}
                    <div className="relative flex items-start gap-4">
                      <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-red-100 border-2 border-red-300">
                        <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Incident Reported</p>
                        <p className="text-xs text-gray-500">{new Date(caseData.incidentDate).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Case Created */}
                    <div className="relative flex items-start gap-4">
                      <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 border-2 border-blue-300">
                        <ClockIcon className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Case Created</p>
                        <p className="text-xs text-gray-500">{new Date(caseData.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Hearing Date */}
                    {caseData.hearingDate && (
                      <div className="relative flex items-start gap-4">
                        <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 border-2 border-yellow-300">
                          <ScaleIcon className="w-4 h-4 text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Hearing</p>
                          <p className="text-xs text-gray-500">{new Date(caseData.hearingDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    )}

                    {/* Outcome Date */}
                    {caseData.outcomeDate && (
                      <div className="relative flex items-start gap-4">
                        <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-green-100 border-2 border-green-300">
                          <CheckCircleIcon className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Outcome: {caseData.outcome ? formatLabel(caseData.outcome) : 'Decided'}
                          </p>
                          <p className="text-xs text-gray-500">{new Date(caseData.outcomeDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    )}

                    {/* Last Updated */}
                    <div className="relative flex items-start gap-4">
                      <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 border-2 border-gray-300">
                        <CalendarDaysIcon className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Last Updated</p>
                        <p className="text-xs text-gray-500">{new Date(caseData.updatedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Update Form */}
              {caseData.status !== 'CLOSED' && (
                <div className="bg-white rounded-[10px] border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Case</h3>
                  <div className="space-y-4 max-w-2xl">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={updateForm.status || ''}
                        onChange={(e) => setUpdateForm((prev) => ({ ...prev, status: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 p-2 text-sm bg-white text-gray-900"
                      >
                        <option value="OPEN">Open</option>
                        <option value="INVESTIGATION">Investigation</option>
                        <option value="HEARING_SCHEDULED">Hearing Scheduled</option>
                        <option value="HEARING_COMPLETED">Hearing Completed</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hearing Date</label>
                      <input
                        type="date"
                        value={updateForm.hearingDate || ''}
                        onChange={(e) => setUpdateForm((prev) => ({ ...prev, hearingDate: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 p-2 text-sm bg-white text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
                      <select
                        value={updateForm.outcome || ''}
                        onChange={(e) => setUpdateForm((prev) => ({ ...prev, outcome: e.target.value || undefined }))}
                        className="w-full rounded-lg border border-gray-300 p-2 text-sm bg-white text-gray-900"
                      >
                        <option value="">-- Select Outcome --</option>
                        <option value="VERBAL_WARNING">Verbal Warning</option>
                        <option value="WRITTEN_WARNING">Written Warning</option>
                        <option value="FINAL_WARNING">Final Warning</option>
                        <option value="SUSPENSION">Suspension</option>
                        <option value="DISMISSAL">Dismissal</option>
                        <option value="ACQUITTED">Acquitted</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        value={updateForm.notes || ''}
                        rows={4}
                        onChange={(e) => setUpdateForm((prev) => ({ ...prev, notes: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 p-2 text-sm bg-white text-gray-900"
                        placeholder="Add notes about the case..."
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={handleUpdate}
                        disabled={saving}
                        className="px-6 py-2 text-sm font-medium text-white bg-gold-500 rounded-lg hover:bg-gold-600 disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
