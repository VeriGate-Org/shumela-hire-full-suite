'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  ListBulletIcon,
  PlusIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ChartBarIcon,
  PencilSquareIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import PageWrapper from '@/components/PageWrapper';
import InterviewScheduler from '@/components/InterviewScheduler';
import InterviewCalendar from '@/components/InterviewCalendar';
import InterviewFeedbackForm from '@/components/InterviewFeedbackForm';

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
  instructions?: string;
  agenda?: string;
  interviewerId: number;
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
  rescheduleCount: number;
  reminderSentAt?: string;
  feedbackRequestedAt?: string;
  feedbackSubmittedAt?: string;
  createdBy: number;
  createdAt: string;
  updatedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
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

type InterviewView = 'calendar' | 'schedule' | 'feedback' | 'list';

export default function InterviewsPage() {
  const [view, setView] = useState<InterviewView>('calendar');
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const loadInterviews = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/interviews');
      if (response.ok) {
        const data = await response.json();
        setInterviews(data.content || data);
      }
    } catch (error) {
      console.error('Error loading interviews:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view === 'list' || view === 'calendar') {
      void loadInterviews();
    }
  }, [view, loadInterviews]);

  const handleInterviewScheduled = useCallback((interview: Interview) => {
    console.log('Interview saved:', interview);
    setSelectedInterview(null);
    setView('calendar');
    void loadInterviews();
  }, [loadInterviews]);

  const handleInterviewUpdated = useCallback((interviewId: number, updatedInterview: Interview) => {
    setInterviews((prev) => prev.map((interview) =>
      interview.id === interviewId ? updatedInterview : interview,
    ));
    void loadInterviews();
  }, [loadInterviews]);

  const handleFeedbackSubmitted = useCallback((interviewId: number) => {
    console.log('Feedback submitted for interview:', interviewId);
    setView('calendar');
    setSelectedInterview(null);
    void loadInterviews();
  }, [loadInterviews]);

  const handleInterviewSelect = useCallback((interview: Interview) => {
    setSelectedInterview(interview);
  }, []);

  const filteredInterviews = useMemo(() => interviews.filter((interview) => {
    const normalizedSearch = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm
      || interview.title.toLowerCase().includes(normalizedSearch)
      || interview.application.applicant.firstName.toLowerCase().includes(normalizedSearch)
      || interview.application.applicant.lastName.toLowerCase().includes(normalizedSearch)
      || interview.application.jobPosting.title.toLowerCase().includes(normalizedSearch)
      || interview.application.jobPosting.department.toLowerCase().includes(normalizedSearch);

    const matchesStatus = statusFilter === 'ALL' || interview.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || interview.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  }), [interviews, searchTerm, statusFilter, typeFilter]);

  const statusOptions = useMemo(() => [...new Set(interviews.map((interview) => interview.status))], [interviews]);
  const typeOptions = useMemo(() => [...new Set(interviews.map((interview) => interview.type))], [interviews]);
  const upcomingInterviews = useMemo(() => interviews.filter((interview) => interview.isUpcoming).slice(0, 5), [interviews]);
  const overdueInterviews = useMemo(() => interviews.filter((interview) => interview.isOverdue), [interviews]);
  const pendingFeedback = useMemo(() => interviews.filter((interview) => interview.requiresFeedback), [interviews]);

  const getPageTitle = () => {
    switch (view) {
      case 'calendar': return 'Interview Calendar';
      case 'schedule': return selectedInterview ? 'Edit Interview' : 'Schedule Interview';
      case 'feedback': return 'Interview Feedback';
      default: return 'Interview Management';
    }
  };

  const getPageSubtitle = () => {
    switch (view) {
      case 'calendar': return 'Coordinate interviews, track status, and manage actions from one calendar.';
      case 'schedule': return selectedInterview
        ? 'Update logistics, timing, and interview structure for the selected interview.'
        : 'Schedule a new interview with validated timing and interviewer availability.';
      case 'feedback': return 'Submit structured, auditable feedback for completed interviews.';
      default: return 'Search, filter, and manage the full interview pipeline.';
    }
  };

  const getStatusPillClass = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-gold-100 text-gold-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-muted text-foreground';
    }
  };

  const tabs: Array<{ id: InterviewView; label: string; icon: typeof CalendarDaysIcon }> = [
    { id: 'calendar', label: 'Calendar', icon: CalendarDaysIcon },
    { id: 'schedule', label: selectedInterview ? 'Edit' : 'Schedule', icon: PlusIcon },
    { id: 'list', label: 'List', icon: ListBulletIcon },
  ];

  return (
    <PageWrapper title={getPageTitle()} subtitle={getPageSubtitle()}>
      <div className="space-y-6">
        <div className="enterprise-card p-2">
          <nav role="tablist" aria-label="Interview views" className="-mb-px flex flex-wrap gap-2">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                role="tab"
                aria-selected={view === id}
                aria-controls={`interviews-panel-${id}`}
                id={`interviews-tab-${id}`}
                onClick={() => {
                  if (id === 'schedule' && !selectedInterview) {
                    setSelectedInterview(null);
                  }
                  setView(id);
                }}
                className={`inline-flex items-center gap-2 px-3 py-2 border rounded-control text-sm font-medium transition-colors ${
                  view === id
                    ? 'border-cta bg-cta/10 text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="enterprise-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-card bg-gold-100 text-gold-700"><CalendarDaysIcon className="w-5 h-5" /></div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Upcoming</p>
                <p className="text-lg font-bold text-foreground">{upcomingInterviews.length}</p>
              </div>
            </div>
          </div>
          <div className="enterprise-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-card bg-red-100 text-red-700"><ExclamationTriangleIcon className="w-5 h-5" /></div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-lg font-bold text-foreground">{overdueInterviews.length}</p>
              </div>
            </div>
          </div>
          <div className="enterprise-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-card bg-yellow-100 text-yellow-700"><ChatBubbleLeftRightIcon className="w-5 h-5" /></div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Feedback</p>
                <p className="text-lg font-bold text-foreground">{pendingFeedback.length}</p>
              </div>
            </div>
          </div>
          <div className="enterprise-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-card bg-green-100 text-green-700"><ChartBarIcon className="w-5 h-5" /></div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Interviews</p>
                <p className="text-lg font-bold text-foreground">{interviews.length}</p>
              </div>
            </div>
          </div>
        </div>

        {view === 'calendar' && (
          <section
            role="tabpanel"
            id="interviews-panel-calendar"
            aria-labelledby="interviews-tab-calendar"
            className="space-y-4"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-foreground">Interview Calendar</h2>
              <button
                onClick={() => {
                  setSelectedInterview(null);
                  setView('schedule');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-transparent border-2 border-cta text-primary hover:bg-cta hover:text-cta-foreground uppercase tracking-wider rounded-full text-sm font-medium"
              >
                <PlusIcon className="w-4 h-4" />
                Schedule New Interview
              </button>
            </div>

            <InterviewCalendar
              interviews={interviews}
              onInterviewSelect={handleInterviewSelect}
              onInterviewUpdate={handleInterviewUpdated}
            />
          </section>
        )}

        {view === 'schedule' && (
          <section
            role="tabpanel"
            id="interviews-panel-schedule"
            aria-labelledby="interviews-tab-schedule"
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

            <InterviewScheduler
              interviewId={selectedInterview?.id}
              onSuccess={handleInterviewScheduled}
              onCancel={() => {
                setView('calendar');
                setSelectedInterview(null);
              }}
            />
          </section>
        )}

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

        {view === 'list' && (
          <section
            role="tabpanel"
            id="interviews-panel-list"
            aria-labelledby="interviews-tab-list"
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-foreground">All Interviews</h2>
              <button
                onClick={() => {
                  setSelectedInterview(null);
                  setView('schedule');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-transparent border-2 border-cta text-primary hover:bg-cta hover:text-cta-foreground uppercase tracking-wider rounded-full text-sm font-medium"
              >
                <PlusIcon className="w-4 h-4" />
                Schedule New Interview
              </button>
            </div>

            <div className="enterprise-card p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Search Interviews</label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by title, candidate, or job"
                      className="w-full pl-10 p-2 border border-border bg-card rounded-control focus:ring-2 focus:ring-gold-500/60 focus:border-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Filter by Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full p-2 border border-border bg-card rounded-control focus:ring-2 focus:ring-gold-500/60 focus:border-primary"
                  >
                    <option value="ALL">All Statuses</option>
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>{status.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Filter by Type</label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full p-2 border border-border bg-card rounded-control focus:ring-2 focus:ring-gold-500/60 focus:border-primary"
                  >
                    <option value="ALL">All Types</option>
                    {typeOptions.map((type) => (
                      <option key={type} value={type}>{type.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cta" />
              </div>
            ) : (
              <div className="space-y-4">
                {filteredInterviews.length === 0 ? (
                  <div className="enterprise-card p-8 text-center">
                    <p className="text-muted-foreground mb-4">
                      {interviews.length === 0
                        ? 'No interviews found. Create your first interview to begin scheduling workflows.'
                        : 'No interviews match your current search and filter criteria.'}
                    </p>
                    <button
                      onClick={() => {
                        setSelectedInterview(null);
                        setView('schedule');
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-transparent border-2 border-cta text-primary hover:bg-cta hover:text-cta-foreground uppercase tracking-wider rounded-full text-sm font-medium"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Schedule Interview
                    </button>
                  </div>
                ) : (
                  filteredInterviews.map((interview) => (
                    <article key={interview.id} className="enterprise-card p-6">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0 space-y-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-medium text-foreground truncate">{interview.title}</h3>
                            {interview.isUpcoming && (
                              <span className="bg-gold-100 text-gold-800 text-xs font-medium px-2 py-1 rounded-control">
                                Upcoming
                              </span>
                            )}
                            {interview.isOverdue && (
                              <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-control">
                                Overdue
                              </span>
                            )}
                            {interview.requiresFeedback && (
                              <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-control">
                                Feedback Needed
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                            <div>
                              <p><span className="font-medium text-foreground">Candidate:</span> {interview.application.applicant.firstName} {interview.application.applicant.lastName}</p>
                              <p><span className="font-medium text-foreground">Position:</span> {interview.application.jobPosting.title}</p>
                              <p><span className="font-medium text-foreground">Type:</span> {interview.typeDisplayName}</p>
                            </div>
                            <div>
                              <p><span className="font-medium text-foreground">Round:</span> {interview.roundDisplayName}</p>
                              <p><span className="font-medium text-foreground">Date:</span> {new Date(interview.scheduledAt).toLocaleDateString()}</p>
                              <p><span className="font-medium text-foreground">Time:</span> {new Date(interview.scheduledAt).toLocaleTimeString()}</p>
                            </div>
                          </div>

                          {interview.location && (
                            <p className="text-sm text-muted-foreground">
                              Location: {interview.location}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusPillClass(interview.status)}`}>
                            {interview.statusDisplayName}
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedInterview(interview);
                                setView('schedule');
                              }}
                              className="inline-flex items-center gap-1 text-link hover:text-link-hover text-sm font-medium"
                            >
                              <PencilSquareIcon className="w-4 h-4" />
                              Edit
                            </button>

                            {interview.requiresFeedback && (
                              <button
                                onClick={() => {
                                  setSelectedInterview(interview);
                                  setView('feedback');
                                }}
                                className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 text-sm font-medium"
                              >
                                <ClockIcon className="w-4 h-4" />
                                Add Feedback
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </PageWrapper>
  );
}
