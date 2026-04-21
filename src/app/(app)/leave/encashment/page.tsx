'use client';

import React, { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { leaveService, LeaveType, LeaveEncashmentRequest } from '@/services/leaveService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import { BanknotesIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import StatusPill from '@/components/StatusPill';

export default function LeaveEncashmentPage() {
  const { user } = useAuth();
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [myRequests, setMyRequests] = useState<LeaveEncashmentRequest[]>([]);
  const [pendingHR, setPendingHR] = useState<LeaveEncashmentRequest[]>([]);
  const [pendingFinance, setPendingFinance] = useState<LeaveEncashmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'request' | 'hr' | 'finance'>('request');

  // Form state
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState<number | ''>('');
  const [days, setDays] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { toast } = useToast();
  const [rejectTarget, setRejectTarget] = useState<number | null>(null);
  const [rejectComment, setRejectComment] = useState('');

  const employeeId = user?.id ? parseInt(user.id, 10) : 0;
  const isManager = user?.role === 'ADMIN' || user?.role === 'HR_MANAGER';

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [types, requests] = await Promise.all([
        leaveService.getLeaveTypes(true),
        leaveService.getEncashmentRequests(employeeId),
      ]);
      setLeaveTypes(types.filter((t) => t.allowEncashment));
      setMyRequests(requests);

      if (isManager) {
        const [hr, finance] = await Promise.all([
          leaveService.getPendingEncashmentHR(),
          leaveService.getPendingEncashmentFinance(),
        ]);
        setPendingHR(hr);
        setPendingFinance(finance);
      }
    } catch (err) {
      toast('Failed to load encashment data', 'error');
    } finally {
      setLoading(false);
    }
  }

  const selectedType = leaveTypes.find((t) => t.id === selectedLeaveTypeId);
  const calculatedAmount = selectedType?.encashmentRate && days
    ? (parseFloat(days) * selectedType.encashmentRate).toFixed(2)
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLeaveTypeId || !days) return;

    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await leaveService.requestEncashment(employeeId, {
        leaveTypeId: selectedLeaveTypeId as number,
        days: parseFloat(days),
        reason: reason || undefined,
      });
      setSuccess('Encashment request submitted successfully');
      setSelectedLeaveTypeId('');
      setDays('');
      setReason('');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApprove(id: number, type: 'hr' | 'finance') {
    try {
      if (type === 'hr') {
        await leaveService.hrApproveEncashment(id, employeeId);
      } else {
        await leaveService.financeApproveEncashment(id, employeeId);
      }
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to approve');
    }
  }

  async function handleReject(id: number) {
    try {
      await leaveService.rejectEncashment(id, employeeId, rejectComment || undefined);
      setRejectTarget(null);
      setRejectComment('');
      toast('Encashment request rejected', 'success');
      await loadData();
    } catch (err: any) {
      toast(err.message || 'Failed to reject', 'error');
    }
  }

  const renderRequestCard = (req: LeaveEncashmentRequest, showActions?: 'hr' | 'finance') => (
    <div key={req.id} className="enterprise-card p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-foreground">{req.employeeName}</h4>
          <p className="text-sm text-muted-foreground">{req.leaveTypeName}</p>
        </div>
        <StatusPill value={req.status} domain="encashmentStatus" />
      </div>
      <div className="grid grid-cols-3 gap-2 text-sm mb-3">
        <div>
          <span className="text-muted-foreground">Days</span>
          <p className="font-medium text-foreground">{req.days}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Rate/Day</span>
          <p className="font-medium text-foreground">R{req.ratePerDay}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Total</span>
          <p className="font-semibold text-green-600 dark:text-green-400">R{req.totalAmount}</p>
        </div>
      </div>
      {req.reason && (
        <p className="text-xs text-muted-foreground mb-3">Reason: {req.reason}</p>
      )}
      <p className="text-xs text-muted-foreground">
        Requested: {new Date(req.requestedAt).toLocaleDateString()}
      </p>
      {req.decisionComment && (
        <p className="text-xs text-red-500 mt-1">Comment: {req.decisionComment}</p>
      )}
      {showActions && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-border">
          <button
            onClick={() => handleApprove(req.id, showActions)}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
          >
            <CheckCircleIcon className="h-4 w-4" /> Approve
          </button>
          <button
            onClick={() => setRejectTarget(req.id)}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
          >
            <XCircleIcon className="h-4 w-4" /> Reject
          </button>
        </div>
      )}
    </div>
  );

  return (
    <FeatureGate feature="LEAVE_MANAGEMENT">
      <PageWrapper title="Leave Encashment" subtitle="Convert unused leave days to cash payout">
        {loading ? (
          <div className="enterprise-card p-8 text-center text-muted-foreground">Loading...</div>
        ) : (
          <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('request')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  activeTab === 'request'
                    ? 'bg-blue-600 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                My Encashment
              </button>
              {isManager && (
                <>
                  <button
                    onClick={() => setActiveTab('hr')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      activeTab === 'hr'
                        ? 'bg-blue-600 text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    HR Pending ({pendingHR.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('finance')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      activeTab === 'finance'
                        ? 'bg-blue-600 text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    Finance Pending ({pendingFinance.length})
                  </button>
                </>
              )}
            </div>

            {/* Messages */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-green-600 dark:text-green-400 text-sm">
                {success}
              </div>
            )}

            {/* Request Tab */}
            {activeTab === 'request' && (
              <>
                {/* Request Form */}
                <div className="enterprise-card p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <BanknotesIcon className="h-5 w-5 text-green-500" />
                    Request Leave Encashment
                  </h3>
                  {leaveTypes.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No leave types with encashment enabled are available.
                    </p>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                          Leave Type
                        </label>
                        <select
                          value={selectedLeaveTypeId}
                          onChange={(e) => setSelectedLeaveTypeId(e.target.value ? parseInt(e.target.value) : '')}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground"
                          required
                        >
                          <option value="">Select leave type...</option>
                          {leaveTypes.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name} (Rate: R{t.encashmentRate}/day)
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                          Number of Days
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          value={days}
                          onChange={(e) => setDays(e.target.value)}
                          placeholder="e.g. 5"
                          className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground"
                          required
                        />
                      </div>
                      {calculatedAmount && (
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                          <span className="text-sm text-muted-foreground">Estimated Payout: </span>
                          <span className="text-lg font-bold text-green-600 dark:text-green-400">R{calculatedAmount}</span>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                          Reason (Optional)
                        </label>
                        <textarea
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {submitting ? 'Submitting...' : 'Submit Encashment Request'}
                      </button>
                    </form>
                  )}
                </div>

                {/* My Requests */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                    <ClockIcon className="h-5 w-5 text-muted-foreground" />
                    My Requests ({myRequests.length})
                  </h3>
                  {myRequests.length === 0 ? (
                    <div className="enterprise-card p-6 text-center text-muted-foreground">
                      No encashment requests yet
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {myRequests.map((req) => renderRequestCard(req))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* HR Pending Tab */}
            {activeTab === 'hr' && isManager && (
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  HR Approval Queue ({pendingHR.length})
                </h3>
                {pendingHR.length === 0 ? (
                  <div className="enterprise-card p-6 text-center text-muted-foreground">
                    No pending HR approvals
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pendingHR.map((req) => renderRequestCard(req, 'hr'))}
                  </div>
                )}
              </div>
            )}

            {/* Finance Pending Tab */}
            {activeTab === 'finance' && isManager && (
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  Finance Approval Queue ({pendingFinance.length})
                </h3>
                {pendingFinance.length === 0 ? (
                  <div className="enterprise-card p-6 text-center text-muted-foreground">
                    No pending finance approvals
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pendingFinance.map((req) => renderRequestCard(req, 'finance'))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {/* Reject Dialog */}
        {rejectTarget !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="mx-4 w-full max-w-md rounded-md border border-border bg-card p-6 shadow-lg">
              <h3 className="text-lg font-medium text-foreground">Reject Encashment</h3>
              <p className="mt-2 text-sm text-muted-foreground">Provide an optional reason for rejection.</p>
              <textarea
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                placeholder="Rejection reason (optional)"
                rows={3}
                className="mt-3 w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm"
              />
              <div className="mt-4 flex justify-end gap-3">
                <button onClick={() => { setRejectTarget(null); setRejectComment(''); }}
                  className="px-4 py-2 text-sm font-medium text-foreground border border-border rounded-full hover:bg-accent">
                  Cancel
                </button>
                <button onClick={() => handleReject(rejectTarget)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-full">
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}
      </PageWrapper>
    </FeatureGate>
  );
}
