'use client';

import { useState, useEffect, useMemo } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { InlineLoading } from '@/components/LoadingComponents';
import StatusPill from '@/components/StatusPill';
import {
  PresentationChartBarIcon,
  CalendarDaysIcon,
  UserIcon,
  StarIcon,
  ClipboardDocumentCheckIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api-fetch';
import { performanceEnhancementService } from '@/services/performanceEnhancementService';
import type { PerformanceContract, PerformanceGoal, PerformanceReview } from '@/types/performance';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

const GOAL_TYPE_COLORS: Record<string, string> = {
  STRATEGIC: 'bg-blue-50 text-blue-700',
  OPERATIONAL: 'bg-green-50 text-green-700',
  DEVELOPMENT: 'bg-purple-50 text-purple-700',
  BEHAVIORAL: 'bg-amber-50 text-amber-700',
};

function RatingDisplay({ rating, label }: { rating: number; label: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-foreground">{rating.toFixed(1)}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="flex justify-center gap-0.5 mt-1">
        {[1, 2, 3, 4, 5].map(i => (
          <StarIcon
            key={i}
            className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function MyPerformancePage() {
  const { user } = useAuth();
  const employeeId = user?.employeeId || user?.id || '';

  const [contracts, setContracts] = useState<PerformanceContract[]>([]);
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [selfAssessments, setSelfAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employeeId) return;

    const fetchContracts = apiFetch(`/api/performance/contracts?employeeId=${employeeId}`)
      .then(res => res.ok ? res.json() : [])
      .catch(() => []);

    const fetchReviews = performanceEnhancementService.getReviews({ employeeId })
      .catch(() => []);

    const fetchSelfAssessments = performanceEnhancementService
      .getFeedbackRequestsForEmployee(Number(employeeId))
      .catch(() => ({ content: [] }));

    Promise.allSettled([fetchContracts, fetchReviews, fetchSelfAssessments])
      .then(([contractsRes, reviewsRes, selfRes]) => {
        if (contractsRes.status === 'fulfilled') {
          const all = Array.isArray(contractsRes.value) ? contractsRes.value : (contractsRes.value?.content ?? []);
          setContracts(Array.isArray(all) ? all : []);
        }
        if (reviewsRes.status === 'fulfilled') {
          setReviews(Array.isArray(reviewsRes.value) ? reviewsRes.value : []);
        }
        if (selfRes.status === 'fulfilled') {
          const raw = selfRes.value;
          const content = Array.isArray(raw) ? raw : (raw?.content ?? []);
          setSelfAssessments(content.filter((r: any) => r.feedbackType === 'SELF'));
        }
      })
      .finally(() => setLoading(false));
  }, [employeeId]);

  const activeContract = useMemo(
    () => contracts.find(c => c.status === 'ACTIVE' || c.status === 'SUBMITTED') || contracts[0] || null,
    [contracts]
  );

  const closedContracts = useMemo(
    () => contracts.filter(c => c.id !== activeContract?.id),
    [contracts, activeContract]
  );

  const midYearReview = useMemo(
    () => reviews.find(r => r.type === 'MID_YEAR' && r.contractId === activeContract?.id),
    [reviews, activeContract]
  );

  const finalReview = useMemo(
    () => reviews.find(r => r.type === 'FINAL' && r.contractId === activeContract?.id),
    [reviews, activeContract]
  );

  const selfAssessment = selfAssessments[0] || null;

  return (
    <FeatureGate feature="EMPLOYEE_SELF_SERVICE">
      <PageWrapper title="My Performance" subtitle="Your performance contract, goals, and review status">
        {loading ? (
          <InlineLoading message="Loading your performance data..." />
        ) : !activeContract ? (
          <div className="text-center py-16 enterprise-card max-w-lg mx-auto">
            <PresentationChartBarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium text-foreground mb-2">No performance cycle is active</p>
            <p className="text-sm text-muted-foreground">
              Your performance contract will appear here once your manager initiates the review cycle.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cycle Info Card */}
            <div className="enterprise-card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {activeContract.cycle?.name || 'Performance Contract'}
                  </h2>
                  {activeContract.cycle?.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {activeContract.cycle.description}
                    </p>
                  )}
                </div>
                <StatusPill value={activeContract.cycle?.status || activeContract.status} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Period</p>
                  <p className="font-medium text-foreground">
                    {activeContract.cycle?.startDate ? formatDate(activeContract.cycle.startDate) : '—'} –{' '}
                    {activeContract.cycle?.endDate ? formatDate(activeContract.cycle.endDate) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Manager</p>
                  <p className="font-medium text-foreground flex items-center gap-1">
                    <UserIcon className="w-3.5 h-3.5" />
                    {activeContract.managerName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Mid-Year Deadline</p>
                  <p className="font-medium text-foreground">
                    {activeContract.cycle?.midYearDeadline ? formatDate(activeContract.cycle.midYearDeadline) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Final Deadline</p>
                  <p className="font-medium text-foreground">
                    {activeContract.cycle?.finalReviewDeadline ? formatDate(activeContract.cycle.finalReviewDeadline) : '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Review Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Self Assessment */}
              <div className="enterprise-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <ClipboardDocumentCheckIcon className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-semibold text-foreground">Self Assessment</h3>
                </div>
                {selfAssessment?.status === 'SUBMITTED' ? (
                  <div className="space-y-2">
                    <StatusPill value="SUBMITTED" size="sm" />
                    {midYearReview?.selfRating && (
                      <div className="mt-2">
                        <RatingDisplay rating={midYearReview.selfRating} label="Your rating" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <StatusPill value="PENDING" size="sm" />
                    {selfAssessment?.dueDate && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <CalendarDaysIcon className="w-3.5 h-3.5" />
                        Due {formatDate(selfAssessment.dueDate)}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Mid-Year Review */}
              <div className="enterprise-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <PresentationChartBarIcon className="w-5 h-5 text-amber-600" />
                  <h3 className="text-sm font-semibold text-foreground">Mid-Year Review</h3>
                </div>
                {midYearReview ? (
                  <div className="space-y-2">
                    <StatusPill value={midYearReview.status} size="sm" />
                    {midYearReview.finalRating && (
                      <div className="mt-2">
                        <RatingDisplay rating={midYearReview.finalRating} label="Final rating" />
                      </div>
                    )}
                    {!midYearReview.finalRating && midYearReview.managerRating && (
                      <div className="mt-2">
                        <RatingDisplay rating={midYearReview.managerRating} label="Manager rating" />
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not yet initiated</p>
                )}
              </div>

              {/* Final Review */}
              <div className="enterprise-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <StarIcon className="w-5 h-5 text-green-600" />
                  <h3 className="text-sm font-semibold text-foreground">Final Review</h3>
                </div>
                {finalReview ? (
                  <div className="space-y-2">
                    <StatusPill value={finalReview.status} size="sm" />
                    {finalReview.finalRating && (
                      <div className="mt-2">
                        <RatingDisplay rating={finalReview.finalRating} label="Final rating" />
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not yet initiated</p>
                )}
              </div>
            </div>

            {/* Goals Table */}
            {activeContract.goals && activeContract.goals.length > 0 && (
              <div className="enterprise-card">
                <div className="px-6 py-4 border-b">
                  <h3 className="text-sm font-semibold text-foreground">Performance Goals</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left px-6 py-3 font-medium text-muted-foreground">Goal</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                        <th className="text-right px-6 py-3 font-medium text-muted-foreground">Weight</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {activeContract.goals.map((goal: PerformanceGoal) => (
                        <tr key={goal.id} className="hover:bg-muted/20">
                          <td className="px-6 py-3">
                            <p className="font-medium text-foreground">{goal.title}</p>
                            {goal.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                {goal.description}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${GOAL_TYPE_COLORS[goal.type] || 'bg-gray-100 text-gray-700'}`}>
                              {goal.type}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right font-medium text-foreground">
                            {goal.weighting}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t bg-muted/30">
                        <td className="px-6 py-2 font-medium text-muted-foreground" colSpan={2}>Total</td>
                        <td className="px-6 py-2 text-right font-semibold text-foreground">
                          {activeContract.goals.reduce((sum: number, g: PerformanceGoal) => sum + g.weighting, 0)}%
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Past Cycles */}
            {closedContracts.length > 0 && (
              <div className="enterprise-card p-6">
                <h3 className="text-sm font-semibold text-foreground mb-3">Past Cycles</h3>
                <div className="space-y-2">
                  {closedContracts.map(contract => {
                    const finalRev = reviews.find(r => r.type === 'FINAL' && r.contractId === contract.id);
                    return (
                      <div key={contract.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {contract.cycle?.name || 'Past Cycle'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {contract.cycle?.startDate ? formatDate(contract.cycle.startDate) : ''} –{' '}
                            {contract.cycle?.endDate ? formatDate(contract.cycle.endDate) : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {finalRev?.finalRating && (
                            <span className="text-sm font-semibold text-foreground">
                              {finalRev.finalRating.toFixed(1)}
                            </span>
                          )}
                          <StatusPill value={contract.status} size="sm" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Help Footer */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50/50 border border-blue-100">
              <InformationCircleIcon className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">About performance reviews</p>
                <p className="text-blue-700 text-xs">
                  Your performance contract outlines agreed goals for the current cycle. Complete your
                  self-assessment before the deadline. Your manager will then conduct the formal review.
                </p>
              </div>
            </div>
          </div>
        )}
      </PageWrapper>
    </FeatureGate>
  );
}
