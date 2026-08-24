'use client';

import React from 'react';

export interface FilterChip {
  key: string;
  label: string;
  /**
   * How many records match. Pass `undefined` where the count is genuinely unknown — the chip then
   * shows no number rather than a zero, because "none match" and "we have not counted" are
   * different answers and only one of them means stop looking.
   */
  count?: number;
}

export interface FilterChipsProps {
  chips: FilterChip[];
  activeKey: string;
  onChange: (key: string) => void;
  /** Right-aligned note — usually what the list is sorted by. */
  note?: React.ReactNode;
  'aria-label'?: string;
}

/**
 * The filter row above a queue.
 *
 * <p>Chips rather than a select, because the counts are the point: a filter that says how much is
 * behind it is a summary as well as a control, and a reader can see where the work is without
 * clicking anything.
 *
 * <p>Counts must come from a summary over the whole set. A chip labelled with the number of
 * matching rows on the current page is the defect this system keeps finding.
 */
export default function FilterChips({
  chips,
  activeKey,
  onChange,
  note,
  'aria-label': ariaLabel = 'Filter',
}: FilterChipsProps) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3"
    >
      {chips.map((chip) => {
        const active = chip.key === activeKey;
        return (
          <button
            key={chip.key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(chip.key)}
            className={`rounded-full border px-3.5 py-1.5 text-[0.6875rem] font-extrabold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              active
                ? 'border-primary bg-primary text-white'
                : 'border-border bg-transparent text-muted-foreground hover:bg-accent'
            }`}
          >
            {chip.label}
            {typeof chip.count === 'number' && (
              <span className="ml-1.5 tabular-nums opacity-75">{chip.count}</span>
            )}
          </button>
        );
      })}
      {note && <span className="ml-auto text-[0.6875rem] text-muted-foreground">{note}</span>}
    </div>
  );
}
