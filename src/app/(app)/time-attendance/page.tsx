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
import { useAuth } from '@/contexts/AuthContext';
import StatusPill from '@/components/StatusPill';
import { TableSkeleton } from '@/components/LoadingComponents';
import LocationMap from '@/components/maps/LocationMap';

export default function TimeAttendancePage() {
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [recentRecords, setRecentRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [clockingIn, setClockingIn] = useState(false);
  const [clockingOut, setClockingOut] = useState(false);
  const [error, setError] = useState('');
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  const { user } = useAuth();
  const rawId = user?.employeeId || user?.id;
  const parsedId = rawId ? parseInt(rawId, 10) : 0;
  const employeeId = Number.isFinite(parsedId) ? parsedId : 0;

  useEffect(() => {
    if (!employeeId) {
      setError('Your employee profile could not be resolved. Please contact your administrator.');
      setLoading(false);
      return;
    }
    // Capture current location for map display
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {} // ignore errors silently
      );
    }
    attendanceService.getRecords(employeeId, 0, 10).then((data) => {
      const records = Array.isArray(data?.content) ? data.content : [];
      setRecentRecords(records);
      const today = new Date().toISOString().split('T')[0];
      const openRecord = records.find(
        (r) => r.clockIn.startsWith(today) && !r.clockOut
      );
      setTodayRecord(openRecord || null);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [employeeId]);

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

  return (
    <FeatureGate feature="TIME_ATTENDANCE">
      <PageWrapper
        title="Time & Attendance"
        subtitle="Track your work hours and attendance"
      >
        <div className="space-y-6">
          {/* Quick Links */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link href="/time-attendance/records" className="flex items-center gap-2 enterprise-card p-3 hover:bg-muted text-sm font-medium text-muted-foreground">
              <ClipboardDocumentListIcon className="w-5 h-5 text-blue-500" /> My Records
            </Link>
            <Link href="/time-attendance/team" className="flex items-center gap-2 enterprise-card p-3 hover:bg-muted text-sm font-medium text-muted-foreground">
              <UsersIcon className="w-5 h-5 text-green-500" /> Team View
            </Link>
            <Link href="/time-attendance/geofences" className="flex items-center gap-2 enterprise-card p-3 hover:bg-muted text-sm font-medium text-muted-foreground">
              <MapPinIcon className="w-5 h-5 text-purple-500" /> Geofences
            </Link>
            <Link href="/time-attendance/overtime" className="flex items-center gap-2 enterprise-card p-3 hover:bg-muted text-sm font-medium text-muted-foreground">
              <ClockIcon className="w-5 h-5 text-orange-500" /> Overtime
            </Link>
          </div>

          {/* Clock In/Out */}
          <div className="enterprise-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Clock In / Out</h2>
            {error && (
              <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                <ExclamationTriangleIcon className="w-5 h-5" /> {error}
              </div>
            )}
            <div className="flex items-center gap-4">
              {todayRecord ? (
                <>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Clocked in at</p>
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
                    <p className="text-sm text-muted-foreground">You are not clocked in</p>
                    <p className="text-lg font-semibold text-muted-foreground">--:--:--</p>
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

          {/* Location Map */}
          {currentLocation && (
            <div className="enterprise-card p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Your Location</h2>
              <LocationMap
                center={[currentLocation.lat, currentLocation.lng]}
                zoom={15}
                height="250px"
                markers={[
                  { lat: currentLocation.lat, lng: currentLocation.lng, label: 'Current Location' },
                  ...recentRecords
                    .filter((r) => r.clockInLatitude && r.clockInLongitude)
                    .slice(0, 5)
                    .map((r) => ({
                      lat: r.clockInLatitude!,
                      lng: r.clockInLongitude!,
                      label: `Clock-in: ${new Date(r.clockIn).toLocaleString()}`,
                    })),
                ]}
              />
            </div>
          )}

          {/* Recent Records */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-foreground">Recent Records</h2>
              <Link href="/time-attendance/records" className="text-sm text-blue-600 hover:underline">
                View all
              </Link>
            </div>
            {loading ? (
              <div className="enterprise-card p-6"><TableSkeleton /></div>
            ) : recentRecords.length === 0 ? (
              <div className="enterprise-card p-6 text-center text-muted-foreground">
                No attendance records yet.
              </div>
            ) : (
              <div className="enterprise-card overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Clock In</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Clock Out</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Hours</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-muted">
                        <td className="px-4 py-3 text-sm text-foreground">
                          {new Date(rec.clockIn).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {new Date(rec.clockIn).toLocaleTimeString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {rec.clockOut ? new Date(rec.clockOut).toLocaleTimeString() : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {rec.totalHours != null ? `${rec.totalHours.toFixed(1)}h` : '—'}
                        </td>
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
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
