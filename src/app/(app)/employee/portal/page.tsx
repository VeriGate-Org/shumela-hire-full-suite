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
  BriefcaseIcon,
  LightBulbIcon,
  PresentationChartBarIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { leaveService, LeaveBalance, LeaveRequest } from '@/services/leaveService';
import { attendanceService, AttendanceRecord } from '@/services/attendanceService';
import { trainingService, TrainingEnrollment, IndividualDevelopmentPlan } from '@/services/trainingService';
import { engagementService, Recognition } from '@/services/engagementService';
import { performanceEnhancementService } from '@/services/performanceEnhancementService';
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

interface InternalJob {
  id: number | string;
  title: string;
  department: string;
  location: string;
  closingDate: string | null;
}

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

function getTodayFormatted(): string {
  return new Date().toLocaleDateString([], {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
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
  const [internalJobs, setInternalJobs] = useState<InternalJob[]>([]);
  const [activeIdp, setActiveIdp] = useState<IndividualDevelopmentPlan | null>(null);
  const [perfCycleName, setPerfCycleName] = useState<string | null>(null);
  const [selfAssessmentStatus, setSelfAssessmentStatus] = useState<string | null>(null);
  const [selfRating, setSelfRating] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balancesLoading, setBalancesLoading] = useState(true);
  const [clockingIn, setClockingIn] = useState(false);
  const [clockingOut, setClockingOut] = useState(false);
  const [clockError, setClockError] = useState<string | null>(null);

  // Fetch all data
  useEffect(() => {
    if (!employeeId) {
      // Don't show error while auth is still loading
      if (user !== undefined) {
        setError('Employee profile could not be resolved. Please contact your administrator.');
        setLoading(false);
        setBalancesLoading(false);
      }
      return;
    }
    // Clear any previous error and reset loading when employeeId becomes available
    setError(null);
    setLoading(true);
    setBalancesLoading(true);

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
    const fetchInternalJobs = apiFetch('/api/ads/internal?size=5')
      .then(res => res.ok ? res.json() : { content: [] })
      .catch(() => ({ content: [] }));
    const fetchIdps = trainingService.getIDPs({ employeeId }).catch(() => []);
    const fetchPerfContracts = apiFetch(`/api/performance/contracts?employeeId=${employeeId}`)
      .then(res => res.ok ? res.json() : [])
      .catch(() => []);
    const fetchSelfAssessments = performanceEnhancementService
      .getFeedbackRequestsForEmployee(Number(employeeId))
      .catch(() => ({ content: [] }));

    Promise.allSettled([
      fetchProfile,
      fetchBalances,
      fetchLeave,
      fetchAttendance,
      fetchEnrollments,
      fetchRecognitions,
      fetchOnboarding,
      fetchAnnouncements,
      fetchInternalJobs,
      fetchIdps,
      fetchPerfContracts,
      fetchSelfAssessments,
    ]).then(([profileRes, balancesRes, leaveRes, attendanceRes, enrollmentsRes, recognitionsRes, onboardingRes, announcementsRes, internalJobsRes, idpsRes, perfContractsRes, selfAssessmentsRes]) => {
      // Profile is required
      if (profileRes.status === 'fulfilled') {
        setProfile(profileRes.value);
      } else {
        setError('Failed to load profile');
      }

      if (balancesRes.status === 'fulfilled') setBalances(Array.isArray(balancesRes.value) ? balancesRes.value : []);
      if (leaveRes.status === 'fulfilled') {
        // Backend returns List<> (plain array) or PageResponse { content: [...] }
        const raw = leaveRes.value;
        const content = Array.isArray(raw) ? raw : (raw?.content ?? []);
        setRecentLeave(Array.isArray(content) ? content : []);
      }
      if (attendanceRes.status === 'fulfilled' && attendanceRes.value) setAttendanceStatus(attendanceRes.value);
      if (enrollmentsRes.status === 'fulfilled') setEnrollments(Array.isArray(enrollmentsRes.value) ? enrollmentsRes.value : []);
      if (recognitionsRes.status === 'fulfilled') {
        // Backend returns List<> (plain array) or { content: [...] }
        const raw = recognitionsRes.value;
        const content = Array.isArray(raw) ? raw : (Array.isArray(raw?.content) ? raw.content : []);
        setRecognitions(content);
        setTotalPoints(content.reduce((sum: number, r: Recognition) => sum + r.points, 0));
      }
      if (onboardingRes.status === 'fulfilled') {
        const checklists = Array.isArray(onboardingRes.value) ? onboardingRes.value : [];
        const active = checklists.find((c: OnboardingChecklist) => c.status === 'IN_PROGRESS');
        if (active) setOnboardingChecklist(active);
      }
      if (announcementsRes.status === 'fulfilled') {
        const content = announcementsRes.value?.content;
        setAnnouncements(Array.isArray(content) ? content : []);
      }
      if (internalJobsRes.status === 'fulfilled') {
        const raw = internalJobsRes.value?.data?.content ?? internalJobsRes.value?.content ?? internalJobsRes.value;
        const items = Array.isArray(raw) ? raw : [];
        setInternalJobs(
          items.map((job: Record<string, unknown>) => ({
            id: job.id as string | number,
            title: (job.title ?? job.jobTitle ?? '') as string,
            department: (job.department ?? '') as string,
            location: (job.location ?? '') as string,
            closingDate: (job.closingDate ?? null) as string | null,
          }))
        );
      }
      if (idpsRes.status === 'fulfilled') {
        const plans = Array.isArray(idpsRes.value) ? idpsRes.value : [];
        const active = plans.find((p: IndividualDevelopmentPlan) => p.status === 'ACTIVE') || plans[0] || null;
        setActiveIdp(active);
      }
      if (perfContractsRes.status === 'fulfilled') {
        const all = Array.isArray(perfContractsRes.value) ? perfContractsRes.value : (perfContractsRes.value?.content ?? []);
        const myContract = Array.isArray(all) ? all[0] : null;
        if (myContract?.cycle?.name) setPerfCycleName(myContract.cycle.name);
      }
      if (selfAssessmentsRes.status === 'fulfilled') {
        const raw = selfAssessmentsRes.value;
        const content = Array.isArray(raw) ? raw : (raw?.content ?? []);
        const selfReq = content.find((r: any) => r.feedbackType === 'SELF');
        if (selfReq) {
          setSelfAssessmentStatus(selfReq.status);
        }
      }
    }).catch(() => {
      // Prevent uncaught promise rejections
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
      .filter(e => e.status === 'REGISTERED')
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
    { label: 'Request Leave', href: '/leave/request', icon: CalendarDaysIcon, iconBg: 'bg-icon-bg-navy', iconColor: 'text-accent-navy' },
    { label: 'My Documents', href: '/employee/documents', icon: DocumentTextIcon, iconBg: 'bg-icon-bg-teal', iconColor: 'text-accent-teal' },
    { label: 'Internal Jobs', href: '/internal/jobs', icon: BriefcaseIcon, iconBg: 'bg-icon-bg-gold', iconColor: 'text-accent-gold' },
    { label: 'Training Courses', href: '/training/courses', icon: AcademicCapIcon, iconBg: 'bg-icon-bg-navy', iconColor: 'text-accent-navy' },
    { label: 'Give Recognition', href: '/engagement/recognition/give', icon: HandThumbUpIcon, iconBg: 'bg-icon-bg-teal', iconColor: 'text-accent-teal' },
    { label: 'Edit Profile', href: '/employee/profile/edit', icon: PencilSquareIcon, iconBg: 'bg-icon-bg-pink', iconColor: 'text-accent-pink' },
  ];

  const isClockedIn = attendanceStatus && isAttendanceRecord(attendanceStatus);

  const timelineDotColors = [
    'bg-cta',
    'bg-primary',
    'bg-accent-teal',
    'bg-primary',
    'bg-accent-pink',
  ];

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

            {/* ========== WELCOME BANNER ========== */}
            <div className="relative overflow-hidden rounded-card bg-gradient-to-br from-primary to-accent-teal px-6 py-6 lg:px-10 lg:py-8">
              {/* Decorative circles */}
              <div className="absolute -top-1/2 -right-[10%] w-[400px] h-[400px] rounded-full bg-white/[0.03] pointer-events-none" />
              <div className="absolute -bottom-[60%] left-[20%] w-[300px] h-[300px] rounded-full bg-white/[0.02] pointer-events-none" />

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h1 className="text-2xl lg:text-[1.75rem] font-extrabold text-white">
                    {getGreeting()}, {profile.preferredName || profile.firstName}
                  </h1>
                  <p className="text-white/70 text-base font-medium mt-0.5">
                    {getTodayFormatted()}
                  </p>
                  <p className="text-white/50 text-sm mt-0.5">
                    {profile.jobTitle || 'Employee'} &mdash; {profile.department || 'No department'}
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  {/* Profile Completion Ring */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="relative w-20 h-20">
                      <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2.5" />
                        <circle
                          cx="18" cy="18" r="15.9" fill="none" stroke="#F1C54B" strokeWidth="2.5"
                          strokeDasharray="85, 100" strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-white font-extrabold text-lg">
                        85%
                      </div>
                    </div>
                    <span className="text-xs text-white/70 font-medium">Profile Complete</span>
                  </div>

                  {/* Edit Profile link */}
                  <Link
                    href="/employee/profile/edit"
                    className="flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition-colors"
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                    Edit Profile
                  </Link>
                </div>
              </div>
            </div>

            {/* ========== ROW 1: Attendance + Leave Balances ========== */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">

              {/* A. Attendance Widget */}
              <FeatureGate feature="TIME_ATTENDANCE" fallback={
                /* Profile Card fallback when attendance is off */
                <div className="enterprise-card p-6">
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-8 h-8 rounded-control bg-icon-bg-navy text-accent-navy flex items-center justify-center">
                      <UserCircleIcon className="w-[18px] h-[18px]" />
                    </div>
                    <span className="text-base font-bold text-foreground">Employee Profile</span>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-full bg-icon-bg-navy flex items-center justify-center text-accent-navy font-semibold text-lg shrink-0">
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
                        <span className="text-xs bg-icon-bg-navy text-accent-navy px-2 py-0.5 rounded-full">{profile.employeeNumber}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${profile.status === 'ACTIVE' ? 'bg-icon-bg-teal text-accent-teal' : 'bg-muted text-muted-foreground'}`}>
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
              }>
                <div className="enterprise-card p-6">
                  {/* Card header with icon */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-control bg-icon-bg-navy text-accent-navy flex items-center justify-center">
                        <ClockIcon className="w-[18px] h-[18px]" />
                      </div>
                      <span className="text-base font-bold text-foreground">Today&apos;s Attendance</span>
                    </div>
                  </div>

                  {clockError && (
                    <div className="text-sm text-accent-pink bg-surface-pink rounded-control px-3 py-2 mb-4">
                      {clockError}
                    </div>
                  )}

                  {/* Attendance content with clock ring */}
                  <div className="flex items-center gap-8 mb-6">
                    {/* Clock ring */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className="relative w-[120px] h-[120px]">
                        <svg viewBox="0 0 36 36" className="w-[120px] h-[120px] -rotate-90">
                          <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--icon-bg-navy)" strokeWidth="3" />
                          {isClockedIn && (
                            <circle
                              cx="18" cy="18" r="15.9" fill="none" stroke="var(--accent-teal)" strokeWidth="3"
                              strokeDasharray={`${Math.min(100, (((Date.now() - new Date(attendanceStatus.clockIn).getTime()) / 3600000) / 8) * 100)}, 100`}
                              strokeLinecap="round"
                            />
                          )}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-[1.75rem] font-extrabold text-foreground leading-none">
                            {isClockedIn ? getElapsedHours(attendanceStatus.clockIn) : '--:--'}
                          </span>
                          <span className="text-[0.7rem] text-muted-foreground mt-0.5">of 8:00 hours</span>
                        </div>
                      </div>
                    </div>

                    {/* Clock info */}
                    <div className="flex-1">
                      {isClockedIn ? (
                        <>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                            <div>
                              <div className="text-xs text-muted-foreground">Clocked In</div>
                              <div className="text-lg font-bold text-foreground">{formatTime(attendanceStatus.clockIn)}</div>
                            </div>
                          </div>
                          <div className="text-sm font-semibold text-accent-teal mb-4">Currently Clocked In</div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-muted-foreground shrink-0" />
                            <div>
                              <div className="text-xs text-muted-foreground">Not Clocked In</div>
                              <div className="text-lg font-bold text-muted-foreground">--:--</div>
                            </div>
                          </div>
                          <div className="text-sm font-semibold text-muted-foreground mb-4">Clocked Out</div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Clock action button */}
                  <div className="text-center mb-6">
                    {isClockedIn ? (
                      <button
                        onClick={handleClockOut}
                        disabled={clockingOut}
                        className="inline-flex items-center justify-center gap-2 px-10 py-3 rounded-button bg-cta text-cta-foreground font-bold text-sm uppercase tracking-wider border-2 border-cta hover:bg-cta-hover hover:border-cta-hover disabled:opacity-50 transition-all shadow-sm hover:shadow-md"
                      >
                        {clockingOut ? 'Clocking Out...' : 'CLOCK OUT'}
                      </button>
                    ) : (
                      <button
                        onClick={handleClockIn}
                        disabled={clockingIn}
                        className="inline-flex items-center justify-center gap-2 px-10 py-3 rounded-button bg-primary text-primary-foreground font-bold text-sm uppercase tracking-wider border-2 border-primary hover:shadow-md disabled:opacity-50 transition-all shadow-sm"
                      >
                        {clockingIn ? 'Clocking In...' : 'CLOCK IN'}
                      </button>
                    )}
                  </div>

                  {/* Weekly hours separator */}
                  <div className="border-t border-border pt-5">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                      Weekly Hours
                    </div>
                    <p className="text-sm text-muted-foreground text-center py-2">
                      Weekly hours tracking available from attendance history
                    </p>
                  </div>
                </div>
              </FeatureGate>

              {/* B. Leave Balances */}
              <div className="enterprise-card p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-control bg-icon-bg-teal text-accent-teal flex items-center justify-center">
                      <CalendarDaysIcon className="w-[18px] h-[18px]" />
                    </div>
                    <span className="text-base font-bold text-foreground">Leave Balances</span>
                  </div>
                  <Link href="/leave" className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold">
                    View all <ArrowRightIcon className="w-3 h-3" />
                  </Link>
                </div>

                <LeaveBalanceCards balances={balances} loading={balancesLoading} />

                <div className="text-center mt-5">
                  <Link
                    href="/leave/request"
                    className="btn-primary inline-flex items-center justify-center"
                  >
                    REQUEST LEAVE
                  </Link>
                </div>
              </div>
            </div>

            {/* ========== ROW 2: Action Items + Quick Actions ========== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* C. Action Items (Upcoming & Recent) */}
              <div className="enterprise-card p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-control bg-icon-bg-pink text-accent-pink flex items-center justify-center">
                      <ClockIcon className="w-[18px] h-[18px]" />
                    </div>
                    <span className="text-base font-bold text-foreground">Upcoming &amp; Recent</span>
                    {upcomingItems.length > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-accent-pink text-white text-[0.7rem] font-bold">
                        {upcomingItems.length}
                      </span>
                    )}
                  </div>
                </div>

                {upcomingItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No upcoming events</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {upcomingItems.map((item, idx) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-4 rounded-control bg-background border-l-4 transition-all hover:shadow-sm hover:translate-x-0.5"
                        style={{
                          borderLeftColor: item.status === 'PENDING'
                            ? 'var(--accent-gold)'
                            : item.type === 'leave'
                              ? 'var(--accent-navy)'
                              : 'var(--accent-teal)',
                        }}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: item.status === 'PENDING'
                              ? 'var(--accent-gold)'
                              : item.type === 'leave'
                                ? 'var(--accent-navy)'
                                : 'var(--accent-teal)',
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-foreground truncate">{item.title}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(item.date)}{item.endDate && item.endDate !== item.date ? ` - ${formatDate(item.endDate)}` : ''}
                          </div>
                        </div>
                        <StatusPill value={item.status} size="sm" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* D. Quick Actions */}
              <div className="enterprise-card p-6">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-8 h-8 rounded-control bg-icon-bg-gold text-accent-gold flex items-center justify-center">
                    <LightBulbIcon className="w-[18px] h-[18px]" />
                  </div>
                  <span className="text-base font-bold text-foreground">Quick Actions</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {quickActions.map(action => (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="flex flex-col items-center gap-3 py-5 px-3 rounded-card border border-border bg-card cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-primary"
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${action.iconBg} ${action.iconColor}`}>
                        <action.icon className="w-[22px] h-[22px]" />
                      </div>
                      <span className="text-xs font-semibold text-foreground text-center leading-tight">{action.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* ========== ROW 3: Career & Development + Announcements ========== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* E. Career & Development */}
              <div className="enterprise-card p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-control bg-icon-bg-navy text-accent-navy flex items-center justify-center">
                      <PresentationChartBarIcon className="w-[18px] h-[18px]" />
                    </div>
                    <span className="text-base font-bold text-foreground">Career &amp; Development</span>
                  </div>
                </div>

                {/* Performance Summary Sub-section */}
                <div className="mb-6">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Performance Summary
                  </div>
                  {perfCycleName ? (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-foreground">{perfCycleName}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Self Assessment:</span>
                        <StatusPill value={selfAssessmentStatus || 'PENDING'} size="sm" />
                      </div>
                      <Link href="/employee/performance" className="text-sm font-semibold text-primary hover:underline">
                        View Full Review
                      </Link>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">No active performance cycle</p>
                  )}
                </div>

                <hr className="border-border my-6" />

                {/* Learning & Development Sub-section */}
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Learning &amp; Development
                  </div>
                  {activeIdp ? (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-foreground">{activeIdp.title}</p>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          {activeIdp.goals.filter(g => g.status === 'COMPLETED').length} of {activeIdp.goals.length} goals completed
                        </span>
                        <span>
                          {activeIdp.goals.length > 0
                            ? Math.round((activeIdp.goals.filter(g => g.status === 'COMPLETED').length / activeIdp.goals.length) * 100)
                            : 0}%
                        </span>
                      </div>
                      <div className="h-2 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-1000"
                          style={{
                            width: `${activeIdp.goals.length > 0
                              ? Math.round((activeIdp.goals.filter(g => g.status === 'COMPLETED').length / activeIdp.goals.length) * 100)
                              : 0}%`
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">No active development plan</p>
                  )}

                  {/* Upcoming training sessions */}
                  {enrollments.filter(e => e.status === 'REGISTERED').length > 0 && (
                    <div className="mt-5">
                      <div className="text-sm font-semibold text-foreground mb-2">
                        {enrollments.filter(e => e.status === 'REGISTERED').length} Upcoming Training Session{enrollments.filter(e => e.status === 'REGISTERED').length !== 1 ? 's' : ''}
                      </div>
                      {enrollments.filter(e => e.status === 'REGISTERED').slice(0, 3).map(enrollment => (
                        <div key={enrollment.id} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                          <span className="text-xs font-medium text-foreground">{enrollment.courseTitle}</span>
                          <span className="text-xs text-muted-foreground">{formatDate(enrollment.sessionStartDate)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4">
                    <Link
                      href="/training/courses"
                      className="btn-primary inline-flex items-center justify-center text-xs"
                    >
                      BROWSE COURSES
                    </Link>
                  </div>
                </div>
              </div>

              {/* F. Announcements */}
              <div className="enterprise-card p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-control bg-icon-bg-pink text-accent-pink flex items-center justify-center">
                      <DocumentTextIcon className="w-[18px] h-[18px]" />
                    </div>
                    <span className="text-base font-bold text-foreground">Announcements</span>
                  </div>
                </div>

                {announcements.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No announcements</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {announcements.map((post, idx) => (
                      <Link
                        key={post.id}
                        href={`/feed/${post.id}`}
                        className="block p-4 rounded-control bg-background border-l-4 transition-all hover:shadow-sm"
                        style={{
                          borderLeftColor: idx === 0
                            ? 'var(--accent-pink)'
                            : idx === 1
                              ? 'var(--accent-navy)'
                              : 'var(--accent-teal)',
                        }}
                      >
                        <div className="text-sm font-bold text-foreground mb-1 truncate">
                          {post.title || 'Announcement'}
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-1.5">
                          {post.content}
                        </div>
                        <div className="text-[0.7rem] text-muted-foreground/70">
                          {new Date(post.publishedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                <Link href="/feed" className="block text-center mt-4 text-sm font-semibold text-primary hover:underline">
                  View All Announcements
                </Link>
              </div>
            </div>

            {/* ========== ROW 4: Upcoming Schedule + Recognition ========== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* G. Career Opportunities */}
              <div className="enterprise-card p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-control bg-icon-bg-gold text-accent-gold flex items-center justify-center">
                      <BriefcaseIcon className="w-[18px] h-[18px]" />
                    </div>
                    <span className="text-base font-bold text-foreground">Career Opportunities</span>
                  </div>
                  <Link href="/internal/jobs" className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold">
                    View all <ArrowRightIcon className="w-3 h-3" />
                  </Link>
                </div>

                <div className="flex gap-3 mb-4">
                  <div className="flex items-center gap-2 bg-icon-bg-navy text-accent-navy px-3 py-1.5 rounded-full text-xs font-medium">
                    <BriefcaseIcon className="w-4 h-4" />
                    {internalJobs.length} Open Position{internalJobs.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {internalJobs.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2 text-center">No internal positions available at this time.</p>
                ) : (
                  <div className="flex flex-col">
                    {internalJobs.map(job => (
                      <Link
                        key={job.id}
                        href={`/internal/jobs/${job.id}`}
                        className="flex items-center justify-between py-3 border-b border-border last:border-b-0 hover:bg-background/50 transition-colors -mx-2 px-2 rounded-control"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{job.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {job.department}{job.location ? ` \u00b7 ${job.location}` : ''}
                          </p>
                        </div>
                        {job.closingDate && (
                          <span className="text-xs text-muted-foreground shrink-0 ml-4">
                            Closes {formatDate(job.closingDate)}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* H. Recognition & Achievements */}
              <div className="enterprise-card p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-control bg-icon-bg-gold text-accent-gold flex items-center justify-center">
                      <StarIcon className="w-[18px] h-[18px]" />
                    </div>
                    <span className="text-base font-bold text-foreground">Recognition</span>
                  </div>
                  {totalPoints > 0 && (
                    <span className="text-xs font-medium text-accent-gold bg-surface-gold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <StarIcon className="w-3 h-3" />
                      {totalPoints} pts
                    </span>
                  )}
                </div>

                {recognitions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No recognitions yet</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {recognitions.map((rec, idx) => {
                      const iconColorClasses = [
                        { bg: 'bg-icon-bg-gold', text: 'text-accent-gold' },
                        { bg: 'bg-icon-bg-navy', text: 'text-accent-navy' },
                        { bg: 'bg-icon-bg-teal', text: 'text-accent-teal' },
                      ];
                      const colors = iconColorClasses[idx % iconColorClasses.length];
                      return (
                        <div key={rec.id} className="flex gap-4 p-4 rounded-control bg-background transition-all hover:shadow-sm">
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${colors.bg} ${colors.text}`}>
                            <StarIcon className="w-[22px] h-[22px]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-foreground mb-0.5">
                              &ldquo;{rec.message || 'No message'}&rdquo;
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-muted-foreground">From {rec.fromEmployeeName}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-accent-gold">{rec.points} pts</span>
                                <span className="text-xs text-muted-foreground">{formatDate(rec.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="text-center mt-4">
                  <Link
                    href="/engagement/recognition/give"
                    className="btn-primary inline-flex items-center justify-center text-xs"
                  >
                    GIVE RECOGNITION
                  </Link>
                </div>
              </div>
            </div>

            {/* ========== ROW 5: Onboarding + Extra Info ========== */}
            {(onboardingChecklist && (onboardingChecklist.items?.length ?? 0) > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Onboarding Progress */}
                <div className="enterprise-card p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-control bg-icon-bg-teal text-accent-teal flex items-center justify-center">
                        <AcademicCapIcon className="w-[18px] h-[18px]" />
                      </div>
                      <span className="text-base font-bold text-foreground">Onboarding Progress</span>
                    </div>
                    <Link href={`/onboarding/${onboardingChecklist.id}`} className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold">
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
                    <div className="h-2 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-1000"
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
              </div>
            )}

            {/* ========== EMERGENCY CONTACT FOOTER ========== */}
            {profile.emergencyContactName && (
              <div className="enterprise-card px-6 py-3 flex items-center gap-2 text-sm">
                <PhoneIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Emergency Contact:</span>
                <span className="font-medium text-foreground">{profile.emergencyContactName}</span>
                {profile.emergencyContactRelationship && (
                  <span className="text-muted-foreground">&middot; {profile.emergencyContactRelationship}</span>
                )}
                {profile.emergencyContactPhone && (
                  <span className="text-muted-foreground">&middot; {profile.emergencyContactPhone}</span>
                )}
              </div>
            )}
          </div>
        )}
      </PageWrapper>
    </FeatureGate>
  );
}
