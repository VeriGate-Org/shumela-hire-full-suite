'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api-fetch';
import {
  RecruiterOverview,
  TileState,
  acceptanceTile,
  countTile,
  exceptions,
  funnel,
  funnelAvailable,
  isRecruiterOverview,
  largestLoss,
  FUNNEL_STAGES,
  STAGE_LABELS,
} from './dashboard/overview';

/**
 * The filters that used to sit in the page header have been removed.
 *
 * <p>Both were inert. `dateRange` and `selectedDepartment` were held in this component's
 * own state and read by nothing — changing either did not alter a single figure on the page. The
 * department list was six hardcoded strings (Engineering, Marketing, Sales, HR, Finance,
 * Operations) that matched nothing on this tenant, which is the same fault the applications list
 * had.
 *
 * <p>Exported as an empty fragment rather than deleted outright so the page importing it keeps
 * working; the import can go with it in a follow-up. A control that cannot work is worse than no
 * control, because it costs a reader time before it disappoints them.
 */
export function RecruiterDashboardFilters() {
  return null;
}


/**
 * One figure, in whichever of its three states applies.
 *
 * <p>"Unavailable" carries a retry; "not enough data" does not, because retrying will not produce
 * more offers. The page previously rendered both, and a real number, as `0`.
 */
function Tile({
  label,
  state,
  detail,
  suffix,
  onRetry,
}: {
  label: string;
  state: TileState;
  detail?: React.ReactNode;
  suffix?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="enterprise-card p-5">
      <p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-muted-foreground/70">
        {label}
      </p>
      {state.kind === 'value' ? (
        <>
          <p className="text-[1.75rem] font-extrabold leading-tight text-foreground mt-1 tabular-nums">
            {suffix === '%' ? state.value.toFixed(1) : state.value}
            {suffix && <span className="text-lg font-bold ml-0.5">{suffix}</span>}
          </p>
          {detail && <p className="text-xs text-muted-foreground mt-1">{detail}</p>}
        </>
      ) : (
        <>
          <p
            className={`text-base font-bold leading-tight mt-1 ${
              state.kind === 'unavailable' ? 'text-error' : 'text-muted-foreground'
            }`}
          >
            {state.kind === 'unavailable' ? 'Unavailable' : 'Not enough data'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{state.reason}</p>
          {state.kind === 'unavailable' && onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-xs font-semibold text-primary hover:underline"
            >
              Retry
            </button>
          )}
        </>
      )}
    </div>
  );
}

const RecruiterDashboard: React.FC = () => {
  // No initial zeros. Absence is null and renders as "unavailable" — a zero meaning "we could not
  // load this" is the defect this page is being fixed for.
  const [overview, setOverview] = useState<RecruiterOverview | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'loaded' | 'failed'>('loading');

  /**
   * One request, and a failure that is visible.
   *
   * What stood here fired four requests under Promise.allSettled and read three of them inside
   * `if (fulfilled && ok)` with NO else branch. A failure left state at its initial zeros and the
   * page rendered a confident dashboard of noughts with no error anywhere.
   *
   * It was worse than that. The headline figures were read as `data.totalApplications`,
   * `data.activeJobPostings`, `data.newApplicants` and `data.interviewRate` from an endpoint that
   * returns `kpis`, `trends` and `alerts` — none of those keys has ever been on it. Every read
   * passed through `|| 0`, so the page showed zeros on a fully SUCCESSFUL request.
   *
   * The fourth request, /api/analytics/kpis, was fetched into `_kpisRes` and discarded on every
   * load. It calls the same service method as /dashboard with today's date, so it was a duplicate.
   * It is gone.
   */
  const loadOverview = useCallback(async () => {
    setLoadState('loading');
    try {
      const response = await apiFetch('/api/analytics/recruiter-overview');
      if (!response.ok) {
        setOverview(null);
        setLoadState('failed');
        return;
      }
      const payload = await response.json();
      if (!isRecruiterOverview(payload)) {
        // An error body is an object too, and reading counts off it yields undefined — which the
        // old `|| 0` turned into zeros indistinguishable from real ones.
        setOverview(null);
        setLoadState('failed');
        return;
      }
      setOverview(payload);
      setLoadState('loaded');
    } catch {
      setOverview(null);
      setLoadState('failed');
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const needsAttention = exceptions(overview);
  const steps = funnel(overview, FUNNEL_STAGES);
  const loss = largestLoss(overview, FUNNEL_STAGES);

  if (loadState === 'loading' && !overview) {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="enterprise-card p-5 animate-pulse">
              <div className="h-2.5 bg-border rounded w-20" />
              <div className="h-7 bg-border rounded w-16 mt-3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* The page says what is wrong before it says anything else. A dashboard should be boring
          until it is not. */}
      {loadState === 'failed' ? (
        <div className="enterprise-card p-5 border-l-4 border-error">
          <p className="text-sm font-bold text-error">The recruitment overview did not load.</p>
          <p className="text-xs text-muted-foreground mt-1">
            No figures are shown, because a dashboard of zeroes is indistinguishable from a quiet
            month.
          </p>
          <button
            onClick={loadOverview}
            className="mt-3 px-4 py-2 bg-cta text-cta-foreground rounded-full text-xs font-semibold uppercase tracking-wider"
          >
            Retry
          </button>
        </div>
      ) : needsAttention.length > 0 ? (
        <div className="enterprise-card p-5 border-l-4 border-cta">
          <p className="text-sm font-bold text-foreground">
            {needsAttention.length === 1
              ? 'One thing needs attention'
              : `${needsAttention.length} things need attention`}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {needsAttention.map((item) => (
              <span
                key={item.key}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-gold text-accent-gold text-xs font-semibold"
              >
                {item.label}
                <b className="tabular-nums">{item.count}</b>
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="enterprise-card p-5 border-l-4 border-accent-teal">
          <p className="text-sm font-bold text-foreground">Nothing needs attention.</p>
          <p className="text-xs text-muted-foreground mt-1">
            No adverts past deadline, no unwritten interviews, no expiring offers.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Tile
          label="Applications"
          state={countTile(overview, (o) => o.applications)}
          detail={
            overview ? `${overview.applicationsLast7Days} in the last 7 days` : undefined
          }
          onRetry={loadOverview}
        />
        <Tile
          label="Open adverts"
          state={countTile(overview, (o) => o.openAdverts)}
          detail={
            overview && overview.advertsPastDeadline > 0 ? (
              <span className="text-error">
                {overview.advertsPastDeadline} past deadline and still listed
              </span>
            ) : undefined
          }
          onRetry={loadOverview}
        />
        <Tile
          label="Unscreened"
          state={countTile(overview, (o) => o.unscreened)}
          detail="Nobody has looked at these yet"
          onRetry={loadOverview}
        />
        {/* Three answers, not one. "Not enough data" is a success — the request worked and the base
            is too thin to quote — so it carries no retry. */}
        <Tile
          label="Offer acceptance"
          state={acceptanceTile(overview)}
          suffix="%"
          detail={
            overview?.offerAcceptanceRate != null
              ? `${overview.offersAccepted} of ${overview.offersSettled} settled`
              : undefined
          }
          onRetry={loadOverview}
        />
      </div>

      {/* Where candidates end. Bars are candidates who REACHED a stage, not who sit there now —
          the distinction between a conversion rate and a snapshot. */}
      <div className="enterprise-card">
        <div className="flex items-baseline justify-between gap-3 px-5 py-4 border-b border-border">
          <h2 className="text-sm font-bold text-foreground">Where candidates end</h2>
          <span className="text-xs text-muted-foreground">Last 90 days, all adverts</span>
        </div>
        <div className="p-5">
          {!funnelAvailable(overview) ? (
            <div>
              <p className="text-sm font-bold text-error">Pipeline analytics unavailable.</p>
              <p className="text-xs text-muted-foreground mt-1">
                The figures above are unaffected — they come from a different source. Only the
                funnel depends on the pipeline analytics.
              </p>
            </div>
          ) : steps.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No stage transitions recorded in this period.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                {steps.map((step) => {
                  const widest = steps[0].reached || 1;
                  const share = Math.max(2, (step.reached / widest) * 100);
                  return (
                    <div key={step.stage} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-[150px] shrink-0 truncate">
                        {STAGE_LABELS[step.stage] ?? step.stage}
                      </span>
                      <div className="flex-1 h-6 bg-muted rounded-button overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-button"
                          style={{ width: `${share}%` }}
                        />
                      </div>
                      <span className="text-[0.8125rem] font-bold text-foreground w-[52px] text-right tabular-nums">
                        {step.reached}
                      </span>
                      <span className="text-[0.6875rem] text-muted-foreground w-[46px] text-right tabular-nums">
                        {/* Null rather than 0% where the previous stage was empty: you cannot
                            express a share of none. */}
                        {step.fromPrevious === null ? '—' : `${Math.round(step.fromPrevious)}%`}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Bars are candidates who reached a stage, not who sit there now.
                {loss && (
                  <>
                    {' '}
                    Largest loss:{' '}
                    <b className="font-semibold text-foreground">
                      {STAGE_LABELS[loss.fromStage] ?? loss.fromStage} &rarr;{' '}
                      {STAGE_LABELS[loss.toStage] ?? loss.toStage}
                    </b>{' '}
                    ({Math.round(loss.lostPercent)}% end there). The final step to Hired is excluded
                    — narrowing to a hire is selection, not leakage.
                  </>
                )}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Said plainly rather than drawn as empty panels. Three sections used to sit here —
          applications per vacancy, time to fill, and recent activity — reading data.timeToFill,
          data.applicationsPerVacancy and data.recentActivity off an endpoint that has never
          returned any of them. They have always rendered empty. */}
      <div className="enterprise-card p-5">
        <p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-muted-foreground/70">
          Not shown here
        </p>
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          <li>
            <b className="text-foreground">By department</b> — needs the department pipeline
            aggregate, which has no working implementation yet.
          </li>
          <li>
            <b className="text-foreground">Time to fill</b> and{' '}
            <b className="text-foreground">applications per vacancy</b> — no endpoint returns
            either. The panels that used to sit here read keys that were never on the response.
          </li>
          <li>
            <b className="text-foreground">Trend lines</b> — only applications has a genuine series
            behind it, and a trend line under a total is a drawing, not data.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default RecruiterDashboard;
