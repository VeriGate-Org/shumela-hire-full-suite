'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { performanceEnhancementService, Pip } from '@/services/performanceEnhancementService';
import { ExclamationTriangleIcon, CheckCircleIcon, ClockIcon, PlusIcon, TrashIcon, DocumentTextIcon, CalendarIcon, ChartBarIcon, XMarkIcon } from '@heroicons/react/24/outline';
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
  const [filterStatus, setFilterStatus] = useState('all');
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
      setPips(Array.isArray(data) ? data : (Array.isArray(data?.content) ? data.content : []));
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

  const statusBadgeClass = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-success-bg text-[#065F46]',
      COMPLETED: 'bg-icon-bg-navy text-primary',
      EXTENDED: 'bg-icon-bg-navy text-primary',
      TERMINATED: 'bg-error-bg text-[#991B1B]',
    };
    return colors[status] || 'bg-muted text-muted-foreground';
  };

  const statusDotClass = (status: string) => {
    const dots: Record<string, string> = {
      ACTIVE: 'bg-success',
      COMPLETED: 'bg-primary',
      EXTENDED: 'bg-primary',
      TERMINATED: 'bg-error',
    };
    return dots[status] || 'bg-muted-foreground';
  };

  const milestoneStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <ClockIcon className="h-4 w-4 text-accent-gold" />;
      case 'MET': return <CheckCircleIcon className="h-4 w-4 text-accent-teal" />;
      case 'MISSED': return <ExclamationTriangleIcon className="h-4 w-4 text-warning" />;
      default: return null;
    }
  };

  const milestoneIconBg = (status: string) => {
    switch (status) {
      case 'MET': return 'bg-success-bg text-success';
      case 'MISSED': return 'bg-warning-bg text-warning';
      case 'PENDING':
      default: return 'bg-icon-bg-navy text-primary';
    }
  };

  // Compute progress from milestones
  const getProgress = (pip: Pip) => {
    if (!pip.milestones || pip.milestones.length === 0) return 0;
    const met = pip.milestones.filter((m) => m.status === 'MET').length;
    return Math.round((met / pip.milestones.length) * 100);
  };

  const progressBarColor = (pct: number) => {
    if (pct >= 66) return 'bg-accent-teal';
    if (pct >= 33) return 'bg-primary';
    return 'bg-warning';
  };

  // Compute stats
  const activePips = pips.filter((p) => p.status === 'ACTIVE');
  const completedPips = pips.filter((p) => p.status === 'COMPLETED');
  const successRate = pips.length > 0 ? Math.round((completedPips.length / pips.length) * 100) : 0;

  // Filter PIPs
  const filteredPips = filterStatus === 'all' ? pips : pips.filter((p) => p.status === filterStatus);

  // Generate initials from name
  const getInitials = (name?: string) => {
    if (!name) return '??';
    const parts = name.split(' ');
    return parts.length >= 2 ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
  };

  // Avatar color rotation
  const avatarColors = [
    { bg: 'bg-icon-bg-teal', text: 'text-accent-teal' },
    { bg: 'bg-icon-bg-gold', text: 'text-accent-gold' },
    { bg: 'bg-icon-bg-pink', text: 'text-accent-pink' },
    { bg: 'bg-icon-bg-navy', text: 'text-primary' },
  ];

  return (
    <FeatureGate feature="PERFORMANCE_PIP">
      <PageWrapper
        title="Performance Improvement"
        subtitle="Manage performance improvement plans, track milestones, and monitor employee progress"
        actions={
          <button onClick={() => setShowCreateForm(!showCreateForm)} className="btn-cta inline-flex items-center gap-2">
            <PlusIcon className="w-4 h-4" /> Create PIP
          </button>
        }
      >
        <div className="space-y-6">

          {/* ====== STAT CARDS ====== */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="enterprise-card p-5 flex items-center gap-4">
                  <div className="w-[52px] h-[52px] rounded-xl bg-muted animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-6 w-10 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="enterprise-card p-5 flex items-center gap-4">
                <div className="w-[52px] h-[52px] rounded-xl bg-icon-bg-navy flex items-center justify-center flex-shrink-0">
                  <DocumentTextIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-[1.75rem] font-extrabold leading-none text-foreground">{activePips.length}</div>
                  <div className="text-[0.813rem] font-semibold text-muted-foreground mt-1">Active PIPs</div>
                </div>
              </div>
              <div className="enterprise-card p-5 flex items-center gap-4">
                <div className="w-[52px] h-[52px] rounded-xl bg-icon-bg-teal flex items-center justify-center flex-shrink-0">
                  <CheckCircleIcon className="w-6 h-6 text-accent-teal" />
                </div>
                <div>
                  <div className="text-[1.75rem] font-extrabold leading-none text-foreground">{successRate}%</div>
                  <div className="text-[0.813rem] font-semibold text-muted-foreground mt-1">Success Rate</div>
                </div>
              </div>
              <div className="enterprise-card p-5 flex items-center gap-4">
                <div className="w-[52px] h-[52px] rounded-xl bg-icon-bg-gold flex items-center justify-center flex-shrink-0">
                  <ClockIcon className="w-6 h-6 text-accent-gold" />
                </div>
                <div>
                  <div className="text-[1.75rem] font-extrabold leading-none text-foreground">60</div>
                  <div className="text-[0.813rem] font-semibold text-muted-foreground mt-1">Avg Duration (Days)</div>
                </div>
              </div>
              <div className="enterprise-card p-5 flex items-center gap-4">
                <div className="w-[52px] h-[52px] rounded-xl bg-icon-bg-pink flex items-center justify-center flex-shrink-0">
                  <ChartBarIcon className="w-6 h-6 text-accent-pink" />
                </div>
                <div>
                  <div className="text-[1.75rem] font-extrabold leading-none text-foreground">{completedPips.length}</div>
                  <div className="text-[0.813rem] font-semibold text-muted-foreground mt-1">Completed This Quarter</div>
                </div>
              </div>
            </div>
          )}

          {/* ====== FILTER BAR ====== */}
          {!loading && pips.length > 0 && (
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="appearance-none bg-card border border-border rounded-control px-3 py-2 text-[0.813rem] font-medium text-foreground cursor-pointer focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 min-w-[150px]"
              >
                <option value="all">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="TERMINATED">Terminated</option>
                <option value="EXTENDED">Extended</option>
              </select>
            </div>
          )}

          {/* ====== CREATE PIP MODAL ====== */}
          {showCreateForm && (
            <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowCreateForm(false); }}>
              <div className="bg-card rounded-card shadow-lg w-full max-w-[680px] max-h-[90vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                  <h2 className="text-lg font-bold text-foreground">Create Performance Improvement Plan</h2>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="w-9 h-9 rounded-full bg-background flex items-center justify-center text-muted-foreground hover:bg-error-bg hover:text-error transition-colors"
                  >
                    <XMarkIcon className="w-[18px] h-[18px]" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6">
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1.5">Employee ID <span className="text-error">*</span></label>
                      <input type="number" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                        className="w-full border border-border rounded-control px-3.5 py-2.5 text-sm text-foreground bg-card focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" placeholder="Employee ID" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-1.5">Start Date <span className="text-error">*</span></label>
                        <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                          className="w-full border border-border rounded-control px-3.5 py-2.5 text-sm text-foreground bg-card focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-1.5">End Date <span className="text-error">*</span></label>
                        <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                          className="w-full border border-border rounded-control px-3.5 py-2.5 text-sm text-foreground bg-card focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1.5">Reason for PIP <span className="text-error">*</span></label>
                      <textarea rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
                        className="w-full border border-border rounded-control px-3.5 py-2.5 text-sm text-foreground bg-card focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="Describe the performance concerns and objectives for this improvement plan..." />
                    </div>

                    {/* Dynamic Milestones Section */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-semibold text-foreground">Milestones <span className="text-error">*</span></label>
                        <span className="text-xs text-muted-foreground">{milestones.length} milestone{milestones.length !== 1 ? 's' : ''} added</span>
                      </div>

                      <div className="space-y-3">
                        {milestones.map((m, i) => (
                          <div key={i} className="relative bg-background border border-border rounded-control p-4">
                            {milestones.length > 1 && (
                              <button onClick={() => removeMilestone(i)}
                                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-error-bg text-error flex items-center justify-center hover:bg-error hover:text-white transition-colors"
                              >
                                <XMarkIcon className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <div className="text-[0.688rem] font-bold uppercase tracking-wider text-primary mb-2.5">Milestone {i + 1}</div>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-semibold text-foreground mb-1">Title <span className="text-error">*</span></label>
                                <input type="text" value={m.title} onChange={(e) => updateMilestone(i, 'title', e.target.value)}
                                  className="w-full border border-border rounded-control px-3.5 py-2.5 text-sm text-foreground bg-card focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" placeholder="e.g., Complete training programme" />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-semibold text-foreground mb-1">Target Date <span className="text-error">*</span></label>
                                  <input type="date" value={m.targetDate} onChange={(e) => updateMilestone(i, 'targetDate', e.target.value)}
                                    className="w-full border border-border rounded-control px-3.5 py-2.5 text-sm text-foreground bg-card focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-foreground mb-1">Description</label>
                                  <input type="text" value={m.description} onChange={(e) => updateMilestone(i, 'description', e.target.value)}
                                    className="w-full border border-border rounded-control px-3.5 py-2.5 text-sm text-foreground bg-card focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" placeholder="e.g., Score above 80%" />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button onClick={addMilestone} type="button"
                        className="mt-3 flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-border rounded-control text-[0.813rem] font-semibold text-muted-foreground hover:border-primary hover:text-primary hover:bg-surface-navy transition-colors"
                      >
                        <PlusIcon className="w-4 h-4" />
                        ADD MILESTONE
                      </button>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
                  <button onClick={() => setShowCreateForm(false)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-button border-2 border-border text-[0.813rem] font-semibold uppercase tracking-wider text-muted-foreground hover:border-primary hover:text-primary hover:bg-surface-navy transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleCreate}
                    disabled={creating || !form.employeeId || !form.startDate || !form.endDate || !form.reason}
                    className="btn-cta disabled:opacity-50">
                    {creating ? 'Creating...' : 'Create PIP'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ====== PIP CARDS GRID ====== */}
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="enterprise-card overflow-hidden">
                  <div className="flex items-center gap-3.5 px-6 py-5 border-b border-border">
                    <div className="w-11 h-11 rounded-full bg-muted animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                      <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                  <div className="px-6 py-5 space-y-4">
                    <div className="h-3 w-48 bg-muted animate-pulse rounded" />
                    <div className="h-2 w-full bg-muted animate-pulse rounded-full" />
                    <div className="space-y-3">
                      {[...Array(3)].map((_, j) => (
                        <div key={j} className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-muted animate-pulse flex-shrink-0" />
                          <div className="flex-1 space-y-1.5">
                            <div className="h-3.5 w-3/4 bg-muted animate-pulse rounded" />
                            <div className="h-2.5 w-1/2 bg-muted animate-pulse rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPips.length === 0 ? (
            <div className="enterprise-card p-12 text-center">
              <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No Performance Improvement Plans found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredPips.map((pip, idx) => {
                const progress = getProgress(pip);
                const colors = avatarColors[idx % avatarColors.length];
                const initials = getInitials(pip.employeeName);

                return (
                  <div key={pip.id} className="enterprise-card overflow-hidden">
                    {/* Card Header */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                      <div className="flex items-center gap-3.5">
                        <div className={`w-11 h-11 rounded-full ${colors.bg} ${colors.text} flex items-center justify-center text-sm font-bold flex-shrink-0`}>
                          {initials}
                        </div>
                        <div>
                          <div className="font-bold text-[0.938rem] text-foreground">
                            <Link href={`/performance/pips/${pip.id}`} className="hover:text-primary hover:underline">
                              {pip.employeeName}
                            </Link>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">Manager: {pip.managerName}</div>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-button text-xs font-semibold ${statusBadgeClass(pip.status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusDotClass(pip.status)}`} />
                        {pip.status.charAt(0) + pip.status.slice(1).toLowerCase()}
                      </span>
                    </div>

                    {/* Card Body */}
                    <div className="px-6 py-5">
                      {/* Dates */}
                      <div className="flex items-center gap-6 mb-4">
                        <div className="flex items-center gap-1.5 text-[0.813rem] text-muted-foreground">
                          <CalendarIcon className="w-3.5 h-3.5" />
                          Start: <span className="font-semibold text-foreground">{new Date(pip.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[0.813rem] text-muted-foreground">
                          <CalendarIcon className="w-3.5 h-3.5" />
                          End: <span className="font-semibold text-foreground">{new Date(pip.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-5">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Progress</span>
                          <span className="text-sm font-extrabold text-foreground">{progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${progressBarColor(progress)}`} style={{ width: `${progress}%` }} />
                        </div>
                      </div>

                      {/* Milestones */}
                      {pip.milestones && pip.milestones.length > 0 && (
                        <ul className="space-y-0">
                          {pip.milestones.map((milestone) => (
                            <li key={milestone.id} className="flex items-start gap-3 py-2.5 border-b border-border last:border-b-0">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${milestoneIconBg(milestone.status)}`}>
                                {milestone.status === 'MET' ? (
                                  <CheckCircleIcon className="w-3.5 h-3.5" />
                                ) : milestone.status === 'MISSED' ? (
                                  <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                                ) : (
                                  <ClockIcon className="w-3.5 h-3.5" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-foreground">{milestone.title}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  Target: {new Date(milestone.targetDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  {milestone.status === 'MET' && ' \u00B7 Completed'}
                                  {milestone.status === 'MISSED' && ' \u00B7 Overdue'}
                                  {milestone.status === 'PENDING' && ' \u00B7 In Progress'}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div className="flex justify-end gap-2 px-6 py-3.5 border-t border-border">
                      <Link
                        href={`/performance/pips/${pip.id}`}
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-button border-2 border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:border-primary hover:text-primary hover:bg-surface-navy transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
