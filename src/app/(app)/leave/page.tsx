'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import LeaveBalanceCards from '@/components/leave/LeaveBalanceCards';
import { LeaveBalance, LeaveRequest, leaveService } from '@/services/leaveService';
import Link from 'next/link';
import {
  PlusIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

export default function LeaveDashboardPage() {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [recentRequests, setRecentRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // TODO: Get from auth context
  const employeeId = 1;

  useEffect(() => {
    Promise.all([
      leaveService.getBalances(employeeId),
      leaveService.getLeaveRequests({ employeeId, page: 0, size: 5 }),
    ]).then(([bal, req]) => {
      setBalances(bal);
      setRecentRequests(req.content);
      setLoading(false);
    });
  }, []);

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-gray-100 text-gray-500',
    RECALLED: 'bg-orange-100 text-orange-700',
  };

  return (
    <FeatureGate feature="LEAVE_MANAGEMENT">
      <PageWrapper
        title="Leave Management"
        subtitle="Manage your leave balances and requests"
        actions={
          <Link
            href="/leave/request"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <PlusIcon className="w-4 h-4" /> Request Leave
          </Link>
        }
      >
        <div className="space-y-6">
          {/* Quick Links */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link href="/leave/requests" className="flex items-center gap-2 bg-white rounded-lg shadow border p-3 hover:bg-gray-50 text-sm font-medium text-gray-700">
              <ClipboardDocumentListIcon className="w-5 h-5 text-blue-500" /> My Requests
            </Link>
            <Link href="/leave/calendar" className="flex items-center gap-2 bg-white rounded-lg shadow border p-3 hover:bg-gray-50 text-sm font-medium text-gray-700">
              <CalendarIcon className="w-5 h-5 text-green-500" /> Calendar
            </Link>
            <Link href="/leave/analytics" className="flex items-center gap-2 bg-white rounded-lg shadow border p-3 hover:bg-gray-50 text-sm font-medium text-gray-700">
              <ChartBarIcon className="w-5 h-5 text-purple-500" /> Analytics
            </Link>
            <Link href="/leave/policies" className="flex items-center gap-2 bg-white rounded-lg shadow border p-3 hover:bg-gray-50 text-sm font-medium text-gray-700">
              <Cog6ToothIcon className="w-5 h-5 text-gray-500" /> Policies
            </Link>
          </div>

          {/* Balances */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">My Leave Balances</h2>
            <LeaveBalanceCards balances={balances} loading={loading} />
          </div>

          {/* Recent Requests */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Recent Requests</h2>
              <Link href="/leave/requests" className="text-sm text-blue-600 hover:underline">
                View all
              </Link>
            </div>
            {loading ? (
              <div className="bg-white rounded-lg shadow border p-6 text-center text-gray-500">Loading...</div>
            ) : recentRequests.length === 0 ? (
              <div className="bg-white rounded-lg shadow border p-6 text-center text-gray-500">
                No leave requests yet.
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: req.colorCode }} />
                            {req.leaveTypeName}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {req.startDate} — {req.endDate}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{req.totalDays}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[req.status] || ''}`}>
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
