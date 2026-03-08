'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { AttendanceRecord, attendanceService } from '@/services/attendanceService';
import Link from 'next/link';
import {
  ClockIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export default function TimeAttendancePage() {
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [recentRecords, setRecentRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [clockingIn, setClockingIn] = useState(false);
  const [clockingOut, setClockingOut] = useState(false);
  const [error, setError] = useState('');

  const employeeId = 1; // TODO: Get from auth context

  useEffect(() => {
    attendanceService.getRecords(employeeId, 0, 10).then((data) => {
      setRecentRecords(data.content);
      const today = new Date().toISOString().split('T')[0];
      const openRecord = data.content.find(
        (r) => r.clockIn.startsWith(today) && !r.clockOut
      );
      setTodayRecord(openRecord || null);
      setLoading(false);
    });
  }, []);

  const handleClockIn = async () => {
    setClockingIn(true);
    setError('');
    try {
      let lat: number | undefined;
      let lng: number | undefined;
      if (navigator.geolocation) {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        ).catch(() => null);
        if (pos) {
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        }
      }
      const record = await attendanceService.clockIn(employeeId, 'WEB', lat, lng);
      setTodayRecord(record);
      setRecentRecords((prev) => [record, ...prev]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setClockingIn(false);
    }
  };

  const handleClockOut = async () => {
    setClockingOut(true);
    setError('');
    try {
      let lat: number | undefined;
      let lng: number | undefined;
      if (navigator.geolocation) {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        ).catch(() => null);
        if (pos) {
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        }
      }
      const record = await attendanceService.clockOut(employeeId, lat, lng);
      setTodayRecord(null);
      setRecentRecords((prev) =>
        prev.map((r) => (r.id === record.id ? record : r))
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setClockingOut(false);
    }
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
      <PageWrapper
        title="Time & Attendance"
        subtitle="Track your work hours and attendance"
      >
        <div className="space-y-6">
          {/* Quick Links */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link href="/time-attendance/records" className="flex items-center gap-2 bg-white rounded-lg shadow border p-3 hover:bg-gray-50 text-sm font-medium text-gray-700">
              <ClipboardDocumentListIcon className="w-5 h-5 text-blue-500" /> My Records
            </Link>
            <Link href="/time-attendance/team" className="flex items-center gap-2 bg-white rounded-lg shadow border p-3 hover:bg-gray-50 text-sm font-medium text-gray-700">
              <UsersIcon className="w-5 h-5 text-green-500" /> Team View
            </Link>
            <Link href="/time-attendance/geofences" className="flex items-center gap-2 bg-white rounded-lg shadow border p-3 hover:bg-gray-50 text-sm font-medium text-gray-700">
              <MapPinIcon className="w-5 h-5 text-purple-500" /> Geofences
            </Link>
            <Link href="/time-attendance/overtime" className="flex items-center gap-2 bg-white rounded-lg shadow border p-3 hover:bg-gray-50 text-sm font-medium text-gray-700">
              <ClockIcon className="w-5 h-5 text-orange-500" /> Overtime
            </Link>
          </div>

          {/* Clock In/Out */}
          <div className="bg-white rounded-lg shadow border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Clock In / Out</h2>
            {error && (
              <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                <ExclamationTriangleIcon className="w-5 h-5" /> {error}
              </div>
            )}
            <div className="flex items-center gap-4">
              {todayRecord ? (
                <>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Clocked in at</p>
                    <p className="text-lg font-semibold text-green-700">
                      {new Date(todayRecord.clockIn).toLocaleTimeString()}
                    </p>
                  </div>
                  <button
                    onClick={handleClockOut}
                    disabled={clockingOut}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
                  >
                    {clockingOut ? 'Clocking Out...' : 'Clock Out'}
                  </button>
                </>
              ) : (
                <>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">You are not clocked in</p>
                    <p className="text-lg font-semibold text-gray-400">--:--:--</p>
                  </div>
                  <button
                    onClick={handleClockIn}
                    disabled={clockingIn}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    {clockingIn ? 'Clocking In...' : 'Clock In'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Recent Records */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Recent Records</h2>
              <Link href="/time-attendance/records" className="text-sm text-blue-600 hover:underline">
                View all
              </Link>
            </div>
            {loading ? (
              <div className="bg-white rounded-lg shadow border p-6 text-center text-gray-500">Loading...</div>
            ) : recentRecords.length === 0 ? (
              <div className="bg-white rounded-lg shadow border p-6 text-center text-gray-500">
                No attendance records yet.
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock In</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock Out</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(rec.clockIn).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(rec.clockIn).toLocaleTimeString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {rec.clockOut ? new Date(rec.clockOut).toLocaleTimeString() : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {rec.totalHours != null ? `${rec.totalHours.toFixed(1)}h` : '—'}
                        </td>
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
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
