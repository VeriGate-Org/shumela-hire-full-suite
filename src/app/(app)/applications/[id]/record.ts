import { Stage } from '@/components/record/StageRail';

/**
 * Derivations for the application record.
 *
 * <p>Kept out of the page so each rule is testable without rendering, and so the page reads as
 * layout. Same arrangement as the requisition record.
 *
 * <p><b>What is deliberately absent here.</b> The design carried a dwell figure under each stage
 * ("11 days here") and an actor against each decision ("Kagiso Molefe · 9 Aug"). Neither can be
 * sourced. An application records `submittedAt` and nothing else per transition: `interviewedAt`,
 * `offerExtendedAt` and `responseDeadline` are declared, persisted, exposed and never written by
 * any service, and the notes fields are free text with no author. The audit log that would carry
 * both is written through `logUserAction`, which takes no entity id — so the history exists in a
 * form nothing can query for a given application — and records the applicant as the acting user,
 * so where it can be read it says each candidate screened themselves. Estimating either would be
 * inventing a fact about a person's work.
 */

export interface ApplicationRecord {
  id: string;
  status: string;
  applicantName?: string;
  jobTitle?: string;
  department?: string;
  applicationSource?: string;
  submittedAt?: string;
  daysFromSubmission?: number;
  coverLetter?: string;
  screeningNotes?: string;
  interviewFeedback?: string;
  rejectionReason?: string;
  offerDetails?: string;
  withdrawalReason?: string;
  rating?: number;
  allowedTransitions?: string[];
}

/** The five stages a candidacy passes through, and the statuses that sit in each. */
export const RAIL: { key: string; label: string; statuses: string[] }[] = [
  { key: 'applied', label: 'Applied', statuses: ['SUBMITTED'] },
  { key: 'screening', label: 'Screening', statuses: ['SCREENING'] },
  {
    key: 'interview',
    label: 'Interview',
    statuses: ['INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED', 'REFERENCE_CHECK'],
  },
  { key: 'offer', label: 'Offer', statuses: ['OFFER_PENDING', 'OFFERED', 'OFFER_ACCEPTED'] },
  { key: 'hired', label: 'Hired', statuses: ['HIRED'] },
];

export const ENDED_STATUSES = ['REJECTED', 'WITHDRAWN', 'OFFER_DECLINED'];

export function hasEnded(status: string): boolean {
  return ENDED_STATUSES.includes(status);
}

/**
 * How far along the candidacy is, as "3 of 5".
 *
 * <p>Null once it has ended: a rejected candidate is not at stage two of five, they are stopped,
 * and a progress figure would imply they are still moving.
 */
export function stagePosition(status: string): { index: number; total: number } | null {
  if (hasEnded(status)) return null;
  const index = RAIL.findIndex((stage) => stage.statuses.includes(status));
  if (index < 0) return null;
  return { index: index + 1, total: RAIL.length };
}

/**
 * The rail.
 *
 * <p>Stages before the current one are done, the current one is current, the rest are to come.
 * When the candidacy ended, the stage it ended at is marked stopped and everything after it reads
 * "Not reached" rather than being left blank — where it stopped is the substance.
 *
 * <p>No `days` and no `actor` on any stage: see the note at the head of this file.
 */
export function buildRail(record: ApplicationRecord): Stage[] {
  const ended = hasEnded(record.status);
  // Where the candidacy sits now — or, once ended, where it got to before it stopped. The status
  // alone cannot say where a rejection happened, so the notes are what evidence there is.
  const reached = ended ? lastEvidencedStage(record) : currentStageIndex(record.status);

  return RAIL.map((stage, index) => {
    if (ended && index === reached) {
      return {
        name: stage.label,
        state: 'stopped' as const,
        actor: endedLabel(record.status),
      };
    }
    if (index < reached) {
      return { name: stage.label, state: 'done' as const };
    }
    if (!ended && index === reached) {
      return { name: stage.label, state: 'current' as const, actor: 'Where it is now' };
    }
    return {
      name: stage.label,
      state: 'todo' as const,
      actor: ended ? 'Not reached' : undefined,
    };
  });
}

function currentStageIndex(status: string): number {
  const index = RAIL.findIndex((stage) => stage.statuses.includes(status));
  // An unrecognised status is treated as being at the start rather than as being finished — the
  // opposite guess would show a candidate as further along than anyone has established.
  return index < 0 ? 0 : index;
}

/**
 * The furthest stage there is evidence of, for a candidacy that has ended.
 *
 * <p>Read off what each stage produced, because the terminal status itself says only that it
 * ended, never where. Interview feedback means an interview happened; screening notes mean
 * screening did. Absent both, it ended at Applied.
 */
function lastEvidencedStage(record: ApplicationRecord): number {
  if (isPresent(record.offerDetails)) return 3;
  if (isPresent(record.interviewFeedback)) return 2;
  if (isPresent(record.screeningNotes)) return 1;
  return 0;
}

function endedLabel(status: string): string {
  switch (status) {
    case 'REJECTED':
      return 'Rejected here';
    case 'WITHDRAWN':
      return 'Withdrawn here';
    case 'OFFER_DECLINED':
      return 'Offer declined';
    default:
      return 'Stopped here';
  }
}

/** The ask at the top of the record, and its tone. */
export function decisionFor(record: ApplicationRecord): {
  ask: string;
  why?: string;
  tone: 'owed' | 'settled' | 'stopped';
} {
  const days = record.daysFromSubmission;
  const waited =
    typeof days === 'number' ? `${days} ${days === 1 ? 'day' : 'days'}` : undefined;

  switch (record.status) {
    case 'SUBMITTED':
      return {
        ask: 'This application has never been screened.',
        why: waited ? `Submitted ${waited} ago and untouched since.` : undefined,
        tone: 'owed',
      };
    case 'INTERVIEW_COMPLETED':
      return {
        ask: isPresent(record.interviewFeedback)
          ? 'The panel has filed feedback. A decision is owed.'
          : 'The interview is done and no feedback has been filed.',
        tone: 'owed',
      };
    case 'OFFERED':
      return { ask: 'An offer is with the candidate.', tone: 'owed' };
    case 'HIRED':
      return { ask: 'Hired.', tone: 'settled' };
    case 'OFFER_ACCEPTED':
      return { ask: 'The offer has been accepted.', tone: 'settled' };
    case 'REJECTED':
      return {
        ask: 'Rejected.',
        // Stated because the page cannot do it and the Offers screen can: saying nothing here is
        // how a candidate goes untold indefinitely.
        why: 'Regret correspondence is written on the Offers screen and is not sent from here.',
        tone: 'stopped',
      };
    case 'WITHDRAWN':
      return { ask: 'The candidate withdrew.', tone: 'stopped' };
    case 'OFFER_DECLINED':
      return { ask: 'The candidate declined the offer.', tone: 'stopped' };
    default:
      return {
        ask: 'This application is in progress.',
        why: waited ? `In process ${waited}.` : undefined,
        tone: 'owed',
      };
  }
}

/** A transition the page may offer, in the words a person would use for it. */
export interface RecordAction {
  status: string;
  label: string;
  intent: 'primary' | 'secondary' | 'destructive';
}

const ACTION_LABELS: Record<string, { label: string; intent: RecordAction['intent'] }> = {
  SCREENING: { label: 'Move to screening', intent: 'primary' },
  INTERVIEW_SCHEDULED: { label: 'Schedule interview', intent: 'primary' },
  INTERVIEW_COMPLETED: { label: 'Record interview done', intent: 'primary' },
  REFERENCE_CHECK: { label: 'Start reference check', intent: 'secondary' },
  OFFER_PENDING: { label: 'Prepare offer', intent: 'primary' },
  OFFERED: { label: 'Extend offer', intent: 'primary' },
  OFFER_ACCEPTED: { label: 'Record acceptance', intent: 'primary' },
  OFFER_DECLINED: { label: 'Record decline', intent: 'secondary' },
  HIRED: { label: 'Mark as hired', intent: 'primary' },
  REJECTED: { label: 'Reject', intent: 'destructive' },
  WITHDRAWN: { label: 'Record withdrawal', intent: 'secondary' },
};

/**
 * The actions this record can actually take.
 *
 * <p>Driven entirely by `allowedTransitions`, which the API computes from
 * `ApplicationStatus.canTransitionTo`. The page holds no copy of the transition table, so it
 * cannot drift out of step with the rule the server will enforce — and it cannot offer a button
 * that returns 400.
 *
 * <p>The page previously offered <b>only Reject</b>: you could end a candidacy from here but not
 * advance one, though the endpoint has always been generic.
 */
export function actionsFor(record: ApplicationRecord): RecordAction[] {
  const allowed = record.allowedTransitions ?? [];
  return allowed
    .filter((status) => ACTION_LABELS[status])
    .map((status) => ({ status, ...ACTION_LABELS[status] }))
    .sort((a, b) => intentRank(a.intent) - intentRank(b.intent));
}

function intentRank(intent: RecordAction['intent']): number {
  return intent === 'primary' ? 0 : intent === 'secondary' ? 1 : 2;
}

/**
 * Whether a rejection can be undone.
 *
 * <p>It cannot. `canTransitionTo` returns false for every target from `REJECTED`, so the status is
 * terminal — and the confirmation dialog on this page has been reassuring users that "this action
 * can be reversed by changing the status again", on a screen that offered no way to change it and
 * against an API that would refuse. Whatever the dialog says now has to match this.
 */
export function isReversible(status: string): boolean {
  return !['REJECTED', 'WITHDRAWN', 'OFFER_DECLINED', 'HIRED'].includes(status);
}

/** One stage of the record and what it produced. */
export interface NarrativeEntry {
  stage: string;
  kind: string;
  body?: string;
  /** Said out loud when the stage produced nothing — the gap is the finding. */
  absent: string;
}

/**
 * The record so far, as one staged sequence.
 *
 * <p>Cover letter, screening notes and interview feedback were three identical full-width cards,
 * each rendered only if populated — so the page changed shape with how far the candidate had got,
 * and nothing said which stage produced which note. Here they are always all present, in order,
 * and a stage that produced nothing says so. That is how a 23-day unscreened gap becomes visible
 * rather than simply being a card that is not on the page.
 */
export function narrative(record: ApplicationRecord): NarrativeEntry[] {
  const entries: NarrativeEntry[] = [
    {
      stage: 'Applied',
      kind: 'Cover letter',
      body: textOrUndefined(record.coverLetter),
      absent: 'No cover letter was submitted.',
    },
    {
      stage: 'Screening',
      kind: 'Screening notes',
      body: textOrUndefined(record.screeningNotes),
      absent:
        record.status === 'SUBMITTED'
          ? 'Not yet screened. This is the step that is outstanding.'
          : 'No screening notes were recorded.',
    },
    {
      stage: 'Interview',
      kind: 'Interview feedback',
      body: textOrUndefined(record.interviewFeedback),
      absent: 'No interview feedback.',
    },
  ];

  // Only shown once there is an outcome to explain: an empty "Outcome" row on a live application
  // would read as a missing record rather than an absent event.
  const outcome = textOrUndefined(record.rejectionReason ?? record.withdrawalReason);
  if (outcome) {
    entries.push({
      stage: 'Outcome',
      kind: record.status === 'WITHDRAWN' ? 'Withdrawal reason' : 'Rejection reason',
      body: outcome,
      absent: 'No reason was recorded.',
    });
  }

  return entries;
}

/** How many of the stages have produced something, for the panel's own summary. */
export function narrativeFilled(entries: NarrativeEntry[]): number {
  return entries.filter((entry) => Boolean(entry.body)).length;
}

function isPresent(value?: string | null): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function textOrUndefined(value?: string | null): string | undefined {
  return isPresent(value) ? (value as string).trim() : undefined;
}
