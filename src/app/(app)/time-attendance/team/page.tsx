'use client';

import { useState } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { AttendanceRecord, attendanceService } from '@/services/attendanceService';

export default function TeamAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [department, setDepartment] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!department) return;
    setLoading(true);
    const data = await attendanceService.getTeamAttendance(department, startDate, endDate);
    setRecords(data);
    setLoading(false);
  };

  const statusColors: Record<string, string> = {
    PRESENT: 'bg-green-100 text-green-700',
    LATE: 'bg-yellow-100 text-yellow-700',
    ABSENT: 'bg-red-100 text-red-700',
    HALF_DAY: 'bg-orange-100 text-orange-700',
    ON_LEAVE: 'bg-blue-100 text-blue-700',
  };

  return (
    <FeatureGate feature="TIME_ATTENDANCE">
      <PageWrapper title="Team Attendance" subtitle="View attendance for your department">
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow border p-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm" placeholder="e.g. Engineering" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm" />
              </div>
              <div className="flex items-end">
                <button onClick={handleSearch} disabled={!department || loading}
                  className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {loading ? 'Loading...' : 'Search'}
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          {records.length > 0 && (
            <div className="bg-white rounded-lg shadow border overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock In</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock Out</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {records.map((rec) => (
                    <tr key={rec.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{rec.employeeName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{new Date(rec.clockIn).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{new Date(rec.clockIn).toLocaleTimeString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{rec.clockOut ? new Date(rec.clockOut).toLocaleTimeString() : '—'}</td>
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
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
