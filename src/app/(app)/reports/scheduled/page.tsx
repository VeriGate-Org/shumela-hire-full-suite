'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Scheduled Reports has moved into Reports.
 *
 * <p>It read and wrote {@code /api/reports/scheduled}, which is exactly what the Reports page's
 * "Scheduler" tab does. Keeping both meant two surfaces over one set of schedules, either of which
 * could be edited without the other knowing.
 *
 * <p>Redirecting rather than deleting, for the same reason as the custom-report route: a scheduled
 * report is the sort of thing somebody bookmarks.
 */
export default function ScheduledReportsMoved() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/reports?tab=scheduler');
  }, [router]);

  return (
    <div className="p-6">
      <p className="text-sm text-muted-foreground">
        Scheduled reports are now managed on the Reports page. Taking you there…
      </p>
    </div>
  );
}
