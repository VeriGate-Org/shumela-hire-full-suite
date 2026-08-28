'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-fetch';
import { useAuth } from '@/contexts/AuthContext';
import PageWrapper from '@/components/PageWrapper';
import IdentityBand from '@/components/record/IdentityBand';
import { ConnectorScreen, Panel, DeploymentSetting, OperatorNote } from '../ConnectorScreen';

/**
 * Email delivery. Configured with `ses.*` deployment properties, so this screen reports rather
 * than edits — see the note in ConnectorScreen.
 *
 * This is the connector with the widest blast radius: if it stops, every candidate simply hears
 * nothing, and nothing else on the screen would say so. That is why it gets a page at all.
 */

interface Integration {
  id: string;
  configured: boolean;
  status: 'connected' | 'disconnected' | 'error';
}

const PROPERTIES = [
  { label: 'Enabled', property: 'ses.enabled' },
  { label: 'Region', property: 'ses.region' },
  { label: 'Sends as', property: 'ses.from-address' },
  { label: 'Replies go to', property: 'ses.reply-to' },
];

export default function EmailDeliveryPage() {
  const { user } = useAuth();
  const [state, setState] = useState<Integration | null>(null);
  const [loading, setLoading] = useState(true);
  const hasAccess = user?.role === 'ADMIN' || user?.role === 'HR_MANAGER';

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch('/api/integrations/status');
        const all: Integration[] = await res.json();
        setState(all.find((i) => i.id === 'aws-ses') ?? null);
      } catch {
        setState(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (!hasAccess) {
    return (
      <PageWrapper>
        <IdentityBand
          eyebrow="Integrations"
          title="Email delivery"
          subtitle="You do not have permission to view integrations"
        />
        <div className="enterprise-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Integrations are managed by administrators and HR managers.
          </p>
        </div>
      </PageWrapper>
    );
  }

  const configured = state?.status === 'connected';

  return (
    <ConnectorScreen
      eyebrow="Integrations · email"
      title="Email delivery"
      promise="Every message the system sends — interview invitations, offers, regrets — leaves through Amazon SES."
      state={loading ? 'available' : configured ? 'live' : 'available'}
    >
      <Panel title="Settings" note="ses.* — deployment properties">
        <div className="mb-4">
          <OperatorNote>
            <b className="font-bold text-foreground">Read-only by design.</b> These are deployment
            settings, so changing one means a release. This screen shows them and offers no controls: an
            input you cannot save is worse than a value you can read.
          </OperatorNote>
        </div>
        <div>
          {PROPERTIES.map((p) => (
            <DeploymentSetting key={p.property} label={p.label} property={p.property} set={configured} />
          ))}
        </div>
      </Panel>

      <Panel title="Why this one matters more than the others">
        <ul className="space-y-2.5 text-sm text-muted-foreground list-disc pl-5">
          <li>
            <b className="font-semibold text-foreground">Its failure is silent.</b> A job board that
            stops working leaves an obvious gap. Email that stops working looks exactly like candidates
            choosing not to reply.
          </li>
          <li>
            <b className="font-semibold text-foreground">Bounce and complaint rates are a suspension
            risk.</b> Amazon suspends an account that runs a high bounce rate, and a suspended account
            means nobody hears from you at all. Sending to stale addresses from an old import is the
            usual cause.
          </li>
          <li>
            <b className="font-semibold text-foreground">The sending domain must stay verified.</b> If
            the DNS records for <code className="text-xs font-mono">ses.from-address</code> change, delivery
            stops without anything in this application changing.
          </li>
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">
          Send volumes, bounce rates and the suspension threshold live in the AWS console — this
          application does not read them, so it does not display them. A number here that was not
          measured here would be worth less than no number at all.
        </p>
      </Panel>
    </ConnectorScreen>
  );
}
