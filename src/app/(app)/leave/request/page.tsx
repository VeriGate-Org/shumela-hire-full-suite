'use client';

import { useRouter } from 'next/navigation';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import LeaveRequestForm from '@/components/leave/LeaveRequestForm';

export default function LeaveRequestPage() {
  const router = useRouter();
  // TODO: Get from auth context
  const employeeId = 1;

  return (
    <FeatureGate feature="LEAVE_MANAGEMENT">
      <PageWrapper title="Request Leave" subtitle="Submit a new leave request">
        <div className="max-w-2xl">
          <LeaveRequestForm
            employeeId={employeeId}
            onSubmit={() => router.push('/leave/requests')}
            onCancel={() => router.back()}
          />
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
