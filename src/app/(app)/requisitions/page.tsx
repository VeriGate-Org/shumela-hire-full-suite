'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import PageWrapper from '@/components/PageWrapper';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import { TableSkeleton } from '@/components/LoadingComponents';
import IdentityBand from '@/components/record/IdentityBand';
import DecisionBar, { PrimaryAction, SecondaryAction } from '@/components/record/DecisionBar';
import DistributionStrip from '@/components/record/DistributionStrip';
import FilterChips from '@/components/record/FilterChips';
import RequisitionForm from '@/components/RequisitionForm';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api-fetch';
import { formatSalaryRange } from '@/utils/currency';
import { RequisitionData, RequisitionStatus } from '@/types/workflow';
import {
  QUEUE_FILTERS,
  QUEUE_SORT,
  RequisitionSummary,
  byLongestWait,
  filterCount,
  isAwaiting,
  onYouCount,
  waitingDays,
  waitingOn,
} from './queue';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

const PAGE_SIZE = 20;

function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function RequisitionsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [requisitions, setRequisitions] = useState<RequisitionData[]>([]);
  const [summary, setSummary] = useState<RequisitionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [showNewRequisition, setShowNewRequisition] = useState(false);

  const filter = QUEUE_FILTERS.find((f) => f.key === activeFilter) ?? QUEUE_FILTERS[0];

  const loadRequisitions = useCallback(async (page: number, statuses: RequisitionStatus[]) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('size', String(PAGE_SIZE));
      // The server orders the whole queue by longest wait; the page is a slice of that order
      // rather than a re-sort of an arbitrary twenty rows.
      params.append('sort', QUEUE_SORT);
      // Every filter maps to at most one status, so the server does the filtering and the pager
      // reports a total that matches what is on screen.
      if (statuses.length === 1) params.append('status', statuses[0]);

      const response = await apiFetch(`/api/requisitions?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to load requisitions. Please try again.');

      const data = await response.json();
      const list = data.content ?? (Array.isArray(data) ? data : []);
      setRequisitions(list);
      setTotalPages(data.totalPages ?? 1);
      setTotalElements(data.totalElements ?? list.length);
    } catch (err) {
      setRequisitions([]);
      setTotalPages(0);
      setTotalElements(0);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Counts for the whole queue, separate from the page of records.
   *
   * A failure here leaves `summary` null, and every figure derived from it disappears rather than
   * falling back to a count of the loaded rows — which is the defect this endpoint exists to fix.
   */
  const loadSummary = useCallback(async () => {
    try {
      const response = await apiFetch('/api/requisitions/summary');
      setSummary(response.ok ? await response.json() : null);
    } catch {
      setSummary(null);
    }
  }, []);

  useEffect(() => {
    loadRequisitions(currentPage, filter.statuses);
  }, [currentPage, filter.statuses, loadRequisitions]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // The server already returns the queue in wait order. This keeps anything settled below
  // anything awaiting a decision, which status ordering alone does not express.
  const rows = useMemo(() => byLongestWait(requisitions), [requisitions]);

  const buckets = summary
    ? [
        { label: 'Draft', count: summary.countsByStatus[RequisitionStatus.DRAFT] ?? 0, detail: 'Not submitted' },
        {
          label: 'Awaiting HR',
          count: summary.countsByStatus[RequisitionStatus.PENDING_HR_APPROVAL] ?? 0,
          detail: 'A decision is owed',
          tone: 'warning' as const,
        },
        {
          label: 'Awaiting executive',
          count: summary.countsByStatus[RequisitionStatus.PENDING_EXECUTIVE_APPROVAL] ?? 0,
          detail: 'Above the delegation',
          tone: 'warning' as const,
        },
        {
          label: 'Approved',
          count: summary.countsByStatus[RequisitionStatus.APPROVED] ?? 0,
          detail: 'Cleared for advertising',
          tone: 'positive' as const,
        },
        {
          label: 'Rejected',
          count: summary.countsByStatus[RequisitionStatus.REJECTED] ?? 0,
          detail: 'Terminal',
          tone: 'critical' as const,
        },
      ]
    : [];

  // Null for a role that owns no approval stage — which reads as "omit", not "zero".
  const onYou = onYouCount(summary, user?.role);

  return (
    <PageWrapper title="Requisitions" subtitle="Headcount requests and their approval">
      <IdentityBand
        eyebrow="Approval queue"
        title="Requisitions"
        subtitle={
          summary
            ? `${summary.total} ${summary.total === 1 ? 'requisition' : 'requisitions'} across the organisation`
            : 'Counts unavailable'
        }
        figures={
          summary
            ? [
                { label: 'Awaiting a decision', value: summary.awaitingDecision },
                // Only for the roles that actually clear a stage. A figure nobody can act on is
                // one more number to read past.
                ...(onYou !== null
                  ? [{
                      label: 'On you',
                      value: onYou,
                      tone: (onYou > 0 ? 'warning' : undefined) as 'warning' | undefined,
                    }]
                  : []),
                ...(typeof summary.oldestWaitingDays === 'number'
                  ? [{
                      label: 'Oldest waiting',
                      value: `${summary.oldestWaitingDays} days`,
                      tone: (summary.oldestWaitingDays >= 14 ? 'critical' : 'warning') as 'critical' | 'warning',
                    }]
                  : []),
              ]
            : []
        }
      />

      {summary && summary.awaitingDecision > 0 && (
        <DecisionBar
          ask={
            onYou
              ? `${onYou} ${onYou === 1 ? 'requisition is' : 'requisitions are'} waiting on your approval.`
              : `${summary.awaitingDecision} ${
                  summary.awaitingDecision === 1 ? 'requisition is' : 'requisitions are'
                } waiting on a decision.`
          }
          why={
            typeof summary.oldestWaitingDays === 'number'
              ? `The longest has been waiting ${summary.oldestWaitingDays} ${
                  summary.oldestWaitingDays === 1 ? 'day' : 'days'
                }.`
              : undefined
          }
        >
          {summary.oldestWaitingId && (
            <Link href={`/requisitions/${summary.oldestWaitingId}`}>
              <PrimaryAction>Review the oldest</PrimaryAction>
            </Link>
          )}
          <SecondaryAction onClick={() => setShowNewRequisition(true)}>New requisition</SecondaryAction>
        </DecisionBar>
      )}

      {summary ? (
        <DistributionStrip
          buckets={buckets}
          footnote={
            <>
              Counts describe the <b className="font-bold text-foreground">whole queue</b>, not the loaded page.
            </>
          }
        />
      ) : (
        <p className="mt-3.5 rounded-card border border-dashed border-border bg-card px-5 py-4 text-[0.8125rem] text-muted-foreground">
          Queue totals are unavailable — the summary did not respond. The list below is still correct;
          the counts are simply not shown rather than being estimated from this page.
        </p>
      )}

      <section className="mt-3.5 overflow-hidden rounded-card border border-border bg-card shadow-[var(--shadow-sm)]">
        <FilterChips
          aria-label="Filter requisitions"
          chips={QUEUE_FILTERS.map((f) => ({
            key: f.key,
            label: f.label,
            count: filterCount(f, summary),
          }))}
          activeKey={activeFilter}
          onChange={(key) => {
            setActiveFilter(key);
            setCurrentPage(0);
          }}
          note={
            <>
              Sorted by <b className="font-bold text-foreground">longest waiting</b>
              {typeof summary?.medianDaysToApproval === 'number' && (
                <> · median {summary.medianDaysToApproval} days to approval</>
              )}
            </>
          }
        />

        {/*
          No search box.

          The old page had one, and it never worked: GET /api/requisitions accepts `status` and a
          Pageable and nothing else, and RequisitionDataRepository has no search method at all — so
          the `search` parameter it sent was silently discarded and the results came back
          unfiltered. Typing a job title appeared to do nothing, which reads as a broken page.

          Re-skinning that control would have shipped the same lie in better clothes. It comes back
          when the endpoint can answer it.
        */}

        {error ? (
          <div className="p-5">
            <ErrorState
              title="Failed to load requisitions"
              message={error}
              onRetry={() => loadRequisitions(currentPage, filter.statuses)}
            />
          </div>
        ) : loading && rows.length === 0 ? (
          <div className="p-5"><TableSkeleton /></div>
        ) : rows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={DocumentTextIcon}
              title="Nothing here"
              description={
                activeFilter === 'all'
                  ? 'No requisitions have been raised yet.'
                  : 'No requisitions match this filter.'
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-[0.8125rem]">
              <thead>
                <tr>
                  {['Requisition', 'Band ceiling', 'Waiting on', 'Waiting', 'Raised'].map((heading, i) => (
                    <th
                      key={heading}
                      scope="col"
                      className={`whitespace-nowrap border-b border-border bg-muted/40 px-4 py-2.5 text-[0.5625rem] font-extrabold uppercase tracking-[0.15em] text-muted-foreground ${
                        i >= 1 ? 'text-right' : 'text-left'
                      }`}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((requisition) => {
                  const waited = waitingDays(requisition.updatedAt);
                  const awaiting = isAwaiting(requisition.status);
                  const owedTo = waitingOn(requisition.status);
                  return (
                    <tr key={requisition.id} className="border-b border-border last:border-b-0 hover:bg-muted/40">
                      <td className="px-4 py-3">
                        <Link
                          href={`/requisitions/${requisition.id}`}
                          className="font-extrabold tracking-[-0.01em] text-foreground hover:text-primary"
                        >
                          {requisition.jobTitle}
                        </Link>
                        <p className="mt-0.5 text-[0.6875rem] text-muted-foreground">
                          {requisition.department}
                          {requisition.location ? ` · ${requisition.location}` : ''}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                        {requisition.salaryMax
                          ? formatSalaryRange(undefined, requisition.salaryMax, false)
                          : <span className="text-muted-foreground">Not recorded</span>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        {owedTo ? (
                          <span className="inline-block rounded-full border border-cta/45 bg-cta/15 px-2.5 py-1 text-[0.625rem] font-extrabold uppercase tracking-[0.06em] text-accent-gold">
                            {owedTo}
                          </span>
                        ) : (
                          <span className="inline-block rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[0.625rem] font-extrabold uppercase tracking-[0.06em] text-muted-foreground">
                            {requisition.status === RequisitionStatus.APPROVED
                              ? 'Approved'
                              : requisition.status === RequisitionStatus.REJECTED
                                ? 'Rejected'
                                : 'Draft'}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        {awaiting && typeof waited === 'number' ? (
                          <span
                            className={`font-extrabold tabular-nums ${
                              waited >= 14 ? 'text-error' : waited >= 7 ? 'text-accent-gold' : 'text-foreground'
                            }`}
                          >
                            {waited} {waited === 1 ? 'day' : 'days'}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {requisition.createdAt ? formatDate(requisition.createdAt) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border bg-muted/40 px-4 py-3 text-[0.6875rem] text-muted-foreground">
            <span>
              Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, totalElements)} of{' '}
              {totalElements}
            </span>
            <span className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="rounded-full border border-border px-3 py-1 font-extrabold disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className="rounded-full border border-border px-3 py-1 font-extrabold disabled:opacity-40"
              >
                Next
              </button>
            </span>
          </div>
        )}
      </section>

      {showNewRequisition && (
        <RequisitionForm
          variant="modal"
          onCancel={() => setShowNewRequisition(false)}
          onSuccess={() => {
            setShowNewRequisition(false);
            loadRequisitions(currentPage, filter.statuses);
            loadSummary();
            toast('Requisition created', 'success');
          }}
        />
      )}
    </PageWrapper>
  );
}
