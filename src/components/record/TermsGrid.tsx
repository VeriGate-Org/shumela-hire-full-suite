'use client';

import React from 'react';

export interface Term {
  label: string;
  /** Pass `undefined` for a value the record does not hold — see `absent`. */
  value?: React.ReactNode;
  /**
   * What to say when there is no value. Defaults to "Not recorded".
   *
   * Absent and empty are different states and users act on the difference, so a missing value is
   * always stated rather than rendered as a blank cell.
   */
  absent?: string;
  tone?: 'default' | 'warning' | 'critical';
}

const TONE_CLASS: Record<NonNullable<Term['tone']>, string> = {
  default: 'text-foreground',
  warning: 'text-accent-gold',
  critical: 'text-error',
};

/**
 * A two-column grid of flat facts about a record.
 *
 * <p>Replaces the pattern of one circular icon badge per field. Eight identical gold circles carry
 * no information and outweigh the values they decorate; a label and a value in a ruled grid reads
 * faster and takes less room.
 */
export default function TermsGrid({ terms }: { terms: Term[] }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2">
      {terms.map((term, index) => {
        const missing = term.value === undefined || term.value === null || term.value === '';
        // Border logic: every cell gets a bottom rule except the final row, and odd cells get a
        // right rule so the two columns are separated without a wrapper per row.
        const isLastRow = index >= terms.length - (terms.length % 2 === 0 ? 2 : 1);
        return (
          <div
            key={term.label}
            className={`px-5 py-3.5 ${isLastRow ? '' : 'border-b border-border'} ${
              index % 2 === 0 ? 'sm:border-r sm:border-border' : ''
            }`}
          >
            <dt className="text-[0.5625rem] font-extrabold uppercase tracking-[0.15em] text-muted-foreground">
              {term.label}
            </dt>
            <dd
              className={`mt-0.5 text-[0.9375rem] tracking-[-0.015em] ${
                missing
                  ? 'font-semibold text-muted-foreground'
                  : `font-bold ${TONE_CLASS[term.tone ?? 'default']}`
              }`}
            >
              {missing ? term.absent ?? 'Not recorded' : term.value}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
