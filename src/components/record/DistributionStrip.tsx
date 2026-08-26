'use client';

import React from 'react';

export interface Bucket {
  label: string;
  count: number;
  /** One line under the figure — the oldest wait here, a median, what the bucket means. */
  detail?: React.ReactNode;
  tone?: 'default' | 'warning' | 'critical' | 'positive';
}

export interface DistributionStripProps {
  buckets: Bucket[];
  /** Small print along the bottom — usually what the bars are a share of. */
  footnote?: React.ReactNode;
}

const VALUE_TONE: Record<NonNullable<Bucket['tone']>, string> = {
  default: 'text-foreground',
  // --accent-gold is 2.22:1 on a white card. --accent-gold-on-tint is the ink value.
  warning: 'text-accent-gold-on-tint',
  critical: 'text-error',
  positive: 'text-accent-teal',
};

const BAR_TONE: Record<NonNullable<Bucket['tone']>, string> = {
  default: 'bg-primary',
  warning: 'bg-cta',
  critical: 'bg-error',
  positive: 'bg-accent-teal',
};

/**
 * Where a whole set is sitting, and how long it has been sitting there.
 *
 * <p>Replaces a row of stat tiles carrying one number each behind a coloured icon square. The
 * difference is not the layout: a tile says "8 pending", this says "8 pending, oldest 19 days",
 * and only the second tells you whether to do anything.
 *
 * <p><b>Every count here must describe the whole set.</b> These figures come from a summary
 * endpoint, not from the rows currently loaded — a number that changes when you paginate is the
 * defect this component exists to stop repeating.
 */
export default function DistributionStrip({ buckets, footnote }: DistributionStripProps) {
  const total = buckets.reduce((sum, bucket) => sum + bucket.count, 0);

  return (
    <section
      aria-label="Distribution"
      className="mt-3.5 overflow-hidden rounded-card border border-border bg-card shadow-[var(--shadow-sm)]"
    >
      {/* auto-fit rather than a fixed column count: the number of buckets varies by page — five
          for a requisition queue, four for a library — and it must wrap rather than squash. */}
      <div
        className="grid gap-x-0 gap-y-6 px-5 pb-4 pt-5"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}
      >
        {buckets.map((bucket, index) => (
          <div
            key={bucket.label}
            className={`pr-5 ${index === buckets.length - 1 ? '' : 'border-border sm:border-r'}`}
          >
            <p className="text-[0.5625rem] font-extrabold uppercase tracking-[0.15em] text-muted-foreground">
              {bucket.label}
            </p>
            <p
              className={`mt-0.5 text-[1.75rem] font-extrabold leading-none tracking-[-0.04em] tabular-nums ${
                VALUE_TONE[bucket.tone ?? 'default']
              }`}
            >
              {bucket.count}
            </p>
            {bucket.detail && (
              <p className="mt-0.5 text-[0.6875rem] text-muted-foreground">{bucket.detail}</p>
            )}
            <span className="mt-2.5 block h-1.5 overflow-hidden rounded-full bg-border">
              <span
                className={`block h-full rounded-full ${BAR_TONE[bucket.tone ?? 'default']}`}
                style={{ width: total > 0 ? `${Math.round((bucket.count / total) * 100)}%` : '0%' }}
              />
            </span>
          </div>
        ))}
      </div>

      {footnote && (
        <p className="border-t border-border bg-muted/40 px-5 py-2.5 text-[0.6875rem] text-muted-foreground">
          {footnote}
        </p>
      )}
    </section>
  );
}
