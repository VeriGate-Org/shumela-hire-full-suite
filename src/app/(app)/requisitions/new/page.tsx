'use client';

import { useRouter } from 'next/navigation';
import PageWrapper from '@/components/PageWrapper';
import RequisitionForm from '@/components/RequisitionForm';

export default function NewRequisitionPage() {
  const router = useRouter();

  return (
    <PageWrapper
      title="New Requisition"
      subtitle="Create a new job requisition for your department"
    >
      <RequisitionForm
        onSuccess={() => {
          router.push('/requisitions');
        }}
      />
    </PageWrapper>
  );
}
