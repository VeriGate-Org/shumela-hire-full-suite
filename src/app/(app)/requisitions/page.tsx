'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import PageWrapper from '@/components/PageWrapper';
import EmptyState from '@/components/EmptyState';
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
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const loadRequisitions = useCallback(async (page: number, status: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('size', String(PAGE_SIZE));
      params.append('sort', 'createdAt');
      if (status !== 'ALL') params.append('status', status);

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
      }
    } catch {
      setRequisitions([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequisitions(currentPage, statusFilter);
  }, [currentPage, statusFilter, loadRequisitions]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setCurrentPage(0);
    }, 400);
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
        await loadRequisitions(currentPage, statusFilter);
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

  // Client-side search filter
  const filtered = searchTerm.trim()
    ? requisitions.filter(
        (r) =>
          r.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.location.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : requisitions;

  const actions = (
    <div className="flex items-center gap-3">
      <button
        onClick={() => loadRequisitions(currentPage, statusFilter)}
        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50"
      >
        <ArrowPathIcon className="w-4 h-4 mr-1.5" />
        Refresh
      </button>
      <Link
        href="/requisitions/new"
        className="inline-flex items-center px-4 py-2 border-2 border-gold-500 text-sm font-medium rounded-full bg-transparent text-violet-900 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider"
      >
        New Requisition
      </Link>
    </div>
  );

  if (loading && requisitions.length === 0) {
    return (
      <PageWrapper title="Requisitions" subtitle="Loading requisitions..." actions={actions}>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
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
        <div className="bg-white rounded-[10px] border border-gray-200 p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by job title, department, or location..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
                />
              </div>
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="w-full py-2 px-3 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              {totalElements} requisition{totalElements !== 1 ? 's' : ''}
              {loading && <span className="ml-2 text-gray-400">(loading...)</span>}
            </p>
          </div>
        </div>

        {/* Requisitions Table */}
        <div className="bg-white rounded-[10px] border border-gray-200 overflow-hidden">
          {filtered.length === 0 ? (
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
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Salary Range
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtered.map((requisition) => (
                    <tr key={requisition.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/requisitions/${requisition.id}`}
                          className="text-sm font-medium text-gray-900 hover:text-gold-600 transition-colors"
                        >
                          {requisition.jobTitle}
                        </Link>
                        <p className="text-xs text-gray-500 mt-0.5">{requisition.employmentType}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900">{requisition.department}</p>
                        <p className="text-xs text-gray-500">{requisition.location}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <WorkflowStatusBadge status={requisition.status} showProgress={false} size="sm" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-600">
                          {formatSalaryRange(requisition.salaryMin, requisition.salaryMax, false)}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900">{formatDate(String(requisition.createdAt))}</p>
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
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-500">
                Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, totalElements)} of{' '}
                {totalElements}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
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
                  onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
