'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { trainingService, IndividualDevelopmentPlan, IDPGoal } from '@/services/trainingService';
import {
  ArrowLeftIcon,
  PlusIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  ACTIVE: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const goalStatusColors: Record<string, string> = {
  NOT_STARTED: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function IDPDetailPage() {
  const params = useParams();
  const planId = params.id as string;

  const [idp, setIdp] = useState<IndividualDevelopmentPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [submittingGoal, setSubmittingGoal] = useState(false);
  const [togglingGoalId, setTogglingGoalId] = useState<string | null>(null);
  const [goalForm, setGoalForm] = useState({
    title: '',
    description: '',
    targetDate: '',
  });

  const fetchIDP = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await trainingService.getIDP(planId);
      setIdp(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load development plan');
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    if (planId) {
      fetchIDP();
    }
  }, [planId, fetchIDP]);

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingGoal(true);
    try {
      const updated = await trainingService.addIDPGoal(planId, {
        title: goalForm.title,
        description: goalForm.description || null,
        targetDate: goalForm.targetDate || null,
        status: 'NOT_STARTED',
        linkedCourseId: null,
        linkedCertificationId: null,
        sortOrder: (idp?.goals.length ?? 0) + 1,
      });
      setIdp(updated);
      setGoalForm({ title: '', description: '', targetDate: '' });
      setShowGoalForm(false);
    } catch (err: any) {
      alert(err.message || 'Failed to add goal');
    } finally {
      setSubmittingGoal(false);
    }
  };

  const handleToggleGoal = async (goal: IDPGoal) => {
    if (!goal.id) return;
    const newStatus = goal.status === 'COMPLETED' ? 'NOT_STARTED' : 'COMPLETED';
    setTogglingGoalId(goal.id);
    try {
      const updated = await trainingService.updateIDPGoal(planId, goal.id, { status: newStatus });
      setIdp(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to update goal');
    } finally {
      setTogglingGoalId(null);
    }
  };

  const handleStatusTransition = async (goal: IDPGoal, newStatus: string) => {
    if (!goal.id) return;
    setTogglingGoalId(goal.id);
    try {
      const updated = await trainingService.updateIDPGoal(planId, goal.id, { status: newStatus });
      setIdp(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to update goal status');
    } finally {
      setTogglingGoalId(null);
    }
  };

  if (loading) {
    return (
      <FeatureGate feature="TRAINING_MANAGEMENT">
        <PageWrapper title="Development Plan" subtitle="Loading...">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </PageWrapper>
      </FeatureGate>
    );
  }

  if (error || !idp) {
    return (
      <FeatureGate feature="TRAINING_MANAGEMENT">
        <PageWrapper title="Development Plan" subtitle="Error loading plan">
          <div className="enterprise-card p-8 text-center">
            <ClipboardDocumentListIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{error || 'Plan not found'}</h3>
            <p className="text-sm text-gray-500 mb-6">Please try again or go back.</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={fetchIDP}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Retry
              </button>
              <Link
                href="/training/idps"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Back to IDPs
              </Link>
            </div>
          </div>
        </PageWrapper>
      </FeatureGate>
    );
  }

  const completedGoals = idp.goals.filter(g => g.status === 'COMPLETED').length;
  const totalGoals = idp.goals.length;
  const progress = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  return (
    <FeatureGate feature="TRAINING_MANAGEMENT">
      <PageWrapper title={idp.title} subtitle="Individual Development Plan">
        <div className="space-y-6">
          {/* Back link */}
          <Link
            href="/training/idps"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Development Plans
          </Link>

          {/* IDP Info Card */}
          <div className="enterprise-card p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{idp.title}</h2>
                {idp.description && (
                  <p className="text-sm text-gray-500 mt-1">{idp.description}</p>
                )}
              </div>
              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[idp.status] || ''}`}>
                {idp.status}
              </span>
            </div>

            <div className="flex flex-wrap gap-6 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-1.5">
                <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
                <span>Start: {formatDate(idp.startDate)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
                <span>Target: {formatDate(idp.targetDate)}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm text-gray-500 mb-1">
                <span>{completedGoals} / {totalGoals} goals completed</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div
                  className="h-2 bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Goals Section */}
          <div className="enterprise-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Development Goals</h3>
              <button
                onClick={() => setShowGoalForm(!showGoalForm)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                <PlusIcon className="w-3.5 h-3.5" /> Add Goal
              </button>
            </div>

            {/* Add Goal Form */}
            {showGoalForm && (
              <form onSubmit={handleAddGoal} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Goal Title *</label>
                  <input
                    type="text"
                    required
                    value={goalForm.title}
                    onChange={e => setGoalForm({ ...goalForm, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="e.g. Complete project management certification"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={goalForm.description}
                    onChange={e => setGoalForm({ ...goalForm, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    rows={2}
                    placeholder="Describe the goal and success criteria..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Target Date</label>
                  <input
                    type="date"
                    value={goalForm.targetDate}
                    onChange={e => setGoalForm({ ...goalForm, targetDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowGoalForm(false)}
                    className="px-3 py-1.5 text-xs text-gray-600 border rounded-lg hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingGoal}
                    className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submittingGoal ? 'Adding...' : 'Add Goal'}
                  </button>
                </div>
              </form>
            )}

            {/* Goals List */}
            {idp.goals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircleIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm">No goals added yet. Click &quot;Add Goal&quot; to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {idp.goals.map(goal => (
                  <div
                    key={goal.id ?? goal.sortOrder}
                    className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => handleToggleGoal(goal)}
                      disabled={togglingGoalId === goal.id}
                      className="mt-0.5 flex-shrink-0"
                    >
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          goal.status === 'COMPLETED'
                            ? 'bg-green-600 border-green-600'
                            : 'border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {goal.status === 'COMPLETED' && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>

                    {/* Goal Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-sm font-medium ${
                            goal.status === 'COMPLETED' ? 'line-through text-gray-400' : 'text-foreground'
                          }`}
                        >
                          {goal.title}
                        </span>
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${goalStatusColors[goal.status] || ''}`}>
                          {goal.status.replace('_', ' ')}
                        </span>
                      </div>

                      {goal.description && (
                        <p className="text-xs text-gray-500 mb-1">{goal.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                        {goal.targetDate && (
                          <span className="flex items-center gap-1">
                            <CalendarDaysIcon className="w-3 h-3" />
                            Target: {formatDate(goal.targetDate)}
                          </span>
                        )}
                        {goal.linkedCourseId && (
                          <span className="flex items-center gap-1">
                            <AcademicCapIcon className="w-3 h-3" />
                            Linked Course #{goal.linkedCourseId}
                          </span>
                        )}
                        {goal.linkedCertificationId && (
                          <span className="flex items-center gap-1">
                            <ShieldCheckIcon className="w-3 h-3" />
                            Linked Cert #{goal.linkedCertificationId}
                          </span>
                        )}
                      </div>

                      {/* Status Transition Buttons */}
                      {goal.status !== 'COMPLETED' && goal.status !== 'CANCELLED' && goal.id && (
                        <div className="flex gap-2 mt-2">
                          {goal.status === 'NOT_STARTED' && (
                            <button
                              onClick={() => handleStatusTransition(goal, 'IN_PROGRESS')}
                              disabled={togglingGoalId === goal.id}
                              className="px-2 py-0.5 text-[10px] font-medium text-blue-700 bg-blue-50 rounded hover:bg-blue-100 disabled:opacity-50"
                            >
                              Start
                            </button>
                          )}
                          {goal.status === 'IN_PROGRESS' && (
                            <button
                              onClick={() => handleStatusTransition(goal, 'COMPLETED')}
                              disabled={togglingGoalId === goal.id}
                              className="px-2 py-0.5 text-[10px] font-medium text-green-700 bg-green-50 rounded hover:bg-green-100 disabled:opacity-50"
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
