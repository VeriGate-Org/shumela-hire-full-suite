'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import EmptyState from '@/components/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { shortlistingService } from '@/services/shortlistingService';
import type { ShortlistScore, ShortlistingSummary } from '@/types/shortlisting';
import {
  ChartBarIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';

interface ShortlistingPanelProps {
  jobPostingId: string;
  currentUserId: string | null;
}

type SortField = 'score' | 'name';
type SortDirection = 'asc' | 'desc';

/**
 * The candidate's name, from whichever parts of the record actually arrived.
 *
 * An applicant association served from the DynamoDB backend can be a stub carrying only an id,
 * so the object *existing* is not evidence that it has a name. Interpolating it directly is what
 * put a literal "null null" in every row of this table while the scores beside them were right.
 * Falling back on each part independently also keeps a half-populated record readable.
 */
const displayName = (
  applicant?: { name?: string | null; surname?: string | null } | null,
  fallback = 'Unknown',
): string => [applicant?.name, applicant?.surname].filter(Boolean).join(' ').trim() || fallback;

// Must match ShortlistingController's @PreAuthorize, which admits HIRING_MANAGER on all four
// endpoints — as do the URL rules in SecurityConfig and CognitoSecurityConfig. Omitting the role
// here did not refuse hiring managers; it hid the entire action bar from them, so the panel
// rendered a score table with no way to act on it. That reads as a dead button rather than as a
// permission boundary, which is the worst of both: no affordance and no explanation.
const MANAGE_ROLES = ['ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER'];
const VIEW_ROLES = [...MANAGE_ROLES];

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 70 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 rounded-full bg-gray-200">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-600 w-8 text-right">
        {Math.round(score)}%
      </span>
    </div>
  );
}

function StatusBadge({ score }: { score: ShortlistScore }) {
  // An override used to replace the outcome entirely, so the badge read "Overridden" and a
  // recruiter could not tell whether the person was in or out — the one thing the column is
  // there to answer. Both facts are shown: what the decision is, and that a human made it.
  const outcome = score.isShortlisted
    ? { label: 'Shortlisted', className: 'bg-green-100 text-green-800' }
    : { label: 'Not Shortlisted', className: 'bg-gray-100 text-gray-600' };

  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${outcome.className}`}>
        {outcome.label}
      </span>
      {score.manuallyOverridden && (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"
          title={score.overrideReason ? `Reason: ${score.overrideReason}` : 'No reason recorded'}
        >
          by hand
        </span>
      )}
    </span>
  );
}

export default function ShortlistingPanel({ jobPostingId, currentUserId }: ShortlistingPanelProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [autoShortlisting, setAutoShortlisting] = useState(false);
  const [scores, setScores] = useState<ShortlistScore[]>([]);
  const [summary, setSummary] = useState<ShortlistingSummary | null>(null);
  const [threshold, setThreshold] = useState(60);
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedRow, setExpandedRow] = useState<string | number | null>(null);

  // Auto-shortlist confirm dialog
  const [showAutoShortlistConfirm, setShowAutoShortlistConfirm] = useState(false);

  // Override modal state
  const [overrideTarget, setOverrideTarget] = useState<ShortlistScore | null>(null);
  const [overrideInclude, setOverrideInclude] = useState(true);
  const [overrideReason, setOverrideReason] = useState('');
  const [overriding, setOverriding] = useState(false);

  const canManage = useMemo(
    () => user?.role != null && MANAGE_ROLES.includes(user.role),
    [user?.role],
  );
  const canView = useMemo(
    () => user?.role != null && VIEW_ROLES.includes(user.role),
    [user?.role],
  );

  const loadData = useCallback(async () => {
    try {
      const summaryData = await shortlistingService.getSummary(jobPostingId);
      setSummary(summaryData);
      if (summaryData.totalCandidates > 0) {
        const scoreData = await shortlistingService.calculateScores(jobPostingId);
        setScores(scoreData);
      }
    } catch (err) {
      console.error('Failed to load shortlisting data:', err);
    } finally {
      setLoading(false);
    }
  }, [jobPostingId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCalculateScores = async () => {
    setCalculating(true);
    try {
      const scoreData = await shortlistingService.calculateScores(jobPostingId);
      setScores(scoreData);
      const summaryData = await shortlistingService.getSummary(jobPostingId);
      setSummary(summaryData);
      toast(`Scores calculated for ${scoreData.length} candidates`, 'success');
    } catch (err) {
      console.error('Failed to calculate scores:', err);
      toast('Failed to calculate scores. Please try again.', 'error');
    } finally {
      setCalculating(false);
    }
  };

  const handleAutoShortlist = async () => {
    setShowAutoShortlistConfirm(false);
    setAutoShortlisting(true);
    try {
      const updatedScores = await shortlistingService.autoShortlist(jobPostingId, threshold);
      setScores(updatedScores);
      const summaryData = await shortlistingService.getSummary(jobPostingId);
      setSummary(summaryData);
      const shortlistedCount = updatedScores.filter((s) => s.isShortlisted).length;
      toast(`${shortlistedCount} candidates shortlisted above ${threshold}% threshold`, 'success');
    } catch (err) {
      console.error('Failed to auto-shortlist:', err);
      toast('Failed to auto-shortlist candidates. Please try again.', 'error');
    } finally {
      setAutoShortlisting(false);
    }
  };

  const handleOverride = async () => {
    if (!overrideTarget || !overrideReason.trim()) return;
    setOverriding(true);
    try {
      const updated = await shortlistingService.overrideDecision(String(overrideTarget.id), {
        include: overrideInclude,
        reason: overrideReason.trim(),
        userId: currentUserId,
      });
      setScores((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      const summaryData = await shortlistingService.getSummary(jobPostingId);
      setSummary(summaryData);
      const name = displayName(overrideTarget.application?.applicant, 'candidate');
      toast(`Override applied for ${name}`, 'success');
      setOverrideTarget(null);
      setOverrideReason('');
    } catch (err) {
      console.error('Failed to override decision:', err);
      toast('Failed to apply override. Please try again.', 'error');
    } finally {
      setOverriding(false);
    }
  };

  const sortedScores = useMemo(() => {
    const sorted = [...scores];
    sorted.sort((a, b) => {
      if (sortField === 'score') {
        return sortDirection === 'desc'
          ? b.totalScore - a.totalScore
          : a.totalScore - b.totalScore;
      }
      const nameA = `${a.application?.applicant?.name ?? ''} ${a.application?.applicant?.surname ?? ''}`.toLowerCase();
      const nameB = `${b.application?.applicant?.name ?? ''} ${b.application?.applicant?.surname ?? ''}`.toLowerCase();
      return sortDirection === 'desc'
        ? nameB.localeCompare(nameA)
        : nameA.localeCompare(nameB);
    });
    return sorted;
  }, [scores, sortField, sortDirection]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'score' ? 'desc' : 'asc');
    }
  };

  if (!canView) return null;

  if (loading) {
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Candidate Shortlisting
        </h4>
        <div className="flex items-center justify-center py-12">
          <ArrowPathIcon className="w-5 h-5 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-500">Loading shortlisting data...</span>
        </div>
      </div>
    );
  }

  if (scores.length === 0) {
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Candidate Shortlisting
        </h4>
        <EmptyState
          icon={ChartBarIcon}
          title="No Scores Calculated"
          description="Calculate shortlisting scores to rank candidates based on skills, experience, education, screening, and keyword match."
          action={
            canManage
              ? {
                  label: calculating ? 'Calculating...' : 'Calculate Scores',
                  onClick: handleCalculateScores,
                  icon: ChartBarIcon,
                }
              : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
        Candidate Shortlisting
      </h4>

      {/* What the VACANCY is missing, as opposed to what the candidates are missing.
          Without this the panel shows "not assessed" against every candidate's skills and
          reads as a data problem with the applicants, when the cause is that nobody recorded
          what the role requires. Requirements are only editable while a posting is a draft, so
          this cannot be fixed in place once approved — the recruiter needs to know that. */}
      {summary?.vacancyGaps && summary.vacancyGaps.length > 0 && (
        <div className="rounded border border-amber-300 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-900">
            This vacancy is missing {summary.vacancyGaps.join(', ')}
          </p>
          <p className="mt-1 text-xs text-amber-800">
            Those dimensions cannot be scored, so candidates are ranked on the remainder and each
            score shows how much of the model ran. Requirements can only be set while a posting is
            a draft.
          </p>
        </div>
      )}

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Total Candidates" value={summary.totalCandidates} />
          <StatCard label="Shortlisted" value={summary.shortlisted} variant="green" />
          <StatCard label="Not Shortlisted" value={summary.notShortlisted} />
          <StatCard label="Average Score" value={`${Math.round(summary.averageScore)}%`} />
          <StatCard label="Highest Score" value={`${Math.round(summary.highestScore)}%`} />
          <StatCard label="Lowest Score" value={`${Math.round(summary.lowestScore)}%`} />
        </div>
      )}

      {/* Action Bar */}
      {canManage && (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
          <button
            onClick={handleCalculateScores}
            disabled={calculating}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-violet-700 bg-white border border-violet-200 rounded-control hover:bg-gold-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowPathIcon className={`w-4 h-4 mr-1.5 ${calculating ? 'animate-spin' : ''}`} />
            {calculating ? 'Calculating...' : 'Recalculate Scores'}
          </button>

          <div className="flex items-center gap-2">
            <label htmlFor="threshold-input" className="text-sm text-gray-600">
              Threshold:
            </label>
            <input
              id="threshold-input"
              type="number"
              min={0}
              max={100}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-16 rounded-control border border-gray-300 px-2 py-1.5 text-sm text-center focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400"
            />
          </div>

          <button
            onClick={() => setShowAutoShortlistConfirm(true)}
            disabled={autoShortlisting}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-violet-600 rounded-control hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {autoShortlisting ? 'Processing...' : 'Auto-Shortlist'}
          </button>
        </div>
      )}

      {/* Ranked Candidates Table */}
      <div className="overflow-x-auto rounded-md border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                #
              </th>
              <th
                className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                onClick={() => toggleSort('name')}
              >
                <span className="inline-flex items-center gap-1">
                  Candidate
                  {sortField === 'name' && (
                    <SortArrow direction={sortDirection} />
                  )}
                </span>
              </th>
              <th
                className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                onClick={() => toggleSort('score')}
              >
                <span className="inline-flex items-center gap-1">
                  Score
                  {sortField === 'score' && (
                    <SortArrow direction={sortDirection} />
                  )}
                </span>
              </th>
              <th className="hidden lg:table-cell px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Skills
              </th>
              <th className="hidden lg:table-cell px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Exp
              </th>
              <th className="hidden lg:table-cell px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Edu
              </th>
              <th className="hidden lg:table-cell px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Screen
              </th>
              <th className="hidden lg:table-cell px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Keywords
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedScores.map((score, index) => {
              const applicant = score.application?.applicant;
              const fullName = displayName(applicant);
              const isExpanded = expandedRow === score.id;

              return (
                <React.Fragment key={score.id}>
                  <tr
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setExpandedRow(isExpanded ? null : score.id)}
                  >
                    <td className="px-3 py-2.5 text-sm text-gray-500">{index + 1}</td>
                    <td className="px-3 py-2.5">
                      <div className="text-sm font-medium text-gray-900">{fullName}</div>
                      <div className="text-xs text-gray-500">{applicant?.email ?? ''}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <ScoreBar score={score.totalScore} />
                    </td>
                    <td className="hidden lg:table-cell px-3 py-2.5 text-sm text-gray-600">
                      {Math.round(score.skillsMatchScore)}%
                    </td>
                    <td className="hidden lg:table-cell px-3 py-2.5 text-sm text-gray-600">
                      {Math.round(score.experienceScore)}%
                    </td>
                    <td className="hidden lg:table-cell px-3 py-2.5 text-sm text-gray-600">
                      {Math.round(score.educationScore)}%
                    </td>
                    <td className="hidden lg:table-cell px-3 py-2.5 text-sm text-gray-600">
                      {Math.round(score.screeningScore)}%
                    </td>
                    <td className="hidden lg:table-cell px-3 py-2.5 text-sm text-gray-600">
                      {Math.round(score.keywordMatchScore)}%
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge score={score} />
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canManage && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOverrideTarget(score);
                              setOverrideInclude(!score.isShortlisted);
                              setOverrideReason('');
                            }}
                            className="text-xs text-violet-600 hover:text-violet-800 font-medium px-2 py-1 rounded hover:bg-violet-50"
                          >
                            Override
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedRow(isExpanded ? null : score.id);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                        >
                          {isExpanded ? (
                            <ChevronUpIcon className="w-4 h-4" />
                          ) : (
                            <ChevronDownIcon className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Row Detail */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={10} className="px-6 py-4 bg-gray-50">
                        <ScoreBreakdown score={score} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Auto-Shortlist Confirm Dialog */}
      <ConfirmDialog
        open={showAutoShortlistConfirm}
        title="Auto-Shortlist Candidates"
        message={`This will shortlist all candidates scoring ${threshold}% or above. SUBMITTED applications will move to SCREENING.`}
        confirmLabel="Auto-Shortlist"
        variant="warning"
        onConfirm={handleAutoShortlist}
        onCancel={() => setShowAutoShortlistConfirm(false)}
      />

      {/* Override Modal */}
      {overrideTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className="mx-4 w-full max-w-md rounded-card border border-gray-200 bg-white p-6 shadow-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby="override-dialog-title"
          >
            <h3
              id="override-dialog-title"
              className="text-lg font-medium text-foreground"
            >
              Override Shortlist Decision
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {displayName(overrideTarget.application?.applicant, 'Candidate')}{' '}
              — Current score: {Math.round(overrideTarget.totalScore)}%
            </p>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setOverrideInclude(true)}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-control border ${
                  overrideInclude
                    ? 'bg-green-50 border-green-300 text-green-800'
                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Include
              </button>
              <button
                onClick={() => setOverrideInclude(false)}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-control border ${
                  !overrideInclude
                    ? 'bg-red-50 border-red-300 text-red-800'
                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Exclude
              </button>
            </div>

            <div className="mt-4">
              <label
                htmlFor="override-reason"
                className="block text-sm font-medium text-gray-700"
              >
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                id="override-reason"
                rows={3}
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Provide a reason for this override..."
                className="mt-1 block w-full rounded-control border border-gray-300 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400"
              />
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setOverrideTarget(null)}
                className="px-4 py-2 text-sm font-medium text-foreground border border-border rounded-full hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={handleOverride}
                disabled={!overrideReason.trim() || overriding}
                className="px-4 py-2 text-sm font-medium rounded-full bg-cta text-cta-foreground hover:bg-cta/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {overriding ? 'Applying...' : 'Apply Override'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Helper Components ── */

function StatCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: string | number;
  variant?: 'green';
}) {
  return (
    <div className="rounded-md border border-gray-200 bg-white px-3 py-2.5">
      <p className="text-xs text-gray-500 truncate">{label}</p>
      <p
        className={`text-lg font-semibold ${
          variant === 'green' ? 'text-emerald-600' : 'text-gray-900'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function SortArrow({ direction }: { direction: SortDirection }) {
  return direction === 'asc' ? (
    <ChevronUpIcon className="w-3 h-3" />
  ) : (
    <ChevronDownIcon className="w-3 h-3" />
  );
}

/** One dimension as recorded in ShortlistScore.scoreBreakdown. */
interface BreakdownDimension {
  score: number;
  weight: number;
  scorable: boolean;
  note: string;
}

interface ParsedBreakdown {
  dimensions: Record<string, BreakdownDimension>;
  completeness?: number;
  confidence?: string;
}

/**
 * Reads the stored breakdown, falling back to the flat columns for scores written before the
 * per-dimension notes existed.
 */
function parseBreakdown(score: ShortlistScore): ParsedBreakdown {
  const fallback: ParsedBreakdown = {
    dimensions: {
      skills: { score: score.skillsMatchScore, weight: 0.3, scorable: true, note: '' },
      experience: { score: score.experienceScore, weight: 0.25, scorable: true, note: '' },
      education: { score: score.educationScore, weight: 0.2, scorable: true, note: '' },
      screening: { score: score.screeningScore, weight: 0.15, scorable: true, note: '' },
      keywords: { score: score.keywordMatchScore, weight: 0.1, scorable: true, note: '' },
    },
  };
  if (!score.scoreBreakdown) return fallback;
  try {
    const raw = JSON.parse(score.scoreBreakdown) as Record<string, unknown>;
    const dims: Record<string, BreakdownDimension> = {};
    for (const key of ['skills', 'experience', 'education', 'screening', 'keywords']) {
      const d = raw[key] as BreakdownDimension | undefined;
      if (d && typeof d.score === 'number') dims[key] = d;
    }
    if (Object.keys(dims).length === 0) return fallback;
    return {
      dimensions: dims,
      completeness: typeof raw.completeness === 'number' ? raw.completeness : undefined,
      confidence: typeof raw.confidence === 'string' ? raw.confidence : undefined,
    };
  } catch {
    return fallback;
  }
}

const DIMENSION_LABELS: Record<string, string> = {
  skills: 'Skills Match',
  experience: 'Experience',
  education: 'Education',
  screening: 'Screening',
  keywords: 'Keyword Match',
};

function ScoreBreakdown({ score }: { score: ShortlistScore }) {
  const parsed = parseBreakdown(score);
  const entries = Object.entries(parsed.dimensions);
  const unscorable = entries.filter(([, d]) => !d.scorable);

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <p className="text-sm font-medium text-gray-700">Score Breakdown</p>
        {/* The number alone does not say whether to trust it. On this tenant most candidates
            carry no structured skills, experience or education, so a score can be assembled
            from one dimension out of five — the recruiter has to be able to see that. */}
        {parsed.confidence && (
          <p className={`text-xs ${unscorable.length ? 'text-amber-700' : 'text-gray-500'}`}>
            {parsed.confidence}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {entries.map(([key, d]) => (
          <div
            key={key}
            className={`rounded border px-3 py-2 ${
              d.scorable ? 'border-gray-200 bg-white' : 'border-dashed border-amber-300 bg-amber-50/40'
            }`}
          >
            <p className="text-xs text-gray-500">{DIMENSION_LABELS[key] ?? key}</p>
            {d.scorable ? (
              <>
                <p className="text-sm font-semibold text-gray-900">{Math.round(d.score)}%</p>
                <p className="text-xs text-gray-400">
                  Weight: {Math.round(d.weight * 100)}% · Contribution:{' '}
                  {(d.score * d.weight).toFixed(1)}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-amber-700">Not assessed</p>
                <p className="text-xs text-amber-700/80">Weight redistributed</p>
              </>
            )}
            {d.note && <p className="mt-1 text-xs text-gray-600">{d.note}</p>}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 text-sm flex-wrap">
        <span className="font-medium text-gray-700">Total: {Math.round(score.totalScore)}%</span>
        {score.manuallyOverridden && (
          <span className="text-amber-700">
            Decided by hand —{' '}
            <span className="italic">
              {score.overrideReason?.trim() ? score.overrideReason : 'no reason recorded'}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
