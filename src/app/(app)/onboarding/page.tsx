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
} from '@heroicons/react/24/outline';

const ADMIN_ROLES = ['ADMIN', 'HR_MANAGER', 'LINE_MANAGER', 'PLATFORM_OWNER'];

type TabFilter = 'all' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';

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

  const statusColors: Record<string, string> = {
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
    COMPLETED: 'bg-green-100 text-green-800',
    OVERDUE: 'bg-red-100 text-red-800',
    PENDING: 'bg-gray-100 text-gray-700',
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

  return (
    <FeatureGate feature="EMPLOYEE_SELF_SERVICE">
      <PageWrapper
        title={isAdmin ? 'Onboarding Checklists' : 'My Onboarding'}
        subtitle={isAdmin ? 'Manage employee onboarding checklists and track progress' : 'Track your onboarding progress'}
        actions={
          isAdmin ? (
            <Link
              href="/onboarding/templates"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
            >
              Manage Templates
            </Link>
          ) : undefined
        }
      >
        <div className="space-y-6">
          {/* Tabs and New Button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 text-sm rounded-lg font-medium ${
                    activeTab === tab.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 border hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowNewForm(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <PlusIcon className="h-4 w-4 mr-2" /> New Checklist
              </button>
            )}
          </div>

          {/* New Checklist Modal */}
          {showNewForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-sm font-semibold text-foreground mb-4">
                  Create New Onboarding Checklist
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      value={newForm.employeeId}
                      onChange={(e) => setNewForm((f) => ({ ...f, employeeId: e.target.value }))}
                      placeholder="Enter employee ID"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">
                      Onboarding Template
                    </label>
                    <select
                      value={newForm.templateId}
                      onChange={(e) => setNewForm((f) => ({ ...f, templateId: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="">Select a template</option>
                      {templates.filter((t) => t.isActive).map((tpl) => (
                        <option key={tpl.id} value={tpl.id}>
                          {tpl.name} {tpl.department ? `(${tpl.department})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => {
                      setShowNewForm(false);
                      setNewForm({ employeeId: '', templateId: '' });
                    }}
                    className="px-4 py-2 text-gray-600 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={creating || !newForm.employeeId || !newForm.templateId}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : 'Create Checklist'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Checklists List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : filteredChecklists.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ClipboardDocumentCheckIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No onboarding checklists found</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredChecklists.map((cl) => {
                const progress = progressMap[cl.id];
                return (
                  <Link
                    key={cl.id}
                    href={`/onboarding/${cl.id}`}
                    className="block enterprise-card p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-sm font-semibold text-foreground">
                            {getTemplateName(cl.templateId)}
                          </h3>
                          <span
                            className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                              statusColors[cl.status] || 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {cl.status?.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-2">
                          <span className="flex items-center gap-1">
                            <UserIcon className="w-3.5 h-3.5" />
                            {!isAdmin && user?.employeeId === cl.employeeId
                              ? user.name
                              : `Employee #${cl.employeeId}`}
                          </span>
                          <span className="flex items-center gap-1">
                            <CalendarDaysIcon className="w-3.5 h-3.5" />
                            Start: {formatDate(cl.startDate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <CalendarDaysIcon className="w-3.5 h-3.5" />
                            Due: {formatDate(cl.dueDate)}
                          </span>
                        </div>
                      </div>
                      {/* Progress Bar */}
                      <div className="w-full sm:w-48">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>Progress</span>
                          <span>
                            {progress ? `${progress.completed}/${progress.total}` : '--'}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              cl.status === 'COMPLETED'
                                ? 'bg-green-500'
                                : cl.status === 'OVERDUE'
                                ? 'bg-red-500'
                                : 'bg-blue-600'
                            }`}
                            style={{ width: `${progress?.percent || 0}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 text-right">
                          {progress?.percent || 0}%
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
