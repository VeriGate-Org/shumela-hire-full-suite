'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import PageWrapper from '@/components/PageWrapper';
import { performanceEnhancementService } from '@/services/performanceEnhancementService';
import StatusPill from '@/components/StatusPill';
import { TableSkeleton } from '@/components/LoadingComponents';
import EmptyState from '@/components/EmptyState';
import { ClipboardDocumentListIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/components/Toast';

const STATUS_TABS = ['ALL', 'PENDING', 'EMPLOYEE_SUBMITTED', 'MANAGER_SUBMITTED', 'COMPLETED'] as const;

function StarIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function RatingStars({ rating, max = 5 }: { rating: number; max?: number }) {
  const stars = [];
  for (let i = 1; i <= max; i++) {
    stars.push(
      <StarIcon key={i} filled={i <= Math.round(rating)} className={i <= Math.round(rating) ? 'text-cta' : 'text-border'} />
    );
  }
  return <div className="flex gap-0.5">{stars}</div>;
}

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

  // Summary stats derived from reviews
  const stats = useMemo(() => {
    const total = reviews.length;
    const completed = reviews.filter((r) => r.status === 'COMPLETED').length;
    const pending = reviews.filter((r) => r.status === 'PENDING').length;
    const inProgress = reviews.filter(
      (r) => r.status === 'EMPLOYEE_SUBMITTED' || r.status === 'MANAGER_SUBMITTED'
    ).length;
    const avgRating =
      reviews.filter((r) => r.finalRating != null).length > 0
        ? reviews
            .filter((r) => r.finalRating != null)
            .reduce((sum: number, r: any) => sum + r.finalRating, 0) /
          reviews.filter((r) => r.finalRating != null).length
        : null;
    return { total, completed, pending, inProgress, avgRating };
  }, [reviews]);

  const completionPct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const tabLabels: Record<string, string> = {
    ALL: 'All Reviews',
    PENDING: 'Pending',
    EMPLOYEE_SUBMITTED: 'Employee Submitted',
    MANAGER_SUBMITTED: 'Manager Submitted',
    COMPLETED: 'Completed',
  };

  return (
    <PageWrapper
      title="Performance Reviews"
      subtitle="Track performance, goals, and development plans"
      actions={
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn-cta inline-flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" /> Create Review
        </button>
      }
    >
      <div className="space-y-6">
        {/* ===== CREATE FORM (collapsible) ===== */}
        {showCreateForm && (
          <div className="enterprise-card overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-teal-600 px-6 py-4 sm:px-8">
              <h3 className="text-lg font-extrabold text-primary-foreground tracking-tight">
                Create New Review
              </h3>
              <p className="text-sm text-primary-foreground/70 mt-0.5">
                Initiate a performance review for an employee contract
              </p>
            </div>
            <div className="p-6 sm:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.8125rem] font-semibold text-foreground">
                    Contract ID <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    value={contractId}
                    onChange={(e) => setContractId(e.target.value)}
                    className="w-full border border-border rounded-control px-4 py-2.5 text-sm text-foreground bg-card placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                    placeholder="Enter contract ID"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.8125rem] font-semibold text-foreground">
                    Review Type
                  </label>
                  <select
                    value={reviewType}
                    onChange={(e) => setReviewType(e.target.value)}
                    className="w-full border border-border rounded-control px-4 py-2.5 text-sm text-foreground bg-card focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  >
                    <option value="MID_YEAR">Mid-Year Review</option>
                    <option value="FINAL">Final Review</option>
                  </select>
                </div>
                <div className="flex items-end gap-3">
                  <button
                    onClick={handleCreate}
                    disabled={creating || !contractId}
                    className="btn-cta disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : 'Create'}
                  </button>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="px-5 py-2 border-2 border-border text-sm font-semibold rounded-button text-foreground hover:border-primary hover:bg-surface-navy transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== HERO SUMMARY CARD ===== */}
        <div className="enterprise-card overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-teal-600 px-6 py-5 sm:px-8 flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-[1.375rem] font-extrabold text-primary-foreground tracking-tight">
              Performance Reviews
            </h2>
            <span className="bg-white/20 text-primary-foreground text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-button">
              Current Period
            </span>
          </div>
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] gap-8 items-center">
              {/* Overall Rating Block */}
              <div className="text-center">
                <div className="text-5xl font-extrabold text-primary leading-none tracking-tight">
                  {stats.avgRating != null ? stats.avgRating.toFixed(1) : '--'}
                  <span className="text-xl font-semibold text-muted-foreground">/5.0</span>
                </div>
                {stats.avgRating != null && (
                  <div className="flex justify-center mt-2">
                    <RatingStars rating={stats.avgRating} />
                  </div>
                )}
                <div className="text-xs text-muted-foreground font-medium mt-1.5">
                  Avg. Final Rating
                </div>
              </div>

              {/* Details */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-6 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-[0.8125rem] text-muted-foreground font-medium">Total:</span>
                    <span className="text-sm font-bold text-foreground">{stats.total}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[0.8125rem] text-muted-foreground font-medium">Completed:</span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-button text-xs font-bold uppercase tracking-wide bg-success-bg text-success">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      {stats.completed}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[0.8125rem] text-muted-foreground font-medium">Pending:</span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-button text-xs font-bold uppercase tracking-wide bg-warning-bg text-warning">
                      {stats.pending}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[0.8125rem] text-muted-foreground font-medium">In Progress:</span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-button text-xs font-bold uppercase tracking-wide bg-surface-navy text-primary">
                      {stats.inProgress}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="text-[0.8125rem] text-muted-foreground font-medium mb-2">
                    {stats.completed} of {stats.total} reviews completed
                  </div>
                  <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-teal-600 transition-all duration-700"
                      style={{ width: `${completionPct}%` }}
                    />
                  </div>
                </div>

                {/* Stages Row */}
                <div className="flex items-center gap-0 flex-wrap">
                  <div className={`flex items-center gap-2 text-[0.8125rem] font-semibold ${stats.completed > 0 ? 'text-success' : 'text-muted-foreground'}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${stats.completed > 0 ? 'bg-success-bg text-success' : 'bg-muted text-muted-foreground'}`}>
                      {stats.completed > 0 ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      ) : '1'}
                    </div>
                    Goal Setting
                  </div>
                  <div className={`w-8 h-0.5 mx-1 shrink-0 ${stats.completed > 0 ? 'bg-success' : 'bg-border'}`} />
                  <div className={`flex items-center gap-2 text-[0.8125rem] font-semibold ${stats.inProgress > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${stats.inProgress > 0 ? 'bg-surface-navy text-primary ring-2 ring-primary/15' : 'bg-muted text-muted-foreground'}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    </div>
                    Self-Assessment
                  </div>
                  <div className="w-8 h-0.5 mx-1 bg-border shrink-0" />
                  <div className="flex items-center gap-2 text-[0.8125rem] font-semibold text-muted-foreground">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs bg-muted text-muted-foreground shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    </div>
                    Manager Review
                  </div>
                  <div className="w-8 h-0.5 mx-1 bg-border shrink-0" />
                  <div className="flex items-center gap-2 text-[0.8125rem] font-semibold text-muted-foreground">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs bg-muted text-muted-foreground shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                    </div>
                    Calibration
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="flex flex-col items-end gap-3">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="btn-cta inline-flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                  New Review
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ===== STATUS FILTER TABS (mock tab-bar style) ===== */}
        <div className="flex gap-0 border-b-2 border-border overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-[3px] -mb-[2px] ${
                activeTab === tab
                  ? 'text-primary border-primary'
                  : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-surface-navy'
              }`}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </div>

        {/* ===== REVIEWS LIST ===== */}
        {loading ? (
          <div className="enterprise-card p-6">
            <TableSkeleton />
          </div>
        ) : reviews.length === 0 ? (
          <EmptyState
            icon={ClipboardDocumentListIcon}
            title="No Reviews Found"
            description="No performance reviews match the selected filter."
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
            {/* Left Column: Reviews Table */}
            <div className="enterprise-card overflow-hidden lg:col-span-1">
              <div className="px-6 pt-5 pb-0">
                <h3 className="text-[1.0625rem] font-bold text-foreground">Review Records</h3>
                <p className="text-[0.8125rem] text-muted-foreground mt-1">
                  {reviews.length} review{reviews.length !== 1 ? 's' : ''} in this view
                </p>
              </div>
              <div className="overflow-x-auto mt-4">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground bg-surface-navy border-b border-border">
                        Employee
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground bg-surface-navy border-b border-border">
                        Type
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground bg-surface-navy border-b border-border">
                        Status
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground bg-surface-navy border-b border-border">
                        Rating
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground bg-surface-navy border-b border-border">
                        Due Date
                      </th>
                      <th className="px-4 py-3 bg-surface-navy border-b border-border" />
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.map((review, idx) => (
                      <tr
                        key={review.id}
                        className="hover:bg-surface-navy transition-colors"
                      >
                        <td className="px-4 py-4 text-sm font-semibold text-foreground border-b border-border">
                          {review.contract?.employeeName || 'N/A'}
                        </td>
                        <td className="px-4 py-4 text-sm text-muted-foreground border-b border-border">
                          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-button text-xs font-bold uppercase tracking-wide bg-surface-navy text-primary">
                            {review.type === 'MID_YEAR' ? 'Mid-Year' : 'Final'}
                          </span>
                        </td>
                        <td className="px-4 py-4 border-b border-border">
                          <StatusPill value={review.status} domain="reviewStatus" />
                        </td>
                        <td className="px-4 py-4 border-b border-border">
                          {review.finalRating != null ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-primary">
                                {review.finalRating.toFixed(1)}
                              </span>
                              <RatingStars rating={review.finalRating} />
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">--</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm text-foreground border-b border-border">
                          {review.dueDate
                            ? new Date(review.dueDate).toLocaleDateString('en-ZA', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '--'}
                        </td>
                        <td className="px-4 py-4 border-b border-border">
                          <Link
                            href={`/performance/reviews/${review.id}`}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-button text-xs font-bold uppercase tracking-wider border-2 border-border text-primary hover:border-primary hover:bg-surface-navy transition-all"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column: Rating Breakdown */}
            <div className="enterprise-card overflow-hidden lg:col-span-1">
              <div className="px-6 pt-5 pb-0">
                <h3 className="text-[1.0625rem] font-bold text-foreground">Rating Breakdown</h3>
                <p className="text-[0.8125rem] text-muted-foreground mt-1">
                  Performance across individual reviews
                </p>
              </div>
              <div className="px-6 py-5 flex flex-col gap-5">
                {reviews.map((review) => {
                  const hasRatings =
                    review.selfRating != null ||
                    review.managerRating != null ||
                    review.finalRating != null;
                  if (!hasRatings) return null;
                  return (
                    <div key={review.id} className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-foreground">
                          {review.contract?.employeeName || 'N/A'}
                        </span>
                        <span className="text-[0.8125rem] font-bold text-primary">
                          {review.finalRating != null
                            ? `${review.finalRating.toFixed(1)}/5`
                            : '--'}
                        </span>
                      </div>
                      {/* Self Rating Bar */}
                      {review.selfRating != null && (
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground font-medium">Self Rating</span>
                            <span className="text-xs font-bold text-foreground">{review.selfRating.toFixed(1)}/5</span>
                          </div>
                          <div className="w-full h-2.5 bg-border rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-700"
                              style={{ width: `${(review.selfRating / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                      {/* Manager Rating Bar */}
                      {review.managerRating != null && (
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground font-medium">Manager Rating</span>
                            <span className="text-xs font-bold text-foreground">{review.managerRating.toFixed(1)}/5</span>
                          </div>
                          <div className="w-full h-2.5 bg-border rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-teal-600 transition-all duration-700"
                              style={{ width: `${(review.managerRating / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                      {/* Final Rating Bar */}
                      {review.finalRating != null && (
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground font-medium">Final Rating</span>
                            <span className="text-xs font-bold text-foreground">{review.finalRating.toFixed(1)}/5</span>
                          </div>
                          <div className="w-full h-2.5 bg-border rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-cta transition-all duration-700"
                              style={{ width: `${(review.finalRating / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {reviews.filter(
                  (r) => r.selfRating != null || r.managerRating != null || r.finalRating != null
                ).length === 0 && (
                  <div className="py-8 text-center">
                    <p className="text-sm text-muted-foreground">No rating data available yet.</p>
                  </div>
                )}
                {/* Legend */}
                <div className="flex items-center gap-4 pt-2 border-t border-border">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                    <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
                    Self
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                    <div className="w-2.5 h-2.5 rounded-sm bg-teal-600" />
                    Manager
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                    <div className="w-2.5 h-2.5 rounded-sm bg-cta" />
                    Final
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
