'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  ListBulletIcon,
  PlusIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  PencilSquareIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import PageWrapper from '@/components/PageWrapper';
import { apiFetch } from '@/lib/api-fetch';
import InterviewScheduler from '@/components/InterviewScheduler';
import InterviewCalendar, { type Interview as CalendarInterview } from '@/components/InterviewCalendar';
import InterviewFeedbackForm from '@/components/InterviewFeedbackForm';
import ErrorState from '@/components/ErrorState';
import { useToast } from '@/components/Toast';
import { CardSkeleton } from '@/components/LoadingComponents';
import { getEnumLabel } from '@/utils/enumLabels';

interface InterviewFeedbackEntry {
  id: number;
  submittedBy: number;
  interviewerName?: string;
  feedback: string;
  rating?: number;
  communicationSkills?: number;
  technicalSkills?: number;
  culturalFit?: number;
  overallImpression?: string;
  recommendation: string;
  nextSteps?: string;
  technicalAssessment?: string;
  candidateQuestions?: string;
  interviewerNotes?: string;
  submittedAt: string;
}

interface Interview extends CalendarInterview {
  instructions?: string;
  agenda?: string;
  additionalInterviewers?: string;
  feedback?: string;
  rating?: number;
  communicationSkills?: number;
  technicalSkills?: number;
  culturalFit?: number;
  overallImpression?: string;
  recommendation?: string;
  recommendationDisplayName?: string;
  nextSteps?: string;
  technicalAssessment?: string;
  candidateQuestions?: string;
  interviewerNotes?: string;
  rescheduledFrom?: string;
  rescheduleReason?: string;
  reminderSentAt?: string;
  feedbackRequestedAt?: string;
  feedbackSubmittedAt?: string;
  updatedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  feedbacks?: InterviewFeedbackEntry[];
  feedbackCount?: number;
}

type InterviewView = 'calendar' | 'feedback' | 'list';

export default function InterviewsPage() {
  const { toast } = useToast();
  const [view, setView] = useState<InterviewView>('calendar');
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [showSchedulerModal, setShowSchedulerModal] = useState(false);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const loadInterviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFetch('/api/interviews');
      if (response.ok) {
        const data = await response.json();
        setInterviews(data.content || data);
      } else {
        setError('Failed to load interviews. The server returned an error.');
        toast('Failed to load interviews', 'error');
      }
    } catch (err) {
      console.error('Error loading interviews:', err);
      setError('Failed to load interviews. Please check your connection and try again.');
      toast('Failed to load interviews', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (view === 'list' || view === 'calendar') {
      void loadInterviews();
    }
  }, [view, loadInterviews]);

  const handleInterviewScheduled = useCallback((interview: { id: number; title: string }) => {
    toast('Interview scheduled successfully', 'success');
    setShowSchedulerModal(false);
    setEditingInterview(null);
    setSelectedInterview(null);
    void loadInterviews();
  }, [loadInterviews, toast]);

  const handleInterviewUpdated = useCallback((interviewId: number, updatedInterview: Interview) => {
    setInterviews((prev) => prev.map((interview) =>
      interview.id === interviewId ? updatedInterview : interview,
    ));
    void loadInterviews();
  }, [loadInterviews]);

  const handleFeedbackSubmitted = useCallback((interviewId: number) => {
    toast('Feedback submitted successfully', 'success');
    setView('calendar');
    setSelectedInterview(null);
    void loadInterviews();
  }, [loadInterviews, toast]);

  const handleInterviewSelect = useCallback((interview: Interview) => {
    setSelectedInterview(interview);
  }, []);

  const filteredInterviews = useMemo(() => interviews.filter((interview) => {
    const normalizedSearch = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm
      || interview.title?.toLowerCase().includes(normalizedSearch)
      || (interview.application?.applicant?.name ?? '').toLowerCase().includes(normalizedSearch)
      || (interview.application?.applicant?.surname ?? '').toLowerCase().includes(normalizedSearch)
      || (interview.application?.jobPosting?.title ?? '').toLowerCase().includes(normalizedSearch)
      || (interview.application?.jobPosting?.department ?? '').toLowerCase().includes(normalizedSearch);

    const matchesStatus = statusFilter === 'ALL' || interview.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || interview.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  }), [interviews, searchTerm, statusFilter, typeFilter]);

  const statusOptions = useMemo(() => [...new Set(interviews.map((interview) => interview.status))], [interviews]);
  const typeOptions = useMemo(() => [...new Set(interviews.map((interview) => interview.type))], [interviews]);
  const upcomingInterviews = useMemo(() => {
    const now = new Date();
    return interviews.filter((interview) =>
      interview.isUpcoming || (interview.status === 'SCHEDULED' && new Date(interview.scheduledAt) > now)
    ).slice(0, 5);
  }, [interviews]);
  const overdueInterviews = useMemo(() => {
    const now = new Date();
    return interviews.filter((interview) =>
      interview.isOverdue || (interview.status === 'SCHEDULED' && new Date(interview.scheduledAt) < now)
    );
  }, [interviews]);
  const pendingFeedback = useMemo(() =>
    interviews.filter((interview) =>
      interview.status === 'COMPLETED' && (!interview.feedbackCount || interview.feedbackCount === 0)
    ), [interviews]);

  const completedInterviews = useMemo(() =>
    interviews.filter((interview) => interview.status === 'COMPLETED'), [interviews]);

  const getPageTitle = () => {
    switch (view) {
      case 'calendar': return 'Interview Scheduling';
      case 'feedback': return 'Interview Feedback';
      default: return 'Interview Scheduling';
    }
  };

  const getPageSubtitle = () => {
    switch (view) {
      case 'calendar': return 'Schedule interviews, track progress, and submit candidate feedback';
      case 'feedback': return 'Submit structured, auditable feedback for completed interviews.';
      default: return 'Schedule interviews, track progress, and submit candidate feedback';
    }
  };

  const getStatusBadge = (status: string, displayName?: string) => {
    const label = displayName || getEnumLabel('interviewStatus', status);
    switch (status) {
      case 'SCHEDULED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-navy text-accent-navy">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-navy" />
            {label}
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success-bg text-success">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            {label}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-error-bg text-error">
            <span className="w-1.5 h-1.5 rounded-full bg-error" />
            {label}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
            {label}
          </span>
        );
    }
  };

  const getTypeBadge = (type: string, displayName?: string) => {
    const label = displayName || getEnumLabel('interviewType', type);
    const typeMap: Record<string, string> = {
      'PHONE_SCREEN': 'bg-icon-bg-navy text-accent-navy',
      'TECHNICAL': 'bg-icon-bg-teal text-accent-teal',
      'PANEL': 'bg-icon-bg-gold text-accent-gold',
      'FINAL': 'bg-icon-bg-pink text-accent-pink',
    };
    const classes = typeMap[type] || 'bg-muted text-muted-foreground';
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${classes}`}>
        {label}
      </span>
    );
  };

  const getCandidateInitials = (interview: Interview) => {
    const name = interview.application?.applicant?.name || '';
    const surname = interview.application?.applicant?.surname || '';
    if (name && surname) return `${name[0]}${surname[0]}`.toUpperCase();
    if (name) return name.substring(0, 2).toUpperCase();
    return '??';
  };

  const getCandidateFullName = (interview: Interview) => {
    const name = interview.application?.applicant?.name ?? '';
    const surname = interview.application?.applicant?.surname ?? '';
    return (name + ' ' + surname).trim() || (interview as any).candidateName || 'Unknown Candidate';
  };

  const tabs: Array<{ id: InterviewView; label: string; icon: typeof CalendarDaysIcon }> = [
    { id: 'calendar', label: 'Calendar', icon: CalendarDaysIcon },
    { id: 'list', label: 'List', icon: ListBulletIcon },
  ];

  const scheduleButton = (
    <button
      onClick={() => {
        setEditingInterview(null);
        setShowSchedulerModal(true);
      }}
      className="btn-cta inline-flex items-center gap-2"
    >
      <PlusIcon className="w-4 h-4" />
      Schedule Interview
    </button>
  );

  return (
    <PageWrapper title={getPageTitle()} subtitle={getPageSubtitle()} actions={scheduleButton}>
      <div className="space-y-6">

        {/* ====== METRIC CARDS ====== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Scheduled This Week */}
          <div className="enterprise-card p-5">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-card bg-icon-bg-navy text-accent-navy flex items-center justify-center">
                <CalendarDaysIcon className="w-[22px] h-[22px]" />
              </div>
              <div>
                <p className="text-2xl font-extrabold leading-none text-foreground">{upcomingInterviews.length}</p>
                <p className="text-[0.813rem] font-medium text-muted-foreground mt-1">Scheduled This Week</p>
              </div>
            </div>
          </div>

          {/* Completed */}
          <div className="enterprise-card p-5">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-card bg-icon-bg-teal text-accent-teal flex items-center justify-center">
                <CheckCircleIcon className="w-[22px] h-[22px]" />
              </div>
              <div>
                <p className="text-2xl font-extrabold leading-none text-foreground">{completedInterviews.length}</p>
                <p className="text-[0.813rem] font-medium text-muted-foreground mt-1">Completed</p>
              </div>
            </div>
          </div>

          {/* Pending Feedback */}
          <div className="enterprise-card p-5">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-card bg-icon-bg-gold text-accent-gold flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="w-[22px] h-[22px]" />
              </div>
              <div>
                <p className="text-2xl font-extrabold leading-none text-foreground">{pendingFeedback.length}</p>
                <p className="text-[0.813rem] font-medium text-muted-foreground mt-1">Pending Feedback</p>
              </div>
            </div>
          </div>

          {/* Total Interviews */}
          <div className="enterprise-card p-5">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-card bg-icon-bg-pink text-accent-pink flex items-center justify-center">
                <StarIcon className="w-[22px] h-[22px]" />
              </div>
              <div>
                <p className="text-2xl font-extrabold leading-none text-foreground">{interviews.length}</p>
                <p className="text-[0.813rem] font-medium text-muted-foreground mt-1">Total Interviews</p>
              </div>
            </div>
          </div>
        </div>

        {/* ====== VIEW TOGGLE ====== */}
        <div className="flex items-center gap-2">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={view === id}
              aria-controls={`interviews-panel-${id}`}
              id={`interviews-tab-${id}`}
              onClick={() => setView(id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[0.813rem] font-semibold uppercase tracking-wider transition-colors ${
                view === id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-border hover:border-primary hover:text-primary'
              }`}
            >
              <Icon className="w-[15px] h-[15px]" />
              {label}
            </button>
          ))}
        </div>

        {/* ====== CALENDAR VIEW ====== */}
        {view === 'calendar' && (
          <section
            role="tabpanel"
            id="interviews-panel-calendar"
            aria-labelledby="interviews-tab-calendar"
          >
            {error ? (
              <ErrorState
                title="Failed to load interviews"
                message={error}
                onRetry={loadInterviews}
              />
            ) : loading ? (
              <CardSkeleton count={6} />
            ) : (
              <InterviewCalendar
                interviews={interviews}
                onInterviewSelect={handleInterviewSelect}
                onInterviewUpdate={handleInterviewUpdated}
              />
            )}
          </section>
        )}

        {/* ====== FEEDBACK VIEW ====== */}
        {view === 'feedback' && selectedInterview && (
          <section
            role="tabpanel"
            id="interviews-panel-feedback"
            aria-labelledby="interviews-tab-calendar"
            className="space-y-4"
          >
            <button
              onClick={() => {
                setView('calendar');
                setSelectedInterview(null);
              }}
              className="inline-flex items-center gap-2 text-link hover:text-link-hover font-medium"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back to Calendar
            </button>

            <InterviewFeedbackForm
              interview={selectedInterview}
              onSuccess={handleFeedbackSubmitted}
              onCancel={() => {
                setView('calendar');
                setSelectedInterview(null);
              }}
            />
          </section>
        )}

        {/* ====== LIST VIEW ====== */}
        {view === 'list' && (
          <section
            role="tabpanel"
            id="interviews-panel-list"
            aria-labelledby="interviews-tab-list"
          >
            <div className="enterprise-card overflow-hidden">
              {/* Card Header with Title + Inline Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-4 border-b border-border">
                <h2 className="text-lg font-bold text-foreground">All Interviews</h2>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search interviews..."
                      aria-label="Search interviews by title, candidate, or job"
                      className="w-full sm:w-auto pl-9 pr-3 py-2 border border-border bg-card rounded-control text-[0.813rem] focus:ring-2 focus:ring-ring/40 focus:border-ring min-w-[180px]"
                    />
                  </div>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    aria-label="Filter interviews by type"
                    className="py-2 pl-3 pr-8 border border-border bg-card rounded-control text-[0.813rem] focus:ring-2 focus:ring-ring/40 focus:border-ring min-w-[140px]"
                  >
                    <option value="ALL">All Types</option>
                    {typeOptions.map((type) => (
                      <option key={type} value={type}>{getEnumLabel('interviewType', type)}</option>
                    ))}
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    aria-label="Filter interviews by status"
                    className="py-2 pl-3 pr-8 border border-border bg-card rounded-control text-[0.813rem] focus:ring-2 focus:ring-ring/40 focus:border-ring min-w-[140px]"
                  >
                    <option value="ALL">All Statuses</option>
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>{getEnumLabel('interviewStatus', status)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Table Body */}
              {error ? (
                <div className="p-6">
                  <ErrorState
                    title="Failed to load interviews"
                    message={error}
                    onRetry={loadInterviews}
                  />
                </div>
              ) : loading ? (
                <div className="p-6">
                  <CardSkeleton count={4} />
                </div>
              ) : filteredInterviews.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="text-muted-foreground mb-4">
                    {interviews.length === 0
                      ? 'No interviews found. Create your first interview to begin scheduling workflows.'
                      : 'No interviews match your current search and filter criteria.'}
                  </p>
                  <button
                    onClick={() => {
                      setEditingInterview(null);
                      setShowSchedulerModal(true);
                    }}
                    className="btn-cta inline-flex items-center gap-2"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Schedule Interview
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground bg-background border-b border-border">
                          Candidate
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground bg-background border-b border-border">
                          Position
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground bg-background border-b border-border">
                          Interview Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground bg-background border-b border-border">
                          Date / Time
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground bg-background border-b border-border">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground bg-background border-b border-border">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInterviews.map((interview, idx) => {
                        const isLast = idx === filteredInterviews.length - 1;
                        return (
                          <tr
                            key={interview.id}
                            className="hover:bg-surface-navy transition-colors"
                          >
                            {/* Candidate */}
                            <td className={`px-4 py-3.5 text-sm ${isLast ? '' : 'border-b border-border'} align-middle`}>
                              <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-icon-bg-navy text-accent-navy font-bold text-[0.688rem] flex items-center justify-center">
                                  {getCandidateInitials(interview)}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-semibold text-foreground truncate">
                                    {getCandidateFullName(interview)}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Position */}
                            <td className={`px-4 py-3.5 text-sm text-foreground ${isLast ? '' : 'border-b border-border'} align-middle`}>
                              {interview.application?.jobPosting?.title || 'Unknown Position'}
                            </td>

                            {/* Interview Type */}
                            <td className={`px-4 py-3.5 text-sm ${isLast ? '' : 'border-b border-border'} align-middle`}>
                              {getTypeBadge(interview.type, interview.typeDisplayName)}
                            </td>

                            {/* Date / Time */}
                            <td className={`px-4 py-3.5 text-sm ${isLast ? '' : 'border-b border-border'} align-middle`}>
                              <div className="font-semibold text-foreground">
                                {new Date(interview.scheduledAt).toLocaleDateString('en-ZA', {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short',
                                })}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(interview.scheduledAt).toLocaleTimeString('en-ZA', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </td>

                            {/* Status */}
                            <td className={`px-4 py-3.5 text-sm ${isLast ? '' : 'border-b border-border'} align-middle`}>
                              <div className="flex flex-col gap-1">
                                {getStatusBadge(interview.status, interview.statusDisplayName)}
                                {interview.isUpcoming && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.688rem] font-semibold bg-icon-bg-gold text-accent-gold w-fit">
                                    Upcoming
                                  </span>
                                )}
                                {interview.isOverdue && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.688rem] font-semibold bg-error-bg text-error w-fit">
                                    Overdue
                                  </span>
                                )}
                                {interview.status === 'COMPLETED' && !interview.feedbackCount && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.688rem] font-semibold bg-warning-bg text-warning w-fit">
                                    Feedback Needed
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className={`px-4 py-3.5 text-sm ${isLast ? '' : 'border-b border-border'} align-middle`}>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setEditingInterview(interview);
                                    setShowSchedulerModal(true);
                                  }}
                                  className="btn-secondary inline-flex items-center gap-1 !px-3 !py-1.5 !text-xs"
                                >
                                  <PencilSquareIcon className="w-3.5 h-3.5" />
                                  Edit
                                </button>

                                {interview.status === 'COMPLETED' && (
                                  <button
                                    onClick={() => {
                                      setSelectedInterview(interview);
                                      setView('feedback');
                                    }}
                                    className={`inline-flex items-center gap-1 !px-3 !py-1.5 !text-xs rounded-full font-semibold uppercase tracking-wider transition-colors ${
                                      !interview.feedbackCount
                                        ? 'btn-cta'
                                        : 'btn-secondary'
                                    }`}
                                  >
                                    <ClockIcon className="w-3.5 h-3.5" />
                                    {!interview.feedbackCount ? 'Give Feedback' : 'Feedback'}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {showSchedulerModal && (
        <InterviewScheduler
          interviewId={editingInterview?.id}
          onSuccess={handleInterviewScheduled}
          onCancel={() => {
            setShowSchedulerModal(false);
            setEditingInterview(null);
          }}
          variant="modal"
        />
      )}
    </PageWrapper>
  );
}
