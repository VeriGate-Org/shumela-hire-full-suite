'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import PageWrapper from '@/components/PageWrapper';
import ApplicationStatusTracker from '@/components/ApplicationStatusTracker';
import EmptyState from '@/components/EmptyState';
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
    case 'SCREENING': return 'bg-gold-100 text-violet-700 border-violet-300';
    case 'INTERVIEW_SCHEDULED': return 'bg-purple-100 text-purple-700 border-purple-300';
    case 'INTERVIEW_COMPLETED': return 'bg-indigo-100 text-indigo-700 border-indigo-300';
    case 'REFERENCE_CHECK': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    case 'OFFER_PENDING': return 'bg-amber-100 text-amber-700 border-amber-300';
    case 'OFFERED': return 'bg-emerald-100 text-emerald-700 border-emerald-300';
    case 'OFFER_ACCEPTED': return 'bg-green-100 text-green-700 border-green-300';
    case 'HIRED': return 'bg-green-200 text-green-800 border-green-400';
    case 'REJECTED': return 'bg-red-100 text-red-700 border-red-300';
    case 'WITHDRAWN': return 'bg-gray-100 text-gray-600 border-gray-300';
    case 'OFFER_DECLINED': return 'bg-orange-100 text-orange-700 border-orange-300';
    default: return 'bg-gray-100 text-gray-700 border-gray-300';
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
      className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
    />
  ));
}

const PAGE_SIZE = 20;

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
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

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const loadApplications = useCallback(async (page: number, search: string, status: string, sort: string, direction: string) => {
    setLoading(true);
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
        setApplications([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch {
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
        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50"
      >
        <ArrowPathIcon className="w-4 h-4 mr-1.5" />
        Refresh
      </button>
      <Link
        href="/applications/manage"
        className="inline-flex items-center px-4 py-2 border-2 border-gold-500 text-sm font-medium rounded-full bg-transparent text-violet-900 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider"
      >
        Advanced Management
      </Link>
    </div>
  );

  if (loading && applications.length === 0) {
    return (
      <PageWrapper title="Applications" subtitle="Loading applications..." actions={actions}>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
        </div>
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
        <div className="bg-white rounded-[10px] border border-gray-200 p-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, job title, department, or email..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setAiSearchMode(!aiSearchMode)}
                  className={`px-3 py-2 text-xs font-medium rounded-sm border transition-colors whitespace-nowrap ${
                    aiSearchMode
                      ? 'bg-teal-50 border-teal-300 text-teal-700'
                      : 'border-gray-300 text-gray-500 hover:bg-gray-50'
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
                className="w-full py-2 px-3 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
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
                className="w-full py-2 px-3 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
              >
                <option value="ALL">All Departments</option>
                {DEPARTMENT_OPTIONS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              {totalElements} application{totalElements !== 1 ? 's' : ''}
              {loading && <span className="ml-2 text-gray-400">(loading...)</span>}
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Sort by:</span>
              <select
                value={`${sortBy}-${sortDir}`}
                onChange={(e) => handleSortChange(e.target.value)}
                className="py-1 px-2 border border-gray-300 rounded-sm text-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
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
        <div className="bg-white rounded-[10px] border border-gray-200 overflow-hidden">
          {filteredByDepartment.length === 0 ? (
            <EmptyState
              icon={FunnelIcon}
              title="No applications"
              description="No applications match your filters. Try adjusting your search or filter criteria."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applicant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredByDepartment.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-9 h-9 bg-gold-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <UserIcon className="w-5 h-5 text-gold-600" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{app.applicantName}</p>
                            <p className="text-xs text-gray-500">{app.applicantEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900">{app.jobTitle}</p>
                        <p className="text-xs text-gray-500">{app.department}</p>
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
                          <span className="text-xs text-gray-400">Not rated</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900">{formatDate(app.submittedAt)}</p>
                        <p className="text-xs text-gray-500">{app.daysFromSubmission}d ago</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{app.applicationSource || '-'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => setSelectedApplication(app)}
                          className="text-gold-600 hover:text-gold-800 text-sm font-medium"
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
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-500">
                Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, totalElements)} of {totalElements}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
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
                      className={`w-8 h-8 rounded-full text-sm font-medium ${
                        currentPage === pageNum
                          ? 'bg-gold-500 text-violet-950'
                          : 'text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
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
            <div className="bg-white rounded-[12px] shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedApplication.applicantName}
                    </h2>
                    <p className="text-gray-500 mt-1">
                      {selectedApplication.jobTitle} — {selectedApplication.department}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedApplication(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircleIcon className="w-6 h-6" />
                  </button>
                </div>

                <ApplicationStatusTracker
                  application={selectedApplication}
                  onWithdraw={handleWithdraw}
                  showWithdrawOption={selectedApplication.canBeWithdrawn}
                />

                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Email</p>
                    <p className="text-sm text-gray-900">{selectedApplication.applicantEmail}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Source</p>
                    <p className="text-sm text-gray-900">{selectedApplication.applicationSource || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Submitted</p>
                    <p className="text-sm text-gray-900">{formatDate(selectedApplication.submittedAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Days Since Submission</p>
                    <p className="text-sm text-gray-900">{selectedApplication.daysFromSubmission} days</p>
                  </div>
                  {selectedApplication.rating && (
                    <div className="col-span-2">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Rating</p>
                      <div className="flex items-center gap-1">{renderStars(selectedApplication.rating)}</div>
                    </div>
                  )}
                </div>

                {/* AI Candidate Assist */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <AiCandidatePanel
                    applicationId={String(selectedApplication.id)}
                    candidateName={selectedApplication.applicantName}
                    jobTitle={selectedApplication.jobTitle}
                  />
                </div>

                <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setSelectedApplication(null)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 text-sm font-medium"
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
