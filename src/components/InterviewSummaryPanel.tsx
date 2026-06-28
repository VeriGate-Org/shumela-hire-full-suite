'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api-fetch';
import { formatEnumValue } from '@/utils/enumLabels';
import StatusPill from '@/components/StatusPill';
import InterviewFeedbackForm from '@/components/InterviewFeedbackForm';
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  VideoCameraIcon,
  PhoneIcon,
  MapPinIcon,
  LinkIcon,
  PlusIcon,
  PlayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ChatBubbleBottomCenterTextIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface InterviewData {
  id: number;
  title: string;
  type: string;
  typeDisplayName?: string;
  round: string;
  roundDisplayName?: string;
  status: string;
  statusDisplayName?: string;
  scheduledAt: string;
  durationMinutes: number;
  location?: string;
  meetingLink?: string;
  phoneNumber?: string;
  meetingRoom?: string;
  interviewerName?: string;
  interviewerId?: number;
  additionalInterviewers?: string;
  feedback?: string;
  rating?: number;
  communicationSkills?: number;
  technicalSkills?: number;
  culturalFit?: number;
  recommendation?: string;
  rescheduledFrom?: string;
  rescheduleCount?: number;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  feedbacks?: FeedbackData[];
  application?: any;
}

interface FeedbackData {
  id: number;
  submittedBy: number;
  interviewerName?: string;
  feedback: string;
  rating?: number;
  communicationSkills?: number;
  technicalSkills?: number;
  culturalFit?: number;
  recommendation: string;
  submittedAt: string;
}

interface InterviewSummaryPanelProps {
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  onSchedule?: () => void;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  PHONE: PhoneIcon,
  VIDEO: VideoCameraIcon,
  IN_PERSON: MapPinIcon,
  PANEL: UserIcon,
  TECHNICAL: CheckCircleIcon,
  BEHAVIOURAL: ChatBubbleBottomCenterTextIcon,
  COMPETENCY: CheckCircleIcon,
  GROUP: UserIcon,
  PRESENTATION: ChatBubbleBottomCenterTextIcon,
  CASE_STUDY: ChatBubbleBottomCenterTextIcon,
};

const RECOMMENDATION_CONFIG: Record<string, { label: string; color: string }> = {
  HIRE: { label: 'Hire', color: 'text-green-700 bg-green-50 border-green-200' },
  STRONG_HIRE: { label: 'Strong Hire', color: 'text-green-800 bg-green-100 border-green-300' },
  CONSIDER: { label: 'Consider', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  REJECT: { label: 'Reject', color: 'text-red-700 bg-red-50 border-red-200' },
  STRONG_REJECT: { label: 'Strong Reject', color: 'text-red-800 bg-red-100 border-red-300' },
  ANOTHER_ROUND: { label: 'Another Round', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  ON_HOLD: { label: 'On Hold', color: 'text-gray-700 bg-gray-50 border-gray-200' },
  SECOND_OPINION: { label: 'Second Opinion', color: 'text-purple-700 bg-purple-50 border-purple-200' },
};

function formatInterviewDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const timeStr = date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
  const dateFormatted = date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });

  if (diffDays === 0) return `Today ${timeStr}`;
  if (diffDays === 1) return `Tomorrow ${timeStr}`;
  if (diffDays === -1) return `Yesterday ${timeStr}`;
  if (diffDays < -1) return `${dateFormatted} ${timeStr} (${Math.abs(diffDays)}d ago)`;
  if (diffDays <= 7) return `${dateFormatted} ${timeStr} (in ${diffDays}d)`;
  return `${dateFormatted} ${timeStr}`;
}

function SkillBar({ label, value }: { label: string; value: number }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-24 text-muted-foreground truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gold-500 rounded-full transition-all"
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
      <span className="w-6 text-right font-medium text-foreground">{value}/5</span>
    </div>
  );
}

export default function InterviewSummaryPanel({
  applicationId,
  candidateName,
  jobTitle,
  onSchedule,
}: InterviewSummaryPanelProps) {
  const [interviews, setInterviews] = useState<InterviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [feedbackInterviewId, setFeedbackInterviewId] = useState<number | null>(null);
  const [rescheduleId, setRescheduleId] = useState<number | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [cancelId, setCancelId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const loadInterviews = useCallback(async () => {
    try {
      const response = await apiFetch(`/api/interviews/application/${applicationId}`);
      if (!response.ok) return;
      const data = await response.json();
      const items = Array.isArray(data) ? data : data.content || [];
      // Sort: scheduled/in-progress first, then by date desc
      items.sort((a: InterviewData, b: InterviewData) => {
        const activeStatuses = ['SCHEDULED', 'RESCHEDULED', 'IN_PROGRESS'];
        const aActive = activeStatuses.includes(a.status) ? 0 : 1;
        const bActive = activeStatuses.includes(b.status) ? 0 : 1;
        if (aActive !== bActive) return aActive - bActive;
        return new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime();
      });
      setInterviews(items);

      // Load feedbacks for completed interviews
      for (const interview of items) {
        if (interview.status === 'COMPLETED' && !interview.feedbacks) {
          apiFetch(`/api/interviews/${interview.id}/feedbacks`)
            .then(res => res.ok ? res.json() : [])
            .then(feedbacks => {
              setInterviews(prev => prev.map(iv =>
                iv.id === interview.id ? { ...iv, feedbacks: Array.isArray(feedbacks) ? feedbacks : [] } : iv
              ));
            })
            .catch(() => {});
        }
      }
    } catch {
      // Gracefully handle — interviews may not exist yet
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    loadInterviews();
  }, [loadInterviews]);

  const doAction = async (label: string, url: string, body?: any) => {
    setActionLoading(label);
    setError(null);
    try {
      const response = await apiFetch(url, {
        method: 'POST',
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}`);
      }
      await loadInterviews();
    } catch (err: any) {
      setError(err.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReschedule = async (interviewId: number) => {
    if (!rescheduleDate) return;
    await doAction(`reschedule-${interviewId}`, `/api/interviews/${interviewId}/reschedule`, {
      scheduledAt: rescheduleDate,
      reason: rescheduleReason || 'Rescheduled',
    });
    setRescheduleId(null);
    setRescheduleDate('');
    setRescheduleReason('');
  };

  const handleCancel = async (interviewId: number) => {
    await doAction(`cancel-${interviewId}`, `/api/interviews/${interviewId}/cancel`, {
      reason: cancelReason || 'Cancelled',
    });
    setCancelId(null);
    setCancelReason('');
  };

  // Aggregate feedback across all completed interviews
  const feedbackRollup = interviews
    .filter(iv => iv.status === 'COMPLETED' && iv.feedbacks && iv.feedbacks.length > 0)
    .map(iv => {
      const fbs = iv.feedbacks!;
      const avgRating = fbs.reduce((s, f) => s + (f.rating || 0), 0) / fbs.length;
      const avgComm = fbs.reduce((s, f) => s + (f.communicationSkills || 0), 0) / fbs.length;
      const avgTech = fbs.reduce((s, f) => s + (f.technicalSkills || 0), 0) / fbs.length;
      const avgCulture = fbs.reduce((s, f) => s + (f.culturalFit || 0), 0) / fbs.length;
      const recommendations = fbs.map(f => f.recommendation).filter(Boolean);
      return {
        interviewId: iv.id,
        round: iv.round,
        roundDisplayName: iv.roundDisplayName || formatEnumValue(iv.round),
        avgRating: Math.round(avgRating * 10) / 10,
        avgComm: Math.round(avgComm * 10) / 10,
        avgTech: Math.round(avgTech * 10) / 10,
        avgCulture: Math.round(avgCulture * 10) / 10,
        recommendations,
        feedbackCount: fbs.length,
      };
    });

  // Find next scheduled interview for card preview
  const nextScheduled = interviews.find(iv => ['SCHEDULED', 'RESCHEDULED'].includes(iv.status));
  const awaitingFeedback = interviews.filter(iv => iv.status === 'COMPLETED' && (!iv.feedbacks || iv.feedbacks.length === 0));

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gold-500" />
        Loading interviews...
      </div>
    );
  }

  return (
    <div className="border border-border rounded-control">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-5 h-5 text-muted-foreground" />
          <div>
            <span className="text-sm font-semibold text-foreground">
              Interviews ({interviews.length})
            </span>
            {nextScheduled && (
              <p className="text-xs text-muted-foreground">
                Next: {formatInterviewDate(nextScheduled.scheduledAt)}
              </p>
            )}
          </div>
        </div>
        {onSchedule && (
          <button
            onClick={onSchedule}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cta text-cta-foreground text-xs font-medium rounded-full hover:opacity-90 transition-opacity"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Schedule Interview
          </button>
        )}
      </div>

      {error && (
        <div className="px-5 py-3 bg-red-50 border-b border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Feedback Roll-up (if any completed interviews with feedback) */}
      {feedbackRollup.length > 0 && (
        <div className="px-5 py-4 border-b border-border">
          <h4 className="text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground mb-3">
            Feedback Summary Across Rounds
          </h4>
          <div className="space-y-3">
            {/* Overall skill averages */}
            {(() => {
              const totalFb = feedbackRollup.reduce((s, r) => s + r.feedbackCount, 0);
              const avgComm = feedbackRollup.reduce((s, r) => s + r.avgComm * r.feedbackCount, 0) / totalFb;
              const avgTech = feedbackRollup.reduce((s, r) => s + r.avgTech * r.feedbackCount, 0) / totalFb;
              const avgCulture = feedbackRollup.reduce((s, r) => s + r.avgCulture * r.feedbackCount, 0) / totalFb;
              return (
                <div className="space-y-1.5">
                  <SkillBar label="Communication" value={Math.round(avgComm * 10) / 10} />
                  <SkillBar label="Technical" value={Math.round(avgTech * 10) / 10} />
                  <SkillBar label="Cultural Fit" value={Math.round(avgCulture * 10) / 10} />
                </div>
              );
            })()}

            {/* Recommendation trend per round */}
            <div className="mt-3 space-y-1.5">
              {feedbackRollup.map(r => (
                <div key={r.interviewId} className="flex items-center gap-2 text-xs">
                  <span className="w-28 text-muted-foreground truncate">{r.roundDisplayName}</span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {r.recommendations.map((rec, i) => {
                      const config = RECOMMENDATION_CONFIG[rec] || { label: formatEnumValue(rec), color: 'text-gray-700 bg-gray-50 border-gray-200' };
                      return (
                        <span key={i} className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${config.color}`}>
                          {config.label}
                        </span>
                      );
                    })}
                  </div>
                  <span className="text-muted-foreground ml-auto">
                    {r.avgRating > 0 && (
                      <span className="inline-flex items-center gap-0.5">
                        <StarIconSolid className="w-3 h-3 text-yellow-400" />
                        {r.avgRating}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>

            {/* Red flags */}
            {feedbackRollup.some(r => r.recommendations.some(rec => ['REJECT', 'STRONG_REJECT'].includes(rec))) && (
              <div className="mt-2 px-3 py-2 bg-red-50 border border-red-200 rounded-control text-xs text-red-700">
                <XCircleIcon className="w-3.5 h-3.5 inline mr-1" />
                One or more interviewers recommended against hiring. Review feedback before progressing.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Awaiting feedback alert */}
      {awaitingFeedback.length > 0 && (
        <div className="px-5 py-3 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs">
          <ChatBubbleBottomCenterTextIcon className="w-3.5 h-3.5 inline mr-1" />
          {awaitingFeedback.length} completed interview{awaitingFeedback.length > 1 ? 's' : ''} awaiting feedback
        </div>
      )}

      {/* Interview List */}
      <div className="divide-y divide-border">
        {interviews.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <CalendarIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No interviews scheduled yet.</p>
          </div>
        ) : (
          interviews.map(interview => {
            const TypeIcon = TYPE_ICONS[interview.type] || CalendarIcon;
            const isExpanded = expandedId === interview.id;
            const isActive = ['SCHEDULED', 'RESCHEDULED'].includes(interview.status);
            const isInProgress = interview.status === 'IN_PROGRESS';
            const isCompleted = interview.status === 'COMPLETED';
            const isCancelled = interview.status === 'CANCELLED';
            const feedbacks = interview.feedbacks || [];

            return (
              <div key={interview.id} className={`px-5 py-3 ${isCancelled ? 'opacity-60' : ''}`}>
                {/* Interview Header Row */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : interview.id)}
                    className="flex items-center gap-2.5 text-left flex-1 min-w-0"
                  >
                    <ChevronDownIcon className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    <TypeIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground truncate">
                          {interview.title || `${formatEnumValue(interview.round)} - ${formatEnumValue(interview.type)}`}
                        </span>
                        <StatusPill value={interview.status} domain="interviewStatus" size="sm" />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <ClockIcon className="w-3 h-3" />
                          {formatInterviewDate(interview.scheduledAt)}
                        </span>
                        <span>{interview.durationMinutes}min</span>
                        {interview.interviewerName && (
                          <span className="flex items-center gap-1">
                            <UserIcon className="w-3 h-3" />
                            {interview.interviewerName}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                    {isActive && (
                      <button
                        onClick={() => doAction(`start-${interview.id}`, `/api/interviews/${interview.id}/start`)}
                        disabled={actionLoading !== null}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 disabled:opacity-50"
                        title="Start Interview"
                      >
                        <PlayIcon className="w-3 h-3" />
                        Start
                      </button>
                    )}
                    {isInProgress && (
                      <button
                        onClick={() => doAction(`complete-${interview.id}`, `/api/interviews/${interview.id}/complete`)}
                        disabled={actionLoading !== null}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 disabled:opacity-50"
                        title="Complete Interview"
                      >
                        <CheckCircleIcon className="w-3 h-3" />
                        Complete
                      </button>
                    )}
                    {isCompleted && feedbacks.length === 0 && (
                      <button
                        onClick={() => setFeedbackInterviewId(feedbackInterviewId === interview.id ? null : interview.id)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                      >
                        <ChatBubbleBottomCenterTextIcon className="w-3 h-3" />
                        Give Feedback
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-3 ml-6 space-y-3">
                    {/* Location / Link details */}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {interview.meetingLink && (
                        <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                          <LinkIcon className="w-3 h-3" />
                          Join Meeting
                        </a>
                      )}
                      {interview.location && (
                        <span className="flex items-center gap-1">
                          <MapPinIcon className="w-3 h-3" />
                          {interview.location}
                        </span>
                      )}
                      {interview.meetingRoom && (
                        <span className="flex items-center gap-1">
                          <MapPinIcon className="w-3 h-3" />
                          Room: {interview.meetingRoom}
                        </span>
                      )}
                      {interview.phoneNumber && (
                        <span className="flex items-center gap-1">
                          <PhoneIcon className="w-3 h-3" />
                          {interview.phoneNumber}
                        </span>
                      )}
                      {interview.rescheduleCount && interview.rescheduleCount > 0 && (
                        <span className="flex items-center gap-1 text-amber-600">
                          <ArrowPathIcon className="w-3 h-3" />
                          Rescheduled {interview.rescheduleCount}x
                        </span>
                      )}
                    </div>

                    {/* Round & Type pills */}
                    <div className="flex items-center gap-2">
                      <StatusPill value={interview.round} domain="interviewRound" size="sm" />
                      <StatusPill value={interview.type} domain="interviewType" size="sm" />
                    </div>

                    {/* Cancellation reason */}
                    {isCancelled && interview.cancellationReason && (
                      <div className="text-xs text-red-600 bg-red-50 rounded-control px-3 py-2">
                        Cancelled: {interview.cancellationReason}
                      </div>
                    )}

                    {/* Feedback display for completed interviews */}
                    {isCompleted && feedbacks.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground">
                          Feedback ({feedbacks.length})
                        </h5>
                        {feedbacks.map(fb => {
                          const recConfig = RECOMMENDATION_CONFIG[fb.recommendation] || { label: formatEnumValue(fb.recommendation), color: 'text-gray-700 bg-gray-50 border-gray-200' };
                          return (
                            <div key={fb.id} className="bg-gray-50 rounded-control p-3 text-sm space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-foreground text-xs">{fb.interviewerName || `User #${fb.submittedBy}`}</span>
                                <div className="flex items-center gap-2">
                                  {fb.rating && fb.rating > 0 && (
                                    <span className="inline-flex items-center gap-0.5 text-xs">
                                      <StarIconSolid className="w-3 h-3 text-yellow-400" />
                                      {fb.rating}/5
                                    </span>
                                  )}
                                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${recConfig.color}`}>
                                    {recConfig.label}
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs text-gray-700">{fb.feedback}</p>
                              <div className="space-y-1">
                                <SkillBar label="Communication" value={fb.communicationSkills || 0} />
                                <SkillBar label="Technical" value={fb.technicalSkills || 0} />
                                <SkillBar label="Cultural Fit" value={fb.culturalFit || 0} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Action forms */}
                    {isActive && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setRescheduleId(rescheduleId === interview.id ? null : interview.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded border border-border text-foreground hover:bg-gray-50"
                        >
                          <ArrowPathIcon className="w-3 h-3" />
                          Reschedule
                        </button>
                        <button
                          onClick={() => setCancelId(cancelId === interview.id ? null : interview.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded border border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <XCircleIcon className="w-3 h-3" />
                          Cancel
                        </button>
                      </div>
                    )}

                    {/* Reschedule form */}
                    {rescheduleId === interview.id && (
                      <div className="bg-gray-50 rounded-control p-3 space-y-2">
                        <label className="block text-xs font-medium text-gray-700">New Date & Time</label>
                        <input
                          type="datetime-local"
                          value={rescheduleDate}
                          onChange={e => setRescheduleDate(e.target.value)}
                          className="w-full px-3 py-1.5 border border-border rounded-control text-sm focus:ring-2 focus:ring-gold-500/60"
                        />
                        <input
                          type="text"
                          value={rescheduleReason}
                          onChange={e => setRescheduleReason(e.target.value)}
                          placeholder="Reason for rescheduling"
                          className="w-full px-3 py-1.5 border border-border rounded-control text-sm focus:ring-2 focus:ring-gold-500/60"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReschedule(interview.id)}
                            disabled={!rescheduleDate || actionLoading !== null}
                            className="px-3 py-1.5 bg-cta text-cta-foreground text-xs font-medium rounded-full hover:opacity-90 disabled:opacity-50"
                          >
                            {actionLoading === `reschedule-${interview.id}` ? 'Rescheduling...' : 'Confirm Reschedule'}
                          </button>
                          <button
                            onClick={() => { setRescheduleId(null); setRescheduleDate(''); setRescheduleReason(''); }}
                            className="px-3 py-1.5 border border-border text-foreground text-xs font-medium rounded-full hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Cancel form */}
                    {cancelId === interview.id && (
                      <div className="bg-red-50 rounded-control p-3 space-y-2">
                        <input
                          type="text"
                          value={cancelReason}
                          onChange={e => setCancelReason(e.target.value)}
                          placeholder="Reason for cancellation"
                          className="w-full px-3 py-1.5 border border-red-200 rounded-control text-sm focus:ring-2 focus:ring-red-500/60"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCancel(interview.id)}
                            disabled={actionLoading !== null}
                            className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-full hover:bg-red-700 disabled:opacity-50"
                          >
                            {actionLoading === `cancel-${interview.id}` ? 'Cancelling...' : 'Confirm Cancel'}
                          </button>
                          <button
                            onClick={() => { setCancelId(null); setCancelReason(''); }}
                            className="px-3 py-1.5 border border-border text-foreground text-xs font-medium rounded-full hover:bg-gray-50"
                          >
                            Keep
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Inline Feedback Form */}
                {feedbackInterviewId === interview.id && (
                  <div className="mt-3 ml-6 border border-border rounded-control">
                    <InterviewFeedbackForm
                      interview={{
                        id: interview.id,
                        title: interview.title,
                        type: interview.type,
                        typeDisplayName: interview.typeDisplayName || formatEnumValue(interview.type),
                        round: interview.round,
                        roundDisplayName: interview.roundDisplayName || formatEnumValue(interview.round),
                        status: interview.status,
                        statusDisplayName: interview.statusDisplayName || formatEnumValue(interview.status),
                        scheduledAt: interview.scheduledAt,
                        durationMinutes: interview.durationMinutes,
                        application: interview.application || {
                          id: Number(applicationId),
                          applicant: { id: 0, name: candidateName, surname: '', email: '' },
                          jobPosting: { id: 0, title: jobTitle, department: '' },
                        },
                      }}
                      onSuccess={() => {
                        setFeedbackInterviewId(null);
                        loadInterviews();
                      }}
                      onCancel={() => setFeedbackInterviewId(null)}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
