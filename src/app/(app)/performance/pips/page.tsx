'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { performanceEnhancementService, Pip } from '@/services/performanceEnhancementService';
import { ExclamationTriangleIcon, CheckCircleIcon, ClockIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/components/Toast';

interface MilestoneForm {
  title: string;
  description: string;
  targetDate: string;
}

export default function PipsPage() {
  const [pips, setPips] = useState<Pip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  // Create form state
  const [form, setForm] = useState({
    employeeId: '',
    managerId: '',
    reason: '',
    startDate: '',
    endDate: '',
    reviewFrequency: 'WEEKLY',
  });
  const [milestones, setMilestones] = useState<MilestoneForm[]>([
    { title: '', description: '', targetDate: '' },
  ]);

  useEffect(() => {
    loadPips();
  }, []);

  async function loadPips() {
    setLoading(true);
    try {
      const data = await performanceEnhancementService.getActivePips(0, 50);
      setPips(data.content);
    } catch (error) {
      console.error('Failed to load PIPs:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    setCreating(true);
    try {
      await performanceEnhancementService.createPip({
        employeeId: Number(form.employeeId),
        managerId: Number(form.managerId),
        reason: form.reason,
        startDate: form.startDate,
        endDate: form.endDate,
        milestones: milestones.filter((m) => m.title).map((m) => ({
          title: m.title,
          description: m.description,
          targetDate: m.targetDate,
        })),
      });
      toast('PIP created successfully', 'success');
      setShowCreateForm(false);
      setForm({ employeeId: '', managerId: '', reason: '', startDate: '', endDate: '', reviewFrequency: 'WEEKLY' });
      setMilestones([{ title: '', description: '', targetDate: '' }]);
      loadPips();
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setCreating(false);
    }
  }

  const addMilestone = () => {
    setMilestones([...milestones, { title: '', description: '', targetDate: '' }]);
  };

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const updateMilestone = (index: number, field: keyof MilestoneForm, value: string) => {
    setMilestones(milestones.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-green-100 text-green-800',
      EXTENDED: 'bg-blue-100 text-blue-800',
      TERMINATED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const milestoneStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      case 'MET': return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'MISSED': return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  return (
    <FeatureGate feature="PERFORMANCE_PIP">
      <PageWrapper
        title="Performance Improvement Plans"
        subtitle="Manage PIPs and track employee progress"
        actions={
          <button onClick={() => setShowCreateForm(!showCreateForm)} className="btn-cta inline-flex items-center gap-2">
            <PlusIcon className="w-4 h-4" /> Create PIP
          </button>
        }
      >
        <div className="space-y-6">
          {/* Create PIP Form */}
          {showCreateForm && (
            <div className="enterprise-card p-6">
              <h3 className="text-lg font-medium text-foreground mb-4">Create Performance Improvement Plan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Employee ID</label>
                  <input type="number" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Employee ID" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Manager ID</label>
                  <input type="number" value={form.managerId} onChange={(e) => setForm({ ...form, managerId: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Manager ID" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Start Date</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">End Date</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Review Frequency</label>
                  <select value={form.reviewFrequency} onChange={(e) => setForm({ ...form, reviewFrequency: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm">
                    <option value="WEEKLY">Weekly</option>
                    <option value="BI_WEEKLY">Bi-Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Reason</label>
                  <textarea rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    placeholder="Describe the performance concerns and rationale for the PIP..." />
                </div>
              </div>

              {/* Improvement Goals / Milestones */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-foreground">Improvement Goals</label>
                  <button onClick={addMilestone} type="button"
                    className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1">
                    <PlusIcon className="w-3 h-3" /> Add Goal
                  </button>
                </div>
                <div className="space-y-3">
                  {milestones.map((m, i) => (
                    <div key={i} className="flex gap-3 items-start bg-muted p-3 rounded-lg">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input type="text" value={m.title} onChange={(e) => updateMilestone(i, 'title', e.target.value)}
                          className="border rounded-md px-3 py-2 text-sm" placeholder="Goal title" />
                        <input type="text" value={m.description} onChange={(e) => updateMilestone(i, 'description', e.target.value)}
                          className="border rounded-md px-3 py-2 text-sm" placeholder="Description" />
                        <input type="date" value={m.targetDate} onChange={(e) => updateMilestone(i, 'targetDate', e.target.value)}
                          className="border rounded-md px-3 py-2 text-sm" />
                      </div>
                      {milestones.length > 1 && (
                        <button onClick={() => removeMilestone(i)} className="text-red-400 hover:text-red-600 mt-2">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button onClick={handleCreate}
                  disabled={creating || !form.employeeId || !form.managerId || !form.startDate || !form.endDate || !form.reason}
                  className="btn-cta disabled:opacity-50">
                  {creating ? 'Creating...' : 'Create PIP'}
                </button>
                <button onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border text-sm rounded-md hover:bg-muted">Cancel</button>
              </div>
            </div>
          )}

          {/* PIP List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : pips.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No active Performance Improvement Plans</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pips.map((pip) => (
                <div key={pip.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        <Link href={`/performance/pips/${pip.id}`} className="hover:text-gold-600 hover:underline">
                          {pip.employeeName}
                        </Link>
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Manager: {pip.managerName}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${statusBadge(pip.status)}`}>{pip.status}</span>
                  </div>

                  {pip.reason && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{pip.reason}</p>
                  )}

                  <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <span>Start: {new Date(pip.startDate).toLocaleDateString()}</span>
                    <span>End: {new Date(pip.endDate).toLocaleDateString()}</span>
                  </div>

                  {pip.milestones && pip.milestones.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Milestones</h4>
                      <div className="space-y-2">
                        {pip.milestones.map((milestone) => (
                          <div key={milestone.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex items-center gap-2">
                              {milestoneStatusIcon(milestone.status)}
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{milestone.title}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Target: {new Date(milestone.targetDate).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              milestone.status === 'MET' ? 'bg-green-100 text-green-800' :
                              milestone.status === 'MISSED' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {milestone.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
