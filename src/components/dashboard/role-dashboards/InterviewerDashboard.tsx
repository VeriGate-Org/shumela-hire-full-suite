'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api-fetch';
import IdentityBand from '@/components/record/IdentityBand';
import DecisionBar, { PrimaryAction } from '@/components/record/DecisionBar';
import StatusPill from '@/components/StatusPill';
import { getEnumLabel } from '@/utils/enumLabels';

interface InterviewerDashboardProps {
  /** Handed down by the page, because this component owns the band. */
  actions?: React.ReactNode;
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
  onTimeframeChange: _onTimeframeChange, actions }) => {
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
            <div key={i} className="bg-card rounded-control border border-border p-5 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-8 bg-muted rounded w-1/3" />
            </div>
          ))}
        </div>
        <div className="bg-card rounded-control border border-border p-6 animate-pulse">
          <div className="h-5 bg-muted rounded w-1/3 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-control" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-full overflow-hidden">
      <IdentityBand
        eyebrow="Your panel work"
        title="Interviewer"
        subtitle={`${upcomingInterviews.length} ${upcomingInterviews.length === 1 ? 'interview' : 'interviews'} scheduled · ${completedCount} completed`}
        figures={[
          ...(pendingFeedback.length > 0
            ? [{ label: 'Feedback due', value: pendingFeedback.length, tone: 'warning' as const }]
            : []),
          { label: 'Completed', value: completedCount },
          // Null rather than 0.0 when nobody has been rated: an average of nothing is not zero,
          // and a 0.0 here would read as "this interviewer scores everyone badly".
          {
            label: 'Average rating given',
            value: averageRating === null ? 'No ratings recorded yet' : averageRating.toFixed(1),
          },
        ]}
       actions={actions}
      />

      {pendingFeedback.length > 0 ? (
        <DecisionBar
          ask={`${pendingFeedback.length} ${pendingFeedback.length === 1 ? 'candidate is' : 'candidates are'} waiting on your feedback.`}
          why="Nobody can advance them until you record a view."
          tone="owed"
        >
          <PrimaryAction
            onClick={() => {
              const first = pendingFeedback[0];
              window.location.href = `/interviews?feedback=${encodeURIComponent(String(first.id))}`;
            }}
          >
            Give feedback
          </PrimaryAction>
        </DecisionBar>
      ) : (
        <DecisionBar
          ask="No feedback is outstanding."
          why="Every interview you have completed has a view recorded against it."
          tone="settled"
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-control border border-border p-5">
          <h4 className="text-sm font-medium text-muted-foreground">Upcoming Interviews</h4>
          <p className="text-2xl font-bold text-gold-600 mt-1">{upcomingInterviews.length}</p>
        </div>
        <div className="bg-card rounded-control border border-border p-5">
          <h4 className="text-sm font-medium text-muted-foreground">Pending Feedback</h4>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingFeedback.length}</p>
        </div>
        <div className="bg-card rounded-control border border-border p-5">
          <h4 className="text-sm font-medium text-muted-foreground">Completed This Month</h4>
          <p className="text-2xl font-bold text-green-600 mt-1">{completedCount}</p>
        </div>
        <div className="bg-card rounded-control border border-border p-5">
          <h4 className="text-sm font-medium text-muted-foreground">Average Rating Given</h4>
          <p className="text-2xl font-bold text-purple-600 mt-1">{averageRating ?? '—'}</p>
        </div>
      </div>

      {/* Upcoming Interviews */}
      <div className="bg-card rounded-control border border-border border-t-2 border-t-gold-500 p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Upcoming Interviews</h3>
        {upcomingInterviews.length === 0 ? (
          <p className="text-muted-foreground">No upcoming interviews scheduled.</p>
        ) : (
          <div className="space-y-3">
            {upcomingInterviews.map((interview) => (
              <div key={interview.id} className="flex items-center justify-between p-4 bg-muted rounded-control">
                <div>
                  <p className="font-medium text-foreground">{interview.candidate}</p>
                  <p className="text-sm text-muted-foreground">{interview.position}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{new Date(interview.date).toLocaleDateString()} at {interview.time}</p>
                  <StatusPill value={interview.type} domain="interviewType" size="sm" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Feedback */}
      <div className="bg-card rounded-control border border-border border-t-2 border-t-gold-500 p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Pending Feedback</h3>
        {pendingFeedback.length === 0 ? (
          <p className="text-muted-foreground">All feedback has been submitted.</p>
        ) : (
          <div className="space-y-3">
            {pendingFeedback.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-surface-gold rounded-control border border-border">
                <div>
                  <p className="font-medium text-foreground">{item.candidate}</p>
                  <p className="text-sm text-muted-foreground">{item.position} — {getEnumLabel('interviewType', item.type)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Interviewed {new Date(item.interviewDate ?? '').toLocaleDateString()}</p>
                  {/* This button carried no onClick. Recording feedback is the whole purpose of
                      this screen and nothing else on it could do so, so the primary action did
                      nothing at all. The form lives on the interviews page; it now has an address. */}
                  <button
                    onClick={() => {
                      window.location.href = `/interviews?feedback=${encodeURIComponent(String(item.id))}`;
                    }}
                    className="mt-1 text-sm font-medium text-accent-gold hover:underline"
                  >
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
