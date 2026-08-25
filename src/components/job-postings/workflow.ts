import type { Stage, StageState } from '@/components/record/StageRail';

/**
 * The approval-and-publishing lifecycle of a job advert.
 *
 * <p><b>Five columns, eight states.</b> {@code JobPostingStatus} has DRAFT, PENDING_APPROVAL,
 * APPROVED, PUBLISHED, UNPUBLISHED, REJECTED, CLOSED and CANCELLED, but the lifecycle a person
 * follows is five steps. The three extra states are all <em>stops</em> rather than steps:
 *
 * <ul>
 *   <li>REJECTED stops at approval and can be amended and resubmitted;</li>
 *   <li>UNPUBLISHED is a published advert that was pulled — it stops at Published, it is not a
 *       sixth step after it;</li>
 *   <li>CANCELLED stops wherever it had reached.</li>
 * </ul>
 *
 * <p>Modelling them as stops is what stops the rail having a column that is empty for almost every
 * advert, and it means pressing Unpublish — an action the API offers — cannot move a posting into a
 * state the rail is unable to draw.
 */

export type PostingStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'UNPUBLISHED'
  | 'REJECTED'
  | 'CLOSED'
  | 'CANCELLED';

export interface JobPostingRecord {
  id: string;
  title?: string;
  department?: string;
  location?: string;
  status?: PostingStatus;
  statusDisplayName?: string;
  requisitionId?: string;
  positionsAvailable?: number;
  employmentTypeDisplayName?: string;
  experienceLevelDisplayName?: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryRange?: string;
  createdBy?: string;
  approvedBy?: string;
  publishedBy?: string;
  approvalNotes?: string;
  rejectionReason?: string;
  requiredCheckTypes?: string;
  enforceCheckCompletion?: boolean;
  viewsCount?: number;
  applicationsCount?: number;
  createdAt?: string;
  updatedAt?: string;
  submittedForApprovalAt?: string;
  approvedAt?: string;
  publishedAt?: string;
  unpublishedAt?: string;
  closedAt?: string;
  applicationDeadline?: string;
  // Server-computed authority. The client never decides who may act — job postings are the one
  // mechanism in this product that answers that question outright, and guessing it here would
  // reintroduce exactly the divergence the approval work removed.
  canBeApproved?: boolean;
  canBeRejected?: boolean;
  canBePublished?: boolean;
  canBeUnpublished?: boolean;
  canBeClosed?: boolean;
  canBeSubmittedForApproval?: boolean;
}

export function isJobPostingRecord(value: unknown): value is JobPostingRecord {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<JobPostingRecord>;
  return typeof candidate.id === 'string';
}

/** The five steps, in order. */
export const RAIL = ['Drafted', 'Pending approval', 'Approved', 'Published', 'Closed'] as const;

/** How far the lifecycle got, as an index into {@link RAIL}. */
function reachedIndex(status: PostingStatus | undefined): number {
  switch (status) {
    case 'DRAFT':
      return 0;
    case 'PENDING_APPROVAL':
    case 'REJECTED':
      return 1;
    case 'APPROVED':
      return 2;
    case 'PUBLISHED':
    case 'UNPUBLISHED':
      return 3;
    case 'CLOSED':
      return 4;
    case 'CANCELLED':
      // Cancelled says nothing about how far it got. Treating it as stopped at the first step is
      // the only claim the status itself supports.
      return 0;
    default:
      return 0;
  }
}

/** Statuses where the lifecycle stopped rather than progressed. */
export function isStopped(status: PostingStatus | undefined): boolean {
  return status === 'REJECTED' || status === 'CANCELLED' || status === 'UNPUBLISHED';
}

/** Whole days between two ISO timestamps, or null when either is missing or unparseable. */
export function dwell(from?: string, to?: string, now: number = Date.now()): number | null {
  if (!from) return null;
  const start = new Date(from).getTime();
  if (Number.isNaN(start)) return null;
  const end = to ? new Date(to).getTime() : now;
  if (Number.isNaN(end)) return null;
  return Math.max(0, Math.floor((end - start) / 86_400_000));
}

export function shortDate(iso?: string): string | undefined {
  if (!iso) return undefined;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * The rail, with each step's actor, date and dwell time.
 *
 * <p>Dwell is the gap between a step's own timestamp and the next one's — for the step the posting
 * is sitting in, the gap to now. Every figure is a subtraction between two fields already on the
 * record, so the rail costs nothing beyond the fetch.
 *
 * <p><b>One dwell cannot be shown.</b> There is no {@code rejectedAt} field, so a rejected posting's
 * time in approval is not derivable — {@code updatedAt} would be an approximation dressed as a
 * measurement. It is left blank, and the audit trail carries the real rejection timestamp.
 */
export function buildStages(posting: JobPostingRecord, now: number = Date.now()): Stage[] {
  const status = posting.status;
  const reached = reachedIndex(status);
  const stopped = isStopped(status);

  const at = [
    posting.createdAt,
    posting.submittedForApprovalAt,
    posting.approvedAt,
    posting.publishedAt,
    posting.closedAt,
  ];

  const actors = [posting.createdBy, undefined, posting.approvedBy, posting.publishedBy, undefined];

  return RAIL.map((name, index) => {
    let state: StageState;
    if (index < reached) {
      state = 'done';
    } else if (index === reached) {
      state = stopped ? 'stopped' : 'current';
    } else {
      state = 'todo';
    }

    // A step that was never reached has no date, no actor and no dwell — rendering "0 days" there
    // would read as "passed through instantly".
    if (state === 'todo') {
      return { name, state };
    }

    // The rejected step has no closing timestamp of its own; see the note above.
    const noDwell = state === 'stopped' && status === 'REJECTED';
    const days = noDwell ? null : dwell(at[index], at[index + 1], now);

    return {
      name,
      state,
      actor: actors[index],
      when: shortDate(at[index]),
      ...(days === null ? {} : { days }),
    };
  });
}

/**
 * What the rail's footnote should say — the shape of the whole journey, or where it stopped.
 */
export function railFootnote(posting: JobPostingRecord, now: number = Date.now()): string {
  const status = posting.status;

  if (status === 'REJECTED') {
    return 'Rejected at approval. Amending and resubmitting returns this to Pending approval and starts the approval clock again.';
  }
  if (status === 'CANCELLED') {
    return 'Cancelled. The status does not record how far it had progressed, so only the first step is marked.';
  }
  if (status === 'UNPUBLISHED') {
    return 'Published and then withdrawn. It is not closed — it can be published again.';
  }

  const toLive = dwell(posting.createdAt, posting.publishedAt, now);
  if (toLive !== null && posting.publishedAt) {
    return `Draft to live in ${toLive} ${toLive === 1 ? 'day' : 'days'}. Bar length is time spent in each step.`;
  }
  return 'Bar length is time spent in each step.';
}

/**
 * The verification checks a hire is gated on, as stored on the posting.
 *
 * <p>Stored as a delimited string rather than a list, so it is split here rather than in the page.
 */
export function checkTypes(posting: JobPostingRecord): string[] {
  if (!posting.requiredCheckTypes) return [];
  return posting.requiredCheckTypes
    .split(/[,;]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/** Title case for an enum-ish token: CRIMINAL_RECORD → Criminal record. */
export function humanise(token: string): string {
  const spaced = token.replace(/_/g, ' ').toLowerCase().trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
