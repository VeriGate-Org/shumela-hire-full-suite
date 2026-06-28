'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import PageWrapper from '@/components/PageWrapper';
import EmptyState from '@/components/EmptyState';
import JobPostingForm from '@/components/JobPostingForm';
import JobPostingWorkflow from '@/components/JobPostingWorkflow';
import JobBoardManager from '@/components/JobBoardManager';
import MultiChannelPublishWizard from '@/components/MultiChannelPublishWizard';
import VacancyReportActions from '@/components/VacancyReportActions';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api-fetch';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import LinkedInPostToCompany from '@/components/LinkedInPostToCompany';

interface JobPosting {
  id: string | number;
  title: string;
  department: string;
  status: string;
  statusDisplayName: string;
  statusCssClass: string;
  statusIcon: string;
  employmentType: string;
  employmentTypeDisplayName: string;
  experienceLevel: string;
  experienceLevelDisplayName: string;
  location?: string;
  salaryRange: string;
  canBeEdited: boolean;
  canBeSubmittedForApproval: boolean;
  canBeApproved: boolean;
  canBeRejected: boolean;
  canBePublished: boolean;
  canBeUnpublished: boolean;
  canBeClosed: boolean;
  createdAt: string;
  submittedForApprovalAt?: string;
  approvedAt?: string;
  publishedAt?: string;
  unpublishedAt?: string;
  closedAt?: string;
  approvalNotes?: string;
  rejectionReason?: string;
  createdBy: number;
  approvedBy?: number;
  publishedBy?: number;
  daysFromCreation: number;
  daysFromPublication: number;
  applicationsCount: number;
  viewsCount: number;
  featured: boolean;
  urgent: boolean;
  remoteWorkAllowed: boolean;
}

const PAGE_SIZE = 10;

const ALL_STATUSES = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'UNPUBLISHED', label: 'Unpublished' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function JobPostingsPage() {
  const [view, setView] = useState<'list' | 'create' | 'edit' | 'workflow'>('list');
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [selectedJobPosting, setSelectedJobPosting] = useState<JobPosting | null>(null);
  const [cloneInitialData, setCloneInitialData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [showLinkedInModal, setShowLinkedInModal] = useState(false);
  const [linkedInJobPosting, setLinkedInJobPosting] = useState<JobPosting | null>(null);
  const [deletingJobPosting, setDeletingJobPosting] = useState<JobPosting | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPublishWizard, setShowPublishWizard] = useState(false);
  // Bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [bulkStatusAction, setBulkStatusAction] = useState('');
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const { setCurrentRole } = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();

  // String-based currentUserId (Issue #12)
  const currentUserId = useMemo(() => {
    return user?.id != null ? String(user.id) : null;
  }, [user?.id]);

  // Debounce timer ref
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const searchParams = useSearchParams();

  // Set theme to admin for job postings page
  useEffect(() => {
    setCurrentRole('ADMIN');
  }, [setCurrentRole]);

  // Handle ?action=create from dashboard "Create Position" button
  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setView('create');
    }
  }, [searchParams]);

  const loadJobPostings = useCallback(async (page = currentPage) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        size: String(PAGE_SIZE),
        sort: 'createdAt',
        direction: 'desc',
      });

      if (searchTerm.trim()) {
        params.set('search', searchTerm.trim());
      }
      if (statusFilter !== 'ALL') {
        params.set('status', statusFilter);
      }

      const response = await apiFetch(`/api/job-postings/search?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setJobPostings(data.content || []);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      } else {
        const errorText = await response.text();
        let message = 'Failed to load job postings';
        try { message = JSON.parse(errorText).message ?? message; } catch {}
        toast(message, 'error');
      }
    } catch (error) {
      console.error('Error loading job postings:', error);
      toast('Failed to load job postings', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, toast]);

  // Consolidated effect: load when view is list (Issue #1)
  useEffect(() => {
    if (view !== 'list') return;
    loadJobPostings();
  }, [view, currentPage, loadJobPostings]);

  // Search debounce handler (Issue #1 — move page reset into handlers)
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setCurrentPage(0), 300);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(0);
  };

  // Clean up debounce timer
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleJobPostingSaved = (jobPosting: { id: string | number; title: string; status: string }) => {
    console.log('Job posting saved:', jobPosting);
    setCloneInitialData(null);
    setView('list');
    loadJobPostings(0);
  };

  // Updated to accept full posting from workflow (Issue #11)
  // The API response includes all JobPosting fields; the workflow type is narrower
  const handleStatusChange = (updatedPosting: Record<string, unknown>) => {
    setSelectedJobPosting(updatedPosting as unknown as JobPosting);
    loadJobPostings(); // refresh list only
  };

  // Delete using request body (Issue #13) + toast errors (Issue #9)
  const handleDeleteJobPosting = async () => {
    if (!deletingJobPosting || !currentUserId) return;

    try {
      setIsDeleting(true);
      const response = await apiFetch(
        `/api/job-postings/${deletingJobPosting.id}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deletedBy: currentUserId }),
        }
      );

      if (response.ok) {
        setDeletingJobPosting(null);
        toast('Job posting deleted', 'success');
        loadJobPostings();
      } else {
        const errorText = await response.text();
        let message = 'Failed to delete job posting';
        try { message = JSON.parse(errorText).message ?? message; } catch {}
        toast(message, 'error');
      }
    } catch (error) {
      console.error('Error deleting job posting:', error);
      toast('Failed to delete job posting', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Clone action (Issue #6)
  const handleClone = async (jobPosting: JobPosting) => {
    try {
      const response = await apiFetch(`/api/job-postings/${jobPosting.id}`);
      if (response.ok) {
        const data = await response.json();
        // Strip id and status-related fields for the clone
        const { id: _id, status: _status, statusDisplayName: _sdn, statusCssClass: _scc, statusIcon: _si,
          canBeEdited: _cbe, canBeSubmittedForApproval: _cbsa, canBeApproved: _cba, canBeRejected: _cbr,
          canBePublished: _cbp, canBeUnpublished: _cbu, canBeClosed: _cbc,
          createdAt: _ca, submittedForApprovalAt: _sfaa, approvedAt: _aa, publishedAt: _pa,
          unpublishedAt: _ua, closedAt: _cla, approvalNotes: _an, rejectionReason: _rr,
          createdBy: _cb, approvedBy: _ab, publishedBy: _pb,
          daysFromCreation: _dfc, daysFromPublication: _dfp, applicationsCount: _ac, viewsCount: _vc,
          ...formFields } = data;
        setCloneInitialData(formFields);
        setView('create');
        window.scrollTo(0, 0);
      } else {
        toast('Failed to load job posting for cloning', 'error');
      }
    } catch {
      toast('Failed to clone job posting', 'error');
    }
  };

  // CSV export (Issue #8)
  const handleExportCsv = () => {
    const headers = ['Title', 'Department', 'Status', 'Employment Type', 'Location', 'Applications', 'Created'];
    const rows = jobPostings.map(jp => [
      jp.title,
      jp.department,
      jp.statusDisplayName,
      jp.employmentTypeDisplayName,
      jp.location || '',
      String(jp.applicationsCount),
      jp.createdAt,
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `job-postings-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Bulk actions (Issue #4)
  const toggleSelectAll = () => {
    if (selectedIds.size === jobPostings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(jobPostings.map(jp => jp.id)));
    }
  };

  const toggleSelectOne = (id: string | number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkStatusChange = async () => {
    if (!bulkStatusAction || selectedIds.size === 0 || !currentUserId) return;
    setBulkActionLoading(true);
    let successCount = 0;
    for (const id of selectedIds) {
      try {
        const payload = new URLSearchParams();
        const actionMap: Record<string, string> = {
          'submit-for-approval': 'submittedBy',
          'approve': 'approvedBy',
          'publish': 'publishedBy',
          'unpublish': 'unpublishedBy',
          'close': 'closedBy',
        };
        const paramKey = actionMap[bulkStatusAction];
        if (paramKey) payload.append(paramKey, currentUserId);

        const response = await apiFetch(`/api/job-postings/${id}/${bulkStatusAction}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: payload.toString(),
        });
        if (response.ok) successCount++;
      } catch {
        // Continue with next
      }
    }
    setBulkActionLoading(false);
    setBulkStatusAction('');
    setSelectedIds(new Set());
    toast(`Updated ${successCount} of ${selectedIds.size} postings`, successCount > 0 ? 'success' : 'error');
    loadJobPostings();
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0 || !currentUserId) return;
    setBulkActionLoading(true);
    setShowBulkDeleteConfirm(false);
    let successCount = 0;
    for (const id of selectedIds) {
      const posting = jobPostings.find(jp => jp.id === id);
      if (!posting || (posting.status !== 'DRAFT' && posting.status !== 'REJECTED')) continue;
      try {
        const response = await apiFetch(`/api/job-postings/${id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deletedBy: currentUserId }),
        });
        if (response.ok) successCount++;
      } catch {
        // Continue with next
      }
    }
    setBulkActionLoading(false);
    setSelectedIds(new Set());
    toast(`Deleted ${successCount} postings`, successCount > 0 ? 'success' : 'error');
    loadJobPostings();
  };

  const handleBulkExport = () => {
    const selected = jobPostings.filter(jp => selectedIds.has(jp.id));
    const headers = ['Title', 'Department', 'Status', 'Employment Type', 'Location', 'Applications', 'Created'];
    const rows = selected.map(jp => [
      jp.title,
      jp.department,
      jp.statusDisplayName,
      jp.employmentTypeDisplayName,
      jp.location || '',
      String(jp.applicationsCount),
      jp.createdAt,
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `job-postings-selected-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getPageTitle = () => {
    switch (view) {
      case 'create': return 'Create Job Posting';
      case 'edit': return 'Edit Job Posting';
      case 'workflow': return 'Job Posting Workflow';
      default: return 'Job Postings';
    }
  };

  const getPageSubtitle = () => {
    switch (view) {
      case 'create': return 'Fill in the details to create a new job posting.';
      case 'edit': return 'Update the job posting details.';
      case 'workflow': return 'Manage the approval and publishing workflow.';
      default: return 'Create, review, and publish job postings with full workflow controls.';
    }
  };

  const pageActions = view === 'list' ? (
    <div className="flex items-center space-x-3">
      <button
        onClick={handleExportCsv}
        disabled={jobPostings.length === 0}
        className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50 disabled:opacity-40"
      >
        Export CSV
      </button>
      <button
        onClick={() => { setCloneInitialData(null); setView('create'); }}
        className="px-4 py-2 bg-transparent border-2 border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider rounded-full font-medium"
      >
        Create Job Posting
      </button>
    </div>
  ) : undefined;

  // Pagination helpers
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(0, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible);
    start = Math.max(0, end - maxVisible);

    for (let i = start; i < end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <PageWrapper
      title={getPageTitle()}
      subtitle={getPageSubtitle()}
      actions={pageActions}
    >
      <div className="space-y-6">
        {view === 'list' && (
          <div>
            {!currentUserId && (
              <div className="mb-6 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Workflow actions require a valid signed-in user ID for audit tracking.
              </div>
            )}

            {/* Search and Filter */}
            <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Search Job Postings
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search by title or department..."
                    className="w-full rounded-md border border-gray-300 p-2 focus:border-violet-400 focus:ring-2 focus:ring-gold-500/60"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Filter by Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => handleStatusFilterChange(e.target.value)}
                    className="w-full rounded-md border border-gray-300 p-2 focus:border-violet-400 focus:ring-2 focus:ring-gold-500/60"
                  >
                    <option value="ALL">All Statuses</option>
                    {ALL_STATUSES.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Bulk Action Bar (Issue #4) */}
            {selectedIds.size > 0 && (
              <div className="rounded-md border border-violet-200 bg-violet-50 p-3 mb-4 flex items-center justify-between flex-wrap gap-2">
                <span className="text-sm font-medium text-violet-800">
                  {selectedIds.size} selected
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={bulkStatusAction}
                    onChange={(e) => setBulkStatusAction(e.target.value)}
                    className="text-sm border border-gray-300 rounded-md px-2 py-1"
                  >
                    <option value="">Change Status...</option>
                    <option value="submit-for-approval">Submit for Approval</option>
                    <option value="approve">Approve</option>
                    <option value="publish">Publish</option>
                    <option value="unpublish">Unpublish</option>
                    <option value="close">Close</option>
                  </select>
                  {bulkStatusAction && (
                    <button
                      onClick={handleBulkStatusChange}
                      disabled={bulkActionLoading}
                      className="text-sm px-3 py-1 bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50"
                    >
                      {bulkActionLoading ? 'Applying...' : 'Apply'}
                    </button>
                  )}
                  <button
                    onClick={() => setShowBulkDeleteConfirm(true)}
                    disabled={bulkActionLoading}
                    className="text-sm px-3 py-1 text-red-700 border border-red-300 rounded-md hover:bg-red-50 disabled:opacity-50"
                  >
                    Delete Selected
                  </button>
                  <button
                    onClick={handleBulkExport}
                    className="text-sm px-3 py-1 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Export Selected
                  </button>
                  <button
                    onClick={() => setSelectedIds(new Set())}
                    className="text-sm px-3 py-1 text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            {/* Job Postings List */}
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {jobPostings.length === 0 ? (
                  <EmptyState
                    icon={DocumentTextIcon}
                    title="No job postings available"
                    description={
                      searchTerm || statusFilter !== 'ALL'
                        ? 'No job postings match your search criteria.'
                        : 'No job postings are currently available. Create your first one to get started.'
                    }
                    action={!searchTerm && statusFilter === 'ALL' ? {
                      label: 'Create Job Posting',
                      onClick: () => setView('create'),
                    } : undefined}
                  />
                ) : (
                  <>
                    {/* Select All */}
                    <div className="flex items-center px-2">
                      <label className="flex items-center text-sm text-gray-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === jobPostings.length && jobPostings.length > 0}
                          onChange={toggleSelectAll}
                          className="mr-2 h-4 w-4 text-violet-600 border-gray-300 rounded focus:ring-gold-500"
                        />
                        Select all on page
                      </label>
                    </div>

                    {jobPostings.map((jobPosting) => (
                      <div key={jobPosting.id} className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-3 flex-1">
                            {/* Checkbox for bulk select */}
                            <input
                              type="checkbox"
                              checked={selectedIds.has(jobPosting.id)}
                              onChange={() => toggleSelectOne(jobPosting.id)}
                              className="mt-1.5 h-4 w-4 text-violet-600 border-gray-300 rounded focus:ring-gold-500 shrink-0"
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3
                                  className="text-lg font-medium text-gray-900 cursor-pointer hover:text-[#05527E] transition-colors"
                                  onClick={() => { setSelectedJobPosting(jobPosting); setView('workflow'); window.scrollTo(0, 0); }}
                                >{jobPosting.title}</h3>
                                {jobPosting.featured && (
                                  <span className="inline-flex items-center rounded-full border border-yellow-300 bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800">
                                    Featured
                                  </span>
                                )}
                                {jobPosting.urgent && (
                                  <span className="inline-flex items-center rounded-full border border-red-300 bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                                    Urgent
                                  </span>
                                )}
                                {jobPosting.remoteWorkAllowed && (
                                  <span className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                                    Remote
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                <div>
                                  <p><strong>Department:</strong> {jobPosting.department}</p>
                                  <p><strong>Type:</strong> {jobPosting.employmentTypeDisplayName}</p>
                                  <p><strong>Experience:</strong> {jobPosting.experienceLevelDisplayName}</p>
                                </div>
                                <div>
                                  <p><strong>Location:</strong> {jobPosting.location || 'Not specified'}</p>
                                  <p><strong>Salary:</strong> {jobPosting.salaryRange}</p>
                                  <p><strong>Applications:</strong> {jobPosting.applicationsCount}</p>
                                </div>
                              </div>

                              <p className="text-sm text-gray-500 mt-2">
                                Created {jobPosting.daysFromCreation} days ago
                                {jobPosting.status === 'PUBLISHED' && ` • Published ${jobPosting.daysFromPublication} days ago`}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${jobPosting.statusCssClass}`}>
                              {jobPosting.statusDisplayName}
                            </span>

                            <div className="flex space-x-2">
                              {jobPosting.canBeEdited && (
                                <button
                                  onClick={() => {
                                    setSelectedJobPosting(jobPosting);
                                    setView('edit');
                                    window.scrollTo(0, 0);
                                  }}
                                  className="text-gold-600 hover:text-gold-800 text-sm font-medium"
                                >
                                  Edit
                                </button>
                              )}

                              {/* Clone button (Issue #6) */}
                              <button
                                onClick={() => handleClone(jobPosting)}
                                className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                              >
                                Clone
                              </button>

                              {jobPosting.status === 'PUBLISHED' && user?.role && ['ADMIN', 'HR_MANAGER', 'RECRUITER'].includes(user.role) && (
                                <button
                                  onClick={() => {
                                    setLinkedInJobPosting(jobPosting);
                                    setShowLinkedInModal(true);
                                  }}
                                  className="text-[#0A66C2] hover:text-[#004182] text-sm font-medium flex items-center gap-1"
                                  title="Post to company LinkedIn page"
                                >
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                  </svg>
                                  LinkedIn
                                </button>
                              )}

                              {(jobPosting.status === 'DRAFT' || jobPosting.status === 'REJECTED') && currentUserId && (
                                <button
                                  onClick={() => {
                                    setDeletingJobPosting(jobPosting);
                                  }}
                                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between pt-4">
                        <p className="text-sm text-gray-600">
                          Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, totalElements)} of {totalElements}
                        </p>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                            disabled={currentPage === 0}
                            className="px-3 py-1 text-sm rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          {getPageNumbers().map(page => (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`px-3 py-1 text-sm rounded-full ${
                                page === currentPage
                                  ? 'bg-gold-500 text-white border border-gold-500'
                                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {page + 1}
                            </button>
                          ))}
                          <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                            disabled={currentPage >= totalPages - 1}
                            className="px-3 py-1 text-sm rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {view === 'create' && (
          <div>
            <div className="mb-4">
              <button
                onClick={() => { setCloneInitialData(null); setView('list'); }}
                className="text-violet-500 hover:text-gold-700 font-medium"
              >
                &larr; Back to Job Postings
              </button>
            </div>

            <JobPostingForm
              initialData={cloneInitialData ?? undefined}
              currentUserId={currentUserId}
              onSuccess={handleJobPostingSaved}
              onCancel={() => { setCloneInitialData(null); setView('list'); }}
            />
          </div>
        )}

        {view === 'edit' && selectedJobPosting && (
          <div>
            <div className="mb-4">
              <button
                onClick={() => setView('list')}
                className="text-violet-500 hover:text-gold-700 font-medium"
              >
                &larr; Back to Job Postings
              </button>
            </div>

            <JobPostingForm
              jobPostingId={selectedJobPosting.id}
              currentUserId={currentUserId}
              onSuccess={handleJobPostingSaved}
              onCancel={() => setView('list')}
            />
          </div>
        )}

        {view === 'workflow' && selectedJobPosting && (
          <div>
            <div className="mb-4">
              <button
                onClick={() => setView('list')}
                className="text-violet-500 hover:text-gold-700 font-medium"
              >
                &larr; Back to Job Postings
              </button>
            </div>

            <JobPostingWorkflow
              jobPosting={selectedJobPosting}
              onStatusChange={handleStatusChange}
              currentUserId={currentUserId ?? undefined}
            />

            {selectedJobPosting.status === 'PUBLISHED' && (
              <>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowPublishWizard(true)}
                    className="px-4 py-2 bg-gold-500 text-violet-950 rounded-sm hover:bg-gold-600 text-sm font-medium"
                  >
                    Publish to All Channels
                  </button>
                </div>
                <div className="mt-3 rounded-md border border-gray-200 bg-white p-6 shadow-sm">
                  <JobBoardManager jobId={String(selectedJobPosting.id)} />
                </div>
              </>
            )}

            {(selectedJobPosting.status === 'PUBLISHED' || selectedJobPosting.status === 'CLOSED') && (
              <div className="mt-6 rounded-md border border-gray-200 bg-white p-6 shadow-sm">
                <VacancyReportActions
                  jobId={String(selectedJobPosting.id)}
                  showDemographics={user?.role === 'ADMIN' || user?.role === 'HR_MANAGER'}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {linkedInJobPosting && (
        <LinkedInPostToCompany
          jobPosting={linkedInJobPosting}
          isOpen={showLinkedInModal}
          onClose={() => {
            setShowLinkedInModal(false);
            setLinkedInJobPosting(null);
          }}
        />
      )}

      {/* Multi-Channel Publish Wizard */}
      {selectedJobPosting && (
        <MultiChannelPublishWizard
          jobId={String(selectedJobPosting.id)}
          isOpen={showPublishWizard}
          onClose={() => setShowPublishWizard(false)}
          onComplete={() => {
            if (selectedJobPosting) {
              loadJobPostings();
            }
          }}
        />
      )}

      {/* Delete Confirmation — using ConfirmDialog (Issue #5) */}
      <ConfirmDialog
        open={deletingJobPosting !== null}
        title="Delete Job Posting"
        message={`Are you sure you want to delete "${deletingJobPosting?.title ?? ''}"? This action cannot be undone.`}
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete'}
        variant="danger"
        onConfirm={handleDeleteJobPosting}
        onCancel={() => setDeletingJobPosting(null)}
      />

      {/* Bulk Delete Confirmation */}
      <ConfirmDialog
        open={showBulkDeleteConfirm}
        title="Delete Selected Postings"
        message={`Delete ${selectedIds.size} selected posting(s)? Only DRAFT and REJECTED postings will be deleted. This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleBulkDelete}
        onCancel={() => setShowBulkDeleteConfirm(false)}
      />
    </PageWrapper>
  );
}
