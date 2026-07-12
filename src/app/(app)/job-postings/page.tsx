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
import ShortlistingPanel from '@/components/ShortlistingPanel';
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
  const [view, setView] = useState<'list' | 'workflow'>('list');
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [selectedJobPosting, setSelectedJobPosting] = useState<JobPosting | null>(null);
  const [cloneInitialData, setCloneInitialData] = useState<Record<string, unknown> | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingJobPostingId, setEditingJobPostingId] = useState<string | number | null>(null);
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
      setShowFormModal(true);
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
    setShowFormModal(false);
    setEditingJobPostingId(null);
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
        setEditingJobPostingId(null);
        setShowFormModal(true);
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
      case 'workflow': return 'Job Posting Workflow';
      default: return 'Job Postings';
    }
  };

  const getPageSubtitle = () => {
    switch (view) {
      case 'workflow': return 'Manage the approval and publishing workflow.';
      default: return 'Create, review, and publish job postings with full workflow controls.';
    }
  };

  const pageActions = view === 'list' ? (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        onClick={handleExportCsv}
        disabled={jobPostings.length === 0}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-border text-muted-foreground font-semibold text-sm uppercase tracking-wider transition-all hover:border-primary hover:text-primary disabled:opacity-40"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Export
      </button>
      <button
        onClick={() => { setCloneInitialData(null); setEditingJobPostingId(null); setShowFormModal(true); }}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-cta border-2 border-cta text-foreground font-semibold text-sm uppercase tracking-wider rounded-full transition-all hover:bg-cta-hover hover:border-cta-hover"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
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

  // Compute stats from loaded data
  const statTotalPostings = totalElements;
  const statPublished = jobPostings.filter(jp => jp.status === 'PUBLISHED').length;
  const statPending = jobPostings.filter(jp => jp.status === 'PENDING_APPROVAL').length;
  const statTotalApplicants = jobPostings.reduce((sum, jp) => sum + jp.applicationsCount, 0);

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
              <div className="mb-6 enterprise-card border-warning bg-warning-bg px-4 py-3 text-sm text-foreground">
                Workflow actions require a valid signed-in user ID for audit tracking.
              </div>
            )}

            {/* Stats Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
              <div className="enterprise-card p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-card bg-icon-bg-navy text-accent-navy flex items-center justify-center shrink-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-foreground leading-none">{statTotalPostings}</div>
                  <div className="text-[0.8125rem] text-muted-foreground font-medium mt-0.5">Total Postings</div>
                </div>
              </div>
              <div className="enterprise-card p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-card bg-icon-bg-teal text-accent-teal flex items-center justify-center shrink-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-foreground leading-none">{statPublished}</div>
                  <div className="text-[0.8125rem] text-muted-foreground font-medium mt-0.5">Published</div>
                </div>
              </div>
              <div className="enterprise-card p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-card bg-icon-bg-gold text-accent-gold flex items-center justify-center shrink-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-foreground leading-none">{statPending}</div>
                  <div className="text-[0.8125rem] text-muted-foreground font-medium mt-0.5">Pending Approval</div>
                </div>
              </div>
              <div className="enterprise-card p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-card bg-icon-bg-pink text-accent-pink flex items-center justify-center shrink-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-foreground leading-none">{statTotalApplicants}</div>
                  <div className="text-[0.8125rem] text-muted-foreground font-medium mt-0.5">Total Applicants</div>
                </div>
              </div>
            </div>

            {/* Status Tabs */}
            <div className="enterprise-card p-1.5 flex gap-1 mb-4 flex-wrap">
              {[{ value: 'ALL', label: 'All' }, ...ALL_STATUSES].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handleStatusFilterChange(value)}
                  className={`flex-1 min-w-[100px] py-2.5 px-4 rounded-control text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    statusFilter === value
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-background hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Filter Bar */}
            <div className="enterprise-card p-4 mb-6 flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-[200px] relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search job postings..."
                  className="w-full pl-9 pr-3 py-2 text-sm font-medium border border-border rounded-control bg-card text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-[0.8125rem] text-muted-foreground font-medium cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === jobPostings.length && jobPostings.length > 0}
                    onChange={toggleSelectAll}
                    className="w-[16px] h-[16px] rounded border-2 border-border cursor-pointer accent-primary"
                  />
                  Select all
                </label>
                <div className="flex items-center gap-2 text-[0.8125rem] text-muted-foreground">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                  <span>{totalElements} posting{totalElements !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            {/* Job Postings Grid / Loading / Empty */}
            {loading ? (
              /* Skeleton Loading Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="enterprise-card p-5">
                    <div className="flex gap-3.5 mb-4">
                      <div className="w-[18px] h-[18px] rounded bg-border animate-pulse shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-4 w-3/4 bg-border rounded animate-pulse" />
                        <div className="h-3 w-1/2 bg-border rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="flex gap-1.5 mb-4">
                      <div className="h-[22px] w-[60px] bg-border rounded-full animate-pulse" />
                      <div className="h-[22px] w-[50px] bg-border rounded-full animate-pulse" />
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="h-3 w-[90%] bg-border rounded animate-pulse" />
                      <div className="h-3 w-[75%] bg-border rounded animate-pulse" />
                      <div className="h-3 w-[60%] bg-border rounded animate-pulse" />
                    </div>
                    <div className="border-t border-border pt-3.5 flex justify-between">
                      <div className="h-3 w-[80px] bg-border rounded animate-pulse" />
                      <div className="h-3 w-[60px] bg-border rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : jobPostings.length === 0 ? (
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
                  onClick: () => { setCloneInitialData(null); setEditingJobPostingId(null); setShowFormModal(true); },
                } : undefined}
              />
            ) : (
              <>
                {/* Job Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
                  {jobPostings.map((jobPosting) => (
                    <div
                      key={jobPosting.id}
                      className="enterprise-card p-5 flex flex-col relative group"
                    >
                      {/* Card Header: Checkbox + Title + Dept */}
                      <div className="flex items-start gap-3.5 mb-3.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(jobPosting.id)}
                          onChange={() => toggleSelectOne(jobPosting.id)}
                          className="mt-0.5 w-[18px] h-[18px] rounded border-2 border-border cursor-pointer accent-primary shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3
                            className="font-bold text-base text-foreground leading-snug mb-0.5 cursor-pointer hover:text-primary transition-colors line-clamp-2"
                            onClick={() => { setSelectedJobPosting(jobPosting); setView('workflow'); window.scrollTo(0, 0); }}
                          >
                            {jobPosting.title}
                          </h3>
                          <p className="text-[0.8125rem] text-muted-foreground font-medium">{jobPosting.department}</p>
                        </div>
                      </div>

                      {/* Badges Row */}
                      <div className="flex flex-wrap gap-1.5 mb-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-[3px] rounded-full text-[0.6875rem] font-bold uppercase tracking-wider ${jobPosting.statusCssClass}`}>
                          {jobPosting.statusDisplayName}
                        </span>
                        {jobPosting.featured && (
                          <span className="inline-flex items-center px-2.5 py-[3px] rounded-full text-[0.6875rem] font-bold uppercase tracking-wider bg-surface-gold text-accent-gold">
                            Featured
                          </span>
                        )}
                        {jobPosting.urgent && (
                          <span className="inline-flex items-center px-2.5 py-[3px] rounded-full text-[0.6875rem] font-bold uppercase tracking-wider bg-surface-pink text-accent-pink">
                            Urgent
                          </span>
                        )}
                        {jobPosting.remoteWorkAllowed && (
                          <span className="inline-flex items-center px-2.5 py-[3px] rounded-full text-[0.6875rem] font-bold uppercase tracking-wider bg-surface-teal text-accent-teal">
                            Remote
                          </span>
                        )}
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-border mb-3.5" />

                      {/* Info Rows */}
                      <div className="space-y-2 text-[0.8125rem]">
                        <div className="flex items-center gap-2 text-foreground">
                          <svg className="w-3.5 h-3.5 text-muted-foreground shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                          <span className="text-muted-foreground">Type:</span> {jobPosting.employmentTypeDisplayName}
                        </div>
                        <div className="flex items-center gap-2 text-foreground">
                          <svg className="w-3.5 h-3.5 text-muted-foreground shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          <span className="text-muted-foreground">Location:</span> {jobPosting.location || 'Not specified'}
                        </div>
                        <div className="flex items-center gap-2 text-foreground">
                          <svg className="w-3.5 h-3.5 text-muted-foreground shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                          <span className="text-muted-foreground">Salary:</span> {jobPosting.salaryRange}
                        </div>
                        <div className="flex items-center gap-2 text-foreground">
                          <svg className="w-3.5 h-3.5 text-muted-foreground shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          <span className="text-muted-foreground">Posted:</span> {jobPosting.daysFromCreation} days ago
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="mt-auto pt-3.5 border-t border-border flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[0.8125rem] text-muted-foreground font-medium">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                          <strong className="text-foreground font-bold">{jobPosting.applicationsCount}</strong> applicant{jobPosting.applicationsCount !== 1 ? 's' : ''}
                        </div>
                        <button
                          onClick={() => { setSelectedJobPosting(jobPosting); setView('workflow'); window.scrollTo(0, 0); }}
                          className="text-[0.8125rem] font-semibold text-primary uppercase tracking-wider hover:text-cta-hover transition-colors bg-transparent border-none cursor-pointer"
                        >
                          View Details
                        </button>
                      </div>

                      {/* Card Action Menu (top-right) */}
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-1">
                          {jobPosting.canBeEdited && (
                            <button
                              onClick={() => {
                                setCloneInitialData(null);
                                setEditingJobPostingId(jobPosting.id);
                                setShowFormModal(true);
                              }}
                              className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-background hover:text-primary transition-all"
                              title="Edit"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                          )}
                          <button
                            onClick={() => handleClone(jobPosting)}
                            className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-background hover:text-primary transition-all"
                            title="Clone"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                          </button>
                          {jobPosting.status === 'PUBLISHED' && user?.role && ['ADMIN', 'HR_MANAGER', 'RECRUITER'].includes(user.role) && (
                            <button
                              onClick={() => {
                                setLinkedInJobPosting(jobPosting);
                                setShowLinkedInModal(true);
                              }}
                              className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-background hover:text-primary transition-all"
                              title="Post to company LinkedIn page"
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                              </svg>
                            </button>
                          )}
                          {(jobPosting.status === 'DRAFT' || jobPosting.status === 'REJECTED') && currentUserId && (
                            <button
                              onClick={() => { setDeletingJobPosting(jobPosting); }}
                              className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-surface-pink hover:text-accent-pink transition-all"
                              title="Delete"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Bar */}
                {totalPages > 1 && (
                  <div className="enterprise-card px-5 py-3 flex items-center justify-between flex-wrap gap-3">
                    <div className="text-sm text-muted-foreground font-medium">
                      Showing {currentPage * PAGE_SIZE + 1}--{Math.min((currentPage + 1) * PAGE_SIZE, totalElements)} of {totalElements} postings
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                          disabled={currentPage === 0}
                          className="w-[34px] h-[34px] rounded-control border border-border bg-card flex items-center justify-center text-muted-foreground font-semibold text-[0.8125rem] transition-all hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                        </button>
                        {getPageNumbers().map(page => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-[34px] h-[34px] rounded-control border font-semibold text-[0.8125rem] flex items-center justify-center transition-all ${
                              page === currentPage
                                ? 'bg-primary border-primary text-primary-foreground'
                                : 'border-border bg-card text-muted-foreground hover:border-primary hover:text-primary'
                            }`}
                          >
                            {page + 1}
                          </button>
                        ))}
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                          disabled={currentPage >= totalPages - 1}
                          className="w-[34px] h-[34px] rounded-control border border-border bg-card flex items-center justify-center text-muted-foreground font-semibold text-[0.8125rem] transition-all hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Floating Bulk Action Bar */}
            {selectedIds.size > 0 && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground rounded-card shadow-lg px-6 py-3 flex items-center gap-4 z-50 whitespace-nowrap">
                <span className="font-bold text-sm">{selectedIds.size} selected</span>
                <span className="w-px h-6 bg-primary-foreground/30" />
                <select
                  value={bulkStatusAction}
                  onChange={(e) => setBulkStatusAction(e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-full border border-primary-foreground/30 bg-transparent text-primary-foreground font-semibold uppercase tracking-wider cursor-pointer"
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
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-primary-foreground/30 bg-transparent text-primary-foreground text-xs font-semibold uppercase tracking-wider transition-all hover:bg-primary-foreground/15 disabled:opacity-50"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    {bulkActionLoading ? 'Applying...' : 'Apply'}
                  </button>
                )}
                <button
                  onClick={handleBulkExport}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-primary-foreground/30 bg-transparent text-primary-foreground text-xs font-semibold uppercase tracking-wider transition-all hover:bg-primary-foreground/15"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Export
                </button>
                <button
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  disabled={bulkActionLoading}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-accent-pink/60 text-surface-pink text-xs font-semibold uppercase tracking-wider transition-all hover:bg-accent-pink hover:border-accent-pink hover:text-primary-foreground disabled:opacity-50"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  Delete
                </button>
                <span className="w-px h-6 bg-primary-foreground/30" />
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/70 hover:text-primary-foreground transition-colors bg-transparent border-none cursor-pointer"
                >
                  Deselect All
                </button>
              </div>
            )}
          </div>
        )}

        {view === 'workflow' && selectedJobPosting && (
          <div>
            <div className="mb-4">
              <button
                onClick={() => setView('list')}
                className="inline-flex items-center gap-1.5 text-primary hover:text-cta-hover font-semibold text-sm transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                Back to Job Postings
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
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-cta border-2 border-cta text-foreground font-semibold text-sm uppercase tracking-wider rounded-full transition-all hover:bg-cta-hover hover:border-cta-hover"
                  >
                    Publish to All Channels
                  </button>
                </div>
                <div className="mt-3 enterprise-card p-6">
                  <JobBoardManager jobId={String(selectedJobPosting.id)} />
                </div>
              </>
            )}

            {(selectedJobPosting.status === 'PUBLISHED' || selectedJobPosting.status === 'CLOSED') && (
              <div className="mt-6 enterprise-card p-6">
                <ShortlistingPanel
                  jobPostingId={String(selectedJobPosting.id)}
                  currentUserId={currentUserId}
                />
              </div>
            )}

            {(selectedJobPosting.status === 'PUBLISHED' || selectedJobPosting.status === 'CLOSED') && (
              <div className="mt-6 enterprise-card p-6">
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

      {/* Delete Confirmation -- using ConfirmDialog (Issue #5) */}
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

      {showFormModal && (
        <JobPostingForm
          jobPostingId={editingJobPostingId ?? undefined}
          initialData={cloneInitialData ?? undefined}
          currentUserId={currentUserId}
          onSuccess={handleJobPostingSaved}
          onCancel={() => { setShowFormModal(false); setEditingJobPostingId(null); setCloneInitialData(null); }}
          variant="modal"
        />
      )}
    </PageWrapper>
  );
}
