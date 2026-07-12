'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import PageWrapper from '@/components/PageWrapper';
import ApplicationStatusTracker from '@/components/ApplicationStatusTracker';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import { TableSkeleton } from '@/components/LoadingComponents';
import { apiFetch } from '@/lib/api-fetch';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ArrowPathIcon,
  UserIcon,
  StarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import AiCandidatePanel from '@/components/ai/AiCandidatePanel';
import AiAssistPanel from '@/components/ai/AiAssistPanel';
import AiSmartSearch from '@/components/ai/AiSmartSearch';

interface Application {
  id: number;
  jobTitle: string;
  department: string;
  status: string;
  statusDisplayName: string;
  statusCssClass: string;
  submittedAt: string;
  updatedAt?: string;
  withdrawnAt?: string;
  withdrawalReason?: string;
  rating?: number;
  canBeWithdrawn: boolean;
  daysFromSubmission: number;
  applicantName: string;
  applicantEmail: string;
  applicationSource?: string;
  coverLetter?: string;
  screeningNotes?: string;
  interviewFeedback?: string;
}

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'SCREENING', label: 'Screening' },
  { value: 'INTERVIEW_SCHEDULED', label: 'Interview Scheduled' },
  { value: 'INTERVIEW_COMPLETED', label: 'Interview Completed' },
  { value: 'REFERENCE_CHECK', label: 'Reference Check' },
  { value: 'OFFER_PENDING', label: 'Offer Pending' },
  { value: 'OFFERED', label: 'Offered' },
  { value: 'OFFER_ACCEPTED', label: 'Offer Accepted' },
  { value: 'HIRED', label: 'Hired' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'WITHDRAWN', label: 'Withdrawn' },
];

const DEPARTMENT_OPTIONS = [
  'Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Legal', 'Product',
];

// Pipeline stage definitions matching the mock
const PIPELINE_STAGES = [
  { key: 'SUBMITTED', label: 'Applied', colorClass: 'bg-surface-navy text-primary' },
  { key: 'SCREENING', label: 'Screening', colorClass: 'bg-surface-gold text-accent-gold' },
  { key: 'INTERVIEW_SCHEDULED', label: 'Interview', colorClass: 'bg-surface-teal text-accent-teal' },
  { key: 'OFFERED', label: 'Offer', colorClass: 'bg-violet-100 text-violet-700' },
  { key: 'HIRED', label: 'Hired', colorClass: 'bg-success-bg text-success' },
];

// TODO: Consolidate with backend-provided statusCssClass from ApplicationResponse
function getStatusColor(status: string): string {
  switch (status) {
    case 'SUBMITTED': return 'bg-icon-bg-navy text-primary';
    case 'SCREENING': return 'bg-icon-bg-gold text-accent-gold';
    case 'INTERVIEW_SCHEDULED': return 'bg-icon-bg-teal text-accent-teal';
    case 'INTERVIEW_COMPLETED': return 'bg-icon-bg-teal text-accent-teal';
    case 'REFERENCE_CHECK': return 'bg-warning-bg text-warning';
    case 'OFFER_PENDING': return 'bg-warning-bg text-warning';
    case 'OFFERED': return 'bg-violet-100 text-violet-700';
    case 'OFFER_ACCEPTED': return 'bg-success-bg text-success';
    case 'HIRED': return 'bg-success-bg text-success';
    case 'REJECTED': return 'bg-error-bg text-error';
    case 'WITHDRAWN': return 'bg-muted/50 text-muted-foreground';
    case 'OFFER_DECLINED': return 'bg-warning-bg text-warning';
    default: return 'bg-muted/50 text-muted-foreground';
  }
}

function getStatusDotColor(status: string): string {
  switch (status) {
    case 'SUBMITTED': return 'bg-primary';
    case 'SCREENING': return 'bg-accent-gold';
    case 'INTERVIEW_SCHEDULED':
    case 'INTERVIEW_COMPLETED': return 'bg-accent-teal';
    case 'REFERENCE_CHECK':
    case 'OFFER_PENDING': return 'bg-warning';
    case 'OFFERED': return 'bg-violet-600';
    case 'OFFER_ACCEPTED':
    case 'HIRED': return 'bg-success';
    case 'REJECTED': return 'bg-error';
    default: return 'bg-muted-foreground';
  }
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function renderStars(rating: number) {
  return Array.from({ length: 5 }, (_, i) => (
    <StarIcon
      key={i}
      className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/40'}`}
    />
  ));
}

function getScoreBadge(rating: number | undefined) {
  if (!rating) return null;
  const score = rating * 20; // Convert 1-5 to 0-100 scale
  let colorClass = 'bg-error-bg text-error';
  let barColor = 'bg-error';
  if (score >= 80) {
    colorClass = 'bg-success-bg text-success';
    barColor = 'bg-success';
  } else if (score >= 60) {
    colorClass = 'bg-warning-bg text-warning';
    barColor = 'bg-warning';
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${colorClass}`}>
      {score}%
      <span className="w-10 h-1 rounded-full bg-border overflow-hidden">
        <span className={`block h-full rounded-full ${barColor}`} style={{ width: `${score}%` }} />
      </span>
    </span>
  );
}

const PAGE_SIZE = 20;

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'submittedAt' | 'status' | 'rating'>('submittedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [aiSearchMode, setAiSearchMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [expandedDetailSections, setExpandedDetailSections] = useState<Record<string, boolean>>({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'overview' | 'screening' | 'feedback'>('overview');
  const [activePipelineStage, setActivePipelineStage] = useState<string | null>(null);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const toggleDetailSection = (section: string) => {
    setExpandedDetailSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const loadApplications = useCallback(async (page: number, search: string, status: string, sort: string, direction: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('size', String(PAGE_SIZE));
      params.append('sort', sort);
      params.append('direction', direction);
      if (search) params.append('search', search);
      if (status !== 'ALL') params.append('status', status);

      const response = await apiFetch(`/api/applications?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.content) {
          setApplications(data.content);
          setTotalPages(data.totalPages ?? 0);
          setTotalElements(data.totalElements ?? 0);
        } else {
          const list = Array.isArray(data) ? data : [];
          setApplications(list);
          setTotalPages(1);
          setTotalElements(list.length);
        }
      } else {
        setError('Failed to load applications. Please try again.');
        setApplications([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch {
      setError('Failed to load applications. Please check your connection and try again.');
      setApplications([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApplications(currentPage, searchTerm, statusFilter, sortBy, sortDir);
  }, [currentPage, statusFilter, sortBy, sortDir, loadApplications]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setCurrentPage(0);
      loadApplications(0, value, statusFilter, sortBy, sortDir);
    }, 400);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setActivePipelineStage(null);
    setCurrentPage(0);
  };

  const handleDepartmentFilterChange = (value: string) => {
    setDepartmentFilter(value);
  };

  const handleSortChange = (value: string) => {
    const [field, dir] = value.split('-');
    setSortBy(field as typeof sortBy);
    setSortDir(dir as typeof sortDir);
    setCurrentPage(0);
  };

  const handlePipelineStageClick = (stageKey: string) => {
    if (activePipelineStage === stageKey) {
      setActivePipelineStage(null);
      setStatusFilter('ALL');
    } else {
      setActivePipelineStage(stageKey);
      setStatusFilter(stageKey);
    }
    setCurrentPage(0);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setDepartmentFilter('ALL');
    setActivePipelineStage(null);
    setCurrentPage(0);
    loadApplications(0, '', 'ALL', sortBy, sortDir);
  };

  const filteredByDepartment = departmentFilter === 'ALL'
    ? applications
    : applications.filter(app => app.department === departmentFilter);

  // Compute pipeline counts from current application data
  const pipelineCounts = applications.reduce<Record<string, number>>((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {});

  const handleWithdraw = async (applicationId: number, reason: string) => {
    try {
      const response = await apiFetch(`/api/applications/${applicationId}/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (response.ok) {
        loadApplications(currentPage, searchTerm, statusFilter, sortBy, sortDir);
        setSelectedApplication(null);
      }
    } catch (error) {
      console.error('Error withdrawing application:', error);
    }
  };

  const actions = (
    <div className="flex items-center gap-3">
      <button
        onClick={() => loadApplications(currentPage, searchTerm, statusFilter, sortBy, sortDir)}
        className="inline-flex items-center px-3 py-2 border border-border text-sm font-medium rounded-full text-foreground hover:bg-accent"
        aria-label="Refresh applications list"
      >
        <ArrowPathIcon className="w-4 h-4 mr-1.5" />
        Refresh
      </button>
      <Link
        href="/applications/manage"
        className="inline-flex items-center px-4 py-2 border-2 border-gold-500 text-sm font-medium rounded-full bg-transparent text-gold-500 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider"
      >
        Advanced Management
      </Link>
    </div>
  );

  if (loading && applications.length === 0 && !error) {
    return (
      <PageWrapper title="Applications" subtitle="Loading applications..." actions={actions}>
        <div className="enterprise-card overflow-hidden">
          <TableSkeleton rows={8} columns={7} />
        </div>
      </PageWrapper>
    );
  }

  if (error && applications.length === 0) {
    return (
      <PageWrapper title="Applications" subtitle="Browse and track all job applications" actions={actions}>
        <ErrorState
          title="Unable to load applications"
          message={error}
          onRetry={() => loadApplications(currentPage, searchTerm, statusFilter, sortBy, sortDir)}
          retryLabel="Retry Loading"
        />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Application Management"
      subtitle="Review, screen and manage candidate applications"
      actions={actions}
    >
      <div className="space-y-6">
        {/* ===== Stats Bar ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="enterprise-card p-5 flex items-center gap-4 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-icon-bg-navy flex items-center justify-center shrink-0">
              <DocumentTextIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-foreground leading-none">{totalElements}</h3>
              <p className="text-[0.8125rem] text-muted-foreground mt-1">Total Applications</p>
            </div>
          </div>
          <div className="enterprise-card p-5 flex items-center gap-4 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-icon-bg-teal flex items-center justify-center shrink-0">
              <ClockIcon className="w-6 h-6 text-accent-teal" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-foreground leading-none">
                {applications.filter(a => a.daysFromSubmission <= 1).length}
              </h3>
              <p className="text-[0.8125rem] text-muted-foreground mt-1">New Today</p>
            </div>
          </div>
          <div className="enterprise-card p-5 flex items-center gap-4 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-icon-bg-gold flex items-center justify-center shrink-0">
              <StarIcon className="w-6 h-6 text-accent-gold" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-foreground leading-none">
                {applications.length > 0
                  ? Math.round(
                      (applications.reduce((sum, a) => sum + (a.rating || 0), 0) /
                        applications.filter(a => a.rating).length) * 20 || 0
                    )
                  : 0}
              </h3>
              <p className="text-[0.8125rem] text-muted-foreground mt-1">Avg Score</p>
            </div>
          </div>
          <div className="enterprise-card p-5 flex items-center gap-4 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-icon-bg-pink flex items-center justify-center shrink-0">
              <CheckCircleIcon className="w-6 h-6 text-accent-pink" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-foreground leading-none">
                {applications.filter(a => a.status === 'SCREENING' || a.status === 'INTERVIEW_SCHEDULED').length}
              </h3>
              <p className="text-[0.8125rem] text-muted-foreground mt-1">Shortlisted</p>
            </div>
          </div>
        </div>

        {/* ===== Search & Filter Bar ===== */}
        <div className="enterprise-card p-4">
          {/* Top row: search + filter toggle + clear */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-[400px]">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search applicants, positions..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                aria-label="Search applications by name, job title, department, or email"
                className="pl-9 pr-4 py-2 w-full border border-border rounded-control text-[0.8125rem] text-foreground bg-card placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/40 transition-colors"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-control border text-[0.8125rem] font-semibold transition-colors ${
                showAdvancedFilters
                  ? 'border-primary text-primary bg-surface-navy'
                  : 'border-border text-muted-foreground hover:border-primary hover:text-primary hover:bg-surface-navy'
              }`}
            >
              <FunnelIcon className="w-4 h-4" />
              Filters
              <ChevronDownIcon className={`w-4 h-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-full border border-border bg-card text-[0.8125rem] font-semibold text-foreground hover:bg-surface-navy hover:border-primary hover:text-primary transition-colors"
            >
              <XCircleIcon className="w-3.5 h-3.5" />
              Clear
            </button>
            <button
              type="button"
              onClick={() => setAiSearchMode(!aiSearchMode)}
              className={`ml-auto inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-control border transition-colors whitespace-nowrap ${
                aiSearchMode
                  ? 'bg-teal-50 border-teal-300 text-teal-700'
                  : 'border-border text-muted-foreground hover:bg-accent'
              }`}
            >
              AI Search
            </button>
          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.75rem] font-semibold text-muted-foreground uppercase tracking-wider">
                    Department
                  </label>
                  <select
                    value={departmentFilter}
                    onChange={(e) => handleDepartmentFilterChange(e.target.value)}
                    aria-label="Filter by department"
                    className="py-2 px-3 border border-border rounded-control text-[0.8125rem] text-foreground bg-card focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
                  >
                    <option value="ALL">All Departments</option>
                    {DEPARTMENT_OPTIONS.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.75rem] font-semibold text-muted-foreground uppercase tracking-wider">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => handleStatusFilterChange(e.target.value)}
                    aria-label="Filter by application status"
                    className="py-2 px-3 border border-border rounded-control text-[0.8125rem] text-foreground bg-card focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.75rem] font-semibold text-muted-foreground uppercase tracking-wider">
                    Sort By
                  </label>
                  <select
                    value={`${sortBy}-${sortDir}`}
                    onChange={(e) => handleSortChange(e.target.value)}
                    aria-label="Sort applications"
                    className="py-2 px-3 border border-border rounded-control text-[0.8125rem] text-foreground bg-card focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
                  >
                    <option value="submittedAt-desc">Newest first</option>
                    <option value="submittedAt-asc">Oldest first</option>
                    <option value="rating-desc">Highest rated</option>
                    <option value="rating-asc">Lowest rated</option>
                    <option value="status-asc">Status A-Z</option>
                    <option value="status-desc">Status Z-A</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.75rem] font-semibold text-muted-foreground uppercase tracking-wider">
                    Date From
                  </label>
                  <input
                    type="date"
                    className="py-2 px-3 border border-border rounded-control text-[0.8125rem] text-foreground bg-card focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
                    aria-label="Filter from date"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-4 py-1.5 text-xs font-semibold text-muted-foreground hover:text-primary hover:bg-surface-navy rounded-full transition-colors"
                >
                  Reset Filters
                </button>
                <button
                  type="button"
                  onClick={() => loadApplications(0, searchTerm, statusFilter, sortBy, sortDir)}
                  className="px-4 py-1.5 text-xs font-semibold border border-border rounded-full text-foreground bg-card hover:bg-surface-navy hover:border-primary hover:text-primary transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ===== AI Smart Search Panel ===== */}
        {aiSearchMode && (
          <AiAssistPanel title="AI Smart Search" feature="AI_SEARCH" defaultExpanded description="Search candidates using natural language queries instead of manual filters">
            <AiSmartSearch />
          </AiAssistPanel>
        )}

        {/* ===== Status Pipeline Bar ===== */}
        <div className="enterprise-card p-4">
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.06em] text-muted-foreground mb-3">
            Application Pipeline
          </p>
          <div className="flex gap-1 flex-wrap lg:flex-nowrap">
            {PIPELINE_STAGES.map((stage, idx) => (
              <button
                key={stage.key}
                type="button"
                onClick={() => handlePipelineStageClick(stage.key)}
                className={`relative flex-1 min-w-[calc(50%-4px)] lg:min-w-0 flex items-center justify-center gap-2 px-3 py-2.5 rounded-control text-[0.75rem] font-semibold transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-sm ${
                  stage.colorClass
                } ${activePipelineStage === stage.key ? 'shadow-md -translate-y-0.5 ring-1 ring-current/20' : ''}`}
                aria-label={`Filter by ${stage.label} status`}
              >
                <span>{stage.label}</span>
                <span className="font-extrabold text-[0.8125rem]">
                  {pipelineCounts[stage.key] || 0}
                </span>
                {idx < PIPELINE_STAGES.length - 1 && (
                  <ChevronRightIcon className="absolute -right-2 w-4 h-4 opacity-40 hidden lg:block z-[1]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ===== Applications Table Card ===== */}
        <div className="enterprise-card overflow-hidden">
          {/* Table Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-base font-bold text-foreground">Applications</h2>
            <span className="text-[0.8125rem] text-muted-foreground font-medium">
              {totalElements} application{totalElements !== 1 ? 's' : ''}
              {loading && <span className="ml-2 text-muted-foreground/60">(loading...)</span>}
            </span>
          </div>

          {filteredByDepartment.length === 0 ? (
            <EmptyState
              icon={FunnelIcon}
              title="No applications"
              description="No applications match your filters. Try adjusting your search or filter criteria."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-4 py-3 text-left text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-[0.06em] whitespace-nowrap cursor-pointer hover:text-primary transition-colors select-none">
                      Applicant Name
                    </th>
                    <th className="px-4 py-3 text-left text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-[0.06em] whitespace-nowrap cursor-pointer hover:text-primary transition-colors select-none">
                      Position
                    </th>
                    <th className="px-4 py-3 text-left text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-[0.06em] whitespace-nowrap cursor-pointer hover:text-primary transition-colors select-none">
                      Date Applied
                    </th>
                    <th className="px-4 py-3 text-left text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-[0.06em] whitespace-nowrap cursor-pointer hover:text-primary transition-colors select-none">
                      Score
                    </th>
                    <th className="px-4 py-3 text-left text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-[0.06em] whitespace-nowrap cursor-pointer hover:text-primary transition-colors select-none">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-[0.06em] whitespace-nowrap select-none">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredByDepartment.map((app) => {
                    const name = app.applicantName || 'Unknown';
                    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                    return (
                      <tr key={app.id} className="border-b border-border last:border-b-0 hover:bg-surface-navy transition-colors">
                        {/* Applicant Cell */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
                              <span className="text-[0.6875rem] font-bold text-primary-foreground tracking-wide">{initials}</span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">{name}</p>
                              <p className="text-xs text-muted-foreground">{app.applicantEmail || ''}</p>
                            </div>
                          </div>
                        </td>
                        {/* Position */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <p className="text-sm text-foreground">{app.jobTitle}</p>
                          <p className="text-xs text-muted-foreground">{app.department}</p>
                        </td>
                        {/* Date Applied */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <p className="text-sm text-foreground">{formatDate(app.submittedAt)}</p>
                          <p className="text-xs text-muted-foreground">{app.daysFromSubmission}d ago</p>
                        </td>
                        {/* Score */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {app.rating ? (
                            getScoreBadge(app.rating)
                          ) : (
                            <span className="text-xs text-muted-foreground/60">Not rated</span>
                          )}
                        </td>
                        {/* Status */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.6875rem] font-semibold uppercase tracking-wider ${getStatusColor(app.status)}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(app.status)}`} />
                            {app.statusDisplayName}
                          </span>
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-3.5 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => {
                                setSelectedApplication(app);
                                setActiveModalTab('overview');
                              }}
                              className="w-8 h-8 rounded-control flex items-center justify-center text-muted-foreground hover:bg-surface-navy hover:text-primary transition-colors"
                              aria-label={`View application from ${app.applicantName || 'applicant'}`}
                              title="View Details"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-border text-[0.8125rem] text-muted-foreground">
              <span>
                Showing {currentPage * PAGE_SIZE + 1}-{Math.min((currentPage + 1) * PAGE_SIZE, totalElements)} of {totalElements} results
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="w-8 h-8 rounded-control border border-border bg-card flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary hover:bg-surface-navy disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Go to previous page"
                  title="Previous"
                >
                  <ChevronLeftIcon className="w-3.5 h-3.5" />
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 7) {
                    pageNum = i;
                  } else if (currentPage < 4) {
                    pageNum = i;
                  } else if (currentPage > totalPages - 4) {
                    pageNum = totalPages - 7 + i;
                  } else {
                    pageNum = currentPage - 3 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      aria-label={`Go to page ${pageNum + 1}`}
                      aria-current={currentPage === pageNum ? 'page' : undefined}
                      className={`w-8 h-8 rounded-control border text-[0.8125rem] font-semibold transition-colors ${
                        currentPage === pageNum
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border bg-card text-muted-foreground hover:border-primary hover:text-primary hover:bg-surface-navy'
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="w-8 h-8 rounded-control border border-border bg-card flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary hover:bg-surface-navy disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Go to next page"
                  title="Next"
                >
                  <ChevronRightIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ===== Application Detail Modal ===== */}
        {selectedApplication && (() => {
          const name = selectedApplication.applicantName || 'Unknown';
          const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
              {/* Overlay with blur */}
              <div
                className="fixed inset-0 bg-foreground/50 backdrop-blur-sm"
                onClick={() => setSelectedApplication(null)}
                aria-hidden="true"
              />
              {/* Modal */}
              <div
                className="relative bg-card rounded-2xl shadow-xl max-w-[760px] w-full max-h-[90vh] flex flex-col"
                role="dialog"
                aria-modal="true"
                aria-label="Application details"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 pt-6">
                  <h2 className="text-xl font-bold text-foreground">Application Details</h2>
                  <button
                    onClick={() => setSelectedApplication(null)}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-surface-navy hover:text-foreground transition-colors"
                    aria-label="Close application details"
                  >
                    <XCircleIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Tabs */}
                <div className="flex border-b-2 border-border mx-6 mt-4 gap-0">
                  {([
                    { key: 'overview' as const, label: 'Overview' },
                    { key: 'screening' as const, label: 'Screening Notes' },
                    { key: 'feedback' as const, label: 'Feedback' },
                  ]).map(tab => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveModalTab(tab.key)}
                      className={`px-5 py-2.5 text-[0.8125rem] font-semibold border-b-2 -mb-[2px] transition-colors ${
                        activeModalTab === tab.key
                          ? 'text-primary border-primary'
                          : 'text-muted-foreground border-transparent hover:text-primary'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Scrollable Body */}
                <div className="p-6 overflow-y-auto flex-1">
                  {/* Overview Tab */}
                  {activeModalTab === 'overview' && (
                    <div className="space-y-5">
                      {/* Applicant Header */}
                      <div className="flex items-center gap-4 pb-5 border-b border-border">
                        <div className="w-14 h-14 rounded-full bg-cta/15 flex items-center justify-center shrink-0">
                          <span className="text-base font-bold text-cta">{initials}</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-foreground">{name}</h3>
                          <p className="text-[0.8125rem] text-muted-foreground mt-0.5">
                            {selectedApplication.jobTitle}
                            {selectedApplication.department && ` - ${selectedApplication.department}`}
                          </p>
                          <span className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-[0.6875rem] font-semibold uppercase tracking-wider ${getStatusColor(selectedApplication.status)}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(selectedApplication.status)}`} />
                            {selectedApplication.statusDisplayName}
                          </span>
                        </div>
                      </div>

                      {/* Status Tracker */}
                      <ApplicationStatusTracker
                        application={selectedApplication}
                        onWithdraw={handleWithdraw}
                        showWithdrawOption={selectedApplication.canBeWithdrawn}
                      />

                      {/* Metadata Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[0.6875rem] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Email</span>
                          <span className="text-sm font-semibold text-foreground truncate">{selectedApplication.applicantEmail}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[0.6875rem] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Source</span>
                          <span className="text-sm font-semibold text-foreground">{selectedApplication.applicationSource || 'Unknown'}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[0.6875rem] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Submitted</span>
                          <span className="text-sm font-semibold text-foreground">{formatDate(selectedApplication.submittedAt)}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[0.6875rem] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Days in Pipeline</span>
                          <span className="text-sm font-semibold text-foreground">{selectedApplication.daysFromSubmission} days</span>
                        </div>
                        {selectedApplication.rating && (
                          <div className="flex flex-col gap-1">
                            <span className="text-[0.6875rem] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Rating</span>
                            <div className="flex items-center gap-0.5">{renderStars(selectedApplication.rating)}</div>
                          </div>
                        )}
                      </div>

                      {/* Expandable Sections */}
                      {[
                        { key: 'coverLetter', label: 'Cover Letter', icon: DocumentTextIcon, content: selectedApplication.coverLetter },
                      ].filter(section => section.content).map(section => (
                        <div key={section.key} className="border border-border rounded-card overflow-hidden">
                          <button
                            onClick={() => toggleDetailSection(section.key)}
                            className="flex items-center justify-between w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors"
                            aria-expanded={expandedDetailSections[section.key] ?? false}
                          >
                            <div className="flex items-center gap-2">
                              <section.icon className="w-4 h-4 text-muted-foreground" />
                              <span className="text-xs font-semibold text-foreground uppercase tracking-[0.05em]">{section.label}</span>
                            </div>
                            {expandedDetailSections[section.key] ? (
                              <ChevronUpIcon className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronDownIcon className="w-4 h-4 text-muted-foreground" />
                            )}
                          </button>
                          {expandedDetailSections[section.key] && (
                            <div className="px-4 pb-4">
                              <div className="p-3 bg-muted/30 rounded-control">
                                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{section.content}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* AI Candidate Assist */}
                      <AiCandidatePanel
                        applicationId={String(selectedApplication.id)}
                        candidateName={selectedApplication.applicantName}
                        jobTitle={selectedApplication.jobTitle}
                      />
                    </div>
                  )}

                  {/* Screening Notes Tab */}
                  {activeModalTab === 'screening' && (
                    <div className="space-y-4">
                      {selectedApplication.screeningNotes ? (
                        <div className="p-4 bg-muted/30 rounded-control border border-border">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                              <span className="text-[0.625rem] font-bold text-primary-foreground">HR</span>
                            </div>
                            <span className="text-[0.8125rem] font-semibold text-foreground">Screening Notes</span>
                          </div>
                          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{selectedApplication.screeningNotes}</p>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                          No screening notes available for this application.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Feedback Tab */}
                  {activeModalTab === 'feedback' && (
                    <div className="space-y-4">
                      {selectedApplication.interviewFeedback ? (
                        <div className="p-4 bg-muted/30 rounded-control border border-border">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-accent-teal flex items-center justify-center">
                                <span className="text-[0.625rem] font-bold text-white">IF</span>
                              </div>
                              <span className="text-[0.8125rem] font-semibold text-foreground">Interview Feedback</span>
                            </div>
                            {selectedApplication.rating && (
                              <div className="flex gap-0.5">
                                {renderStars(selectedApplication.rating)}
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{selectedApplication.interviewFeedback}</p>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                          No feedback available for this application.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-border shrink-0 flex justify-end gap-3">
                  <button
                    onClick={() => setSelectedApplication(null)}
                    className="px-5 py-2.5 text-[0.8125rem] font-semibold text-muted-foreground hover:text-primary hover:bg-surface-navy rounded-full transition-colors"
                  >
                    Close
                  </button>
                  <button
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-[0.8125rem] font-semibold border border-border rounded-full text-foreground bg-card hover:bg-surface-navy hover:border-primary hover:text-primary transition-colors"
                  >
                    <ChevronRightIcon className="w-3.5 h-3.5" />
                    Advance Stage
                  </button>
                  <button
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-cta text-foreground text-[0.8125rem] font-semibold uppercase tracking-wider rounded-full shadow-sm hover:bg-cta-hover hover:shadow-md hover:-translate-y-px transition-all"
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                    Shortlist
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </PageWrapper>
  );
}
