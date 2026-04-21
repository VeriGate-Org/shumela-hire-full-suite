'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { LeaveRequest, leaveService } from '@/services/leaveService';
import Link from 'next/link';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import StatusPill from '@/components/StatusPill';
import { TableSkeleton, InlineLoading } from '@/components/LoadingComponents';

export default function LeaveRequestsPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const { user } = useAuth();
  const rawId = user?.employeeId || user?.id;
  const employeeId = rawId ? parseInt(rawId, 10) : 0;
  const { toast } = useToast();
  const [cancelTarget, setCancelTarget] = useState<number | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const result = await leaveService.getLeaveRequests({
        employeeId,
        status: statusFilter || undefined,
        page,
        size: 20,
      });
      setRequests(Array.isArray(result?.content) ? result.content : []);
      setTotalPages(result?.totalPages ?? 0);
    } catch {
      setRequests([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (employeeId) loadRequests(); }, [employeeId, page, statusFilter]);

  const handleCancel = async (id: number) => {
    try {
      await leaveService.cancelRequest(id, employeeId);
      toast('Leave request cancelled', 'success');
      loadRequests();
    } catch (err: any) {
      toast(err.message || 'Failed to cancel request', 'error');
    }
  };

  return (
    <FeatureGate feature="LEAVE_MANAGEMENT">
      <PageWrapper
        title="My Leave Requests"
        subtitle="View and manage your leave requests"
        actions={
          <Link href="/leave/request" className="btn-cta inline-flex items-center gap-2">
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
                className={`px-3 py-1.5 text-sm rounded-md border ${statusFilter === s ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-card border-border text-muted-foreground hover:bg-muted'}`}
              >
                {s || 'All'}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="enterprise-card p-6"><TableSkeleton /></div>
          ) : requests.length === 0 ? (
            <div className="enterprise-card p-8 text-center text-muted-foreground">No requests found.</div>
          ) : (
            <div className="enterprise-card overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">From</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">To</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Days</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-muted">
                      <td className="px-4 py-3 text-sm">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: req.colorCode }} />
                          {req.leaveTypeName}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{req.startDate}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{req.endDate}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{req.totalDays}</td>
                      <td className="px-4 py-3 text-sm">
                        <StatusPill value={req.status} domain="leaveStatus" />
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {(req.status === 'PENDING' || req.status === 'APPROVED') && (
                          <button onClick={() => setCancelTarget(req.id)} className="text-red-600 hover:underline text-xs">Cancel</button>
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
        <ConfirmDialog
          open={cancelTarget !== null}
          title="Cancel Leave Request"
          message="Are you sure you want to cancel this request?"
          confirmLabel="Cancel Request"
          variant="danger"
          onConfirm={() => { if (cancelTarget !== null) { handleCancel(cancelTarget); setCancelTarget(null); } }}
          onCancel={() => setCancelTarget(null)}
        />
      </PageWrapper>
    </FeatureGate>
  );
}
