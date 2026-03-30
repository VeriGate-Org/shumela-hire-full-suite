'use client';

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
  DocumentTextIcon,
  UserIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

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

export default function GrievanceDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();

  const [grievance, setGrievance] = useState<Grievance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [updateForm, setUpdateForm] = useState<{
    status?: string;
    resolution?: string;
  }>({});

  useEffect(() => {
    loadGrievance();
  }, [id]);

  async function loadGrievance() {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch(`/api/labour-relations/grievances/${id}`);
      if (!response.ok) throw new Error('Failed to load grievance');
      const data: Grievance = await response.json();
      setGrievance(data);
      setUpdateForm({
        status: data.status,
        resolution: data.resolution || '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load grievance');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate() {
    if (!grievance) return;
    setSaving(true);
    try {
      await complianceService.updateGrievance(grievance.id, updateForm);
      toast('Grievance updated successfully', 'success');
      await loadGrievance();
    } catch (err: any) {
      toast(err.message || 'Failed to update grievance', 'error');
    } finally {
      setSaving(false);
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
      <PageWrapper title="Grievance Details" subtitle="View and manage grievance">
        <div className="space-y-6">
          {/* Back Link */}
          <Link
            href="/admin/labour-relations/grievances"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Grievances
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
              <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-red-400" />
              <p className="text-gray-700 mb-4">{error}</p>
              <button
                onClick={loadGrievance}
                className="px-4 py-2 text-sm bg-gold-500 text-white rounded-lg hover:bg-gold-600"
              >
                Retry
              </button>
              <div className="mt-3">
                <Link
                  href="/admin/labour-relations/grievances"
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Go back to list
                </Link>
              </div>
            </div>
          )}

          {/* Grievance Details */}
          {grievance && !loading && (
            <>
              {/* Main Details Card */}
              <div className="bg-white rounded-[10px] border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{grievance.employeeName}</h2>
                    <p className="text-sm text-gray-500 mt-1">Grievance #{grievance.id}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${typeBadge(grievance.grievanceType)}`}>
                      {formatLabel(grievance.grievanceType)}
                    </span>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusBadge(grievance.status)}`}>
                      {formatLabel(grievance.status)}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
                    <p className="text-gray-900">{grievance.description}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Filed Date</h3>
                      <div className="flex items-center gap-2 text-gray-900">
                        <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
                        {new Date(grievance.filedDate).toLocaleDateString()}
                      </div>
                    </div>

                    {grievance.assignedToName && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Assigned To</h3>
                        <div className="flex items-center gap-2 text-gray-900">
                          <UserIcon className="w-4 h-4 text-gray-400" />
                          {grievance.assignedToName}
                        </div>
                      </div>
                    )}

                    {grievance.resolvedDate && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Resolved Date</h3>
                        <div className="flex items-center gap-2 text-gray-900">
                          <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
                          {new Date(grievance.resolvedDate).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-500">
                    <div>Created: {new Date(grievance.createdAt).toLocaleDateString()}</div>
                    <div>Updated: {new Date(grievance.updatedAt).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>

              {/* Resolution Section */}
              {grievance.resolution && (
                <div className="bg-white rounded-[10px] border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Resolution</h3>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800">{grievance.resolution}</p>
                    {grievance.resolvedDate && (
                      <p className="text-xs text-green-600 mt-2">
                        Resolved on {new Date(grievance.resolvedDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Update Form */}
              {grievance.status !== 'RESOLVED' && (
                <div className="bg-white rounded-[10px] border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Grievance</h3>
                  <div className="space-y-4 max-w-2xl">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={updateForm.status || ''}
                        onChange={(e) => setUpdateForm((prev) => ({ ...prev, status: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 p-2 text-sm bg-white text-gray-900"
                      >
                        <option value="FILED">Filed</option>
                        <option value="UNDER_REVIEW">Under Review</option>
                        <option value="MEDIATION">Mediation</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="ESCALATED">Escalated</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Resolution</label>
                      <textarea
                        value={updateForm.resolution || ''}
                        rows={4}
                        onChange={(e) => setUpdateForm((prev) => ({ ...prev, resolution: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 p-2 text-sm bg-white text-gray-900"
                        placeholder="Describe the resolution..."
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
