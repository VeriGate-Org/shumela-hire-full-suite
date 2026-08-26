'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-fetch';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import PageWrapper from '@/components/PageWrapper';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { linkedInSocialService, LinkedInConnectionStatus } from '@/services/linkedInSocialService';
import { ConnectorScreen, Panel, DeploymentSetting, OperatorNote } from '../ConnectorScreen';

/**
 * The four job boards share a screen because they differ only in how you get in.
 *
 * LinkedIn is the exception worth separating: it is a sign-in, not a key, and it is the one thing
 * on this page an administrator can genuinely change from here. The other three are
 * `job-boards.*` deployment properties.
 */

interface Integration {
  id: string;
  name: string;
  configured: boolean;
  status: 'connected' | 'disconnected' | 'error';
}

const CREDENTIAL_BOARDS = [
  {
    id: 'indeed',
    name: 'Indeed',
    property: 'job-boards.indeed.enabled',
    needs: 'A publisher key from your Indeed account manager.',
  },
  {
    id: 'pnet',
    name: 'PNet',
    property: 'job-boards.pnet.enabled',
    needs: 'An account and password. PNet collects vacancies from an XML feed rather than being pushed to, so a new vacancy appears within the hour, not instantly.',
  },
  {
    id: 'career-junction',
    name: 'CareerJunction',
    property: 'job-boards.career-junction.enabled',
    needs: 'An account and password from CareerJunction.',
  },
];

export default function JobBoardsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [statuses, setStatuses] = useState<Integration[]>([]);
  const [linkedIn, setLinkedIn] = useState<LinkedInConnectionStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const hasAccess = user?.role === 'ADMIN' || user?.role === 'HR_MANAGER';
  const isAdmin = user?.role === 'ADMIN';

  const loadLinkedIn = useCallback(async () => {
    try {
      setLinkedIn(await linkedInSocialService.getStatus());
    } catch {
      setLinkedIn(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch('/api/integrations/status');
        setStatuses(await res.json());
      } catch {
        setStatuses([]);
      }
    })();
    loadLinkedIn();
  }, [loadLinkedIn]);

  const statusOf = (id: string) => statuses.find((s) => s.id === id)?.status ?? 'disconnected';
  const liveCount = ['linkedin', ...CREDENTIAL_BOARDS.map((b) => b.id)].filter(
    (id) => statusOf(id) === 'connected',
  ).length;

  if (!hasAccess) {
    return (
      <PageWrapper title="Job boards" subtitle="You do not have permission to view integrations">
        <div className="enterprise-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Integrations are managed by administrators and HR managers.
          </p>
        </div>
      </PageWrapper>
    );
  }

  const connect = async () => {
    setBusy(true);
    try {
      if (linkedIn?.connected) {
        await linkedInSocialService.disconnect();
        toast('LinkedIn disconnected', 'success');
        await loadLinkedIn();
      } else {
        window.location.href = await linkedInSocialService.getAuthUrl();
      }
    } catch {
      toast('LinkedIn could not be updated. Try again.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ConnectorScreen
      eyebrow="Integrations · job boards"
      title="Job boards"
      promise="A vacancy published here is posted to whichever boards are switched on, and applications come back into the same pipeline."
      state={liveCount > 0 ? 'live' : 'available'}
      figures={[
        { label: 'Posting', value: liveCount, tone: liveCount > 0 ? 'positive' : undefined },
        { label: 'Available', value: 4 - liveCount },
      ]}
    >
      <Panel title="LinkedIn" note="A sign-in, not a key">
        <p className="text-sm text-muted-foreground">
          LinkedIn does not issue keys for this. An administrator signs in once and grants the
          application permission to post to a company page.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {linkedIn?.connected ? (
            <span className="text-sm text-foreground">
              Connected to <b className="font-semibold">{linkedIn.organizationName}</b>
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">Not connected</span>
          )}
          {isAdmin ? (
            <button
              onClick={connect}
              disabled={busy}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-button border-2 text-xs font-bold uppercase tracking-[0.06em] transition-colors disabled:opacity-40 ${
                linkedIn?.connected
                  ? 'border-error/50 text-error hover:bg-error/10'
                  : 'border-cta text-cta-on-surface hover:bg-cta hover:text-cta-foreground'
              }`}
            >
              <ArrowPathIcon className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
              {busy ? 'Working…' : linkedIn?.connected ? 'Disconnect' : 'Sign in with LinkedIn'}
            </button>
          ) : (
            <span className="text-xs text-muted-foreground">
              Only an administrator can change this — it grants posting rights on the company page.
            </span>
          )}
        </div>
      </Panel>

      <Panel title="The other three" note="job-boards.* — deployment properties">
        <div className="mb-4">
          <OperatorNote>
            <b className="font-bold text-foreground">Switched on in the deployment, not here.</b>{' '}
            Each board is enabled by a property and its credentials are supplied the same way. Give the
            property name to whoever runs the platform, along with the credentials from the board.
          </OperatorNote>
        </div>
        <div>
          {CREDENTIAL_BOARDS.map((b) => (
            <DeploymentSetting
              key={b.id}
              label={b.name}
              property={b.property}
              set={statusOf(b.id) === 'connected'}
              value="Posting"
            />
          ))}
        </div>
        <dl className="mt-5 space-y-3">
          {CREDENTIAL_BOARDS.map((b) => (
            <div key={b.id}>
              <dt className="text-xs font-bold uppercase tracking-[0.06em] text-muted-foreground">
                {b.name} needs
              </dt>
              <dd className="text-sm text-muted-foreground mt-0.5">{b.needs}</dd>
            </div>
          ))}
        </dl>
      </Panel>
    </ConnectorScreen>
  );
}
