/**
 * What a hiring manager's dashboard can honestly say, derived from responses it already fetches.
 *
 * <p>This exists because eight figures on that screen could not say anything. Two real-time tiles
 * and six "hiring performance indicators" were fed by {@code /api/analytics/kpis}, which answers
 * {@code {"kpis":{}}} for a reason that is worth stating precisely: the metrics <b>are</b> computed
 * — {@code MetricsComputationScheduler} writes sixteen of them on every container start — but they
 * are stored under categories {@code APPLICATIONS}, {@code INTERVIEWS}, {@code OFFERS},
 * {@code EFFICIENCY} and {@code PIPELINE}, while every KPI reader filters for
 * {@code metricCategory == "KPI"}. That string appears in the backend five times and every one is a
 * read. The filter matches nothing, so the frontend's replace-the-array branch never fires and six
 * hardcoded zeros reached the screen with invented targets and a progress bar drawn against them.
 *
 * <p>Fixing that is a backend change, and which of the sixteen belong on this screen is a product
 * decision. Meanwhile these three signals need no backend change at all: they come from the
 * applications and postings the page already loads.
 */

/** An application row, as much of it as these derivations touch. */
export interface ApplicationLike {
  applicantName?: string;
  jobTitle?: string;
  status?: string;
  submittedAt?: string;
}

/** A published posting, as much of it as these derivations touch. */
export interface PostingLike {
  id?: string;
  title?: string;
  /**
   * Note the plural. `JobPostingResponse` calls it `applicationsCount`; the widget read
   * `applicationCount`, which exists on a different entity entirely, so every open role displayed
   * "0 applications" whatever its real figure was.
   */
  applicationsCount?: number;
}

/**
 * Statuses where the candidate is waiting on a person, not on a process.
 *
 * <p>Deliberately excludes OFFER and HIRED — those are waiting on the candidate — and the terminal
 * REJECTED/WITHDRAWN. INTERVIEW_SCHEDULED is excluded too: the meeting is booked, so nobody is
 * being held up. INTERVIEW_COMPLETED is included, because a finished interview with no outcome
 * recorded is exactly the state this figure exists to surface.
 */
export const AWAITING_DECISION = new Set([
  'SUBMITTED',
  'APPLIED',
  'SCREENING',
  'PHONE_SCREEN',
  'INTERVIEW_COMPLETED',
  'REFERENCE_CHECK',
  'BACKGROUND_CHECK',
]);

export interface OldestWait {
  name: string;
  role: string;
  stage: string;
  days: number;
}

export interface DecisionsOwed {
  count: number;
  /** Null when nothing is waiting, or when nothing waiting carries a usable date. */
  oldest: OldestWait | null;
}

/** Milliseconds in a day, named because a bare 86400000 in a division reads as noise. */
const DAY_MS = 86_400_000;

function submittedTime(app: ApplicationLike): number | null {
  if (!app.submittedAt) return null;
  const t = new Date(app.submittedAt).getTime();
  return Number.isNaN(t) ? null : t;
}

/**
 * How many candidates are held up by this manager, and which has waited longest.
 *
 * <p>The count and the oldest are computed together on purpose: reporting a count of 14 beside a
 * longest wait drawn from a different set is how two figures on one card come to disagree.
 */
export function decisionsOwed(applications: ApplicationLike[], now: number): DecisionsOwed {
  const waiting = applications.filter((a) => AWAITING_DECISION.has(String(a.status ?? '')));

  let oldest: OldestWait | null = null;
  for (const app of waiting) {
    const t = submittedTime(app);
    if (t === null) continue;
    const days = Math.floor((now - t) / DAY_MS);
    // A future-dated row is bad data, not a negative wait.
    if (days < 0) continue;
    if (!oldest || days > oldest.days) {
      oldest = {
        name: app.applicantName?.trim() || 'Unnamed candidate',
        role: app.jobTitle?.trim() || 'Unspecified role',
        stage: String(app.status ?? '').toLowerCase().replace(/_/g, ' '),
        days,
      };
    }
  }

  // The count is every waiting candidate, including those with no usable date — they are still
  // waiting. Only `oldest` needs a date to exist.
  return { count: waiting.length, oldest };
}

/** Midnight on the Monday of the week containing `now`, in local time. */
export function startOfWeek(now: number): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  // getDay() is 0 for Sunday, which belongs to the week that started six days earlier.
  const daysSinceMonday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - daysSinceMonday);
  return d.getTime();
}

/**
 * Applications received since a point in time.
 *
 * <p>The tile this replaces was labelled "Applications Today" and read an all-time total, so it
 * was wrong twice over — the period was not today, and the feed behind it was empty.
 */
export function receivedSince(applications: ApplicationLike[], since: number): number {
  return applications.filter((a) => {
    const t = submittedTime(a);
    return t !== null && t >= since;
  }).length;
}

export interface QuietRoles {
  /** Published roles that have attracted nothing. */
  titles: string[];
  /**
   * False when no posting carries the count at all, in which case the figure is not reported
   * rather than shown as zero. An absent field and a genuine zero must not look the same.
   */
  measurable: boolean;
}

/** Published roles attracting no applications — a live problem that nothing on the page named. */
export function quietRoles(positions: PostingLike[]): QuietRoles {
  const counted = positions.filter((p) => typeof p.applicationsCount === 'number');
  if (counted.length === 0) return { titles: [], measurable: false };

  return {
    titles: counted
      .filter((p) => p.applicationsCount === 0)
      .map((p) => p.title?.trim() || 'Untitled role'),
    measurable: true,
  };
}
