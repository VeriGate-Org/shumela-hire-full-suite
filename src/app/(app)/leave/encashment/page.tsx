'use client';

import React, { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { leaveService, LeaveType, LeaveEncashmentRequest } from '@/services/leaveService';
import { useAuth } from '@/contexts/AuthContext';
import { BanknotesIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

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

  const employeeId = user?.id ? parseInt(user.id) : 1;
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
      console.error('Failed to load encashment data:', err);
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
    const comment = prompt('Rejection reason (optional):');
    try {
      await leaveService.rejectEncashment(id, employeeId, comment || undefined);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to reject');
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      HR_APPROVED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      FINANCE_APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      PROCESSED: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.PENDING}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const renderRequestCard = (req: LeaveEncashmentRequest, showActions?: 'hr' | 'finance') => (
    <div key={req.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white">{req.employeeName}</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">{req.leaveTypeName}</p>
        </div>
        {getStatusBadge(req.status)}
      </div>
      <div className="grid grid-cols-3 gap-2 text-sm mb-3">
        <div>
          <span className="text-gray-500 dark:text-gray-400">Days</span>
          <p className="font-medium text-gray-900 dark:text-white">{req.days}</p>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Rate/Day</span>
          <p className="font-medium text-gray-900 dark:text-white">R{req.ratePerDay}</p>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Total</span>
          <p className="font-semibold text-green-600 dark:text-green-400">R{req.totalAmount}</p>
        </div>
      </div>
      {req.reason && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Reason: {req.reason}</p>
      )}
      <p className="text-xs text-gray-400 dark:text-gray-500">
        Requested: {new Date(req.requestedAt).toLocaleDateString()}
      </p>
      {req.decisionComment && (
        <p className="text-xs text-red-500 mt-1">Comment: {req.decisionComment}</p>
      )}
      {showActions && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => handleApprove(req.id, showActions)}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
          >
            <CheckCircleIcon className="h-4 w-4" /> Approve
          </button>
          <button
            onClick={() => handleReject(req.id)}
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('request')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  activeTab === 'request'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
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
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    HR Pending ({pendingHR.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('finance')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      activeTab === 'finance'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
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
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <BanknotesIcon className="h-5 w-5 text-green-500" />
                    Request Leave Encashment
                  </h3>
                  {leaveTypes.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      No leave types with encashment enabled are available.
                    </p>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Leave Type
                        </label>
                        <select
                          value={selectedLeaveTypeId}
                          onChange={(e) => setSelectedLeaveTypeId(e.target.value ? parseInt(e.target.value) : '')}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Number of Days
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          value={days}
                          onChange={(e) => setDays(e.target.value)}
                          placeholder="e.g. 5"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          required
                        />
                      </div>
                      {calculatedAmount && (
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Estimated Payout: </span>
                          <span className="text-lg font-bold text-green-600 dark:text-green-400">R{calculatedAmount}</span>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Reason (Optional)
                        </label>
                        <textarea
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <ClockIcon className="h-5 w-5 text-gray-500" />
                    My Requests ({myRequests.length})
                  </h3>
                  {myRequests.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500 dark:text-gray-400">
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  HR Approval Queue ({pendingHR.length})
                </h3>
                {pendingHR.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500 dark:text-gray-400">
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Finance Approval Queue ({pendingFinance.length})
                </h3>
                {pendingFinance.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500 dark:text-gray-400">
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
      </PageWrapper>
    </FeatureGate>
  );
}
