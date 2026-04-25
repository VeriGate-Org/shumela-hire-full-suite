'use client';

import { useState, useEffect, useMemo } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { InlineLoading } from '@/components/LoadingComponents';
import StatusPill from '@/components/StatusPill';
import Link from 'next/link';
import {
  LightBulbIcon,
  CheckCircleIcon,
  PlayIcon,
  CalendarDaysIcon,
  AcademicCapIcon,
  ArrowLeftIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { trainingService, IndividualDevelopmentPlan, IDPGoal } from '@/services/trainingService';

type GoalStatus = IDPGoal['status'];

const STATUS_ORDER: Record<GoalStatus, number> = {
  IN_PROGRESS: 0,
  NOT_STARTED: 1,
  COMPLETED: 2,
  CANCELLED: 3,
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function getProgress(goals: IDPGoal[]): number {
  if (!goals.length) return 0;
  const completed = goals.filter(g => g.status === 'COMPLETED').length;
  return Math.round((completed / goals.length) * 100);
}

export default function MyDevelopmentPage() {
  const { user } = useAuth();
  const employeeId = user?.employeeId || user?.id || '';

  const [idps, setIdps] = useState<IndividualDevelopmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingGoal, setUpdatingGoal] = useState<string | null>(null);

  useEffect(() => {
    if (!employeeId) return;
    trainingService.getIDPs({ employeeId })
      .then(setIdps)
      .catch(() => setIdps([]))
      .finally(() => setLoading(false));
  }, [employeeId]);

  const activeIdp = useMemo(
    () => idps.find(p => p.status === 'ACTIVE') || idps[0] || null,
    [idps]
  );

  const sortedGoals = useMemo(() => {
    if (!activeIdp) return [];
    return [...activeIdp.goals].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
  }, [activeIdp]);

  const progress = activeIdp ? getProgress(activeIdp.goals) : 0;

  const handleToggleGoal = async (goal: IDPGoal) => {
    if (!activeIdp || !goal.id) return;
    const newStatus: GoalStatus =
      goal.status === 'NOT_STARTED' ? 'IN_PROGRESS' :
      goal.status === 'IN_PROGRESS' ? 'COMPLETED' :
      goal.status;
    if (newStatus === goal.status) return;

    setUpdatingGoal(goal.id);
    try {
      const updated = await trainingService.updateIDPGoal(activeIdp.id, goal.id, { status: newStatus });
      setIdps(prev => prev.map(p => p.id === updated.id ? updated : p));
    } catch {
      // silently fail — keep existing state
    } finally {
      setUpdatingGoal(null);
    }
  };

  return (
    <FeatureGate feature="EMPLOYEE_SELF_SERVICE">
      <PageWrapper title="My Development" subtitle="Your individual development plan and goals">
        {loading ? (
          <InlineLoading message="Loading your development plan..." />
        ) : !activeIdp ? (
          <div className="text-center py-16 enterprise-card max-w-lg mx-auto">
            <LightBulbIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium text-foreground mb-2">Your development plan is being prepared</p>
            <p className="text-sm text-muted-foreground">
              Your manager will create your Individual Development Plan. Check back soon.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Hero Card */}
            <div className="enterprise-card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{activeIdp.title}</h2>
                  {activeIdp.description && (
                    <p className="text-sm text-muted-foreground mt-1">{activeIdp.description}</p>
                  )}
                </div>
                <StatusPill value={activeIdp.status} />
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                {activeIdp.startDate && (
                  <span className="flex items-center gap-1">
                    <CalendarDaysIcon className="w-4 h-4" />
                    {formatDate(activeIdp.startDate)} – {activeIdp.targetDate ? formatDate(activeIdp.targetDate) : 'Ongoing'}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <AcademicCapIcon className="w-4 h-4" />
                  {activeIdp.goals.length} goal{activeIdp.goals.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{activeIdp.goals.filter(g => g.status === 'COMPLETED').length} of {activeIdp.goals.length} goals completed</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2.5 bg-gray-200 rounded-full">
                  <div
                    className="h-2.5 bg-blue-600 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Goals List */}
            <div className="enterprise-card">
              <div className="px-6 py-4 border-b">
                <h3 className="text-sm font-semibold text-foreground">Development Goals</h3>
              </div>
              <div className="divide-y">
                {sortedGoals.map((goal, idx) => (
                  <div key={goal.id || idx} className="px-6 py-4 flex items-start gap-4">
                    {/* Status Icon */}
                    <div className={`mt-0.5 shrink-0 ${
                      goal.status === 'COMPLETED' ? 'text-green-600' :
                      goal.status === 'IN_PROGRESS' ? 'text-blue-600' :
                      'text-gray-400'
                    }`}>
                      {goal.status === 'COMPLETED' ? (
                        <CheckCircleIcon className="w-5 h-5" />
                      ) : goal.status === 'IN_PROGRESS' ? (
                        <PlayIcon className="w-5 h-5" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                      )}
                    </div>

                    {/* Goal Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${
                        goal.status === 'COMPLETED' ? 'text-muted-foreground line-through' : 'text-foreground'
                      }`}>
                        {goal.title}
                      </p>
                      {goal.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{goal.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 mt-1.5">
                        {goal.targetDate && (
                          <span className="text-xs text-muted-foreground">
                            Target: {formatDate(goal.targetDate)}
                          </span>
                        )}
                        {goal.linkedCourseId && (
                          <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                            Linked course
                          </span>
                        )}
                        {goal.linkedCertificationId && (
                          <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                            Certification
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    {goal.status !== 'COMPLETED' && goal.status !== 'CANCELLED' && goal.id && (
                      <button
                        onClick={() => handleToggleGoal(goal)}
                        disabled={updatingGoal === goal.id}
                        className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                          goal.status === 'NOT_STARTED'
                            ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                            : 'bg-green-50 text-green-700 hover:bg-green-100'
                        }`}
                      >
                        {updatingGoal === goal.id
                          ? 'Updating...'
                          : goal.status === 'NOT_STARTED'
                            ? 'Start Goal'
                            : 'Mark Complete'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Other IDPs */}
            {idps.filter(p => p.id !== activeIdp.id).length > 0 && (
              <div className="enterprise-card p-6">
                <h3 className="text-sm font-semibold text-foreground mb-3">Other Plans</h3>
                <div className="space-y-2">
                  {idps.filter(p => p.id !== activeIdp.id).map(plan => (
                    <div key={plan.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div>
                        <p className="text-sm font-medium text-foreground">{plan.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {plan.goals.length} goals · {getProgress(plan.goals)}% complete
                        </p>
                      </div>
                      <StatusPill value={plan.status} size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Help Footer */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50/50 border border-blue-100">
              <InformationCircleIcon className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">About your development plan</p>
                <p className="text-blue-700 text-xs">
                  Your IDP is created in partnership with your manager. You can start goals and mark them
                  complete as you progress. Speak to your manager about adjusting targets or adding new goals.
                </p>
              </div>
            </div>
          </div>
        )}
      </PageWrapper>
    </FeatureGate>
  );
}
