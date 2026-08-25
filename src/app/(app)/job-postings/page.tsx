'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PageWrapper from '@/components/PageWrapper';
import EmptyState from '@/components/EmptyState';
import JobPostingWorkflow from '@/components/JobPostingWorkflow';
import JobBoardManager from '@/components/JobBoardManager';
import MultiChannelPublishWizard from '@/components/MultiChannelPublishWizard';
import VacancyReportActions from '@/components/VacancyReportActions';
import ShortlistingPanel from '@/components/ShortlistingPanel';
import VerificationRequirementsPanel from '@/components/VerificationRequirementsPanel';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api-fetch';
import IdentityBand from '@/components/record/IdentityBand';
import DecisionBar, { PrimaryAction } from '@/components/record/DecisionBar';
import DistributionStrip from '@/components/record/DistributionStrip';
import FilterChips from '@/components/record/FilterChips';
import {
  JobPostingSummary,
  QUEUE_FILTERS,
  byDeadline,
  closesLabel,
  conversionRate,
  daysLive,
  filterCount,
  isPostingSummary,
  requestStatusFor,
  stateOf,
  STATE_LABELS,
} from './queue';
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
  /**
   * Sent by JobPostingResponse and never declared here, which is the whole reason an advert
   * that stopped accepting applications a fortnight ago looked identical to a live one.
   */
  applicationDeadline?: string | null;
  /** Published and the deadline has not passed. Derived on the server, per record. */
  isPublic?: boolean;
  isDeadlinePassed?: boolean;
  applicationsCount: number;
  viewsCount: number;
  featured: boolean;
  urgent: boolean;
  remoteWorkAllowed: boolean;
  requiredCheckTypes?: string | null;
  enforceCheckCompletion?: boolean | null;
}

const PAGE_SIZE = 10;

export default function JobPostingsPage() {
  const router = useRouter();
  const [view, setView] = useState<'list' | 'workflow'>('list');
  const [summary, setSummary] = useState<JobPostingSummary | null>(null);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [selectedJobPosting, setSelectedJobPosting] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('attention');
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

  // The dashboard's "Create Position" button deep-links here with ?action=create. It used to open
  // a modal; it now forwards to the route, so the link keeps working and lands somewhere with an
  // address of its own.
  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      router.replace('/job-postings/new');
    }
  }, [searchParams, router]);

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
      const requested = requestStatusFor(statusFilter);
      if (requested) {
        params.set('status', requested);
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

  /**
   * The rows for the grid.
   *
   * <p>Filtered by the chip's derived state — which is the only way to express "past deadline",
   * since the server has no status for it — and ordered so what has already expired leads.
   */
  const rows = useMemo(() => {
    const states = QUEUE_FILTERS.find((filter) => filter.key === statusFilter)?.states ?? [];
    const matching = states.length === 0
      ? jobPostings
      : jobPostings.filter((posting) => states.includes(stateOf(posting)));
    return byDeadline(matching);
  }, [jobPostings, statusFilter]);

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(0);
  };

  /**
   * Whole-set counts.
   *
   * <p>Left null on failure and validated on arrival: every figure derived from it is then omitted
   * rather than rendered as a zero somebody would act on.
   */
  const loadSummary = useCallback(async () => {
    try {
      const response = await apiFetch('/api/job-postings/summary');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      setSummary(isPostingSummary(payload) ? payload : null);
    } catch {
      setSummary(null);
    }
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  // Clean up debounce timer
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);


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

  /**
   * Copying a vacancy.
   *
   * <p>The fetch and the field-stripping moved to /job-postings/new, which now owns every way of
   * opening this wizard. Two copies of "which fields does the server own" is one too many.
   */
  const handleClone = (jobPosting: JobPosting) => {
    router.push(`/job-postings/new?cloneFrom=${jobPosting.id}`);
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
        onClick={() => router.push('/job-postings/new')}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-cta border-2 border-cta text-cta-foreground font-semibold text-sm uppercase tracking-wider rounded-full transition-all hover:bg-cta-hover hover:border-cta-hover"
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

  return (
    <PageWrapper>
      <div className="space-y-6">
        {view === 'list' && (
          <div>
            {!currentUserId && (
              <div className="mb-6 enterprise-card border-warning bg-warning-bg px-4 py-3 text-sm text-foreground">
                Workflow actions require a valid signed-in user ID for audit tracking.
              </div>
            )}

            <IdentityBand
              actions={pageActions}
              eyebrow="Advert queue"
              title="Job Postings"
              subtitle={
                summary
                  ? `${summary.total} ${summary.total === 1 ? 'advert' : 'adverts'} · ${
                      summary.applicationsReceived
                    } applications received`
                  : 'Counts unavailable'
              }
              figures={
                summary
                  ? [
                      { label: 'Open to applicants', value: summary.openToApplicants },
                      { label: 'Awaiting approval', value: summary.awaitingApproval },
                      {
                        label: 'Past deadline',
                        value: summary.pastDeadline,
                        tone: (summary.pastDeadline > 0 ? 'critical' : undefined) as
                          | 'critical'
                          | undefined,
                      },
                    ]
                  : []
              }
            />

            {summary && summary.pastDeadline > 0 && (
              <DecisionBar
                ask={`${summary.pastDeadline} ${
                  summary.pastDeadline === 1 ? 'advert is' : 'adverts are'
                } past their closing date and still listed as Published.`}
                why={
                  typeof summary.oldestExpiredDays === 'number'
                    ? `They stopped accepting applications when the deadline passed, and nothing closed them. The oldest expired ${
                        summary.oldestExpiredDays
                      } ${summary.oldestExpiredDays === 1 ? 'day' : 'days'} ago.`
                    : 'They stopped accepting applications when the deadline passed, and nothing closed them.'
                }
              >
                <PrimaryAction onClick={() => handleStatusFilterChange('attention')}>
                  Review expired
                </PrimaryAction>
              </DecisionBar>
            )}

            {summary ? (
              <DistributionStrip
                buckets={[
                  { label: 'Draft', count: filterCount(summary, 'draft') ?? 0, detail: 'Not submitted' },
                  {
                    label: 'Awaiting approval',
                    count: summary.awaitingApproval,
                    detail: 'Decision owed',
                  },
                  {
                    label: 'Open to applicants',
                    count: summary.openToApplicants,
                    detail: 'Published, deadline ahead',
                  },
                  {
                    label: 'Past deadline',
                    count: summary.pastDeadline,
                    detail: 'Still marked Published',
                  },
                  { label: 'Closed', count: filterCount(summary, 'closed') ?? 0, detail: 'Deliberately ended' },
                ]}
                footnote={
                  <>
                    Open and past deadline are both status{' '}
                    <b className="font-bold text-foreground">PUBLISHED</b> — the split is the closing
                    date, which nothing acts on when it passes.
                  </>
                }
              />
            ) : (
              !loading && (
                <p className="text-sm text-muted-foreground px-1 mb-4">
                  Counts are unavailable — the summary could not be loaded.
                </p>
              )
            )}

            <FilterChips
              chips={QUEUE_FILTERS.map((filter) => ({
                key: filter.key,
                label: filter.label,
                count: filterCount(summary, filter.key) ?? undefined,
              }))}
              activeKey={statusFilter}
              onChange={handleStatusFilterChange}
              note={
                <>
                  Sorted by <b className="font-bold text-foreground">deadline</b>
                </>
              }
            />

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
            ) : rows.length === 0 ? (
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
                  onClick: () => router.push('/job-postings/new'),
                } : undefined}
              />
            ) : (
              <>
                {/* Job Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
                  {rows.map((jobPosting) => (
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
                        {/* The derived state, not the raw status. An advert whose deadline passed
                            is still PUBLISHED, and wearing that pill beside a genuinely live one is
                            the reason this page could not be read. */}
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-[3px] rounded-full text-[0.6875rem] font-bold uppercase tracking-wider ${
                            stateOf(jobPosting) === 'past-deadline'
                              ? 'bg-error-bg text-error'
                              : jobPosting.statusCssClass
                          }`}
                        >
                          {STATE_LABELS[stateOf(jobPosting)]}
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
                          {/* Days live, not days since creation: daysFromCreation on a draft counts
                              from when somebody started typing. */}
                          <span className="text-muted-foreground">Live for:</span>{' '}
                          {daysLive(jobPosting) === null
                            ? 'Not advertised'
                            : `${daysLive(jobPosting)} days`}
                        </div>
                        <div className="flex items-center gap-2 text-foreground">
                          <svg className="w-3.5 h-3.5 text-muted-foreground shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          {/* viewsCount is on every record and was rendered nowhere. Views against
                              applications is what distinguishes an advert nobody sees from one
                              nobody who sees it applies to — opposite remedies. */}
                          <span className="text-muted-foreground">Reach:</span>{' '}
                          {typeof jobPosting.viewsCount === 'number' ? (
                            <>
                              {jobPosting.viewsCount} views
                              {conversionRate(jobPosting) !== null && (
                                <span className="text-muted-foreground">
                                  {' '}· {conversionRate(jobPosting)!.toFixed(1)}%
                                </span>
                              )}
                            </>
                          ) : (
                            'Not recorded'
                          )}
                        </div>
                        {closesLabel(jobPosting) && (
                          <div className="flex items-center gap-2 text-foreground">
                            <svg className="w-3.5 h-3.5 text-muted-foreground shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            <span className="text-muted-foreground">Closes:</span>{' '}
                            <span
                              className={
                                stateOf(jobPosting) === 'past-deadline'
                                  ? 'text-error font-semibold'
                                  : undefined
                              }
                            >
                              {closesLabel(jobPosting)}
                            </span>
                          </div>
                        )}
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
                      {/* Always visible. These were opacity-0 group-hover:opacity-100, so edit,
                          publish and delete did not exist on a touch device and a keyboard user
                          tabbed onto invisible controls. */}
                      <div className="absolute top-3 right-3">
                        <div className="flex items-center gap-1">
                          {jobPosting.canBeEdited && (
                            <button
                              onClick={() => {
                                router.push(`/job-postings/new?edit=${jobPosting.id}`);
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
              verificationSlot={
                selectedJobPosting.status !== 'CANCELLED' && currentUserId ? (
                  <section
                    aria-label="Verification required before hire"
                    className="rounded-card border border-border bg-card p-5 shadow-sm"
                  >
      {/* The verification a vacancy demands is a property of how it is RUN, not of the
                  advert, so it stays available after approval — when the need for it usually
                  surfaces. The general edit path is closed by then (canBeEdited allows DRAFT and
                  REJECTED only), which is why this writes through its own endpoint. */}
                  <VerificationRequirementsPanel
                    jobPostingId={String(selectedJobPosting.id)}
                    requiredCheckTypes={selectedJobPosting.requiredCheckTypes}
                    enforceCheckCompletion={selectedJobPosting.enforceCheckCompletion}
                    canEdit={user?.role === 'ADMIN' || user?.role === 'HR_MANAGER'}
                    updatedBy={currentUserId}
                    onSaved={(next) => {
                      setSelectedJobPosting((prev) =>
                        prev
                          ? {
                              ...prev,
                              enforceCheckCompletion: next.enforceCheckCompletion,
                              requiredCheckTypes: JSON.stringify(next.requiredCheckTypes),
                            }
                          : prev
                      );
                    }}
                  />
                  </section>
                ) : undefined
              }
            />

            {selectedJobPosting.status === 'PUBLISHED' && (
              <>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowPublishWizard(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-cta border-2 border-cta text-cta-foreground font-semibold text-sm uppercase tracking-wider rounded-full transition-all hover:bg-cta-hover hover:border-cta-hover"
                  >
                    Publish to All Channels
                  </button>
                </div>
                <div className="mt-3 enterprise-card p-6">
                  <JobBoardManager jobId={String(selectedJobPosting.id)} />
                </div>
              </>
            )}

            {/* Shortlisting is available from APPROVED onward, not only once published.
                Applications can already exist against an approved vacancy — the Project
                Manager posting carries 42 — so gating the panel on PUBLISHED hid the
                shortlist from exactly the person who needs it before advertising closes. */}
            {['APPROVED', 'PUBLISHED', 'UNPUBLISHED', 'CLOSED'].includes(selectedJobPosting.status) && (
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

    </PageWrapper>
  );
}
