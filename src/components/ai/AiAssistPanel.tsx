'use client';

import React, { useId, useState, ReactNode } from 'react';
import { FeatureGate } from '@/components/FeatureGate';

type ColorVariant = 'navy' | 'teal' | 'gold' | 'pink';

interface AiAssistPanelProps {
  title: string;
  feature: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  /** Shown when the panel is open. Deliberately not rendered while collapsed — see below. */
  description?: string;
  icon?: ReactNode;
  variant?: ColorVariant;
}

/** Variant now tints the mark only. It used to also drive a 3px accent border across the top. */
const variantText: Record<ColorVariant, string> = {
  navy: 'text-accent-navy',
  teal: 'text-accent-teal',
  gold: 'text-accent-gold',
  pink: 'text-accent-pink',
};

/**
 * A collapsible container for an AI capability.
 *
 * <p>Collapsed, this used to cost about 87px of full-width page: a card with a 3px accent border,
 * a 44px filled icon tile, a 17px bold title, a description line and a hover lift. That is the
 * visual weight of a primary section, spent on what is really a control — and several screens
 * carry more than one, so the actual work (the candidate queue, the pipeline board) was pushed
 * down the page by panels nobody had opened.
 *
 * <p>Collapsed is now a quiet ~40px row: an inline mark, the title, a chevron. Nothing about
 * discoverability changes — same position, same wording, same reading order — only the claim on
 * the page. The description moves inside, because a subtitle explaining a feature is worth reading
 * when you have opened it and is noise when you have not.
 *
 * <p>Expanded, the header keeps a border beneath it and the body sits on the panel's own
 * background, so an open panel still reads as a distinct region without needing an accent stripe
 * to say so.
 */
export default function AiAssistPanel({
  title,
  feature,
  children,
  defaultExpanded = false,
  description,
  icon,
  variant = 'teal',
}: AiAssistPanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const bodyId = useId();

  return (
    <FeatureGate feature="AI_ENABLED">
      <FeatureGate feature={feature}>
        <div className="rounded-card border border-border bg-card overflow-hidden">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-controls={bodyId}
            className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left select-none hover:bg-muted/40 transition-colors"
          >
            <span className="flex items-center gap-2 min-w-0">
              <span className={`flex-shrink-0 ${variantText[variant]}`}>
                {icon || (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
                    />
                  </svg>
                )}
              </span>
              <span className="text-[0.8125rem] font-semibold text-foreground truncate">
                {title}
              </span>
            </span>

            <svg
              className={`w-4 h-4 text-muted-foreground transition-transform duration-200 flex-shrink-0 ${
                expanded ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {/* Children are mounted only while open, as before. Several of these panels hold model
              output and their own request state; keeping them mounted behind `hidden` would change
              when that work happens, which is not a change a chrome fix should smuggle in. */}
          <div id={bodyId}>
            {expanded && (
              <div className="border-t border-border px-4 py-4">
                {description && (
                  <p className="text-[0.8125rem] text-muted-foreground mb-3">{description}</p>
                )}
                {children}
              </div>
            )}
          </div>
        </div>
      </FeatureGate>
    </FeatureGate>
  );
}
