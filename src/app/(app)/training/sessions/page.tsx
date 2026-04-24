'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { trainingService, TrainingSession } from '@/services/trainingService';
import { useAuth } from '@/contexts/AuthContext';
import {
  CalendarDaysIcon,
  MapPinIcon,
  UserIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

export default function TrainingSessionsPage() {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'all' | 'upcoming' | 'open'>('upcoming');
  const [enrolling, setEnrolling] = useState<string | null>(null);

  const { user } = useAuth();
  const employeeId = user?.employeeId || user?.id || '1';

  useEffect(() => {
    loadSessions();
  }, [view]);

  const loadSessions = async () => {
    setLoading(true);
    let data: TrainingSession[];
    if (view === 'upcoming') {
      data = await trainingService.getSessions({ upcoming: true });
    } else if (view === 'open') {
      data = await trainingService.getSessions({ openOnly: true });
    } else {
      data = await trainingService.getSessions();
    }
    setSessions(data);
    setLoading(false);
  };

  const handleEnroll = async (sessionId: string) => {
    try {
      setEnrolling(sessionId);
      await trainingService.enroll(sessionId, employeeId);
      alert('Successfully enrolled!');
      loadSessions();
    } catch (err: any) {
      alert(err.message || 'Failed to enroll');
    } finally {
      setEnrolling(null);
    }
  };

  const statusColors: Record<string, string> = {
    PLANNED: 'bg-gray-100 text-gray-700',
    OPEN: 'bg-green-100 text-green-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-purple-100 text-purple-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <FeatureGate feature="TRAINING_MANAGEMENT">
      <PageWrapper
        title="Training Sessions"
        subtitle="View and enroll in upcoming training sessions"
      >
        <div className="space-y-6">
          {/* View Toggle */}
          <div className="flex gap-2">
            {(['upcoming', 'open', 'all'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 text-sm rounded-lg font-medium ${
                  view === v
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 border hover:bg-gray-50'
                }`}
              >
                {v === 'upcoming' ? 'Upcoming' : v === 'open' ? 'Open for Enrollment' : 'All Sessions'}
              </button>
            ))}
          </div>

          {/* Sessions List */}
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow border">
              No sessions found.
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map(session => (
                <div key={session.id} className="bg-white rounded-lg shadow border p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900">{session.courseTitle}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[session.status] || ''}`}>
                          {session.status?.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">{session.courseCode}</p>
                      <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <CalendarDaysIcon className="w-3.5 h-3.5" />
                          {formatDate(session.startDate)} - {formatDate(session.endDate)}
                        </span>
                        {session.trainerName && (
                          <span className="flex items-center gap-1">
                            <UserIcon className="w-3.5 h-3.5" /> {session.trainerName}
                          </span>
                        )}
                        {session.location && (
                          <span className="flex items-center gap-1">
                            <MapPinIcon className="w-3.5 h-3.5" /> {session.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <UsersIcon className="w-3.5 h-3.5" />
                          {session.enrollmentCount}{session.availableSeats ? `/${session.availableSeats}` : ''} enrolled
                        </span>
                      </div>
                    </div>
                    {(session.status === 'OPEN' || session.status === 'PLANNED') && (
                      <button
                        onClick={() => handleEnroll(session.id)}
                        disabled={enrolling === session.id}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                      >
                        {enrolling === session.id ? 'Enrolling...' : 'Enroll'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
