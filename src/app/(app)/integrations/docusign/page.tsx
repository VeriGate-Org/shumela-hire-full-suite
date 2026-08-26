'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-fetch';
import { useAuth } from '@/contexts/AuthContext';
import PageWrapper from '@/components/PageWrapper';
import { ConnectorScreen, Panel, DeploymentSetting, OperatorNote } from '../ConnectorScreen';

/**
 * DocuSign is configured entirely with `docusign.*` Spring properties — eight `@Value`
 * injections in DocuSignService, no entity, no repository, no save endpoint. So this screen
 * reports and instructs; it does not pretend to edit.
 */

interface Integration {
  id: string;
  configured: boolean;
  status: 'connected' | 'disconnected' | 'error';
}

const PROPERTIES = [
  { label: 'Integration key', property: 'docusign.integration-key' },
  { label: 'Account', property: 'docusign.account-id' },
  { label: 'Sending user', property: 'docusign.user-id' },
  { label: 'RSA private key', property: 'docusign.private-key' },
  { label: 'Authorisation server', property: 'docusign.auth-server' },
  { label: 'API base URL', property: 'docusign.base-url' },
  { label: 'Webhook signing key', property: 'docusign.webhook-hmac-key' },
];

export default function DocuSignPage() {
  const { user } = useAuth();
  const [state, setState] = useState<Integration | null>(null);
  const [loading, setLoading] = useState(true);
  const hasAccess = user?.role === 'ADMIN' || user?.role === 'HR_MANAGER';

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch('/api/integrations/status');
        const all: Integration[] = await res.json();
        setState(all.find((i) => i.id === 'docusign') ?? null);
      } catch {
        setState(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (!hasAccess) {
    return (
      <PageWrapper title="DocuSign" subtitle="You do not have permission to view integrations">
        <div className="enterprise-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Integrations are managed by administrators and HR managers.
          </p>
        </div>
      </PageWrapper>
    );
  }

  // The status endpoint reports whether the keys are present. It cannot tell us the values, and
  // this screen must never display a credential even if it could.
  const configured = state?.status === 'connected';

  return (
    <ConnectorScreen
      eyebrow="Integrations · e-signature"
      title="DocuSign"
      promise="Offer letters are sent for signature from here, and the offer updates itself when the candidate signs."
      state={loading ? 'available' : configured ? 'live' : 'available'}
    >
      <Panel title="Settings" note="docusign.* — deployment properties">
        <div className="mb-4">
          <OperatorNote>
            <b className="font-bold text-foreground">These live in the deployment, not in this app.</b>{' '}
            There is no screen that can change them, because there is nothing behind one to save to —
            they are read at start-up from configuration. To change any of them, give the property name
            below to whoever runs the platform.
          </OperatorNote>
        </div>
        <div>
          {PROPERTIES.map((p) => (
            <DeploymentSetting key={p.property} label={p.label} property={p.property} set={configured} />
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Values are never shown. The status endpoint reports only whether the keys are present, and a
          signing key should not be readable from a web page in any case.
        </p>
      </Panel>

      <Panel title="Signing notifications" note="DocuSign Connect">
        <p className="text-sm text-muted-foreground">
          DocuSign has to be told where to send signing events. Without it an offer stays{' '}
          <b className="font-semibold text-foreground">Sent</b> here even after the candidate has signed,
          and someone has to notice by hand.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-control border border-border bg-muted px-3 py-2">
          <code className="text-xs font-mono text-foreground break-all">
            {typeof window !== 'undefined' ? window.location.origin : ''}/webhooks/docusign
          </code>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Set this as the Connect endpoint in the DocuSign admin console, using the signing key above so
          the application can tell a real notification from a forged one.
        </p>
      </Panel>

      <Panel title="Before you send a real offer">
        <ul className="space-y-2.5 text-sm text-muted-foreground list-disc pl-5">
          <li>
            <b className="font-semibold text-foreground">Check which environment this points at.</b>{' '}
            <code className="text-xs font-mono">docusign.base-url</code> decides whether envelopes are
            real or demo, and nothing else on the screen distinguishes them. An offer sent from the demo
            environment looks signed and is not binding.
          </li>
          <li>
            <b className="font-semibold text-foreground">The sending user must have an active DocuSign
            seat.</b> If that account is disabled, sending fails for everyone, not just that person.
          </li>
        </ul>
      </Panel>
    </ConnectorScreen>
  );
}
