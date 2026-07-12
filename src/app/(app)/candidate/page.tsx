'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import PageWrapper from '@/components/PageWrapper';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api-fetch';
import { getApplicantId, getApplicant, getApplications as fetchApplications, getDocuments as fetchDocuments } from '@/services/candidateService';
import StatusPill from '@/components/StatusPill';
import {
  BriefcaseIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  MapPinIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  ArrowRightIcon,
  FunnelIcon,
  XMarkIcon,
  EyeIcon,
  ArrowUpTrayIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StatCard {
  label: string;
  value: string | number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  colorClass: string;
}

interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  postedDate: string;
  description: string;
  closingDate?: string;
}

interface Application {
  id: string;
  jobTitle: string;
  department: string;
  appliedDate: string;
  status: string;
  statusDisplayName: string;
  currentStage: number;
  stages: string[];
}

interface ProfileSummary {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  idNumber: string;
  dateOfBirth: string;
}

interface CandidateDocument {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  size: number;
}

type ProfileTab = 'personal' | 'experience' | 'education' | 'documents';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 KB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(0)) + ' ' + sizes[i];
}

function getTypeBadgeClasses(type: string): string {
  const normalized = type.toLowerCase().replace(/[_-]/g, ' ');
  if (normalized.includes('full')) return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
  if (normalized.includes('part')) return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  if (normalized.includes('contract')) return 'bg-sky-50 text-primary dark:bg-sky-900/30 dark:text-sky-400';
  return 'bg-muted text-muted-foreground';
}

function getStatusBadgeClasses(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('interview')) return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  if (s.includes('offer') || s.includes('hired')) return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
  if (s.includes('reject')) return 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400';
  return 'bg-sky-50 text-primary dark:bg-sky-900/30 dark:text-sky-400';
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCardComponent({ stat }: { stat: StatCard }) {
  return (
    <div className="enterprise-card p-5 flex items-center gap-4 hover:-translate-y-0.5">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${stat.colorClass}`}>
        <stat.icon className="w-6 h-6" />
      </div>
      <div>
        <div className="text-2xl font-extrabold text-foreground">{stat.value}</div>
        <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
      </div>
    </div>
  );
}

function TimelineStep({
  label,
  isCompleted,
  isActive,
}: {
  label: string;
  isCompleted: boolean;
  isActive: boolean;
}) {
  const dotClasses = isCompleted
    ? 'bg-emerald-600 border-emerald-600'
    : isActive
      ? 'bg-primary border-primary ring-4 ring-primary/15'
      : 'bg-muted border-border';
  const iconColor = isCompleted || isActive ? 'text-white' : 'text-muted-foreground';
  const labelClasses = isCompleted || isActive ? 'text-foreground' : 'text-muted-foreground';

  return (
    <div className="flex flex-col items-center flex-1 relative z-[1]">
      <div
        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mb-1 transition-all ${dotClasses}`}
      >
        {isCompleted ? (
          <CheckCircleIcon className={`w-3.5 h-3.5 ${iconColor}`} />
        ) : (
          <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-muted-foreground'}`} />
        )}
      </div>
      <span className={`text-[0.6875rem] font-semibold uppercase tracking-wide text-center ${labelClasses}`}>
        {label}
      </span>
    </div>
  );
}

function TimelineConnector({ isCompleted }: { isCompleted: boolean }) {
  return (
    <div
      className={`flex-1 h-0.5 relative -top-3 z-0 ${
        isCompleted ? 'bg-emerald-600' : 'bg-border'
      }`}
    />
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function CandidatePortalPage() {
  const { user } = useAuth();

  // Data state
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [documents, setDocuments] = useState<CandidateDocument[]>([]);
  const [profileCompleteness, setProfileCompleteness] = useState(0);

  // UI state
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [profileTab, setProfileTab] = useState<ProfileTab>('personal');
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);

  // Placeholder experience & education (static for now, to match mock)
  const experiences = [
    {
      id: '1',
      title: 'Water Process Controller',
      company: 'Umgeni Water, Pietermaritzburg',
      period: 'Jan 2020 - Present',
      description:
        'Responsible for monitoring and controlling water purification processes, ensuring compliance with SANS 241 standards, and maintaining treatment records.',
    },
    {
      id: '2',
      title: 'Junior Laboratory Technician',
      company: 'eThekwini Water and Sanitation, Durban',
      period: 'Mar 2018 - Dec 2019',
      description:
        'Conducted water quality testing, prepared samples for chemical analysis, and assisted with environmental compliance reporting.',
    },
    {
      id: '3',
      title: 'Intern - Environmental Services',
      company: 'Department of Water and Sanitation, KZN Regional Office',
      period: 'Jan 2017 - Feb 2018',
      description:
        'Supported water resource management activities, assisted in data collection for catchment studies, and participated in community awareness programmes.',
    },
  ];

  const educationEntries = [
    {
      id: '1',
      title: 'National Diploma in Water Care',
      institution: 'Durban University of Technology',
      period: '2014 - 2016',
      details: 'Graduated with distinction. Specialised in water treatment and quality management.',
    },
    {
      id: '2',
      title: 'Certificate in Water Process Control (Class II)',
      institution: 'Department of Water and Sanitation',
      period: '2019',
      details: 'Professional certification for water process control operations.',
    },
    {
      id: '3',
      title: 'National Senior Certificate (Matric)',
      institution: 'Ladysmith High School',
      period: '2013',
      details:
        'Subjects: Mathematics, Physical Sciences, Life Sciences, English, isiZulu, Geography',
    },
  ];

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch published jobs
      const jobsPromise = apiFetch('/api/public/job-postings/published?size=50')
        .then((res) => (res.ok ? res.json() : { content: [] }))
        .catch(() => ({ content: [] }));

      // Fetch candidate-specific data if logged in
      let applicantId: string | null = null;
      if (user?.email) {
        applicantId = await getApplicantId(user.email).catch(() => null);
      }

      const profilePromise = applicantId ? getApplicant(applicantId).catch(() => null) : Promise.resolve(null);
      const appsPromise = applicantId ? fetchApplications(applicantId).catch(() => []) : Promise.resolve([]);
      const docsPromise = applicantId ? fetchDocuments(applicantId).catch(() => []) : Promise.resolve([]);

      const [jobsResult, profileData, appsData, docsData] = await Promise.all([
        jobsPromise,
        profilePromise,
        appsPromise,
        docsPromise,
      ]);

      // Map jobs
      const raw = jobsResult.content || jobsResult.data || jobsResult || [];
      const mappedJobs: JobPosting[] = (Array.isArray(raw) ? raw : []).map((p: any) => ({
        id: p.id,
        title: p.title || '',
        department: p.department || '',
        location: p.location || '',
        employmentType: p.employmentType || 'Full-time',
        postedDate: p.publishedAt || p.createdAt || new Date().toISOString(),
        description: p.description || '',
        closingDate: p.applicationDeadline || undefined,
      }));
      setJobs(mappedJobs);

      // Map profile
      if (profileData) {
        const firstName = profileData.name || profileData.firstName || '';
        const lastName = profileData.surname || profileData.lastName || '';
        const p: ProfileSummary = {
          fullName: `${firstName} ${lastName}`.trim() || user?.email || 'Candidate',
          email: profileData.email || user?.email || '',
          phone: profileData.phone || profileData.phoneNumber || '',
          location: profileData.address || profileData.location || '',
          idNumber: profileData.idNumber || '',
          dateOfBirth: profileData.dateOfBirth || '',
        };
        setProfile(p);

        // Simple completeness calculation
        const fields = [p.fullName, p.email, p.phone, p.location, p.idNumber, p.dateOfBirth];
        const filled = fields.filter((f) => f && f.trim().length > 0).length;
        setProfileCompleteness(Math.round((filled / fields.length) * 100));
      } else {
        // Fallback placeholder profile
        setProfile({
          fullName: user?.name || user?.email || 'Candidate',
          email: user?.email || '',
          phone: '',
          location: '',
          idNumber: '',
          dateOfBirth: '',
        });
        setProfileCompleteness(30);
      }

      // Map applications
      const stages = ['Applied', 'Screening', 'Interview', 'Assessment', 'Decision'];
      const mappedApps: Application[] = (Array.isArray(appsData) ? appsData : []).map((a: any) => {
        const status = a.status || 'SUBMITTED';
        let stageIdx = 0;
        if (status === 'SCREENING' || status === 'UNDER_REVIEW') stageIdx = 1;
        else if (status.includes('INTERVIEW')) stageIdx = 2;
        else if (status === 'ASSESSMENT') stageIdx = 3;
        else if (['OFFER_EXTENDED', 'HIRED', 'REJECTED', 'DECISION'].some((s) => status.includes(s))) stageIdx = 4;

        return {
          id: a.id,
          jobTitle: a.jobTitle || '',
          department: a.department || '',
          appliedDate: a.submittedAt || a.createdAt || new Date().toISOString(),
          status,
          statusDisplayName: a.statusDisplayName || status.replace(/_/g, ' '),
          currentStage: stageIdx,
          stages,
        };
      });
      setApplications(mappedApps);

      // Map documents
      const mappedDocs: CandidateDocument[] = (Array.isArray(docsData) ? docsData : []).map((d: any) => ({
        id: d.id,
        name: d.fileName || d.name || 'Document',
        type: d.documentType || d.type || 'other',
        uploadedAt: d.uploadedAt || d.createdAt || new Date().toISOString(),
        size: d.fileSize || d.size || 0,
      }));
      setDocuments(mappedDocs);
    } catch (error) {
      console.error('Failed to load candidate portal data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  const filteredJobs = jobs.filter((j) => {
    if (departmentFilter && j.department !== departmentFilter) return false;
    if (typeFilter && j.employmentType !== typeFilter) return false;
    if (locationFilter && j.location !== locationFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (
        !j.title.toLowerCase().includes(term) &&
        !j.department.toLowerCase().includes(term) &&
        !j.description.toLowerCase().includes(term)
      )
        return false;
    }
    return true;
  });

  const departments = [...new Set(jobs.map((j) => j.department).filter(Boolean))].sort();
  const types = [...new Set(jobs.map((j) => j.employmentType).filter(Boolean))].sort();
  const locations = [...new Set(jobs.map((j) => j.location).filter(Boolean))].sort();

  const interviewsScheduled = applications.filter(
    (a) => a.status.includes('INTERVIEW') || a.currentStage === 2
  ).length;

  const stats: StatCard[] = [
    {
      label: 'Open Positions',
      value: jobs.length,
      icon: BriefcaseIcon,
      colorClass: 'bg-sky-100 text-primary dark:bg-sky-900/40 dark:text-sky-400',
    },
    {
      label: 'My Applications',
      value: applications.length,
      icon: DocumentTextIcon,
      colorClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    },
    {
      label: 'Interviews Scheduled',
      value: interviewsScheduled,
      icon: ClockIcon,
      colorClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
    },
    {
      label: 'Profile Complete',
      value: `${profileCompleteness}%`,
      icon: CheckCircleIcon,
      colorClass: 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400',
    },
  ];

  // Profile tabs
  const profileTabs: { id: ProfileTab; label: string }[] = [
    { id: 'personal', label: 'Personal Info' },
    { id: 'experience', label: 'Experience' },
    { id: 'education', label: 'Education' },
    { id: 'documents', label: 'Documents' },
  ];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <PageWrapper
      title="Candidate Portal"
      subtitle="Browse job openings, track your applications, and manage your profile"
    >
      {loading ? (
        <div className="space-y-6">
          {/* Skeleton stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="enterprise-card p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-6 w-12 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
          {/* Skeleton section */}
          <div className="enterprise-card p-6 space-y-4">
            <div className="h-5 w-32 bg-muted animate-pulse rounded" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="enterprise-card p-5 space-y-3">
                  <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-2/3 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-full bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* ===== STATS BAR ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <StatCardComponent key={stat.label} stat={stat} />
            ))}
          </div>

          {/* ===== SECTION 1: JOB BOARD ===== */}
          <section>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <BriefcaseIcon className="w-5 h-5 text-primary" />
                Job Board
                <span className="bg-sky-100 text-primary text-xs font-bold px-2.5 py-0.5 rounded-full dark:bg-sky-900/40 dark:text-sky-400">
                  {filteredJobs.length}
                </span>
              </h2>
              <Link
                href="/candidate/jobs"
                className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
              >
                View all jobs
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Filter Bar */}
            <div className="enterprise-card p-4 mb-4">
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
                >
                  <option value="">All Departments</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
                >
                  <option value="">All Types</option>
                  {types.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
                >
                  <option value="">All Locations</option>
                  {locations.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
                <div className="relative flex-1 min-w-[200px]">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search jobs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors placeholder:text-muted-foreground"
                  />
                </div>
              </div>
            </div>

            {/* Job Cards Grid */}
            {filteredJobs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MagnifyingGlassIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <h3 className="font-semibold text-foreground mb-1">No jobs found</h3>
                <p className="text-sm">Try adjusting your search or filter criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredJobs.slice(0, 9).map((job) => (
                  <div
                    key={job.id}
                    className="enterprise-card p-5 flex flex-col cursor-pointer"
                    onClick={() => setSelectedJob(job)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground leading-snug line-clamp-2">
                          {job.title}
                        </h3>
                        <p className="text-sm font-semibold text-primary mt-0.5">{job.department}</p>
                      </div>
                      <span
                        className={`text-[0.6875rem] font-semibold uppercase tracking-wide px-2.5 py-0.5 rounded-full shrink-0 ml-2 ${getTypeBadgeClasses(job.employmentType)}`}
                      >
                        {job.employmentType}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-0.5 mb-2">
                      <div className="flex items-center gap-1.5">
                        <MapPinIcon className="w-3.5 h-3.5 shrink-0" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
                        Posted {formatDate(job.postedDate)}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
                      {job.description}
                    </p>
                    <div className="border-t border-border mt-3 pt-3 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium">
                        {job.closingDate
                          ? `Closes ${formatDate(job.closingDate)}`
                          : `Posted ${formatDate(job.postedDate)}`}
                      </span>
                      <span className="text-sm font-semibold text-primary uppercase tracking-wide cursor-pointer hover:text-primary/80 transition-colors">
                        View Details
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ===== SECTION 2: MY APPLICATIONS ===== */}
          <section>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5 text-primary" />
                My Applications
                <span className="bg-sky-100 text-primary text-xs font-bold px-2.5 py-0.5 rounded-full dark:bg-sky-900/40 dark:text-sky-400">
                  {applications.length}
                </span>
              </h2>
              <Link
                href="/candidate/applications"
                className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
              >
                View all
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>

            {applications.length === 0 ? (
              <div className="enterprise-card p-8 text-center">
                <DocumentTextIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <h3 className="font-semibold text-foreground mb-1">No applications yet</h3>
                <p className="text-sm text-muted-foreground">
                  Browse the job board above and apply to positions that interest you.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div key={app.id} className="enterprise-card p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
                      <div>
                        <h3 className="font-bold text-foreground">{app.jobTitle}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {app.department} &middot; Applied {formatDate(app.appliedDate)}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${getStatusBadgeClasses(app.status)}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {app.statusDisplayName}
                      </span>
                    </div>

                    {/* Timeline */}
                    <div className="flex items-center">
                      {app.stages.map((stage, idx) => (
                        <div key={stage} className="contents">
                          <TimelineStep
                            label={stage}
                            isCompleted={idx < app.currentStage}
                            isActive={idx === app.currentStage}
                          />
                          {idx < app.stages.length - 1 && (
                            <TimelineConnector isCompleted={idx < app.currentStage} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ===== SECTION 3: MY PROFILE ===== */}
          <section>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <UserCircleIcon className="w-5 h-5 text-primary" />
                My Profile
              </h2>
              <Link
                href="/candidate/profile"
                className="inline-flex items-center gap-1.5 px-4 py-2 border-2 border-amber-400 text-primary rounded-full text-sm font-semibold uppercase tracking-wider hover:bg-amber-400 hover:text-foreground transition-colors"
              >
                <PencilSquareIcon className="w-3.5 h-3.5" />
                Edit Profile
              </Link>
            </div>

            <div className="enterprise-card overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b-2 border-border bg-muted/30 overflow-x-auto">
                {profileTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setProfileTab(tab.id)}
                    className={`px-6 py-3.5 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 -mb-[2px] ${
                      profileTab === tab.id
                        ? 'text-primary border-primary'
                        : 'text-muted-foreground border-transparent hover:text-foreground'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {/* Personal Info Tab */}
                {profileTab === 'personal' && profile && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {[
                      { label: 'Full Name', value: profile.fullName },
                      { label: 'Email Address', value: profile.email },
                      { label: 'Phone Number', value: profile.phone || '--' },
                      { label: 'Location', value: profile.location || '--' },
                      { label: 'ID Number', value: profile.idNumber ? `${profile.idNumber.substring(0, 6)} **** ** *` : '--' },
                      { label: 'Date of Birth', value: profile.dateOfBirth ? formatDate(profile.dateOfBirth) : '--' },
                    ].map((field) => (
                      <div key={field.label} className="flex flex-col gap-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {field.label}
                        </span>
                        <span className="text-[0.9375rem] font-medium text-foreground">
                          {field.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Experience Tab */}
                {profileTab === 'experience' && (
                  <div className="space-y-3">
                    {experiences.map((exp) => (
                      <div key={exp.id} className="bg-muted/40 rounded-lg p-4">
                        <h4 className="font-bold text-[0.9375rem] text-foreground">{exp.title}</h4>
                        <p className="text-sm font-semibold text-primary mt-0.5">{exp.company}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {exp.period} | {exp.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Education Tab */}
                {profileTab === 'education' && (
                  <div className="space-y-3">
                    {educationEntries.map((edu) => (
                      <div key={edu.id} className="bg-muted/40 rounded-lg p-4">
                        <h4 className="font-bold text-[0.9375rem] text-foreground">{edu.title}</h4>
                        <p className="text-sm font-semibold text-primary mt-0.5">{edu.institution}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {edu.period} | {edu.details}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Documents Tab */}
                {profileTab === 'documents' && (
                  <div className="space-y-3">
                    {documents.length === 0 ? (
                      <div className="text-center py-6">
                        <DocumentTextIcon className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                        <p className="text-sm text-muted-foreground">
                          No documents uploaded yet.
                        </p>
                      </div>
                    ) : (
                      documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="bg-muted/40 rounded-lg p-4 flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-sky-100 text-primary flex items-center justify-center shrink-0 dark:bg-sky-900/40 dark:text-sky-400">
                              <DocumentTextIcon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">
                                {doc.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Uploaded {formatDate(doc.uploadedAt)}
                                {doc.size > 0 ? ` | ${formatFileSize(doc.size)}` : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button
                              className="w-8 h-8 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                              title="View"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                    <div className="mt-4 text-center">
                      <button className="inline-flex items-center gap-1.5 px-4 py-2 border-2 border-amber-400 text-primary rounded-full text-sm font-semibold uppercase tracking-wider hover:bg-amber-400 hover:text-foreground transition-colors">
                        <ArrowUpTrayIcon className="w-3.5 h-3.5" />
                        Upload Document
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ===== JOB DETAIL MODAL ===== */}
      {selectedJob && (
        <div
          className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={() => setSelectedJob(null)}
        >
          <div
            className="bg-card rounded-2xl shadow-xl w-full max-w-[680px] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 pb-0">
              <h2 className="text-xl font-bold text-foreground">{selectedJob.title}</h2>
              <button
                onClick={() => setSelectedJob(null)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BriefcaseIcon className="w-4 h-4 text-primary" />
                  {selectedJob.department}
                </span>
                <span className="flex items-center gap-1">
                  <MapPinIcon className="w-4 h-4 text-primary" />
                  {selectedJob.location}
                </span>
                <span className="flex items-center gap-1">
                  <ClockIcon className="w-4 h-4 text-primary" />
                  {selectedJob.employmentType}
                </span>
                <span className="flex items-center gap-1">
                  <CalendarIcon className="w-4 h-4 text-primary" />
                  Posted {formatDate(selectedJob.postedDate)}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-[0.9375rem] text-foreground mb-2">
                  Job Description
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedJob.description}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-6 pt-4 border-t border-border">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-5 py-2.5 border-2 border-border text-muted-foreground rounded-full text-sm font-semibold uppercase tracking-wider hover:border-primary hover:text-primary transition-colors"
              >
                Close
              </button>
              <Link
                href={`/apply/${selectedJob.id}`}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-amber-400 border-2 border-amber-400 text-foreground rounded-full text-sm font-semibold uppercase tracking-wider hover:bg-amber-500 hover:border-amber-500 transition-colors"
              >
                <DocumentTextIcon className="w-4 h-4" />
                Apply Now
              </Link>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
