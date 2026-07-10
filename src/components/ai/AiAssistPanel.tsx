'use client';

import React, { useState, ReactNode } from 'react';
import { FeatureGate } from '@/components/FeatureGate';

type ColorVariant = 'navy' | 'teal' | 'gold' | 'pink';

interface AiAssistPanelProps {
  title: string;
  feature: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  description?: string;
  icon?: ReactNode;
  variant?: ColorVariant;
}

const variantStyles: Record<ColorVariant, { border: string; iconBg: string; iconText: string }> = {
  navy: {
    border: 'border-t-[3px] border-t-accent-navy',
    iconBg: 'bg-icon-bg-navy',
    iconText: 'text-accent-navy',
  },
  teal: {
    border: 'border-t-[3px] border-t-accent-teal',
    iconBg: 'bg-icon-bg-teal',
    iconText: 'text-accent-teal',
  },
  gold: {
    border: 'border-t-[3px] border-t-accent-gold',
    iconBg: 'bg-icon-bg-gold',
    iconText: 'text-accent-gold',
  },
  pink: {
    border: 'border-t-[3px] border-t-accent-pink',
    iconBg: 'bg-icon-bg-pink',
    iconText: 'text-accent-pink',
  },
};

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
  const styles = variantStyles[variant];

  return (
    <FeatureGate feature="AI_ENABLED">
      <FeatureGate feature={feature}>
        <div
          className={`enterprise-card overflow-hidden ${styles.border} transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}
        >
          {/* Header */}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between p-5 hover:bg-gray-50/60 transition-colors text-left select-none"
          >
            <div className="flex items-center gap-3.5">
              {/* Icon */}
              <div
                className={`w-11 h-11 rounded-card ${styles.iconBg} ${styles.iconText} flex items-center justify-center flex-shrink-0`}
              >
                {icon || (
                  <svg
                    className="w-[22px] h-[22px]"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                    />
                  </svg>
                )}
              </div>

              {/* Title & subtitle */}
              <div>
                <div className="text-[1.0625rem] font-bold text-foreground leading-tight">
                  {title}
                </div>
                {description && (
                  <div className="text-[0.8125rem] text-muted-foreground font-medium mt-0.5">
                    {description}
                  </div>
                )}
              </div>
            </div>

            {/* Chevron */}
            <svg
              className={`w-5 h-5 text-muted-foreground transition-transform duration-300 flex-shrink-0 ${
                expanded ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 9l6 6 6-6"
              />
            </svg>
          </button>

          {/* Body — collapsible content */}
          {expanded && (
            <div className="border-t border-border">
              <div className="px-5 pb-5 pt-5">
                {children}
              </div>
            </div>
          )}
        </div>
      </FeatureGate>
    </FeatureGate>
  );
}
