'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api-fetch';
import StatusPill from '@/components/StatusPill';
import { getEnumLabel } from '@/utils/enumLabels';

interface InterviewerDashboardProps {
  selectedTimeframe: string;
  onTimeframeChange: (timeframe: string) => void;
}

interface Interview {
  id: number | string;
  candidate: string;
  position: string;
  date: string;
  time: string;
  type: string;
  interviewDate?: string;
  feedbackSubmitted?: boolean;
}

const InterviewerDashboard: React.FC<InterviewerDashboardProps> = ({
  selectedTimeframe: _selectedTimeframe,
  onTimeframeChange: _onTimeframeChange,
}) => {
  const [upcomingInterviews, setUpcomingInterviews] = useState<Interview[]>([]);
  const [pendingFeedback, setPendingFeedback] = useState<Interview[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [upcomingRes, completedRes] = await Promise.all([
          apiFetch('/api/interviews?status=SCHEDULED&sortBy=scheduledDate&sortDirection=asc&size=10'),
          apiFetch('/api/interviews?status=COMPLETED&size=10'),
        ]);

        if (upcomingRes.ok) {
          const upcomingData = await upcomingRes.json();
          const items = upcomingData.content ?? upcomingData ?? [];
          setUpcomingInterviews(
            items.map((item: Record<string, unknown>) => ({
              id: item.id,
              candidate: item.candidateName ?? item.candidate ?? 'Unknown',
              position: item.positionTitle ?? item.position ?? '',
              date: item.scheduledDate ?? item.date ?? '',
              time: item.scheduledTime ?? item.time ?? '',
              type: item.interviewType ?? item.type ?? 'Interview',
            }))
          );
        }

        if (completedRes.ok) {
          const completedData = await completedRes.json();
          const completedItems = completedData.content ?? completedData ?? [];
          setCompletedCount(completedData.totalElements ?? completedItems.length);

          // Filter for items without feedback
          const pending = completedItems.filter(
            (item: Record<string, unknown>) => !item.feedbackSubmitted
          );
          setPendingFeedback(
            pending.map((item: Record<string, unknown>) => ({
              id: item.id,
              candidate: item.candidateName ?? item.candidate ?? 'Unknown',
              position: item.positionTitle ?? item.position ?? '',
              interviewDate: item.scheduledDate ?? item.interviewDate ?? item.date ?? '',
              type: item.interviewType ?? item.type ?? 'Interview',
              date: '',
              time: '',
            }))
          );

          // Derive average rating from completed interviews that have ratings
          const rated = completedItems.filter(
            (item: Record<string, unknown>) => typeof item.rating === 'number'
          );
          if (rated.length > 0) {
            const sum = rated.reduce(
              (acc: number, item: Record<string, unknown>) => acc + (item.rating as number),
              0
            );
            setAverageRating(Math.round((sum / rated.length) * 10) / 10);
          }
        }
      } catch {
        // On error, keep empty defaults
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 max-w-full overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-sm border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-8 bg-gray-200 rounded w-1/3" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-sm border border-gray-200 p-6 animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-sm" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-sm border border-gray-200 p-5">
          <h4 className="text-sm font-medium text-gray-500">Upcoming Interviews</h4>
          <p className="text-2xl font-bold text-gold-600 mt-1">{upcomingInterviews.length}</p>
        </div>
        <div className="bg-white rounded-sm border border-gray-200 p-5">
          <h4 className="text-sm font-medium text-gray-500">Pending Feedback</h4>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingFeedback.length}</p>
        </div>
        <div className="bg-white rounded-sm border border-gray-200 p-5">
          <h4 className="text-sm font-medium text-gray-500">Completed This Month</h4>
          <p className="text-2xl font-bold text-green-600 mt-1">{completedCount}</p>
        </div>
        <div className="bg-white rounded-sm border border-gray-200 p-5">
          <h4 className="text-sm font-medium text-gray-500">Average Rating Given</h4>
          <p className="text-2xl font-bold text-purple-600 mt-1">{averageRating ?? '—'}</p>
        </div>
      </div>

      {/* Upcoming Interviews */}
      <div className="bg-white rounded-sm border border-gray-200 border-t-2 border-t-gold-500 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Interviews</h3>
        {upcomingInterviews.length === 0 ? (
          <p className="text-gray-500">No upcoming interviews scheduled.</p>
        ) : (
          <div className="space-y-3">
            {upcomingInterviews.map((interview) => (
              <div key={interview.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-sm">
                <div>
                  <p className="font-medium text-gray-900">{interview.candidate}</p>
                  <p className="text-sm text-gray-500">{interview.position}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{new Date(interview.date).toLocaleDateString()} at {interview.time}</p>
                  <StatusPill value={interview.type} domain="interviewType" size="sm" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Feedback */}
      <div className="bg-white rounded-sm border border-gray-200 border-t-2 border-t-gold-500 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Feedback</h3>
        {pendingFeedback.length === 0 ? (
          <p className="text-gray-500">All feedback has been submitted.</p>
        ) : (
          <div className="space-y-3">
            {pendingFeedback.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-sm border border-yellow-200">
                <div>
                  <p className="font-medium text-gray-900">{item.candidate}</p>
                  <p className="text-sm text-gray-500">{item.position} — {getEnumLabel('interviewType', item.type)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Interviewed {new Date(item.interviewDate ?? '').toLocaleDateString()}</p>
                  <button className="mt-1 text-sm font-medium text-gold-600 hover:text-gold-800">
                    Submit Feedback
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewerDashboard;
