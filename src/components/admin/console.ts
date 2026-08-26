/**
 * The administration console's tiles.
 *
 * <p>Seventeen admin pages and no front door — every other area of this product has one. The
 * useful question in administration is not "what is here" but <em>"is anything wrong"</em>, so the
 * tiles are ordered by whether something is, not alphabetically.
 *
 * <p><b>A tile never claims a figure the home page cannot cheaply get.</b> Each count below comes
 * from a call that page already had to make, or it is omitted. Three figures the design drew are
 * omitted for exactly that reason — see {@link OMITTED}.
 */

/** How urgently a tile wants attention. Decides the order and the tone. */
export type TileState = 'wrong' | 'attention' | 'settled' | 'unknown';

export interface ConsoleTile {
  id: string;
  label: string;
  href: string;
  /** What this area holds, in a phrase. */
  description: string;
  /** What is true right now, or null when the figure could not be read. */
  detail: string | null;
  state: TileState;
}

/**
 * Figures the design drew that this page does not show, and why.
 *
 * <p>Recorded rather than silently dropped: each is a real measure somebody may ask for again, and
 * the reason it is absent is the useful part.
 */
export const OMITTED: Record<string, string> = {
  'role permissions — last changed':
    'AdminController hardcodes createdAt and lastModified to "2024-01-01T00:00:00" for every role, '
    + 'so any date shown here would be fabricated by the API rather than read.',
  'company documents — awaiting acknowledgement':
    'Acknowledgements are exposed per document at /{id}/acknowledgements, so a tenant-wide count '
    + 'costs one request per document.',
  'document retention — policies with no period set':
    'No field on the policy distinguishes "not set" from "set to zero".',
};

const ORDER: Record<TileState, number> = { wrong: 0, attention: 1, unknown: 2, settled: 3 };

/** Ordered by whether something is wrong, then by label so the order is stable. */
export function orderTiles(tiles: ConsoleTile[]): ConsoleTile[] {
  return [...tiles].sort(
    (a, b) => ORDER[a.state] - ORDER[b.state] || a.label.localeCompare(b.label),
  );
}

export interface DsarLike {
  status?: string;
  dueDate?: string | null;
}

/** Requests still open — neither completed nor rejected. */
export function openRequests(requests: DsarLike[]): DsarLike[] {
  return requests.filter((request) => {
    const status = (request.status ?? '').toUpperCase();
    return status !== 'COMPLETED' && status !== 'REJECTED';
  });
}

/**
 * Open requests already past their due date.
 *
 * <p>Derived rather than read: {@code getDsarStats()} returns totals by status and no overdue
 * count. It is worth the derivation — under POPIA a data-subject request has a 30-day statutory
 * deadline, and "7 open" is a workload where "3 past the deadline" is a finding.
 */
export function overdueRequests(requests: DsarLike[], now: number = Date.now()): DsarLike[] {
  return openRequests(requests).filter((request) => {
    if (!request.dueDate) return false;
    const due = new Date(request.dueDate).getTime();
    return !Number.isNaN(due) && due < now;
  });
}

/**
 * The compliance tile's sentence.
 *
 * @param truncated whether more requests exist than were fetched, in which case the count is a
 *                  floor and says so rather than being presented as a total
 */
export function complianceDetail(
  requests: DsarLike[],
  truncated: boolean,
  now: number = Date.now(),
): { detail: string; state: TileState } {
  const open = openRequests(requests).length;
  const overdue = overdueRequests(requests, now).length;

  if (overdue > 0) {
    return {
      detail: `${truncated ? 'at least ' : ''}${overdue} request${overdue === 1 ? '' : 's'} past the 30-day statutory deadline`,
      state: 'wrong',
    };
  }
  if (open > 0) {
    return {
      detail: `${open} open request${open === 1 ? '' : 's'}, none past its deadline`,
      state: 'attention',
    };
  }
  return { detail: 'No open requests', state: 'settled' };
}

/** A plain count, or the reason there is not one. Never renders a failed read as zero. */
export function countDetail(
  count: number | null,
  singular: string,
  plural: string,
): { detail: string | null; state: TileState } {
  if (count === null) return { detail: null, state: 'unknown' };
  if (count === 0) return { detail: `No ${plural}`, state: 'attention' };
  return { detail: `${count} ${count === 1 ? singular : plural}`, state: 'settled' };
}
