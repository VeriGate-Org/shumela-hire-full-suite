'use client';

import React, { ReactNode } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface BulkActionBarProps {
  count: number;
  onClear: () => void;
  /** Controls for the actions this user may actually perform. */
  children: ReactNode;
  /** Shown in place of the actions when the user may perform none of them. */
  emptyMessage?: string;
}

/**
 * The action bar that appears once rows are selected.
 *
 * <p>Bulk work is a <em>state of a list</em>, not a place you navigate to. This product had it the
 * other way round: a separate Application Management console existed largely because the queue had
 * no selection model, so acting on many records meant going somewhere else and losing your filters.
 *
 * <p>It takes its actions as children rather than a fixed set, because which ones a person may use
 * differs by role — bulk status and stage are ADMIN/HR_MANAGER, rating admits RECRUITER, and a
 * HIRING_MANAGER may use none. Rendering all four and letting three of them 403 is the dead-button
 * problem again, so the caller passes only what it will honour.
 */
export default function BulkActionBar({
  count,
  onClear,
  children,
  emptyMessage = 'You do not have permission to act on these in bulk.',
}: BulkActionBarProps) {
  if (count === 0) return null;

  const hasActions = React.Children.toArray(children).some(Boolean);

  return (
    <div
      role="region"
      aria-label={`${count} selected`}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-wrap items-center gap-3 rounded-card bg-primary px-5 py-3 text-primary-foreground shadow-lg"
    >
      <span className="text-sm font-bold whitespace-nowrap">
        {count} selected
      </span>

      <span className="h-6 w-px bg-primary-foreground/30" aria-hidden="true" />

      {hasActions ? (
        children
      ) : (
        <span className="text-xs text-primary-foreground/80">{emptyMessage}</span>
      )}

      <span className="h-6 w-px bg-primary-foreground/30" aria-hidden="true" />

      <button
        type="button"
        onClick={onClear}
        aria-label="Clear selection"
        title="Clear selection"
        className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-foreground/15 transition-colors hover:bg-primary-foreground/30"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

/** A labelled select styled for the bar. Choosing a value runs the action; it does not persist. */
export function BulkSelect({
  label,
  options,
  onChoose,
  disabled,
}: {
  label: string;
  options: Array<{ value: string; label: string }>;
  onChoose: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <select
      aria-label={label}
      defaultValue=""
      disabled={disabled}
      onChange={e => {
        if (e.target.value) {
          onChoose(e.target.value);
          e.target.value = '';
        }
      }}
      className="cursor-pointer rounded-button border border-primary-foreground/30 bg-transparent px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.05em] text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
    >
      <option value="" disabled className="text-foreground">{label}</option>
      {options.map(o => (
        <option key={o.value} value={o.value} className="bg-card text-foreground">
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** A plain action button styled for the bar. */
export function BulkButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-button border border-primary-foreground/30 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.05em] transition-colors hover:bg-primary-foreground/15 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}
