import { redirect } from 'next/navigation';

/**
 * Retired. Bulk work now happens on the applications queue itself.
 *
 * <p>This console existed largely because the queue had no selection model, so acting on many
 * records meant leaving the list — and your filters — behind. The queue now carries selection, a
 * bulk action bar and export, so there is nothing here that is not there.
 *
 * <p>Kept as a redirect rather than deleted: the route was in the navigation for months and is
 * linked from the hiring manager dashboard, so bookmarks and stale links exist. A 404 would read
 * as a broken product; this lands people where the work moved to.
 */
export default function ApplicationManagementPage() {
  redirect('/applications');
}
