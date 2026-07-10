'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import PageWrapper from '@/components/PageWrapper';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import { TableSkeleton } from '@/components/LoadingComponents';
import WorkflowStatusBadge from '@/components/WorkflowStatusBadge';
import WorkflowActions from '@/components/WorkflowActions';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import { apiFetch } from '@/lib/api-fetch';
import { formatSalaryRange } from '@/utils/currency';
import { RequisitionData, RequisitionStatus, ApprovalRole, WorkflowAction } from '@/types/workflow';
import RequisitionForm from '@/components/RequisitionForm';
import {
  MagnifyingGlassIcon,
  DocumentTextIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  ClockIcon,
  CheckCircleIcon,
  UserGroupIcon,
  CalendarIcon,
  MapPinIcon,
  BanknotesIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'PENDING_HR_APPROVAL', label: 'Pending HR Approval' },
  { value: 'PENDING_HIRING_MANAGER_APPROVAL', label: 'Pending Manager Approval' },
  { value: 'PENDING_EXECUTIVE_APPROVAL', label: 'Pending Executive Approval' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

type TabKey = 'all' | 'draft' | 'pending' | 'approved' | 'rejected';

const TAB_STATUS_MAP: Record<TabKey, string[]> = {
  all: [],
  draft: ['DRAFT'],
  pending: ['SUBMITTED', 'PENDING_HR_APPROVAL', 'PENDING_HIRING_MANAGER_APPROVAL', 'PENDING_EXECUTIVE_APPROVAL'],
  approved: ['APPROVED'],
  rejected: ['REJECTED'],
};

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 400;

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function RequisitionsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requisitions, setRequisitions] = useState<RequisitionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [showNewRequisitionModal, setShowNewRequisitionModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const loadRequisitions = useCallback(async (page: number, status: string, search: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('size', String(PAGE_SIZE));
      params.append('sort', 'createdAt');
      if (status !== 'ALL') params.append('status', status);
      if (search.trim()) params.append('search', search.trim());

      const response = await apiFetch(`/api/requisitions?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.content) {
          setRequisitions(data.content);
          setTotalPages(data.totalPages ?? 0);
          setTotalElements(data.totalElements ?? 0);
        } else {
          const list = Array.isArray(data) ? data : [];
          setRequisitions(list);
          setTotalPages(1);
          setTotalElements(list.length);
        }
      } else {
        setRequisitions([]);
        setTotalPages(0);
        setTotalElements(0);
        setError('Failed to load requisitions. Please try again.');
      }
    } catch {
      setRequisitions([]);
      setTotalPages(0);
      setTotalElements(0);
      setError('An unexpected error occurred while loading requisitions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequisitions(currentPage, statusFilter, debouncedSearch);
  }, [currentPage, statusFilter, debouncedSearch, loadRequisitions]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setCurrentPage(0);
    }, SEARCH_DEBOUNCE_MS);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(0);
  };

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setCurrentPage(0);
    // Map tab to status filter for the API
    const statuses = TAB_STATUS_MAP[tab];
    if (statuses.length === 0) {
      handleStatusFilterChange('ALL');
    } else if (statuses.length === 1) {
      handleStatusFilterChange(statuses[0]);
    } else {
      // For pending tab which covers multiple statuses, use ALL and filter client-side
      handleStatusFilterChange('ALL');
    }
  };

  // Client-side filtering for tabs that span multiple statuses
  const filteredRequisitions = useMemo(() => {
    const tabStatuses = TAB_STATUS_MAP[activeTab];
    if (tabStatuses.length === 0) return requisitions;
    return requisitions.filter((r) => tabStatuses.includes(r.status));
  }, [requisitions, activeTab]);

  // Compute counts per tab from all loaded requisitions
  const tabCounts = useMemo(() => {
    const counts: Record<TabKey, number> = { all: 0, draft: 0, pending: 0, approved: 0, rejected: 0 };
    counts.all = requisitions.length;
    requisitions.forEach((r) => {
      if (TAB_STATUS_MAP.draft.includes(r.status)) counts.draft++;
      if (TAB_STATUS_MAP.pending.includes(r.status)) counts.pending++;
      if (TAB_STATUS_MAP.approved.includes(r.status)) counts.approved++;
      if (TAB_STATUS_MAP.rejected.includes(r.status)) counts.rejected++;
    });
    return counts;
  }, [requisitions]);

  const handleWorkflowAction = async (requisitionId: string, action: WorkflowAction, comment?: string) => {
    if (!user) return;

    try {
      let endpoint = '';
      const body: Record<string, unknown> = { userId: user.id, comment };

      switch (action) {
        case WorkflowAction.SUBMIT:
          endpoint = `/api/requisitions/${requisitionId}/submit`;
          break;
        case WorkflowAction.APPROVE:
          endpoint = `/api/requisitions/${requisitionId}/approve?role=${encodeURIComponent(user.role)}`;
          break;
        case WorkflowAction.REJECT:
          endpoint = `/api/requisitions/${requisitionId}/reject?role=${encodeURIComponent(user.role)}`;
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      const response = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (response.ok) {
        await loadRequisitions(currentPage, statusFilter, debouncedSearch);
        toast('Action completed successfully', 'success');
      } else {
        const result = await response.json().catch(() => null);
        toast(`Error: ${result?.message || 'Action failed'}`, 'error');
      }
    } catch (err) {
      console.error('Error performing workflow action:', err);
      toast('An error occurred while processing the action', 'error');
    }
  };

  const actions = (
    <div className="flex items-center gap-3">
      <button
        onClick={() => loadRequisitions(currentPage, statusFilter, debouncedSearch)}
        aria-label="Refresh requisitions list"
        className="inline-flex items-center px-3 py-2 border border-border text-sm font-medium rounded-full text-foreground bg-card hover:bg-accent"
      >
        <ArrowPathIcon className="w-4 h-4 mr-1.5" />
        Refresh
      </button>
      <button
        onClick={() => setShowNewRequisitionModal(true)}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm uppercase tracking-wider bg-cta border-2 border-cta text-cta-foreground hover:bg-cta-hover hover:border-cta-hover transition-all"
      >
        <PlusIcon className="w-4 h-4" />
        New Requisition
      </button>
    </div>
  );

  /* ================================================================
   *  SKELETON LOADING STATE
   * ================================================================ */
  if (loading && requisitions.length === 0 && !error) {
    return (
      <PageWrapper title="Requisitions" subtitle="Create headcount requests and track approval workflows" actions={actions}>
        <div className="space-y-6">
          {/* Skeleton Stat Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="enterprise-card p-5">
                <div className="flex items-center gap-4">
                  <div className="w-[52px] h-[52px] rounded-xl loading-shimmer animate-pulse shrink-0" />
                  <div className="flex-1">
                    <div className="h-5 w-1/2 loading-shimmer rounded animate-pulse mb-2" />
                    <div className="h-3 w-3/4 loading-shimmer rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Skeleton Tabs */}
          <div className="enterprise-card overflow-hidden">
            <div className="flex gap-4 px-6 py-4 border-b border-border">
              {[80, 130, 90, 90].map((w, i) => (
                <div key={i} className="loading-shimmer animate-pulse rounded" style={{ width: w, height: 20 }} />
              ))}
            </div>
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="loading-shimmer animate-pulse rounded-xl" style={{ height: 120 }} />
              ))}
            </div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  /* ================================================================
   *  STAT CARDS DATA
   * ================================================================ */
  const pendingCount = requisitions.filter((r) =>
    TAB_STATUS_MAP.pending.includes(r.status)
  ).length;
  const approvedCount = requisitions.filter((r) => r.status === 'APPROVED').length;

  const stats = [
    {
      label: 'Total Requisitions',
      value: totalElements,
      icon: DocumentTextIcon,
      iconColor: 'text-accent-navy',
      iconBg: 'bg-icon-bg-navy',
    },
    {
      label: 'Pending Approval',
      value: pendingCount,
      icon: ClockIcon,
      iconColor: 'text-accent-teal',
      iconBg: 'bg-icon-bg-teal',
    },
    {
      label: 'Approved',
      value: approvedCount,
      icon: CheckCircleIcon,
      iconColor: 'text-accent-gold',
      iconBg: 'bg-icon-bg-gold',
    },
    {
      label: 'Avg Approval Time',
      value: '--',
      suffix: 'days',
      icon: ArrowPathIcon,
      iconColor: 'text-accent-pink',
      iconBg: 'bg-icon-bg-pink',
    },
  ];

  /* ================================================================
   *  TAB DEFINITIONS
   * ================================================================ */
  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: tabCounts.all },
    { key: 'draft', label: 'Draft', count: tabCounts.draft },
    { key: 'pending', label: 'Pending Approval', count: tabCounts.pending },
    { key: 'approved', label: 'Approved', count: tabCounts.approved },
    { key: 'rejected', label: 'Rejected', count: tabCounts.rejected },
  ];

  /* ================================================================
   *  RENDER
   * ================================================================ */
  return (
    <PageWrapper
      title="Requisitions"
      subtitle="Create headcount requests and track approval workflows"
      actions={actions}
    >
      <div className="space-y-6">
        {/* ========== STAT STRIP ========== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="enterprise-card p-5 flex items-center gap-4 hover:-translate-y-px"
            >
              <div
                className={`shrink-0 w-[52px] h-[52px] rounded-xl flex items-center justify-center ${stat.iconBg}`}
              >
                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-foreground leading-tight">
                  {stat.value}
                  {stat.suffix && (
                    <span className="text-sm font-semibold text-muted-foreground ml-1">
                      {stat.suffix}
                    </span>
                  )}
                </div>
                <div className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ========== TABBED CONTENT CONTAINER ========== */}
        <div className="enterprise-card overflow-hidden">
          {/* ---- Tab Header ---- */}
          <div className="flex border-b border-border px-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`relative top-px px-5 py-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'text-primary border-primary'
                    : 'text-muted-foreground border-transparent hover:text-primary'
                }`}
              >
                {tab.label}
                <span
                  className={`ml-1.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold ${
                    activeTab === tab.key
                      ? 'bg-[var(--icon-bg-navy)] text-primary'
                      : 'bg-border text-muted-foreground'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* ---- Search inside tabs ---- */}
          <div className="px-6 pt-5 pb-3">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="relative flex-1 max-w-lg">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by job title, department, or location..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  aria-label="Search requisitions by job title, department, or location"
                  className="pl-10 pr-4 py-2.5 w-full border border-border rounded-control bg-card text-foreground focus:ring-2 focus:ring-ring/40 focus:border-ring text-sm"
                />
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilterChange(e.target.value)}
                  aria-label="Filter requisitions by status"
                  className="py-2.5 px-3 border border-border rounded-control bg-card text-foreground focus:ring-2 focus:ring-ring/40 focus:border-ring text-sm"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-muted-foreground whitespace-nowrap">
                  {filteredRequisitions.length} result{filteredRequisitions.length !== 1 ? 's' : ''}
                  {loading && <span className="ml-1 text-muted-foreground/60">(loading...)</span>}
                </p>
              </div>
            </div>
          </div>

          {/* ---- Tab Panel Content ---- */}
          <div className="px-6 pb-6">
            {/* Error State */}
            {error && (
              <ErrorState
                title="Failed to load requisitions"
                message={error}
                onRetry={() => loadRequisitions(currentPage, statusFilter, debouncedSearch)}
              />
            )}

            {/* Empty State */}
            {!error && filteredRequisitions.length === 0 && (
              <EmptyState
                icon={DocumentTextIcon}
                title="No requisitions found"
                description={
                  activeTab !== 'all' || searchTerm
                    ? 'No requisitions match your current filters. Try adjusting your search or switching tabs.'
                    : 'No requisitions are available at this time.'
                }
              />
            )}

            {/* Requisition Cards */}
            {!error && filteredRequisitions.length > 0 && (
              <div className="space-y-4">
                {filteredRequisitions.map((requisition) => (
                  <RequisitionCard
                    key={requisition.id}
                    requisition={requisition}
                    user={user}
                    onWorkflowAction={handleWorkflowAction}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ---- Pagination ---- */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-muted/50">
              <p className="text-sm text-muted-foreground">
                Showing {currentPage * PAGE_SIZE + 1}&ndash;{Math.min((currentPage + 1) * PAGE_SIZE, totalElements)} of{' '}
                {totalElements}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  aria-label="Go to previous page"
                  className="p-1.5 rounded-full text-muted-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
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
                          ? 'bg-gold-500 text-violet-950'
                          : 'text-muted-foreground hover:bg-accent'
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage >= totalPages - 1}
                  aria-label="Go to next page"
                  className="p-1.5 rounded-full text-muted-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showNewRequisitionModal && (
        <RequisitionForm
          variant="modal"
          onCancel={() => setShowNewRequisitionModal(false)}
          onSuccess={() => {
            setShowNewRequisitionModal(false);
            loadRequisitions(currentPage, statusFilter, debouncedSearch);
          }}
        />
      )}
    </PageWrapper>
  );
}

/* ==================================================================
 *  REQUISITION CARD COMPONENT
 *  Matches the mock's req-card layout: header (title + badges),
 *  meta row, approval timeline, and action buttons.
 * ================================================================== */

interface RequisitionCardProps {
  requisition: RequisitionData;
  user: ReturnType<typeof import('@/contexts/AuthContext').useAuth>['user'];
  onWorkflowAction: (requisitionId: string, action: WorkflowAction, comment?: string) => Promise<void>;
}

function RequisitionCard({ requisition, user, onWorkflowAction }: RequisitionCardProps) {
  const isPending = [
    RequisitionStatus.SUBMITTED,
    RequisitionStatus.PENDING_HR_APPROVAL,
    RequisitionStatus.PENDING_HIRING_MANAGER_APPROVAL,
    RequisitionStatus.PENDING_EXECUTIVE_APPROVAL,
  ].includes(requisition.status);

  const isApproved = requisition.status === RequisitionStatus.APPROVED;
  const isRejected = requisition.status === RequisitionStatus.REJECTED;
  const isDraft = requisition.status === RequisitionStatus.DRAFT;

  return (
    <div className="border border-border rounded-xl p-5 bg-card transition-all hover:shadow-[var(--shadow-sm)]">
      {/* ---- Card Header: Title + Badges ---- */}
      <div className="flex items-start justify-between mb-3">
        <Link
          href={`/requisitions/${requisition.id}`}
          className="text-[15px] font-bold text-foreground hover:text-primary transition-colors"
        >
          {requisition.jobTitle}
        </Link>
        <div className="flex items-center gap-2 shrink-0 ml-4">
          <WorkflowStatusBadge status={requisition.status} showProgress={false} size="sm" />
        </div>
      </div>

      {/* ---- Meta Row ---- */}
      <div className="flex flex-wrap gap-4 text-[13px] text-muted-foreground mb-4">
        <span className="inline-flex items-center gap-1.5">
          <UserGroupIcon className="w-3.5 h-3.5 shrink-0" />
          {requisition.department}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MapPinIcon className="w-3.5 h-3.5 shrink-0" />
          {requisition.location}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
          {formatDate(String(requisition.createdAt))}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <BanknotesIcon className="w-3.5 h-3.5 shrink-0" />
          {formatSalaryRange(requisition.salaryMin, requisition.salaryMax, false)}
        </span>
        {requisition.employmentType && (
          <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
            {requisition.employmentType}
          </span>
        )}
      </div>

      {/* ---- Approval Timeline (for non-draft statuses) ---- */}
      {(isPending || isApproved || isRejected) && requisition.approvalHistory && requisition.approvalHistory.length > 0 && (
        <ApprovalTimeline requisition={requisition} />
      )}

      {/* ---- Rejection reason ---- */}
      {isRejected && requisition.approvalHistory && (() => {
        const rejectionEntry = [...requisition.approvalHistory].reverse().find(
          (h) => h.action === WorkflowAction.REJECT && h.comment
        );
        return rejectionEntry ? (
          <div className="bg-[var(--error-bg)] rounded-control px-3.5 py-2.5 mb-4 text-sm text-destructive">
            <strong>Rejection Reason:</strong> {rejectionEntry.comment}
          </div>
        ) : null;
      })()}

      {/* ---- Card Actions ---- */}
      <div className="flex items-center justify-end gap-2">
        {user && (
          <WorkflowActions
            requisition={requisition}
            userRole={user.role as ApprovalRole}
            onAction={(action, comment) => onWorkflowAction(requisition.id, action, comment)}
          />
        )}
        <Link
          href={`/requisitions/${requisition.id}`}
          className="inline-flex items-center px-4 py-2 border border-border text-sm font-semibold rounded-full text-muted-foreground hover:border-primary hover:text-primary hover:bg-[var(--surface-navy)] uppercase tracking-wider transition-all"
        >
          View
        </Link>
      </div>
    </div>
  );
}

/* ==================================================================
 *  APPROVAL TIMELINE COMPONENT
 *  Horizontal step-connector timeline matching the mock design.
 * ================================================================== */

function ApprovalTimeline({ requisition }: { requisition: RequisitionData }) {
  // Build timeline steps from approval history
  const steps = buildTimelineSteps(requisition);

  if (steps.length === 0) return null;

  return (
    <div className="flex items-center gap-0 mb-4 py-3.5 px-4 bg-background rounded-control overflow-x-auto">
      {steps.map((step, idx) => (
        <div key={idx} className="contents">
          {/* Connector before each step (except the first) */}
          {idx > 0 && (
            <div
              className={`shrink-0 w-8 h-0.5 mx-1 ${
                step.state === 'completed' || steps[idx - 1].state === 'completed'
                  ? step.state === 'rejected' ? 'bg-destructive' : 'bg-green-500'
                  : 'bg-border'
              }`}
            />
          )}

          {/* Step */}
          <div className="flex items-center gap-2 shrink-0">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                step.state === 'completed'
                  ? 'bg-green-500 text-white'
                  : step.state === 'current'
                  ? 'bg-warning text-white animate-pulse'
                  : step.state === 'rejected'
                  ? 'bg-destructive text-white'
                  : 'bg-border text-muted-foreground'
              }`}
            >
              {step.state === 'completed' ? (
                <CheckCircleIcon className="w-3.5 h-3.5" />
              ) : step.state === 'rejected' ? (
                <span className="text-xs">&times;</span>
              ) : step.state === 'current' ? (
                <span className="w-2 h-2 rounded-full bg-white" />
              ) : (
                idx + 1
              )}
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground">{step.label}</div>
              <div className="text-[10px] text-muted-foreground font-medium">{step.sublabel}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface TimelineStep {
  label: string;
  sublabel: string;
  state: 'completed' | 'current' | 'pending' | 'rejected';
}

function buildTimelineSteps(requisition: RequisitionData): TimelineStep[] {
  const history = requisition.approvalHistory || [];
  const status = requisition.status;

  // Define the workflow stages
  const stages: { label: string; statusBefore: RequisitionStatus[]; statusAfter: RequisitionStatus }[] = [
    { label: 'Submitted', statusBefore: [RequisitionStatus.DRAFT], statusAfter: RequisitionStatus.SUBMITTED },
    { label: 'Manager', statusBefore: [RequisitionStatus.SUBMITTED], statusAfter: RequisitionStatus.PENDING_HR_APPROVAL },
    { label: 'HR Director', statusBefore: [RequisitionStatus.PENDING_HR_APPROVAL], statusAfter: RequisitionStatus.PENDING_EXECUTIVE_APPROVAL },
    { label: 'Executive', statusBefore: [RequisitionStatus.PENDING_EXECUTIVE_APPROVAL], statusAfter: RequisitionStatus.APPROVED },
    { label: 'Final', statusBefore: [], statusAfter: RequisitionStatus.APPROVED },
  ];

  const steps: TimelineStep[] = [];

  // Determine how far the requisition has progressed
  const statusOrder: RequisitionStatus[] = [
    RequisitionStatus.DRAFT,
    RequisitionStatus.SUBMITTED,
    RequisitionStatus.PENDING_HIRING_MANAGER_APPROVAL,
    RequisitionStatus.PENDING_HR_APPROVAL,
    RequisitionStatus.PENDING_EXECUTIVE_APPROVAL,
    RequisitionStatus.APPROVED,
  ];

  const currentIdx = statusOrder.indexOf(status);
  const isCurrentlyRejected = status === RequisitionStatus.REJECTED;

  // Submit step
  const submitEntry = history.find((h) => h.action === WorkflowAction.SUBMIT);
  if (submitEntry || currentIdx >= 1 || isCurrentlyRejected) {
    steps.push({
      label: 'Submitted',
      sublabel: submitEntry ? formatDate(String(submitEntry.timestamp)) : '--',
      state: 'completed',
    });
  }

  // Approval steps from history
  const approvalEntries = history.filter((h) => h.action === WorkflowAction.APPROVE);
  const rejectionEntry = history.find((h) => h.action === WorkflowAction.REJECT);

  const approverLabels = ['Manager', 'HR Director', 'Executive'];
  for (let i = 0; i < approverLabels.length; i++) {
    const entry = approvalEntries[i];
    if (entry) {
      steps.push({
        label: approverLabels[i],
        sublabel: formatDate(String(entry.timestamp)),
        state: 'completed',
      });
    } else if (isCurrentlyRejected && rejectionEntry && i === approvalEntries.length) {
      // This is the stage where rejection happened
      steps.push({
        label: approverLabels[i],
        sublabel: `Rejected ${formatDate(String(rejectionEntry.timestamp))}`,
        state: 'rejected',
      });
      // Show remaining as pending
      for (let j = i + 1; j < approverLabels.length; j++) {
        steps.push({ label: approverLabels[j], sublabel: '\u2014', state: 'pending' });
      }
      break;
    } else if (i === approvalEntries.length && !isCurrentlyRejected) {
      // Current awaiting step
      steps.push({ label: approverLabels[i], sublabel: 'Awaiting', state: 'current' });
      // Remaining as pending
      for (let j = i + 1; j < approverLabels.length; j++) {
        steps.push({ label: approverLabels[j], sublabel: '\u2014', state: 'pending' });
      }
      break;
    } else {
      steps.push({ label: approverLabels[i], sublabel: '\u2014', state: 'pending' });
    }
  }

  // Final step
  if (status === RequisitionStatus.APPROVED) {
    steps.push({ label: 'Approved', sublabel: formatDate(String(requisition.updatedAt)), state: 'completed' });
  } else if (isCurrentlyRejected) {
    steps.push({ label: 'Rejected', sublabel: '\u2014', state: 'pending' });
  } else {
    steps.push({ label: 'Approved', sublabel: '\u2014', state: 'pending' });
  }

  return steps;
}
