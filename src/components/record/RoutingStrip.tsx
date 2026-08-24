'use client';

import React from 'react';

export interface RoutingStripProps {
  /** The sentence explaining the routing. Comes from the server; never composed in the browser. */
  rationale: string;
  /** The computed chain, in order. Stage names as a person would say them. */
  chain: string[];
  /** Which stage is live now, if any. Matched against `chain` by value. */
  currentStage?: string | null;
  /** True when the chain is longer than the minimum. Drives emphasis, not content. */
  escalated?: boolean;
  /** Small print below — where the rule comes from, what it is measured on. */
  footnote?: React.ReactNode;
}

/**
 * Why this record needs the approvers it needs.
 *
 * <p>The distinctive element of a record whose routing is computed rather than fixed. A reader can
 * see *that* a requisition is with the executive from the stage rail; this says *why* — and once
 * approval chains are configurable, the why stops being inferable from the code as well.
 *
 * <p>The rationale is rendered as supplied. It is composed server-side by the delegation matrix,
 * which owns the threshold, so recomposing it here would mean duplicating the rule in the browser
 * and letting the two drift.
 */
export default function RoutingStrip({
  rationale,
  chain,
  currentStage,
  escalated = false,
  footnote,
}: RoutingStripProps) {
  return (
    <section
      aria-label="Approval routing"
      className="mt-3.5 overflow-hidden rounded-card border border-border bg-card shadow-[var(--shadow-sm)]"
    >
      <div className="flex flex-wrap items-center gap-x-7 gap-y-4 px-5 py-4">
        <p className="min-w-0 flex-1 basis-80 text-sm leading-relaxed text-foreground">
          {rationale}
        </p>

        <ol className="flex flex-wrap items-center gap-2" aria-label="Required approval chain">
          {chain.map((stage, index) => (
            <React.Fragment key={stage}>
              {index > 0 && (
                <span aria-hidden="true" className="text-[0.8125rem] font-extrabold text-muted-foreground/60">
                  →
                </span>
              )}
              <li
                className={`rounded-full border px-3 py-1.5 text-[0.6875rem] font-extrabold tracking-[0.02em] ${
                  stage === currentStage
                    ? 'border-cta/50 bg-cta/15 text-accent-gold'
                    : 'border-border bg-muted/40 text-foreground'
                }`}
              >
                {stage}
                {stage === currentStage && <span className="sr-only"> — awaiting this stage</span>}
              </li>
            </React.Fragment>
          ))}
          <span aria-hidden="true" className="text-[0.8125rem] font-extrabold text-muted-foreground/60">
            →
          </span>
          <li className="rounded-full border border-accent-teal/45 bg-accent-teal/10 px-3 py-1.5 text-[0.6875rem] font-extrabold tracking-[0.02em] text-accent-teal">
            Approved
          </li>
        </ol>
      </div>

      {footnote && (
        <p className="border-t border-border bg-muted/40 px-5 py-2.5 text-[0.6875rem] leading-relaxed text-muted-foreground">
          {footnote}
        </p>
      )}
      {escalated && <span className="sr-only">This record has escalated beyond the minimum approval chain.</span>}
    </section>
  );
}
