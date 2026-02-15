'use client';

import React, { useState } from 'react';
import { RequisitionData, ApprovalRole, WorkflowAction } from '../types/workflow';
import { getAllowedTransitions } from '../services/workflowDefinition';

interface WorkflowActionsProps {
  requisition: RequisitionData;
  userRole: ApprovalRole;
  onAction: (action: WorkflowAction, comment?: string) => Promise<void>;
  disabled?: boolean;
}

const WorkflowActions: React.FC<WorkflowActionsProps> = ({
  requisition,
  userRole,
  onAction,
  disabled = false
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<WorkflowAction | null>(null);
  const [comment, setComment] = useState('');

  const allowedTransitions = getAllowedTransitions(requisition.status, userRole);

  const handleAction = async (action: WorkflowAction) => {
    if (action === WorkflowAction.REJECT) {
      // Rejection requires comment
      setPendingAction(action);
      setShowCommentModal(true);
      return;
    }

    setIsLoading(true);
    try {
      await onAction(action);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!pendingAction) return;

    if (pendingAction === WorkflowAction.REJECT && (!comment || comment.trim().length === 0)) {
      alert('Comment is required for rejection');
      return;
    }

    setIsLoading(true);
    try {
      await onAction(pendingAction, comment);
      setShowCommentModal(false);
      setPendingAction(null);
      setComment('');
    } finally {
      setIsLoading(false);
    }
  };

  const getActionButton = (action: WorkflowAction) => {
    const baseClasses = "px-4 py-2 rounded-md font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
    
    switch (action) {
      case WorkflowAction.SUBMIT:
        return (
          <button
            key={action}
            onClick={() => handleAction(action)}
            disabled={disabled || isLoading}
            className={`${baseClasses} bg-violet-600 hover:bg-violet-700 text-white`}
          >
            {isLoading ? 'Submitting...' : 'Submit for Approval'}
          </button>
        );
      case WorkflowAction.APPROVE:
        return (
          <button
            key={action}
            onClick={() => handleAction(action)}
            disabled={disabled || isLoading}
            className={`${baseClasses} bg-green-600 hover:bg-green-700 text-white`}
          >
            {isLoading ? 'Approving...' : 'Approve'}
          </button>
        );
      case WorkflowAction.REJECT:
        return (
          <button
            key={action}
            onClick={() => handleAction(action)}
            disabled={disabled || isLoading}
            className={`${baseClasses} bg-red-600 hover:bg-red-700 text-white`}
          >
            {isLoading ? 'Rejecting...' : 'Reject'}
          </button>
        );
      default:
        return null;
    }
  };

  if (allowedTransitions.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        No actions available for your role
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-3">
        {allowedTransitions.map(transition => getActionButton(transition.action))}
      </div>

      {/* Comment Modal */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {pendingAction === WorkflowAction.REJECT ? 'Rejection Reason' : 'Add Comment'}
            </h3>
            
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={pendingAction === WorkflowAction.REJECT ? 'Please provide a reason for rejection...' : 'Optional comment...'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
              rows={4}
              required={pendingAction === WorkflowAction.REJECT}
            />
            
            {pendingAction === WorkflowAction.REJECT && (
              <p className="text-sm text-red-600 mt-1">* Comment is required for rejection</p>
            )}

            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => {
                  setShowCommentModal(false);
                  setPendingAction(null);
                  setComment('');
                }}
                disabled={isLoading}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCommentSubmit}
                disabled={isLoading || (pendingAction === WorkflowAction.REJECT && !comment.trim())}
                className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  pendingAction === WorkflowAction.REJECT 
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-violet-600 hover:bg-violet-700 text-white'
                }`}
              >
                {isLoading ? 'Processing...' : (pendingAction === WorkflowAction.REJECT ? 'Reject' : 'Submit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WorkflowActions;