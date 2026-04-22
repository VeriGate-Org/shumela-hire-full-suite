'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PageWrapper from '@/components/PageWrapper';
import { performanceEnhancementService } from '@/services/performanceEnhancementService';
import StatusPill from '@/components/StatusPill';
import { TableSkeleton } from '@/components/LoadingComponents';
import EmptyState from '@/components/EmptyState';
import { ClipboardDocumentListIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/components/Toast';

const STATUS_TABS = ['ALL', 'PENDING', 'EMPLOYEE_SUBMITTED', 'MANAGER_SUBMITTED', 'COMPLETED'] as const;

export default function ReviewsListPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [contractId, setContractId] = useState('');
  const [reviewType, setReviewType] = useState('MID_YEAR');
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadReviews();
  }, [activeTab]);

  async function loadReviews() {
    setLoading(true);
    try {
      const params: any = {};
      if (activeTab !== 'ALL') params.status = activeTab;
      const data = await performanceEnhancementService.getReviews(params);
      setReviews(data);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!contractId) return;
    setCreating(true);
    try {
      await performanceEnhancementService.createReview(Number(contractId), reviewType);
      toast('Review created successfully', 'success');
      setShowCreateForm(false);
      setContractId('');
      loadReviews();
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setCreating(false);
    }
  }

  return (
    <PageWrapper
      title="Performance Reviews"
      subtitle="Manage employee performance reviews and assessments"
      actions={
        <button onClick={() => setShowCreateForm(!showCreateForm)} className="btn-cta inline-flex items-center gap-2">
          <PlusIcon className="w-4 h-4" /> Create Review
        </button>
      }
    >
      <div className="space-y-4">
        {showCreateForm && (
          <div className="enterprise-card p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Create New Review</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Contract ID</label>
                <input type="number" value={contractId} onChange={(e) => setContractId(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Enter contract ID" />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Review Type</label>
                <select value={reviewType} onChange={(e) => setReviewType(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm">
                  <option value="MID_YEAR">Mid-Year Review</option>
                  <option value="FINAL">Final Review</option>
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button onClick={handleCreate} disabled={creating || !contractId}
                  className="btn-cta disabled:opacity-50">
                  {creating ? 'Creating...' : 'Create'}
                </button>
                <button onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border text-sm rounded-md hover:bg-muted">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Status Tabs */}
        <div className="flex gap-1 bg-muted p-1 rounded-lg overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                activeTab === tab ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'ALL' ? 'All' : tab.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="enterprise-card p-6"><TableSkeleton /></div>
        ) : reviews.length === 0 ? (
          <EmptyState
            icon={ClipboardDocumentListIcon}
            title="No Reviews Found"
            description="No performance reviews match the selected filter."
          />
        ) : (
          <div className="enterprise-card overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Self Rating</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Manager Rating</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Final</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Due Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-muted">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      {review.contract?.employeeName || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {review.type === 'MID_YEAR' ? 'Mid-Year' : 'Final'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill value={review.status} domain="reviewStatus" />
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {review.selfRating != null ? `${review.selfRating}/5` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {review.managerRating != null ? `${review.managerRating}/5` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      {review.finalRating != null ? `${review.finalRating}/5` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {review.dueDate ? new Date(review.dueDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/performance/reviews/${review.id}`}
                        className="text-sm text-blue-600 hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
