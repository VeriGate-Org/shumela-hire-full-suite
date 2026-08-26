'use client';

import React from 'react';
import Link from 'next/link';
import PageWrapper from '@/components/PageWrapper';
import IdentityBand from '@/components/record/IdentityBand';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

/**
 * The shell every connector screen shares.
 *
 * Three of these connectors — DocuSign, AWS SES and the job-board flags — are configured with
 * Spring `@Value` properties. There is no entity, no repository and no endpoint that saves them,
 * so an editable form would be a form that cannot save. That is the same dead-control problem the
 * hub had, and these screens deliberately do not repeat it: they report what is set, say what is
 * missing, and name the exact property an operator has to change.
 *
 * Sage, SSO and the LMS DO have persisted configuration and keep their own editable screens.
 */

export type ScreenState = 'live' | 'failing' | 'available';

const STATE_PILL: Record<ScreenState, string> = {
  live: 'border-accent-teal/45 bg-accent-teal/10 text-accent-teal',
  failing: 'border-error/40 bg-error/10 text-error',
  available: 'border-border bg-muted text-muted-foreground',
};

const STATE_LABEL: Record<ScreenState, string> = {
  live: 'Live',
  failing: 'Failing',
  available: 'Not set up',
};

export function ConnectorScreen({
  eyebrow,
  title,
  /** What happens when this is on, in one sentence, from the reader's side of the screen. */
  promise,
  state,
  figures,
  children,
}: {
  eyebrow: string;
  title: string;
  promise: string;
  state: ScreenState;
  figures?: { label: string; value: React.ReactNode; tone?: 'default' | 'warning' | 'critical' | 'positive' }[];
  children: React.ReactNode;
}) {
  return (
    <PageWrapper>
      <IdentityBand
        eyebrow={eyebrow}
        title={title}
        subtitle={promise}
        figures={figures}
        actions={
          <Link
            href="/integrations"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-button border border-band-line text-band-strong text-xs font-semibold uppercase tracking-[0.06em] hover:bg-band-fill transition-colors"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            All integrations
          </Link>
        }
      />
      <div className="flex items-center gap-2">
        <span
          className={`inline-block px-2.5 py-1 rounded-full border text-[0.625rem] font-bold uppercase tracking-[0.06em] ${STATE_PILL[state]}`}
        >
          {STATE_LABEL[state]}
        </span>
      </div>
      {children}
    </PageWrapper>
  );
}

/** A card with a title and an optional right-hand note naming the source of its facts. */
export function Panel({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="enterprise-card overflow-hidden">
      <div className="flex items-baseline justify-between gap-3 px-5 py-4 border-b border-border">
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
        {note && <span className="text-xs text-muted-foreground">{note}</span>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

/**
 * A setting the application reads but cannot change.
 *
 * Showing the property name is the point: it turns "ask someone" into a specific request.
 */
export function DeploymentSetting({
  label,
  property,
  value,
  set,
}: {
  label: string;
  property: string;
  value?: string;
  set: boolean;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3 border-b border-border last:border-0">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-foreground">{label}</div>
        <code className="text-xs text-muted-foreground font-mono">{property}</code>
      </div>
      {set ? (
        <span className="text-xs font-mono text-foreground tabular-nums">{value ?? 'Set'}</span>
      ) : (
        <span className="text-xs font-bold uppercase tracking-[0.06em] text-accent-gold-on-tint">Not set</span>
      )}
    </div>
  );
}

/** Said plainly, because "contact your administrator" is not an instruction. */
export function OperatorNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-control border border-dashed border-cta/50 bg-cta/10 px-4 py-3 text-xs text-muted-foreground">
      {children}
    </div>
  );
}
