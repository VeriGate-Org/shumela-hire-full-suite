'use client';

import React, { useState, useEffect, useCallback } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { useToast } from '@/components/Toast';
import { salaryRecommendationService } from '@/services/salaryRecommendationService';
import {
  SalaryRecommendation,
  SalaryRecommendationStatus,
  getStatusColor,
  getStatusDisplayName,
} from '@/types/salaryRecommendation';

type Tab = 'review' | 'approval';

function formatCurrency(amount?: number, currency = 'ZAR'): string {
  if (amount == null) return '-';
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency }).format(amount);
}

export default function SalaryReviewsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('review');
  const [pendingReview, setPendingReview] = useState<SalaryRecommendation[]>([]);
  const [pendingApproval, setPendingApproval] = useState<SalaryRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Recommend modal
  const [recommendTarget, setRecommendTarget] = useState<SalaryRecommendation | null>(null);
  const [recommendedSalary, setRecommendedSalary] = useState<number>(0);
  const [justification, setJustification] = useState('');

  // Approve modal
  const [approveTarget, setApproveTarget] = useState<SalaryRecommendation | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');

  // Reject modal
  const [rejectTarget, setRejectTarget] = useState<SalaryRecommendation | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [reviewData, approvalData] = await Promise.all([
        salaryRecommendationService.getPendingReview(),
        salaryRecommendationService.getPendingApproval(),
      ]);
      setPendingReview(reviewData);
      setPendingApproval(approvalData);
    } catch (error) {
      console.error('Failed to load salary reviews:', error);
      toast('Failed to load salary reviews', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleProvideRecommendation = async () => {
    if (!recommendTarget || recommendedSalary <= 0) return;
    try {
      setActionLoading(recommendTarget.id);
      await salaryRecommendationService.provideRecommendation(recommendTarget.id, {
        recommendedSalary,
        recommendationJustification: justification,
      });
      setRecommendTarget(null);
      setRecommendedSalary(0);
      setJustification('');
      toast('Recommendation provided', 'success');
      await loadData();
    } catch (error) {
      console.error('Failed to provide recommendation:', error);
      toast('Failed to provide recommendation', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async () => {
    if (!approveTarget) return;
    try {
      setActionLoading(approveTarget.id);
      await salaryRecommendationService.approve(approveTarget.id, approvalNotes || undefined);
      setApproveTarget(null);
      setApprovalNotes('');
      toast('Recommendation approved', 'success');
      await loadData();
    } catch (error) {
      console.error('Failed to approve:', error);
      toast('Failed to approve', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget || rejectReason.trim().length < 10) return;
    try {
      setActionLoading(rejectTarget.id);
      await salaryRecommendationService.reject(rejectTarget.id, rejectReason);
      setRejectTarget(null);
      setRejectReason('');
      toast('Recommendation rejected', 'success');
      await loadData();
    } catch (error) {
      console.error('Failed to reject:', error);
      toast('Failed to reject', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'review', label: 'Pending Review', count: pendingReview.length },
    { id: 'approval', label: 'Pending Approval', count: pendingApproval.length },
  ];

  const items = activeTab === 'review' ? pendingReview : pendingApproval;

  return (
    <PageWrapper
      title="Salary Reviews"
      subtitle="Review and approve salary recommendations awaiting your action"
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-sm p-4">
            <p className="text-sm font-medium text-yellow-800">Awaiting HR Review</p>
            <p className="text-2xl font-bold text-yellow-900">{pendingReview.length}</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-sm p-4">
            <p className="text-sm font-medium text-orange-800">Awaiting Approval</p>
            <p className="text-2xl font-bold text-orange-900">{pendingApproval.length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-gold-500 text-violet-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    activeTab === tab.id ? 'bg-gold-100 text-violet-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-gold-500 border-t-transparent rounded-full" />
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-sm shadow p-8 text-center">
            <p className="text-gray-500">
              {activeTab === 'review'
                ? 'No salary recommendations pending review.'
                : 'No salary recommendations pending approval.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((rec) => (
              <div key={rec.id} className="bg-white rounded-sm shadow p-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-mono text-gray-500">{rec.recommendationNumber}</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(rec.status)}`}>
                        {getStatusDisplayName(rec.status)}
                      </span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">{rec.positionTitle}</h3>
                    {rec.candidateName && (
                      <p className="text-sm text-gray-600 mt-1">Candidate: {rec.candidateName}</p>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                      {rec.department && (
                        <div>
                          <p className="text-gray-500">Department</p>
                          <p className="font-medium text-gray-900">{rec.department}</p>
                        </div>
                      )}
                      {rec.positionLevel && (
                        <div>
                          <p className="text-gray-500">Level</p>
                          <p className="font-medium text-gray-900">{rec.positionLevel}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-gray-500">Proposed Range</p>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(rec.proposedMinSalary)} - {formatCurrency(rec.proposedMaxSalary)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Target Salary</p>
                        <p className="font-medium text-gray-900">{formatCurrency(rec.proposedTargetSalary)}</p>
                      </div>
                      {rec.recommendedSalary && (
                        <div>
                          <p className="text-gray-500">Recommended</p>
                          <p className="font-bold text-gray-900">{formatCurrency(rec.recommendedSalary)}</p>
                        </div>
                      )}
                      {rec.recommendationJustification && (
                        <div className="col-span-2">
                          <p className="text-gray-500">Justification</p>
                          <p className="text-gray-700">{rec.recommendationJustification}</p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-3">
                      Requested by {rec.requestedBy} on {new Date(rec.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    {activeTab === 'review' && (
                      <button
                        onClick={() => {
                          setRecommendTarget(rec);
                          setRecommendedSalary(rec.proposedTargetSalary || 0);
                        }}
                        disabled={actionLoading === rec.id}
                        className="px-4 py-2 text-sm bg-gold-500 text-violet-950 rounded-full hover:bg-gold-600 disabled:opacity-50"
                      >
                        Provide Recommendation
                      </button>
                    )}
                    {activeTab === 'approval' && (
                      <>
                        <button
                          onClick={() => setApproveTarget(rec)}
                          disabled={actionLoading === rec.id}
                          className="px-4 py-2 text-sm text-white bg-green-600 rounded-full hover:bg-green-700 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectTarget(rec)}
                          disabled={actionLoading === rec.id}
                          className="px-4 py-2 text-sm text-red-700 border border-red-300 rounded-full hover:bg-red-50 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Provide Recommendation Modal */}
      {recommendTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-sm shadow-xl max-w-lg w-full mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Provide Salary Recommendation</h3>
            <p className="text-sm text-gray-500 mb-4">{recommendTarget.positionTitle} {recommendTarget.candidateName ? `- ${recommendTarget.candidateName}` : ''}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recommended Salary (ZAR)</label>
                <input
                  type="number"
                  value={recommendedSalary || ''}
                  onChange={(e) => setRecommendedSalary(Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-sm text-sm"
                />
                {recommendTarget.proposedMinSalary != null && recommendTarget.proposedMaxSalary != null && (
                  <p className="text-xs text-gray-400 mt-1">
                    Proposed range: {formatCurrency(recommendTarget.proposedMinSalary)} - {formatCurrency(recommendTarget.proposedMaxSalary)}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Justification</label>
                <textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-sm text-sm"
                  rows={4}
                  placeholder="Provide reasoning for the recommended salary..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => { setRecommendTarget(null); setRecommendedSalary(0); setJustification(''); }}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleProvideRecommendation}
                disabled={actionLoading === recommendTarget.id || recommendedSalary <= 0}
                className="px-4 py-2 text-sm bg-gold-500 text-violet-950 rounded-full hover:bg-gold-600 disabled:opacity-50"
              >
                {actionLoading === recommendTarget.id ? 'Submitting...' : 'Submit Recommendation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {approveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-sm shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Approve Recommendation</h3>
            <p className="text-sm text-gray-500 mb-4">
              {approveTarget.positionTitle} - {formatCurrency(approveTarget.recommendedSalary || approveTarget.proposedTargetSalary)}
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Approval Notes (optional)</label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-sm text-sm"
                rows={3}
                placeholder="Add any notes about this approval..."
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => { setApproveTarget(null); setApprovalNotes(''); }}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={actionLoading === approveTarget.id}
                className="px-4 py-2 text-sm text-white bg-green-600 rounded-full hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading === approveTarget.id ? 'Approving...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-sm shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Reject Recommendation</h3>
            <p className="text-sm text-gray-500 mb-4">{rejectTarget.positionTitle}</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rejection Reason <span className="text-gray-400">(min 10 characters)</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-sm text-sm"
                rows={4}
                placeholder="Please provide a detailed reason for rejection..."
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => { setRejectTarget(null); setRejectReason(''); }}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading === rejectTarget.id || rejectReason.trim().length < 10}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-full hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading === rejectTarget.id ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
