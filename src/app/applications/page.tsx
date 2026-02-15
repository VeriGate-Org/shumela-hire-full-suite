'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import PageWrapper from '@/components/PageWrapper';
import ApplicationStatusTracker from '@/components/ApplicationStatusTracker';
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

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'submittedAt' | 'status' | 'rating'>('submittedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/applications');
      if (response.ok) {
        const data = await response.json();
        const list = data.content || data;
        setApplications(Array.isArray(list) ? list : []);
      } else {
        // Use demo data when API unavailable
        setApplications(generateDemoData());
      }
    } catch {
      setApplications(generateDemoData());
    } finally {
      setLoading(false);
    }
  };

  const generateDemoData = (): Application[] => {
    const statuses = ['SUBMITTED', 'SCREENING', 'INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED', 'REFERENCE_CHECK', 'OFFER_PENDING', 'OFFERED', 'HIRED', 'REJECTED', 'WITHDRAWN'];
    const jobs = ['Senior Software Engineer', 'Marketing Manager', 'Sales Representative', 'HR Coordinator', 'Financial Analyst', 'Product Manager', 'UX Designer', 'Data Scientist'];
    const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Product', 'Operations'];
    const names = ['Thabo Mokoena', 'Naledi Dlamini', 'Sipho Nkosi', 'Lerato Molefe', 'Bongani Mthembu', 'Ayanda Zulu', 'Nomsa Khumalo', 'Mandla Sithole', 'Zanele Ndaba', 'Pieter van der Merwe', 'Fatima Patel', 'James Okafor', 'Sarah Johnson', 'David Kim', 'Priya Naidoo'];

    return Array.from({ length: 45 }, (_, i) => {
      const submittedDate = new Date();
      submittedDate.setDate(submittedDate.getDate() - Math.floor(Math.random() * 90));
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const name = names[Math.floor(Math.random() * names.length)];
      const daysFromSubmission = Math.floor((Date.now() - submittedDate.getTime()) / (1000 * 60 * 60 * 24));

      return {
        id: i + 1,
        jobTitle: jobs[Math.floor(Math.random() * jobs.length)],
        department: departments[Math.floor(Math.random() * departments.length)],
        status,
        statusDisplayName: status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        statusCssClass: getStatusColor(status),
        submittedAt: submittedDate.toISOString(),
        rating: Math.random() > 0.3 ? Math.floor(Math.random() * 5) + 1 : undefined,
        canBeWithdrawn: !['WITHDRAWN', 'REJECTED', 'HIRED', 'OFFERED'].includes(status),
        daysFromSubmission,
        applicantName: name,
        applicantEmail: name.toLowerCase().replace(/\s+/g, '.') + '@email.com',
        applicationSource: ['Website', 'LinkedIn', 'Referral', 'Agency', 'Job Board'][Math.floor(Math.random() * 5)],
      };
    });
  };

  const filteredApplications = useMemo(() => {
    let result = applications.filter(app => {
      const matchesSearch = !searchTerm ||
        app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.applicantEmail.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
      const matchesDepartment = departmentFilter === 'ALL' || app.department === departmentFilter;
      return matchesSearch && matchesStatus && matchesDepartment;
    });

    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'submittedAt') {
        cmp = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      } else if (sortBy === 'status') {
        cmp = a.status.localeCompare(b.status);
      } else if (sortBy === 'rating') {
        cmp = (a.rating || 0) - (b.rating || 0);
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });

    return result;
  }, [applications, searchTerm, statusFilter, departmentFilter, sortBy, sortDir]);

  const paginatedApplications = useMemo(() => {
    const start = page * pageSize;
    return filteredApplications.slice(start, start + pageSize);
  }, [filteredApplications, page]);

  const totalPages = Math.ceil(filteredApplications.length / pageSize);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    applications.forEach(app => {
      counts[app.status] = (counts[app.status] || 0) + 1;
    });
    return counts;
  }, [applications]);

  const handleWithdraw = async (applicationId: number, reason: string) => {
    try {
      const response = await fetch(`/api/applications/${applicationId}/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (response.ok) {
        loadApplications();
        setSelectedApplication(null);
      }
    } catch (error) {
      console.error('Error withdrawing application:', error);
    }
  };

  const activeCount = applications.filter(a => !['WITHDRAWN', 'REJECTED', 'HIRED', 'OFFER_DECLINED'].includes(a.status)).length;
  const pendingReview = (statusCounts['SUBMITTED'] || 0) + (statusCounts['SCREENING'] || 0);
  const interviewStage = (statusCounts['INTERVIEW_SCHEDULED'] || 0) + (statusCounts['INTERVIEW_COMPLETED'] || 0);
  const offerStage = (statusCounts['OFFER_PENDING'] || 0) + (statusCounts['OFFERED'] || 0) + (statusCounts['OFFER_ACCEPTED'] || 0);

  const actions = (
    <div className="flex items-center gap-3">
      <button
        onClick={loadApplications}
        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
      >
        <ArrowPathIcon className="w-4 h-4 mr-1.5" />
        Refresh
      </button>
      <Link
        href="/applications/manage"
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-violet-600 hover:bg-violet-700"
      >
        Advanced Management
      </Link>
    </div>
  );

  if (loading) {
    return (
      <PageWrapper title="Applications" subtitle="Loading applications..." actions={actions}>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
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
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-[10px] border border-gray-200 p-5">
            <div className="flex items-center">
              <DocumentTextIcon className="w-8 h-8 text-violet-500 flex-shrink-0" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total</p>
                <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-[10px] border border-gray-200 p-5">
            <div className="flex items-center">
              <ClockIcon className="w-8 h-8 text-amber-500 flex-shrink-0" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">{pendingReview}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-[10px] border border-gray-200 p-5">
            <div className="flex items-center">
              <EyeIcon className="w-8 h-8 text-purple-500 flex-shrink-0" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Interview Stage</p>
                <p className="text-2xl font-bold text-gray-900">{interviewStage}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-[10px] border border-gray-200 p-5">
            <div className="flex items-center">
              <CheckCircleIcon className="w-8 h-8 text-green-500 flex-shrink-0" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Offer Stage</p>
                <p className="text-2xl font-bold text-gray-900">{offerStage}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-[10px] border border-gray-200 p-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, job title, department, or email..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
                />
              </div>
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                className="w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} {opt.value !== 'ALL' && statusCounts[opt.value] ? `(${statusCounts[opt.value]})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={departmentFilter}
                onChange={(e) => { setDepartmentFilter(e.target.value); setPage(0); }}
                className="w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
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
              {filteredApplications.length} of {applications.length} applications
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Sort by:</span>
              <select
                value={`${sortBy}-${sortDir}`}
                onChange={(e) => {
                  const [field, dir] = e.target.value.split('-');
                  setSortBy(field as typeof sortBy);
                  setSortDir(dir as typeof sortDir);
                  setPage(0);
                }}
                className="py-1 px-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
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
          {paginatedApplications.length === 0 ? (
            <div className="p-12 text-center">
              <FunnelIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No applications match your filters</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filter criteria</p>
            </div>
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
                  {paginatedApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-9 h-9 bg-violet-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <UserIcon className="w-5 h-5 text-violet-600" />
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
                          className="text-violet-600 hover:text-violet-800 text-sm font-medium"
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
                Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, filteredApplications.length)} of {filteredApplications.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 7) {
                    pageNum = i;
                  } else if (page < 4) {
                    pageNum = i;
                  } else if (page > totalPages - 4) {
                    pageNum = totalPages - 7 + i;
                  } else {
                    pageNum = page - 3 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded-md text-sm font-medium ${
                        page === pageNum
                          ? 'bg-violet-600 text-white'
                          : 'text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
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

                <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setSelectedApplication(null)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium"
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
