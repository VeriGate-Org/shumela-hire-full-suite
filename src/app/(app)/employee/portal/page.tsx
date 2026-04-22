'use client';

import { useState, useEffect, useMemo } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { InlineLoading } from '@/components/LoadingComponents';
import { apiFetch } from '@/lib/api-fetch';
import Link from 'next/link';
import StatusPill from '@/components/StatusPill';
import LeaveBalanceCards from '@/components/leave/LeaveBalanceCards';
import {
  UserCircleIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  AcademicCapIcon,
  ClockIcon,
  CalendarDaysIcon,
  HandThumbUpIcon,
  PhoneIcon,
  ArrowRightIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { leaveService, LeaveBalance, LeaveRequest } from '@/services/leaveService';
import { attendanceService, AttendanceRecord } from '@/services/attendanceService';
import { trainingService, TrainingEnrollment } from '@/services/trainingService';
import { engagementService, Recognition } from '@/services/engagementService';
import { onboardingService, OnboardingChecklist } from '@/services/onboardingService';
import { feedService, FeedPost } from '@/services/feedService';

interface EmployeeProfile {
  id: string;
  employeeNumber: string;
  title: string | null;
  firstName: string;
  lastName: string;
  preferredName: string | null;
  email: string;
  personalEmail: string | null;
  phone: string | null;
  mobilePhone: string | null;
  department: string | null;
  division: string | null;
  jobTitle: string | null;
  jobGrade: string | null;
  employmentType: string | null;
  hireDate: string;
  location: string | null;
  status: string;
  profilePhotoUrl: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelationship: string | null;
}

type AttendanceStatus = AttendanceRecord | { clockedIn: false };

interface UpcomingItem {
  id: string;
  type: 'leave' | 'training';
  title: string;
  date: string;
  endDate?: string;
  status: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getInitials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function isAttendanceRecord(status: AttendanceStatus): status is AttendanceRecord {
  return 'clockIn' in status;
}

function getElapsedHours(clockIn: string): string {
  const elapsed = (Date.now() - new Date(clockIn).getTime()) / 3600000;
  const hrs = Math.floor(elapsed);
  const mins = Math.floor((elapsed - hrs) * 60);
  return `${hrs}h ${mins}m`;
}

export default function EmployeePortalPage() {
  const { user } = useAuth();
  const rawId = user?.employeeId || user?.id;
  const employeeId = rawId || '';

  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [recentLeave, setRecentLeave] = useState<LeaveRequest[]>([]);
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus | null>(null);
  const [enrollments, setEnrollments] = useState<TrainingEnrollment[]>([]);
  const [recognitions, setRecognitions] = useState<Recognition[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [onboardingChecklist, setOnboardingChecklist] = useState<OnboardingChecklist | null>(null);
  const [announcements, setAnnouncements] = useState<FeedPost[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balancesLoading, setBalancesLoading] = useState(true);
  const [clockingIn, setClockingIn] = useState(false);
  const [clockingOut, setClockingOut] = useState(false);
  const [clockError, setClockError] = useState<string | null>(null);

  // Fetch all data
  useEffect(() => {
    if (!employeeId) {
      setError('Employee profile could not be resolved. Please contact your administrator.');
      setLoading(false);
      setBalancesLoading(false);
      return;
    }

    const fetchProfile = apiFetch(`/api/employee/profile?employeeId=${employeeId}`)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load profile (HTTP ${res.status})`);
        return res.json();
      });

    const fetchBalances = leaveService.getBalances(employeeId).catch(() => []);
    const fetchLeave = leaveService.getLeaveRequests({ employeeId, page: 0, size: 5 }).catch(() => ({ content: [] }));
    const fetchAttendance = attendanceService.getStatus(employeeId).catch(() => null);
    const fetchEnrollments = trainingService.getEnrollments({ employeeId }).catch(() => []);
    const fetchRecognitions = engagementService.getRecognitionsReceived(employeeId, 0, 3)
      .catch(() => ({ content: [], totalElements: 0 }));
    const fetchOnboarding = onboardingService.getChecklistsByEmployee(employeeId).catch(() => []);
    const fetchAnnouncements = feedService.getFeed(0, 3, 'ANNOUNCEMENT').catch(() => ({ content: [] }));

    Promise.allSettled([
      fetchProfile,
      fetchBalances,
      fetchLeave,
      fetchAttendance,
      fetchEnrollments,
      fetchRecognitions,
      fetchOnboarding,
      fetchAnnouncements,
    ]).then(([profileRes, balancesRes, leaveRes, attendanceRes, enrollmentsRes, recognitionsRes, onboardingRes, announcementsRes]) => {
      // Profile is required
      if (profileRes.status === 'fulfilled') {
        setProfile(profileRes.value);
      } else {
        setError('Failed to load profile');
      }

      if (balancesRes.status === 'fulfilled') setBalances(balancesRes.value);
      if (leaveRes.status === 'fulfilled') setRecentLeave(leaveRes.value.content || []);
      if (attendanceRes.status === 'fulfilled' && attendanceRes.value) setAttendanceStatus(attendanceRes.value);
      if (enrollmentsRes.status === 'fulfilled') setEnrollments(enrollmentsRes.value);
      if (recognitionsRes.status === 'fulfilled') {
        setRecognitions(recognitionsRes.value.content || []);
        setTotalPoints(
          (recognitionsRes.value.content || []).reduce((sum: number, r: Recognition) => sum + r.points, 0)
        );
      }
      if (onboardingRes.status === 'fulfilled') {
        const checklists = onboardingRes.value;
        const active = checklists.find((c: OnboardingChecklist) => c.status === 'IN_PROGRESS');
        if (active) setOnboardingChecklist(active);
      }
      if (announcementsRes.status === 'fulfilled') {
        setAnnouncements(announcementsRes.value.content || []);
      }
    }).finally(() => {
      setLoading(false);
      setBalancesLoading(false);
    });
  }, [employeeId]);

  // Clock in handler
  const handleClockIn = async () => {
    setClockingIn(true);
    setClockError(null);
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
      setAttendanceStatus(record);
    } catch (e: any) {
      setClockError(e.message || 'Failed to clock in');
    } finally {
      setClockingIn(false);
    }
  };

  // Clock out handler
  const handleClockOut = async () => {
    setClockingOut(true);
    setClockError(null);
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
      await attendanceService.clockOut(employeeId, lat, lng);
      setAttendanceStatus({ clockedIn: false });
    } catch (e: any) {
      setClockError(e.message || 'Failed to clock out');
    } finally {
      setClockingOut(false);
    }
  };

  // Build upcoming timeline
  const upcomingItems = useMemo<UpcomingItem[]>(() => {
    const items: UpcomingItem[] = [];

    recentLeave
      .filter(l => ['APPROVED', 'PENDING'].includes(l.status))
      .forEach(l => {
        items.push({
          id: `leave-${l.id}`,
          type: 'leave',
          title: `${l.leaveTypeName} Leave`,
          date: l.startDate,
          endDate: l.endDate,
          status: l.status,
        });
      });

    enrollments
      .filter(e => e.status === 'ENROLLED')
      .forEach(e => {
        items.push({
          id: `training-${e.id}`,
          type: 'training',
          title: e.courseTitle,
          date: e.sessionStartDate,
          endDate: e.sessionEndDate,
          status: e.status,
        });
      });

    items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return items.slice(0, 5);
  }, [recentLeave, enrollments]);

  const quickActions = [
    { label: 'Request Leave', href: '/leave/request', icon: CalendarDaysIcon, color: 'text-blue-600 bg-blue-50' },
    { label: 'My Documents', href: '/employee/documents', icon: DocumentTextIcon, color: 'text-green-600 bg-green-50' },
    { label: 'Training Courses', href: '/training/courses', icon: AcademicCapIcon, color: 'text-purple-600 bg-purple-50' },
    { label: 'Give Recognition', href: '/engagement/recognition/give', icon: HandThumbUpIcon, color: 'text-amber-600 bg-amber-50' },
  ];

  const isClockedIn = attendanceStatus && isAttendanceRecord(attendanceStatus);

  return (
    <FeatureGate feature="EMPLOYEE_SELF_SERVICE">
      <PageWrapper
        title=""
        subtitle=""
      >
        {loading ? (
          <InlineLoading message="Loading your dashboard..." />
        ) : error ? (
          /* BUG-002 fix: show a helpful "Profile Setup Required" state with guidance instead of a generic error */
          <div className="text-center py-12 enterprise-card max-w-lg mx-auto">
            <UserCircleIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium text-red-600 mb-2">Profile Setup Required</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <p className="text-xs text-muted-foreground">
              Your login account has not been linked to an employee record. Please ask your HR administrator
              to create or link your employee profile.
            </p>
          </div>
        ) : !profile ? (
          <div className="text-center py-12 enterprise-card max-w-lg mx-auto">
            <UserCircleIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium text-foreground mb-2">No Profile Data</p>
            <p className="text-sm text-muted-foreground">
              Your employee profile could not be loaded. Please contact your administrator.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 1. Greeting Banner */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {getGreeting()}, {profile.preferredName || profile.firstName}
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {profile.jobTitle || 'Employee'} · {profile.department || 'No department'}
                </p>
              </div>
              <Link
                href="/employee/profile/edit"
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <PencilSquareIcon className="w-4 h-4" />
                Edit Profile
              </Link>
            </div>

            {/* 2. Profile Card + Attendance Widget */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Profile Card */}
              <div className="enterprise-card p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-lg shrink-0">
                    {profile.profilePhotoUrl ? (
                      <img src={profile.profilePhotoUrl} alt="" className="w-14 h-14 rounded-full object-cover" />
                    ) : (
                      getInitials(profile.firstName, profile.lastName)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-foreground truncate">
                      {profile.title ? `${profile.title} ` : ''}{profile.firstName} {profile.lastName}
                    </h2>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{profile.employeeNumber}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${profile.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                        {profile.status}
                      </span>
                    </div>
                    <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                      <p>Hired {new Date(profile.hireDate).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      {profile.location && <p>{profile.location}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Attendance Widget */}
              <FeatureGate feature="TIME_ATTENDANCE" fallback={<div />}>
                <div className="enterprise-card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <ClockIcon className="w-5 h-5 text-muted-foreground" />
                    <h3 className="text-sm font-semibold text-foreground">Today&apos;s Attendance</h3>
                  </div>

                  {clockError && (
                    <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">
                      {clockError}
                    </div>
                  )}

                  {isClockedIn ? (
                    <div className="space-y-3">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Clocked in at</p>
                          <p className="text-xl font-semibold text-green-600">{formatTime(attendanceStatus.clockIn)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Elapsed</p>
                          <p className="text-lg font-medium text-foreground">{getElapsedHours(attendanceStatus.clockIn)}</p>
                        </div>
                      </div>
                      <button
                        onClick={handleClockOut}
                        disabled={clockingOut}
                        className="w-full py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium transition-colors"
                      >
                        {clockingOut ? 'Clocking Out...' : 'Clock Out'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">You are not clocked in</p>
                        <p className="text-xl font-semibold text-muted-foreground">--:--</p>
                      </div>
                      <button
                        onClick={handleClockIn}
                        disabled={clockingIn}
                        className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors"
                      >
                        {clockingIn ? 'Clocking In...' : 'Clock In'}
                      </button>
                    </div>
                  )}
                </div>
              </FeatureGate>
            </div>

            {/* 3. Leave Balances */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">Leave Balances</h3>
                <Link href="/leave" className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  View all <ArrowRightIcon className="w-3 h-3" />
                </Link>
              </div>
              <LeaveBalanceCards balances={balances} loading={balancesLoading} />
            </div>

            {/* 4. Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickActions.map(action => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 enterprise-card p-4 hover:shadow-md transition-shadow"
                >
                  <div className={`p-2 rounded-lg ${action.color}`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{action.label}</span>
                </Link>
              ))}
            </div>

            {/* 5. Upcoming Timeline + Recognitions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upcoming & Recent */}
              <div className="enterprise-card p-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">Upcoming & Recent</h3>
                {upcomingItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No upcoming events</p>
                ) : (
                  <div className="space-y-3">
                    {upcomingItems.map(item => (
                      <div key={item.id} className="flex items-start gap-3 py-2 border-b last:border-b-0">
                        <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${item.type === 'leave' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                          {item.type === 'leave' ? (
                            <CalendarDaysIcon className="w-4 h-4" />
                          ) : (
                            <AcademicCapIcon className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(item.date)}{item.endDate && item.endDate !== item.date ? ` – ${formatDate(item.endDate)}` : ''}
                          </p>
                        </div>
                        <StatusPill value={item.status} size="sm" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recognitions */}
              <div className="enterprise-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground">My Recognitions</h3>
                  {totalPoints > 0 && (
                    <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <StarIcon className="w-3 h-3" />
                      {totalPoints} pts
                    </span>
                  )}
                </div>
                {recognitions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No recognitions yet</p>
                ) : (
                  <div className="space-y-3">
                    {recognitions.map(rec => (
                      <div key={rec.id} className="py-2 border-b last:border-b-0">
                        <p className="text-sm text-foreground italic">&ldquo;{rec.message || 'No message'}&rdquo;</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <p className="text-xs text-muted-foreground">
                            From {rec.fromEmployeeName}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-amber-700">{rec.points} pts</span>
                            <span className="text-xs text-muted-foreground">{formatDate(rec.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 6. Onboarding Progress + Announcements */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Onboarding Progress */}
              {onboardingChecklist && (
                <div className="enterprise-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-foreground">Onboarding Progress</h3>
                    <Link href={`/onboarding/${onboardingChecklist.id}`} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                      View all <ArrowRightIcon className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        {onboardingChecklist.items?.filter(i => i.status === 'COMPLETED').length || 0} of {onboardingChecklist.items?.length || 0} tasks completed
                      </span>
                      <span>
                        {onboardingChecklist.items
                          ? Math.round(((onboardingChecklist.items.filter(i => i.status === 'COMPLETED').length) / (onboardingChecklist.items.length || 1)) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-2 bg-blue-600 rounded-full transition-all"
                        style={{
                          width: `${onboardingChecklist.items
                            ? Math.round(((onboardingChecklist.items.filter(i => i.status === 'COMPLETED').length) / (onboardingChecklist.items.length || 1)) * 100)
                            : 0}%`
                        }}
                      />
                    </div>
                    {onboardingChecklist.dueDate && (
                      <p className="text-xs text-muted-foreground">
                        Due by {new Date(onboardingChecklist.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Latest Announcements */}
              {announcements.length > 0 && (
                <div className="enterprise-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-foreground">Latest Announcements</h3>
                    <Link href="/feed" className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                      View all <ArrowRightIcon className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {announcements.map(post => (
                      <Link key={post.id} href={`/feed/${post.id}`} className="block py-2 border-b last:border-b-0 hover:bg-muted/30 -mx-2 px-2 rounded">
                        <p className="text-sm font-medium text-foreground truncate">{post.title || 'Announcement'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{post.content}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(post.publishedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 7. Emergency Contact (compact footer) */}
            {profile.emergencyContactName && (
              <div className="enterprise-card px-6 py-3 flex items-center gap-2 text-sm">
                <PhoneIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Emergency Contact:</span>
                <span className="font-medium text-foreground">{profile.emergencyContactName}</span>
                {profile.emergencyContactRelationship && (
                  <span className="text-muted-foreground">· {profile.emergencyContactRelationship}</span>
                )}
                {profile.emergencyContactPhone && (
                  <span className="text-muted-foreground">· {profile.emergencyContactPhone}</span>
                )}
              </div>
            )}
          </div>
        )}
      </PageWrapper>
    </FeatureGate>
  );
}
