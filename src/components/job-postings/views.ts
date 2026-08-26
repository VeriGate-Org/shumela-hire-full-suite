/**
 * What a job advert's view count actually means, which depends on when it was published.
 *
 * <p><b>The counter changed meaning mid-life.</b> Until v2.3.0 every page load incremented it —
 * including staff previews, and including the same candidate refreshing — so the figure was an
 * unknown multiple of the number of people who looked. From v2.3.0 it counts one view per viewer
 * per day, from the public careers site only.
 *
 * <p><b>It cannot be corrected retrospectively.</b> {@code viewsCount} is a running total and no
 * per-view record was ever kept, so there is nothing to go back through and subtract. Resetting the
 * counters would make the figure honest by discarding every genuine view along with the inflated
 * ones, and a posting live for three months would read zero — the wrong trade.
 *
 * <p>So the count is shown as it is, and said to be what it is. A posting published after the
 * changeover carries a clean figure and no caveat; one published before it says its total includes
 * repeats and staff previews from before that date. The caveat disappears on its own once every
 * posting predating the change is closed, rather than becoming permanent furniture.
 */

/**
 * The day deduplicated counting began — the v2.3.0 deploy.
 *
 * <p>Stated once here rather than written into copy in two screens, so there is one thing to change
 * if it turns out to be wrong.
 */
export const DEDUPLICATED_FROM = '2026-08-26';

const CHANGEOVER = new Date(`${DEDUPLICATED_FROM}T00:00:00Z`).getTime();

/**
 * Whether this posting's total predates deduplication and therefore overstates interest.
 *
 * <p>An unknown publication date is treated as affected. A posting whose date cannot be read is
 * more likely to be an old one than a new one, and the honest direction here is to caveat a clean
 * figure rather than present a dirty one as clean.
 */
export function includesInflatedViews(publishedAt?: string): boolean {
  if (!publishedAt) return true;
  const published = new Date(publishedAt).getTime();
  if (Number.isNaN(published)) return true;
  return published < CHANGEOVER;
}

/** How the changeover date reads in a sentence. */
export function changeoverLabel(): string {
  return new Date(CHANGEOVER).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * The line printed under a view count.
 *
 * @param publishedAt when the posting went live
 * @param viewsCount  the figure being shown, so a posting with nothing counted says nothing
 */
export function viewsCaveat(publishedAt?: string, viewsCount?: number | null): string | null {
  if (viewsCount === null || viewsCount === undefined || viewsCount === 0) return null;

  if (includesInflatedViews(publishedAt)) {
    return `Counted from before ${changeoverLabel()}, so this total includes repeat visits and staff previews.`;
  }
  return 'One view per person per day, from the careers site only.';
}
