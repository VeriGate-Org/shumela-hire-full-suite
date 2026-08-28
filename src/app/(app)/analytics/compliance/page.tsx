'use client';

import { useCallback, useEffect, useState } from 'react';
import PageWrapper from '@/components/PageWrapper';
import IdentityBand from '@/components/record/IdentityBand';
import { FeatureGate } from '@/components/FeatureGate';
import EmptyState from '@/components/EmptyState';
import { hrAnalyticsService } from '@/services/hrAnalyticsService';
import { useToast } from '@/components/Toast';
import { formatEnumValue } from '@/utils/enumLabels';
import { CheckCircleIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

/**
 * Compliance analytics, showing only what is measured.
 *
 * <p>This page used to open with a 91.5% compliance score, a POPIA rate, six months of trend data
 * and seven per-department scores. None of it existed: the endpoint returned a hand-written mock,
 * down to five named employees. The service now counts from repositories, and the figures that
 * cannot be counted are gone rather than approximated —
 * {@code ComplianceAnalyticsService} records why for each one.
 *
 * <p>The page leads on overdue data-subject requests, which was not on it before. POPIA sets a
 * statutory deadline per request, so it is the one number here somebody is accountable for.
 */
interface ComplianceSummary {
  expiringCertifications: number;
  expiredCertifications: number;
  openDataSubjectRequests: number;
  overdueDataSubjectRequests: number;
  dataSubjectRequestsWithoutDueDate: number;
  consentsGranted: number;
  consentsWithdrawn: number;
  expiryHorizonDays: number;
}

interface ExpiringCert {
  certification: string;
  issuingBody: string | null;
  expiryDate: string | null;
  daysUntilExpiry: number | null;
  employeeName: string | null;
}

interface OverdueRequest {
  requesterName: string;
  requestType: string | null;
  status: string | null;
  dueDate: string;
  daysOverdue: number;
}

interface Acknowledgement {
  documentTitle: string;
  acknowledged: number;
}

export default function ComplianceAnalyticsPage() {
  const [metrics, setMetrics] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    try {
      setMetrics(await hrAnalyticsService.getComplianceAnalytics());
    } catch {
      toast('Could not load compliance analytics', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const summary = (metrics.summary || {}) as Partial<ComplianceSummary>;
  const expiringCerts = (metrics.expiringCertifications || []) as ExpiringCert[];
  const certsTruncated = Boolean(metrics.expiringCertificationsTruncated);
  const overdueRequests = (metrics.overdueDataSubjectRequests || []) as OverdueRequest[];
  const acknowledgements = (metrics.acknowledgements || []) as Acknowledgement[];

  const horizon = summary.expiryHorizonDays ?? 90;

  return (
    <FeatureGate feature="ADVANCED_ANALYTICS">
      <PageWrapper>
        <IdentityBand
          eyebrow="Analytics"
          title="Compliance analytics"
          subtitle="Certification expiry, data-subject requests and policy acknowledgement"
        />
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* The statutory one first. A request past its POPIA deadline is the only figure on this
                page with a legal consequence attached, and it was not previously shown at all. */}
            {(summary.overdueDataSubjectRequests ?? 0) > 0 && (
              <div className="rounded-card border border-error/40 bg-error-bg px-5 py-3">
                <p className="text-sm font-extrabold text-error-on-tint">
                  {summary.overdueDataSubjectRequests} data-subject{' '}
                  {summary.overdueDataSubjectRequests === 1 ? 'request is' : 'requests are'} past the
                  statutory deadline
                </p>
                <p className="mt-0.5 text-xs text-error-on-tint/80">
                  POPIA sets the clock from the date each request was logged.
                </p>
              </div>
            )}

            <dl className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
              <Tile label="Overdue requests" value={summary.overdueDataSubjectRequests} tone="error" />
              <Tile label="Open requests" value={summary.openDataSubjectRequests} />
              <Tile label={`Certs expiring in ${horizon}d`} value={summary.expiringCertifications} tone="warn" />
              <Tile label="Expired certs" value={summary.expiredCertifications} tone="error" />
              <Tile label="Consents granted" value={summary.consentsGranted} />
              <Tile label="Consents withdrawn" value={summary.consentsWithdrawn} />
            </dl>

            {/* A request with no due date cannot be called overdue, so it is reported separately
                rather than folded into a number it would quietly distort. */}
            {(summary.dataSubjectRequestsWithoutDueDate ?? 0) > 0 && (
              <p className="text-xs text-muted-foreground">
                {summary.dataSubjectRequestsWithoutDueDate} open{' '}
                {summary.dataSubjectRequestsWithoutDueDate === 1 ? 'request has' : 'requests have'} no
                recorded due date and cannot be assessed against the deadline.
              </p>
            )}

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Panel title="Past the statutory deadline">
                {overdueRequests.length === 0 ? (
                  <EmptyState icon={CheckCircleIcon} title="Nothing overdue" description="Every open request is within its deadline." />
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-[0.625rem] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">
                        <th className="py-2">Requester</th>
                        <th className="py-2">Type</th>
                        <th className="py-2 text-right">Overdue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overdueRequests.map((r, i) => (
                        <tr key={`${r.requesterName}-${i}`} className="border-b border-border/50">
                          <td className="py-2">
                            <div className="text-foreground">{r.requesterName}</div>
                            <div className="text-xs text-muted-foreground">
                              {r.status ? formatEnumValue(r.status) : 'Status not recorded'}
                            </div>
                          </td>
                          <td className="py-2 text-muted-foreground">
                            {r.requestType ? formatEnumValue(r.requestType) : '—'}
                          </td>
                          <td className="py-2 text-right">
                            <span className="inline-flex items-center rounded-full bg-error-bg px-2 py-0.5 text-xs font-bold text-error-on-tint tabular-nums">
                              {r.daysOverdue}d
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Panel>

              <Panel
                title={`Certifications expiring within ${horizon} days`}
                note={certsTruncated ? `Showing the ${expiringCerts.length} closest to expiry.` : null}
              >
                {expiringCerts.length === 0 ? (
                  <EmptyState icon={CheckCircleIcon} title="Nothing expiring" description={`No certification expires in the next ${horizon} days.`} />
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-[0.625rem] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">
                        <th className="py-2">Certification</th>
                        <th className="py-2">Holder</th>
                        <th className="py-2 text-right">Days left</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expiringCerts.map((cert, i) => (
                        <tr key={`${cert.certification}-${i}`} className="border-b border-border/50">
                          <td className="py-2">
                            <div className="text-foreground">{cert.certification}</div>
                            {cert.issuingBody && (
                              <div className="text-xs text-muted-foreground">{cert.issuingBody}</div>
                            )}
                          </td>
                          {/* The employee association is not always hydrated, and a blank cell would
                              read as "nobody" rather than "not loaded". */}
                          <td className="py-2 text-muted-foreground">
                            {cert.employeeName ?? <span className="italic">Not recorded</span>}
                          </td>
                          <td className="py-2 text-right tabular-nums">
                            {cert.daysUntilExpiry === null ? (
                              <span className="text-xs text-muted-foreground">No expiry date</span>
                            ) : (
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                                  cert.daysUntilExpiry <= 30
                                    ? 'bg-error-bg text-error-on-tint'
                                    : cert.daysUntilExpiry <= 60
                                      ? 'bg-surface-gold text-accent-gold'
                                      : 'bg-surface-teal text-accent-teal'
                                }`}
                              >
                                {cert.daysUntilExpiry}d
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Panel>
            </div>

            <Panel
              title="Policy acknowledgement"
              note="How many people have acknowledged each published policy that requires it."
            >
              {acknowledgements.length === 0 ? (
                <EmptyState
                  icon={DocumentTextIcon}
                  title="No policies require acknowledgement"
                  description="Publish a company document with acknowledgement enabled to track it here."
                />
              ) : (
                <ul className="divide-y divide-border">
                  {acknowledgements.map((ack) => (
                    <li key={ack.documentTitle} className="flex items-center justify-between gap-3 py-2.5">
                      <span className="text-sm text-foreground">{ack.documentTitle}</span>
                      <span className="text-sm font-bold tabular-nums text-foreground">
                        {ack.acknowledged}
                        <span className="ml-1 text-xs font-medium text-muted-foreground">
                          acknowledged
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        )}
      </PageWrapper>
    </FeatureGate>
  );
}

function Tile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | undefined;
  tone?: 'error' | 'warn';
}) {
  const emphasis =
    value && value > 0 && tone === 'error'
      ? 'text-error'
      : value && value > 0 && tone === 'warn'
        ? 'text-accent-gold'
        : 'text-foreground';
  return (
    <div className="enterprise-card px-4 py-3">
      <dt className="text-[0.5625rem] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </dt>
      {/* An absent figure says so. Rendering `undefined` as 0 turns "not measured" into "none",
          which is the difference between a healthy tenant and an unread repository. */}
      <dd className={`mt-1 text-xl font-extrabold tabular-nums ${emphasis}`}>
        {value ?? <span className="text-sm font-medium text-muted-foreground">Not available</span>}
      </dd>
    </div>
  );
}

function Panel({
  title,
  note,
  children,
}: {
  title: string;
  note?: string | null;
  children: React.ReactNode;
}) {
  return (
    <section className="enterprise-card p-5">
      <h3 className="text-sm font-extrabold tracking-tight text-foreground">{title}</h3>
      {note && <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>}
      <div className="mt-3 overflow-x-auto">{children}</div>
    </section>
  );
}
