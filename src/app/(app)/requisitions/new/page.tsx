'use client';

import { useRouter } from 'next/navigation';
import PageWrapper from '@/components/PageWrapper';
import IdentityBand from '@/components/record/IdentityBand';
import RequisitionForm from '@/components/RequisitionForm';

export default function NewRequisitionPage() {
  const router = useRouter();

  return (
    <PageWrapper>
      <IdentityBand
        eyebrow="Recruitment"
        title="New Requisition"
        subtitle="Create a new job requisition for your department"
      />
      <RequisitionForm
        onSuccess={() => {
          router.push('/requisitions');
        }}
      />
    </PageWrapper>
  );
}
