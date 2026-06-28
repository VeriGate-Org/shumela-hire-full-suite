'use client';

import React, { useState } from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { useToast } from '@/components/Toast';
import { apiFetch } from '@/lib/api-fetch';

interface ApprovalActionsProps {
  requisitionId: string;
  currentUserRole: string;
  pendingRole: string;
  onActionComplete?: () => void;
  className?: string;
}

const ApprovalActions: React.FC<ApprovalActionsProps> = ({
  requisitionId,
  currentUserRole,
  pendingRole,
  onActionComplete,
  className = ''
}) => {
  const { toast } = useToast();
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Only show buttons if current user role matches the pending step
  const canAct = currentUserRole.toLowerCase() === pendingRole.toLowerCase();

  if (!canAct) {
    return null;
  }

  const handleActionClick = (action: 'approve' | 'reject') => {
    setActionType(action);
    setComment('');
    setShowCommentModal(true);
  };

  const handleSubmitAction = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const endpoint = actionType === 'approve' ? 'approve' : 'reject';
      const response = await apiFetch(`/api/requisitions/${requisitionId}/${endpoint}?role=${currentUserRole}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment: comment.trim() || undefined }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${actionType} requisition`);
      }

      setShowCommentModal(false);
      setComment('');
      
      // Call the callback to refresh the timeline
      if (onActionComplete) {
        onActionComplete();
      }
    } catch (error) {
      console.error(`Error ${actionType}ing requisition:`, error);
      toast(`Failed to ${actionType} requisition. Please try again.`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    if (!isSubmitting) {
      setShowCommentModal(false);
      setComment('');
    }
  };

  return (
    <>
      {/* Action Buttons */}
      <div className={`flex space-x-3 ${className}`}>
        <button
          onClick={() => handleActionClick('approve')}
          className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-control transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          <CheckIcon className="w-4 h-4 mr-2" />
          Approve
        </button>
        
        <button
          onClick={() => handleActionClick('reject')}
          className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-control transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          <XMarkIcon className="w-4 h-4 mr-2" />
          Reject
        </button>
      </div>

      {/* Comment Modal */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-control max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {actionType === 'approve' ? 'Approve Requisition' : 'Reject Requisition'}
              </h3>
            </div>
            
            <div className="px-6 py-4">
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                Comment {actionType === 'reject' ? '(required for rejection)' : '(optional)'}
              </label>
              <textarea
                id="comment"
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-control shadow-sm focus:outline-none focus:ring-gold-500/60 focus:border-violet-400 resize-none"
                placeholder={`Enter your ${actionType === 'approve' ? 'approval' : 'rejection'} comment...`}
                disabled={isSubmitting}
              />
            </div>

            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-control hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gold-500/60 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              
              <button
                onClick={handleSubmitAction}
                disabled={isSubmitting || (actionType === 'reject' && !comment.trim())}
                className={`px-4 py-2 text-sm font-medium text-white rounded-control focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  actionType === 'approve'
                    ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                    : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                }`}
              >
                {isSubmitting ? 'Processing...' : (actionType === 'approve' ? 'Approve' : 'Reject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ApprovalActions;