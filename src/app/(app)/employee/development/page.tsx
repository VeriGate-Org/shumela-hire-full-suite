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
  ClockIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
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

function getProgressColorClass(pct: number): string {
  if (pct >= 75) return 'bg-accent-teal';
  if (pct >= 40) return 'bg-accent-gold';
  return 'bg-accent-navy';
}

export default function MyDevelopmentPage() {
  const { user } = useAuth();
  const employeeId = user?.employeeId || user?.id || '';

  const [idps, setIdps] = useState<IndividualDevelopmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingGoal, setUpdatingGoal] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredGoals = useMemo(() => {
    let goals = sortedGoals;
    if (statusFilter) {
      goals = goals.filter(g => g.status === statusFilter);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      goals = goals.filter(g =>
        g.title.toLowerCase().includes(term) ||
        (g.description && g.description.toLowerCase().includes(term))
      );
    }
    return goals;
  }, [sortedGoals, statusFilter, searchTerm]);

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

  // Computed stats
  const totalGoals = activeIdp ? activeIdp.goals.length : 0;
  const completedGoals = activeIdp ? activeIdp.goals.filter(g => g.status === 'COMPLETED').length : 0;
  const inProgressGoals = activeIdp ? activeIdp.goals.filter(g => g.status === 'IN_PROGRESS').length : 0;
  const notStartedGoals = activeIdp ? activeIdp.goals.filter(g => g.status === 'NOT_STARTED').length : 0;

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

            {/* ===== Stats Bar ===== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                { icon: DocumentTextIcon, label: 'Total Plans', value: idps.length, iconColor: 'text-accent-navy', iconBg: 'bg-icon-bg-navy' },
                { icon: CheckCircleIcon, label: 'Completion Rate', value: `${progress}%`, iconColor: 'text-accent-teal', iconBg: 'bg-icon-bg-teal' },
                { icon: AcademicCapIcon, label: 'Goals Achieved', value: completedGoals, iconColor: 'text-accent-gold', iconBg: 'bg-icon-bg-gold' },
                { icon: ClockIcon, label: 'In Progress', value: inProgressGoals, iconColor: 'text-accent-pink', iconBg: 'bg-icon-bg-pink' },
              ].map((metric) => (
                <div key={metric.label} className="enterprise-card p-5 hover:-translate-y-px transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-card ${metric.iconBg} flex items-center justify-center shrink-0`}>
                      <metric.icon className={`w-6 h-6 ${metric.iconColor}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[1.75rem] font-extrabold leading-tight text-foreground">{metric.value}</div>
                      <div className="text-[0.8125rem] font-medium text-muted-foreground mt-0.5">{metric.label}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ===== Filter Bar ===== */}
            <div className="enterprise-card px-5 py-4">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
                {/* Left: filter selects */}
                <div className="flex items-center gap-3 flex-wrap flex-1">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    aria-label="Filter by status"
                    className="px-3 py-2 text-sm font-medium border border-border rounded-control bg-card text-foreground appearance-none pr-8 bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')] bg-no-repeat bg-[right_0.75rem_center] focus:border-primary focus:shadow-[0_0_0_3px_rgba(5,82,126,0.12)] outline-none transition-all"
                  >
                    <option value="">All Goals</option>
                    <option value="NOT_STARTED">Not Started</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>

                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {filteredGoals.length} of {totalGoals} goals
                  </span>
                </div>

                {/* Center: search */}
                <div className="flex-[0_1_320px] min-w-[200px]">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search goals..."
                      aria-label="Search goals"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm font-medium border border-border rounded-control bg-card text-foreground focus:border-primary focus:shadow-[0_0_0_3px_rgba(5,82,126,0.12)] outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ===== IDP Cards Grid ===== */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

              {/* Active Plan Card */}
              <div className="enterprise-card p-5 hover:-translate-y-0.5 transition-all relative">
                {/* Card top: avatar + name/role */}
                <div className="flex items-center gap-3.5 mb-3">
                  <div className="w-12 h-12 rounded-full bg-accent-navy flex items-center justify-center shrink-0">
                    <AcademicCapIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-base text-foreground leading-snug">{activeIdp.title}</div>
                    {activeIdp.description && (
                      <div className="text-[0.8125rem] font-medium text-muted-foreground leading-snug">{activeIdp.description}</div>
                    )}
                  </div>
                </div>

                {/* Period + Status Row */}
                <div className="flex items-center justify-between flex-wrap gap-2 mb-3.5">
                  <div className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-muted-foreground">
                    <CalendarDaysIcon className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {activeIdp.startDate ? formatDate(activeIdp.startDate) : 'Start'} – {activeIdp.targetDate ? formatDate(activeIdp.targetDate) : 'Ongoing'}
                    </span>
                  </div>
                  <StatusPill value={activeIdp.status} />
                </div>

                {/* Progress */}
                <div className="mb-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[0.8125rem] font-semibold text-foreground">Progress</span>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {completedGoals}/{totalGoals} goals completed
                    </span>
                  </div>
                  <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getProgressColorClass(progress)}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-border my-3.5" />

                {/* Goal Items */}
                <ul className="mb-3.5">
                  {filteredGoals.map((goal, idx) => (
                    <li
                      key={goal.id || idx}
                      className={`flex items-center gap-2.5 py-2 text-[0.8125rem] ${
                        idx > 0 ? 'border-t border-background' : ''
                      }`}
                    >
                      {/* Goal Status Icon */}
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        goal.status === 'COMPLETED'
                          ? 'bg-icon-bg-teal text-accent-teal'
                          : goal.status === 'IN_PROGRESS'
                            ? 'bg-icon-bg-gold text-accent-gold'
                            : goal.status === 'CANCELLED'
                              ? 'bg-icon-bg-pink text-accent-pink'
                              : 'bg-icon-bg-navy text-accent-navy'
                      }`}>
                        {goal.status === 'COMPLETED' ? (
                          <CheckCircleIcon className="w-3 h-3" />
                        ) : goal.status === 'IN_PROGRESS' ? (
                          <ClockIcon className="w-3 h-3" />
                        ) : goal.status === 'CANCELLED' ? (
                          <ExclamationTriangleIcon className="w-3 h-3" />
                        ) : (
                          <PlayIcon className="w-3 h-3" />
                        )}
                      </div>

                      {/* Goal Title */}
                      <span className={`flex-1 font-medium ${
                        goal.status === 'COMPLETED' ? 'text-muted-foreground line-through' : 'text-foreground'
                      }`}>
                        {goal.title}
                      </span>

                      {/* Goal Target Date */}
                      {goal.targetDate && (
                        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                          {formatDate(goal.targetDate)}
                        </span>
                      )}

                      {/* Action Button */}
                      {goal.status !== 'COMPLETED' && goal.status !== 'CANCELLED' && goal.id && (
                        <button
                          onClick={() => handleToggleGoal(goal)}
                          disabled={updatingGoal === goal.id}
                          className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-button border-2 uppercase tracking-wide transition-all disabled:opacity-50 ${
                            goal.status === 'NOT_STARTED'
                              ? 'border-accent-navy text-accent-navy bg-transparent hover:bg-icon-bg-navy'
                              : 'border-accent-teal text-accent-teal bg-transparent hover:bg-icon-bg-teal'
                          }`}
                        >
                          {updatingGoal === goal.id
                            ? 'Updating...'
                            : goal.status === 'NOT_STARTED'
                              ? 'Start'
                              : 'Complete'}
                        </button>
                      )}
                    </li>
                  ))}
                  {filteredGoals.length === 0 && (
                    <li className="py-4 text-center text-sm text-muted-foreground">
                      No goals match your current filters.
                    </li>
                  )}
                </ul>

                {/* Linked items tags */}
                {activeIdp.goals.some(g => g.linkedCourseId || g.linkedCertificationId) && (
                  <div className="flex flex-wrap gap-1.5 mb-3.5">
                    {activeIdp.goals.filter(g => g.linkedCourseId).length > 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-button text-[0.6875rem] font-semibold tracking-wide bg-icon-bg-navy text-accent-navy">
                        {activeIdp.goals.filter(g => g.linkedCourseId).length} Linked Course{activeIdp.goals.filter(g => g.linkedCourseId).length !== 1 ? 's' : ''}
                      </span>
                    )}
                    {activeIdp.goals.filter(g => g.linkedCertificationId).length > 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-button text-[0.6875rem] font-semibold tracking-wide bg-icon-bg-gold text-accent-gold">
                        {activeIdp.goals.filter(g => g.linkedCertificationId).length} Certification{activeIdp.goals.filter(g => g.linkedCertificationId).length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Other Plans Cards */}
              {idps.filter(p => p.id !== activeIdp.id).map(plan => {
                const planProgress = getProgress(plan.goals);
                const planCompleted = plan.goals.filter(g => g.status === 'COMPLETED').length;
                const planSortedGoals = [...plan.goals].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);

                return (
                  <div key={plan.id} className="enterprise-card p-5 hover:-translate-y-0.5 transition-all relative">
                    {/* Card top */}
                    <div className="flex items-center gap-3.5 mb-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                        plan.status === 'COMPLETED' ? 'bg-accent-teal' : plan.status === 'DRAFT' ? 'bg-accent-gold' : 'bg-accent-navy'
                      }`}>
                        <AcademicCapIcon className="w-6 h-6 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-base text-foreground leading-snug">{plan.title}</div>
                        {plan.description && (
                          <div className="text-[0.8125rem] font-medium text-muted-foreground leading-snug">{plan.description}</div>
                        )}
                      </div>
                    </div>

                    {/* Period + Status Row */}
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-3.5">
                      <div className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-muted-foreground">
                        <CalendarDaysIcon className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {plan.startDate ? formatDate(plan.startDate) : 'Start'} – {plan.targetDate ? formatDate(plan.targetDate) : 'Ongoing'}
                        </span>
                      </div>
                      <StatusPill value={plan.status} />
                    </div>

                    {/* Progress */}
                    <div className="mb-3.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[0.8125rem] font-semibold text-foreground">Progress</span>
                        <span className="text-xs font-semibold text-muted-foreground">
                          {planCompleted}/{plan.goals.length} goals completed
                        </span>
                      </div>
                      <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${getProgressColorClass(planProgress)}`}
                          style={{ width: `${planProgress}%` }}
                        />
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-border my-3.5" />

                    {/* Goal Items (read-only for non-active plans) */}
                    <ul className="mb-3.5">
                      {planSortedGoals.map((goal, idx) => (
                        <li
                          key={goal.id || idx}
                          className={`flex items-center gap-2.5 py-2 text-[0.8125rem] ${
                            idx > 0 ? 'border-t border-background' : ''
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                            goal.status === 'COMPLETED'
                              ? 'bg-icon-bg-teal text-accent-teal'
                              : goal.status === 'IN_PROGRESS'
                                ? 'bg-icon-bg-gold text-accent-gold'
                                : goal.status === 'CANCELLED'
                                  ? 'bg-icon-bg-pink text-accent-pink'
                                  : 'bg-icon-bg-navy text-accent-navy'
                          }`}>
                            {goal.status === 'COMPLETED' ? (
                              <CheckCircleIcon className="w-3 h-3" />
                            ) : goal.status === 'IN_PROGRESS' ? (
                              <ClockIcon className="w-3 h-3" />
                            ) : goal.status === 'CANCELLED' ? (
                              <ExclamationTriangleIcon className="w-3 h-3" />
                            ) : (
                              <PlayIcon className="w-3 h-3" />
                            )}
                          </div>
                          <span className={`flex-1 font-medium ${
                            goal.status === 'COMPLETED' ? 'text-muted-foreground line-through' : 'text-foreground'
                          }`}>
                            {goal.title}
                          </span>
                          {goal.targetDate && (
                            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                              {formatDate(goal.targetDate)}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>

                    {/* Linked items tags */}
                    {plan.goals.some(g => g.linkedCourseId || g.linkedCertificationId) && (
                      <div className="flex flex-wrap gap-1.5">
                        {plan.goals.filter(g => g.linkedCourseId).length > 0 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-button text-[0.6875rem] font-semibold tracking-wide bg-icon-bg-teal text-accent-teal">
                            Linked Course
                          </span>
                        )}
                        {plan.goals.filter(g => g.linkedCertificationId).length > 0 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-button text-[0.6875rem] font-semibold tracking-wide bg-icon-bg-gold text-accent-gold">
                            Certification
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ===== Help / Info Footer ===== */}
            <div className="enterprise-card p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-card bg-icon-bg-navy flex items-center justify-center shrink-0">
                  <InformationCircleIcon className="w-5 h-5 text-accent-navy" />
                </div>
                <div>
                  <p className="text-[0.8125rem] font-semibold text-foreground mb-1">About your development plan</p>
                  <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                    Your IDP is created in partnership with your manager. You can start goals and mark them
                    complete as you progress. Speak to your manager about adjusting targets or adding new goals.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}
      </PageWrapper>
    </FeatureGate>
  );
}
