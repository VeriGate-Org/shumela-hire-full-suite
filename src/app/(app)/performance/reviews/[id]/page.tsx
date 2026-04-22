'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageWrapper from '@/components/PageWrapper';
import { performanceEnhancementService } from '@/services/performanceEnhancementService';
import StatusPill from '@/components/StatusPill';
import { useToast } from '@/components/Toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reviewId = Number(params.id);
  const { toast } = useToast();

  const [review, setReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Self assessment form
  const [selfNotes, setSelfNotes] = useState('');
  const [selfRating, setSelfRating] = useState('');
  const [selfGoalScores, setSelfGoalScores] = useState<Record<number, { score: string; comment: string }>>({});

  // Manager assessment form
  const [mgrNotes, setMgrNotes] = useState('');
  const [mgrRating, setMgrRating] = useState('');
  const [mgrGoalScores, setMgrGoalScores] = useState<Record<number, { score: string; comment: string }>>({});

  useEffect(() => {
    loadReview();
  }, [reviewId]);

  async function loadReview() {
    setLoading(true);
    try {
      const data = await performanceEnhancementService.getReview(reviewId);
      setReview(data);
      if (data.selfAssessmentNotes) setSelfNotes(data.selfAssessmentNotes);
      if (data.selfRating) setSelfRating(String(data.selfRating));
      if (data.managerAssessmentNotes) setMgrNotes(data.managerAssessmentNotes);
      if (data.managerRating) setMgrRating(String(data.managerRating));
    } catch {
      toast('Failed to load review', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSelfSubmit() {
    setSaving(true);
    try {
      const goalScores = Object.entries(selfGoalScores).map(([goalId, val]) => ({
        goalId: Number(goalId),
        score: parseFloat(val.score) || 0,
        comment: val.comment,
      }));
      const updated = await performanceEnhancementService.submitSelfAssessment(reviewId, {
        notes: selfNotes,
        rating: parseFloat(selfRating) || 0,
        goalScores,
      });
      setReview(updated);
      toast('Self assessment submitted', 'success');
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleManagerSubmit() {
    setSaving(true);
    try {
      const goalScores = Object.entries(mgrGoalScores).map(([goalId, val]) => ({
        goalId: Number(goalId),
        score: parseFloat(val.score) || 0,
        comment: val.comment,
      }));
      const updated = await performanceEnhancementService.submitManagerAssessment(reviewId, {
        notes: mgrNotes,
        rating: parseFloat(mgrRating) || 0,
        goalScores,
      });
      setReview(updated);
      toast('Manager assessment submitted', 'success');
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleComplete() {
    setSaving(true);
    try {
      const updated = await performanceEnhancementService.completeReview(reviewId);
      setReview(updated);
      toast('Review completed', 'success');
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <PageWrapper title="Performance Review" subtitle="Loading...">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </PageWrapper>
    );
  }

  if (!review) {
    return (
      <PageWrapper title="Review Not Found" subtitle="">
        <p className="text-muted-foreground">The requested review could not be found.</p>
      </PageWrapper>
    );
  }

  const isPending = review.status === 'PENDING';
  const isEmployeeSubmitted = review.status === 'EMPLOYEE_SUBMITTED';
  const isManagerSubmitted = review.status === 'MANAGER_SUBMITTED';
  const isCompleted = review.status === 'COMPLETED';
  const goalScores = review.goalScores || [];

  return (
    <PageWrapper
      title="Performance Review"
      subtitle={`${review.contract?.employeeName || 'Employee'} — ${review.type === 'MID_YEAR' ? 'Mid-Year' : 'Final'} Review`}
      actions={
        <Link href="/performance/reviews" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeftIcon className="w-4 h-4" /> Back to Reviews
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Review Header */}
        <div className="enterprise-card p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <StatusPill value={review.status} domain="reviewStatus" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Department</p>
              <p className="text-sm font-medium text-foreground">{review.contract?.department || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Due Date</p>
              <p className="text-sm font-medium text-foreground">
                {review.dueDate ? new Date(review.dueDate).toLocaleDateString() : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Final Rating</p>
              <p className="text-2xl font-bold text-foreground">
                {review.finalRating != null ? `${review.finalRating}/5` : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Goal Scoring Table */}
        {goalScores.length > 0 && (
          <div className="enterprise-card overflow-x-auto">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Goal Scores</h3>
            </div>
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Goal</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase w-20">Weight</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase w-24">Self Score</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Self Comment</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase w-24">Mgr Score</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Mgr Comment</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase w-20">Final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {goalScores.map((gs: any) => (
                  <tr key={gs.goal?.id || Math.random()} className="hover:bg-muted">
                    <td className="px-4 py-3 text-sm text-foreground">{gs.goal?.title || 'Goal'}</td>
                    <td className="px-4 py-3 text-sm text-center text-muted-foreground">
                      {gs.goal?.weighting != null ? `${gs.goal.weighting}%` : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isPending ? (
                        <input type="number" min="0" max="5" step="0.5"
                          className="w-16 border rounded px-2 py-1 text-sm text-center"
                          value={selfGoalScores[gs.goal?.id]?.score || ''}
                          onChange={(e) => setSelfGoalScores((prev) => ({
                            ...prev,
                            [gs.goal?.id]: { ...prev[gs.goal?.id], score: e.target.value },
                          }))}
                        />
                      ) : (
                        <span className="text-sm">{gs.selfScore != null ? gs.selfScore : '—'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isPending ? (
                        <input type="text" className="w-full border rounded px-2 py-1 text-sm"
                          placeholder="Comment..."
                          value={selfGoalScores[gs.goal?.id]?.comment || ''}
                          onChange={(e) => setSelfGoalScores((prev) => ({
                            ...prev,
                            [gs.goal?.id]: { ...prev[gs.goal?.id], comment: e.target.value },
                          }))}
                        />
                      ) : (
                        <span className="text-sm text-muted-foreground">{gs.selfComment || '—'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {(isEmployeeSubmitted || isPending) && !isCompleted ? (
                        <input type="number" min="0" max="5" step="0.5"
                          className="w-16 border rounded px-2 py-1 text-sm text-center"
                          value={mgrGoalScores[gs.goal?.id]?.score || ''}
                          onChange={(e) => setMgrGoalScores((prev) => ({
                            ...prev,
                            [gs.goal?.id]: { ...prev[gs.goal?.id], score: e.target.value },
                          }))}
                        />
                      ) : (
                        <span className="text-sm">{gs.managerScore != null ? gs.managerScore : '—'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {(isEmployeeSubmitted || isPending) && !isCompleted ? (
                        <input type="text" className="w-full border rounded px-2 py-1 text-sm"
                          placeholder="Comment..."
                          value={mgrGoalScores[gs.goal?.id]?.comment || ''}
                          onChange={(e) => setMgrGoalScores((prev) => ({
                            ...prev,
                            [gs.goal?.id]: { ...prev[gs.goal?.id], comment: e.target.value },
                          }))}
                        />
                      ) : (
                        <span className="text-sm text-muted-foreground">{gs.managerComment || '—'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-medium">
                      {gs.finalScore != null ? gs.finalScore : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Self Assessment Section */}
        <div className="enterprise-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Self Assessment</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Overall Notes</label>
              {isPending ? (
                <textarea rows={4} value={selfNotes} onChange={(e) => setSelfNotes(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  placeholder="Describe your key achievements and challenges during this review period..." />
              ) : (
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">{review.selfAssessmentNotes || 'Not submitted yet'}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Overall Rating (1-5)</label>
                {isPending ? (
                  <input type="number" min="1" max="5" step="0.5" value={selfRating}
                    onChange={(e) => setSelfRating(e.target.value)}
                    className="w-24 border rounded-md px-3 py-2 text-sm" />
                ) : (
                  <p className="text-lg font-bold text-foreground">{review.selfRating || '—'}</p>
                )}
              </div>
              {review.selfSubmittedAt && (
                <p className="text-xs text-muted-foreground">Submitted: {new Date(review.selfSubmittedAt).toLocaleString()}</p>
              )}
            </div>
            {isPending && (
              <button onClick={handleSelfSubmit} disabled={saving || !selfNotes || !selfRating}
                className="btn-cta disabled:opacity-50">
                {saving ? 'Submitting...' : 'Submit Self Assessment'}
              </button>
            )}
          </div>
        </div>

        {/* Manager Assessment Section */}
        <div className="enterprise-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Manager Assessment</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Manager Notes</label>
              {(isEmployeeSubmitted || isPending) && !isCompleted ? (
                <textarea rows={4} value={mgrNotes} onChange={(e) => setMgrNotes(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  placeholder="Provide your assessment of the employee's performance..." />
              ) : (
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">{review.managerAssessmentNotes || 'Not submitted yet'}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Manager Rating (1-5)</label>
                {(isEmployeeSubmitted || isPending) && !isCompleted ? (
                  <input type="number" min="1" max="5" step="0.5" value={mgrRating}
                    onChange={(e) => setMgrRating(e.target.value)}
                    className="w-24 border rounded-md px-3 py-2 text-sm" />
                ) : (
                  <p className="text-lg font-bold text-foreground">{review.managerRating || '—'}</p>
                )}
              </div>
              {review.managerSubmittedAt && (
                <p className="text-xs text-muted-foreground">Submitted: {new Date(review.managerSubmittedAt).toLocaleString()}</p>
              )}
            </div>
            {(isEmployeeSubmitted || isPending) && !isCompleted && (
              <button onClick={handleManagerSubmit} disabled={saving || !mgrNotes || !mgrRating}
                className="btn-cta disabled:opacity-50">
                {saving ? 'Submitting...' : 'Submit Manager Assessment'}
              </button>
            )}
          </div>
        </div>

        {/* Complete Button */}
        {(isManagerSubmitted || (review.selfSubmittedAt && review.managerSubmittedAt)) && !isCompleted && (
          <div className="flex justify-end">
            <button onClick={handleComplete} disabled={saving}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">
              {saving ? 'Completing...' : 'Finalize Review'}
            </button>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
