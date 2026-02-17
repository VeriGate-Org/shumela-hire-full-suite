import PageWrapper from '@/components/PageWrapper';

export default function PrivacyPage() {
  return (
    <PageWrapper title="Privacy Policy" subtitle="How ShumelaHire collects and protects data.">
      <section className="enterprise-card p-6 space-y-4">
        <p className="text-sm text-muted-foreground">
          We collect only the data required to run recruitment workflows, hiring analytics, and role-based access controls.
        </p>
        <p className="text-sm text-muted-foreground">
          Personal information is processed under least-privilege access and retained according to your organization policy.
        </p>
        <p className="text-sm text-muted-foreground">
          Contact your administrator or support team to request data export, correction, or deletion.
        </p>
      </section>
    </PageWrapper>
  );
}

