'use client';

import React, { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Interview {
  id: number;
  title: string;
  type: string;
  typeDisplayName: string;
  round: string;
  roundDisplayName: string;
  status: string;
  statusDisplayName: string;
  scheduledAt: string;
  durationMinutes: number;
  location?: string;
  meetingLink?: string;
  phoneNumber?: string;
  meetingRoom?: string;
  interviewerId: number;
  canBeRescheduled: boolean;
  canBeCancelled: boolean;
  canBeStarted: boolean;
  canBeCompleted: boolean;
  requiresFeedback: boolean;
  isOverdue: boolean;
  isUpcoming: boolean;
  application: {
    id: number;
    applicant: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
    };
    jobPosting: {
      id: number;
      title: string;
      department: string;
    };
  };
}

interface InterviewCalendarProps {
  interviews: Interview[];
  onInterviewSelect?: (interview: Interview) => void;
  onInterviewUpdate?: (interviewId: number, updatedInterview: Interview) => void;
}

type CalendarView = 'month' | 'week' | 'day';
type ModalMode = 'overview' | 'reschedule' | 'cancel';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function InterviewCalendar({ interviews, onInterviewSelect, onInterviewUpdate }: InterviewCalendarProps) {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('overview');
  const [rescheduleDateTime, setRescheduleDateTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: Date[] = [];
    const cursor = new Date(startDate);

    for (let i = 0; i < 42; i += 1) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    return days;
  }, [currentDate]);

  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    const days: Date[] = [];
    for (let i = 0; i < 7; i += 1) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }

    return days;
  }, [currentDate]);

  const dayTimeSlots = useMemo(() => {
    const slots: number[] = [];
    for (let hour = 8; hour < 18; hour += 1) {
      slots.push(hour);
    }
    return slots;
  }, []);

  const getInterviewsForDate = (date: Date) => interviews.filter((interview) => {
    const interviewDate = new Date(interview.scheduledAt);
    return interviewDate.getDate() === date.getDate()
      && interviewDate.getMonth() === date.getMonth()
      && interviewDate.getFullYear() === date.getFullYear();
  });

  const getInterviewsForHour = (hour: number) => interviews.filter((interview) => {
    const interviewDate = new Date(interview.scheduledAt);
    return interviewDate.getDate() === currentDate.getDate()
      && interviewDate.getMonth() === currentDate.getMonth()
      && interviewDate.getFullYear() === currentDate.getFullYear()
      && interviewDate.getHours() === hour;
  });

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);

    if (view === 'month') {
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (view === 'week') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    }

    setCurrentDate(newDate);
  };

  const closeModal = () => {
    setShowActionModal(false);
    setSelectedInterview(null);
    setModalMode('overview');
    setRescheduleDateTime('');
    setRescheduleReason('');
    setCancelReason('');
    setActionError('');
    setActionLoading(false);
  };

  const handleInterviewClick = (interview: Interview) => {
    setSelectedInterview(interview);
    setShowActionModal(true);
    setModalMode('overview');
    setActionError('');
    setRescheduleDateTime(new Date(interview.scheduledAt).toISOString().slice(0, 16));
    setRescheduleReason('');
    setCancelReason('');

    if (onInterviewSelect) {
      onInterviewSelect(interview);
    }
  };

  const getActorId = (): number | null => {
    const actorId = Number(user?.id);
    if (!Number.isFinite(actorId) || actorId <= 0) {
      setActionError('Unable to identify the current user. Please sign in again.');
      return null;
    }
    return actorId;
  };

  const postInterviewAction = async (
    action: 'start' | 'complete' | 'reschedule' | 'cancel',
    interviewId: number,
    payload: Record<string, string | number>,
  ) => {
    try {
      setActionLoading(true);
      setActionError('');

      const response = await fetch(`/api/interviews/${interviewId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(
          Object.entries(payload).map(([key, value]) => [key, String(value)]),
        ).toString(),
      });

      if (response.ok) {
        const updatedInterview: Interview = await response.json();
        if (onInterviewUpdate) {
          onInterviewUpdate(interviewId, updatedInterview);
        }
        closeModal();
        return;
      }

      const errorData = await response.json();
      setActionError(errorData.message || `Failed to ${action}`);
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      setActionError(`An error occurred while trying to ${action}.`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStart = async () => {
    if (!selectedInterview) return;
    const actorId = getActorId();
    if (!actorId) return;

    await postInterviewAction('start', selectedInterview.id, {
      startedBy: actorId,
    });
  };

  const handleComplete = async () => {
    if (!selectedInterview) return;
    const actorId = getActorId();
    if (!actorId) return;

    await postInterviewAction('complete', selectedInterview.id, {
      completedBy: actorId,
    });
  };

  const handleRescheduleSubmit = async () => {
    if (!selectedInterview) return;
    const actorId = getActorId();
    if (!actorId) return;

    if (!rescheduleDateTime) {
      setActionError('New date and time is required to reschedule.');
      return;
    }

    if (!rescheduleReason.trim()) {
      setActionError('Please provide a reason for rescheduling.');
      return;
    }

    await postInterviewAction('reschedule', selectedInterview.id, {
      newScheduledAt: new Date(rescheduleDateTime).toISOString(),
      reason: rescheduleReason,
      rescheduledBy: actorId,
    });
  };

  const handleCancelSubmit = async () => {
    if (!selectedInterview) return;
    const actorId = getActorId();
    if (!actorId) return;

    if (!cancelReason.trim()) {
      setActionError('Please provide a reason for cancellation.');
      return;
    }

    await postInterviewAction('cancel', selectedInterview.id, {
      reason: cancelReason,
      cancelledBy: actorId,
    });
  };

  const getInterviewStatusColor = (interview: Interview) => {
    switch (interview.status) {
      case 'SCHEDULED':
        return 'bg-gold-100 text-gold-800 border-gold-200';
      case 'RESCHEDULED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'IN_PROGRESS':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'COMPLETED':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'NO_SHOW':
        return 'bg-muted text-foreground border-border';
      default:
        return 'bg-muted text-foreground border-border';
    }
  };

  const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate()
      && date.getMonth() === today.getMonth()
      && date.getFullYear() === today.getFullYear();
  };

  const isCurrentMonth = (date: Date) => date.getMonth() === currentDate.getMonth();

  return (
    <div className="bg-card rounded-card border border-border shadow-sm">
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-foreground">
              {view === 'month' && `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
              {view === 'week' && `Week of ${currentDate.toLocaleDateString()}`}
              {view === 'day' && currentDate.toLocaleDateString()}
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateDate('prev')}
                aria-label="Previous period"
                className="p-2 text-muted-foreground hover:text-foreground"
              >
                ←
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 text-sm text-link hover:text-link-hover"
              >
                Today
              </button>
              <button
                onClick={() => navigateDate('next')}
                aria-label="Next period"
                className="p-2 text-muted-foreground hover:text-foreground"
              >
                →
              </button>
            </div>
          </div>

          <div className="flex rounded-control border border-border overflow-hidden">
            {(['month', 'week', 'day'] as CalendarView[]).map((calendarView) => (
              <button
                key={calendarView}
                onClick={() => setView(calendarView)}
                className={`px-3 py-2 text-sm font-medium border-r border-border last:border-r-0 ${
                  view === calendarView
                    ? 'bg-gold-50 text-primary'
                    : 'bg-card text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                {calendarView.charAt(0).toUpperCase() + calendarView.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        {view === 'month' && (
          <div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {WEEKDAYS.map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => {
                const dayInterviews = getInterviewsForDate(date);

                return (
                  <div
                    key={index}
                    className={`min-h-[100px] p-2 border rounded-control ${
                      isCurrentMonth(date) ? 'bg-card' : 'bg-muted'
                    } ${isToday(date) ? 'bg-gold-50 border-primary/30' : 'border-border'}`}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      isCurrentMonth(date) ? 'text-foreground' : 'text-muted-foreground'
                    } ${isToday(date) ? 'text-gold-700' : ''}`}
                    >
                      {date.getDate()}
                    </div>

                    <div className="space-y-1">
                      {dayInterviews.slice(0, 3).map((interview) => (
                        <button
                          key={interview.id}
                          onClick={() => handleInterviewClick(interview)}
                          className={`w-full text-left text-xs p-1 rounded-control border cursor-pointer hover:shadow-sm ${getInterviewStatusColor(interview)}`}
                        >
                          <div className="font-medium truncate">
                            {formatTime(interview.scheduledAt)}
                          </div>
                          <div className="truncate">
                            {interview.application.applicant.firstName} {interview.application.applicant.lastName}
                          </div>
                        </button>
                      ))}
                      {dayInterviews.length > 3 && (
                        <div className="text-xs text-muted-foreground text-center">
                          +{dayInterviews.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === 'week' && (
          <div>
            <div className="grid grid-cols-8 gap-1">
              <div className="p-2" />

              {weekDays.map((date) => (
                <div key={date.toString()} className={`p-2 text-center border-b border-border ${
                  isToday(date) ? 'bg-gold-50 text-gold-700 font-medium' : 'text-foreground'
                }`}
                >
                  <div className="text-sm">{WEEKDAYS[date.getDay()]}</div>
                  <div className="text-lg">{date.getDate()}</div>
                </div>
              ))}

              {dayTimeSlots.map((hour) => (
                <React.Fragment key={hour}>
                  <div className="p-2 text-sm text-muted-foreground border-r border-border">
                    {hour}:00
                  </div>
                  {weekDays.map((date) => {
                    const hourInterviews = interviews.filter((interview) => {
                      const interviewDate = new Date(interview.scheduledAt);
                      return interviewDate.getDate() === date.getDate()
                        && interviewDate.getMonth() === date.getMonth()
                        && interviewDate.getFullYear() === date.getFullYear()
                        && interviewDate.getHours() === hour;
                    });

                    return (
                      <div key={`${date.toString()}-${hour}`} className="p-1 border-b border-r border-border min-h-[60px]">
                        {hourInterviews.map((interview) => (
                          <button
                            key={interview.id}
                            onClick={() => handleInterviewClick(interview)}
                            className={`w-full text-left text-xs p-1 rounded-control border cursor-pointer hover:shadow-sm mb-1 ${getInterviewStatusColor(interview)}`}
                          >
                            <div className="font-medium">
                              {interview.application.applicant.firstName} {interview.application.applicant.lastName}
                            </div>
                            <div className="truncate">
                              {interview.roundDisplayName}
                            </div>
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {view === 'day' && (
          <div className="space-y-1">
            {dayTimeSlots.map((hour) => {
              const hourInterviews = getInterviewsForHour(hour);

              return (
                <div key={hour} className="flex border-b border-border">
                  <div className="w-20 p-2 text-sm text-muted-foreground border-r border-border">
                    {hour}:00
                  </div>
                  <div className="flex-1 p-2 min-h-[80px]">
                    {hourInterviews.map((interview) => (
                      <button
                        key={interview.id}
                        onClick={() => handleInterviewClick(interview)}
                        className={`w-full text-left p-3 rounded-control border cursor-pointer hover:shadow-md mb-2 ${getInterviewStatusColor(interview)}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-sm">
                              {formatTime(interview.scheduledAt)} - {interview.title}
                            </div>
                            <div className="text-sm">
                              {interview.application.applicant.firstName} {interview.application.applicant.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {interview.application.jobPosting.title}
                            </div>
                          </div>
                          <div className="text-xs">
                            {interview.durationMinutes} min
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showActionModal && selectedInterview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="interview-action-title"
            className="bg-card rounded-card border border-border shadow-xl max-w-lg w-full"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-border">
              <h3 id="interview-action-title" className="text-lg font-semibold text-foreground">
                {selectedInterview.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {selectedInterview.application.applicant.firstName} {selectedInterview.application.applicant.lastName}
              </p>
            </div>

            <div className="px-6 py-4 space-y-4">
              {actionError && (
                <div className="rounded-control border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
                  {actionError}
                </div>
              )}

              {modalMode === 'overview' && (
                <div className="space-y-2 text-sm text-foreground">
                  <p><strong>Type:</strong> {selectedInterview.typeDisplayName}</p>
                  <p><strong>Round:</strong> {selectedInterview.roundDisplayName}</p>
                  <p><strong>Status:</strong> {selectedInterview.statusDisplayName}</p>
                  <p><strong>Date:</strong> {new Date(selectedInterview.scheduledAt).toLocaleString()}</p>
                  <p><strong>Duration:</strong> {selectedInterview.durationMinutes} minutes</p>
                  {selectedInterview.location && <p><strong>Location:</strong> {selectedInterview.location}</p>}
                  {selectedInterview.meetingLink && (
                    <p>
                      <strong>Meeting:</strong>{' '}
                      <a
                        href={selectedInterview.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-link hover:text-link-hover"
                      >
                        Join Meeting
                      </a>
                    </p>
                  )}
                </div>
              )}

              {modalMode === 'reschedule' && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-foreground">
                    New Date & Time
                    <input
                      type="datetime-local"
                      value={rescheduleDateTime}
                      onChange={(event) => setRescheduleDateTime(event.target.value)}
                      className="mt-1 w-full p-2 border border-border rounded-control bg-card focus:ring-2 focus:ring-gold-500/60 focus:border-primary"
                    />
                  </label>

                  <label className="block text-sm font-medium text-foreground">
                    Reason for Rescheduling
                    <textarea
                      value={rescheduleReason}
                      onChange={(event) => setRescheduleReason(event.target.value)}
                      rows={3}
                      className="mt-1 w-full p-2 border border-border rounded-control bg-card focus:ring-2 focus:ring-gold-500/60 focus:border-primary"
                    />
                  </label>
                </div>
              )}

              {modalMode === 'cancel' && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-foreground">
                    Reason for Cancellation
                    <textarea
                      value={cancelReason}
                      onChange={(event) => setCancelReason(event.target.value)}
                      rows={3}
                      className="mt-1 w-full p-2 border border-border rounded-control bg-card focus:ring-2 focus:ring-gold-500/60 focus:border-primary"
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-border flex justify-end gap-2 flex-wrap">
              {modalMode === 'overview' && (
                <>
                  <button
                    onClick={closeModal}
                    className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                    disabled={actionLoading}
                  >
                    Close
                  </button>

                  {selectedInterview.canBeStarted && (
                    <button
                      onClick={handleStart}
                      className="px-3 py-2 bg-green-600 text-white text-sm rounded-control hover:bg-green-700 disabled:opacity-60"
                      disabled={actionLoading}
                    >
                      Start
                    </button>
                  )}

                  {selectedInterview.canBeCompleted && (
                    <button
                      onClick={handleComplete}
                      className="px-3 py-2 bg-cta text-cta-foreground text-sm rounded-control hover:bg-cta-hover disabled:opacity-60"
                      disabled={actionLoading}
                    >
                      Complete
                    </button>
                  )}

                  {selectedInterview.canBeRescheduled && (
                    <button
                      onClick={() => {
                        setModalMode('reschedule');
                        setActionError('');
                      }}
                      className="px-3 py-2 bg-yellow-600 text-white text-sm rounded-control hover:bg-yellow-700 disabled:opacity-60"
                      disabled={actionLoading}
                    >
                      Reschedule
                    </button>
                  )}

                  {selectedInterview.canBeCancelled && (
                    <button
                      onClick={() => {
                        setModalMode('cancel');
                        setActionError('');
                      }}
                      className="px-3 py-2 bg-red-600 text-white text-sm rounded-control hover:bg-red-700 disabled:opacity-60"
                      disabled={actionLoading}
                    >
                      Cancel
                    </button>
                  )}
                </>
              )}

              {modalMode === 'reschedule' && (
                <>
                  <button
                    onClick={() => {
                      setModalMode('overview');
                      setActionError('');
                    }}
                    className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                    disabled={actionLoading}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleRescheduleSubmit}
                    className="px-3 py-2 bg-yellow-600 text-white text-sm rounded-control hover:bg-yellow-700 disabled:opacity-60"
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Saving...' : 'Confirm Reschedule'}
                  </button>
                </>
              )}

              {modalMode === 'cancel' && (
                <>
                  <button
                    onClick={() => {
                      setModalMode('overview');
                      setActionError('');
                    }}
                    className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                    disabled={actionLoading}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCancelSubmit}
                    className="px-3 py-2 bg-red-600 text-white text-sm rounded-control hover:bg-red-700 disabled:opacity-60"
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Saving...' : 'Confirm Cancel'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
