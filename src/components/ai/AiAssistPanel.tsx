'use client';

import React, { useState, ReactNode } from 'react';
import { FeatureGate } from '@/components/FeatureGate';

interface AiAssistPanelProps {
  title: string;
  feature: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  description?: string;
}

export default function AiAssistPanel({ title, feature, children, defaultExpanded = false, description }: AiAssistPanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <FeatureGate feature="AI_ENABLED">
      <FeatureGate feature={feature}>
        <div className="border border-gray-200 rounded-sm bg-white overflow-hidden">
          {/* Header — teal left accent */}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50/60 transition-colors text-left border-l-[3px] border-l-teal-500"
          >
            {/* Sparkle icon */}
            <div className="w-7 h-7 rounded-sm bg-teal-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800 tracking-[-0.01em]">{title}</span>
                <span className="text-[10px] font-medium bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded border border-teal-200">AI</span>
              </div>
              {description && (
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
              )}
            </div>

            <svg
              className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${expanded ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Content */}
          {expanded && (
            <div className="px-5 pb-5 pt-3 border-t border-gray-100 bg-gray-50/30">
              {children}
            </div>
          )}
        </div>
      </FeatureGate>
    </FeatureGate>
  );
}
