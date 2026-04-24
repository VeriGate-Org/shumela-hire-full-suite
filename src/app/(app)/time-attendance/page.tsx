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
    if (!todayRecord) { setElapsed(''); return; }
    const update = () => {
      const diff = Date.now() - new Date(todayRecord.clockIn).getTime();
      setElapsed(formatDuration(diff));
    };
    update();
    const interval = setInterval(update, 60000);
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

    return { weekHours, monthHours, weekDays, monthDays, totalWorkingDaysMonth, weekOT, monthOT };
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
        subtitle="Track your working hours and manage overtime"
      >
        <div className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400">
              <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" /> {error}
            </div>
          )}

          {/* Today's Status — Hero */}
          <div className="enterprise-card p-6">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">
              Today&apos;s Status
            </h2>
            {!employeeId ? (
              <p className="text-sm text-muted-foreground">
                Resolve your employee profile to use clock in/out.
              </p>
            ) : loading ? (
              <TableSkeleton />
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">{dateStr}</p>
                  {todayRecord ? (
                    <>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">
                          Clocked In
                        </span>
                      </div>
                      <p className="text-3xl font-bold text-foreground mt-1">
                        {elapsed || '0h 0m'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Since{' '}
                        {new Date(todayRecord.clockIn).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                        <span className="text-sm font-medium text-muted-foreground">
                          Not Clocked In
                        </span>
                      </div>
                      <p className="text-3xl font-bold text-muted-foreground/30 mt-1">--:--</p>
                    </>
                  )}
                </div>
                <div className="w-full sm:w-auto">
                  {todayRecord ? (
                    <button
                      onClick={handleClockOut}
                      disabled={clockingOut}
                      className="w-full sm:w-auto px-8 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      {clockingOut ? 'Clocking Out...' : 'Clock Out'}
                    </button>
                  ) : (
                    <button
                      onClick={handleClockIn}
                      disabled={clockingIn}
                      className="w-full sm:w-auto px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {clockingIn ? 'Clocking In...' : 'Clock In'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Summary Stats */}
          {!loading && employeeId && (
            <div className="grid grid-cols-2 gap-4">
              <div className="enterprise-card p-4">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  This Week
                </h3>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {stats.weekHours.toFixed(1)}h
                </p>
                <p className="text-sm text-muted-foreground">
                  {stats.weekDays} / 5 days
                </p>
                {stats.weekOT > 0 && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    +{stats.weekOT}h overtime
                  </p>
                )}
              </div>
              <div className="enterprise-card p-4">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  This Month
                </h3>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {stats.monthHours.toFixed(1)}h
                </p>
                <p className="text-sm text-muted-foreground">
                  {stats.monthDays} / {stats.totalWorkingDaysMonth} days
                </p>
                {stats.monthOT > 0 && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    +{stats.monthOT}h overtime
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Location Map */}
          {currentLocation && (
            <div className="enterprise-card p-6">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Your Location
              </h2>
              <LocationMap
                center={[currentLocation.lat, currentLocation.lng]}
                zoom={15}
                height="200px"
                markers={[
                  { lat: currentLocation.lat, lng: currentLocation.lng, label: 'Current Location' },
                ]}
              />
            </div>
          )}

          {/* Recent Records */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Recent Records
              </h2>
              <Link
                href="/time-attendance/records"
                className="text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                View all
              </Link>
            </div>
            {loading ? (
              <div className="enterprise-card p-6">
                <TableSkeleton />
              </div>
            ) : recentRecords.length === 0 ? (
              <div className="enterprise-card p-6 text-center text-muted-foreground text-sm">
                No attendance records yet.
              </div>
            ) : (
              <div className="enterprise-card overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Clock In
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Clock Out
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Hours
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentRecords.slice(0, 5).map((rec) => (
                      <tr key={rec.id} className="hover:bg-muted">
                        <td className="px-4 py-3 text-sm text-foreground">
                          {new Date(rec.clockIn).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {new Date(rec.clockIn).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {rec.clockOut
                            ? new Date(rec.clockOut).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {rec.totalHours != null ? `${rec.totalHours.toFixed(1)}h` : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <StatusPill value={rec.status} domain="attendanceStatus" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* My Overtime */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                My Overtime
              </h2>
              <button
                onClick={() => setShowOvertimeForm(!showOvertimeForm)}
                disabled={!employeeId}
                className="text-sm text-blue-600 hover:underline dark:text-blue-400 inline-flex items-center gap-1 disabled:opacity-50"
              >
                <PlusIcon className="w-4 h-4" /> Submit Request
              </button>
            </div>

            {showOvertimeForm && employeeId && (
              <div className="enterprise-card p-4 mb-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={overtimeForm.date}
                      onChange={(e) =>
                        setOvertimeForm({ ...overtimeForm, date: e.target.value })
                      }
                      className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Hours
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={overtimeForm.hours}
                      onChange={(e) =>
                        setOvertimeForm({ ...overtimeForm, hours: e.target.value })
                      }
                      className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                      placeholder="e.g. 2.5"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Reason
                    </label>
                    <input
                      type="text"
                      value={overtimeForm.reason}
                      onChange={(e) =>
                        setOvertimeForm({ ...overtimeForm, reason: e.target.value })
                      }
                      className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
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
                    className="px-3 py-1.5 border text-sm rounded-md hover:bg-muted"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="enterprise-card p-6">
                <TableSkeleton />
              </div>
            ) : overtimeRecords.length === 0 ? (
              <div className="enterprise-card p-4 text-center text-muted-foreground text-sm">
                No overtime records.
              </div>
            ) : (
              <div className="enterprise-card overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Hours
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Reason
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {overtimeRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-muted">
                        <td className="px-4 py-3 text-sm text-foreground">{rec.date}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{rec.hours}h</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {rec.reason || '—'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <StatusPill value={rec.status} domain="overtimeStatus" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Manager/Admin Quick Links — only visible to users with manage_attendance permission */}
          {isManager && (
            <div>
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Management
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Link
                  href="/time-attendance/team"
                  className="flex items-center gap-2 enterprise-card p-3 hover:bg-muted text-sm font-medium text-muted-foreground"
                >
                  <UsersIcon className="w-5 h-5 text-green-500" /> Team View
                </Link>
                <Link
                  href="/time-attendance/geofences"
                  className="flex items-center gap-2 enterprise-card p-3 hover:bg-muted text-sm font-medium text-muted-foreground"
                >
                  <MapPinIcon className="w-5 h-5 text-purple-500" /> Geofences
                </Link>
                <Link
                  href="/time-attendance/overtime"
                  className="flex items-center gap-2 enterprise-card p-3 hover:bg-muted text-sm font-medium text-muted-foreground"
                >
                  <ClockIcon className="w-5 h-5 text-orange-500" /> Overtime Approvals
                </Link>
              </div>
            </div>
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
