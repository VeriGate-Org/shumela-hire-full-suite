'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
import { RequisitionData, ApprovalRole, WorkflowAction } from '@/types/workflow';
import {
  MagnifyingGlassIcon,
  DocumentTextIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon,
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
      <Link
        href="/requisitions/new"
        className="inline-flex items-center px-4 py-2 border-2 border-gold-500 text-sm font-medium rounded-full bg-transparent text-gold-500 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider"
      >
        New Requisition
      </Link>
    </div>
  );

  if (loading && requisitions.length === 0 && !error) {
    return (
      <PageWrapper title="Requisitions" subtitle="Loading requisitions..." actions={actions}>
        <div className="space-y-6">
          <div className="enterprise-card p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div className="h-10 loading-shimmer rounded animate-pulse" />
              </div>
              <div>
                <div className="h-10 loading-shimmer rounded animate-pulse" />
              </div>
            </div>
          </div>
          <div className="enterprise-card overflow-hidden">
            <TableSkeleton rows={8} columns={6} />
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Requisitions"
      subtitle="Manage and track hiring requisitions through the approval workflow"
      actions={actions}
    >
      <div className="space-y-6">
        {/* Search and Filters */}
        <div className="enterprise-card p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by job title, department, or location..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  aria-label="Search requisitions by job title, department, or location"
                  className="pl-10 pr-4 py-2 w-full border border-border rounded-sm focus:ring-2 focus:ring-ring/40 focus:border-ring"
                />
              </div>
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                aria-label="Filter requisitions by status"
                className="w-full py-2 px-3 border border-border rounded-sm focus:ring-2 focus:ring-ring/40 focus:border-ring"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              {totalElements} requisition{totalElements !== 1 ? 's' : ''}
              {loading && <span className="ml-2 text-muted-foreground/60">(loading...)</span>}
            </p>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <ErrorState
            title="Failed to load requisitions"
            message={error}
            onRetry={() => loadRequisitions(currentPage, statusFilter, debouncedSearch)}
          />
        )}

        {/* Requisitions Table */}
        {!error && (
          <div className="enterprise-card overflow-hidden">
            {requisitions.length === 0 ? (
              <EmptyState
                icon={DocumentTextIcon}
                title="No requisitions found"
                description={
                  statusFilter !== 'ALL' || searchTerm
                    ? 'No requisitions match your filters. Try adjusting your search or filter criteria.'
                    : 'No requisitions are available at this time.'
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Position
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Salary Range
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {requisitions.map((requisition) => (
                      <tr key={requisition.id} className="hover:bg-accent transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/requisitions/${requisition.id}`}
                            className="text-sm font-medium text-foreground hover:text-gold-600 transition-colors"
                          >
                            {requisition.jobTitle}
                          </Link>
                          <p className="text-xs text-muted-foreground mt-0.5">{requisition.employmentType}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-foreground">{requisition.department}</p>
                          <p className="text-xs text-muted-foreground">{requisition.location}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <WorkflowStatusBadge status={requisition.status} showProgress={false} size="sm" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-muted-foreground">
                            {formatSalaryRange(requisition.salaryMin, requisition.salaryMax, false)}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-foreground">{formatDate(String(requisition.createdAt))}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-3">
                            {user && (
                              <WorkflowActions
                                requisition={requisition}
                                userRole={user.role as ApprovalRole}
                                onAction={(action, comment) => handleWorkflowAction(requisition.id, action, comment)}
                              />
                            )}
                            <Link
                              href={`/requisitions/${requisition.id}`}
                              className="text-gold-600 hover:text-gold-800 text-sm font-medium"
                            >
                              View
                            </Link>
                          </div>
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
                  Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, totalElements)} of{' '}
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
        )}
      </div>
    </PageWrapper>
  );
}
