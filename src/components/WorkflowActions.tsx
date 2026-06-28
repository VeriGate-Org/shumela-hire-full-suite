'use client';

import React, { useState, useEffect, useRef } from 'react';
import { RequisitionData, ApprovalRole, WorkflowAction } from '../types/workflow';
import { getAllowedTransitions } from '../services/workflowDefinition';
import { useToast } from './Toast';

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
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<WorkflowAction | null>(null);
  const [comment, setComment] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const allowedTransitions = getAllowedTransitions(requisition.status, userRole);

  // Focus trap and keyboard handling for modal
  useEffect(() => {
    if (!showCommentModal) return;

    // Store the previously focused element so we can restore it
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus the first focusable element in the modal
    const timer = setTimeout(() => {
      const focusable = modalRef.current?.querySelector<HTMLElement>(
        'textarea, button, [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
    }, 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowCommentModal(false);
        setPendingAction(null);
        setComment('');
        return;
      }

      // Focus trap: Tab key cycles through focusable elements within modal
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'textarea, button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus when modal closes
      previousFocusRef.current?.focus();
    };
  }, [showCommentModal]);

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
      toast('Comment is required for rejection', 'info');
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
    const baseClasses = "px-4 py-2 rounded-control font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

    switch (action) {
      case WorkflowAction.SUBMIT:
        return (
          <button
            key={action}
            onClick={() => handleAction(action)}
            disabled={disabled || isLoading}
            className={`${baseClasses} bg-transparent border-2 border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider`}
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
    return null;
  }

  return (
    <>
      <div className="flex flex-wrap gap-3">
        {allowedTransitions.map(transition => getActionButton(transition.action))}
      </div>

      {/* Comment Modal */}
      {showCommentModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="comment-modal-title"
        >
          <div ref={modalRef} className="bg-card rounded-control p-6 w-full max-w-md">
            <h3 id="comment-modal-title" className="text-lg font-medium text-foreground mb-4">
              {pendingAction === WorkflowAction.REJECT ? 'Rejection Reason' : 'Add Comment'}
            </h3>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={pendingAction === WorkflowAction.REJECT ? 'Please provide a reason for rejection...' : 'Optional comment...'}
              aria-label={pendingAction === WorkflowAction.REJECT ? 'Rejection reason' : 'Comment'}
              className="w-full px-3 py-2 border border-border rounded-control focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring"
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
                className="px-4 py-2 text-foreground bg-muted hover:bg-accent rounded-control transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCommentSubmit}
                disabled={isLoading || (pendingAction === WorkflowAction.REJECT && !comment.trim())}
                className={`px-4 py-2 rounded-control font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  pendingAction === WorkflowAction.REJECT
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-transparent border-2 border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider'
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
