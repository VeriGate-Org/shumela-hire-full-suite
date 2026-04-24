'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import {
  onboardingService,
  OnboardingChecklist,
  OnboardingChecklistItem,
  ChecklistProgress,
} from '@/services/onboardingService';
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  RocketLaunchIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';

const categoryConfig: Record<string, { label: string; color: string; bg: string }> = {
  DOCUMENTS: { label: 'Documents', color: 'text-blue-800', bg: 'bg-blue-100' },
  IT_SETUP: { label: 'IT Setup', color: 'text-purple-800', bg: 'bg-purple-100' },
  ORIENTATION: { label: 'Orientation', color: 'text-green-800', bg: 'bg-green-100' },
  COMPLIANCE: { label: 'Compliance', color: 'text-red-800', bg: 'bg-red-100' },
  BENEFITS: { label: 'Benefits', color: 'text-amber-800', bg: 'bg-amber-100' },
};

const categoryOrder = ['DOCUMENTS', 'IT_SETUP', 'ORIENTATION', 'COMPLIANCE', 'BENEFITS'];

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const isItemOverdue = (item: OnboardingChecklistItem) => {
  if (item.status === 'COMPLETED' || !item.dueDate) return false;
  return new Date(item.dueDate) < new Date();
};

export default function EmployeeOnboardingPage() {
  const { user } = useAuth();
  const { tenant } = useTenant();

  const [checklist, setChecklist] = useState<OnboardingChecklist | null>(null);
  const [progress, setProgress] = useState<ChecklistProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const firstName = user?.name?.split(' ')[0] || 'there';
  const companyName = tenant?.name || 'your company';

  const loadData = useCallback(async () => {
    if (!user?.employeeId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const checklists = await onboardingService.getChecklistsByEmployee(user.employeeId);
      if (checklists.length === 0) {
        setChecklist(null);
        setProgress(null);
        setLoading(false);
        return;
      }

      // Pick the most relevant: active IN_PROGRESS first, else most recent
      const active = checklists.find((cl) => cl.status === 'IN_PROGRESS');
      const selected = active || checklists.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];

      const progressData = await onboardingService.getProgress(selected.id);
      setChecklist(selected);
      setProgress(progressData);

      // Default expanded state: expand categories with incomplete items
      if (selected.items) {
        const expanded = new Set<string>();
        const grouped: Record<string, OnboardingChecklistItem[]> = {};
        for (const item of selected.items) {
          const cat = item.category || 'OTHER';
          if (!grouped[cat]) grouped[cat] = [];
          grouped[cat].push(item);
        }
        for (const [cat, items] of Object.entries(grouped)) {
          if (items.some((i) => i.status !== 'COMPLETED')) {
            expanded.add(cat);
          }
        }
        setExpandedCategories(expanded);
      }
    } catch (error) {
      console.error('Failed to load onboarding data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.employeeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleToggleItem(item: OnboardingChecklistItem) {
    if (!checklist) return;
    setUpdatingItemId(item.id);
    try {
      const newStatus = item.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
      const updated = await onboardingService.updateChecklistItem(checklist.id, item.id, {
        status: newStatus,
      });
      setChecklist(updated);
      const progressData = await onboardingService.getProgress(checklist.id);
      setProgress(progressData);
    } catch (err: any) {
      console.error('Failed to update item:', err);
    } finally {
      setUpdatingItemId(null);
    }
  }

  function toggleCategory(category: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }

  // Group items by category
  const groupedItems: Record<string, OnboardingChecklistItem[]> = {};
  if (checklist?.items) {
    for (const item of checklist.items) {
      const cat = item.category || 'OTHER';
      if (!groupedItems[cat]) groupedItems[cat] = [];
      groupedItems[cat].push(item);
    }
  }

  const sortedCategories = Object.keys(groupedItems).sort((a, b) => {
    const ai = categoryOrder.indexOf(a);
    const bi = categoryOrder.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  // "Up Next" items: incomplete, sorted by overdue first, then earliest due date, then sortOrder
  const upNextItems = checklist?.items
    ?.filter((i) => i.status !== 'COMPLETED')
    .sort((a, b) => {
      const aOverdue = isItemOverdue(a) ? 0 : 1;
      const bOverdue = isItemOverdue(b) ? 0 : 1;
      if (aOverdue !== bOverdue) return aOverdue - bOverdue;
      const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      if (aDue !== bDue) return aDue - bDue;
      return a.sortOrder - b.sortOrder;
    })
    .slice(0, 3) || [];

  const isAllComplete = progress && progress.total > 0 && progress.completed === progress.total;
  const isOverdue = checklist?.status === 'OVERDUE' || (checklist?.dueDate && new Date(checklist.dueDate) < new Date() && !isAllComplete);

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Empty state — no checklist assigned
  if (!checklist) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 px-4">
        <RocketLaunchIcon className="h-16 w-16 mx-auto mb-6 text-blue-400 opacity-70" />
        <h2 className="text-lg font-semibold text-foreground mb-2">
          Your onboarding is being prepared
        </h2>
        <p className="text-sm text-muted-foreground">
          Your HR team is setting up your personalised onboarding plan. You&apos;ll see your tasks here once it&apos;s ready.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Hero / Progress Card */}
      <div className={`enterprise-card p-6 ${isAllComplete ? 'border-green-200' : ''}`}>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            {isAllComplete ? (
              <>You&apos;re all set, {firstName}!</>
            ) : (
              <>Welcome to {companyName}</>
            )}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isAllComplete ? (
              <>You&apos;ve completed all your onboarding tasks. You&apos;re ready to go!</>
            ) : (
              <>Hi {firstName}, here&apos;s your onboarding progress.</>
            )}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>{progress?.completed || 0} of {progress?.total || 0} tasks completed</span>
            <span className="font-medium">{progress?.percent || 0}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                isAllComplete
                  ? 'bg-green-500'
                  : isOverdue
                  ? 'bg-red-500'
                  : 'bg-blue-600'
              }`}
              style={{ width: `${progress?.percent || 0}%` }}
            />
          </div>
        </div>

        {/* Stat chips */}
        <div className="flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 text-xs text-muted-foreground">
            <CalendarDaysIcon className="h-3.5 w-3.5" />
            Start: {formatDate(checklist.startDate)}
          </span>
          {checklist.dueDate && (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs ${
              isOverdue ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-muted-foreground'
            }`}>
              <ClockIcon className="h-3.5 w-3.5" />
              Due: {formatDate(checklist.dueDate)}
            </span>
          )}
          <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium ${
            isAllComplete
              ? 'bg-green-100 text-green-800'
              : isOverdue
              ? 'bg-red-100 text-red-800'
              : 'bg-blue-100 text-blue-800'
          }`}>
            {isAllComplete ? 'Completed' : isOverdue ? 'Overdue' : 'On Track'}
          </span>
        </div>

        {/* Completed: link to portal */}
        {isAllComplete && (
          <div className="mt-4 pt-4 border-t">
            <Link
              href="/dashboard"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Go to your employee portal &rarr;
            </Link>
          </div>
        )}
      </div>

      {/* 2. Up Next Card */}
      {upNextItems.length > 0 && (
        <div className="enterprise-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-semibold text-foreground">Up Next</h3>
            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 font-medium">
              {checklist.items?.filter((i) => i.status !== 'COMPLETED').length || 0} remaining
            </span>
          </div>
          <div className="space-y-2">
            {upNextItems.map((item) => {
              const overdue = isItemOverdue(item);
              const catConfig = categoryConfig[item.category] || { label: item.category, color: 'text-gray-800', bg: 'bg-gray-100' };

              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    overdue ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <button
                    onClick={() => handleToggleItem(item)}
                    disabled={updatingItemId === item.id}
                    className="flex-shrink-0"
                  >
                    <CheckCircleIcon
                      className={`h-5 w-5 ${
                        overdue ? 'text-red-400' : 'text-gray-300'
                      } hover:text-green-400 transition-colors`}
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium ${overdue ? 'text-red-700' : 'text-foreground'}`}>
                      {item.title}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.dueDate && (
                        <span className={`text-xs flex items-center gap-1 ${
                          overdue ? 'text-red-600 font-medium' : 'text-muted-foreground'
                        }`}>
                          <ClockIcon className="h-3 w-3" />
                          {formatDate(item.dueDate)}
                        </span>
                      )}
                      <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-medium ${catConfig.bg} ${catConfig.color}`}>
                        {catConfig.label}
                      </span>
                    </div>
                  </div>
                  {overdue && (
                    <ExclamationTriangleIcon className="h-4 w-4 text-red-500 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Category Sections */}
      {sortedCategories.map((category) => {
        const config = categoryConfig[category] || { label: category, color: 'text-gray-800', bg: 'bg-gray-100' };
        const items = groupedItems[category];
        const completedCount = items.filter((i) => i.status === 'COMPLETED').length;
        const isExpanded = expandedCategories.has(category);

        return (
          <div key={category} className="enterprise-card overflow-hidden">
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 text-xs rounded-full font-semibold ${config.bg} ${config.color}`}>
                  {config.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {completedCount}/{items.length} completed
                </span>
              </div>
              {isExpanded ? (
                <ChevronUpIcon className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {/* Category Items */}
            {isExpanded && (
              <div className="border-t px-4 pb-4 pt-2 space-y-2">
                {items.map((item) => {
                  const overdue = isItemOverdue(item);
                  const isCompleted = item.status === 'COMPLETED';

                  return (
                    <div
                      key={item.id}
                      className={`flex items-start gap-3 p-3 rounded-lg ${
                        overdue ? 'bg-red-50' : isCompleted ? 'bg-gray-50' : ''
                      }`}
                    >
                      <button
                        onClick={() => handleToggleItem(item)}
                        disabled={updatingItemId === item.id}
                        className="mt-0.5 flex-shrink-0"
                      >
                        {isCompleted ? (
                          <CheckCircleSolidIcon className="h-5 w-5 text-green-500" />
                        ) : (
                          <CheckCircleIcon
                            className={`h-5 w-5 ${
                              overdue ? 'text-red-400' : 'text-gray-300'
                            } hover:text-green-400 transition-colors`}
                          />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-sm font-medium ${
                              isCompleted
                                ? 'text-gray-400 line-through'
                                : overdue
                                ? 'text-red-700'
                                : 'text-foreground'
                            }`}
                          >
                            {item.title}
                          </span>
                          {item.isRequired && !isCompleted && (
                            <span className="text-xs text-red-500 font-medium">Required</span>
                          )}
                        </div>
                        {item.description && (
                          <p className={`text-xs mt-0.5 ${isCompleted ? 'text-gray-400' : 'text-muted-foreground'}`}>
                            {item.description}
                          </p>
                        )}
                        <div className="flex gap-4 mt-1.5">
                          {item.dueDate && !isCompleted && (
                            <span className={`text-xs flex items-center gap-1 ${
                              overdue ? 'text-red-600 font-medium' : 'text-muted-foreground'
                            }`}>
                              <ClockIcon className="h-3 w-3" />
                              Due: {formatDate(item.dueDate)}
                            </span>
                          )}
                          {item.completedAt && (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircleIcon className="h-3 w-3" />
                              Completed: {formatDate(item.completedAt)}
                            </span>
                          )}
                        </div>
                      </div>

                      {overdue && (
                        <ExclamationTriangleIcon className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* 5. Help Footer */}
      <div className="enterprise-card p-5">
        <div className="flex items-start gap-3">
          <QuestionMarkCircleIcon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-foreground">Need help?</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              If you have questions about any of your onboarding tasks, reach out to your HR team
              {checklist.assignedHrId ? ' or your assigned HR contact' : ''} for guidance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
