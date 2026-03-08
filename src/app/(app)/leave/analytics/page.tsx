'use client';

import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import LeaveAnalyticsCharts from '@/components/leave/LeaveAnalyticsCharts';

export default function LeaveAnalyticsPage() {
  return (
    <FeatureGate feature="LEAVE_MANAGEMENT">
      <PageWrapper title="Leave Analytics" subtitle="Insights and trends on leave usage">
        <LeaveAnalyticsCharts />
      </PageWrapper>
    </FeatureGate>
  );
}
