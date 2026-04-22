'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import {
  trainingService,
  TrainingAttendanceRecord,
  TrainingEnrollment,
  TrainingSession,
} from '@/services/trainingService';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

function formatTime(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleTimeString('en-ZA', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AttendanceRegisterPage() {
  const params = useParams();
  const sessionId = Number(params.id);

  const [session, setSession] = useState<TrainingSession | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<TrainingAttendanceRecord[]>([]);
  const [enrollments, setEnrollments] = useState<TrainingEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  // Local edits keyed by attendance record id
  const [localAttended, setLocalAttended] = useState<Record<number, boolean>>({});
  const [localNotes, setLocalNotes] = useState<Record<number, string>>({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [sessionData, attendanceData, enrollmentData] = await Promise.all([
        trainingService.getSession(sessionId),
        trainingService.getAttendance(sessionId),
        trainingService.getEnrollments({ sessionId }),
      ]);

      setSession(sessionData);
      setAttendanceRecords(attendanceData);
      setEnrollments(enrollmentData);

      // Initialize local state from fetched data
      const attendedMap: Record<number, boolean> = {};
      const notesMap: Record<number, string> = {};
      attendanceData.forEach(rec => {
        attendedMap[rec.id] = rec.attended;
        notesMap[rec.id] = rec.notes || '';
      });
      setLocalAttended(attendedMap);
      setLocalNotes(notesMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) {
      fetchData();
    }
  }, [sessionId, fetchData]);

  const handleToggleAttended = (recordId: number) => {
    setLocalAttended(prev => ({
      ...prev,
      [recordId]: !prev[recordId],
    }));
    setSaveSuccess(false);
  };

  const handleNotesChange = (recordId: number, value: string) => {
    setLocalNotes(prev => ({
      ...prev,
      [recordId]: value,
    }));
    setSaveSuccess(false);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const updates = attendanceRecords.map(rec =>
        trainingService.updateAttendanceRecord(sessionId, rec.id, {
          attended: localAttended[rec.id] ?? rec.attended,
          notes: localNotes[rec.id] ?? rec.notes ?? undefined,
        })
      );
      await Promise.all(updates);
      setSaveSuccess(true);
      // Refresh data
      const refreshed = await trainingService.getAttendance(sessionId);
      setAttendanceRecords(refreshed);
    } catch (err: any) {
      alert(err.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  // Build a lookup from employeeId to enrollment
  const enrollmentByEmployee = new Map<number, TrainingEnrollment>();
  enrollments.forEach(e => enrollmentByEmployee.set(e.employeeId, e));

  const attendedCount = Object.values(localAttended).filter(Boolean).length;
  const totalCount = attendanceRecords.length;

  if (loading) {
    return (
      <FeatureGate feature="TRAINING_MANAGEMENT">
        <PageWrapper title="Attendance Register" subtitle="Loading...">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </PageWrapper>
      </FeatureGate>
    );
  }

  if (error) {
    return (
      <FeatureGate feature="TRAINING_MANAGEMENT">
        <PageWrapper title="Attendance Register" subtitle="Error">
          <div className="enterprise-card p-8 text-center">
            <UserGroupIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{error}</h3>
            <p className="text-sm text-gray-500 mb-6">Please try again.</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={fetchData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Retry
              </button>
              <Link
                href="/training/admin"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Back to Admin
              </Link>
            </div>
          </div>
        </PageWrapper>
      </FeatureGate>
    );
  }

  return (
    <FeatureGate feature="TRAINING_MANAGEMENT">
      <PageWrapper
        title="Attendance Register"
        subtitle={session ? `${session.courseTitle} - ${session.courseCode}` : 'Session Attendance'}
        actions={
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save All'}
          </button>
        }
      >
        <div className="space-y-6">
          {/* Back link */}
          <Link
            href="/training/admin"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Training Admin
          </Link>

          {/* Summary */}
          <div className="enterprise-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                  <UserGroupIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {attendedCount} / {totalCount} attended
                  </p>
                  <p className="text-xs text-gray-500">
                    {totalCount > 0 ? Math.round((attendedCount / totalCount) * 100) : 0}% attendance rate
                  </p>
                </div>
              </div>
              {saveSuccess && (
                <div className="flex items-center gap-1.5 text-sm text-green-600">
                  <CheckCircleIcon className="w-4 h-4" />
                  Saved successfully
                </div>
              )}
            </div>
          </div>

          {/* Attendance Table */}
          {attendanceRecords.length === 0 ? (
            <div className="enterprise-card p-12 text-center">
              <UserGroupIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-sm font-medium text-gray-900 mb-1">No attendance records</p>
              <p className="text-sm text-gray-500">
                Attendance records will appear once participants are added to this session.
              </p>
            </div>
          ) : (
            <div className="enterprise-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrollment Status</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Attended</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-in Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {attendanceRecords.map(record => {
                      const enrollment = enrollmentByEmployee.get(record.employeeId);
                      const attended = localAttended[record.id] ?? record.attended;
                      const notes = localNotes[record.id] ?? record.notes ?? '';

                      return (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">
                            <span className="font-medium text-gray-900">
                              {record.employeeName || `Employee #${record.employeeId}`}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {enrollment ? (
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                enrollment.status === 'ENROLLED' ? 'bg-blue-100 text-blue-700' :
                                enrollment.status === 'ATTENDED' ? 'bg-green-100 text-green-700' :
                                enrollment.status === 'COMPLETED' ? 'bg-purple-100 text-purple-700' :
                                enrollment.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {enrollment.status}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleToggleAttended(record.id)}
                              className="inline-flex items-center justify-center"
                            >
                              {attended ? (
                                <CheckCircleIcon className="w-6 h-6 text-green-600" />
                              ) : (
                                <XCircleIcon className="w-6 h-6 text-gray-300 hover:text-gray-400" />
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {formatTime(record.checkInTime)}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={notes}
                              onChange={e => handleNotesChange(record.id, e.target.value)}
                              placeholder="Add notes..."
                              className="w-full px-2 py-1 border rounded text-xs text-gray-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
