'use client';

import React, { useState, useEffect, useMemo } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { engagementService, Recognition, LeaderboardEntry } from '@/services/engagementService';
import { StarIcon, SparklesIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

/* ------------------------------------------------------------------ */
/*  Helper: extract initials from a full name                         */
/* ------------------------------------------------------------------ */
function getInitials(name: string | undefined): string {
  if (!name) return '??';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/* ------------------------------------------------------------------ */
/*  Deterministic avatar colour from name                             */
/* ------------------------------------------------------------------ */
const AVATAR_COLORS = [
  'bg-[var(--accent-navy)] text-white',
  'bg-[var(--accent-pink)] text-white',
  'bg-[var(--accent-teal)] text-white',
  'bg-[var(--accent-gold)] text-white',
] as const;

function avatarColor(name: string | undefined): string {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/* ------------------------------------------------------------------ */
/*  Category badge colour map (design-system tokens)                  */
/* ------------------------------------------------------------------ */
const CATEGORY_STYLES: Record<string, string> = {
  TEAMWORK: 'bg-icon-bg-navy text-accent-navy',
  INNOVATION: 'bg-icon-bg-teal text-accent-teal',
  CUSTOMER_SERVICE: 'bg-surface-teal text-accent-teal border border-icon-bg-teal',
  LEADERSHIP: 'bg-icon-bg-gold text-accent-gold',
  GOING_ABOVE: 'bg-icon-bg-pink text-accent-pink',
  EXCELLENCE: 'bg-icon-bg-pink text-accent-pink',
  SERVICE: 'bg-surface-teal text-accent-teal border border-icon-bg-teal',
};

/* ------------------------------------------------------------------ */
/*  Category filter pill options                                      */
/* ------------------------------------------------------------------ */
const CATEGORY_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'TEAMWORK', label: 'Teamwork' },
  { key: 'INNOVATION', label: 'Innovation' },
  { key: 'LEADERSHIP', label: 'Leadership' },
  { key: 'GOING_ABOVE', label: 'Excellence' },
  { key: 'CUSTOMER_SERVICE', label: 'Service' },
];

/* ================================================================== */
/*  Page Component                                                    */
/* ================================================================== */
export default function RecognitionPage() {
  const [recognitions, setRecognitions] = useState<Recognition[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    loadData();
  }, [page]);

  async function loadData() {
    setLoading(true);
    try {
      const [recData, leaders] = await Promise.all([
        engagementService.getPublicRecognitions(page, 10),
        engagementService.getLeaderboard(10),
      ]);
      setRecognitions(Array.isArray(recData?.content) ? recData.content : []);
      setTotalPages(recData?.totalPages ?? 0);
      setLeaderboard(Array.isArray(leaders) ? leaders : []);
    } catch (error) {
      console.error('Failed to load recognition data:', error);
      setRecognitions([]);
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  }

  /* Derived: filtered list */
  const filteredRecognitions = useMemo(() => {
    if (activeCategory === 'all') return recognitions;
    return recognitions.filter((r) => r.category === activeCategory);
  }, [recognitions, activeCategory]);

  /* Derived: summary stats */
  const totalRecognitions = recognitions.length;
  const topRecipient = useMemo(() => {
    if (leaderboard.length === 0) return null;
    return leaderboard[0];
  }, [leaderboard]);
  const topCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    recognitions.forEach((r) => {
      const c = r.category || 'General';
      counts[c] = (counts[c] || 0) + 1;
    });
    let best = '';
    let bestCount = 0;
    Object.entries(counts).forEach(([cat, cnt]) => {
      if (cnt > bestCount) { best = cat; bestCount = cnt; }
    });
    return best ? best.replace(/_/g, ' ') : 'N/A';
  }, [recognitions]);

  /* ---------------------------------------------------------------- */
  /*  Skeleton loader (matches mock skeleton cards)                    */
  /* ---------------------------------------------------------------- */
  function SkeletonFeed() {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="enterprise-card p-5">
            {/* Header row */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
              <div className="h-3 w-24 rounded-full bg-muted animate-pulse" />
              <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
              <div className="h-3 w-24 rounded-full bg-muted animate-pulse" />
            </div>
            {/* Message block */}
            <div className="h-16 rounded-control bg-muted animate-pulse mb-4" />
            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="h-6 w-20 rounded-full bg-muted animate-pulse" />
              <div className="flex gap-2">
                <div className="h-7 w-14 rounded-full bg-muted animate-pulse" />
                <div className="h-7 w-14 rounded-full bg-muted animate-pulse" />
                <div className="h-7 w-14 rounded-full bg-muted animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  function SkeletonLeaderboard() {
    return (
      <div className="space-y-0 divide-y divide-border">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 py-2.5">
            <div className="w-7 h-7 rounded-full bg-muted animate-pulse" />
            <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-3/5 rounded-full bg-muted animate-pulse" />
              <div className="h-2.5 w-2/5 rounded-full bg-muted animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  function SkeletonStats() {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="enterprise-card p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-card bg-muted animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-6 w-16 rounded bg-muted animate-pulse" />
                <div className="h-3 w-24 rounded bg-muted animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                          */
  /* ---------------------------------------------------------------- */
  return (
    <PageWrapper
      title="Peer Recognition Wall"
      subtitle="Celebrate and recognise your colleagues"
      actions={
        <Link
          href="/engagement/recognition/give"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold uppercase tracking-wide rounded-full border-2 border-cta bg-cta text-cta-foreground hover:bg-cta-hover hover:border-cta-hover transition-all"
        >
          <StarIcon className="h-4 w-4" />
          Give Recognition
        </Link>
      }
    >
      <FeatureGate
        feature="RECOGNITION_REWARDS"
        fallback={
          <div className="enterprise-card p-8 text-center">
            <StarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-sm font-medium text-foreground mb-1">Feature not available</p>
            <p className="text-sm text-muted-foreground">
              Recognition &amp; Rewards requires an Enterprise plan.
            </p>
          </div>
        }
      >
        {/* ============ STATS BAR ============ */}
        {loading ? (
          <SkeletonStats />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {/* Total Recognitions */}
            <div className="enterprise-card p-5 hover:-translate-y-px transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-card bg-icon-bg-navy flex items-center justify-center shrink-0">
                  <StarIcon className="w-6 h-6 text-accent-navy" />
                </div>
                <div className="min-w-0">
                  <div className="text-[1.75rem] font-extrabold leading-tight text-foreground">
                    {totalRecognitions}
                  </div>
                  <div className="text-[0.8125rem] font-medium text-muted-foreground mt-0.5">
                    Total Recognitions
                  </div>
                </div>
              </div>
            </div>

            {/* This Month */}
            <div className="enterprise-card p-5 hover:-translate-y-px transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-card bg-icon-bg-teal flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-accent-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="text-[1.75rem] font-extrabold leading-tight text-foreground">
                    {totalRecognitions}
                  </div>
                  <div className="text-[0.8125rem] font-medium text-muted-foreground mt-0.5">
                    This Month
                  </div>
                </div>
              </div>
            </div>

            {/* Most Recognized */}
            <div className="enterprise-card p-5 hover:-translate-y-px transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-card bg-icon-bg-gold flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-accent-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="text-lg font-extrabold leading-tight text-foreground truncate">
                    {topRecipient?.employeeName ?? 'N/A'}
                  </div>
                  <div className="text-[0.8125rem] font-medium text-muted-foreground mt-0.5">
                    Most Recognized
                  </div>
                </div>
              </div>
            </div>

            {/* Top Category */}
            <div className="enterprise-card p-5 hover:-translate-y-px transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-card bg-icon-bg-pink flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-accent-pink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="text-lg font-extrabold leading-tight text-foreground capitalize truncate">
                    {topCategory}
                  </div>
                  <div className="text-[0.8125rem] font-medium text-muted-foreground mt-0.5">
                    Top Category
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============ CATEGORY FILTER PILLS ============ */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {CATEGORY_FILTERS.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-4 py-1.5 rounded-full text-[0.8125rem] font-semibold border-[1.5px] transition-all whitespace-nowrap ${
                activeCategory === cat.key
                  ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                  : 'bg-card border-border text-muted-foreground hover:border-primary hover:text-primary'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* ============ TWO-COLUMN LAYOUT ============ */}
        <div className="grid grid-cols-1 lg:grid-cols-[65fr_35fr] gap-6 items-start">
          {/* ---------- Feed Column ---------- */}
          <div className="space-y-4">
            {loading ? (
              <SkeletonFeed />
            ) : filteredRecognitions.length === 0 ? (
              <div className="enterprise-card p-12 text-center">
                <StarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-base font-semibold text-foreground mb-1">No recognitions found</h3>
                <p className="text-sm text-muted-foreground">
                  {activeCategory === 'all'
                    ? 'No recognitions yet. Be the first to recognise a colleague!'
                    : 'No recognitions in this category yet. Be the first to give one!'}
                </p>
              </div>
            ) : (
              <>
                {filteredRecognitions.map((rec) => (
                  <div
                    key={rec.id}
                    className="enterprise-card p-5 hover:-translate-y-px transition-all"
                  >
                    {/* Recognition Header: Giver -> Receiver + Timestamp */}
                    <div className="flex items-center flex-wrap gap-2 mb-3.5">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {/* Giver */}
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-[0.6875rem] font-bold shrink-0 ${avatarColor(rec.fromEmployeeName)}`}
                          >
                            {getInitials(rec.fromEmployeeName)}
                          </div>
                          <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                            {rec.fromEmployeeName || 'Unknown'}
                          </span>
                        </div>

                        {/* Arrow */}
                        <div className="text-muted-foreground shrink-0">
                          <svg
                            className="w-[18px] h-[18px]"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </div>

                        {/* Receiver */}
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-[0.6875rem] font-bold shrink-0 ${avatarColor(rec.toEmployeeName)}`}
                          >
                            {getInitials(rec.toEmployeeName)}
                          </div>
                          <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                            {rec.toEmployeeName || 'Unknown'}
                          </span>
                        </div>
                      </div>

                      {/* Timestamp */}
                      <span className="text-xs font-medium text-muted-foreground whitespace-nowrap ml-auto">
                        {rec.createdAt
                          ? new Date(rec.createdAt).toLocaleDateString()
                          : 'Unknown date'}
                      </span>
                    </div>

                    {/* Message */}
                    {rec.message && (
                      <div className="text-[0.9375rem] leading-relaxed text-foreground mb-3.5 px-4 py-3 bg-background rounded-control">
                        {rec.message}
                      </div>
                    )}

                    {/* Footer: Category Badge + Points */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-[0.02em] ${
                          CATEGORY_STYLES[rec.category] || 'bg-icon-bg-navy text-accent-navy'
                        }`}
                      >
                        <StarIcon className="w-3 h-3" />
                        {rec.category?.replace(/_/g, ' ') || 'General'}
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-[5px] rounded-full border-[1.5px] border-border bg-card text-[0.8125rem] font-semibold text-muted-foreground hover:border-primary hover:text-primary hover:bg-surface-navy transition-all cursor-default">
                          <SparklesIcon className="w-4 h-4" />
                          {rec.points} pts
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 pt-4">
                    <button
                      disabled={page === 0}
                      onClick={() => setPage((p) => p - 1)}
                      className="px-4 py-1.5 text-xs font-semibold rounded-full border-2 border-border text-muted-foreground disabled:opacity-50 hover:border-primary hover:text-primary transition-all"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 text-xs text-muted-foreground font-medium">
                      Page {page + 1} of {totalPages}
                    </span>
                    <button
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage((p) => p + 1)}
                      className="px-4 py-1.5 text-xs font-semibold rounded-full border-2 border-border text-muted-foreground disabled:opacity-50 hover:border-primary hover:text-primary transition-all"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ---------- Leaderboard Sidebar ---------- */}
          <div>
            <div className="enterprise-card p-5 sticky top-20">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <svg
                  className="w-[22px] h-[22px] text-cta-hover"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
                Leaderboard
              </h2>

              {loading ? (
                <SkeletonLeaderboard />
              ) : leaderboard.length === 0 ? (
                <p className="text-xs text-muted-foreground">No data yet</p>
              ) : (
                <ul className="list-none">
                  {leaderboard.map((entry, idx) => {
                    const rankClass =
                      idx === 0
                        ? 'bg-cta text-foreground'
                        : idx === 1
                          ? 'bg-border text-foreground'
                          : idx === 2
                            ? 'bg-icon-bg-gold text-accent-gold'
                            : 'bg-background text-muted-foreground';

                    return (
                      <li
                        key={entry.employeeId}
                        className="flex items-center gap-3 py-2.5 border-b border-border last:border-b-0 hover:bg-background hover:-mx-2 hover:px-2 hover:rounded-control transition-all"
                      >
                        {/* Rank */}
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 ${rankClass}`}
                        >
                          {idx + 1}
                        </div>

                        {/* Avatar */}
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-[0.6875rem] font-bold shrink-0 ${avatarColor(entry.employeeName)}`}
                        >
                          {getInitials(entry.employeeName)}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-foreground truncate">
                            {entry.employeeName}
                          </div>
                          <div className="text-xs text-muted-foreground font-medium">
                            {entry.totalPoints} points
                          </div>
                        </div>

                        {/* Trend indicator */}
                        <div className="shrink-0 text-accent-teal">
                          <svg
                            className="w-[18px] h-[18px]"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                            <polyline points="17 6 23 6 23 12" />
                          </svg>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </FeatureGate>
    </PageWrapper>
  );
}
