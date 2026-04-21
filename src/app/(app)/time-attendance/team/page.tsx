'use client';

import { useState } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { AttendanceRecord, attendanceService } from '@/services/attendanceService';
import StatusPill from '@/components/StatusPill';

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

  return (
    <FeatureGate feature="TIME_ATTENDANCE">
      <PageWrapper title="Team Attendance" subtitle="View attendance for your department">
        <div className="space-y-6">
          {/* Filters */}
          <div className="enterprise-card p-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Department</label>
                <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm" placeholder="e.g. Engineering" />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Start Date</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">End Date</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm" />
              </div>
              <div className="flex items-end">
                <button onClick={handleSearch} disabled={!department || loading}
                  className="btn-cta w-full">
                  {loading ? 'Loading...' : 'Search'}
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          {records.length > 0 && (
            <div className="enterprise-card overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Employee</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Clock In</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Clock Out</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Hours</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {records.map((rec) => (
                    <tr key={rec.id} className="hover:bg-muted">
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{rec.employeeName}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(rec.clockIn).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(rec.clockIn).toLocaleTimeString()}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{rec.clockOut ? new Date(rec.clockOut).toLocaleTimeString() : '—'}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{rec.totalHours != null ? `${rec.totalHours.toFixed(1)}h` : '—'}</td>
                      <td className="px-4 py-3 text-sm">
                        <StatusPill value={rec.status} domain="attendanceStatus" />
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
