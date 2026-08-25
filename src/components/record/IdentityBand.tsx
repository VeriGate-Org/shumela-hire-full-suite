'use client';

import React from 'react';

export interface IdentityFigure {
  /** Short label, e.g. "In workflow". */
  label: string;
  /** The figure itself. Pass a string so the caller decides formatting and units. */
  value: React.ReactNode;
  /**
   * Draws attention to this figure. Use for the one thing that should worry the reader — a wait
   * that has gone on too long, a deadline that has passed. At most one per band: two emphasised
   * figures means neither is urgent.
   */
  tone?: 'default' | 'warning' | 'critical' | 'positive';
}

export interface IdentityBandProps {
  /** What kind of record this is — "Requisition & approval record", not the record's own name. */
  eyebrow: string;
  /** This record's name. */
  title: string;
  /** Reference, owner, department — whatever identifies this one. */
  subtitle?: React.ReactNode;
  /** Two or three figures. More than three and none of them registers. */
  figures?: IdentityFigure[];
  /** Rendered below the subtitle, inside the band — used for a from/to pair or similar. */
  children?: React.ReactNode;
  /**
   * The one thing this screen is for — "Schedule interview", "New requisition".
   *
   * <p>On a queue screen the band IS the page header, so an action with nowhere else to live
   * belongs here. The decision bar carries actions too, but only when something is actually owed;
   * a screen with nothing outstanding would otherwise offer no way to start work at all.
   */
  actions?: React.ReactNode;
}

// Band-scoped state colours. The page palette's --critical and --teal are chosen against a light
// surface and do not read on this navy, so the band has its own pair.
const TONE_CLASS: Record<NonNullable<IdentityFigure['tone']>, string> = {
  default: 'text-band-foreground',
  warning: 'text-band-accent',
  critical: 'text-band-critical',
  positive: 'text-band-positive',
};

/**
 * The navy plate at the head of a record.
 *
 * <p>Names what kind of thing the reader is looking at before naming the thing itself, so a screen
 * is self-explanatory before anything is read. The band is a fixed navy in both themes — it is an
 * identity, not a surface — which is why it uses the dedicated `--band-*` tokens rather than the
 * page palette.
 */
export default function IdentityBand({
  eyebrow,
  title,
  subtitle,
  figures = [],
  children,
  actions,
}: IdentityBandProps) {
  return (
    <header className="band-glow relative overflow-hidden rounded-card bg-band px-6 py-6 text-band-foreground">
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          <p className="text-[0.625rem] font-extrabold uppercase tracking-[0.16em] text-band-accent">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-[1.65rem] font-extrabold leading-tight tracking-[-0.035em] text-balance">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-sm text-band-muted">{subtitle}</p>
          )}
          {children}
        </div>

        {(figures.length > 0 || actions) && (
          // Figures and the action share the right-hand side. They wrap as a unit so a narrow
          // window drops the action below the figures rather than stranding it mid-row.
          <div className="flex flex-wrap items-start gap-x-7 gap-y-4">
            {figures.length > 0 && (
              <dl className="flex flex-wrap gap-x-7 gap-y-3">
                {figures.map((figure) => (
                  <div key={figure.label} className="min-w-[88px]">
                    <dt className="text-[0.5625rem] font-extrabold uppercase tracking-[0.16em] text-band-faint">
                      {figure.label}
                    </dt>
                    <dd
                      className={`mt-0.5 text-[1.05rem] font-extrabold tracking-[-0.02em] tabular-nums ${
                        TONE_CLASS[figure.tone ?? 'default']
                      }`}
                    >
                      {figure.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            {/* band-actions re-points page-level CTA classes at the --band-* palette. Callers pass
                ordinary buttons here, but the plate is a fixed navy in both themes, so the page's
                CTA ink is the plate's own colour in light mode — an invisible button. */}
            {actions && (
              <div className="band-actions flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
