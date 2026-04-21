'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { AttendanceRecord, attendanceService, PageResponse } from '@/services/attendanceService';
import { useAuth } from '@/contexts/AuthContext';
import StatusPill from '@/components/StatusPill';
import { TableSkeleton } from '@/components/LoadingComponents';
import EmptyState from '@/components/EmptyState';
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

export default function AttendanceRecordsPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const employeeId = user?.id ? parseInt(user.id, 10) : 0;

  useEffect(() => {
    if (!employeeId) return;
    setLoading(true);
    attendanceService.getRecords(employeeId, page, 20).then((data) => {
      setRecords(Array.isArray(data?.content) ? data.content : []);
      setTotalPages(data?.totalPages ?? 0);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [employeeId, page]);

  return (
    <FeatureGate feature="TIME_ATTENDANCE">
      <PageWrapper title="Attendance Records" subtitle="View your attendance history">
        {loading ? (
          <div className="enterprise-card p-6"><TableSkeleton /></div>
        ) : records.length === 0 ? (
          <EmptyState icon={ClipboardDocumentListIcon} title="No Records" description="No attendance records found." />
        ) : (
          <>
            <div className="enterprise-card overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Clock In</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Clock Out</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Method</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Hours</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {records.map((rec) => (
                    <tr key={rec.id} className="hover:bg-muted">
                      <td className="px-4 py-3 text-sm text-foreground">{new Date(rec.clockIn).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(rec.clockIn).toLocaleTimeString()}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{rec.clockOut ? new Date(rec.clockOut).toLocaleTimeString() : '—'}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{rec.clockMethod}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{rec.totalHours != null ? `${rec.totalHours.toFixed(1)}h` : '—'}</td>
                      <td className="px-4 py-3 text-sm">
                        <StatusPill value={rec.status} domain="attendanceStatus" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
                  className="px-3 py-1 text-sm rounded border disabled:opacity-50 hover:bg-muted">Previous</button>
                <span className="px-3 py-1 text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
                <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
                  className="px-3 py-1 text-sm rounded border disabled:opacity-50 hover:bg-muted">Next</button>
              </div>
            )}
          </>
        )}
      </PageWrapper>
    </FeatureGate>
  );
}
