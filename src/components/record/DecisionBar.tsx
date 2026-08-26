'use client';

import React from 'react';

export type DecisionTone = 'owed' | 'settled' | 'stopped';

export interface DecisionBarProps {
  /**
   * The ask, in one sentence. Write it as something owed — "This requisition is waiting on your
   * approval" — not as a status label.
   */
  ask: string;
  /** Why, in a second sentence. Context the reader needs to decide, not a restatement of the ask. */
  why?: React.ReactNode;
  /**
   * `owed` when someone must act, `settled` when the decision was taken, `stopped` when it ended
   * badly. This drives the left border, which is the only colour on the component.
   */
  tone?: DecisionTone;
  /** The actions. The primary one should be the thing the ask names. */
  children?: React.ReactNode;
}

const TONE_BORDER: Record<DecisionTone, string> = {
  owed: 'border-l-accent-gold',
  settled: 'border-l-accent-teal',
  stopped: 'border-l-error',
};

/**
 * States what is owed on this record, and puts the actions beside it.
 *
 * <p>Sits directly under the identity band so the ask is read before any detail. On a record where
 * nothing is owed it still appears, in `settled` or `stopped` tone, because "this was decided, by
 * whom, and when" is itself the answer to why the reader opened the page.
 */
export default function DecisionBar({
  ask,
  why,
  tone = 'owed',
  children,
}: DecisionBarProps) {
  return (
    <section
      aria-label="Decision"
      className={`mt-3.5 flex flex-wrap items-center gap-4 rounded-card border border-border border-l-4 bg-card px-5 py-4 shadow-[var(--shadow-sm)] ${TONE_BORDER[tone]}`}
    >
      <div className="min-w-0 flex-1 basis-80">
        <p className="text-base font-extrabold tracking-[-0.02em] text-foreground">{ask}</p>
        {why && <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-muted-foreground">{why}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </section>
  );
}

/**
 * The action the ask names. There should be one of these, or none.
 *
 * Gold is the scarce colour in this system: it means "this is what you are being asked to do". Two
 * gold buttons on a page means neither is the answer.
 */
export function PrimaryAction(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = '', ...rest } = props;
  return (
    <button
      type="button"
      {...rest}
      className={`rounded-full bg-cta px-[18px] py-2.5 text-xs font-extrabold uppercase tracking-[0.07em] text-cta-foreground transition-colors hover:bg-cta-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    />
  );
}

/** A secondary action — available, but not what the reader is being asked to do. */
export function SecondaryAction(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = '', ...rest } = props;
  return (
    <button
      type="button"
      {...rest}
      className={`rounded-full border border-border bg-transparent px-[18px] py-2.5 text-xs font-extrabold uppercase tracking-[0.07em] text-foreground transition-colors hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    />
  );
}

/** An action that ends something. Outlined rather than filled — destructive, not primary. */
export function DestructiveAction(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = '', ...rest } = props;
  return (
    <button
      type="button"
      {...rest}
      className={`rounded-full border border-error/40 bg-transparent px-[18px] py-2.5 text-xs font-extrabold uppercase tracking-[0.07em] text-error-on-tint transition-colors hover:bg-error-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    />
  );
}
