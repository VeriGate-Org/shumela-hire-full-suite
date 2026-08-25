'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PageWrapper from '@/components/PageWrapper';
import IdentityBand from '@/components/record/IdentityBand';
import DecisionBar, { PrimaryAction } from '@/components/record/DecisionBar';
import DistributionStrip from '@/components/record/DistributionStrip';
import FilterChips from '@/components/record/FilterChips';
import { apiFetch } from '@/lib/api-fetch';
import {
  COVERED_KINDS,
  KIND_LABEL,
  PendingApproval,
  PendingApprovalsResult,
  assignmentOf,
  daysLabel,
  daysWaiting,
  isPendingApprovalsResult,
  money,
  oldestWait,
  recordHref,
  unavailableNote,
} from '@/components/approvals/queue';

/**
 * One queue for every approval this product asks a person to make.
 *
 * <p><b>What this replaces.</b> {@code ApprovalCenter.tsx} is 488 lines and is mounted, at
 * {@code /workflow} under the Approvals tab. It is fed by {@code useState&lt;ApprovalRequest[]&gt;([])}
 * and the only three writes to that state are {@code prev =&gt; prev.map(...)} over an array that is
 * always empty. So it renders an empty approval queue permanently, on every tenant, and its
 * Approve, Reject and Comment handlers map over nothing. A dead screen that is reachable is worse
 * than no screen, because it looks like an answer.
 *
 * <p><b>Approving happens on the record.</b> Each row links to the requisition, advert or
 * recommendation rather than carrying its own approve button. Three mechanisms mean three payloads
 * and three permission rules, and a second approval path is a second thing to keep correct; sending
 * someone to the record means the audit trail is identical whichever screen they came from.
 *
 * <p><b>What it does not cover, it says.</b> Leave is never in this queue and offers are absent
 * until a user's approval level is recorded somewhere. Both are named on the page rather than
 * silently missing — a queue that is short by one source looks exactly like a quiet day.
 */

type FilterKey = 'all' | 'yours' | 'unconfirmed';

export default function ApprovalsPage() {
  const [result, setResult] = useState<PendingApprovalsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // No approvalLevel is sent because nothing on this client stores one: the User entity has no
      // such field. The server responds by naming offers as an unavailable source with its reason,
      // which is rendered below rather than swallowed.
      const response = await apiFetch('/api/approvals/pending');
      const payload = response.ok ? await response.json() : null;

      if (isPendingApprovalsResult(payload)) {
        setResult(payload);
        setFailed(false);
      } else {
        // An error body is an object too. Reading .items off it would render an empty queue that
        // looks like good news.
        setResult(null);
        setFailed(true);
      }
    } catch {
      setResult(null);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const items = useMemo(() => result?.items ?? [], [result]);

  const visible = useMemo(() => {
    if (filter === 'yours') return items.filter((item) => assignmentOf(item) === 'YOURS');
    if (filter === 'unconfirmed') return items.filter((item) => assignmentOf(item) === 'UNCONFIRMED');
    return items;
  }, [items, filter]);

  const oldest = useMemo(() => oldestWait(items), [items]);
  const unavailable = Object.entries(result?.unavailableSources ?? {});
  const held = money(result?.valueHeldUp ?? null);
  const yours = result?.assignedToYou ?? 0;

  const covered = COVERED_KINDS.map((kind) => KIND_LABEL[kind].toLowerCase()).join(', ');

  return (
    <PageWrapper>
      <div className="space-y-4">
        <IdentityBand
          eyebrow="Approvals"
          title="Waiting on you"
          subtitle={
            result
              ? `${result.total} ${result.total === 1 ? 'item' : 'items'} across ${covered}`
              : loading
                ? 'Loading the queue…'
                : 'The queue could not be read'
          }
          figures={
            result
              ? [
                  {
                    label: 'On you',
                    value: yours,
                    tone: (yours > 0 ? 'warning' : undefined) as 'warning' | undefined,
                  },
                  { label: 'Oldest', value: daysLabel(oldest) },
                  // Null is not zero. A queue holding nothing with a money figure attached is a
                  // different statement from one holding R 0.
                  { label: 'Value held up', value: held ?? 'Not reported' },
                ]
              : []
          }
        />

        {!loading && failed && (
          <DecisionBar
            ask="The approval queue could not be read."
            why="Nothing here is a count of zero — the request did not return a queue. Reload to try again."
            tone="stopped"
          >
            <PrimaryAction onClick={() => void load()}>Reload</PrimaryAction>
          </DecisionBar>
        )}

        {result && yours > 0 && (
          <DecisionBar
            ask={`${yours} ${yours === 1 ? 'approval is' : 'approvals are'} confirmed as yours.`}
            why={
              oldest !== null
                ? `The oldest has waited ${daysLabel(oldest).toLowerCase()}. Approving happens on the record, so the audit trail reads the same either way.`
                : 'Approving happens on the record, so the audit trail reads the same either way.'
            }
            tone="owed"
          >
            <PrimaryAction onClick={() => setFilter('yours')}>Show only mine</PrimaryAction>
          </DecisionBar>
        )}

        {result && yours === 0 && result.total > 0 && (
          <DecisionBar
            ask="Nothing here is confirmed as yours."
            why={`${result.total} ${result.total === 1 ? 'item is' : 'items are'} pending someone. Only offers can be matched to a person, and offers are not in this queue — so an item being yours cannot be established here.`}
            tone="owed"
          />
        )}

        {result && result.total === 0 && (
          <DecisionBar
            ask="Nothing is waiting for approval."
            why={`No requisitions, adverts or salary recommendations are pending.${
              unavailable.length > 0 ? ' Some sources could not be read — see below.' : ''
            }`}
            tone="settled"
          />
        )}

        {/*
          The partial-result notice. PendingApprovalsResult carries unavailableSources and isPartial
          precisely so a source that did not answer can be distinguished from a source with nothing
          in it, and no design accounted for it. Without this block the queue silently shrinks.
        */}
        {unavailable.length > 0 && (
          <section
            aria-label="Sources not included"
            className="enterprise-card border-l-4 border-l-accent-gold"
          >
            <div className="px-5 py-4">
              <h2 className="text-[0.8125rem] font-extrabold tracking-[-0.01em] text-foreground">
                {unavailable.length === 1
                  ? 'One approval source is not included'
                  : `${unavailable.length} approval sources are not included`}
              </h2>
              <ul className="mt-2 space-y-1.5">
                {unavailable.map(([source, reason]) => (
                  <li key={source} className="text-sm text-muted-foreground">
                    {unavailableNote(source, reason)}
                  </li>
                ))}
                <li className="text-sm text-muted-foreground">
                  Leave: approvals are per-manager and are handled on the leave screen.
                </li>
              </ul>
              <p className="mt-2.5 text-xs text-muted-foreground">
                The counts above exclude these. They are listed so a short queue is not read as a
                quiet day.
              </p>
            </div>
          </section>
        )}

        {result && result.total > 0 && (
          <DistributionStrip
            buckets={COVERED_KINDS.filter((kind) => (result.countsByKind[kind] ?? 0) > 0).map(
              (kind) => ({
                label: KIND_LABEL[kind],
                count: result.countsByKind[kind] ?? 0,
              }),
            )}
            footnote="Three approval mechanisms, one queue, ordered by how long each item has waited."
          />
        )}

        {result && result.total > 0 && (
          <FilterChips
            aria-label="Filter approvals"
            chips={[
              { key: 'all', label: 'Everything pending', count: result.total },
              { key: 'yours', label: 'Confirmed as yours', count: yours },
              {
                key: 'unconfirmed',
                label: 'Pending someone',
                count: result.total - yours,
              },
            ]}
            activeKey={filter}
            onChange={(key) => setFilter(key as FilterKey)}
          />
        )}

        <div className="enterprise-card">
          <div className="flex items-baseline justify-between gap-3 px-5 py-4 border-b border-border flex-wrap">
            <h2 className="text-[0.8125rem] font-extrabold tracking-[-0.01em] text-foreground">
              Longest waiting first
            </h2>
            <span className="text-xs text-muted-foreground">
              {visible.length > 0
                ? `${visible.length} shown`
                : loading
                  ? 'Loading…'
                  : 'Nothing to show'}
            </span>
          </div>

          {visible.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">
              {loading
                ? 'Loading…'
                : failed
                  ? 'The queue could not be read.'
                  : filter === 'all'
                    ? 'Nothing is pending approval.'
                    : 'Nothing matches this filter.'}
            </p>
          ) : (
            <ul>
              {visible.map((item) => (
                <ApprovalRow key={`${item.kind}-${item.id}`} item={item} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}

/**
 * One pending approval.
 *
 * <p>The column that makes five kinds comparable is <em>what you are authorising</em>: a band
 * ceiling, a package, an amount, or a publication with no money attached. That is what lets a
 * nineteen-day requisition and a two-day advert be ranked against each other.
 */
function ApprovalRow({ item }: { item: PendingApproval }) {
  const href = recordHref(item);
  const days = daysWaiting(item.waitingSince);
  const stake = money(item.stakeAmount);
  const mine = assignmentOf(item) === 'YOURS';

  const body = (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div className="min-w-0 flex-1">
        <div className="font-bold text-sm text-foreground truncate">
          {item.title || 'Not titled'}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {item.subtitle || 'No reference recorded'}
          {item.raisedBy ? ` · raised by ${item.raisedBy}` : ''}
        </div>
      </div>

      <div className="shrink-0 text-right">
        <div className="text-[0.5625rem] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
          {KIND_LABEL[item.kind] ?? item.kind}
        </div>
        <div className="text-sm font-bold text-foreground tabular-nums mt-0.5">
          {stake ?? 'No amount'}
        </div>
        {item.stakeLabel && (
          <div className="text-xs text-muted-foreground">{item.stakeLabel}</div>
        )}
      </div>

      <div className="shrink-0 text-right min-w-[7rem]">
        <div className="text-[0.5625rem] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
          {/*
            Only offers can confirm an item is yours — that source filters by approval level. The
            rest can report only that something is pending someone, and saying so is the point.
          */}
          {mine ? 'Yours' : 'Pending someone'}
        </div>
        <div className="text-sm font-bold text-foreground tabular-nums mt-0.5">
          {daysLabel(days)}
        </div>
        <div className="text-xs text-muted-foreground">waiting</div>
      </div>
    </div>
  );

  return (
    <li className="border-t border-border first:border-t-0">
      {href ? (
        <a
          href={href}
          className="block px-5 py-3.5 hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary transition-colors"
        >
          {body}
        </a>
      ) : (
        <div className="px-5 py-3.5">{body}</div>
      )}
    </li>
  );
}
