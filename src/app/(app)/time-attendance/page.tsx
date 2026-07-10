'use client';

import { useState, useEffect, useMemo } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { AttendanceRecord, OvertimeRecord, attendanceService } from '@/services/attendanceService';
import Link from 'next/link';
import {
  ClockIcon,
  UsersIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  PauseIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import StatusPill from '@/components/StatusPill';
import { TableSkeleton } from '@/components/LoadingComponents';
import LocationMap from '@/components/maps/LocationMap';

function formatDuration(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

function formatTimerDisplay(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWorkingDaysInMonth(year: number, month: number): number {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month, d).getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}

export default function TimeAttendancePage() {
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [recentRecords, setRecentRecords] = useState<AttendanceRecord[]>([]);
  const [overtimeRecords, setOvertimeRecords] = useState<OvertimeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [clockingIn, setClockingIn] = useState(false);
  const [clockingOut, setClockingOut] = useState(false);
  const [error, setError] = useState('');
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [elapsed, setElapsed] = useState('');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [showOvertimeForm, setShowOvertimeForm] = useState(false);
  const [overtimeForm, setOvertimeForm] = useState({ date: '', hours: '', reason: '' });
  const [submittingOvertime, setSubmittingOvertime] = useState(false);

  const { user, hasPermission } = useAuth();
  const rawId = user?.employeeId || user?.id;
  const employeeId = rawId || '';
  const isManager = hasPermission('manage_attendance');

  // Fetch data
  useEffect(() => {
    if (!employeeId) {
      if (user !== undefined) {
        setError('Your employee profile could not be resolved. Please contact your administrator.');
        setLoading(false);
      }
      return;
    }
    setError('');
    setLoading(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }

    Promise.all([
      attendanceService.getStatus(employeeId).catch(() => ({ clockedIn: false as const })),
      attendanceService.getRecords(employeeId, 0, 30).catch(() => []),
      attendanceService.getOvertime(employeeId, 0, 5).catch(() => ({ content: [] })),
    ]).then(([statusData, recordsData, overtimeData]) => {
      const records = Array.isArray(recordsData)
        ? recordsData
        : Array.isArray((recordsData as any)?.content)
          ? (recordsData as any).content
          : [];
      setRecentRecords(records);

      const otRecords = Array.isArray((overtimeData as any)?.content)
        ? (overtimeData as any).content
        : Array.isArray(overtimeData)
          ? overtimeData
          : [];
      setOvertimeRecords(otRecords);

      if (statusData && 'clockIn' in statusData) {
        setTodayRecord(statusData as AttendanceRecord);
      } else {
        setTodayRecord(null);
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [employeeId]);

  // Live duration timer
  useEffect(() => {
    if (!todayRecord) { setElapsed(''); setElapsedMs(0); return; }
    const update = () => {
      const diff = Date.now() - new Date(todayRecord.clockIn).getTime();
      setElapsed(formatDuration(diff));
      setElapsedMs(diff);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [todayRecord]);

  // Compute summary stats from fetched records
  const stats = useMemo(() => {
    const now = new Date();
    const startOfWeek = getStartOfWeek(now);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const weekRecords = recentRecords.filter(r => new Date(r.clockIn) >= startOfWeek);
    const monthRecords = recentRecords.filter(r => new Date(r.clockIn) >= startOfMonth);

    const weekHours = weekRecords.reduce((sum, r) => sum + (r.totalHours || 0), 0);
    const monthHours = monthRecords.reduce((sum, r) => sum + (r.totalHours || 0), 0);
    const weekDays = new Set(weekRecords.map(r => new Date(r.clockIn).toDateString())).size;
    const monthDays = new Set(monthRecords.map(r => new Date(r.clockIn).toDateString())).size;

    const totalWorkingDaysMonth = getWorkingDaysInMonth(now.getFullYear(), now.getMonth());

    const weekOT = overtimeRecords
      .filter(r => new Date(r.date) >= startOfWeek)
      .reduce((sum, r) => sum + r.hours, 0);
    const monthOT = overtimeRecords
      .filter(r => new Date(r.date) >= startOfMonth)
      .reduce((sum, r) => sum + r.hours, 0);

    // Punctuality: calculate percentage of on-time records
    const completedRecords = monthRecords.filter(r => r.status);
    const onTimeRecords = completedRecords.filter(r =>
      r.status?.toLowerCase() === 'on_time' || r.status?.toLowerCase() === 'present' || r.status?.toLowerCase() === 'completed'
    );
    const punctuality = completedRecords.length > 0
      ? Math.round((onTimeRecords.length / completedRecords.length) * 100)
      : 100;

    return { weekHours, monthHours, weekDays, monthDays, totalWorkingDaysMonth, weekOT, monthOT, punctuality };
  }, [recentRecords, overtimeRecords]);

  const handleClockIn = async () => {
    setClockingIn(true);
    setError('');
    try {
      let lat: number | undefined;
      let lng: number | undefined;
      if (navigator.geolocation) {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        ).catch(() => null);
        if (pos) {
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        }
      }
      const record = await attendanceService.clockIn(employeeId, 'WEB', lat, lng);
      setTodayRecord(record);
      setRecentRecords((prev) => [record, ...prev]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setClockingIn(false);
    }
  };

  const handleClockOut = async () => {
    setClockingOut(true);
    setError('');
    try {
      let lat: number | undefined;
      let lng: number | undefined;
      if (navigator.geolocation) {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        ).catch(() => null);
        if (pos) {
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        }
      }
      const record = await attendanceService.clockOut(employeeId, lat, lng);
      setTodayRecord(null);
      setRecentRecords((prev) =>
        prev.map((r) => (r.id === record.id ? record : r))
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setClockingOut(false);
    }
  };

  const handleSubmitOvertime = async () => {
    setSubmittingOvertime(true);
    setError('');
    try {
      const record = await attendanceService.submitOvertime(
        employeeId,
        overtimeForm.date,
        parseFloat(overtimeForm.hours),
        overtimeForm.reason || undefined,
      );
      setOvertimeRecords((prev) => [record, ...prev]);
      setShowOvertimeForm(false);
      setOvertimeForm({ date: '', hours: '', reason: '' });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmittingOvertime(false);
    }
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <FeatureGate feature="TIME_ATTENDANCE">
      <PageWrapper
        title="Time & Attendance"
        subtitle="Track your working hours, clock in/out, and manage overtime"
      >
        <div className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-error-bg border border-error/20 rounded-control text-sm text-error dark:bg-red-950/30 dark:border-red-800 dark:text-red-400">
              <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" /> {error}
            </div>
          )}

          {/* ====== CLOCK-IN STATUS CARD ====== */}
          <div className={`enterprise-card relative overflow-hidden p-8 ${todayRecord ? '' : ''}`}>
            {/* Top accent bar */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${todayRecord ? 'bg-success' : 'bg-muted-foreground'}`} />

            {!employeeId ? (
              <p className="text-sm text-muted-foreground">
                Resolve your employee profile to use clock in/out.
              </p>
            ) : loading ? (
              <TableSkeleton />
            ) : (
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                {/* Left: Timer + Info */}
                <div className="flex flex-col md:flex-row items-center gap-6">
                  {/* Timer Display */}
                  <div className="text-center">
                    <p className="text-5xl font-extrabold text-foreground tabular-nums tracking-wide leading-none">
                      {todayRecord ? formatTimerDisplay(elapsedMs) : '--:--:--'}
                    </p>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-1.5">
                      Hours Today
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="hidden md:block w-px h-16 bg-border" />
                  <div className="block md:hidden h-px w-16 bg-border" />

                  {/* Clock Info */}
                  <div className="flex flex-col gap-1.5 text-center md:text-left">
                    {todayRecord ? (
                      <>
                        <div className="flex items-center gap-1.5 justify-center md:justify-start">
                          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                          <span className="text-[15px] font-bold text-success">
                            Clocked In
                          </span>
                        </div>
                        {currentLocation && (
                          <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground justify-center md:justify-start">
                            <MapPinIcon className="w-3.5 h-3.5" />
                            Current Location
                          </div>
                        )}
                        <p className="text-[13px] text-muted-foreground">
                          Clocked in at{' '}
                          {new Date(todayRecord.clockIn).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5 justify-center md:justify-start">
                          <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                          <span className="text-[15px] font-bold text-muted-foreground">
                            Not Clocked In
                          </span>
                        </div>
                        <p className="text-[13px] text-muted-foreground">{dateStr}</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Right: Clock Button */}
                <div>
                  {todayRecord ? (
                    <button
                      onClick={handleClockOut}
                      disabled={clockingOut}
                      className="inline-flex items-center gap-2 px-8 py-3.5 rounded-button bg-error border-2 border-error text-white font-bold text-[15px] uppercase tracking-widest hover:bg-red-600 hover:border-red-600 disabled:opacity-50 transition-all"
                    >
                      <PauseIcon className="w-[18px] h-[18px]" />
                      {clockingOut ? 'Clocking Out...' : 'Clock Out'}
                    </button>
                  ) : (
                    <button
                      onClick={handleClockIn}
                      disabled={clockingIn}
                      className="inline-flex items-center gap-2 px-8 py-3.5 rounded-button bg-success border-2 border-success text-white font-bold text-[15px] uppercase tracking-widest hover:bg-green-600 hover:border-green-600 disabled:opacity-50 transition-all"
                    >
                      <PlayIcon className="w-[18px] h-[18px]" />
                      {clockingIn ? 'Clocking In...' : 'Clock In'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ====== STAT CARDS ====== */}
          {!loading && employeeId && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Hours This Week */}
              <div className="enterprise-card p-5 flex items-center gap-4 hover:-translate-y-px transition-transform">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-icon-bg-navy flex items-center justify-center">
                  <ClockIcon className="w-[22px] h-[22px] text-accent-navy" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-2xl font-extrabold text-foreground leading-none mb-0.5">
                    {stats.weekHours.toFixed(1)}
                  </p>
                  <p className="text-[13px] font-semibold text-muted-foreground">
                    Hours This Week
                  </p>
                </div>
              </div>

              {/* Days Present */}
              <div className="enterprise-card p-5 flex items-center gap-4 hover:-translate-y-px transition-transform">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-icon-bg-teal flex items-center justify-center">
                  <CalendarDaysIcon className="w-[22px] h-[22px] text-accent-teal" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-2xl font-extrabold text-foreground leading-none mb-0.5">
                    {stats.weekDays}/5
                  </p>
                  <p className="text-[13px] font-semibold text-muted-foreground">
                    Days Present
                  </p>
                </div>
              </div>

              {/* Overtime Hours */}
              <div className="enterprise-card p-5 flex items-center gap-4 hover:-translate-y-px transition-transform">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-icon-bg-gold flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-[22px] h-[22px] text-accent-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-2xl font-extrabold text-foreground leading-none mb-0.5">
                    {stats.weekOT.toFixed(1)}
                  </p>
                  <p className="text-[13px] font-semibold text-muted-foreground">
                    Overtime Hours
                  </p>
                </div>
              </div>

              {/* Punctuality Rate */}
              <div className="enterprise-card p-5 flex items-center gap-4 hover:-translate-y-px transition-transform">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-icon-bg-pink flex items-center justify-center">
                  <CheckCircleIcon className="w-[22px] h-[22px] text-accent-pink" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-2xl font-extrabold text-foreground leading-none mb-0.5">
                    {stats.punctuality}%
                  </p>
                  <p className="text-[13px] font-semibold text-muted-foreground">
                    Punctuality Rate
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ====== LOCATION MAP ====== */}
          {currentLocation && (
            <div className="enterprise-card overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
                  <MapPinIcon className="w-[18px] h-[18px] text-primary" />
                  Your Location
                </h2>
              </div>
              <div className="p-6">
                <LocationMap
                  center={[currentLocation.lat, currentLocation.lng]}
                  zoom={15}
                  height="200px"
                  markers={[
                    { lat: currentLocation.lat, lng: currentLocation.lng, label: 'Current Location' },
                  ]}
                />
              </div>
            </div>
          )}

          {/* ====== RECENT ATTENDANCE RECORDS ====== */}
          <div className="enterprise-card overflow-hidden">
            {/* Section Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="9" y1="21" x2="9" y2="9" />
                </svg>
                Recent Attendance Records
              </h2>
              <div className="flex items-center gap-2">
                <Link
                  href="/time-attendance/records"
                  className="btn-secondary text-xs inline-flex items-center gap-1.5"
                >
                  <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                  EXPORT
                </Link>
              </div>
            </div>

            {/* Table Body */}
            {loading ? (
              <div className="p-6">
                <TableSkeleton />
              </div>
            ) : recentRecords.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                No attendance records yet.
              </div>
            ) : (
              <div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-background">
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border">
                          Clock In
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border">
                          Clock Out
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border">
                          Total Hours
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentRecords.slice(0, 6).map((rec) => (
                        <tr key={rec.id} className="border-b border-border last:border-b-0 hover:bg-surface-navy transition-colors">
                          <td className="px-4 py-3.5 text-sm text-foreground">
                            <span className="flex items-center gap-1.5">
                              <CalendarDaysIcon className="w-3.5 h-3.5 text-muted-foreground" />
                              {new Date(rec.clockIn).toLocaleDateString('en-US', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-sm">
                            <strong className="text-foreground">
                              {new Date(rec.clockIn).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </strong>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-muted-foreground">
                            {rec.clockOut
                              ? new Date(rec.clockOut).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : <span className="italic text-muted-foreground">In progress</span>}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-foreground">
                            {rec.totalHours != null ? `${rec.totalHours.toFixed(2)} hrs` : '---'}
                          </td>
                          <td className="px-4 py-3.5 text-sm">
                            <StatusPill value={rec.status} domain="attendanceStatus" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {recentRecords.length > 6 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                    <p className="text-[13px] text-muted-foreground">
                      Showing 1-6 of {recentRecords.length} records
                    </p>
                    <Link
                      href="/time-attendance/records"
                      className="text-sm font-semibold text-link hover:text-link-hover hover:underline"
                    >
                      View all records
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ====== OVERTIME RECORDS ====== */}
          <div className="enterprise-card overflow-hidden">
            {/* Section Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
                <ClockIcon className="w-[18px] h-[18px] text-accent-gold" />
                Overtime Records
              </h2>
              <div className="flex items-center gap-3">
                {stats.weekOT > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button bg-warning-bg text-[13px] font-semibold text-yellow-800 dark:text-yellow-200 dark:bg-yellow-900/30">
                    {stats.weekOT}h this week
                  </span>
                )}
                <button
                  onClick={() => setShowOvertimeForm(!showOvertimeForm)}
                  disabled={!employeeId}
                  className="btn-cta text-xs inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  <PlusIcon className="w-3.5 h-3.5" /> SUBMIT REQUEST
                </button>
              </div>
            </div>

            {/* Overtime Form */}
            {showOvertimeForm && employeeId && (
              <div className="px-6 py-5 border-b border-border bg-surface-navy">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                      Date
                    </label>
                    <input
                      type="date"
                      value={overtimeForm.date}
                      onChange={(e) =>
                        setOvertimeForm({ ...overtimeForm, date: e.target.value })
                      }
                      className="w-full border border-border rounded-control px-3 py-2 text-sm bg-card text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                      Hours
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={overtimeForm.hours}
                      onChange={(e) =>
                        setOvertimeForm({ ...overtimeForm, hours: e.target.value })
                      }
                      className="w-full border border-border rounded-control px-3 py-2 text-sm bg-card text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                      placeholder="e.g. 2.5"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                      Reason
                    </label>
                    <input
                      type="text"
                      value={overtimeForm.reason}
                      onChange={(e) =>
                        setOvertimeForm({ ...overtimeForm, reason: e.target.value })
                      }
                      className="w-full border border-border rounded-control px-3 py-2 text-sm bg-card text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                      placeholder="Optional reason"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleSubmitOvertime}
                    disabled={
                      submittingOvertime || !overtimeForm.date || !overtimeForm.hours
                    }
                    className="btn-cta text-sm disabled:opacity-50"
                  >
                    {submittingOvertime ? 'Submitting...' : 'Submit'}
                  </button>
                  <button
                    onClick={() => setShowOvertimeForm(false)}
                    className="btn-secondary text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Overtime Cards Grid */}
            <div className="p-6">
              {loading ? (
                <TableSkeleton />
              ) : overtimeRecords.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-4">
                  No overtime records.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {overtimeRecords.map((rec) => (
                    <div
                      key={rec.id}
                      className="border border-border rounded-card p-5 bg-card hover:shadow-sm transition-shadow"
                    >
                      {/* Card Header: Date + Status */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-sm font-bold text-foreground">{rec.date}</p>
                        </div>
                        <StatusPill value={rec.status} domain="overtimeStatus" />
                      </div>
                      {/* Hours */}
                      <p className="text-xl font-extrabold text-primary mb-0.5">
                        {rec.hours} hrs
                      </p>
                      {/* Reason */}
                      {rec.reason && (
                        <div className="mt-3 text-[13px] text-foreground bg-background rounded-md px-3 py-2 italic">
                          &ldquo;{rec.reason}&rdquo;
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ====== MANAGER QUICK LINKS ====== */}
          {isManager && (
            <div className="enterprise-card overflow-hidden">
              {/* Section Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
                  <UsersIcon className="w-[18px] h-[18px] text-primary" />
                  Manager Quick Links
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Team View */}
                  <Link
                    href="/time-attendance/team"
                    className="border border-border rounded-card p-6 bg-card text-center hover:shadow-md hover:-translate-y-0.5 hover:border-primary transition-all block"
                  >
                    <div className="w-14 h-14 rounded-[14px] bg-icon-bg-navy flex items-center justify-center mx-auto mb-3.5">
                      <UsersIcon className="w-[26px] h-[26px] text-accent-navy" />
                    </div>
                    <h3 className="text-[15px] font-semibold text-foreground mb-1">
                      View Team Attendance
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Monitor your team&apos;s daily attendance and hours
                    </p>
                  </Link>

                  {/* Overtime Approvals */}
                  <Link
                    href="/time-attendance/overtime"
                    className="border border-border rounded-card p-6 bg-card text-center hover:shadow-md hover:-translate-y-0.5 hover:border-primary transition-all block"
                  >
                    <div className="w-14 h-14 rounded-[14px] bg-icon-bg-gold flex items-center justify-center mx-auto mb-3.5">
                      <ClockIcon className="w-[26px] h-[26px] text-accent-gold" />
                    </div>
                    <h3 className="text-[15px] font-semibold text-foreground mb-1">
                      Approve Overtime
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Review and approve pending overtime requests
                    </p>
                  </Link>

                  {/* Geofences / Reports */}
                  <Link
                    href="/time-attendance/geofences"
                    className="border border-border rounded-card p-6 bg-card text-center hover:shadow-md hover:-translate-y-0.5 hover:border-primary transition-all block"
                  >
                    <div className="w-14 h-14 rounded-[14px] bg-icon-bg-teal flex items-center justify-center mx-auto mb-3.5">
                      <DocumentTextIcon className="w-[26px] h-[26px] text-accent-teal" />
                    </div>
                    <h3 className="text-[15px] font-semibold text-foreground mb-1">
                      Geofences & Reports
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Manage geofences and generate attendance reports
                    </p>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
