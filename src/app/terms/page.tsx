import PageWrapper from '@/components/PageWrapper';

export default function TermsPage() {
  return (
    <PageWrapper title="Terms of Service" subtitle="Platform usage terms for ShumelaHire users and administrators.">
      <section className="enterprise-card p-6 space-y-4">
        <p className="text-sm text-muted-foreground">
          Access to ShumelaHire is limited to authorized users within your organization.
        </p>
        <p className="text-sm text-muted-foreground">
          Users are responsible for maintaining credential security and following role permissions.
        </p>
        <p className="text-sm text-muted-foreground">
          Misuse, unauthorized data access, or policy violations may result in access suspension.
        </p>
      </section>
    </PageWrapper>
  );
}

