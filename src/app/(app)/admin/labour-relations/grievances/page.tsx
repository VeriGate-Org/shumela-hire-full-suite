'use client';

import React, { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { complianceService } from '@/services/complianceService';
import Link from 'next/link';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

interface Grievance {
  id: number;
  employeeId: number;
  employeeName: string;
  grievanceType: string;
  description: string;
  status: string;
  resolution: string | null;
  filedDate: string;
  resolvedDate: string | null;
  assignedToId: number | null;
  assignedToName: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function GrievancesPage() {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateForm, setUpdateForm] = useState<{ status?: string; resolution?: string }>({});

  useEffect(() => {
    loadGrievances();
  }, [filter, page]);

  async function loadGrievances() {
    setLoading(true);
    try {
      const data = await complianceService.getGrievances({ status: filter, page, size: 20 });
      setGrievances(data.content);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Failed to load grievances:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate() {
    if (!selectedGrievance) return;
    try {
      await complianceService.updateGrievance(selectedGrievance.id, updateForm);
      setShowUpdateModal(false);
      setSelectedGrievance(null);
      setUpdateForm({});
      loadGrievances();
    } catch (error: any) {
      alert(error.message || 'Failed to update grievance');
    }
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      FILED: 'bg-blue-100 text-blue-800',
      UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
      MEDIATION: 'bg-orange-100 text-orange-800',
      RESOLVED: 'bg-green-100 text-green-800',
      ESCALATED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const typeBadge = (type: string) => {
    const colors: Record<string, string> = {
      WORKPLACE: 'bg-blue-100 text-blue-800',
      DISCRIMINATION: 'bg-red-100 text-red-800',
      HARASSMENT: 'bg-red-200 text-red-900',
      UNFAIR_TREATMENT: 'bg-orange-100 text-orange-800',
      POLICY: 'bg-purple-100 text-purple-800',
      OTHER: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const formatLabel = (s: string) => s.replace(/_/g, ' ');

  return (
    <FeatureGate feature="LABOUR_RELATIONS">
      <PageWrapper title="Grievances" subtitle="Manage employee grievances and resolutions">
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {[undefined, 'FILED', 'UNDER_REVIEW', 'MEDIATION', 'RESOLVED', 'ESCALATED'].map((f) => (
              <button key={f || 'all'} onClick={() => { setFilter(f); setPage(0); }}
                className={`px-3 py-1.5 text-sm rounded-lg ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                {f ? formatLabel(f) : 'All'}
              </button>
            ))}
          </div>

          {/* Grievances List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : grievances.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No grievances found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {grievances.map((grievance) => (
                <div key={grievance.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{grievance.employeeName}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${typeBadge(grievance.grievanceType)}`}>
                          {formatLabel(grievance.grievanceType)}
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${statusBadge(grievance.status)}`}>
                          {formatLabel(grievance.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{grievance.description}</p>
                      {grievance.resolution && (
                        <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm text-green-800 dark:text-green-300">
                          <span className="font-medium">Resolution:</span> {grievance.resolution}
                        </div>
                      )}
                      <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400 mt-2 flex-wrap">
                        <span>Filed: {new Date(grievance.filedDate).toLocaleDateString()}</span>
                        {grievance.assignedToName && <span>Assigned to: {grievance.assignedToName}</span>}
                        {grievance.resolvedDate && <span>Resolved: {new Date(grievance.resolvedDate).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/admin/labour-relations/grievances/${grievance.id}`}
                        className="px-3 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200">
                        View Details
                      </Link>
                      {grievance.status !== 'RESOLVED' && (
                        <button onClick={() => {
                          setSelectedGrievance(grievance);
                          setUpdateForm({ status: grievance.status, resolution: grievance.resolution || '' });
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
          {showUpdateModal && selectedGrievance && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg mx-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Update Grievance: {selectedGrievance.employeeName}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    <select value={updateForm.status || ''}
                      onChange={(e) => setUpdateForm(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                      <option value="FILED">Filed</option>
                      <option value="UNDER_REVIEW">Under Review</option>
                      <option value="MEDIATION">Mediation</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="ESCALATED">Escalated</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Resolution</label>
                    <textarea value={updateForm.resolution || ''} rows={4}
                      onChange={(e) => setUpdateForm(prev => ({ ...prev, resolution: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Describe the resolution..." />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => { setShowUpdateModal(false); setSelectedGrievance(null); setUpdateForm({}); }}
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
