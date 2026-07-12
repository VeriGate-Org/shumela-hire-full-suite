'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { useAuth } from '@/contexts/AuthContext';
import {
  onboardingService,
  OnboardingChecklist,
  OnboardingTemplate,
} from '@/services/onboardingService';
import {
  PlusIcon,
  ClipboardDocumentCheckIcon,
  CalendarDaysIcon,
  UserIcon,
  UsersIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  XMarkIcon,
  BuildingOffice2Icon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import EmployeeOnboardingPage from '@/components/onboarding/EmployeeOnboardingPage';

const ADMIN_ROLES = ['ADMIN', 'HR_MANAGER', 'LINE_MANAGER', 'PLATFORM_OWNER'];

type TabFilter = 'all' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';

/* Rotating avatar palette using design-system tokens */
const AVATAR_PALETTE = [
  { bg: 'bg-icon-bg-navy', text: 'text-accent-navy' },
  { bg: 'bg-icon-bg-teal', text: 'text-accent-teal' },
  { bg: 'bg-icon-bg-gold', text: 'text-accent-gold' },
  { bg: 'bg-icon-bg-pink', text: 'text-accent-pink' },
];

function getAvatarStyle(index: number) {
  return AVATAR_PALETTE[index % AVATAR_PALETTE.length];
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function OnboardingChecklistsPage() {
  const { user } = useAuth();
  const isAdmin = user ? ADMIN_ROLES.includes(user.role) : false;

  const [checklists, setChecklists] = useState<OnboardingChecklist[]>([]);
  const [templates, setTemplates] = useState<OnboardingTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newForm, setNewForm] = useState({ employeeId: '', templateId: '' });
  const [creating, setCreating] = useState(false);
  const [progressMap, setProgressMap] = useState<Record<string, { completed: number; total: number; percent: number }>>({});
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    if (!user) return;
    setLoading(true);
    try {
      let checklistData: OnboardingChecklist[];
      let templateData: OnboardingTemplate[] = [];

      if (isAdmin) {
        [checklistData, templateData] = await Promise.all([
          onboardingService.getChecklists(),
          onboardingService.getTemplates(),
        ]);
      } else {
        checklistData = user.employeeId
          ? await onboardingService.getChecklistsByEmployee(user.employeeId)
          : [];
      }

      setChecklists(checklistData);
      setTemplates(templateData);

      // Load progress for each checklist
      const progressEntries = await Promise.all(
        checklistData.map(async (cl) => {
          const progress = await onboardingService.getProgress(cl.id);
          return [cl.id, progress] as const;
        })
      );
      const map: Record<string, { completed: number; total: number; percent: number }> = {};
      for (const [id, progress] of progressEntries) {
        map[id] = progress;
      }
      setProgressMap(map);
    } catch (error) {
      console.error('Failed to load onboarding data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newForm.employeeId || !newForm.templateId) return;
    setCreating(true);
    try {
      await onboardingService.createChecklist(
        newForm.employeeId,
        newForm.templateId
      );
      setShowNewForm(false);
      setNewForm({ employeeId: '', templateId: '' });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create checklist');
    } finally {
      setCreating(false);
    }
  }

  const filteredChecklists = activeTab === 'all'
    ? checklists
    : checklists.filter((cl) => cl.status === activeTab);

  const statusBadge: Record<string, { className: string; dotClassName: string; label: string }> = {
    IN_PROGRESS: {
      className: 'bg-warning-bg text-amber-800',
      dotClassName: 'bg-warning',
      label: 'In Progress',
    },
    COMPLETED: {
      className: 'bg-success-bg text-emerald-800',
      dotClassName: 'bg-success',
      label: 'Completed',
    },
    OVERDUE: {
      className: 'bg-error-bg text-red-800',
      dotClassName: 'bg-error',
      label: 'Overdue',
    },
    PENDING: {
      className: 'bg-slate-100 text-slate-700',
      dotClassName: 'bg-slate-400',
      label: 'Pending',
    },
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getTemplateName = (templateId: string) => {
    const tpl = templates.find((t) => t.id === templateId);
    return tpl?.name || `Template #${templateId}`;
  };

  const tabs: { key: TabFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'IN_PROGRESS', label: 'In Progress' },
    { key: 'COMPLETED', label: 'Completed' },
    { key: 'OVERDUE', label: 'Overdue' },
  ];

  const getTabCount = (key: TabFilter) => {
    if (key === 'all') return checklists.length;
    return checklists.filter((cl) => cl.status === key).length;
  };

  const getProgressColor = (percent: number, status: string) => {
    if (status === 'OVERDUE') return 'bg-accent-pink';
    if (status === 'COMPLETED') return 'bg-accent-teal';
    if (percent >= 70) return 'bg-accent-teal';
    if (percent >= 40) return 'bg-accent-gold';
    return 'bg-primary';
  };

  function toggleTaskExpansion(id: string) {
    setExpandedTasks((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  /* ---- Computed stats ---- */
  const activeCount = checklists.filter((c) => c.status === 'IN_PROGRESS').length;
  const completedCount = checklists.filter((c) => c.status === 'COMPLETED').length;
  const overdueCount = checklists.filter((c) => c.status === 'OVERDUE').length;
  const totalCount = checklists.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Average days: use the difference between startDate and now for completed checklists
  const avgDays = (() => {
    const completed = checklists.filter((c) => c.status === 'COMPLETED');
    if (completed.length === 0) return '--';
    const totalDays = completed.reduce((sum, c) => {
      const start = new Date(c.startDate).getTime();
      const end = c.updatedAt ? new Date(c.updatedAt).getTime() : Date.now();
      return sum + Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
    }, 0);
    return Math.round(totalDays / completed.length);
  })();

  if (!isAdmin) {
    return (
      <FeatureGate feature="EMPLOYEE_SELF_SERVICE">
        <PageWrapper
          title="My Onboarding"
          subtitle="Track your onboarding progress"
        >
          <EmployeeOnboardingPage />
        </PageWrapper>
      </FeatureGate>
    );
  }

  return (
    <FeatureGate feature="EMPLOYEE_SELF_SERVICE">
      <PageWrapper
        title="Onboarding Checklists"
        subtitle="Track and manage new hire onboarding progress"
        actions={
          <div className="flex items-center gap-3">
            <Link
              href="/onboarding/templates"
              className="btn-secondary inline-flex items-center gap-2 text-sm"
            >
              Manage Templates
            </Link>
            {isAdmin && (
              <button
                onClick={() => setShowNewForm(true)}
                className="btn-cta inline-flex items-center gap-2 text-sm"
              >
                <PlusIcon className="h-4 w-4" />
                Create Onboarding
              </button>
            )}
          </div>
        }
      >
        <div className="space-y-6">
          {/* ====== STAT CARDS ====== */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="enterprise-card p-5 flex items-center gap-4"
                >
                  <div className="loading-shimmer w-12 h-12 rounded-xl flex-shrink-0" />
                  <div className="flex-1">
                    <div className="loading-shimmer h-4 w-1/2 mb-2 rounded" />
                    <div className="loading-shimmer h-3 w-3/4 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Active Onboardings */}
              <div className="enterprise-card p-5 flex items-center gap-4 hover:-translate-y-px transition-transform">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-icon-bg-navy text-accent-navy flex items-center justify-center">
                  <UsersIcon className="w-[22px] h-[22px]" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-foreground leading-tight">
                    {activeCount}
                  </div>
                  <div className="text-[0.813rem] font-medium text-muted-foreground">
                    Active Onboardings
                  </div>
                </div>
              </div>

              {/* Completion Rate */}
              <div className="enterprise-card p-5 flex items-center gap-4 hover:-translate-y-px transition-transform">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-icon-bg-teal text-accent-teal flex items-center justify-center">
                  <CheckCircleIcon className="w-[22px] h-[22px]" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-foreground leading-tight">
                    {completionRate}%
                  </div>
                  <div className="text-[0.813rem] font-medium text-muted-foreground">
                    Completion Rate
                  </div>
                </div>
              </div>

              {/* Avg Days to Complete */}
              <div className="enterprise-card p-5 flex items-center gap-4 hover:-translate-y-px transition-transform">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-icon-bg-gold text-accent-gold flex items-center justify-center">
                  <ClockIcon className="w-[22px] h-[22px]" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-foreground leading-tight">
                    {avgDays}
                  </div>
                  <div className="text-[0.813rem] font-medium text-muted-foreground">
                    Avg Days to Complete
                  </div>
                </div>
              </div>

              {/* Overdue Tasks */}
              <div className="enterprise-card p-5 flex items-center gap-4 hover:-translate-y-px transition-transform">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-icon-bg-pink text-accent-pink flex items-center justify-center">
                  <ExclamationCircleIcon className="w-[22px] h-[22px]" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-foreground leading-tight">
                    {overdueCount}
                  </div>
                  <div className="text-[0.813rem] font-medium text-muted-foreground">
                    Overdue Tasks
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ====== TABBED CONTAINER ====== */}
          <div className="enterprise-card overflow-hidden">
            {/* Tab Header */}
            <div className="flex border-b border-border px-6 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative top-px px-5 py-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'text-primary border-primary'
                      : 'text-muted-foreground border-transparent hover:text-primary'
                  }`}
                >
                  {tab.label}
                  <span
                    className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[0.688rem] font-bold ml-1.5 ${
                      activeTab === tab.key
                        ? 'bg-icon-bg-navy text-primary'
                        : 'bg-background text-muted-foreground'
                    }`}
                  >
                    {getTabCount(tab.key)}
                  </span>
                </button>
              ))}
            </div>

            {/* Tab Panel */}
            <div className="p-6 animate-fade-in">
              {loading ? (
                /* Skeleton loading for cards */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="border border-border rounded-card p-5"
                    >
                      <div className="flex gap-3.5 mb-4">
                        <div className="loading-shimmer w-11 h-11 rounded-full flex-shrink-0" />
                        <div className="flex-1">
                          <div className="loading-shimmer h-4 w-[70%] mb-2 rounded" />
                          <div className="loading-shimmer h-3 w-[90%] rounded" />
                        </div>
                      </div>
                      <div className="loading-shimmer h-1.5 w-full mb-4 rounded" />
                      <div className="loading-shimmer h-11 w-full mb-2 rounded" />
                      <div className="loading-shimmer h-11 w-full rounded" />
                    </div>
                  ))}
                </div>
              ) : filteredChecklists.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <ClipboardDocumentCheckIcon className="h-12 w-12 mx-auto mb-4 opacity-40" />
                  <p className="text-sm font-medium">No onboarding checklists found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredChecklists.map((cl, idx) => {
                    const progress = progressMap[cl.id];
                    const pct = progress?.percent || 0;
                    const badge = statusBadge[cl.status] || statusBadge.PENDING;
                    const avatar = getAvatarStyle(idx);
                    const employeeLabel =
                      !isAdmin && user?.employeeId === cl.employeeId
                        ? user.name
                        : `Employee #${cl.employeeId}`;
                    const initials = getInitials(employeeLabel);
                    const templateName = getTemplateName(cl.templateId);
                    const isExpanded = expandedTasks[cl.id] || false;
                    const completedItems = cl.items?.filter(
                      (it) => it.status === 'COMPLETED'
                    ).length ?? 0;
                    const totalItems = cl.items?.length ?? 0;

                    return (
                      <div
                        key={cl.id}
                        className="border border-border rounded-card bg-card hover:shadow-md hover:-translate-y-px transition-all overflow-hidden"
                      >
                        {/* Card Header */}
                        <div className="flex items-start gap-3.5 px-5 pt-5">
                          <div
                            className={`w-11 h-11 rounded-full ${avatar.bg} ${avatar.text} font-bold text-sm flex items-center justify-center flex-shrink-0`}
                          >
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/onboarding/${cl.id}`}
                              className="text-[0.938rem] font-bold text-foreground hover:text-primary transition-colors"
                            >
                              {employeeLabel}
                            </Link>
                            <div className="text-[0.813rem] text-muted-foreground mt-0.5">
                              {templateName}
                            </div>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.className}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${badge.dotClassName}`}
                            />
                            {badge.label}
                          </span>
                        </div>

                        {/* Detail Items */}
                        <div className="flex flex-wrap gap-3 px-5 py-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CalendarDaysIcon className="w-3 h-3" />
                            Started {formatDate(cl.startDate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <CalendarDaysIcon className="w-3 h-3" />
                            Due {formatDate(cl.dueDate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <UserIcon className="w-3 h-3" />
                            {employeeLabel}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="px-5 mb-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold text-muted-foreground">
                              Progress
                            </span>
                            <span className="text-xs font-bold text-foreground">
                              {pct}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${getProgressColor(pct, cl.status)}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>

                        {/* Task List (expandable) */}
                        {cl.items && cl.items.length > 0 && (
                          <div className="border-t border-border px-5 py-3">
                            <button
                              onClick={() => toggleTaskExpansion(cl.id)}
                              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:opacity-80 transition-opacity py-1"
                            >
                              <ChevronRightIcon
                                className={`w-3 h-3 transition-transform ${
                                  isExpanded ? 'rotate-90' : ''
                                }`}
                              />
                              Tasks ({completedItems}/{totalItems})
                            </button>
                            {isExpanded && (
                              <div className="mt-2 space-y-0">
                                {cl.items.map((item) => {
                                  const isDone = item.status === 'COMPLETED';
                                  const isOverdue =
                                    item.dueDate &&
                                    new Date(item.dueDate) < new Date() &&
                                    !isDone;
                                  return (
                                    <div
                                      key={item.id}
                                      className="flex items-center gap-2 py-1.5 border-b border-background last:border-b-0 text-[0.813rem]"
                                    >
                                      <div
                                        className={`w-[18px] h-[18px] rounded flex items-center justify-center flex-shrink-0 border-2 ${
                                          isDone
                                            ? 'bg-accent-teal border-accent-teal'
                                            : 'border-border bg-card'
                                        }`}
                                      >
                                        {isDone && (
                                          <svg
                                            width="12"
                                            height="12"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="white"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                          >
                                            <polyline points="20 6 9 17 4 12" />
                                          </svg>
                                        )}
                                      </div>
                                      <span
                                        className={`flex-1 ${
                                          isDone
                                            ? 'line-through text-muted-foreground'
                                            : 'text-foreground'
                                        }`}
                                      >
                                        {item.title}
                                      </span>
                                      {item.dueDate && (
                                        <span
                                          className={`text-[0.688rem] whitespace-nowrap ${
                                            isOverdue
                                              ? 'text-error font-semibold'
                                              : 'text-muted-foreground'
                                          }`}
                                        >
                                          {formatDate(item.dueDate)}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Card Footer - View Link */}
                        <div className="border-t border-border px-5 py-3 flex justify-end">
                          <Link
                            href={`/onboarding/${cl.id}`}
                            className="text-xs font-semibold text-primary hover:opacity-80 transition-opacity flex items-center gap-1"
                          >
                            View Details
                            <ChevronRightIcon className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ====== CREATE ONBOARDING MODAL ====== */}
          {showNewForm && (
            <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-8 animate-fade-in">
              <div className="bg-card rounded-card shadow-lg w-full max-w-[600px] max-h-[90vh] overflow-y-auto animate-slide-up">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                  <h2 className="text-lg font-bold text-foreground">
                    Create Onboarding
                  </h2>
                  <button
                    onClick={() => {
                      setShowNewForm(false);
                      setNewForm({ employeeId: '', templateId: '' });
                    }}
                    className="w-9 h-9 rounded-full bg-background flex items-center justify-center text-muted-foreground hover:bg-error-bg hover:text-error transition-colors"
                  >
                    <XMarkIcon className="w-[18px] h-[18px]" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="px-6 py-6 space-y-5">
                  <div>
                    <label className="form-label">
                      Employee <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      value={newForm.employeeId}
                      onChange={(e) =>
                        setNewForm((f) => ({ ...f, employeeId: e.target.value }))
                      }
                      placeholder="Enter employee ID"
                      className="form-input w-full"
                    />
                  </div>
                  <div>
                    <label className="form-label">
                      Onboarding Template{' '}
                      <span className="text-error">*</span>
                    </label>
                    <select
                      value={newForm.templateId}
                      onChange={(e) =>
                        setNewForm((f) => ({ ...f, templateId: e.target.value }))
                      }
                      className="form-input w-full"
                    >
                      <option value="">Select template...</option>
                      {templates
                        .filter((t) => t.isActive)
                        .map((tpl) => (
                          <option key={tpl.id} value={tpl.id}>
                            {tpl.name}{' '}
                            {tpl.department ? `(${tpl.department})` : ''}
                          </option>
                        ))}
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      The template determines the default tasks for this
                      onboarding.
                    </p>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
                  <button
                    onClick={() => {
                      setShowNewForm(false);
                      setNewForm({ employeeId: '', templateId: '' });
                    }}
                    className="btn-secondary text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={
                      creating || !newForm.employeeId || !newForm.templateId
                    }
                    className="btn-cta text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? 'Creating...' : 'Create Onboarding'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
