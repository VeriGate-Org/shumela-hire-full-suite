'use client';

import { useState } from 'react';
import { LeaveRequest, leaveService } from '@/services/leaveService';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface LeaveApprovalCardProps {
  request: LeaveRequest;
  approverId: number;
  onDecision: () => void;
}

export default function LeaveApprovalCard({ request, approverId, onDecision }: LeaveApprovalCardProps) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleApprove = async () => {
    setProcessing(true);
    try {
      await leaveService.approveRequest(request.id, approverId);
      onDecision();
    } catch (err) {
      console.error('Approve failed:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    setProcessing(true);
    try {
      await leaveService.rejectRequest(request.id, approverId, rejectionReason);
      onDecision();
    } catch (err) {
      console.error('Reject failed:', err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="enterprise-card p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-foreground">{request.employeeName}</h3>
          <p className="text-sm text-muted-foreground">{request.employeeDepartment}</p>
        </div>
        <span
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
          style={{ backgroundColor: request.colorCode }}
        >
          {request.leaveTypeName}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
        <div>
          <p className="text-muted-foreground">From</p>
          <p className="font-medium">{request.startDate}</p>
        </div>
        <div>
          <p className="text-muted-foreground">To</p>
          <p className="font-medium">{request.endDate}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Days</p>
          <p className="font-medium">{request.totalDays}{request.isHalfDay ? ' (half)' : ''}</p>
        </div>
      </div>

      {request.reason && (
        <p className="mt-2 text-sm text-muted-foreground italic">{request.reason}</p>
      )}

      {showRejectForm ? (
        <div className="mt-3 space-y-2">
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Reason for rejection"
            rows={2}
            className="w-full border border-border rounded-md px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={handleReject}
              disabled={processing}
              className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              Confirm Reject
            </button>
            <button
              onClick={() => setShowRejectForm(false)}
              className="px-3 py-1.5 text-sm font-medium text-foreground bg-card border rounded-md hover:bg-muted"
            >
              Back
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleApprove}
            disabled={processing}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            <CheckIcon className="w-4 h-4" /> Approve
          </button>
          <button
            onClick={() => setShowRejectForm(true)}
            disabled={processing}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            <XMarkIcon className="w-4 h-4" /> Reject
          </button>
        </div>
      )}
    </div>
  );
}
