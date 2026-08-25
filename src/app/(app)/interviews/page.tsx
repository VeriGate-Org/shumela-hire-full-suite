'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  ListBulletIcon,
  PlusIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import PageWrapper from '@/components/PageWrapper';
import { apiFetch } from '@/lib/api-fetch';
import EmptyState from '@/components/EmptyState';
import { TableSkeleton } from '@/components/LoadingComponents';
import IdentityBand from '@/components/record/IdentityBand';
import DecisionBar, { PrimaryAction, SecondaryAction } from '@/components/record/DecisionBar';
import DistributionStrip from '@/components/record/DistributionStrip';
import FilterChips from '@/components/record/FilterChips';
import {
  InterviewSummary,
  QUEUE_FILTERS,
  STATE_LABELS,
  byMostOverdue,
  feedbackFiled,
  filterCount,
  stateOf,
  waitingDays,
  whenLabel,
} from './queue';
import InterviewScheduler from '@/components/InterviewScheduler';
import InterviewCalendar, { type Interview as CalendarInterview } from '@/components/InterviewCalendar';
import InterviewFeedbackForm from '@/components/InterviewFeedbackForm';
import ErrorState from '@/components/ErrorState';
import { useToast } from '@/components/Toast';
import { CardSkeleton } from '@/components/LoadingComponents';
import { getEnumLabel } from '@/utils/enumLabels';
import AiAssistPanel from '@/components/ai/AiAssistPanel';
import AiInterviewQuestionGenerator from '@/components/ai/AiInterviewQuestionGenerator';

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
  /** Denormalised on some responses; the fallback when the applicant is not hydrated. */
  candidateName?: string;
}

type InterviewView = 'calendar' | 'feedback' | 'list';

export default function InterviewsPage() {
  const { toast } = useToast();
  // The queue leads. A calendar answers "what is on this week"; it cannot show a thing that
  // already happened and is stuck, which is what this screen mostly needs to surface.
  const [view, setView] = useState<InterviewView>('list');
  const [summary, setSummary] = useState<InterviewSummary | null>(null);
  const [activeFilter, setActiveFilter] = useState('needs-action');
  const [chasing, setChasing] = useState(false);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [showSchedulerModal, setShowSchedulerModal] = useState(false);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
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

  const loadSummary = useCallback(async () => {
    try {
      const response = await apiFetch('/api/interviews/summary');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setSummary(await response.json());
    } catch {
      // Left null rather than zeroed. Every figure derived from it is then omitted, because a
      // failed request must not render as "nothing is waiting".
      setSummary(null);
    }
  }, []);

  useEffect(() => {
    if (view === 'list' || view === 'calendar') {
      void loadInterviews();
    }
  }, [view, loadInterviews]);

  // Deep link into one interview's feedback form: /interviews?feedback={id}
  //
  // The feedback view was reachable only by clicking through this page, which left the
  // Interviewer dashboard's "Submit Feedback" button with nowhere to point — it carried no
  // onClick at all, so the primary action of that screen did nothing. Rather than build a second
  // feedback form on the dashboard (a fourth surface, the mistake #299 unwound for candidate
  // records), the form stays here and gains an address.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const wanted = new URLSearchParams(window.location.search).get('feedback');
    if (!wanted) return;

    const match = interviews.find((interview) => String(interview.id) === wanted);
    // Silently ignored when the id is not in the loaded set — the interviewer still lands on a
    // working page rather than an error about an interview they may not be on the panel for.
    if (match) {
      setSelectedInterview(match);
      setView('feedback');
    }
  }, [interviews]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  /**
   * Ask the panels for the outstanding write-ups.
   *
   * <p>POST /{id}/request-feedback stamps feedbackRequestedAt and notifies — a real engine, not a
   * button that only looks like one. The ids come from the summary, so this chases every
   * outstanding write-up rather than the ones on the loaded page.
   */
  const chaseWriteUps = useCallback(async () => {
    const ids = summary?.awaitingWriteUpIds ?? [];
    if (ids.length === 0) return;
    setChasing(true);
    try {
      const results = await Promise.all(
        ids.map((id) => apiFetch(`/api/interviews/${id}/request-feedback`, { method: 'POST' })),
      );
      const failed = results.filter((response) => !response.ok);
      if (failed.length > 0) {
        // Says how many, rather than reporting a clean success over a partial one.
        toast(
          `${results.length - failed.length} of ${results.length} panels asked; ${failed.length} could not be reached`,
          'error',
        );
      } else {
        toast(`${results.length} ${results.length === 1 ? 'panel' : 'panels'} asked for their write-up`, 'success');
      }
      void loadSummary();
      void loadInterviews();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not request feedback', 'error');
    } finally {
      setChasing(false);
    }
  }, [summary, toast, loadSummary, loadInterviews]);

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

    const matchesType = typeFilter === 'ALL' || interview.type === typeFilter;

    return matchesSearch && matchesType;
  }), [interviews, searchTerm, typeFilter]);

  // Offered from what the data contains, so the filter cannot list a type this tenant never uses
  // and return an empty table for it.
  const typeOptions = useMemo(
    () => Array.from(new Set(interviews.map((interview) => interview.type).filter(Boolean))).sort(),
    [interviews],
  );

  /**
   * The rows for the table.
   *
   * <p>Filtered by the active chip, then ordered so what is stalled leads. The chips' counts come
   * from the summary and describe the whole set; these rows are the page of records in hand, which
   * is why the two are computed separately rather than one from the other.
   */
  const rows = useMemo(() => {
    const states = QUEUE_FILTERS.find((filter) => filter.key === activeFilter)?.states ?? [];
    const matching = states.length === 0
      ? filteredInterviews
      : filteredInterviews.filter((interview) => states.includes(stateOf(interview)));
    return byMostOverdue(matching);
  }, [filteredInterviews, activeFilter]);

  const getPageTitle = () => {
    switch (view) {
      case 'feedback': return 'Interview Feedback';
      case 'calendar': return 'Interview Scheduling';
      default: return 'Interviews';
    }
  };

  const getCandidateFullName = (interview: Interview) => {
    const name = interview.application?.applicant?.name ?? '';
    const surname = interview.application?.applicant?.surname ?? '';
    return (name + ' ' + surname).trim() || interview.candidateName || 'Unknown Candidate';
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
    <PageWrapper>
      <div className="space-y-6">

        {/* Interview question generation belongs where interviews are arranged. The component
            was written, tested and mounted nowhere — reachable only by knowing it existed. */}
        <AiAssistPanel
          title="AI Interview Questions"
          feature="AI_INTERVIEW_QUESTIONS"
          description="Generate role-specific interview questions from the vacancy's requirements"
        >
          <AiInterviewQuestionGenerator />
        </AiAssistPanel>

        <IdentityBand
          actions={scheduleButton}
          eyebrow="Interview schedule"
          // The band renders in all three views, so the title has to follow the view or the
          // feedback and calendar screens both announce themselves as "Interviews".
          title={getPageTitle()}
          subtitle={
            summary
              ? `${summary.total} ${summary.total === 1 ? 'interview' : 'interviews'} on record`
              : 'Counts unavailable'
          }
          figures={
            summary
              ? [
                  {
                    label: 'Awaiting write-up',
                    value: summary.awaitingWriteUp,
                    tone: (summary.awaitingWriteUp > 0 ? 'critical' : undefined) as
                      | 'critical'
                      | undefined,
                  },
                  {
                    label: 'Slot passed, untouched',
                    value: summary.slotPassed,
                    tone: (summary.slotPassed > 0 ? 'warning' : undefined) as 'warning' | undefined,
                  },
                  { label: 'Next 7 days', value: summary.nextSevenDays },
                ]
              : []
          }
        />

        {summary && summary.awaitingWriteUp > 0 && (
          <DecisionBar
            ask={`${summary.awaitingWriteUp} ${
              summary.awaitingWriteUp === 1 ? 'interview is' : 'interviews are'
            } finished and nobody has written ${summary.awaitingWriteUp === 1 ? 'it' : 'them'} up.`}
            why={
              typeof summary.oldestWriteUpDays === 'number'
                ? `Each one is holding a candidate at the interview stage. The oldest finished ${
                    summary.oldestWriteUpDays
                  } ${summary.oldestWriteUpDays === 1 ? 'day' : 'days'} ago.`
                : 'Each one is holding a candidate at the interview stage.'
            }
          >
            <PrimaryAction onClick={() => chaseWriteUps()} disabled={chasing}>
              {chasing ? 'Chasing…' : 'Chase write-ups'}
            </PrimaryAction>
            <SecondaryAction
              onClick={() => {
                setEditingInterview(null);
                setShowSchedulerModal(true);
              }}
            >
              Schedule interview
            </SecondaryAction>
          </DecisionBar>
        )}

        {summary ? (
          <DistributionStrip
            buckets={[
              {
                label: 'Awaiting write-up',
                count: summary.awaitingWriteUp,
                detail: 'Done, no feedback filed',
              },
              { label: 'Slot passed', count: summary.slotPassed, detail: 'Never started or cancelled' },
              { label: 'Today', count: summary.today },
              { label: 'Next 7 days', count: summary.nextSevenDays, detail: 'Still scheduled' },
              {
                label: 'Written up',
                count: filterCount(summary, 'written-up') ?? 0,
                detail:
                  typeof summary.medianDaysToWriteUp === 'number'
                    ? `Median ${summary.medianDaysToWriteUp} ${
                        summary.medianDaysToWriteUp === 1 ? 'day' : 'days'
                      } to file`
                    : undefined,
              },
            ]}
            footnote={
              <>
                The first two are stalls the backend already computes and this screen has never
                shown. They need different remedies: one chases the panel, the other asks whether
                the interview happened at all.
              </>
            }
          />
        ) : (
          !loading && (
            <p className="text-sm text-muted-foreground px-1">
              Counts are unavailable — the summary could not be loaded.
            </p>
          )
        )}

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
            className="space-y-4"
          >
            <FilterChips
              chips={QUEUE_FILTERS.map((filter) => ({
                key: filter.key,
                label: filter.label,
                count: filterCount(summary, filter.key) ?? undefined,
              }))}
              activeKey={activeFilter}
              onChange={setActiveFilter}
              note={
                <>
                  Sorted by <b className="font-bold text-foreground">most overdue</b>
                </>
              }
            />

            <div className="enterprise-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[240px]">
                  <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by candidate, title or department"
                    aria-label="Search interviews"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-full border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  aria-label="Filter by interview type"
                  className="px-3 py-2 text-sm rounded-full border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="ALL">All types</option>
                  {typeOptions.map((option) => (
                    <option key={option} value={option}>
                      {getEnumLabel('interviewType', option)}
                    </option>
                  ))}
                </select>
              </div>

              {error ? (
                <ErrorState title="Failed to load interviews" message={error} onRetry={loadInterviews} />
              ) : loading ? (
                <TableSkeleton rows={8} columns={5} />
              ) : rows.length === 0 ? (
                <EmptyState
                  icon={CalendarDaysIcon}
                  title="Nothing here"
                  description={
                    activeFilter === 'needs-action'
                      ? 'No interview is waiting on anybody.'
                      : 'No interviews match this filter.'
                  }
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        {['Candidate', 'When', 'Write-up', 'State', 'Waiting'].map((heading, i) => (
                          <th
                            key={heading}
                            className={`px-5 py-3 text-[0.5625rem] font-extrabold uppercase tracking-[0.14em] text-muted-foreground ${
                              i === 4 ? 'text-right' : 'text-left'
                            }`}
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((interview) => {
                        const state = stateOf(interview);
                        const filed = feedbackFiled(interview);
                        const waited = waitingDays(interview);
                        const when = whenLabel(interview);
                        const stalled = state === 'awaiting-write-up' || state === 'slot-passed';
                        return (
                          <tr
                            key={interview.id}
                            onClick={() => handleInterviewSelect(interview)}
                            className="border-b border-border last:border-0 hover:bg-accent/50 cursor-pointer"
                          >
                            <td className="px-5 py-3.5">
                              <div className="font-semibold text-foreground text-sm">
                                {getCandidateFullName(interview)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {[interview.application?.jobPosting?.title, interview.title]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="text-sm text-foreground">
                                {interview.scheduledAt
                                  ? new Date(interview.scheduledAt).toLocaleDateString('en-ZA', {
                                      day: 'numeric',
                                      month: 'short',
                                    })
                                  : '—'}
                              </div>
                              <div className="text-xs text-muted-foreground">{when ?? 'Not scheduled'}</div>
                              {typeof interview.rescheduleCount === 'number' &&
                                interview.rescheduleCount > 0 && (
                                  // An interview moved repeatedly is a signal about the panel, not
                                  // the candidate. Recorded on the entity and never rendered.
                                  <div className="text-xs text-accent-gold mt-0.5">
                                    Rescheduled {interview.rescheduleCount}×
                                  </div>
                                )}
                            </td>
                            <td className="px-5 py-3.5">
                              {filed === null ? (
                                <span className="text-xs text-muted-foreground">—</span>
                              ) : (
                                // How many write-ups exist. Not "1 of 3": the intended panel size
                                // would be a comma count over a free-text field.
                                <span className="text-sm text-foreground tabular-nums">
                                  {filed} filed
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3.5">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-[0.6875rem] font-semibold ${
                                  state === 'awaiting-write-up'
                                    ? 'bg-error-bg text-error'
                                    : state === 'slot-passed'
                                      ? 'bg-warning-bg text-warning'
                                      : state === 'written-up'
                                        ? 'bg-success-bg text-success'
                                        : 'bg-muted/40 text-muted-foreground'
                                }`}
                              >
                                {STATE_LABELS[state]}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              {waited === null ? (
                                // Not waiting on anybody. A zero here would put it in a queue of
                                // things to chase.
                                <span className="text-sm text-muted-foreground">—</span>
                              ) : (
                                <span
                                  className={`text-sm font-semibold tabular-nums ${
                                    stalled && waited >= 7 ? 'text-error' : 'text-foreground'
                                  }`}
                                >
                                  {waited} {waited === 1 ? 'day' : 'days'}
                                </span>
                              )}
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
