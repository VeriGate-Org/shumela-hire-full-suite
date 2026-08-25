'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PageWrapper from '@/components/PageWrapper';
import IdentityBand from '@/components/record/IdentityBand';
import { useToast } from '@/components/Toast';
import { apiFetchJson } from '@/lib/api-fetch';
import { useAuth } from '@/contexts/AuthContext';
import SearchableDropdown from '@/components/SearchableDropdown';
import type { DropdownOption } from '@/components/SearchableDropdown';
import { useDepartments } from '@/hooks/useDepartments';
import { useSkills } from '@/hooks/useSkills';
import AiAssistPanel from '@/components/ai/AiAssistPanel';
import AiSmartSearch from '@/components/ai/AiSmartSearch';
import DistributionStrip from '@/components/record/DistributionStrip';
import FilterChips from '@/components/record/FilterChips';
import {
  AVAILABILITY_NOT_TRACKED,
  POOL_FILTERS,
  PoolRow,
  PoolSummary,
  byOldestMedian,
  filterCount,
  isPoolSummary,
  matchesFilter,
  medianAgeLabel,
  oldestEntryLabel,
  sourceSummary,
  stateOf,
  STATE_LABELS,
} from './library';

// ─── Types ────────────────────────────────────────────────────────────────────

// The pool shape now comes from library.ts, which mirrors TalentPoolResponse. The endpoint used to
// return the raw entity, so entryCount was declared here, guarded against the undefined it always
// was, and the "N candidates" line never once rendered.
type TalentPool = PoolRow & { id: number | string };

interface TalentPoolEntry {
  id: number;
  poolId: number;
  applicant?: { id: number; name?: string; surname?: string; fullName?: string };
  applicantId?: number;
  applicantName?: string;
  sourceType: 'MANUAL' | 'AUTO_REJECTED' | 'AGENCY';
  notes?: string;
  rating?: number;
  // isAvailable is deliberately absent. It exists on TalentPoolEntry, defaults to true, and the
  // only code that touches it is the DynamoDB mapper reading and writing its own copy — no service
  // sets it false, ever. The page rendered it as an "Available" / "Unavailable" badge, so it told
  // recruiters that every person in every pool was available, including anyone hired two years ago.
  addedAt: string;
}

interface PoolAnalytics {
  totalEntries: number;
  activeEntries: number;
  averageRating?: number;
  // The server puts this under `bySource`; `sourceBreakdown` was never a field it sent.
  bySource?: Record<string, number>;
}

type ModalType = null | 'createPool' | 'editPool' | 'addEntry' | 'removeEntry';

// ─── Star Rating Component ─────────────────────────────────────────────────

function StarRating({
  value,
  onChange,
  disabled,
}: {
  value?: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const display = hovered ?? value ?? 0;

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(null)}
          className={`text-lg leading-none transition-colors ${
            disabled ? 'cursor-default' : 'cursor-pointer'
          } ${star <= display ? 'text-gold-500' : 'text-gray-300'}`}
          aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

/** Only the fields this page needs; the applicants endpoint returns considerably more. */
interface Applicantish {
  id?: string;
  name?: string;
  surname?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export default function TalentPoolsPage() {
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  // Must match TalentPoolController, which permits ADMIN, HR_MANAGER, RECRUITER and
  // HIRING_MANAGER on all nine endpoints. HIRING_MANAGER was missing here, so the client blocked
  // a role the API allows — the TA Manager could not open talent pools at all.
  const hasAccess = user?.role === 'ADMIN' || user?.role === 'HR_MANAGER'
    || user?.role === 'RECRUITER' || user?.role === 'HIRING_MANAGER';

  // Department & Skills data
  const { departments, loading: deptLoading } = useDepartments();
  const { skills, loading: skillsLoading } = useSkills();

  const departmentOptions: DropdownOption[] = useMemo(
    () => departments.map((d) => ({ value: d, label: d })),
    [departments],
  );

  const skillsOptions: DropdownOption[] = useMemo(
    () => skills.map((s) => ({ value: s, label: s })),
    [skills],
  );

  // Pool list state
  const [pools, setPools] = useState<TalentPool[]>([]);
  const [poolsLoading, setPoolsLoading] = useState(true);
  const [poolSearch, setPoolSearch] = useState('');
  const [selectedPool, setSelectedPool] = useState<TalentPool | null>(null);

  // Detail state
  const [entries, setEntries] = useState<TalentPoolEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [analytics, setAnalytics] = useState<PoolAnalytics | null>(null);

  // Modal state
  const [modal, setModal] = useState<ModalType>(null);
  const [editingPool, setEditingPool] = useState<TalentPool | null>(null);
  const [removingEntry, setRemovingEntry] = useState<TalentPoolEntry | null>(null);
  const [ratingLoading, setRatingLoading] = useState<number | null>(null);

  // ── Pool form state
  const [poolForm, setPoolForm] = useState({
    poolName: '',
    description: '',
    department: '',
    skillsCriteria: '',
    experienceLevel: '',
    isActive: true,
    autoAddEnabled: false,
  });

  // ── Add entry form state
  // Candidates to choose from. Loaded when the Add Candidate modal opens rather than on page
  // load — the pool screen is otherwise about pools, and this is a modal-only concern.
  const [applicantOptions, setApplicantOptions] = useState<DropdownOption[]>([]);
  const [applicantsLoading, setApplicantsLoading] = useState(false);

  const [entryForm, setEntryForm] = useState({
    applicantId: '',
    sourceType: 'MANUAL' as 'MANUAL' | 'AUTO_REJECTED' | 'AGENCY',
    notes: '',
  });

  // ── Remove entry form state
  const [removeReason, setRemoveReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Counts across every pool, from GET /api/talent-pools/summary.
  const [summary, setSummary] = useState<PoolSummary | null>(null);
  const [poolFilter, setPoolFilter] = useState('all');

  // ─── Data Loading ──────────────────────────────────────────────────────────

  const loadPools = useCallback(async () => {
    try {
      setPoolsLoading(true);
      const data = await apiFetchJson<TalentPool[] | { content: TalentPool[] }>('/api/talent-pools');
      setPools(Array.isArray(data) ? data : data.content ?? []);
    } catch {
      toast('Failed to load talent pools', 'error');
    } finally {
      setPoolsLoading(false);
    }

    // Counts across every pool. A separate call so the figures describe all of them rather than
    // the ones rendered — and guarded, because an error body is an object too and reading .stale
    // off it would render a strip of zeroes that looks like a healthy library.
    try {
      const payload = await apiFetchJson<unknown>('/api/talent-pools/summary');
      setSummary(isPoolSummary(payload) ? payload : null);
    } catch {
      setSummary(null);
    }
  }, [toast]);

  const loadPoolDetail = useCallback(
    async (pool: TalentPool) => {
      setEntriesLoading(true);
      setEntries([]);
      setAnalytics(null);
      try {
        const [entriesData, analyticsData] = await Promise.all([
          apiFetchJson<TalentPoolEntry[] | { content: TalentPoolEntry[] }>(`/api/talent-pools/${pool.id}/entries`),
          apiFetchJson<PoolAnalytics>(`/api/talent-pools/${pool.id}/analytics`),
        ]);
        setEntries(Array.isArray(entriesData) ? entriesData : entriesData.content ?? []);
        setAnalytics(analyticsData);
      } catch {
        toast('Failed to load pool details', 'error');
      } finally {
        setEntriesLoading(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    loadPools();
  }, [loadPools]);

  // Populate the candidate picker when the Add Candidate modal opens. Previously this modal asked
  // the recruiter to TYPE an applicant id into a number field — which a UUID cannot even be entered
  // into — so there was no route to adding anyone.
  useEffect(() => {
    if (modal !== 'addEntry') return;
    let cancelled = false;

    (async () => {
      try {
        setApplicantsLoading(true);
        const data = await apiFetchJson<{ content?: Applicantish[] } | Applicantish[]>(
          '/api/applicants?size=200',
        );
        const rows = Array.isArray(data) ? data : data.content ?? [];
        if (cancelled) return;
        setApplicantOptions(
          rows
            .filter((a) => a.id)
            .map((a) => {
              const name = [a.name ?? a.firstName, a.surname ?? a.lastName]
                .filter(Boolean)
                .join(' ')
                .trim();
              return {
                value: String(a.id),
                label: name || a.email || String(a.id),
                description: name && a.email ? a.email : undefined,
              };
            }),
        );
      } catch {
        if (!cancelled) {
          setApplicantOptions([]);
          toast('Could not load candidates', 'error');
        }
      } finally {
        if (!cancelled) setApplicantsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [modal, toast]);

  const handleSelectPool = (pool: TalentPool) => {
    setSelectedPool(pool);
    loadPoolDetail(pool);
  };

  // ─── Pool CRUD ─────────────────────────────────────────────────────────────

  const openCreatePool = () => {
    setEditingPool(null);
    setPoolForm({
      poolName: '',
      description: '',
      department: '',
      skillsCriteria: '',
      experienceLevel: '',
      isActive: true,
      autoAddEnabled: false,
    });
    setModal('createPool');
  };

  const openEditPool = (pool: TalentPool) => {
    setEditingPool(pool);
    setPoolForm({
      poolName: pool.poolName,
      description: pool.description ?? '',
      department: pool.department ?? '',
      skillsCriteria: pool.skillsCriteria ?? '',
      experienceLevel: pool.experienceLevel ?? '',
      // Both are nullable on the record. The edit form is a checkbox, so absence has to resolve to
      // something — active defaults to true (the column's own default; reading absence as "switched
      // off" would silently deactivate a live pool on save) and auto-add defaults to false (adding
      // people automatically is a decision somebody makes, never one inferred from a missing flag).
      isActive: pool.isActive !== false,
      autoAddEnabled: pool.autoAddEnabled === true,
    });
    setModal('editPool');
  };

  const handleSavePool = async () => {
    if (!poolForm.poolName.trim()) {
      toast('Pool name is required', 'error');
      return;
    }
    try {
      setActionLoading(true);
      if (modal === 'editPool' && editingPool) {
        await apiFetchJson(`/api/talent-pools/${editingPool.id}`, {
          method: 'PUT',
          body: JSON.stringify(poolForm),
        });
        toast('Pool updated successfully', 'success');
      } else {
        await apiFetchJson('/api/talent-pools', {
          method: 'POST',
          body: JSON.stringify(poolForm),
        });
        toast('Pool created successfully', 'success');
      }
      setModal(null);
      await loadPools();
    } catch {
      toast('Failed to save pool', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Entry CRUD ────────────────────────────────────────────────────────────

  const handleAddEntry = async () => {
    if (!selectedPool || !entryForm.applicantId.trim()) {
      toast('Applicant ID is required', 'error');
      return;
    }
    try {
      setActionLoading(true);
      await apiFetchJson(`/api/talent-pools/${selectedPool.id}/entries`, {
        method: 'POST',
        body: JSON.stringify({
          // applicantId is a UUID string. Number() made it NaN, which serialises to null,
          // so the backend received no applicant at all.
          applicantId: entryForm.applicantId,
          sourceType: entryForm.sourceType,
          notes: entryForm.notes || undefined,
        }),
      });
      toast('Entry added successfully', 'success');
      setModal(null);
      setEntryForm({ applicantId: '', sourceType: 'MANUAL', notes: '' });
      await loadPoolDetail(selectedPool);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast(`Failed to add entry (${message})`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const openRemoveEntry = (entry: TalentPoolEntry) => {
    setRemovingEntry(entry);
    setRemoveReason('');
    setModal('removeEntry');
  };

  const handleRemoveEntry = async () => {
    if (!removingEntry || !selectedPool) return;
    try {
      setActionLoading(true);
      const query = removeReason.trim() ? `?reason=${encodeURIComponent(removeReason)}` : '';
      await apiFetchJson(`/api/talent-pools/entries/${removingEntry.id}${query}`, {
        method: 'DELETE',
      });
      toast('Entry removed', 'success');
      setModal(null);
      setRemovingEntry(null);
      await loadPoolDetail(selectedPool);
    } catch {
      toast('Failed to remove entry', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateRating = async (entry: TalentPoolEntry, rating: number) => {
    if (!selectedPool) return;
    try {
      setRatingLoading(entry.id);
      await apiFetchJson(`/api/talent-pools/entries/${entry.id}/rating`, {
        method: 'PUT',
        body: JSON.stringify({ rating }),
      });
      setEntries((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, rating } : e)),
      );
    } catch {
      toast('Failed to update rating', 'error');
    } finally {
      setRatingLoading(null);
    }
  };

  // ─── Derived values ────────────────────────────────────────────────────────

  // Stalest first — that is the order they are worth reviewing in, and freshness is the whole
  // question. The list used to arrive in whatever order the table scan returned.
  const filteredPools = byOldestMedian(
    pools.filter(
      (p) =>
        (p.poolName.toLowerCase().includes(poolSearch.toLowerCase()) ||
          (p.department ?? '').toLowerCase().includes(poolSearch.toLowerCase())) &&
        matchesFilter(poolFilter, p),
    ),
  );

  const sourceLabel: Record<string, string> = {
    MANUAL: 'Manual',
    AUTO_REJECTED: 'Auto-Rejected',
    AGENCY: 'Agency',
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <PageWrapper>
        <IdentityBand eyebrow="Candidate pools" title="Talent Pools" subtitle="Loading…" />
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold-500" />
        </div>
      </PageWrapper>
    );
  }

  if (!hasAccess) {
    return (
      <PageWrapper>
        <IdentityBand eyebrow="Candidate pools" title="Talent Pools" subtitle="You do not have permission to manage talent pools." />
        <div className="bg-white rounded-[10px] border border-gray-200 p-8 text-center">
          <p className="text-gray-500 text-sm">
            Talent pools can be managed by administrators, HR managers, recruiters and hiring managers.
          </p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      {/* Page header, not a record component under one — see #285. The strip below covers pool
          state (growing, stale, auto-adding); these figures cover the people held in them. */}
      <IdentityBand
        eyebrow="Candidate pools"
        title="Talent Pools"
        subtitle={
          summary
            ? `${summary.pools} ${summary.pools === 1 ? 'pool' : 'pools'} · ${summary.entriesHeld} ${summary.entriesHeld === 1 ? 'candidate' : 'candidates'} held`
            : 'Counts unavailable'
        }
        figures={
          summary
            ? [
                ...(summary.inactive > 0
                  ? [{
                      label: 'Inactive pools',
                      value: summary.inactive,
                      tone: 'warning' as const,
                    }]
                  : []),
                // A pool's value is its freshness. Omitted rather than zeroed when there is
                // nothing in any pool to measure.
                ...(typeof summary.oldestMedianDays === 'number'
                  ? [{
                      label: 'Oldest pool median age',
                      value: `${summary.oldestMedianDays} days`,
                      tone: (summary.oldestMedianDays >= 365 ? 'critical' : undefined) as 'critical' | undefined,
                    }]
                  : []),
              ]
            : []
        }
        actions={
          <button
            onClick={openCreatePool}
            className="px-4 py-2 text-sm bg-gold-500 text-violet-950 rounded-full hover:bg-gold-600 font-medium"
          >
            + New Pool
          </button>
        }
      />
      {/* Talent pools are where you go hunting for someone who already applied, so
          natural-language search belongs here more than anywhere. The pool search box
          below is a literal filter on pool NAMES — a different thing entirely. */}
      <div className="mb-6">
        <AiAssistPanel
          title="AI Smart Search"
          feature="AI_SEARCH"
          description="Find candidates across your pools by describing what you need, in plain language"
        >
          <AiSmartSearch />
        </AiAssistPanel>
      </div>

      {/* Where the pools actually stand. Every figure is about pools except the last, which says
          so — a pool's value is its freshness, and none of this was ever on the wire. */}
      {summary && (
        <div className="mb-6">
          <DistributionStrip
            buckets={[
              {
                label: 'Growing unattended',
                count: summary.growingUnattended,
                detail: 'Auto-adding into a year-old shortlist',
                tone: summary.growingUnattended > 0 ? 'critical' : 'default',
              },
              {
                label: 'Stale',
                count: summary.stale,
                detail: 'Median entry over a year old',
                tone: summary.stale > 0 ? 'warning' : 'default',
              },
              {
                label: 'Auto-adding',
                count: summary.autoAdding,
                detail: 'Grows on every rejection',
              },
              {
                label: 'Switched off',
                count: summary.inactive,
                detail: 'Not accumulating, still holding people',
              },
            ]}
            footnote={
              <>
                Across <b className="font-bold text-foreground">{summary.pools}</b> pools holding{' '}
                <b className="font-bold text-foreground">{summary.entriesHeld}</b> entries — entries
                rather than people, because somebody in three pools is counted three times.
                {summary.oldestMedianDays != null && (
                  <>
                    {' '}
                    The stalest pool&rsquo;s median entry is{' '}
                    <b className="font-bold text-foreground">
                      {medianAgeLabel({
                        id: '',
                        poolName: '',
                        medianEntryAgeDays: summary.oldestMedianDays,
                      })}
                    </b>{' '}
                    old.
                  </>
                )}
              </>
            }
          />
        </div>
      )}

      <div className="flex gap-6 h-full min-h-0">
        {/* ── Left panel: Pool list ── */}
        <div className="w-1/3 flex flex-col gap-3 min-w-0">
          {/* Search */}
          <input
            type="text"
            value={poolSearch}
            onChange={(e) => setPoolSearch(e.target.value)}
            placeholder="Search pools..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-gold-400"
          />

          <FilterChips
            chips={POOL_FILTERS.map((filter) => ({
              key: filter.key,
              label: filter.label,
              count: filterCount(summary, filter.key) ?? undefined,
            }))}
            activeKey={poolFilter}
            onChange={setPoolFilter}
            aria-label="Filter pools by state"
            note={<>Stalest first</>}
          />

          {/* List */}
          {poolsLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold-500" />
            </div>
          ) : filteredPools.length === 0 ? (
            <div className="bg-white rounded-[10px] border border-gray-200 p-8 text-center">
              <p className="text-gray-400 text-sm">
                {poolSearch ? 'No pools match your search.' : 'No talent pools yet. Create one to get started.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto">
              {filteredPools.map((pool) => {
                const poolState = stateOf(pool);
                const medianLabel = medianAgeLabel(pool);
                const sources = sourceSummary(pool);
                const oldest = oldestEntryLabel(pool);

                return (
                <button
                  key={pool.id}
                  onClick={() => handleSelectPool(pool)}
                  className={`w-full text-left bg-white rounded-[10px] border p-4 transition-all hover:shadow-sm ${
                    selectedPool?.id === pool.id
                      ? 'border-gold-400 bg-gold-50/50 shadow-sm'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-gray-900 truncate">{pool.poolName}</p>
                      {pool.department && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{pool.department}</p>
                      )}
                    </div>
                    {/* The state says what the pool IS, not merely whether a flag is set. A pool
                        that is auto-adding into a year-old shortlist read "Active" before. */}
                    <span
                      className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        poolState === 'growing-unattended'
                          ? 'bg-red-100 text-red-700'
                          : poolState === 'stale'
                            ? 'bg-amber-100 text-amber-800'
                            : poolState === 'inactive'
                              ? 'bg-gray-100 text-gray-500'
                              : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {STATE_LABELS[poolState]}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-xs font-semibold text-gray-700 tabular-nums">
                      {pool.entryCount ?? 0} held
                    </span>
                    {medianLabel ? (
                      <span className="text-xs text-gray-500">
                        median entry <b className="font-semibold text-gray-700">{medianLabel}</b>
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">no entries yet</span>
                    )}
                  </div>
                  {sources && <p className="text-xs text-gray-400 mt-1">{sources}</p>}
                  {oldest && poolState !== 'empty' && (
                    <p className="text-xs text-gray-400 mt-0.5">Oldest {oldest}</p>
                  )}
                </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Right panel: Pool detail ── */}
        <div className="flex-1 min-w-0">
          {!selectedPool ? (
            <div className="bg-white rounded-[10px] border border-gray-200 h-64 flex items-center justify-center">
              <div className="text-center">
                <p className="text-4xl mb-3">🎯</p>
                <p className="text-gray-500 text-sm">Select a talent pool to view details</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header */}
              <div className="bg-white rounded-[10px] border border-gray-200 p-4 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-semibold text-gray-900">{selectedPool.poolName}</h2>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedPool.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {selectedPool.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {selectedPool.description && (
                    <p className="text-sm text-gray-500">{selectedPool.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                    {selectedPool.department && <span>Dept: {selectedPool.department}</span>}
                    {selectedPool.experienceLevel && <span>Level: {selectedPool.experienceLevel}</span>}
                    {selectedPool.autoAddEnabled && (
                      <span className="text-blue-600">Auto-add enabled</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => openEditPool(selectedPool)}
                  className="shrink-0 px-3 py-1.5 text-xs border border-gray-300 rounded-full hover:bg-gray-50"
                >
                  Edit Pool
                </button>
              </div>

              {/* Analytics summary */}
              {analytics && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-[10px] border border-gray-200 p-4">
                    <p className="text-xs text-gray-500 mb-1">Total Candidates</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.totalEntries ?? 0}</p>
                  </div>
                  <div className="bg-white rounded-[10px] border border-gray-200 p-4">
                    {/* activeEntries counts entries that have not been REMOVED from the pool. It
                        was labelled "Available", which is a claim about the candidate rather than
                        about the entry, and nothing in the product records that. */}
                    <p className="text-xs text-gray-500 mb-1">Still held</p>
                    <p className="text-2xl font-bold text-green-700">{analytics.activeEntries ?? 0}</p>
                  </div>
                  <div className="bg-white rounded-[10px] border border-gray-200 p-4">
                    <p className="text-xs text-gray-500 mb-1">Avg Rating</p>
                    <p className="text-2xl font-bold text-gold-600">
                      {analytics.averageRating != null
                        ? analytics.averageRating.toFixed(1)
                        : '—'}
                    </p>
                  </div>
                </div>
              )}

              {/* Entries */}
              <div className="bg-white rounded-[10px] border border-gray-200">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700">Candidates</h3>
                  <button
                    onClick={() => {
                      setEntryForm({ applicantId: '', sourceType: 'MANUAL', notes: '' });
                      setModal('addEntry');
                    }}
                    className="px-3 py-1.5 text-xs bg-gold-500 text-violet-950 rounded-full hover:bg-gold-600 font-medium"
                  >
                    + Add Entry
                  </button>
                </div>

                {entriesLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold-500" />
                  </div>
                ) : entries.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-400 text-sm">No candidates in this pool yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Candidate
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Source
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Rating
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Added
                          </th>
                          <th className="px-4 py-3" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {entries.map((entry) => (
                          <tr key={entry.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {entry.applicant?.fullName ?? entry.applicantName ?? `Applicant #${entry.applicant?.id ?? entry.applicantId ?? entry.id}`}
                                </p>
                                {entry.notes && (
                                  <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[160px]">
                                    {entry.notes}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                {sourceLabel[entry.sourceType] ?? entry.sourceType}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <StarRating
                                value={entry.rating}
                                onChange={(r) => handleUpdateRating(entry, r)}
                                disabled={ratingLoading === entry.id}
                              />
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-400">
                              {new Date(entry.addedAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => openRemoveEntry(entry)}
                                className="text-xs text-red-500 hover:text-red-700 hover:underline"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {/* Said in the table's own voice, because the column that used to sit here
                        claimed the opposite of the truth. */}
                    <p className="px-4 py-3 text-xs text-gray-400 border-t border-gray-100">
                      {AVAILABILITY_NOT_TRACKED}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Create / Edit Pool Modal ── */}
      {(modal === 'createPool' || modal === 'editPool') && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[10px] shadow-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {modal === 'editPool' ? 'Edit Pool' : 'Create Talent Pool'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pool Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={poolForm.poolName}
                  onChange={(e) => setPoolForm((f) => ({ ...f, poolName: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-control focus:outline-none focus:ring-2 focus:ring-gold-400"
                  placeholder="e.g. Senior Engineers"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={poolForm.description}
                  onChange={(e) => setPoolForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-control focus:outline-none focus:ring-2 focus:ring-gold-400"
                  rows={2}
                  placeholder="Brief description of this pool..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SearchableDropdown
                  label="Department"
                  options={departmentOptions}
                  value={poolForm.department ? [poolForm.department] : []}
                  onChange={(vals) => setPoolForm((f) => ({ ...f, department: vals[0] ?? '' }))}
                  multi={false}
                  loading={deptLoading}
                  placeholder="Select department"
                  searchPlaceholder="Search departments..."
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
                  <select
                    value={poolForm.experienceLevel}
                    onChange={(e) => setPoolForm((f) => ({ ...f, experienceLevel: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-control focus:outline-none focus:ring-2 focus:ring-gold-400"
                  >
                    <option value="">Select level</option>
                    <option value="Intern">Intern</option>
                    <option value="Junior">Junior</option>
                    <option value="Mid-Level">Mid-Level</option>
                    <option value="Senior">Senior</option>
                    <option value="Lead">Lead</option>
                    <option value="Principal">Principal</option>
                    <option value="Manager">Manager</option>
                    <option value="Director">Director</option>
                    <option value="Executive">Executive</option>
                  </select>
                </div>
              </div>
              <SearchableDropdown
                label="Skills Criteria"
                options={skillsOptions}
                value={poolForm.skillsCriteria ? poolForm.skillsCriteria.split(',').map((s) => s.trim()).filter(Boolean) : []}
                onChange={(vals) => setPoolForm((f) => ({ ...f, skillsCriteria: vals.join(', ') }))}
                multi={true}
                loading={skillsLoading}
                placeholder="Select skills..."
                searchPlaceholder="Search skills..."
              />
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={poolForm.isActive}
                    onChange={(e) => setPoolForm((f) => ({ ...f, isActive: e.target.checked }))}
                    className="rounded"
                  />
                  Active
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={poolForm.autoAddEnabled}
                    onChange={(e) => setPoolForm((f) => ({ ...f, autoAddEnabled: e.target.checked }))}
                    className="rounded"
                  />
                  Auto-add enabled
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setModal(null)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePool}
                disabled={actionLoading}
                className="px-4 py-2 text-sm bg-gold-500 text-violet-950 rounded-full hover:bg-gold-600 disabled:opacity-50 font-medium"
              >
                {actionLoading ? 'Saving...' : modal === 'editPool' ? 'Save Changes' : 'Create Pool'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Entry Modal ── */}
      {modal === 'addEntry' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[10px] shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Candidate to Pool</h3>
            <div className="space-y-4">
              <div>
                {/* Was a `type="number"` box asking the recruiter to type an applicant id. Ids are
                    UUIDs, which cannot be entered into a number field at all — so the modal could
                    not be used even by someone who knew the id. */}
                <SearchableDropdown
                  label="Candidate"
                  required
                  options={applicantOptions}
                  value={entryForm.applicantId ? [entryForm.applicantId] : []}
                  onChange={(vals) =>
                    setEntryForm((f) => ({ ...f, applicantId: vals.length > 0 ? vals[0] : '' }))
                  }
                  multi={false}
                  loading={applicantsLoading}
                  placeholder="Search by name or email..."
                  searchPlaceholder="Search by name or email..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source Type</label>
                <select
                  value={entryForm.sourceType}
                  onChange={(e) =>
                    setEntryForm((f) => ({
                      ...f,
                      sourceType: e.target.value as typeof entryForm.sourceType,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-control focus:outline-none focus:ring-2 focus:ring-gold-400"
                >
                  <option value="MANUAL">Manual</option>
                  <option value="AUTO_REJECTED">Auto-Rejected</option>
                  <option value="AGENCY">Agency</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={entryForm.notes}
                  onChange={(e) => setEntryForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-control focus:outline-none focus:ring-2 focus:ring-gold-400"
                  rows={3}
                  placeholder="Optional notes about this candidate..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setModal(null)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEntry}
                disabled={actionLoading || !entryForm.applicantId.trim()}
                className="px-4 py-2 text-sm bg-gold-500 text-violet-950 rounded-full hover:bg-gold-600 disabled:opacity-50 font-medium"
              >
                {actionLoading ? 'Adding...' : 'Add to Pool'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Remove Entry Modal ── */}
      {modal === 'removeEntry' && removingEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[10px] shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Remove Candidate</h3>
            <p className="text-sm text-gray-500 mb-4">
              Remove{' '}
              <span className="font-medium text-gray-700">
                {removingEntry.applicant?.fullName ?? removingEntry.applicantName ?? `Applicant #${removingEntry.applicant?.id ?? removingEntry.applicantId ?? removingEntry.id}`}
              </span>{' '}
              from this pool?
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                value={removeReason}
                onChange={(e) => setRemoveReason(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-control focus:outline-none focus:ring-2 focus:ring-gold-400"
                rows={3}
                placeholder="Why is this candidate being removed?"
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => { setModal(null); setRemovingEntry(null); }}
                disabled={actionLoading}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveEntry}
                disabled={actionLoading}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-full hover:bg-red-700 disabled:opacity-50 font-medium"
              >
                {actionLoading ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
