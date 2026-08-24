'use client';

import React from 'react';
import { formatEnumValue } from '@/utils/enumLabels';

export interface VerificationSummary {
  applicationId: number;
  requiredCheckTypes: string[];
  enforceCheckCompletion: boolean;
  checks: Array<{
    id: number;
    referenceId: string;
    checkTypes: string;
    status: string;
    overallResult: string | null;
  }>;
  clearCount: number;
  totalRequired: number;
  hasAdverse: boolean;
  allClear: boolean;
  noneStarted: boolean;
}

interface VerificationStatusSummaryProps {
  summary: VerificationSummary;
  onInitiateChecks?: () => void;
  compact?: boolean;
}

const CHECK_ICON: Record<string, { icon: string; color: string }> = {
  CLEAR: { icon: '\u2713', color: 'text-emerald-600' },
  IN_PROGRESS: { icon: '\u25F7', color: 'text-blue-500' },
  PENDING: { icon: '\u25CB', color: 'text-gray-400' },
  ADVERSE: { icon: '\u2717', color: 'text-red-600' },
};

function getCheckStatus(
  checkType: string,
  checks: VerificationSummary['checks']
): 'CLEAR' | 'IN_PROGRESS' | 'ADVERSE' | 'PENDING' {
  for (const check of checks) {
    let types: string[] = [];
    try {
      types = JSON.parse(check.checkTypes || '[]');
    } catch {
      /* ignore */
    }
    if (!types.includes(checkType)) continue;

    if (check.status === 'COMPLETED' && check.overallResult === 'CLEAR') return 'CLEAR';
    if (check.overallResult === 'ADVERSE') return 'ADVERSE';
    if (['INITIATED', 'PENDING_CONSENT', 'IN_PROGRESS', 'PARTIAL_RESULTS'].includes(check.status)) {
      return 'IN_PROGRESS';
    }
  }
  return 'PENDING';
}

export default function VerificationStatusSummary({
  summary,
  onInitiateChecks,
  compact = false,
}: VerificationStatusSummaryProps) {
  const { requiredCheckTypes, checks, clearCount, totalRequired, hasAdverse, allClear, noneStarted } = summary;

  if (totalRequired === 0) {
    return compact ? null : (
      <div className="text-xs text-muted-foreground">No verification checks configured</div>
    );
  }

  const progressPercent = totalRequired > 0 ? (clearCount / totalRequired) * 100 : 0;

  if (compact) {
    return (
      <div className="mt-2 mb-1">
        {/* Progress label */}
        <div className="flex items-center justify-between mb-1">
          <span className={`text-[10px] font-semibold uppercase tracking-wider ${
            allClear ? 'text-emerald-600' : hasAdverse ? 'text-red-600' : 'text-muted-foreground'
          }`}>
            {allClear ? 'All Clear' : hasAdverse ? 'Adverse' : `${clearCount}/${totalRequired} clear`}
          </span>
        </div>

        {/* Per-check icons */}
        <div className="flex flex-wrap gap-1 mb-1.5">
          {requiredCheckTypes.map((ct) => {
            const status = getCheckStatus(ct, checks);
            const cfg = CHECK_ICON[status];
            return (
              <span
                key={ct}
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-card border border-border ${cfg.color}`}
                title={`${formatEnumValue(ct)}: ${formatEnumValue(status)}`}
              >
                <span className="text-xs">{cfg.icon}</span>
                {formatEnumValue(ct).split(' ').map(w => w[0]).join('')}
              </span>
            );
          })}
        </div>

        {/* Mini progress bar */}
        <div className="h-1 rounded-full bg-border overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              allClear ? 'bg-emerald-500' : hasAdverse ? 'bg-red-500' : 'bg-primary'
            }`}
            style={{ width: `${Math.max(progressPercent, 2)}%` }}
          />
        </div>

        {/* Initiate CTA */}
        {noneStarted && onInitiateChecks && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onInitiateChecks();
            }}
            className="mt-1.5 w-full text-[10px] font-semibold uppercase tracking-wider text-center py-1 rounded border border-cta bg-cta/10 text-cta-foreground hover:bg-cta/20 transition-colors"
          >
            Initiate Checks
          </button>
        )}
      </div>
    );
  }

  // Full (non-compact) version for the detail modal
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-foreground">Verification Status</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {totalRequired} required check{totalRequired !== 1 ? 's' : ''} for this role
            {summary.enforceCheckCompletion && (
              <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                Enforced
              </span>
            )}
          </p>
        </div>
        <div className={`text-sm font-semibold ${
          allClear ? 'text-emerald-600' : hasAdverse ? 'text-red-600' : 'text-foreground'
        }`}>
          {clearCount}/{totalRequired} Clear
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-border overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all ${
            allClear ? 'bg-emerald-500' : hasAdverse ? 'bg-red-500' : 'bg-primary'
          }`}
          style={{ width: `${Math.max(progressPercent, 2)}%` }}
        />
      </div>

      {/* Per-check details */}
      <div className="grid grid-cols-2 gap-2">
        {requiredCheckTypes.map((ct) => {
          const status = getCheckStatus(ct, checks);
          const cfg = CHECK_ICON[status];
          return (
            <div
              key={ct}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded border border-border bg-background"
            >
              <span className={`text-sm ${cfg.color}`}>{cfg.icon}</span>
              <span className="text-xs text-foreground">{formatEnumValue(ct)}</span>
            </div>
          );
        })}
      </div>

      {/* Blocker message */}
      {summary.enforceCheckCompletion && !allClear && (
        <div className="mt-3 px-3 py-2 rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-400">
          {hasAdverse
            ? 'Adverse findings detected. Review required before progression.'
            : noneStarted
            ? 'Verification checks must be completed before moving to Offer stage.'
            : `${totalRequired - clearCount} check${totalRequired - clearCount !== 1 ? 's' : ''} still pending. All must be clear before progression.`}
        </div>
      )}

      {/* Initiate button */}
      {noneStarted && onInitiateChecks && (
        <button
          onClick={onInitiateChecks}
          className="mt-3 w-full text-xs font-semibold uppercase tracking-wider text-center py-2 rounded-full border-2 border-cta bg-transparent text-cta-foreground hover:bg-cta hover:text-foreground transition-colors"
        >
          Initiate Verification Checks
        </button>
      )}
    </div>
  );
}
