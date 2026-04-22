'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import {
  onboardingService,
  OnboardingChecklist,
  OnboardingChecklistItem,
  ChecklistProgress,
} from '@/services/onboardingService';
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';

type ItemCategory = 'DOCUMENTS' | 'IT_SETUP' | 'ORIENTATION' | 'COMPLIANCE' | 'BENEFITS';

const categoryConfig: Record<string, { label: string; color: string; bg: string }> = {
  DOCUMENTS: { label: 'Documents', color: 'text-blue-800', bg: 'bg-blue-100' },
  IT_SETUP: { label: 'IT Setup', color: 'text-purple-800', bg: 'bg-purple-100' },
  ORIENTATION: { label: 'Orientation', color: 'text-green-800', bg: 'bg-green-100' },
  COMPLIANCE: { label: 'Compliance', color: 'text-red-800', bg: 'bg-red-100' },
  BENEFITS: { label: 'Benefits', color: 'text-amber-800', bg: 'bg-amber-100' },
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  OVERDUE: 'bg-red-100 text-red-800',
  SKIPPED: 'bg-gray-100 text-gray-600',
};

export default function ChecklistDetailPage() {
  const params = useParams();
  const checklistId = params.checklistId as string;

  const [checklist, setChecklist] = useState<OnboardingChecklist | null>(null);
  const [progress, setProgress] = useState<ChecklistProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingItem, setUpdatingItem] = useState<string | null>(null);

  useEffect(() => {
    if (checklistId) {
      loadChecklist();
    }
  }, [checklistId]);

  async function loadChecklist() {
    setLoading(true);
    try {
      const [clData, progressData] = await Promise.all([
        onboardingService.getChecklist(checklistId),
        onboardingService.getProgress(checklistId),
      ]);
      setChecklist(clData);
      setProgress(progressData);
    } catch (error) {
      console.error('Failed to load checklist:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleItem(item: OnboardingChecklistItem) {
    if (!checklist) return;
    setUpdatingItem(item.id);
    try {
      const newStatus = item.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
      const updated = await onboardingService.updateChecklistItem(checklist.id, item.id, {
        status: newStatus,
      });
      setChecklist(updated);
      const progressData = await onboardingService.getProgress(checklist.id);
      setProgress(progressData);
    } catch (err: any) {
      alert(err.message || 'Failed to update item');
    } finally {
      setUpdatingItem(null);
    }
  }

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

  // Group items by category
  const groupedItems: Record<string, OnboardingChecklistItem[]> = {};
  if (checklist?.items) {
    for (const item of checklist.items) {
      const cat = item.category || 'OTHER';
      if (!groupedItems[cat]) groupedItems[cat] = [];
      groupedItems[cat].push(item);
    }
  }

  // Sort categories in a fixed order
  const categoryOrder: string[] = ['DOCUMENTS', 'IT_SETUP', 'ORIENTATION', 'COMPLIANCE', 'BENEFITS'];
  const sortedCategories = Object.keys(groupedItems).sort((a, b) => {
    const ai = categoryOrder.indexOf(a);
    const bi = categoryOrder.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  return (
    <FeatureGate feature="EMPLOYEE_SELF_SERVICE">
      <PageWrapper
        title="Checklist Detail"
        subtitle="View and manage individual onboarding checklist items"
      >
        {/* Back Link */}
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mb-6"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Checklists
        </Link>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : !checklist ? (
          <div className="text-center py-12 text-gray-500">
            <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Checklist not found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Checklist Info Card */}
            <div className="enterprise-card p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-sm font-semibold text-foreground">
                      Onboarding Checklist #{checklist.id}
                    </h2>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                        statusColors[checklist.status] || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {checklist.status?.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      Employee #{checklist.employeeId}
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarDaysIcon className="w-3.5 h-3.5" />
                      Start: {formatDate(checklist.startDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarDaysIcon className="w-3.5 h-3.5" />
                      Due: {formatDate(checklist.dueDate)}
                    </span>
                    {checklist.assignedHrId && (
                      <span>Assigned HR: #{checklist.assignedHrId}</span>
                    )}
                  </div>
                </div>

                {/* Progress */}
                <div className="w-full sm:w-56">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span>
                      {progress ? `${progress.completed}/${progress.total} items` : '--'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        checklist.status === 'COMPLETED'
                          ? 'bg-green-500'
                          : checklist.status === 'OVERDUE'
                          ? 'bg-red-500'
                          : 'bg-blue-600'
                      }`}
                      style={{ width: `${progress?.percent || 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 text-right font-medium">
                    {progress?.percent || 0}% complete
                  </p>
                </div>
              </div>
            </div>

            {/* Items Grouped by Category */}
            {sortedCategories.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No checklist items found.</p>
              </div>
            ) : (
              sortedCategories.map((category) => {
                const config = categoryConfig[category] || {
                  label: category,
                  color: 'text-gray-800',
                  bg: 'bg-gray-100',
                };
                const items = groupedItems[category];
                const completedCount = items.filter((i) => i.status === 'COMPLETED').length;

                return (
                  <div key={category}>
                    {/* Category Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className={`px-3 py-1 text-xs rounded-full font-semibold ${config.bg} ${config.color}`}
                      >
                        {config.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {completedCount}/{items.length} completed
                      </span>
                    </div>

                    {/* Items */}
                    <div className="space-y-2 mb-6">
                      {items.map((item) => {
                        const overdue = isItemOverdue(item);
                        const isCompleted = item.status === 'COMPLETED';

                        return (
                          <div
                            key={item.id}
                            className={`enterprise-card p-4 flex items-start gap-3 ${
                              overdue ? 'border-red-300 bg-red-50' : ''
                            }`}
                          >
                            {/* Checkbox */}
                            <button
                              onClick={() => handleToggleItem(item)}
                              disabled={updatingItem === item.id}
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

                            {/* Item Content */}
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
                                {item.isRequired && (
                                  <span className="text-xs text-red-500 font-medium">
                                    Required
                                  </span>
                                )}
                                <span
                                  className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                                    isCompleted
                                      ? 'bg-green-100 text-green-800'
                                      : overdue
                                      ? 'bg-red-100 text-red-800'
                                      : statusColors[item.status] || 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {overdue && !isCompleted ? 'OVERDUE' : item.status?.replace('_', ' ')}
                                </span>
                              </div>
                              {item.description && (
                                <p
                                  className={`text-xs mt-0.5 ${
                                    isCompleted ? 'text-gray-400' : 'text-muted-foreground'
                                  }`}
                                >
                                  {item.description}
                                </p>
                              )}
                              <div className="flex gap-4 mt-1.5">
                                {item.dueDate && (
                                  <span
                                    className={`text-xs flex items-center gap-1 ${
                                      overdue ? 'text-red-600 font-medium' : 'text-muted-foreground'
                                    }`}
                                  >
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
                                {item.notes && (
                                  <span className="text-xs text-muted-foreground">
                                    Note: {item.notes}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Overdue Indicator */}
                            {overdue && (
                              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </PageWrapper>
    </FeatureGate>
  );
}
