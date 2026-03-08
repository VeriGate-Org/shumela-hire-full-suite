'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { AttendanceRecord, attendanceService, PageResponse } from '@/services/attendanceService';

export default function AttendanceRecordsPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const employeeId = 1; // TODO: Get from auth context

  useEffect(() => {
    setLoading(true);
    attendanceService.getRecords(employeeId, page, 20).then((data) => {
      setRecords(data.content);
      setTotalPages(data.totalPages);
      setLoading(false);
    });
  }, [page]);

  const statusColors: Record<string, string> = {
    PRESENT: 'bg-green-100 text-green-700',
    LATE: 'bg-yellow-100 text-yellow-700',
    ABSENT: 'bg-red-100 text-red-700',
    HALF_DAY: 'bg-orange-100 text-orange-700',
    ON_LEAVE: 'bg-blue-100 text-blue-700',
  };

  return (
    <FeatureGate feature="TIME_ATTENDANCE">
      <PageWrapper title="Attendance Records" subtitle="View your attendance history">
        {loading ? (
          <div className="bg-white rounded-lg shadow border p-6 text-center text-gray-500">Loading...</div>
        ) : records.length === 0 ? (
          <div className="bg-white rounded-lg shadow border p-6 text-center text-gray-500">
            No attendance records found.
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow border overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock In</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock Out</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {records.map((rec) => (
                    <tr key={rec.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{new Date(rec.clockIn).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{new Date(rec.clockIn).toLocaleTimeString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{rec.clockOut ? new Date(rec.clockOut).toLocaleTimeString() : '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{rec.clockMethod}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{rec.totalHours != null ? `${rec.totalHours.toFixed(1)}h` : '—'}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[rec.status] || 'bg-gray-100 text-gray-700'}`}>
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
                  className="px-3 py-1 text-sm rounded border disabled:opacity-50 hover:bg-gray-50">Previous</button>
                <span className="px-3 py-1 text-sm text-gray-600">Page {page + 1} of {totalPages}</span>
                <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
                  className="px-3 py-1 text-sm rounded border disabled:opacity-50 hover:bg-gray-50">Next</button>
              </div>
            )}
          </>
        )}
      </PageWrapper>
    </FeatureGate>
  );
}
