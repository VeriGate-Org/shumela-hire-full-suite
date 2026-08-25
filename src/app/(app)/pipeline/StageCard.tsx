'use client';

import React, { ReactNode } from 'react';
import { StageState, TONE_EDGE, TONE_TEXT } from './stageSignal';

/**
 * One card on the board — built for the stage it sits in.
 *
 * <p>The card used to be a single component with six optional blocks bolted on: a sub-stage badge,
 * five star glyphs, an interview preview, an offer pill, a verification strip, a row of hazard
 * badges, and a percentage. Every candidate paid the layout cost of every stage, and the result was
 * around 95px of card for what is, at any one moment, a single fact: <b>what is this person waiting
 * on?</b>
 *
 * <p>So the anatomy is fixed at three parts — identity, one signal line, footer — and the stage
 * chooses only what goes in the signal. The coloured left edge carries the tone, which is the one
 * thing that has to read without being looked at.
 */
export interface StageCardProps {
  name: string;
  role: string;
  department?: string;
  /** What this stage has to say. `line: null` renders no signal row at all. */
  state: StageState;
  /** Dwell, already worded — "Today", "6d in stage", "Time in stage unknown". */
  dwell: string;
  /** Shown only where it adds something the column heading does not. */
  subStage?: string | null;
  rating?: number;
  selected: boolean;
  onOpen: () => void;
  onToggleSelect: (checked: boolean) => void;
  /** Rendered in the footer, revealed on hover. Usually the shortlist control. */
  quickAction?: ReactNode;
  /** Checks only: one dot per required check. */
  checkDots?: { clear: number; total: number } | null;
}

export default function StageCard({
  name,
  role,
  department,
  state,
  dwell,
  subStage,
  rating = 0,
  selected,
  onOpen,
  onToggleSelect,
  quickAction,
  checkDots,
}: StageCardProps) {
  return (
    <div
      role="listitem"
      onClick={onOpen}
      className={`group relative cursor-pointer overflow-hidden rounded-card border bg-card p-2.5 pl-3 shadow-sm transition-all before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:content-[''] hover:-translate-y-px hover:border-primary/30 hover:shadow-md ${
        TONE_EDGE[state.tone]
      } ${selected ? 'border-primary shadow-[0_0_0_2px_rgba(5,82,126,0.2)]' : 'border-border'}`}
    >
      {/* Revealed on hover, on focus, or when selected. group-hover alone does not fire for a
          keyboard user, and the control is in the tab order either way — which made the page look
          as though it were swallowing the Tab key. */}
      <input
        type="checkbox"
        checked={selected}
        aria-label={`Select ${name}`}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onToggleSelect(e.target.checked)}
        className={`absolute right-2 top-2 h-3.5 w-3.5 rounded border-2 border-border accent-primary transition-opacity ${
          selected ? 'opacity-100' : 'opacity-0 focus:opacity-100 group-hover:opacity-100'
        }`}
      />

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpen();
        }}
        className="block rounded-sm pr-5 text-left text-[0.8125rem] font-bold leading-tight text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {name}
        <span className="sr-only"> — open candidate details</span>
      </button>

      <p className="mt-0.5 truncate text-[0.6875rem] font-medium leading-snug text-muted-foreground">
        {role}
        {department && <> &middot; {department}</>}
      </p>

      {/* The signal. One line, or none — Hired says nothing, because nothing is owed. */}
      {(state.line || checkDots) && (
        <div className="mt-1.5 flex items-center gap-1.5">
          {checkDots && <CheckDots {...checkDots} />}
          {state.line && (
            <span className={`truncate text-[0.6875rem] font-bold ${TONE_TEXT[state.tone]}`}>
              {state.line}
            </span>
          )}
        </div>
      )}

      <div className="mt-1.5 flex items-center justify-between gap-2">
        <span className="truncate text-[0.625rem] font-medium tabular-nums text-muted-foreground">
          {dwell}
          {subStage && <> &middot; {subStage}</>}
        </span>
        <div className="flex flex-shrink-0 items-center gap-1">
          {/* A rating is worth four characters, not five glyphs on their own row. */}
          {rating > 0 && (
            <span className="text-[0.625rem] font-bold tabular-nums text-accent-gold" title={`Rated ${rating} of 5`}>
              ★{rating}
            </span>
          )}
          {quickAction && (
            <span className="opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
              {quickAction}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Five checks as five dots.
 *
 * <p>The abbreviated pills this replaces read "CR ID QU CR EM" — initials of enum names, which is
 * the ENUM-on-the-UI problem in a costume. The count is what the column is actually scanned for and
 * it sits next to the dots in words.
 *
 * <p>Only cleared and not-yet-cleared are drawn. An adverse finding is deliberately <b>not</b> a
 * red dot: the summary reports it as a boolean, so which of the outstanding checks failed is not
 * known here, and colouring them all red would claim more than the data says. It is carried by the
 * signal line and the card's edge instead, both of which already read as stopped.
 */
function CheckDots({ clear, total }: { clear: number; total: number }) {
  return (
    <span className="flex flex-shrink-0 items-center gap-[3px]" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${i < clear ? 'bg-accent-teal' : 'bg-border'}`}
        />
      ))}
    </span>
  );
}
