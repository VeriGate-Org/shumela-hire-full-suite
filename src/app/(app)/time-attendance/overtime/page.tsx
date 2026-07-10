'use client';

import { useState, useEffect, useMemo } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { OvertimeRecord, attendanceService, PageResponse } from '@/services/attendanceService';
import { PlusIcon, CheckIcon, XMarkIcon, ClockIcon, ChevronLeftIcon, ChevronRightIcon, CurrencyDollarIcon, ChartBarIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import StatusPill from '@/components/StatusPill';
import { TableSkeleton } from '@/components/LoadingComponents';
import EmptyState from '@/components/EmptyState';

/* ---- helpers ---- */
function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekLabel(weekStart: Date): string {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
  const startStr = weekStart.toLocaleDateString('en-ZA', opts);
  const endStr = end.toLocaleDateString('en-ZA', { ...opts, year: 'numeric' });
  return `Week of ${startStr} \u2013 ${endStr}`;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function formatDisplayDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function getDayOfWeek(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-ZA', { weekday: 'short' });
  } catch {
    return '';
  }
}

export default function OvertimePage() {
  const [records, setRecords] = useState<OvertimeRecord[]>([]);
  const [pendingRecords, setPendingRecords] = useState<OvertimeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: '', hours: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'my' | 'pending'>('my');
  const [weekOffset, setWeekOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedReview, setExpandedReview] = useState<string | null>(null);

  const { user, hasPermission } = useAuth();
  const rawId = user?.employeeId || user?.id;
  const employeeId = rawId || '';
  const { toast } = useToast();
  // BUG-001 fix: track whether profile is resolved to prevent rendering actions
  const profileResolved = !!employeeId;
  const isManager = hasPermission('manage_attendance');

  useEffect(() => {
    if (!employeeId) {
      // Don't show error while auth is still loading
      if (user !== undefined) {
        setError('Your employee profile could not be resolved. Please contact your administrator.');
        setLoading(false);
      }
      return;
    }
    // Clear any previous error and reset loading when employeeId becomes available
    setError('');
    setLoading(true);
    const fetches: Promise<any>[] = [
      attendanceService.getOvertime(employeeId, 0, 20),
    ];
    if (isManager) {
      fetches.push(attendanceService.getPendingOvertime(0, 20));
    }
    Promise.all(fetches).then(([myData, pendingData]) => {
      // BUG-001 fix: defensive guard — API may return unexpected shape
      setRecords(Array.isArray(myData?.content) ? myData.content : []);
      if (pendingData) {
        setPendingRecords(Array.isArray(pendingData?.content) ? pendingData.content : []);
      }
      setLoading(false);
    }).catch((e) => {
      setError(e?.message || 'Failed to load overtime data');
      setLoading(false);
    });
  }, [employeeId]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const record = await attendanceService.submitOvertime(
        employeeId,
        form.date,
        parseFloat(form.hours),
        form.reason || undefined,
      );
      setRecords((prev) => [record, ...prev]);
      setShowForm(false);
      setForm({ date: '', hours: '', reason: '' });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await attendanceService.approveOvertime(id, employeeId);
      setPendingRecords((prev) => prev.filter((r) => r.id !== id));
      toast('Overtime approved', 'success');
    } catch (e: any) {
      toast(e.message || 'Failed to approve overtime', 'error');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await attendanceService.rejectOvertime(id, employeeId);
      setPendingRecords((prev) => prev.filter((r) => r.id !== id));
      toast('Overtime rejected', 'success');
    } catch (e: any) {
      toast(e.message || 'Failed to reject overtime', 'error');
    }
  };

  /* ---- derived data ---- */
  const currentWeekStart = useMemo(() => {
    const base = getStartOfWeek(new Date());
    const d = new Date(base);
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  const weeklyData = useMemo(() => {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const weekRecords = records.filter((r) => {
      const d = new Date(r.date);
      return d >= currentWeekStart && d <= weekEnd;
    });

    const totalHours = weekRecords.reduce((sum, r) => sum + r.hours, 0);
    const pendingHours = weekRecords.filter((r) => r.status?.toLowerCase() === 'pending').reduce((sum, r) => sum + r.hours, 0);
    const approvedHours = weekRecords.filter((r) => r.status?.toLowerCase() === 'approved').reduce((sum, r) => sum + r.hours, 0);

    // Per-day hours for bar chart
    const dailyHours = DAY_LABELS.map((_, idx) => {
      const dayDate = new Date(currentWeekStart);
      dayDate.setDate(dayDate.getDate() + idx);
      const dayStr = dayDate.toISOString().split('T')[0];
      return weekRecords
        .filter((r) => r.date === dayStr || r.date?.startsWith(dayStr))
        .reduce((sum, r) => sum + r.hours, 0);
    });

    return { totalHours, pendingHours, approvedHours, dailyHours };
  }, [records, currentWeekStart]);

  const monthlyStats = useMemo(() => {
    const now = new Date();
    const monthRecords = records.filter((r) => {
      const d = new Date(r.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const totalMonthlyHours = monthRecords.reduce((sum, r) => sum + r.hours, 0);
    const weeksInMonth = 4;
    const avgWeekly = weeksInMonth > 0 ? totalMonthlyHours / weeksInMonth : 0;
    return { totalMonthlyHours, avgWeekly };
  }, [records]);

  const filteredRecords = useMemo(() => {
    if (statusFilter === 'all') return records;
    return records.filter((r) => r.status?.toLowerCase() === statusFilter);
  }, [records, statusFilter]);

  // Group pending records by employee for team view
  const pendingByEmployee = useMemo(() => {
    const map = new Map<string, OvertimeRecord[]>();
    pendingRecords.forEach((r) => {
      const key = r.employeeId;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    return map;
  }, [pendingRecords]);

  const maxDailyHours = Math.max(...weeklyData.dailyHours, 1);

  return (
    <FeatureGate feature="TIME_ATTENDANCE">
      <PageWrapper
        title="Overtime Log"
        subtitle="Log, track, and manage overtime hours"
        actions={
          <button
            onClick={() => setShowForm(!showForm)}
            disabled={!profileResolved}
            className="btn-cta inline-flex items-center gap-2 disabled:opacity-50"
          >
            <PlusIcon className="w-4 h-4" /> Log Overtime
          </button>
        }
      >
        <div className="space-y-6">
          {/* BUG-001 fix: show error banner when profile unresolved or fetch failed */}
          {error && (
            <div className="enterprise-card flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-error-bg flex items-center justify-center mb-4">
                <XMarkIcon className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Something went wrong</h3>
              <p className="text-sm text-muted-foreground max-w-[400px]">{error}</p>
            </div>
          )}

          {/* Submit Overtime Modal-style Form */}
          {showForm && profileResolved && (
            <div className="enterprise-card overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="text-lg font-bold text-foreground">Log Overtime</h2>
                <button onClick={() => setShowForm(false)} className="w-9 h-9 rounded-full bg-background flex items-center justify-center text-muted-foreground hover:bg-error-bg hover:text-error transition-colors">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-5">
                {error && <p className="text-sm text-error">{error}</p>}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1">Date <span className="text-error">*</span></label>
                    <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className="w-full border border-border rounded-control px-3 py-2.5 text-sm bg-white text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1">Hours <span className="text-error">*</span></label>
                    <input type="number" step="0.5" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })}
                      className="w-full border border-border rounded-control px-3 py-2.5 text-sm bg-white text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="e.g. 2.5" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1">Reason</label>
                    <input type="text" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
                      className="w-full border border-border rounded-control px-3 py-2.5 text-sm bg-white text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="Optional reason" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
                <button onClick={() => setShowForm(false)} className="btn-outline">Cancel</button>
                <button onClick={handleSubmit} disabled={submitting || !form.date || !form.hours}
                  className="btn-cta disabled:opacity-50">
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="space-y-6">
              {/* Skeleton: Hero */}
              <div className="h-[340px] rounded-card bg-border animate-pulse" />
              {/* Skeleton: Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-[90px] rounded-card bg-border animate-pulse" />
                ))}
              </div>
              {/* Skeleton: Tabs + Table */}
              <div className="enterprise-card overflow-hidden">
                <div className="h-[52px] bg-border animate-pulse" />
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-[52px] bg-border animate-pulse mb-px" />
                ))}
              </div>
            </div>
          ) : !error && (
            <>
              {/* ======== WEEKLY SUMMARY HERO CARD ======== */}
              <div className="enterprise-card overflow-hidden">
                {/* Gradient Header */}
                <div className="bg-gradient-to-br from-shumelahire-500 to-teal-600 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setWeekOffset((o) => o - 1)}
                      className="w-9 h-9 rounded-full border border-white/30 bg-white/10 flex items-center justify-center text-white hover:bg-white/25 transition-colors">
                      <ChevronLeftIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <h2 className="text-white font-bold text-lg">{formatWeekLabel(currentWeekStart)}</h2>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setWeekOffset((o) => o + 1)}
                      className="w-9 h-9 rounded-full border border-white/30 bg-white/10 flex items-center justify-center text-white hover:bg-white/25 transition-colors">
                      <ChevronRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {/* Hero Body */}
                <div className="p-6">
                  {/* Stats Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-background rounded-control">
                      <div className="text-3xl font-extrabold text-primary leading-none mb-1">{weeklyData.totalHours}h</div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Hours This Week</div>
                    </div>
                    <div className="text-center p-4 bg-background rounded-control">
                      <div className="text-3xl font-extrabold text-warning leading-none mb-1">{weeklyData.pendingHours}h</div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending Approval</div>
                    </div>
                    <div className="text-center p-4 bg-background rounded-control">
                      <div className="text-3xl font-extrabold text-success leading-none mb-1">{weeklyData.approvedHours}h</div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Approved</div>
                    </div>
                  </div>

                  {/* Bar Chart */}
                  <div className="flex items-end justify-between gap-3 h-40 px-2">
                    {DAY_LABELS.map((label, idx) => (
                      <div key={label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                        <span className="text-xs font-bold text-foreground">
                          {weeklyData.dailyHours[idx] > 0 ? `${weeklyData.dailyHours[idx]}h` : ''}
                        </span>
                        <div
                          className={`w-full max-w-[48px] rounded-t-md transition-all duration-500 ${
                            weeklyData.dailyHours[idx] > 0 ? 'bg-teal-600' : 'bg-border'
                          }`}
                          style={{
                            height: weeklyData.dailyHours[idx] > 0
                              ? `${Math.max((weeklyData.dailyHours[idx] / maxDailyHours) * 100, 8)}%`
                              : '4px',
                          }}
                        />
                        <span className="text-xs font-semibold text-muted-foreground">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ======== MONTHLY STATS STRIP ======== */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="enterprise-card p-5 flex items-center gap-4 hover:shadow-md hover:-translate-y-px transition-all">
                  <div className="w-12 h-12 rounded-xl bg-icon-bg-navy flex items-center justify-center flex-shrink-0">
                    <ClockIcon className="w-6 h-6 text-accent-navy" />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-foreground leading-tight">{monthlyStats.totalMonthlyHours}h</div>
                    <div className="text-sm text-muted-foreground font-medium">Total Overtime (This Month)</div>
                  </div>
                </div>
                <div className="enterprise-card p-5 flex items-center gap-4 hover:shadow-md hover:-translate-y-px transition-all">
                  <div className="w-12 h-12 rounded-xl bg-icon-bg-gold flex items-center justify-center flex-shrink-0">
                    <CurrencyDollarIcon className="w-6 h-6 text-accent-gold" />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-foreground leading-tight">{records.length}</div>
                    <div className="text-sm text-muted-foreground font-medium">Total Entries</div>
                  </div>
                </div>
                <div className="enterprise-card p-5 flex items-center gap-4 hover:shadow-md hover:-translate-y-px transition-all">
                  <div className="w-12 h-12 rounded-xl bg-icon-bg-teal flex items-center justify-center flex-shrink-0">
                    <ChartBarIcon className="w-6 h-6 text-accent-teal" />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-foreground leading-tight">{monthlyStats.avgWeekly.toFixed(1)}h</div>
                    <div className="text-sm text-muted-foreground font-medium">Avg Weekly Hours</div>
                  </div>
                </div>
              </div>

              {/* ======== TABS CONTAINER ======== */}
              <div className="enterprise-card overflow-hidden">
                {/* Tabs Header */}
                <div className="flex border-b border-border px-6">
                  <button
                    onClick={() => setTab('my')}
                    className={`relative top-px px-5 py-4 text-sm font-semibold border-b-2 transition-colors inline-flex items-center gap-1.5 ${
                      tab === 'my'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-primary'
                    }`}
                  >
                    <ClockIcon className="w-4 h-4" />
                    My Log
                  </button>
                  {isManager && (
                    <button
                      onClick={() => setTab('pending')}
                      className={`relative top-px px-5 py-4 text-sm font-semibold border-b-2 transition-colors inline-flex items-center gap-1.5 ${
                        tab === 'pending'
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground hover:text-primary'
                      }`}
                    >
                      <UserGroupIcon className="w-4 h-4" />
                      Team Overtime
                      {pendingRecords.length > 0 && (
                        <span className="bg-warning-bg text-amber-800 text-[0.625rem] font-bold px-1.5 py-0.5 rounded-full ml-1">
                          {pendingRecords.length}
                        </span>
                      )}
                    </button>
                  )}
                </div>

                {/* Tab Panel: My Log */}
                {tab === 'my' && (
                  <div className="p-6">
                    {/* Filter Bar */}
                    <div className="flex flex-wrap items-center gap-3 mb-5">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border border-border rounded-control px-3 py-2 text-[0.813rem] bg-white text-foreground min-w-[150px] focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>

                    {filteredRecords.length === 0 ? (
                      <EmptyState icon={ClockIcon} title="No Overtime" description="No overtime records found." />
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border bg-background">Date</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border bg-background">Day</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border bg-background">Hours</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border bg-background">Reason</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border bg-background">Status</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border bg-background">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredRecords.map((rec) => (
                              <tr key={rec.id} className="hover:bg-surface-navy transition-colors">
                                <td className="px-4 py-3.5 text-sm text-foreground border-b border-border">{formatDisplayDate(rec.date)}</td>
                                <td className="px-4 py-3.5 text-sm text-foreground border-b border-border">{getDayOfWeek(rec.date)}</td>
                                <td className="px-4 py-3.5 text-sm font-bold text-foreground border-b border-border">{rec.hours}h</td>
                                <td className="px-4 py-3.5 text-sm text-foreground border-b border-border">{rec.reason || '\u2014'}</td>
                                <td className="px-4 py-3.5 text-sm border-b border-border">
                                  <StatusPill value={rec.status} domain="overtimeStatus" />
                                </td>
                                <td className="px-4 py-3.5 text-sm border-b border-border">
                                  {rec.status?.toLowerCase() === 'pending' ? (
                                    <span className="inline-flex items-center gap-1">
                                      <button className="text-[0.813rem] font-semibold text-primary hover:text-teal-600 transition-colors bg-transparent border-none p-0 cursor-pointer">Edit</button>
                                      <span className="text-border mx-1">/</span>
                                      <button className="text-[0.813rem] font-semibold text-error hover:text-red-700 transition-colors bg-transparent border-none p-0 cursor-pointer">Cancel</button>
                                    </span>
                                  ) : (
                                    <button className="text-[0.813rem] font-semibold text-primary hover:text-teal-600 transition-colors bg-transparent border-none p-0 cursor-pointer">View</button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab Panel: Team Overtime (Pending Approvals) */}
                {tab === 'pending' && (
                  <div className="p-6">
                    <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                      <UserGroupIcon className="w-[18px] h-[18px] text-primary" />
                      Direct Reports Overtime Overview
                    </h3>

                    {pendingRecords.length === 0 ? (
                      <EmptyState icon={ClockIcon} title="No Pending Approvals" description="No pending overtime approvals." />
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border bg-background">Employee</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border bg-background">Date</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border bg-background">Hours</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border bg-background">Reason</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border bg-background">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pendingRecords.map((rec) => {
                              const initials = rec.employeeName
                                ? rec.employeeName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                                : '??';
                              const isExpanded = expandedReview === rec.id;
                              return (
                                <React.Fragment key={rec.id}>
                                  <tr className="hover:bg-surface-navy transition-colors">
                                    <td className="px-4 py-3.5 text-sm text-foreground border-b border-border">
                                      <div className="flex items-center gap-2">
                                        <div className="w-9 h-9 rounded-full bg-icon-bg-teal text-accent-teal font-bold text-xs flex items-center justify-center flex-shrink-0">
                                          {initials}
                                        </div>
                                        <span className="font-medium">{rec.employeeName}</span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3.5 text-sm text-foreground border-b border-border">{formatDisplayDate(rec.date)}</td>
                                    <td className="px-4 py-3.5 text-sm font-bold text-foreground border-b border-border">{rec.hours}h</td>
                                    <td className="px-4 py-3.5 text-sm text-foreground border-b border-border">{rec.reason || '\u2014'}</td>
                                    <td className="px-4 py-3.5 text-sm border-b border-border">
                                      <button
                                        onClick={() => setExpandedReview(isExpanded ? null : rec.id)}
                                        className="btn-outline text-xs px-3 py-1.5"
                                      >
                                        Review
                                      </button>
                                    </td>
                                  </tr>
                                  {/* Expandable Review Panel */}
                                  {isExpanded && (
                                    <tr>
                                      <td colSpan={5} className="p-0 border-b border-border">
                                        <div className="bg-background border border-border rounded-control m-3 p-4 animate-in fade-in">
                                          <div className="bg-card border border-border rounded-control p-4">
                                            <div className="flex items-center justify-between mb-2">
                                              <div className="flex items-center gap-2">
                                                <strong className="text-sm">{formatDisplayDate(rec.date)} ({getDayOfWeek(rec.date)})</strong>
                                                <StatusPill value={rec.status} domain="overtimeStatus" />
                                              </div>
                                              <span className="text-sm font-bold text-primary">{rec.hours}h</span>
                                            </div>
                                            <div className="text-[0.813rem] text-muted-foreground mb-3">
                                              {rec.reason || 'No reason provided'}
                                            </div>
                                            <div className="flex gap-2 justify-end">
                                              <button
                                                onClick={() => handleReject(rec.id)}
                                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-button border-2 border-error text-error text-xs font-semibold uppercase tracking-wider hover:bg-error hover:text-white transition-colors"
                                              >
                                                Reject
                                              </button>
                                              <button
                                                onClick={() => handleApprove(rec.id)}
                                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-button border-2 border-teal-600 bg-teal-600 text-white text-xs font-semibold uppercase tracking-wider hover:bg-teal-700 hover:border-teal-700 transition-colors"
                                              >
                                                Approve
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
