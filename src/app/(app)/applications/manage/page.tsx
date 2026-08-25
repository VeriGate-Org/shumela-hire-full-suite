import PageWrapper from '@/components/PageWrapper';
import IdentityBand from '@/components/record/IdentityBand';
import ApplicationManagementConsole from '@/components/ApplicationManagementConsole';

export default function ApplicationManagementPage() {
  return (
    <PageWrapper>
      {/* Page header, not a record component under one — see #285. No figures: the console owns
          the counts and this page holds no summary of its own, and an empty figure row is better
          than one invented here that could disagree with the console below it. */}
      <IdentityBand
        eyebrow="Application console"
        title="Application Management"
        subtitle="Search, filter and act on applications in bulk"
      />
      <ApplicationManagementConsole />
    </PageWrapper>
  );
}
