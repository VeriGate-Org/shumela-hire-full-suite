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

// TODO: Consolidate with backend-provided statusCssClass from ApplicationResponse
function getStatusColor(status: string): string {
  switch (status) {
    case 'SUBMITTED': return 'bg-slate-100 text-slate-700 border-slate-300';
    case 'SCREENING': return 'bg-violet-100 text-violet-700 border-violet-300';
    case 'INTERVIEW_SCHEDULED': return 'bg-purple-100 text-purple-700 border-purple-300';
    case 'INTERVIEW_COMPLETED': return 'bg-indigo-100 text-indigo-700 border-indigo-300';
    case 'REFERENCE_CHECK': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    case 'OFFER_PENDING': return 'bg-amber-100 text-amber-700 border-amber-300';
    case 'OFFERED': return 'bg-emerald-100 text-emerald-700 border-emerald-300';
    case 'OFFER_ACCEPTED': return 'bg-green-100 text-green-700 border-green-300';
    case 'HIRED': return 'bg-green-200 text-green-800 border-green-400';
    case 'REJECTED': return 'bg-red-100 text-red-700 border-red-300';
    case 'WITHDRAWN': return 'bg-muted/50 text-muted-foreground border-border';
    case 'OFFER_DECLINED': return 'bg-orange-100 text-orange-700 border-orange-300';
    default: return 'bg-muted/50 text-muted-foreground border-border';
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

  const filteredByDepartment = departmentFilter === 'ALL'
    ? applications
    : applications.filter(app => app.department === departmentFilter);

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
      title="Applications"
      subtitle="Browse and track all job applications"
      actions={actions}
    >
      <div className="space-y-6">
        {/* AI Smart Search */}
        {aiSearchMode && (
          <AiAssistPanel title="AI Smart Search" feature="AI_SEARCH" defaultExpanded description="Search candidates using natural language queries instead of manual filters">
            <AiSmartSearch />
          </AiAssistPanel>
        )}

        {/* Search and Filters */}
        <div className="enterprise-card p-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by name, job title, department, or email..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    aria-label="Search applications by name, job title, department, or email"
                    className="pl-10 pr-4 py-2 w-full border border-border rounded-sm focus:ring-2 focus:ring-ring/40 focus:border-ring"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setAiSearchMode(!aiSearchMode)}
                  className={`px-3 py-2 text-xs font-medium rounded-sm border transition-colors whitespace-nowrap ${
                    aiSearchMode
                      ? 'bg-teal-50 border-teal-300 text-teal-700'
                      : 'border-border text-muted-foreground hover:bg-accent'
                  }`}
                >
                  AI Search
                </button>
              </div>
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                aria-label="Filter by application status"
                className="w-full py-2 px-3 border border-border rounded-sm focus:ring-2 focus:ring-ring/40 focus:border-ring"
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={departmentFilter}
                onChange={(e) => handleDepartmentFilterChange(e.target.value)}
                aria-label="Filter by department"
                className="w-full py-2 px-3 border border-border rounded-sm focus:ring-2 focus:ring-ring/40 focus:border-ring"
              >
                <option value="ALL">All Departments</option>
                {DEPARTMENT_OPTIONS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              {totalElements} application{totalElements !== 1 ? 's' : ''}
              {loading && <span className="ml-2 text-muted-foreground/60">(loading...)</span>}
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Sort by:</span>
              <select
                value={`${sortBy}-${sortDir}`}
                onChange={(e) => handleSortChange(e.target.value)}
                aria-label="Sort applications"
                className="py-1 px-2 border border-border rounded-sm text-sm focus:ring-2 focus:ring-ring/40 focus:border-ring"
              >
                <option value="submittedAt-desc">Newest first</option>
                <option value="submittedAt-asc">Oldest first</option>
                <option value="rating-desc">Highest rated</option>
                <option value="rating-asc">Lowest rated</option>
                <option value="status-asc">Status A-Z</option>
                <option value="status-desc">Status Z-A</option>
              </select>
            </div>
          </div>
        </div>

        {/* Applications Table */}
        <div className="enterprise-card overflow-hidden">
          {filteredByDepartment.length === 0 ? (
            <EmptyState
              icon={FunnelIcon}
              title="No applications"
              description="No applications match your filters. Try adjusting your search or filter criteria."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Applicant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredByDepartment.map((app) => (
                    <tr key={app.id} className="hover:bg-accent transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-9 h-9 bg-gold-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <UserIcon className="w-5 h-5 text-gold-600" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-foreground">{app.applicantName || 'Name not available'}</p>
                            <p className="text-xs text-muted-foreground">{app.applicantEmail || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-foreground">{app.jobTitle}</p>
                        <p className="text-xs text-muted-foreground">{app.department}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(app.status)}`}>
                          {app.statusDisplayName}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {app.rating ? (
                          <div className="flex items-center">{renderStars(app.rating)}</div>
                        ) : (
                          <span className="text-xs text-muted-foreground/60">Not rated</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-foreground">{formatDate(app.submittedAt)}</p>
                        <p className="text-xs text-muted-foreground">{app.daysFromSubmission}d ago</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-muted-foreground">{app.applicationSource || '-'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => setSelectedApplication(app)}
                          className="text-primary hover:text-primary/80 text-sm font-medium"
                          aria-label={`View application from ${app.applicantName || 'applicant'}`}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-muted/50">
              <p className="text-sm text-muted-foreground">
                Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, totalElements)} of {totalElements}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="p-1.5 rounded-full text-muted-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Go to previous page"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
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
                      className={`w-8 h-8 rounded-full text-sm font-medium ${
                        currentPage === pageNum
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent'
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="p-1.5 rounded-full text-muted-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Go to next page"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Application Detail Modal */}
        {selectedApplication && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="enterprise-card shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" role="dialog" aria-label="Application details">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      {selectedApplication.applicantName || 'Name not available'}
                    </h2>
                    <p className="text-muted-foreground mt-1">
                      {selectedApplication.jobTitle} — {selectedApplication.department}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedApplication(null)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Close application details"
                  >
                    <XCircleIcon className="w-6 h-6" />
                  </button>
                </div>

                <ApplicationStatusTracker
                  application={selectedApplication}
                  onWithdraw={handleWithdraw}
                  showWithdrawOption={selectedApplication.canBeWithdrawn}
                />

                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Email</p>
                    <p className="text-sm text-foreground">{selectedApplication.applicantEmail}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Source</p>
                    <p className="text-sm text-foreground">{selectedApplication.applicationSource || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Submitted</p>
                    <p className="text-sm text-foreground">{formatDate(selectedApplication.submittedAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Days Since Submission</p>
                    <p className="text-sm text-foreground">{selectedApplication.daysFromSubmission} days</p>
                  </div>
                  {selectedApplication.rating && (
                    <div className="col-span-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Rating</p>
                      <div className="flex items-center gap-1">{renderStars(selectedApplication.rating)}</div>
                    </div>
                  )}
                </div>

                {/* Cover Letter Section */}
                {selectedApplication.coverLetter && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <button
                      onClick={() => toggleDetailSection('coverLetter')}
                      className="flex items-center justify-between w-full text-left"
                      aria-expanded={expandedDetailSections.coverLetter ?? false}
                    >
                      <div className="flex items-center gap-2">
                        <DocumentTextIcon className="w-5 h-5 text-muted-foreground" />
                        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Cover Letter</h3>
                      </div>
                      {expandedDetailSections.coverLetter ? (
                        <ChevronUpIcon className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDownIcon className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                    {expandedDetailSections.coverLetter && (
                      <div className="mt-3 p-4 bg-muted/50 rounded-md">
                        <p className="text-sm text-foreground whitespace-pre-wrap">{selectedApplication.coverLetter}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Screening Notes Section */}
                {selectedApplication.screeningNotes && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <button
                      onClick={() => toggleDetailSection('screeningNotes')}
                      className="flex items-center justify-between w-full text-left"
                      aria-expanded={expandedDetailSections.screeningNotes ?? false}
                    >
                      <div className="flex items-center gap-2">
                        <EyeIcon className="w-5 h-5 text-muted-foreground" />
                        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Screening Notes</h3>
                      </div>
                      {expandedDetailSections.screeningNotes ? (
                        <ChevronUpIcon className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDownIcon className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                    {expandedDetailSections.screeningNotes && (
                      <div className="mt-3 p-4 bg-muted/50 rounded-md">
                        <p className="text-sm text-foreground whitespace-pre-wrap">{selectedApplication.screeningNotes}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Interview Feedback Section */}
                {selectedApplication.interviewFeedback && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <button
                      onClick={() => toggleDetailSection('interviewFeedback')}
                      className="flex items-center justify-between w-full text-left"
                      aria-expanded={expandedDetailSections.interviewFeedback ?? false}
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircleIcon className="w-5 h-5 text-muted-foreground" />
                        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Interview Feedback</h3>
                      </div>
                      {expandedDetailSections.interviewFeedback ? (
                        <ChevronUpIcon className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDownIcon className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                    {expandedDetailSections.interviewFeedback && (
                      <div className="mt-3 p-4 bg-muted/50 rounded-md">
                        <p className="text-sm text-foreground whitespace-pre-wrap">{selectedApplication.interviewFeedback}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* AI Candidate Assist */}
                <div className="mt-6 pt-6 border-t border-border">
                  <AiCandidatePanel
                    applicationId={String(selectedApplication.id)}
                    candidateName={selectedApplication.applicantName}
                    jobTitle={selectedApplication.jobTitle}
                  />
                </div>

                <div className="flex justify-end mt-6 pt-6 border-t border-border">
                  <button
                    onClick={() => setSelectedApplication(null)}
                    className="px-4 py-2 bg-muted/50 text-foreground rounded-full hover:bg-accent text-sm font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
