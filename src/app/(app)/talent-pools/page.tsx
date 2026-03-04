'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { useToast } from '@/components/Toast';
import { apiFetchJson } from '@/lib/api-fetch';
import { useAuth } from '@/contexts/AuthContext';
import SearchableDropdown from '@/components/SearchableDropdown';
import type { DropdownOption } from '@/components/SearchableDropdown';
import { useDepartments } from '@/hooks/useDepartments';
import { useSkills } from '@/hooks/useSkills';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TalentPool {
  id: number;
  poolName: string;
  description?: string;
  department?: string;
  skillsCriteria?: string;
  experienceLevel?: string;
  isActive: boolean;
  autoAddEnabled: boolean;
  entryCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface TalentPoolEntry {
  id: number;
  poolId: number;
  applicant?: { id: number; name?: string; surname?: string; fullName?: string };
  applicantId?: number;
  applicantName?: string;
  sourceType: 'MANUAL' | 'AUTO_REJECTED' | 'AGENCY';
  notes?: string;
  rating?: number;
  isAvailable: boolean;
  addedAt: string;
}

interface PoolAnalytics {
  totalEntries: number;
  activeEntries: number;
  averageRating?: number;
  sourceBreakdown?: Record<string, number>;
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

export default function TalentPoolsPage() {
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const hasAccess = user?.role === 'ADMIN' || user?.role === 'HR_MANAGER' || user?.role === 'RECRUITER';

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
  const [entryForm, setEntryForm] = useState({
    applicantId: '',
    sourceType: 'MANUAL' as 'MANUAL' | 'AUTO_REJECTED' | 'AGENCY',
    notes: '',
  });

  // ── Remove entry form state
  const [removeReason, setRemoveReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

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
      isActive: pool.isActive,
      autoAddEnabled: pool.autoAddEnabled,
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
          applicantId: Number(entryForm.applicantId),
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

  const filteredPools = pools.filter(
    (p) =>
      p.poolName.toLowerCase().includes(poolSearch.toLowerCase()) ||
      (p.department ?? '').toLowerCase().includes(poolSearch.toLowerCase()),
  );

  const sourceLabel: Record<string, string> = {
    MANUAL: 'Manual',
    AUTO_REJECTED: 'Auto-Rejected',
    AGENCY: 'Agency',
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <PageWrapper title="Talent Pools" subtitle="Build and manage reusable candidate pools">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold-500" />
        </div>
      </PageWrapper>
    );
  }

  if (!hasAccess) {
    return (
      <PageWrapper title="Access Denied" subtitle="You do not have permission to manage talent pools.">
        <div className="bg-white rounded-[10px] border border-gray-200 p-8 text-center">
          <p className="text-gray-500 text-sm">
            Talent pools can be managed by administrators, HR managers, and recruiters.
          </p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Talent Pools"
      subtitle="Manage and track candidate talent pools for future hiring"
      actions={
        <button
          onClick={openCreatePool}
          className="px-4 py-2 text-sm bg-gold-500 text-violet-950 rounded-full hover:bg-gold-600 font-medium"
        >
          + New Pool
        </button>
      }
    >
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
              {filteredPools.map((pool) => (
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
                    <span
                      className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        pool.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {pool.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {pool.entryCount !== undefined && (
                    <p className="text-xs text-gray-400 mt-2">{pool.entryCount} candidate{pool.entryCount !== 1 ? 's' : ''}</p>
                  )}
                </button>
              ))}
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
                    <p className="text-xs text-gray-500 mb-1">Available</p>
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
                            Status
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
                            <td className="px-4 py-3">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  entry.isAvailable
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-500'
                                }`}
                              >
                                {entry.isAvailable ? 'Available' : 'Unavailable'}
                              </span>
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
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                  placeholder="e.g. Senior Engineers"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={poolForm.description}
                  onChange={(e) => setPoolForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
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
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Applicant ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={entryForm.applicantId}
                  onChange={(e) => setEntryForm((f) => ({ ...f, applicantId: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                  placeholder="Enter applicant ID"
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
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
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
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
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
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
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
