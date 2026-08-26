'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Custom Reports has moved into Reports.
 *
 * <p>This screen built a report and posted it to {@code /api/reports/custom/csv}; the Reports page
 * has done the same from its "Create Report" tab all along. Three destinations existed over one
 * set of endpoints — this one and Scheduled Reports were both unreachable from the menu, so the
 * duplication was invisible as well as real.
 *
 * <p>Redirecting rather than deleting: the route may be bookmarked or linked from outside the
 * product, and a link that lands somewhere useful beats a 404. {@code replace} rather than
 * {@code push} so the back button does not bounce between the two.
 */
export default function CustomReportsMoved() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/reports?tab=create');
  }, [router]);

  return (
    <div className="p-6">
      <p className="text-sm text-muted-foreground">
        Custom reports are now built on the Reports page. Taking you there…
      </p>
    </div>
  );
}
