'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import PageWrapper from '@/components/PageWrapper';
import IdentityBand from '@/components/record/IdentityBand';
import DecisionBar, { PrimaryAction, SecondaryAction } from '@/components/record/DecisionBar';
import DistributionStrip from '@/components/record/DistributionStrip';
import { apiFetch } from '@/lib/api-fetch';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams, useRouter } from 'next/navigation';
import { linkedInSocialService, LinkedInConnectionStatus } from '@/services/linkedInSocialService';
import {
  CONNECTOR_META,
  UNLISTED_CONNECTORS,
  connectorState,
  STATE_LABEL,
  type ConnectorState,
  type ConnectorMeta,
} from './catalogue';

interface Integration {
  id: string;
  name: string;
  category: string;
  configured: boolean;
  status: 'connected' | 'disconnected' | 'error';
}

interface Row {
  id: string;
  name: string;
  category: string;
  state: ConnectorState;
  meta: ConnectorMeta;
}

const FALLBACK: Integration[] = [
  { id: 'docusign', name: 'DocuSign', category: 'E-Signature', configured: true, status: 'connected' },
  { id: 'linkedin', name: 'LinkedIn Jobs', category: 'Job Boards', configured: false, status: 'disconnected' },
  { id: 'indeed', name: 'Indeed', category: 'Job Boards', configured: false, status: 'disconnected' },
  { id: 'pnet', name: 'PNet', category: 'Job Boards', configured: false, status: 'disconnected' },
  { id: 'career-junction', name: 'CareerJunction', category: 'Job Boards', configured: false, status: 'disconnected' },
  { id: 'ms-teams', name: 'Microsoft Teams', category: 'Communication', configured: false, status: 'disconnected' },
  { id: 'outlook', name: 'Outlook Calendar', category: 'Communication', configured: false, status: 'disconnected' },
  { id: 'aws-ses', name: 'AWS SES', category: 'Email', configured: false, status: 'disconnected' },
  { id: 'sage', name: 'Sage 300 People', category: 'Payroll', configured: true, status: 'connected' },
];

const STATE_PILL: Record<ConnectorState, string> = {
  live: 'border-accent-teal/45 bg-accent-teal/10 text-accent-teal',
  failing: 'border-error/40 bg-error/10 text-error',
  available: 'border-border bg-muted text-muted-foreground',
  unlisted: 'border-cta/45 bg-cta/12 text-accent-gold-on-tint',
};

const GROUPS: { state: ConnectorState; heading: (n: number) => string }[] = [
  { state: 'failing', heading: (n) => `Failing · ${n} — these need you` },
  { state: 'live', heading: (n) => `Live · ${n}` },
  { state: 'available', heading: (n) => `Available · ${n} — nothing is wrong with these` },
  {
    state: 'unlisted',
    heading: (n) => `Not in the hub · ${n} — these have working screens and were never listed here`,
  },
];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkedInStatus, setLinkedInStatus] = useState<LinkedInConnectionStatus | null>(null);
  const [linkedInBusy, setLinkedInBusy] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasAccess = user?.role === 'ADMIN' || user?.role === 'HR_MANAGER';

  const loadLinkedInStatus = useCallback(async () => {
    try {
      setLinkedInStatus(await linkedInSocialService.getStatus());
    } catch {
      // LinkedIn social posting is optional — absence is not an error worth showing.
    }
  }, []);

  const loadIntegrations = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      const response = await apiFetch('/api/integrations/status');
      setIntegrations(await response.json());
    } catch {
      // The shape of the catalogue is known even when the service is not reachable, so the page
      // still lists what exists rather than showing nothing.
      setIntegrations(FALLBACK);
      setError('Showing the known connectors — their current state could not be read.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIntegrations();
    loadLinkedInStatus();
  }, [loadIntegrations, loadLinkedInStatus]);

  useEffect(() => {
    const param = searchParams.get('linkedin');
    if (param === 'success') {
      toast('LinkedIn company page connected', 'success');
      loadLinkedInStatus();
    } else if (param === 'error') {
      toast('LinkedIn could not be connected. Try signing in again.', 'error');
    }
  }, [searchParams, toast, loadLinkedInStatus]);

  const rows: Row[] = useMemo(() => {
    const fromApi = integrations.map((i) => ({
      id: i.id,
      name: i.name,
      category: i.category,
      state: connectorState(i.status),
      meta: CONNECTOR_META[i.id] ?? { does: '', destinations: [] },
    }));
    const unlisted = UNLISTED_CONNECTORS.map((u) => ({
      id: u.id,
      name: u.name,
      category: u.category,
      state: 'unlisted' as const,
      meta: u.meta,
    }));
    return [...fromApi, ...unlisted];
  }, [integrations]);

  const count = (s: ConnectorState) => rows.filter((r) => r.state === s).length;
  const live = count('live');
  const failing = count('failing');
  const available = count('available');
  const unlisted = count('unlisted');

  // The most useful thing this page can say is where a working connector's settings actually
  // are, because until now it said nothing and the screens were unreachable.
  const withHiddenScreens = rows.filter(
    (r) => (r.state === 'live' || r.state === 'unlisted') && r.meta.destinations.length > 0,
  );

  const actions = (
    <button
      onClick={loadIntegrations}
      /* On the identity band, not on the page. The band is a fixed navy in both themes, so
         --cta-on-surface is the plate's own colour in light mode — an invisible button. The band
         carries --band-accent for exactly this. */
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-button border-2 border-band-accent text-band-accent bg-transparent hover:bg-band-accent hover:text-cta-foreground font-semibold text-sm uppercase tracking-[0.05em] transition-colors"
    >
      <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
      Recheck
    </button>
  );

  if (!hasAccess) {
    return (
      <PageWrapper>
      <IdentityBand
        eyebrow="Integrations"
        title="Integrations"
        subtitle="You do not have permission to manage integrations"
      />

        <div className="enterprise-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Integrations are managed by administrators and HR managers.
          </p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <IdentityBand
        actions={actions}
        eyebrow="Integrations"
        title={unlisted > 0 ? `${rows.length - unlisted} in the hub. ${rows.length} in the app.` : 'Integrations'}
        subtitle={
          loading
            ? 'Reading current state…'
            : 'Status is read from configuration, not from live traffic'
        }
        figures={[
          { label: 'Live', value: live, tone: 'positive' },
          { label: 'Available', value: available },
          { label: 'Failing', value: failing, tone: (failing > 0 ? 'critical' : undefined) as 'critical' | undefined },
        ]}
      />

      {error && (
        /* The catalogue still renders from the known list, so this is a caveat on the page and
           not a replacement for it. A full-height error block here would hide nine usable rows. */
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-cta/40 bg-cta/10 px-4 py-3">
          <p className="text-sm text-foreground">
            <b className="font-bold">Current state could not be read.</b>{' '}
            <span className="text-muted-foreground">Everything below is the known connector list, not live status.</span>
          </p>
          <button
            onClick={loadIntegrations}
            className="text-xs font-bold uppercase tracking-[0.06em] text-cta-on-surface hover:underline underline-offset-2"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && withHiddenScreens.length > 0 && (
        <DecisionBar
          ask={
            failing > 0
              ? `${failing} ${failing === 1 ? 'connector is' : 'connectors are'} configured but unreachable.`
              : `${withHiddenScreens[0].name} is set up, and the screens that run it are not reachable from here.`
          }
          why={
            failing > 0
              ? 'A configured connector that cannot be reached fails silently — nothing on this page ran, and nobody was told.'
              : `Its settings live under a URL this page has never linked to. ${withHiddenScreens.length} of the ${rows.length} connectors have screens that were only reachable by knowing the address.`
          }
          tone={failing > 0 ? 'stopped' : 'owed'}
        >
          <PrimaryAction onClick={() => router.push(withHiddenScreens[0].meta.destinations[0].href)}>
            Open {withHiddenScreens[0].name}
          </PrimaryAction>
          <SecondaryAction onClick={loadIntegrations}>Recheck all</SecondaryAction>
        </DecisionBar>
      )}

      <DistributionStrip
        buckets={[
          { label: 'Live', count: live, detail: 'Configured and reachable', tone: 'positive' },
          { label: 'Available', count: available, detail: 'Not set up — not a fault' },
          {
            label: 'Failing',
            count: failing,
            detail: 'Configured but unreachable',
            tone: (failing > 0 ? 'critical' : undefined) as 'critical' | undefined,
          },
          {
            label: 'Not in the hub',
            count: unlisted,
            detail: "Have screens, aren't listed",
            tone: (unlisted > 0 ? 'warning' : undefined) as 'warning' | undefined,
          },
        ]}
        footnote={
          <>
            <b className="font-bold text-foreground">Available is the normal state of an unused connector.</b>{' '}
            A tenant that has not switched on job boards is not broken.
          </>
        }
      />

      <section className="enterprise-card overflow-hidden">
        <div className="flex items-baseline justify-between gap-3 px-5 py-4 border-b border-border">
          <h2 className="text-sm font-bold text-foreground">Connections</h2>
          <span className="text-xs text-muted-foreground">Sorted by what each one needs from you</span>
        </div>

        {loading ? (
          <div className="p-5 space-y-3" aria-busy="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-11 rounded-control bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="bg-muted">
                  {['Connection', 'What it does', 'State', 'Where it goes'].map((h, i) => (
                    <th
                      key={h}
                      className={`px-4 py-2.5 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-muted-foreground ${
                        i === 3 ? 'text-right' : 'text-left'
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {GROUPS.map(({ state, heading }) => {
                  const group = rows.filter((r) => r.state === state);
                  if (group.length === 0) return null;
                  return (
                    <React.Fragment key={state}>
                      <tr>
                        <td
                          colSpan={4}
                          className={`px-4 py-2 bg-muted border-y border-border text-[0.625rem] font-bold uppercase tracking-[0.12em] ${
                            state === 'unlisted' ? 'text-accent-gold-on-tint' : 'text-muted-foreground'
                          }`}
                        >
                          {heading(group.length)}
                        </td>
                      </tr>
                      {group.map((row) => (
                        <tr key={row.id} className="border-b border-border last:border-0 hover:bg-accent transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap align-top">
                            <div className="font-bold text-foreground">{row.name}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{row.category}</div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground align-top">{row.meta.does}</td>
                          <td className="px-4 py-3 align-top">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full border text-[0.625rem] font-bold uppercase tracking-[0.06em] whitespace-nowrap ${STATE_PILL[row.state]}`}
                            >
                              {STATE_LABEL[row.state]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right align-top whitespace-nowrap">
                            {row.id === 'linkedin' && linkedInStatus ? (
                              <LinkedInAction
                                status={linkedInStatus}
                                busy={linkedInBusy}
                                canConnect={user?.role === 'ADMIN'}
                                onChange={async () => {
                                  setLinkedInBusy(true);
                                  try {
                                    if (linkedInStatus.connected) {
                                      await linkedInSocialService.disconnect();
                                      toast('LinkedIn disconnected', 'success');
                                      await loadLinkedInStatus();
                                    } else {
                                      window.location.href = await linkedInSocialService.getAuthUrl();
                                    }
                                  } catch {
                                    toast('LinkedIn could not be updated. Try again.', 'error');
                                  } finally {
                                    setLinkedInBusy(false);
                                  }
                                }}
                              />
                            ) : row.meta.destinations.length > 0 ? (
                              <span className="inline-flex items-center gap-1.5">
                                {row.meta.destinations.map((d, i) => (
                                  <React.Fragment key={d.href}>
                                    {i > 0 && (
                                      <span aria-hidden="true" className="text-muted-foreground">
                                        ·
                                      </span>
                                    )}
                                    <Link
                                      href={d.href}
                                      className="text-xs font-bold text-primary hover:underline underline-offset-2"
                                    >
                                      {d.label}
                                    </Link>
                                  </React.Fragment>
                                ))}
                              </span>
                            ) : (
                              // No screen exists. Saying so beats a button that does nothing.
                              <span className="text-xs text-muted-foreground">{row.meta.blocked ?? '—'}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </PageWrapper>
  );
}

function LinkedInAction({
  status,
  busy,
  canConnect,
  onChange,
}: {
  status: LinkedInConnectionStatus;
  busy: boolean;
  canConnect: boolean;
  onChange: () => void;
}) {
  // Connecting grants posting rights on the company page, so it is an administrator's call.
  // A non-admin sees the state rather than a control they cannot use.
  if (!canConnect) {
    return (
      <span className="text-xs text-muted-foreground">
        {status.connected ? `Connected — ${status.organizationName}` : 'Not connected'}
      </span>
    );
  }
  return (
    <button
      onClick={onChange}
      disabled={busy}
      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 text-xs font-semibold uppercase tracking-[0.06em] transition-colors disabled:opacity-40 ${
        status.connected
          ? 'border-error/50 text-error hover:bg-error/10'
          : 'border-cta text-cta-on-surface hover:bg-cta hover:text-cta-foreground'
      }`}
    >
      <ArrowPathIcon className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
      {busy ? 'Working…' : status.connected ? 'Disconnect' : 'Connect'}
    </button>
  );
}
