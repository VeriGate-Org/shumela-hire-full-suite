'use client';

import React, { useState } from 'react';
import Modal from '@/components/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api-fetch';

interface ApplicationActionsProps {
  applicationId: number;
  applicationStatus: string;
  canWithdraw: boolean;
  canDelete: boolean;
  onApplicationUpdated?: () => void;
}

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isSubmitting: boolean;
}

interface DeleteConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

function WithdrawModal({ isOpen, onClose, onConfirm, isSubmitting }: WithdrawModalProps) {
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim()) onConfirm(reason.trim());
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Withdraw application"
      subtitle="You may reapply for this position later."
      size="sm"
      // Typed text is worth a question before a stray backdrop click throws it away.
      dirty={reason.trim().length > 0}
      onRequestClose={() =>
        window.confirm('Discard the reason you have written and close?')
      }
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full border border-border px-4 py-2 text-xs font-extrabold uppercase tracking-[0.06em] text-foreground disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="withdraw-form"
            disabled={isSubmitting || !reason.trim()}
            className="inline-flex items-center gap-2 rounded-full bg-warning px-4 py-2 text-xs font-extrabold uppercase tracking-[0.06em] text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting && <span className="h-3 w-3 animate-spin rounded-full border-b-2 border-white" />}
            {isSubmitting ? 'Withdrawing…' : 'Withdraw application'}
          </button>
        </>
      }
    >
      <form id="withdraw-form" onSubmit={handleSubmit}>
        <p className="mb-4 text-sm text-muted-foreground">
          This cannot be undone. The application is closed and the recruiter is notified.
        </p>
        <label htmlFor="withdraw-reason" className="mb-2 block text-sm font-medium text-foreground">
          Reason for withdrawal <span className="text-error">*</span>
        </label>
        <textarea
          id="withdraw-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why are you withdrawing?"
          className="w-full rounded-control border border-border p-3 text-sm focus:border-transparent focus:ring-2 focus:ring-primary/50"
          rows={3}
          maxLength={500}
          required
        />
        <div className="mt-1 text-xs text-muted-foreground">{reason.length}/500 characters</div>
      </form>
    </Modal>
  );
}

function DeleteConfirmation({ isOpen, onClose, onConfirm, isDeleting }: DeleteConfirmationProps) {
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Delete this application?"
      subtitle="Documents and screening answers go with it."
      size="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-full border border-border px-4 py-2 text-xs font-extrabold uppercase tracking-[0.06em] text-foreground disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 rounded-full bg-error px-4 py-2 text-xs font-extrabold uppercase tracking-[0.06em] text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting && <span className="h-3 w-3 animate-spin rounded-full border-b-2 border-white" />}
            {isDeleting ? 'Deleting…' : 'Delete application'}
          </button>
        </>
      }
    >
      <p className="text-sm text-muted-foreground">
        This is permanent. Everything attached to the application — uploaded documents, screening
        answers, interview feedback — is removed with it and cannot be recovered.
      </p>
    </Modal>
  );
}

export default function ApplicationActions({ 
  applicationId, 
  applicationStatus, 
  canWithdraw, 
  canDelete,
  onApplicationUpdated 
}: ApplicationActionsProps) {
  const { token } = useAuth();
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleWithdraw = async (reason: string) => {
    setIsWithdrawing(true);
    
    try {
      const response = await apiFetch(`/api/applications/${applicationId}/withdraw`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Application withdrawn successfully' });
        setShowWithdrawModal(false);
        onApplicationUpdated?.();
        
        // Clear success message after 5 seconds
        setTimeout(() => setMessage(null), 5000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setMessage({ 
          type: 'error', 
          text: errorData.message || 'Failed to withdraw application' 
        });
      }
    } catch (error) {
      console.error('Error withdrawing application:', error);
      setMessage({ type: 'error', text: 'An error occurred while withdrawing the application' });
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      const response = await apiFetch(`/api/applications/${applicationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Application deleted successfully' });
        setShowDeleteModal(false);
        onApplicationUpdated?.();
        
        // Clear success message after 5 seconds
        setTimeout(() => setMessage(null), 5000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setMessage({ 
          type: 'error', 
          text: errorData.message || 'Failed to delete application' 
        });
      }
    } catch (error) {
      console.error('Error deleting application:', error);
      setMessage({ type: 'error', text: 'An error occurred while deleting the application' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Status display */}
      <div className="text-sm text-gray-600">
        Current Status: <span className="font-medium">{applicationStatus}</span>
      </div>

      {/* Messages */}
      {message && (
        <div className={`p-4 rounded-control ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {message.type === 'success' ? (
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{message.text}</p>
            </div>
            <button
              onClick={() => setMessage(null)}
              className="ml-auto flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        {canWithdraw && (
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-yellow-700 bg-yellow-100 border border-yellow-300 rounded-control hover:bg-yellow-200 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.888-.833-2.598 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Withdraw Application
          </button>
        )}

        {canDelete && (
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-red-700 bg-red-100 border border-red-300 rounded-control hover:bg-red-200 focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Application
          </button>
        )}
      </div>

      {/* Modals */}
      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        onConfirm={handleWithdraw}
        isSubmitting={isWithdrawing}
      />

      <DeleteConfirmation
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
