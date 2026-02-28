'use client';

import React, { useState } from 'react';
import { apiFetch } from '@/lib/api-fetch';

interface JobPostingWorkflowProps {
  jobPosting: {
    id: number;
    title: string;
    department: string;
    status: string;
    statusDisplayName: string;
    statusCssClass: string;
    statusIcon: string;
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
  };
  onStatusChange?: (jobPostingId: number, newStatus: string) => void;
  currentUserId?: number;
}

export default function JobPostingWorkflow({ jobPosting, onStatusChange, currentUserId }: JobPostingWorkflowProps) {
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const workflowSteps = [
    { key: 'DRAFT', label: 'Draft', marker: '1', description: 'Job posting is being created' },
    { key: 'PENDING_APPROVAL', label: 'Pending Approval', marker: '2', description: 'Waiting for approval' },
    { key: 'APPROVED', label: 'Approved', marker: '3', description: 'Approved and ready to publish' },
    { key: 'PUBLISHED', label: 'Published', marker: '4', description: 'Live and accepting applications' },
    { key: 'CLOSED', label: 'Closed', marker: '5', description: 'No longer accepting applications' }
  ];

  const getCurrentStepIndex = () => {
    return workflowSteps.findIndex(step => step.key === jobPosting.status);
  };

  const isStepCompleted = (stepIndex: number) => {
    const currentIndex = getCurrentStepIndex();
    return stepIndex < currentIndex && !isTerminalStatus();
  };

  const isStepCurrent = (stepIndex: number) => {
    return stepIndex === getCurrentStepIndex() && !isTerminalStatus();
  };

  const isTerminalStatus = () => {
    return ['REJECTED', 'CANCELLED', 'CLOSED'].includes(jobPosting.status);
  };

  const getTerminalStatusInfo = () => {
    switch (jobPosting.status) {
      case 'REJECTED':
        return {
          title: 'Job Posting Rejected',
          description: jobPosting.rejectionReason || 'Job posting was rejected during approval process',
          color: 'text-red-600',
          bgColor: 'bg-red-50'
        };
      case 'CANCELLED':
        return {
          title: 'Job Posting Cancelled',
          description: 'Job posting was cancelled',
          color: 'text-red-600',
          bgColor: 'bg-red-50'
        };
      default:
        return null;
    }
  };

  const handleWorkflowAction = async (action: string, notes?: string) => {
    if (!currentUserId || !Number.isFinite(currentUserId)) {
      setActionFeedback({
        type: 'error',
        message: 'Unable to determine the current user for audit tracking. Please sign in again.',
      });
      return;
    }

    if (action === 'reject' && !notes?.trim()) {
      setActionFeedback({
        type: 'error',
        message: 'Rejection reason is required before rejecting a job posting.',
      });
      return;
    }

    try {
      setLoading(action);
      setActionFeedback(null);
      const payload = new URLSearchParams();

      switch (action) {
        case 'submit-for-approval':
          payload.append('submittedBy', String(currentUserId));
          break;
        case 'approve':
          payload.append('approvedBy', String(currentUserId));
          if (notes?.trim()) payload.append('approvalNotes', notes.trim());
          break;
        case 'reject':
          payload.append('rejectedBy', String(currentUserId));
          payload.append('rejectionReason', notes?.trim() || '');
          break;
        case 'publish':
          payload.append('publishedBy', String(currentUserId));
          break;
        case 'unpublish':
          payload.append('unpublishedBy', String(currentUserId));
          break;
        case 'close':
          payload.append('closedBy', String(currentUserId));
          break;
      }

      const response = await apiFetch(`/api/job-postings/${jobPosting.id}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: payload.toString(),
      });

      if (response.ok) {
        const updatedJobPosting = await response.json();
        if (onStatusChange) {
          onStatusChange(jobPosting.id, updatedJobPosting.status);
        }
        setActionFeedback({
          type: 'success',
          message: `Successfully completed "${action.replace('-', ' ')}".`,
        });

        // Reset forms
        setShowApprovalForm(false);
        setShowRejectionForm(false);
        setApprovalNotes('');
        setRejectionReason('');
      } else {
        let message = `Failed to ${action.replace('-', ' ')}`;
        try {
          const errorData = await response.json();
          if (errorData?.message) {
            message = errorData.message;
          }
        } catch {
          // Leave default message when response body is not JSON.
        }
        setActionFeedback({ type: 'error', message });
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      setActionFeedback({
        type: 'error',
        message: `An unexpected error occurred while performing "${action.replace('-', ' ')}".`,
      });
    } finally {
      setLoading(null);
    }
  };

  const terminalInfo = getTerminalStatusInfo();

  return (
    <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{jobPosting.title}</h3>
            <p className="text-gray-600">{jobPosting.department}</p>
          </div>
          <div className="text-right">
            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${jobPosting.statusCssClass}`}>
              {jobPosting.statusDisplayName}
            </span>
            <p className="text-sm text-gray-500 mt-1">
              Created {jobPosting.daysFromCreation} days ago
            </p>
          </div>
        </div>
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
          <div>
            <p className="text-sm font-medium text-gray-700">Views</p>
            <p className="text-lg font-semibold text-gray-900">{jobPosting.viewsCount}</p>
          </div>
        </div>
        
        <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
          <div>
            <p className="text-sm font-medium text-gray-700">Applications</p>
            <p className="text-lg font-semibold text-gray-900">{jobPosting.applicationsCount}</p>
          </div>
        </div>
        
        <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
          <div>
            <p className="text-sm font-medium text-gray-700">Days Published</p>
            <p className="text-lg font-semibold text-gray-900">
              {jobPosting.status === 'PUBLISHED' ? jobPosting.daysFromPublication : 'Not published'}
            </p>
          </div>
        </div>
      </div>

      {/* Terminal Status Display */}
      {terminalInfo && (
        <div className={`${terminalInfo.bgColor} mb-6 rounded-md border border-gray-200 p-4`}>
          <div className="flex items-center">
            <div>
              <h4 className={`font-medium ${terminalInfo.color}`}>{terminalInfo.title}</h4>
              <p className="text-gray-700 text-sm">{terminalInfo.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Progress - Only show for active (non-terminal) job postings */}
      {!isTerminalStatus() && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-4">Workflow Progress</h4>
          <div className="space-y-4">
            {workflowSteps.map((step, index) => {
              const isUnpublishedAtPublishStep = jobPosting.status === 'UNPUBLISHED' && step.key === 'PUBLISHED';
              const completed = isStepCompleted(index) && !isUnpublishedAtPublishStep;
              const current = isStepCurrent(index);

              return (
                <div key={step.key} className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      isUnpublishedAtPublishStep ? 'bg-orange-500 text-white' :
                      completed ? 'bg-green-500 text-white' :
                      current ? 'bg-gold-500 text-white' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {isUnpublishedAtPublishStep ? '!' :
                       completed ? '\u2713' : step.marker}
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${
                        isUnpublishedAtPublishStep || completed || current ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {isUnpublishedAtPublishStep ? 'Unpublished' : step.label}
                      </p>
                      {isUnpublishedAtPublishStep && (
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                          Unpublished
                        </span>
                      )}
                      {current && (
                        <span className="text-xs bg-gold-100 text-gold-800 px-2 py-1 rounded">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">
                      {isUnpublishedAtPublishStep ? 'Can be republished or closed' : step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Workflow Actions */}
      <div className="space-y-4">
        {actionFeedback && (
          <div
            className={`rounded-md border px-4 py-3 text-sm ${
              actionFeedback.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-300 bg-red-50 text-red-700'
            }`}
          >
            {actionFeedback.message}
          </div>
        )}

        {jobPosting.canBeSubmittedForApproval && (
          <button
            onClick={() => handleWorkflowAction('submit-for-approval')}
            disabled={loading === 'submit-for-approval'}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-sm shadow-sm text-sm font-medium text-violet-900 bg-transparent border-2 border-gold-500 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider disabled:opacity-50"
          >
            {loading === 'submit-for-approval' ? 'Submitting...' : 'Submit for Approval'}
          </button>
        )}

        {jobPosting.canBeApproved && (
          <div className="space-y-2">
            {!showApprovalForm ? (
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowApprovalForm(true)}
                  className="flex-1 rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700"
                >
                  Approve Job Posting
                </button>
                <button
                  onClick={() => setShowRejectionForm(true)}
                  className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  Reject Job Posting
                </button>
              </div>
            ) : (
              <div className="rounded-md border border-gray-200 p-4">
                <h5 className="font-medium text-gray-900 mb-2">Approve Job Posting</h5>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Optional approval notes..."
                  className="w-full rounded-md border border-gray-300 p-2 focus:border-violet-400 focus:ring-2 focus:ring-gold-500/60"
                  rows={3}
                />
                <div className="flex justify-end space-x-2 mt-3">
                  <button
                    onClick={() => setShowApprovalForm(false)}
                    className="px-3 py-1 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleWorkflowAction('approve', approvalNotes)}
                    disabled={loading === 'approve'}
                    className="rounded-md bg-green-600 px-4 py-1 text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading === 'approve' ? 'Approving...' : 'Confirm Approval'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {jobPosting.canBeRejected && showRejectionForm && (
          <div className="rounded-md border border-gray-200 p-4">
            <h5 className="font-medium text-gray-900 mb-2">Reject Job Posting</h5>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please provide a reason for rejection..."
              className="w-full rounded-md border border-gray-300 p-2 focus:border-violet-400 focus:ring-2 focus:ring-gold-500/60"
              rows={3}
              required
            />
            <div className="flex justify-end space-x-2 mt-3">
              <button
                onClick={() => setShowRejectionForm(false)}
                className="px-3 py-1 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleWorkflowAction('reject', rejectionReason)}
                disabled={loading === 'reject' || !rejectionReason.trim()}
                className="rounded-md bg-red-600 px-4 py-1 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {loading === 'reject' ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        )}

        {jobPosting.canBePublished && (
          <button
            onClick={() => handleWorkflowAction('publish')}
            disabled={loading === 'publish'}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-sm shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            {loading === 'publish' ? 'Publishing...' : 'Publish Job Posting'}
          </button>
        )}

        {jobPosting.canBeUnpublished && (
          <button
            onClick={() => handleWorkflowAction('unpublish')}
            disabled={loading === 'unpublish'}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-sm shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            {loading === 'unpublish' ? 'Unpublishing...' : 'Unpublish Job Posting'}
          </button>
        )}

        {jobPosting.canBeClosed && (
          <button
            onClick={() => handleWorkflowAction('close')}
            disabled={loading === 'close'}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-sm shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            {loading === 'close' ? 'Closing...' : 'Close Job Posting'}
          </button>
        )}
      </div>

      {/* Timeline Information */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="font-medium text-gray-900 mb-2">Timeline</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p>Created: {new Date(jobPosting.createdAt).toLocaleDateString()}</p>
          {jobPosting.submittedForApprovalAt && (
            <p>Submitted for approval: {new Date(jobPosting.submittedForApprovalAt).toLocaleDateString()}</p>
          )}
          {jobPosting.approvedAt && (
            <p>Approved: {new Date(jobPosting.approvedAt).toLocaleDateString()}</p>
          )}
          {jobPosting.publishedAt && (
            <p>Published: {new Date(jobPosting.publishedAt).toLocaleDateString()}</p>
          )}
          {jobPosting.unpublishedAt && (
            <p>Unpublished: {new Date(jobPosting.unpublishedAt).toLocaleDateString()}</p>
          )}
          {jobPosting.closedAt && (
            <p>Closed: {new Date(jobPosting.closedAt).toLocaleDateString()}</p>
          )}
        </div>
      </div>
    </div>
  );
}
