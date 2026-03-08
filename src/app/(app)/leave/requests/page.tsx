'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { LeaveRequest, leaveService } from '@/services/leaveService';
import Link from 'next/link';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function LeaveRequestsPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const employeeId = 1;

  const loadRequests = async () => {
    setLoading(true);
    const result = await leaveService.getLeaveRequests({
      employeeId,
      status: statusFilter || undefined,
      page,
      size: 20,
    });
    setRequests(result.content);
    setTotalPages(result.totalPages);
    setLoading(false);
  };

  useEffect(() => { loadRequests(); }, [page, statusFilter]);

  const handleCancel = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this request?')) return;
    try {
      await leaveService.cancelRequest(id, employeeId);
      loadRequests();
    } catch (err: any) {
      alert(err.message);
    }
  };

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
        title="My Leave Requests"
        subtitle="View and manage your leave requests"
        actions={
          <Link href="/leave/request" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
            <PlusIcon className="w-4 h-4" /> New Request
          </Link>
        }
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            {['', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(0); }}
                className={`px-3 py-1.5 text-sm rounded-md border ${statusFilter === s ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                {s || 'All'}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="bg-white rounded-lg shadow border p-8 text-center text-gray-500">Loading...</div>
          ) : requests.length === 0 ? (
            <div className="bg-white rounded-lg shadow border p-8 text-center text-gray-500">No requests found.</div>
          ) : (
            <div className="bg-white rounded-lg shadow border overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">From</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">To</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: req.colorCode }} />
                          {req.leaveTypeName}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{req.startDate}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{req.endDate}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{req.totalDays}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[req.status] || ''}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {(req.status === 'PENDING' || req.status === 'APPROVED') && (
                          <button onClick={() => handleCancel(req.id)} className="text-red-600 hover:underline text-xs">Cancel</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="px-3 py-1.5 text-sm border rounded disabled:opacity-50">Previous</button>
              <span className="px-3 py-1.5 text-sm">Page {page + 1} of {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="px-3 py-1.5 text-sm border rounded disabled:opacity-50">Next</button>
            </div>
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
