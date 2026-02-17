'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { RequisitionData, RequisitionStatus, ApprovalRole, WorkflowAction } from '../types/workflow';
import EmptyState from './EmptyState';
import { useAuth } from '../contexts/AuthContext';
import { formatSalaryRange } from '../utils/currency';
import WorkflowStatusBadge from './WorkflowStatusBadge';
import WorkflowActions from './WorkflowActions';

interface RequisitionListProps {
  filterStatus?: RequisitionStatus;
  showActions?: boolean;
  showAll?: boolean; // When true, shows all requisitions regardless of role or status
}

const RequisitionList: React.FC<RequisitionListProps> = ({
  filterStatus,
  showActions = true,
  showAll = false
}) => {
  const { user } = useAuth();
  const [requisitions, setRequisitions] = useState<RequisitionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequisitions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let url = '/api/requisitions';
      const params = new URLSearchParams();

      if (filterStatus) {
        params.append('status', filterStatus);
      } else if (!showAll && user?.role) {
        // Show pending requisitions for current user role (only if not showing all)
        params.append('role', user.role);
      }
      // If showAll is true and no filterStatus, fetch all requisitions without filters

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setRequisitions(data.data);
      } else {
        setError(data.message || 'Failed to fetch requisitions');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error fetching requisitions:', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, user?.role]);

  useEffect(() => {
    fetchRequisitions();
  }, [fetchRequisitions]);

  const handleWorkflowAction = async (requisitionId: string, action: WorkflowAction, comment?: string) => {
    if (!user) return;

    try {
      let endpoint = '';
      const method = 'POST';
      const body: Record<string, unknown> = {
        userId: user.id,
        comment
      };

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

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const result = await response.json();

      if (result.success) {
        // Refresh the list
        await fetchRequisitions();
        alert(result.message);
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (err) {
      console.error('Error performing workflow action:', err);
      alert('An error occurred while processing the action');
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
        <span className="ml-2">Loading requisitions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-sm p-4">
        <p className="text-red-600">Error: {error}</p>
        <button 
          onClick={fetchRequisitions}
          className="mt-2 text-red-800 hover:text-red-900 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (requisitions.length === 0) {
    return (
      <EmptyState
        icon={DocumentTextIcon}
        title="No requisitions found"
        description={
          filterStatus
            ? `No requisitions with status: ${filterStatus}`
            : 'No requisitions are available at this time.'
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {requisitions.map((requisition) => (
        <div key={requisition.id} className="bg-white rounded-sm shadow border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <Link 
                    href={`/requisitions/${requisition.id}`}
                    className="hover:text-gold-600 transition-colors"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 hover:text-gold-600">
                      {requisition.jobTitle}
                    </h3>
                  </Link>
                  <p className="text-sm text-gray-600 mt-1">
                    {requisition.department} • {requisition.location} • {requisition.employmentType}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Requisition #{requisition.id}
                  </p>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <WorkflowStatusBadge status={requisition.status} showProgress />
                  <Link 
                    href={`/requisitions/${requisition.id}`}
                    className="text-xs text-gold-600 hover:text-gold-800 transition-colors"
                  >
                    View Details →
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Salary Range</p>
                  <p className="text-sm text-gray-600">{formatSalaryRange(requisition.salaryMin, requisition.salaryMax)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Created</p>
                  <p className="text-sm text-gray-600">{formatDate(requisition.createdAt)}</p>
                </div>
              </div>

              {requisition.description && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">Description</p>
                  <p className="text-sm text-gray-600 line-clamp-3">{requisition.description}</p>
                </div>
              )}

              {requisition.approvalHistory.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Recent Activity</p>
                  <div className="space-y-1">
                    {requisition.approvalHistory.slice(-2).map((entry, index) => (
                      <p key={index} className="text-xs text-gray-500">
                        {formatDate(entry.timestamp)}: {entry.action} by {entry.approverRole}
                        {entry.comment && ` - "${entry.comment}"`}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {showActions && user && (
              <div className="mt-4 lg:mt-0 lg:ml-6">
                <WorkflowActions
                  requisition={requisition}
                  userRole={user.role as ApprovalRole}
                  onAction={(action, comment) => handleWorkflowAction(requisition.id, action, comment)}
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RequisitionList;