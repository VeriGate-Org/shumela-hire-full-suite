'use client';

import React from 'react';

export type StageState = 'done' | 'current' | 'todo' | 'stopped';

export interface Stage {
  /** Stage name as a person would say it — "HR Manager", not "PENDING_HR_APPROVAL". */
  name: string;
  state: StageState;
  /** Who acted, or who is being waited on. */
  actor?: React.ReactNode;
  /** When they acted, already formatted. */
  when?: string;
  /**
   * Days spent at this stage. Rendered as a bar scaled against the longest stage in this record,
   * so a stage that swallowed three weeks is visible next to one that took a day.
   */
  days?: number;
}

export interface StageRailProps {
  stages: Stage[];
  /** Shown at the right of the footer — a median, a total, whatever gives the numbers meaning. */
  footnote?: React.ReactNode;
}

const DOT_CLASS: Record<StageState, string> = {
  done: 'bg-accent-teal border-accent-teal text-white',
  current: 'bg-cta border-cta text-cta-foreground ring-[5px] ring-cta/25',
  todo: 'bg-card border-border text-muted-foreground',
  stopped: 'bg-error border-error text-white',
};

const FILL_CLASS: Record<StageState, string> = {
  done: 'bg-accent-teal',
  current: 'bg-cta',
  todo: 'bg-border',
  stopped: 'bg-error',
};

/**
 * The stages a record must clear, laid out horizontally with the time spent in each.
 *
 * <p>Two decisions worth keeping: the rail runs across rather than down, because a vertical
 * checklist wastes the width and makes five stages look like a long list; and the bar under each
 * stage is dwell time rather than progress, because how long something sat somewhere is the
 * actionable fact and it costs nothing — the timestamps are already on the record.
 *
 * <p>The number of stages is not fixed. A requisition inside the delegation has two; one above it
 * has three. Rendering a fixed ladder is how a short chain ends up looking incomplete.
 */
export default function StageRail({ stages, footnote }: StageRailProps) {
  // Scale dwell bars against the longest stage in this record, not against a global maximum: the
  // question is where this record lost its time, not how it compares to others.
  const longest = Math.max(1, ...stages.map((stage) => stage.days ?? 0));

  return (
    <section
      aria-label="Progress"
      className="mt-3.5 overflow-hidden rounded-card border border-border bg-card shadow-[var(--shadow-sm)]"
    >
      <ol
        className="grid gap-0 px-5 pb-4 pt-5"
        style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}
      >
        {stages.map((stage, index) => {
          const isLast = index === stages.length - 1;
          return (
            <li key={stage.name} className={`relative ${isLast ? '' : 'pr-4'}`}>
              {/* Connector to the next stage, drawn behind the dot. */}
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={`absolute left-[23px] right-1.5 top-3 h-0.5 ${
                    stage.state === 'done' ? 'bg-accent-teal' : 'bg-border'
                  }`}
                />
              )}
              <span
                aria-hidden="true"
                className={`relative z-10 grid h-[26px] w-[26px] place-items-center rounded-full border-2 text-[0.6875rem] font-extrabold ${
                  DOT_CLASS[stage.state]
                }`}
              >
                {stage.state === 'done' ? '✓' : stage.state === 'stopped' ? '✕' : index + 1}
              </span>

              <p
                className={`mt-2.5 text-[0.8125rem] font-extrabold tracking-[-0.01em] ${
                  stage.state === 'todo' ? 'text-muted-foreground' : 'text-foreground'
                }`}
              >
                {stage.name}
              </p>
              {(stage.actor || stage.when) && (
                <p className="mt-0.5 text-[0.6875rem] leading-snug text-muted-foreground">
                  {stage.actor}
                  {stage.actor && stage.when && <br />}
                  {stage.when}
                </p>
              )}

              {typeof stage.days === 'number' ? (
                <>
                  <span className="mt-2 block h-1 overflow-hidden rounded-full bg-border">
                    <span
                      className={`block h-full rounded-full ${FILL_CLASS[stage.state]}`}
                      style={{ width: `${Math.round(((stage.days || 0) / longest) * 100)}%` }}
                    />
                  </span>
                  <p
                    className={`mt-1 text-[0.625rem] font-bold tabular-nums ${
                      stage.state === 'current' ? 'text-accent-gold' : 'text-muted-foreground'
                    }`}
                  >
                    {stage.days} {stage.days === 1 ? 'day' : 'days'} here
                  </p>
                </>
              ) : (
                <p className="mt-2 text-[0.625rem] font-bold text-muted-foreground">—</p>
              )}
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border bg-muted/40 px-5 py-3 text-[0.6875rem] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-accent-teal" />
          Complete
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-cta" />
          Where it is now
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-border" />
          Not reached
        </span>
        {footnote && <span className="ml-auto">{footnote}</span>}
      </div>
    </section>
  );
}
