'use client';

import React, { ReactNode, useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { StageState, TONE_BAR } from './stageSignal';

/**
 * The decision, at the top of the detail modal.
 *
 * <p>The modal was already stage-aware — five flags picked which panels mounted — but the order was
 * fixed for every stage and put the least decisive thing first. A Checks candidate barred from Offer
 * by <code>enforceCheckCompletion</code> learned that below a phone number, four panels down.
 *
 * <p>So the decision moved to the top and everything that is reference data moved into folds. This
 * band is the only genuinely new part of the modal; the rest is a reordering.
 */
export function DecisionBar({
  state,
  action,
}: {
  state: StageState;
  /** The control that discharges it, or nothing where the stage offers none. */
  action?: ReactNode;
}) {
  if (!state.headline) return null;
  return (
    <div className={`flex flex-wrap items-center gap-3 border-b border-l-[3px] border-border px-5 py-3 ${TONE_BAR[state.tone]}`}>
      <div className="min-w-0 flex-1 basis-64">
        <p className="text-sm font-extrabold leading-tight tracking-[-0.015em] text-foreground">
          {state.headline}
        </p>
        {state.detail && (
          <p className="mt-0.5 text-xs text-muted-foreground">{state.detail}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/**
 * A section that is present, closed, and honest about what is inside it.
 *
 * <p>Children are not mounted while closed. That is the point rather than an optimisation: the
 * panels behind these folds fetch on mount, and a fold that renders its children into a hidden
 * container would issue every request the folds exist to avoid — including the AI ones.
 *
 * <p>`count` is whatever the caller already knows. Where it would cost a request to find out, it is
 * omitted: a count that appears a second after the fold reads as a bug, and a fold with no count is
 * merely a fold.
 */
export function Fold({
  label,
  count,
  defaultOpen = false,
  children,
}: {
  label: string;
  count?: string | null;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-control border border-border">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[0.6875rem] font-bold text-muted-foreground transition-colors hover:text-foreground"
      >
        <span className="flex items-center gap-1.5">
          <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
          {label}
        </span>
        {count && <span className="text-[0.625rem] font-semibold text-muted-foreground/70">{count}</span>}
      </button>
      {open && <div className="border-t border-border px-3 py-3">{children}</div>}
    </div>
  );
}

/**
 * The stage's own evidence, open.
 *
 * <p>Never more than one of these. Two open panels is the pile the folds were introduced to end.
 */
export function Evidence({
  label,
  meta,
  children,
}: {
  label: string;
  meta?: string | null;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-control border border-border">
      <header className="flex items-center justify-between gap-2 border-b border-border bg-muted/50 px-3 py-2">
        <h3 className="text-[0.5625rem] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </h3>
        {meta && <span className="text-[0.625rem] font-semibold text-muted-foreground/70">{meta}</span>}
      </header>
      <div className="px-3 py-3">{children}</div>
    </section>
  );
}
