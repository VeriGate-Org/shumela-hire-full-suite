'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserGroupIcon,
  CalendarDaysIcon,
  ClockIcon,
  ClipboardDocumentCheckIcon,
  AcademicCapIcon,
  HandThumbUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { apiFetch } from '@/lib/api-fetch';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardWidget } from '../../dashboard';

interface LineManagerDashboardProps {
  selectedTimeframe: string;
  onTimeframeChange: (timeframe: string) => void;
}

interface DirectReport {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  jobTitle?: string;
  department?: string;
  status?: string;
}

interface PendingLeave {
  id: string;
  employeeName?: string;
  leaveTypeName?: string;
  startDate?: string;
  endDate?: string;
  totalDays?: number;
  reason?: string;
}

interface PendingOvertime {
  id: string;
  employeeName?: string;
  date?: string;
  hours?: number;
  reason?: string;
}

interface AttendanceRecord {
  id: string;
  employeeId?: string;
  employeeName?: string;
  clockIn?: string;
  clockOut?: string;
  status?: string;
}

function formatDate(value?: string): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString(undefined, {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch {
    return value;
  }
}

function fullName(emp: { firstName?: string; lastName?: string } | undefined): string {
  if (!emp) return 'Unknown';
  return [emp.firstName, emp.lastName].filter(Boolean).join(' ').trim() || 'Unknown';
}

interface KpiTileProps {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  tone: 'gold' | 'green' | 'orange' | 'red' | 'violet' | 'blue';
  href?: string;
  onClick?: () => void;
}

const toneClasses: Record<KpiTileProps['tone'], string> = {
  gold: 'text-gold-700 bg-gold-50',
  green: 'text-green-700 bg-green-50',
  orange: 'text-orange-700 bg-orange-50',
  red: 'text-red-700 bg-red-50',
  violet: 'text-violet-700 bg-violet-50',
  blue: 'text-blue-700 bg-blue-50',
};

function KpiTile({ label, value, icon: Icon, tone, href, onClick }: KpiTileProps) {
  const router = useRouter();
  const handleClick = () => {
    if (onClick) onClick();
    else if (href) router.push(href);
  };
  const isClickable = Boolean(href || onClick);
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!isClickable}
      className={`bg-white rounded-sm border border-gray-200 border-t-2 border-t-gold-500 p-4 text-left w-full transition-shadow ${
        isClickable ? 'hover:shadow-md cursor-pointer' : 'cursor-default'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-gray-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
        </div>
        <div className={`p-2 rounded-full ${toneClasses[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </button>
  );
}

export default function LineManagerDashboard({ selectedTimeframe: _selectedTimeframe }: LineManagerDashboardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const managerId = user?.employeeId || '';
  const missingEmployeeRecord = !user?.employeeId;

  const [loading, setLoading] = useState(true);
  const [directReports, setDirectReports] = useState<DirectReport[]>([]);
  const [pendingLeave, setPendingLeave] = useState<PendingLeave[]>([]);
  const [pendingOvertime, setPendingOvertime] = useState<PendingOvertime[]>([]);
  const [teamAttendance, setTeamAttendance] = useState<AttendanceRecord[]>([]);
  const [upcomingLeave, setUpcomingLeave] = useState<PendingLeave[]>([]);

  useEffect(() => {
    let cancelled = false;
    if (!managerId) {
      setLoading(false);
      return;
    }

    async function fetchAll() {
      setLoading(true);
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfRange = new Date(startOfDay);
      endOfRange.setDate(endOfRange.getDate() + 14);

      const fmt = (d: Date) => d.toISOString().split('T')[0];

      const [reportsRes, pendingLeaveRes, pendingOtRes, attendanceRes, upcomingLeaveRes] =
        await Promise.allSettled([
          apiFetch(`/api/employees/${managerId}/direct-reports`),
          apiFetch(`/api/leave/requests/pending?managerId=${encodeURIComponent(managerId)}`),
          apiFetch(`/api/attendance/overtime/pending?page=0&size=10`),
          apiFetch(
            `/api/attendance/team?department=${encodeURIComponent(
              user?.tenantId || ''
            )}&startDate=${fmt(startOfDay)}&endDate=${fmt(startOfDay)}`
          ),
          apiFetch(
            `/api/leave/calendar?startDate=${fmt(startOfDay)}&endDate=${fmt(endOfRange)}`
          ),
        ]);

      if (cancelled) return;

      if (reportsRes.status === 'fulfilled' && reportsRes.value.ok) {
        try {
          const data = await reportsRes.value.json();
          setDirectReports(Array.isArray(data) ? data : []);
        } catch { /* keep empty */ }
      }

      if (pendingLeaveRes.status === 'fulfilled' && pendingLeaveRes.value.ok) {
        try {
          const data = await pendingLeaveRes.value.json();
          setPendingLeave(Array.isArray(data) ? data : []);
        } catch { /* keep empty */ }
      }

      if (pendingOtRes.status === 'fulfilled' && pendingOtRes.value.ok) {
        try {
          const data = await pendingOtRes.value.json();
          const items = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];
          setPendingOvertime(items);
        } catch { /* keep empty */ }
      }

      if (attendanceRes.status === 'fulfilled' && attendanceRes.value.ok) {
        try {
          const data = await attendanceRes.value.json();
          setTeamAttendance(Array.isArray(data) ? data : []);
        } catch { /* keep empty */ }
      }

      if (upcomingLeaveRes.status === 'fulfilled' && upcomingLeaveRes.value.ok) {
        try {
          const data = await upcomingLeaveRes.value.json();
          const items = Array.isArray(data) ? data : Array.isArray(data?.entries) ? data.entries : [];
          setUpcomingLeave(items);
        } catch { /* keep empty */ }
      }

      setLoading(false);
    }

    fetchAll();
    return () => { cancelled = true; };
  }, [managerId, user?.tenantId]);

  const teamSize = directReports.length;
  const reportIds = useMemo(() => new Set(directReports.map((r) => r.id)), [directReports]);
  const overtimeForTeam = useMemo(
    () => pendingOvertime.filter((o) => !reportIds.size || reportIds.has((o as any).employeeId)),
    [pendingOvertime, reportIds]
  );
  const onLeaveToday = useMemo(() => {
    const todayIso = new Date().toISOString().split('T')[0];
    return upcomingLeave.filter((l) => {
      if (!l.startDate || !l.endDate) return false;
      return l.startDate <= todayIso && l.endDate >= todayIso;
    }).length;
  }, [upcomingLeave]);

  if (missingEmployeeRecord) {
    return (
      <div className="bg-white rounded-sm border border-gray-200 border-t-2 border-t-orange-500 p-6">
        <div className="flex items-start gap-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-orange-600 mt-0.5" />
          <div>
            <p className="font-semibold text-gray-900">No employee record linked</p>
            <p className="text-sm text-gray-600 mt-1">
              Your line-manager dashboard relies on an Employee record to surface
              direct reports, pending approvals, and team data. Ask HR to link your
              user account to an employee profile.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-sm border border-gray-200 p-4 animate-pulse h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-sm border border-gray-200 p-6 animate-pulse h-64" />
          <div className="bg-white rounded-sm border border-gray-200 p-6 animate-pulse h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiTile
          label="Direct Reports"
          value={teamSize}
          icon={UserGroupIcon}
          tone="violet"
          href="/employee?managerId=me"
        />
        <KpiTile
          label="Pending Leave"
          value={pendingLeave.length}
          icon={CalendarDaysIcon}
          tone="gold"
          href="/leave/approvals"
        />
        <KpiTile
          label="Pending Overtime"
          value={overtimeForTeam.length}
          icon={ClockIcon}
          tone="orange"
          href="/time-attendance/overtime"
        />
        <KpiTile
          label="On Leave Today"
          value={onLeaveToday}
          icon={CheckCircleIcon}
          tone="blue"
          href="/leave/calendar"
        />
        <KpiTile
          label="Team Reviews"
          value={teamSize}
          icon={ClipboardDocumentCheckIcon}
          tone="green"
          href="/performance"
        />
        <KpiTile
          label="Training (Team)"
          value={teamSize}
          icon={AcademicCapIcon}
          tone="gold"
          href="/training"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-full">
        <div className="lg:col-span-2 space-y-6 min-w-0">
          <DashboardWidget
            id="line-manager-team-today"
            title="Team Attendance Today"
            subtitle="Who is clocked in, on leave, or absent"
            size="medium"
          >
            {teamAttendance.length === 0 && directReports.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                No team data available yet.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {(teamAttendance.length > 0 ? teamAttendance : directReports.slice(0, 8)).map((row: any) => {
                  const name = row.employeeName || fullName(row);
                  const status = row.clockIn
                    ? row.clockOut ? 'Clocked Out' : 'Clocked In'
                    : 'Not Clocked In';
                  const tone = row.clockIn && !row.clockOut
                    ? 'bg-green-100 text-green-800'
                    : row.clockIn
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-yellow-100 text-yellow-800';
                  return (
                    <div key={row.id} className="flex items-center justify-between py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {row.jobTitle || row.department || row.employeeId || ''}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${tone}`}>
                        {status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </DashboardWidget>

          <DashboardWidget
            id="line-manager-upcoming-leave"
            title="Upcoming Team Leave (next 14 days)"
            subtitle="Plan around team absences"
            size="medium"
          >
            {upcomingLeave.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                No upcoming leave in the next 14 days.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {upcomingLeave.slice(0, 6).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {entry.employeeName || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {entry.leaveTypeName || 'Leave'} · {formatDate(entry.startDate)} → {formatDate(entry.endDate)}
                      </p>
                    </div>
                    <span className="text-xs text-gray-700 font-medium">
                      {entry.totalDays ?? '—'} day(s)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </DashboardWidget>
        </div>

        <div className="lg:col-span-1 space-y-6 min-w-0 max-w-full">
          <DashboardWidget
            id="line-manager-pending-approvals"
            title="Pending Approvals"
            subtitle="Action required from you"
            size="small"
          >
            {pendingLeave.length === 0 && overtimeForTeam.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-500">
                You&apos;re all caught up.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingLeave.slice(0, 3).map((leave) => (
                  <button
                    key={leave.id}
                    onClick={() => router.push('/leave/approvals')}
                    className="w-full text-left flex items-start gap-3 p-3 hover:bg-gray-50 rounded-sm"
                  >
                    <ExclamationTriangleIcon className="h-4 w-4 text-gold-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        Leave: {leave.employeeName || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {leave.leaveTypeName || ''} · {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                      </p>
                    </div>
                  </button>
                ))}
                {overtimeForTeam.slice(0, 3).map((ot) => (
                  <button
                    key={ot.id}
                    onClick={() => router.push('/time-attendance/overtime')}
                    className="w-full text-left flex items-start gap-3 p-3 hover:bg-gray-50 rounded-sm"
                  >
                    <ClockIcon className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        Overtime: {ot.employeeName || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {formatDate(ot.date)} · {ot.hours ?? '—'} hrs
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </DashboardWidget>

          <DashboardWidget
            id="line-manager-quick-actions"
            title="Quick Actions"
            subtitle="Common manager tasks"
            size="small"
          >
            <div className="grid grid-cols-1 gap-2">
              {[
                { label: 'Approve Leave', href: '/leave/approvals', color: 'bg-gold-500 text-violet-950' },
                { label: 'Approve Overtime', href: '/time-attendance/overtime', color: 'bg-orange-600 text-white' },
                { label: 'Manual Attendance', href: '/time-attendance/records', color: 'bg-violet-700 text-white' },
                { label: 'Send Recognition', href: '/engagement/recognition', color: 'bg-green-600 text-white' },
                { label: 'Schedule Shift', href: '/shift-scheduling', color: 'bg-blue-700 text-white' },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => router.push(action.href)}
                  className={`${action.color} p-3 rounded-full hover:opacity-90 transition-opacity text-sm font-medium text-center w-full`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </DashboardWidget>

          <DashboardWidget
            id="line-manager-team-roster"
            title="Team Roster"
            subtitle={`${teamSize} direct report${teamSize === 1 ? '' : 's'}`}
            size="small"
          >
            {directReports.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-500">
                No direct reports assigned.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {directReports.slice(0, 8).map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => router.push(`/employee/${emp.id}`)}
                    className="w-full text-left flex items-center gap-3 p-2 hover:bg-gray-50 rounded-sm"
                  >
                    <div className="h-8 w-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                      {(emp.firstName?.[0] || '') + (emp.lastName?.[0] || '') || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{fullName(emp)}</p>
                      <p className="text-xs text-gray-500 truncate">{emp.jobTitle || emp.department || ''}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </DashboardWidget>

          <DashboardWidget
            id="line-manager-recognition"
            title="Recognition"
            subtitle="Celebrate your team"
            size="small"
          >
            <div className="space-y-2">
              <button
                onClick={() => router.push('/engagement/recognition')}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-sm border border-gray-200"
              >
                <HandThumbUpIcon className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-900">Send a kudos</span>
              </button>
              <button
                onClick={() => router.push('/feed')}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-sm border border-gray-200"
              >
                <HandThumbUpIcon className="h-5 w-5 text-violet-600" />
                <span className="text-sm font-medium text-gray-900">View team feed</span>
              </button>
            </div>
          </DashboardWidget>
        </div>
      </div>
    </div>
  );
}
