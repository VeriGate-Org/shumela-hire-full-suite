'use client';

import React, { useState, useEffect } from 'react';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { salaryRecommendationService } from '@/services/salaryRecommendationService';
import EmptyState from './EmptyState';
import {
  SalaryRecommendation,
  SalaryRecommendationStatus,
  SalaryRecommendationCreateRequest,
  getStatusColor,
  getStatusDisplayName,
} from '@/types/salaryRecommendation';

function formatCurrency(amount?: number, currency = 'ZAR'): string {
  if (amount == null) return '-';
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency }).format(amount);
}

export default function SalaryRecommendationManager() {
  const [recommendations, setRecommendations] = useState<SalaryRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRecommendModal, setShowRecommendModal] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const [createForm, setCreateForm] = useState<SalaryRecommendationCreateRequest>({
    positionTitle: '',
    department: '',
    jobGrade: '',
    positionLevel: '',
    candidateName: '',
    proposedMinSalary: undefined,
    proposedMaxSalary: undefined,
    proposedTargetSalary: undefined,
  });

  const [recommendForm, setRecommendForm] = useState({
    recommendedSalary: 0,
    recommendationJustification: '',
  });

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const data = await salaryRecommendationService.getAll();
      setRecommendations(data);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!createForm.positionTitle.trim()) return;
    try {
      setActionLoading(-1);
      await salaryRecommendationService.create(createForm);
      setShowCreateModal(false);
      setCreateForm({ positionTitle: '', department: '', jobGrade: '', positionLevel: '', candidateName: '' });
      await loadRecommendations();
    } catch (error) {
      console.error('Failed to create recommendation:', error);
      alert('Failed to create recommendation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmitForReview = async (id: number) => {
    try {
      setActionLoading(id);
      await salaryRecommendationService.submitForReview(id);
      await loadRecommendations();
    } catch (error) {
      console.error('Failed to submit:', error);
      alert('Failed to submit for review');
    } finally {
      setActionLoading(null);
    }
  };

  const handleProvideRecommendation = async () => {
    if (showRecommendModal == null || recommendForm.recommendedSalary <= 0) return;
    try {
      setActionLoading(showRecommendModal);
      await salaryRecommendationService.provideRecommendation(showRecommendModal, {
        recommendedSalary: recommendForm.recommendedSalary,
        recommendationJustification: recommendForm.recommendationJustification,
      });
      setShowRecommendModal(null);
      setRecommendForm({ recommendedSalary: 0, recommendationJustification: '' });
      await loadRecommendations();
    } catch (error) {
      console.error('Failed to provide recommendation:', error);
      alert('Failed to provide recommendation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      setActionLoading(id);
      await salaryRecommendationService.approve(id);
      await loadRecommendations();
    } catch (error) {
      console.error('Failed to approve:', error);
      alert('Failed to approve');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: number) => {
    const reason = prompt('Please provide a rejection reason:');
    if (!reason) return;
    try {
      setActionLoading(id);
      await salaryRecommendationService.reject(id, reason);
      await loadRecommendations();
    } catch (error) {
      console.error('Failed to reject:', error);
      alert('Failed to reject');
    } finally {
      setActionLoading(null);
    }
  };

  const getActions = (rec: SalaryRecommendation) => {
    const isLoading = actionLoading === rec.id;
    const actions: React.ReactNode[] = [];

    if (rec.status === SalaryRecommendationStatus.DRAFT || rec.status === SalaryRecommendationStatus.RETURNED) {
      actions.push(
        <button key="submit" onClick={() => handleSubmitForReview(rec.id)} disabled={isLoading}
          className="text-xs px-2 py-1 bg-gold-50 text-violet-700 border border-violet-200 rounded hover:bg-gold-100 disabled:opacity-50">
          Submit for Review
        </button>
      );
    }

    if (rec.status === SalaryRecommendationStatus.PENDING_REVIEW) {
      actions.push(
        <button key="recommend" onClick={() => setShowRecommendModal(rec.id)} disabled={isLoading}
          className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 disabled:opacity-50">
          Provide Recommendation
        </button>
      );
    }

    if (rec.status === SalaryRecommendationStatus.PENDING_APPROVAL || rec.status === SalaryRecommendationStatus.RECOMMENDED) {
      actions.push(
        <button key="approve" onClick={() => handleApprove(rec.id)} disabled={isLoading}
          className="text-xs px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 disabled:opacity-50">
          Approve
        </button>,
        <button key="reject" onClick={() => handleReject(rec.id)} disabled={isLoading}
          className="text-xs px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 disabled:opacity-50">
          Reject
        </button>
      );
    }

    return actions;
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-2 border-gold-500 border-t-transparent rounded-full" /></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Salary Recommendations</h2>
          <p className="text-sm text-gray-500 mt-1">Manage salary recommendation requests and approvals</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-gold-500 text-violet-950 text-sm font-medium rounded-sm hover:bg-gold-600"
        >
          New Recommendation
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ref</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proposed Target</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recommended</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {recommendations.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-0">
                  <EmptyState
                    icon={CurrencyDollarIcon}
                    title="No salary recommendations"
                    description="No salary recommendations have been created yet."
                    action={{
                      label: 'New Recommendation',
                      onClick: () => setShowCreateModal(true),
                    }}
                  />
                </td>
              </tr>
            ) : (
              recommendations.map(rec => (
                <tr key={rec.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">{rec.recommendationNumber}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="font-medium text-gray-900">{rec.positionTitle}</div>
                    {rec.department && <div className="text-gray-500 text-xs">{rec.department}</div>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{rec.candidateName || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(rec.proposedTargetSalary)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCurrency(rec.recommendedSalary)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(rec.status)}`}>
                      {getStatusDisplayName(rec.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">{getActions(rec)}</div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-sm shadow-xl max-w-lg w-full mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">New Salary Recommendation</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position Title *</label>
                <input type="text" value={createForm.positionTitle}
                  onChange={e => setCreateForm(prev => ({ ...prev, positionTitle: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-sm text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input type="text" value={createForm.department || ''}
                    onChange={e => setCreateForm(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-sm text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Grade</label>
                  <input type="text" value={createForm.jobGrade || ''}
                    onChange={e => setCreateForm(prev => ({ ...prev, jobGrade: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-sm text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Candidate Name</label>
                <input type="text" value={createForm.candidateName || ''}
                  onChange={e => setCreateForm(prev => ({ ...prev, candidateName: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-sm text-sm" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Salary (ZAR)</label>
                  <input type="number" value={createForm.proposedMinSalary || ''}
                    onChange={e => setCreateForm(prev => ({ ...prev, proposedMinSalary: e.target.value ? Number(e.target.value) : undefined }))}
                    className="w-full p-2 border border-gray-300 rounded-sm text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Salary</label>
                  <input type="number" value={createForm.proposedTargetSalary || ''}
                    onChange={e => setCreateForm(prev => ({ ...prev, proposedTargetSalary: e.target.value ? Number(e.target.value) : undefined }))}
                    className="w-full p-2 border border-gray-300 rounded-sm text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Salary</label>
                  <input type="number" value={createForm.proposedMaxSalary || ''}
                    onChange={e => setCreateForm(prev => ({ ...prev, proposedMaxSalary: e.target.value ? Number(e.target.value) : undefined }))}
                    className="w-full p-2 border border-gray-300 rounded-sm text-sm" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleCreate} disabled={actionLoading === -1}
                className="px-4 py-2 text-sm bg-gold-500 text-violet-950 rounded-sm hover:bg-gold-600 disabled:opacity-50">
                {actionLoading === -1 ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recommend Modal */}
      {showRecommendModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-sm shadow-xl max-w-lg w-full mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Provide Salary Recommendation</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recommended Salary (ZAR) *</label>
                <input type="number" value={recommendForm.recommendedSalary || ''}
                  onChange={e => setRecommendForm(prev => ({ ...prev, recommendedSalary: Number(e.target.value) }))}
                  className="w-full p-2 border border-gray-300 rounded-sm text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Justification</label>
                <textarea value={recommendForm.recommendationJustification}
                  onChange={e => setRecommendForm(prev => ({ ...prev, recommendationJustification: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-sm text-sm" rows={4} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowRecommendModal(null)}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleProvideRecommendation} disabled={actionLoading === showRecommendModal}
                className="px-4 py-2 text-sm bg-gold-500 text-violet-950 rounded-sm hover:bg-gold-600 disabled:opacity-50">
                {actionLoading === showRecommendModal ? 'Submitting...' : 'Submit Recommendation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
