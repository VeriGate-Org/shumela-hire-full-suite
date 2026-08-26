/**
 * How a notification is presented, and how old it reads.
 *
 * <p><b>What went wrong before.</b> The dropdown derived a four-level severity — success, warning,
 * error, info — from the backend's event type using a switch that named <b>9 of the 37</b> enum
 * members. Everything else fell through to "info", so the panel grouped almost everything into one
 * bucket and a denied approval was presented exactly like a report being ready. Two of the nine it
 * did name were wrong on their own terms: an interview being scheduled was classed as a warning.
 *
 * <p>Nothing failed when the backend added a type, which is why it decayed. So the rule here is
 * that the classification is <b>exhaustive over the enum</b> and a test enforces it: add a
 * NotificationType and the suite names it until it is placed.
 *
 * <p>The vocabulary is deliberately three values, not four. "Attention" means an adverse outcome or
 * something waiting on the reader; "positive" means something completed in their favour; and most
 * things are neither. Tone is carried by a small marker, never by the text colour alone.
 */
export type Tone = 'attention' | 'positive' | 'neutral';

/**
 * Adverse outcomes, and things waiting on the reader.
 *
 * <p>This list is not free to disagree with the backend. {@code NotificationType.requiresAction()}
 * names four types as needing the reader to do something, and every one of them must appear here —
 * a test enforces it. TASK_ASSIGNED was classified neutral on first writing precisely because a
 * judgement made in the frontend drifts from the one made in the entity.
 */
export const ATTENTION: readonly string[] = [
  'ANALYTICS_ALERT',
  'APPLICATION_REJECTED',
  'APPLICATION_WITHDRAWN',
  'APPROVAL_DENIED',
  'APPROVAL_REQUIRED',
  'INTERVIEW_CANCELLED',
  'INTERVIEW_FEEDBACK_REQUESTED',
  'INTERVIEW_REMINDER',
  'JOB_EXPIRED',
  'OFFER_DECLINED',
  'OFFER_EXPIRED',
  'OFFER_NEGOTIATION',
  'OFFER_WITHDRAWN',
  'PIPELINE_STALLED',
  'REMINDER',
  'SYSTEM_ALERT',
  'TASK_ASSIGNED',
  'TASK_DUE',
];

/** Things that concluded in the reader's favour. */
export const POSITIVE: readonly string[] = [
  'APPLICATION_APPROVED',
  'APPROVAL_GRANTED',
  'JOB_PUBLISHED',
  'OFFER_ACCEPTED',
  'OFFER_EXTENDED',
];

/** Routine activity. The majority, and it earns no colour. */
export const NEUTRAL: readonly string[] = [
  'APPLICATION_SUBMITTED',
  'APPLICATION_VIEWED',
  'DOCUMENT_SHARED',
  'INTERVIEW_COMPLETED',
  'INTERVIEW_RESCHEDULED',
  'INTERVIEW_SCHEDULED',
  'JOB_CLOSED',
  'JOB_UPDATED',
  'MESSAGE_RECEIVED',
  'PIPELINE_STAGE_CHANGED',
  'REPORT_READY',
  'SYSTEM_MAINTENANCE',
  'SYSTEM_UPDATE',
];

export function toneFor(type: string | undefined | null): Tone {
  if (!type) return 'neutral';
  if (ATTENTION.includes(type)) return 'attention';
  if (POSITIVE.includes(type)) return 'positive';
  return 'neutral';
}

/**
 * How long ago, in the largest unit that is still true.
 *
 * <p>The previous formatter stopped at days, so a notification from last year read
 * "400 days ago". Anything above a week is reported in weeks, then months.
 */
export function formatRelativeTime(timestamp: Date, now: number = Date.now()): string {
  const seconds = Math.floor((now - timestamp.getTime()) / 1000);
  if (!Number.isFinite(seconds)) return '';
  if (seconds < 60) return 'Just now';

  const plural = (value: number, unit: string) => `${value} ${unit}${value === 1 ? '' : 's'} ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return plural(minutes, 'minute');

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return plural(hours, 'hour');

  const days = Math.floor(hours / 24);
  if (days < 7) return plural(days, 'day');

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return plural(weeks, 'week');

  const months = Math.floor(days / 30);
  if (months < 12) return plural(months, 'month');

  return plural(Math.floor(days / 365), 'year');
}

/**
 * Whether a notification belongs above or below the "Earlier" divider.
 *
 * <p>Unread first, newest first within each part — which is the whole of the ordering now that
 * grouping by an invented severity is gone.
 */
export function partition<T extends { read: boolean; timestamp: Date }>(items: T[]) {
  const byNewest = (a: T, b: T) => b.timestamp.getTime() - a.timestamp.getTime();
  return {
    unread: items.filter((item) => !item.read).sort(byNewest),
    earlier: items.filter((item) => item.read).sort(byNewest),
  };
}
