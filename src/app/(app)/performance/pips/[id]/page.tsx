'use client';

export function generateStaticParams() {
  return [];
}

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { performanceEnhancementService, Pip, PipMilestone } from '@/services/performanceEnhancementService';
import { useToast } from '@/components/Toast';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  FlagIcon,
} from '@heroicons/react/24/outline';

const PIP_STATUSES = ['ACTIVE', 'EXTENDED', 'COMPLETED', 'TERMINATED'] as const;
const MILESTONE_STATUSES = ['PENDING', 'MET', 'MISSED'] as const;

export default function PipDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const pipId = Number(params.id);

  const [pip, setPip] = useState<Pip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // PIP status update state
  const [newStatus, setNewStatus] = useState('');
  const [outcome, setOutcome] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Milestone update state (keyed by milestone id)
  const [milestoneUpdates, setMilestoneUpdates] = useState<
    Record<number, { status: string; evidence: string }>
  >({});
  const [updatingMilestone, setUpdatingMilestone] = useState<number | null>(null);

  useEffect(() => {
    loadPip();
  }, [pipId]);

  async function loadPip() {
    setLoading(true);
    setError(null);
    try {
      const data = await performanceEnhancementService.getPip(pipId);
      setPip(data);
      setNewStatus(data.status);
      setOutcome(data.outcome || '');
    } catch (err: any) {
      setError(err.message || 'Failed to load PIP');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate() {
    if (!newStatus) return;
    setUpdatingStatus(true);
    try {
      const updated = await performanceEnhancementService.updatePipStatus(pipId, newStatus, outcome || undefined);
      setPip(updated);
      toast('PIP status updated successfully', 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to update PIP status', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleMilestoneUpdate(milestoneId: number) {
    const update = milestoneUpdates[milestoneId];
    if (!update || !update.status) return;
    setUpdatingMilestone(milestoneId);
    try {
      await performanceEnhancementService.updateMilestoneStatus(
        milestoneId,
        update.status,
        update.evidence || undefined
      );
      toast('Milestone updated successfully', 'success');
      await loadPip();
    } catch (err: any) {
      toast(err.message || 'Failed to update milestone', 'error');
    } finally {
      setUpdatingMilestone(null);
    }
  }

  function getMilestoneUpdate(milestoneId: number) {
    return milestoneUpdates[milestoneId] || { status: 'PENDING', evidence: '' };
  }

  function setMilestoneUpdate(milestoneId: number, field: 'status' | 'evidence', value: string) {
    setMilestoneUpdates((prev) => ({
      ...prev,
      [milestoneId]: {
        ...getMilestoneUpdate(milestoneId),
        [field]: value,
      },
    }));
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-green-100 text-green-800',
      EXTENDED: 'bg-blue-100 text-blue-800',
      TERMINATED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const milestoneStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      MET: 'bg-green-100 text-green-800',
      MISSED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const milestoneStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'MET':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'MISSED':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <FeatureGate feature="PERFORMANCE_PIP">
        <PageWrapper title="PIP Details">
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500" />
          </div>
        </PageWrapper>
      </FeatureGate>
    );
  }

  if (error || !pip) {
    return (
      <FeatureGate feature="PERFORMANCE_PIP">
        <PageWrapper title="PIP Details">
          <div className="bg-white rounded-[10px] border border-gray-200 p-6 text-center">
            <p className="text-red-600 mb-4">{error || 'PIP not found'}</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={loadPip}
                className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 text-sm"
              >
                Retry
              </button>
              <Link href="/performance/pips" className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                Back to PIPs
              </Link>
            </div>
          </div>
        </PageWrapper>
      </FeatureGate>
    );
  }

  const isEditable = pip.status !== 'COMPLETED' && pip.status !== 'TERMINATED';

  return (
    <FeatureGate feature="PERFORMANCE_PIP">
      <PageWrapper title="PIP Details" subtitle={`Performance Improvement Plan for ${pip.employeeName}`}>
        {/* Back Link */}
        <Link
          href="/performance/pips"
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to PIPs
        </Link>

        {/* PIP Info Card */}
        <div className="bg-white rounded-[10px] border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-semibold text-gray-900">PIP Information</h2>
            <span className={`px-3 py-1 text-xs rounded-full font-medium ${statusBadge(pip.status)}`}>
              {pip.status}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Employee</p>
              <p className="text-sm font-medium text-gray-900">{pip.employeeName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Manager</p>
              <p className="text-sm font-medium text-gray-900">{pip.managerName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Start Date</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(pip.startDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">End Date</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(pip.endDate).toLocaleDateString()}
              </p>
            </div>
            {pip.outcome && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Outcome</p>
                <p className="text-sm font-medium text-gray-900">{pip.outcome}</p>
              </div>
            )}
          </div>
          {pip.reason && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Reason</p>
              <p className="text-sm text-gray-700">{pip.reason}</p>
            </div>
          )}
        </div>

        {/* PIP Status Update Section */}
        {isEditable && (
          <div className="bg-white rounded-[10px] border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Update PIP Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-gold-500 focus:border-gold-500"
                >
                  {PIP_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
                <textarea
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  rows={2}
                  placeholder="Describe the outcome..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-gold-500 focus:border-gold-500"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleStatusUpdate}
                disabled={updatingStatus}
                className="px-6 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 text-sm disabled:opacity-50"
              >
                {updatingStatus ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        )}

        {/* Milestones Timeline */}
        <div className="bg-white rounded-[10px] border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Milestones</h2>
          {pip.milestones && pip.milestones.length > 0 ? (
            <div className="space-y-4">
              {pip.milestones.map((milestone, index) => (
                <div key={milestone.id} className="relative">
                  {/* Timeline connector */}
                  {index < pip.milestones!.length - 1 && (
                    <div className="absolute top-10 left-[18px] w-0.5 h-[calc(100%-20px)] bg-gray-200" />
                  )}
                  <div className="flex gap-4">
                    {/* Timeline dot */}
                    <div className="flex-shrink-0 mt-1">{milestoneStatusIcon(milestone.status)}</div>

                    {/* Milestone content */}
                    <div className="flex-1 bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">{milestone.title}</h3>
                          {milestone.description && (
                            <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                          )}
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-medium ${milestoneStatusBadge(
                            milestone.status
                          )}`}
                        >
                          {milestone.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">
                        Target: {new Date(milestone.targetDate).toLocaleDateString()}
                      </p>
                      {milestone.evidence && (
                        <p className="text-xs text-gray-500">Evidence: {milestone.evidence}</p>
                      )}
                      {milestone.reviewedAt && (
                        <p className="text-xs text-gray-400">
                          Reviewed: {new Date(milestone.reviewedAt).toLocaleDateString()}
                        </p>
                      )}

                      {/* Update form for PENDING milestones */}
                      {milestone.status === 'PENDING' && isEditable && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs font-medium text-gray-700 mb-2">Update Milestone</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Status</label>
                              <select
                                value={getMilestoneUpdate(milestone.id).status}
                                onChange={(e) =>
                                  setMilestoneUpdate(milestone.id, 'status', e.target.value)
                                }
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-gold-500 focus:border-gold-500"
                              >
                                {MILESTONE_STATUSES.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Evidence</label>
                              <textarea
                                value={getMilestoneUpdate(milestone.id).evidence}
                                onChange={(e) =>
                                  setMilestoneUpdate(milestone.id, 'evidence', e.target.value)
                                }
                                rows={2}
                                placeholder="Provide evidence..."
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-gold-500 focus:border-gold-500"
                              />
                            </div>
                          </div>
                          <div className="mt-2 flex justify-end">
                            <button
                              onClick={() => handleMilestoneUpdate(milestone.id)}
                              disabled={updatingMilestone === milestone.id}
                              className="px-4 py-1.5 bg-gold-500 text-white rounded-lg hover:bg-gold-600 text-xs disabled:opacity-50"
                            >
                              {updatingMilestone === milestone.id ? 'Updating...' : 'Update Milestone'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FlagIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No milestones defined for this PIP</p>
            </div>
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
