import PageWrapper from '@/components/PageWrapper';

export default function SupportPage() {
  return (
    <PageWrapper title="Support" subtitle="Help options and issue escalation paths.">
      <section className="enterprise-card p-6 space-y-4">
        <p className="text-sm text-muted-foreground">
          For access issues, contact your internal system administrator first.
        </p>
        <p className="text-sm text-muted-foreground">
          For workflow or reporting defects, include screenshots, route path, and timestamp in your ticket.
        </p>
        <p className="text-sm text-muted-foreground">
          For urgent production incidents, follow your organization&apos;s incident process and on-call escalation policy.
        </p>
      </section>
    </PageWrapper>
  );
}

