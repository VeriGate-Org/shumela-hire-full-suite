'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import PageWrapper from '@/components/PageWrapper';
import ApplicationStatusTracker from '@/components/ApplicationStatusTracker';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import { TableSkeleton } from '@/components/LoadingComponents';
import { apiFetch, refusalMessage } from '@/lib/api-fetch';
import StatusPill from '@/components/StatusPill';
import IdentityBand from '@/components/record/IdentityBand';
import DecisionBar, { PrimaryAction, SecondaryAction } from '@/components/record/DecisionBar';
import DistributionStrip from '@/components/record/DistributionStrip';
import FilterChips from '@/components/record/FilterChips';
import {
  ApplicationSummary,
  FUNNEL,
  QUEUE_FILTERS,
  QUEUE_SORT,
  byLongestWait,
  concentration,
  filterCount,
  isClosed,
  ratingStars,
  stageCount,
} from './queue';
import { useToast } from '@/components/Toast';
import ShortlistButton from '@/components/ShortlistButton';
import BulkActionBar, { BulkSelect, BulkButton } from '@/components/record/BulkActionBar';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  DocumentTextIcon,
  XCircleIcon,
  ArrowPathIcon,
  StarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import AiCandidatePanel from '@/components/ai/AiCandidatePanel';
import AiAssistPanel from '@/components/ai/AiAssistPanel';
import AiSmartSearch from '@/components/ai/AiSmartSearch';
import { getEnumLabel } from '@/utils/enumLabels';

interface Application {
  /**
   * A string UUID, as it is everywhere else in the platform. This was declared `number`, which
   * nothing coerced — so it never broke — but it made `id` compare and key incorrectly by type.
   */
  id: string;
  jobTitle: string;
  department: string;
  status: string;
  statusDisplayName: string;
  statusCssClass: string;
  submittedAt: string;
  updatedAt?: string;
  withdrawnAt?: string;
  withdrawalReason?: string;
  rating?: number;
  canBeWithdrawn: boolean;
  daysFromSubmission: number;
  applicantName: string;
  applicantEmail: string;
  applicationSource?: string;
  coverLetter?: string;
  screeningNotes?: string;
  interviewFeedback?: string;
}

/*
 * Departments come from the applications themselves.
 *
 * This was a hardcoded list — Engineering, Marketing, Sales, HR, Finance, Operations, Legal,
 * Product — with no overlap whatsoever against the departments this tenant actually uses
 * (Strategic Business Unit, Information Technology, Enterprise Risk Management). Since the filter
 * matches on exact string equality, choosing any department emptied the table, which reads as
 * "no applications" rather than "wrong filter". A control that cannot match anything is worse than
 * an absent one, because it looks like an answer.
 *
 * Departments now come from `/api/applications/summary`, which derives them from the applications
 * themselves. An earlier note here pointed at `/api/applications/manage/filter-options` as "a
 * proper endpoint" to adopt instead — it was not: it returned the same ten literals this page had
 * already removed for matching nothing, and adopting it would have reintroduced the bug.
 */

// Pipeline stage definitions matching the mock
// TODO: Consolidate with backend-provided statusCssClass from ApplicationResponse
function getStatusColor(status: string): string {
  switch (status) {
    case 'SUBMITTED': return 'bg-icon-bg-navy text-primary';
    case 'SCREENING': return 'bg-icon-bg-gold text-accent-gold';
    case 'INTERVIEW_SCHEDULED': return 'bg-icon-bg-teal text-accent-teal';
    case 'INTERVIEW_COMPLETED': return 'bg-icon-bg-teal text-accent-teal';
    case 'REFERENCE_CHECK': return 'bg-warning-bg text-warning';
    case 'OFFER_PENDING': return 'bg-warning-bg text-warning';
    case 'OFFERED': return 'bg-violet-100 text-violet-700';
    case 'OFFER_ACCEPTED': return 'bg-success-bg text-success';
    case 'HIRED': return 'bg-success-bg text-success';
    case 'REJECTED': return 'bg-error-bg text-error';
    case 'WITHDRAWN': return 'bg-muted/50 text-muted-foreground';
    case 'OFFER_DECLINED': return 'bg-warning-bg text-warning';
    default: return 'bg-muted/50 text-muted-foreground';
  }
}

function getStatusDotColor(status: string): string {
  switch (status) {
    case 'SUBMITTED': return 'bg-primary';
    case 'SCREENING': return 'bg-accent-gold';
    case 'INTERVIEW_SCHEDULED':
    case 'INTERVIEW_COMPLETED': return 'bg-accent-teal';
    case 'REFERENCE_CHECK':
    case 'OFFER_PENDING': return 'bg-warning';
    case 'OFFERED': return 'bg-violet-600';
    case 'OFFER_ACCEPTED':
    case 'HIRED': return 'bg-success';
    case 'REJECTED': return 'bg-error';
    default: return 'bg-muted-foreground';
  }
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function renderStars(rating: number) {
  return Array.from({ length: 5 }, (_, i) => (
    <StarIcon
      key={i}
      className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/40'}`}
    />
  ));
}

/**
 * A rating is one to five, and is shown as one to five.
 *
 * This previously multiplied the rating by twenty and rendered "80%" beside a progress bar — a
 * four-star judgement dressed as a measurement to the nearest percent. The scale has five points;
 * presenting it as a hundred implies a precision nobody entered and nobody can act on.
 */
const PAGE_SIZE = 20;

export default function ApplicationsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [advancing, setAdvancing] = useState(false);

  // Bulk work is a state of this list, not a separate console. Selection is held by id rather than
  // by row so it survives re-sorting and refreshes within a page.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkConfirm, setBulkConfirm] = useState<
    { kind: 'status' | 'stage' | 'rating'; value: string; label: string } | null
  >(null);
  const [options, setOptions] = useState<{
    statuses: Array<{ value: string; label: string }>;
    pipelineStages: Array<{ value: string; label: string }>;
  }>({ statuses: [], pipelineStages: [] });
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [summary, setSummary] = useState<ApplicationSummary | null>(null);
  const [activeFilter, setActiveFilter] = useState('unscreened');
  const [aiSearchMode, setAiSearchMode] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [expandedDetailSections, setExpandedDetailSections] = useState<Record<string, boolean>>({});
  const [activeModalTab, setActiveModalTab] = useState<'overview' | 'screening' | 'feedback'>('overview');

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const toggleDetailSection = (section: string) => {
    setExpandedDetailSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const loadApplications = useCallback(async (page: number, search: string, statuses: string[], department: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('size', String(PAGE_SIZE));
      // The server orders the whole queue by longest wait; the page is a slice of that order
      // rather than a re-sort of an arbitrary twenty rows.
      params.append('sort', QUEUE_SORT.field);
      params.append('direction', QUEUE_SORT.direction);
      if (search) params.append('search', search);
      if (statuses.length > 0) params.append('status', statuses.join(','));
      // Filtered server-side. This was a browser-side filter over the loaded page, against a
      // hardcoded department list that matched nothing on this tenant.
      if (department !== 'ALL') params.append('department', department);

      const response = await apiFetch(`/api/applications?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.content) {
          setApplications(data.content);
          setTotalPages(data.totalPages ?? 0);
          setTotalElements(data.totalElements ?? 0);
        } else {
          const list = Array.isArray(data) ? data : [];
          setApplications(list);
          setTotalPages(1);
          setTotalElements(list.length);
        }
      } else {
        setError('Failed to load applications. Please try again.');
        setApplications([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch {
      setError('Failed to load applications. Please check your connection and try again.');
      setApplications([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSummary = useCallback(async () => {
    try {
      const response = await apiFetch('/api/applications/summary');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setSummary(await response.json());
    } catch {
      // Left null rather than zeroed. Every figure derived from it is then omitted, because a
      // failed request must not render as "nothing is waiting".
      setSummary(null);
    }
  }, []);

  const statusesFor = (filterKey: string) =>
    QUEUE_FILTERS.find((filter) => filter.key === filterKey)?.statuses ?? [];

  useEffect(() => {
    loadApplications(currentPage, searchTerm, statusesFor(activeFilter), departmentFilter);
    // searchTerm is deliberately absent: it is debounced and drives its own load, so including it
    // here would fire a second request on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, activeFilter, departmentFilter, loadApplications]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setCurrentPage(0);
      loadApplications(0, value, statusesFor(activeFilter), departmentFilter);
    }, 400);
  };

  const applyFilter = (filterKey: string) => {
    setActiveFilter(filterKey);
    setCurrentPage(0);
  };

  const handleDepartmentFilterChange = (value: string) => {
    setDepartmentFilter(value);
    setCurrentPage(0);
  };

  // The server already returns the queue in wait order. This keeps anything closed below anything
  // live, which submission order alone does not express.
  const rows = byLongestWait(applications);

  const atOffer = summary
    ? ['OFFER_PENDING', 'OFFERED', 'OFFER_ACCEPTED'].reduce(
        (total, status) => total + (summary.countsByStatus[status] ?? 0),
        0
      )
    : null;

  /**
   * Advance a candidate one pipeline stage.
   *
   * The footer button that says this rendered with no onClick at all, so it did nothing — which
   * reads as a broken product rather than a missing feature. The pipeline endpoint owns stage
   * order and the verification gate, so this defers to it rather than reimplementing either, and
   * surfaces a refusal in the API's own words.
   */
  const handleAdvanceStage = async (applicationId: string) => {
    setAdvancing(true);
    try {
      const response = await apiFetch(
        `/api/pipeline/applications/${applicationId}/progress?performedBy=1`,
        { method: 'POST' },
      );
      if (!response.ok) throw new Error(await refusalMessage(response));
      toast('Candidate advanced to the next stage', 'success');
      loadApplications(currentPage, searchTerm, statusesFor(activeFilter), departmentFilter);
      setSelectedApplication(null);
    } catch (error: unknown) {
      toast(error instanceof Error ? error.message : 'Could not advance this candidate', 'error');
    } finally {
      setAdvancing(false);
    }
  };

  /*
   * Which bulk actions this person may use.
   *
   * The endpoints do not all admit the same roles: bulk status and stage are ADMIN/HR_MANAGER,
   * rating also admits RECRUITER, export is ADMIN/HR_MANAGER. A recruiter — who lives on this
   * screen — may only rate, and a hiring manager may do none of it. Offering all four to everyone
   * would put three controls in front of a recruiter that answer 403.
   */
  const role = user?.role;
  const canBulkStatusOrStage = role === 'ADMIN' || role === 'HR_MANAGER';
  const canBulkRate = canBulkStatusOrStage || role === 'RECRUITER';
  const canExport = canBulkStatusOrStage;

  useEffect(() => {
    // Only for the bulk selects' options; the department filter is served by the summary endpoint,
    // which already derives real departments from the applications themselves.
    if (!canBulkStatusOrStage) return;
    apiFetch('/api/applications/manage/filter-options')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!data) return;
        setOptions({
          statuses: Array.isArray(data.statuses) ? data.statuses : [],
          pipelineStages: Array.isArray(data.pipelineStages) ? data.pipelineStages : [],
        });
      })
      .catch(() => {});
  }, [canBulkStatusOrStage]);

  // Honoured so a deep link can name a candidate. The hiring manager dashboard sends one when
  // you click someone in its pipeline list; without this the link lands on an unfiltered queue and
  // the candidate you asked for is somewhere in the pages below.
  useEffect(() => {
    const initial = searchParams.get('search');
    if (initial) {
      setSearchTerm(initial);
      loadApplications(0, initial, statusesFor(activeFilter), departmentFilter);
    }
    // Deliberately once, on mount: re-running would fight the user's own typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearSelection = () => setSelectedIds(new Set());

  const runBulk = async () => {
    if (!bulkConfirm) return;
    const { kind, value } = bulkConfirm;
    const ids = Array.from(selectedIds);
    setBulkConfirm(null);
    setBulkBusy(true);

    const endpoint =
      kind === 'status' ? '/api/applications/manage/bulk/status'
      : kind === 'stage' ? '/api/applications/manage/bulk/pipeline-stage'
      : '/api/applications/manage/bulk/rating';

    const body: Record<string, unknown> = { applicationIds: ids };
    if (kind === 'status') body.status = value;
    if (kind === 'stage') body.pipelineStage = value;
    if (kind === 'rating') {
      body.ratings = Object.fromEntries(ids.map(id => [id, Number(value)]));
    }

    try {
      const response = await apiFetch(endpoint, { method: 'PUT', body: JSON.stringify(body) });
      if (!response.ok) throw new Error(await refusalMessage(response));

      // Bulk is many decisions, not one. The server moves who it can and refuses who it cannot, so
      // reporting ids.length would claim a clean sweep while a candidate sat unchanged.
      const result = await response.json().catch(() => null);
      const refused: string[] = Array.isArray(result?.errors) ? result.errors : [];
      const changed: number =
        typeof result?.updatedCount === 'number' ? result.updatedCount
        : Array.isArray(result?.updatedIds) ? result.updatedIds.length
        : ids.length;

      if (refused.length > 0) {
        toast(
          `Updated ${changed} of ${ids.length}. ${refused.length} refused: ${refused.slice(0, 2).join(' · ')}`,
          changed > 0 ? 'info' : 'error',
        );
      } else {
        toast(`Updated ${changed} application${changed === 1 ? '' : 's'}`, 'success');
      }

      clearSelection();
      loadApplications(currentPage, searchTerm, statusesFor(activeFilter), departmentFilter);
      loadSummary();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Bulk update failed', 'error');
    } finally {
      setBulkBusy(false);
    }
  };

  /**
   * The API exports either the ids you name, or every application there is. It has no notion of
   * "the current filter", so neither does this: `runExport(ids)` is the selection and
   * `runExport()` is genuinely everything. Calling the latter "export queue" would misdescribe a
   * file that ignores the filters on screen.
   */
  const runExport = async (ids?: string[]) => {
    setBulkBusy(true);
    try {
      const params = new URLSearchParams();
      (ids ?? []).forEach(id => params.append('applicationIds', id));
      const response = await apiFetch(`/api/applications/manage/export?${params.toString()}`);
      if (!response.ok) throw new Error(await refusalMessage(response));

      const payload = await response.json();
      const blob = new Blob([JSON.stringify(payload.data ?? payload, null, 2)], {
        type: 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = ids ? `applications-${ids.length}.json` : 'applications-all.json';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      toast(`Exported ${payload.recordCount ?? (ids?.length ?? 0)} application(s)`, 'success');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Export failed', 'error');
    } finally {
      setBulkBusy(false);
    }
  };

  const handleWithdraw = async (applicationId: string, reason: string) => {
    try {
      const response = await apiFetch(`/api/applications/${applicationId}/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (response.ok) {
        loadApplications(currentPage, searchTerm, statusesFor(activeFilter), departmentFilter);
        setSelectedApplication(null);
      }
    } catch (error) {
      console.error('Error withdrawing application:', error);
    }
  };

  const actions = (
    <div className="flex items-center gap-3">
      <button
        onClick={() => loadApplications(currentPage, searchTerm, statusesFor(activeFilter), departmentFilter)}
        className="inline-flex items-center px-3 py-2 border border-border text-sm font-medium rounded-full text-foreground hover:bg-accent"
        aria-label="Refresh applications list"
      >
        <ArrowPathIcon className="w-4 h-4 mr-1.5" />
        Refresh
      </button>
      {/* Was "Advanced Management", pointing at a separate console. Bulk work now happens here,
          on the rows you have already filtered, so the link had nowhere left to go. */}
      {canExport && (
        <button
          onClick={() => runExport()}
          disabled={bulkBusy}
          className="inline-flex items-center px-4 py-2 border-2 border-gold-500 text-sm font-medium rounded-full bg-transparent text-gold-500 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider disabled:opacity-50"
        >
          {bulkBusy ? 'Working...' : 'Export all'}
        </button>
      )}
    </div>
  );

  if (loading && applications.length === 0 && !error) {
    return (
      <PageWrapper title="Applications" subtitle="Loading applications..." actions={actions}>
        <div className="enterprise-card overflow-hidden">
          <TableSkeleton rows={8} columns={7} />
        </div>
      </PageWrapper>
    );
  }

  if (error && applications.length === 0) {
    return (
      <PageWrapper title="Applications" subtitle="Browse and track all job applications" actions={actions}>
        <ErrorState
          title="Unable to load applications"
          message={error}
          onRetry={() => loadApplications(currentPage, searchTerm, statusesFor(activeFilter), departmentFilter)}
          retryLabel="Retry Loading"
        />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="space-y-4">
        <IdentityBand
          actions={actions}
          eyebrow="Application triage"
          title="Applications"
          subtitle={
            summary
              ? `${summary.live} live of ${summary.total} received`
              : 'Counts unavailable'
          }
          figures={
            summary
              ? [
                  {
                    label: 'Unscreened',
                    value: summary.unscreened,
                    tone: (summary.unscreened > 0 ? 'warning' : undefined) as 'warning' | undefined,
                  },
                  ...(typeof summary.oldestUnscreenedDays === 'number'
                    ? [
                        {
                          label: 'Oldest unscreened',
                          value: `${summary.oldestUnscreenedDays} days`,
                          tone: (summary.oldestUnscreenedDays >= 14 ? 'critical' : 'warning') as
                            | 'critical'
                            | 'warning',
                        },
                      ]
                    : []),
                  ...(atOffer !== null ? [{ label: 'At offer', value: atOffer }] : []),
                ]
              : []
          }
        />

        {summary && summary.unscreened > 0 && (
          <DecisionBar
            ask={`${summary.unscreened} ${
              summary.unscreened === 1 ? 'application has' : 'applications have'
            } never been screened.`}
            why={[
              typeof summary.oldestUnscreenedDays === 'number'
                ? `The oldest has been waiting ${summary.oldestUnscreenedDays} ${
                    summary.oldestUnscreenedDays === 1 ? 'day' : 'days'
                  }.`
                : null,
              // Only written when the backlog really is concentrated — see concentration().
              concentration(summary),
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <PrimaryAction onClick={() => applyFilter('unscreened')}>Screen oldest first</PrimaryAction>
            {canExport && (
              <SecondaryAction onClick={() => runExport()}>Export all applications</SecondaryAction>
            )}
          </DecisionBar>
        )}

        {summary ? (
          <DistributionStrip
            buckets={FUNNEL.map((stage) => ({
              label: stage.label,
              count: stageCount(summary, stage.key) ?? 0,
              detail:
                stage.key === 'interview'
                  ? `${summary.countsByStatus.INTERVIEW_SCHEDULED ?? 0} scheduled, ${
                      summary.countsByStatus.INTERVIEW_COMPLETED ?? 0
                    } done`
                  : undefined,
            }))}
            footnote={
              <>
                Bar height is volume at each stage — the shape of the funnel, not a target. Rejected,
                withdrawn and declined are excluded;{' '}
                <b className="font-bold text-foreground">{summary.total - summary.live}</b> in total.
              </>
            }
          />
        ) : (
          !loading && (
            <p className="text-sm text-muted-foreground px-1">
              Stage counts are unavailable — the summary could not be loaded.
            </p>
          )
        )}

        <FilterChips
          chips={QUEUE_FILTERS.map((filter) => ({
            key: filter.key,
            label: filter.label,
            // null and undefined both mean "no count to show"; the chip component speaks
            // undefined, and it omits the number rather than printing a zero.
            count: filterCount(summary, filter) ?? undefined,
          }))}
          activeKey={activeFilter}
          onChange={applyFilter}
          note={
            <>
              Sorted by <b className="font-bold text-foreground">longest waiting</b>
            </>
          }
        />

        <div className="enterprise-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex flex-wrap items-center gap-3 justify-between">
            <div className="relative flex-1 min-w-[240px]">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by candidate or job title"
                aria-label="Search applications"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-full border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Options come from the data. The list this replaces was hardcoded to eight
                departments, none of which this tenant uses. */}
            <button
              type="button"
              onClick={() => setAiSearchMode(!aiSearchMode)}
              aria-pressed={aiSearchMode}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-full border transition-colors whitespace-nowrap ${
                aiSearchMode
                  ? 'bg-surface-teal border-accent-teal text-accent-teal'
                  : 'border-border text-muted-foreground hover:bg-accent'
              }`}
            >
              AI Search
            </button>

            {summary && summary.departments.length > 0 && (
              <select
                value={departmentFilter}
                onChange={(e) => handleDepartmentFilterChange(e.target.value)}
                aria-label="Filter by department"
                className="px-3 py-2 text-sm rounded-full border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="ALL">All departments</option>
                {summary.departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            )}
          </div>

          {aiSearchMode && (
            <div className="px-5 py-4 border-b border-border">
              <AiAssistPanel
                title="AI Smart Search"
                feature="AI_SEARCH"
                defaultExpanded
                description="Search candidates using natural language queries instead of manual filters"
              >
                <AiSmartSearch />
              </AiAssistPanel>
            </div>
          )}

          {loading ? (
            <TableSkeleton rows={8} columns={6} />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={DocumentTextIcon}
              title="No applications here"
              description={
                activeFilter === 'unscreened'
                  ? 'Nothing is waiting to be screened.'
                  : 'No applications match these filters.'
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="w-10 px-5 py-3">
                      <input
                        type="checkbox"
                        aria-label="Select all on this page"
                        checked={rows.length > 0 && rows.every(r => selectedIds.has(r.id))}
                        onChange={e => {
                          const next = new Set(selectedIds);
                          // Only this page. Selecting rows you cannot see, then acting on them,
                          // is how a bulk tool does something nobody intended.
                          rows.forEach(r => (e.target.checked ? next.add(r.id) : next.delete(r.id)));
                          setSelectedIds(next);
                        }}
                        className="w-[18px] h-[18px] rounded border-2 border-border accent-primary"
                      />
                    </th>
                    <th className="text-left px-5 py-3 text-[0.5625rem] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
                      Applicant
                    </th>
                    <th className="text-left px-5 py-3 text-[0.5625rem] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
                      Applied for
                    </th>
                    <th className="text-left px-5 py-3 text-[0.5625rem] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
                      Source
                    </th>
                    <th className="text-left px-5 py-3 text-[0.5625rem] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
                      Stage
                    </th>
                    <th className="text-left px-5 py-3 text-[0.5625rem] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
                      Rating
                    </th>
                    <th className="text-right px-5 py-3 text-[0.5625rem] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
                      Waiting
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((app) => {
                    const stars = ratingStars(app.rating);
                    const waiting = app.daysFromSubmission;
                    return (
                      <tr
                        key={app.id}
                        onClick={() => setSelectedApplication(app)}
                        className="border-b border-border last:border-0 hover:bg-accent/50 cursor-pointer"
                      >
                        <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            aria-label={`Select ${app.applicantName || 'application'}`}
                            checked={selectedIds.has(app.id)}
                            onChange={e => {
                              const next = new Set(selectedIds);
                              if (e.target.checked) next.add(app.id);
                              else next.delete(app.id);
                              setSelectedIds(next);
                            }}
                            className="w-[18px] h-[18px] rounded border-2 border-border accent-primary"
                          />
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-foreground text-sm">
                            {app.applicantName || 'Unknown'}
                          </div>
                          <div className="text-xs text-muted-foreground">{app.applicantEmail}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="text-sm text-foreground">{app.jobTitle}</div>
                          <div className="text-xs text-muted-foreground">{app.department}</div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-muted-foreground">
                          {/* Where candidates come from is the one figure that says whether the
                              job-board spend is working, and it was on the record and off screen. */}
                          {app.applicationSource
                            ? getEnumLabel('applicationSource', app.applicationSource)
                            : <span className="text-muted-foreground/60">Not recorded</span>}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusPill value={app.status} domain="applicationStatus" size="sm" />
                        </td>
                        <td className="px-5 py-3.5">
                          {stars === null ? (
                            // Not "0%", and not a progress bar: an unrated application has no
                            // measurement, which is different from a measurement of nothing.
                            <span className="text-xs text-muted-foreground">Not rated</span>
                          ) : (
                            <span className="text-sm tracking-tight" aria-label={`${stars} out of 5`}>
                              <span className="text-accent-gold">{'★'.repeat(stars)}</span>
                              <span className="text-muted-foreground/40">{'★'.repeat(5 - stars)}</span>
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span
                            className={`text-sm font-semibold tabular-nums ${
                              !isClosed(app.status) && waiting >= 14 ? 'text-error' : 'text-foreground'
                            }`}
                          >
                            {waiting} {waiting === 1 ? 'day' : 'days'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {/* Says which slice of what, rather than implying the page is the whole set. */}
                Showing {rows.length} of {totalElements}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
                  disabled={currentPage === 0}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full border border-border disabled:opacity-40 hover:bg-accent"
                >
                  <ChevronLeftIcon className="w-3.5 h-3.5" />
                  Previous
                </button>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {currentPage + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((page) => Math.min(totalPages - 1, page + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full border border-border disabled:opacity-40 hover:bg-accent"
                >
                  Next
                  <ChevronRightIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ===== Application Detail Modal ===== */}
        {selectedApplication && (() => {
          const name = selectedApplication.applicantName || 'Unknown';
          const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
              {/* Overlay with blur */}
              <div
                className="fixed inset-0 bg-foreground/50 backdrop-blur-sm"
                onClick={() => setSelectedApplication(null)}
                aria-hidden="true"
              />
              {/* Modal */}
              <div
                className="relative bg-card rounded-2xl shadow-xl max-w-[760px] w-full max-h-[90vh] flex flex-col"
                role="dialog"
                aria-modal="true"
                aria-label="Application details"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 pt-6">
                  <h2 className="text-xl font-bold text-foreground">Application Details</h2>
                  <button
                    onClick={() => setSelectedApplication(null)}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-surface-navy hover:text-foreground transition-colors"
                    aria-label="Close application details"
                  >
                    <XCircleIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Tabs */}
                <div className="flex border-b-2 border-border mx-6 mt-4 gap-0">
                  {([
                    { key: 'overview' as const, label: 'Overview' },
                    { key: 'screening' as const, label: 'Screening Notes' },
                    { key: 'feedback' as const, label: 'Feedback' },
                  ]).map(tab => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveModalTab(tab.key)}
                      className={`px-5 py-2.5 text-[0.8125rem] font-semibold border-b-2 -mb-[2px] transition-colors ${
                        activeModalTab === tab.key
                          ? 'text-primary border-primary'
                          : 'text-muted-foreground border-transparent hover:text-primary'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Scrollable Body */}
                <div className="p-6 overflow-y-auto flex-1">
                  {/* Overview Tab */}
                  {activeModalTab === 'overview' && (
                    <div className="space-y-5">
                      {/* Applicant Header */}
                      <div className="flex items-center gap-4 pb-5 border-b border-border">
                        <div className="w-14 h-14 rounded-full bg-cta/15 flex items-center justify-center shrink-0">
                          <span className="text-base font-bold text-cta">{initials}</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-foreground">{name}</h3>
                          <p className="text-[0.8125rem] text-muted-foreground mt-0.5">
                            {selectedApplication.jobTitle}
                            {selectedApplication.department && ` - ${selectedApplication.department}`}
                          </p>
                          <span className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-[0.6875rem] font-semibold uppercase tracking-wider ${getStatusColor(selectedApplication.status)}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(selectedApplication.status)}`} />
                            {selectedApplication.statusDisplayName}
                          </span>
                        </div>
                      </div>

                      {/* Status Tracker */}
                      <ApplicationStatusTracker
                        application={selectedApplication}
                        onWithdraw={handleWithdraw}
                        showWithdrawOption={selectedApplication.canBeWithdrawn}
                      />

                      {/* Metadata Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[0.6875rem] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Email</span>
                          <span className="text-sm font-semibold text-foreground truncate">{selectedApplication.applicantEmail}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[0.6875rem] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Source</span>
                          <span className="text-sm font-semibold text-foreground">
                            {selectedApplication.applicationSource
                              ? getEnumLabel('applicationSource', selectedApplication.applicationSource)
                              : 'Not recorded'}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[0.6875rem] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Submitted</span>
                          <span className="text-sm font-semibold text-foreground">{formatDate(selectedApplication.submittedAt)}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[0.6875rem] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Days in Pipeline</span>
                          <span className="text-sm font-semibold text-foreground">{selectedApplication.daysFromSubmission} days</span>
                        </div>
                        {selectedApplication.rating && (
                          <div className="flex flex-col gap-1">
                            <span className="text-[0.6875rem] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Rating</span>
                            <div className="flex items-center gap-0.5">{renderStars(selectedApplication.rating)}</div>
                          </div>
                        )}
                      </div>

                      {/* Expandable Sections */}
                      {[
                        { key: 'coverLetter', label: 'Cover Letter', icon: DocumentTextIcon, content: selectedApplication.coverLetter },
                      ].filter(section => section.content).map(section => (
                        <div key={section.key} className="border border-border rounded-card overflow-hidden">
                          <button
                            onClick={() => toggleDetailSection(section.key)}
                            className="flex items-center justify-between w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors"
                            aria-expanded={expandedDetailSections[section.key] ?? false}
                          >
                            <div className="flex items-center gap-2">
                              <section.icon className="w-4 h-4 text-muted-foreground" />
                              <span className="text-xs font-semibold text-foreground uppercase tracking-[0.05em]">{section.label}</span>
                            </div>
                            {expandedDetailSections[section.key] ? (
                              <ChevronUpIcon className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronDownIcon className="w-4 h-4 text-muted-foreground" />
                            )}
                          </button>
                          {expandedDetailSections[section.key] && (
                            <div className="px-4 pb-4">
                              <div className="p-3 bg-muted/30 rounded-control">
                                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{section.content}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* AI Candidate Assist */}
                      <AiCandidatePanel
                        applicationId={String(selectedApplication.id)}
                        candidateName={selectedApplication.applicantName}
                        jobTitle={selectedApplication.jobTitle}
                      />
                    </div>
                  )}

                  {/* Screening Notes Tab */}
                  {activeModalTab === 'screening' && (
                    <div className="space-y-4">
                      {selectedApplication.screeningNotes ? (
                        <div className="p-4 bg-muted/30 rounded-control border border-border">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                              <span className="text-[0.625rem] font-bold text-primary-foreground">HR</span>
                            </div>
                            <span className="text-[0.8125rem] font-semibold text-foreground">Screening Notes</span>
                          </div>
                          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{selectedApplication.screeningNotes}</p>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                          No screening notes available for this application.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Feedback Tab */}
                  {activeModalTab === 'feedback' && (
                    <div className="space-y-4">
                      {selectedApplication.interviewFeedback ? (
                        <div className="p-4 bg-muted/30 rounded-control border border-border">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-accent-teal flex items-center justify-center">
                                <span className="text-[0.625rem] font-bold text-white">IF</span>
                              </div>
                              <span className="text-[0.8125rem] font-semibold text-foreground">Interview Feedback</span>
                            </div>
                            {selectedApplication.rating && (
                              <div className="flex gap-0.5">
                                {renderStars(selectedApplication.rating)}
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{selectedApplication.interviewFeedback}</p>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                          No feedback available for this application.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-border shrink-0 flex justify-end gap-3">
                  <button
                    onClick={() => setSelectedApplication(null)}
                    className="px-5 py-2.5 text-[0.8125rem] font-semibold text-muted-foreground hover:text-primary hover:bg-surface-navy rounded-full transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleAdvanceStage(selectedApplication.id)}
                    disabled={advancing}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-[0.8125rem] font-semibold border border-border rounded-full text-foreground bg-card hover:bg-surface-navy hover:border-primary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRightIcon className="w-3.5 h-3.5" />
                    {advancing ? 'Advancing...' : 'Advance Stage'}
                  </button>
                  <ShortlistButton
                    applicationId={selectedApplication.id}
                    candidateName={selectedApplication.applicantName}
                    variant="primary"
                  />
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      <BulkActionBar count={selectedIds.size} onClear={clearSelection}>
        {canBulkStatusOrStage && options.pipelineStages.length > 0 && (
          <BulkSelect
            label="Move to stage"
            options={options.pipelineStages}
            disabled={bulkBusy}
            onChoose={value =>
              setBulkConfirm({
                kind: 'stage',
                value,
                label: options.pipelineStages.find(o => o.value === value)?.label ?? value,
              })
            }
          />
        )}
        {canBulkStatusOrStage && options.statuses.length > 0 && (
          <BulkSelect
            label="Set status"
            options={options.statuses}
            disabled={bulkBusy}
            onChoose={value =>
              setBulkConfirm({
                kind: 'status',
                value,
                label: options.statuses.find(o => o.value === value)?.label ?? value,
              })
            }
          />
        )}
        {canBulkRate && (
          <BulkSelect
            label="Set rating"
            options={[1, 2, 3, 4, 5].map(n => ({
              value: String(n),
              label: `${n} star${n === 1 ? '' : 's'}`,
            }))}
            disabled={bulkBusy}
            onChoose={value =>
              setBulkConfirm({ kind: 'rating', value, label: `${value} of 5` })
            }
          />
        )}
        {canExport && (
          <BulkButton onClick={() => runExport(Array.from(selectedIds))} disabled={bulkBusy}>
            Export selected
          </BulkButton>
        )}
      </BulkActionBar>

      <ConfirmDialog
        open={bulkConfirm !== null}
        title="Apply to selected applications"
        message={
          bulkConfirm
            ? `${
                bulkConfirm.kind === 'stage' ? 'Move'
                : bulkConfirm.kind === 'status' ? 'Set the status of'
                : 'Rate'
              } ${selectedIds.size} application${selectedIds.size === 1 ? '' : 's'} to ${bulkConfirm.label}?`
            : ''
        }
        confirmLabel="Apply"
        variant="warning"
        onConfirm={runBulk}
        onCancel={() => setBulkConfirm(null)}
      />
    </PageWrapper>
  );
}
