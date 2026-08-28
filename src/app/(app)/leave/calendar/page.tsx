'use client';

import PageWrapper from '@/components/PageWrapper';
import IdentityBand from '@/components/record/IdentityBand';
import { FeatureGate } from '@/components/FeatureGate';
import LeaveCalendar from '@/components/leave/LeaveCalendar';

export default function LeaveCalendarPage() {
  return (
    <FeatureGate feature="LEAVE_MANAGEMENT">
      <PageWrapper>
        <IdentityBand
          eyebrow="HR"
          title="Leave Calendar"
          subtitle="View team leave schedule at a glance"
        />
        <LeaveCalendar />
      </PageWrapper>
    </FeatureGate>
  );
}
