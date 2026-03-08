'use client';

import React, { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { complianceService } from '@/services/complianceService';
import Link from 'next/link';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

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
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export default function DisciplinaryCasesPage() {
  const [cases, setCases] = useState<DisciplinaryCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedCase, setSelectedCase] = useState<DisciplinaryCase | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateForm, setUpdateForm] = useState<{ status?: string; outcome?: string; hearingDate?: string; notes?: string }>({});

  useEffect(() => {
    loadCases();
  }, [filter, page]);

  async function loadCases() {
    setLoading(true);
    try {
      const data = await complianceService.getDisciplinaryCases({ status: filter, page, size: 20 });
      setCases(data.content);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Failed to load disciplinary cases:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate() {
    if (!selectedCase) return;
    try {
      await complianceService.updateDisciplinaryCase(selectedCase.id, updateForm);
      setShowUpdateModal(false);
      setSelectedCase(null);
      setUpdateForm({});
      loadCases();
    } catch (error: any) {
      alert(error.message || 'Failed to update case');
    }
  }

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

  const categoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      MINOR: 'bg-yellow-100 text-yellow-800',
      SERIOUS: 'bg-orange-100 text-orange-800',
      GROSS: 'bg-red-100 text-red-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
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
      <PageWrapper title="Disciplinary Cases" subtitle="Manage employee disciplinary proceedings">
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {[undefined, 'OPEN', 'INVESTIGATION', 'HEARING_SCHEDULED', 'HEARING_COMPLETED', 'CLOSED'].map((f) => (
              <button key={f || 'all'} onClick={() => { setFilter(f); setPage(0); }}
                className={`px-3 py-1.5 text-sm rounded-lg ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                {f ? formatLabel(f) : 'All'}
              </button>
            ))}
          </div>

          {/* Cases List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : cases.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No disciplinary cases found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cases.map((dc) => (
                <div key={dc.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{dc.employeeName}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${categoryBadge(dc.offenceCategory)}`}>
                          {dc.offenceCategory}
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${statusBadge(dc.status)}`}>
                          {formatLabel(dc.status)}
                        </span>
                        {dc.outcome && (
                          <span className={`px-2 py-0.5 text-xs rounded-full ${outcomeBadge(dc.outcome)}`}>
                            {formatLabel(dc.outcome)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{dc.offenceDescription}</p>
                      <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400 mt-2 flex-wrap">
                        <span>Incident: {new Date(dc.incidentDate).toLocaleDateString()}</span>
                        {dc.hearingDate && <span>Hearing: {new Date(dc.hearingDate).toLocaleDateString()}</span>}
                        {dc.outcomeDate && <span>Outcome Date: {new Date(dc.outcomeDate).toLocaleDateString()}</span>}
                        <span>Created: {new Date(dc.createdAt).toLocaleDateString()}</span>
                      </div>
                      {dc.notes && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">Notes: {dc.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/admin/labour-relations/disciplinary/${dc.id}`}
                        className="px-3 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200">
                        View Details
                      </Link>
                      {dc.status !== 'CLOSED' && (
                        <button onClick={() => {
                          setSelectedCase(dc);
                          setUpdateForm({ status: dc.status, notes: dc.notes || '' });
                          setShowUpdateModal(true);
                        }}
                          className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200">
                          Update
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-4">
                  <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1 text-sm rounded border disabled:opacity-50">Previous</button>
                  <span className="px-3 py-1 text-sm">Page {page + 1} of {totalPages}</span>
                  <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1 text-sm rounded border disabled:opacity-50">Next</button>
                </div>
              )}
            </div>
          )}

          {/* Update Modal */}
          {showUpdateModal && selectedCase && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg mx-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Update Case: {selectedCase.employeeName}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    <select value={updateForm.status || ''}
                      onChange={(e) => setUpdateForm(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                      <option value="OPEN">Open</option>
                      <option value="INVESTIGATION">Investigation</option>
                      <option value="HEARING_SCHEDULED">Hearing Scheduled</option>
                      <option value="HEARING_COMPLETED">Hearing Completed</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hearing Date</label>
                    <input type="date" value={updateForm.hearingDate || ''}
                      onChange={(e) => setUpdateForm(prev => ({ ...prev, hearingDate: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Outcome</label>
                    <select value={updateForm.outcome || ''}
                      onChange={(e) => setUpdateForm(prev => ({ ...prev, outcome: e.target.value || undefined }))}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                    <textarea value={updateForm.notes || ''} rows={3}
                      onChange={(e) => setUpdateForm(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Add notes about the case..." />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => { setShowUpdateModal(false); setSelectedCase(null); setUpdateForm({}); }}
                    className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                    Cancel
                  </button>
                  <button onClick={handleUpdate}
                    className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
