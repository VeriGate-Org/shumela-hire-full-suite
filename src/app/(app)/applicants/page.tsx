'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import PageWrapper from '@/components/PageWrapper';
import ApplicantProfile from '@/components/ApplicantProfile';
import { useTheme } from '@/contexts/ThemeContext';
import { apiFetch } from '@/lib/api-fetch';
import DistributionStrip from '@/components/record/DistributionStrip';
import FilterChips from '@/components/record/FilterChips';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilSquareIcon,
  EnvelopeIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';
import {
  APPLICANT_FILTERS,
  APPLICANT_SORTS,
  ApplicantRow,
  ApplicantSummary,
  ApplicationSummary,
  documentCount,
  filterCount,
  historyLabel,
  isApplicantSummary,
  isApplicationSummary,
  lastAppliedLabel,
  matchesFilter,
  skillList,
  sortFor,
  stateOf,
  STATE_LABELS,
  summaryIds,
} from './queue';

type Applicant = ApplicantRow;

const PAGE_SIZE = 20;

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function ApplicantsPage() {
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedApplicantId, setSelectedApplicantId] = useState<string | number | undefined>();
  const { setCurrentRole } = useTheme();

  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  // Counts describing every applicant on file, from GET /api/applicants/summary.
  //
  // What stood here was a row of tiles reading In Screening, At Interview and Hired, all three
  // taken from /api/applications/manage/statistics — they counted *applications*, under a total
  // that counts *people*. "Hired 34" meant thirty-four applications at HIRED, not thirty-four
  // people hired, and nothing on the page distinguished the two. (Before that they were arithmetic
  // on the total: "Shortlisted" was literally Math.ceil(total * 0.4).)
  const [summary, setSummary] = useState<ApplicantSummary | null>(null);
  // Application history for the rows on screen, keyed by applicant id — one batch call per page
  // rather than one request per row.
  const [histories, setHistories] = useState<Record<string, ApplicationSummary>>({});
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortKey, setSortKey] = useState('createdAt-desc');

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Set theme to recruiter for applicants page
  useEffect(() => {
    setCurrentRole('RECRUITER');
  }, [setCurrentRole]);

  const loadApplicants = useCallback(async (page: number, search: string, sort: string) => {
    setLoading(true);
    setHistoryLoaded(false);
    const ordering = sortFor(sort);
    let loadedRows: Applicant[] = [];
    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('size', String(PAGE_SIZE));
      params.append('sort', ordering.sort);
      params.append('direction', ordering.direction);
      if (search) params.append('search', search);

      const response = await apiFetch(`/api/applicants?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.content) {
          loadedRows = data.content;
          setApplicants(data.content);
          setTotalPages(data.totalPages ?? 0);
          setTotalElements(data.totalElements ?? 0);
        } else {
          const list = Array.isArray(data) ? data : [];
          loadedRows = list;
          setApplicants(list);
          setTotalPages(1);
          setTotalElements(list.length);
        }
      } else {
        setApplicants([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch {
      setApplicants([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }

    // Whole-set counts. Deliberately a separate call from the list: the list is paged, so counting
    // from it would describe a page and label the result a total — the defect being fixed here.
    try {
      const summaryResponse = await apiFetch('/api/applicants/summary');
      if (summaryResponse.ok) {
        const payload = await summaryResponse.json();
        // Guarded rather than trusted: an error body is an object too, and reading .registered off
        // it would render a strip of zeroes that looks like a real and empty tenant.
        setSummary(isApplicantSummary(payload) ? payload : null);
      } else {
        setSummary(null);
      }
    } catch {
      // Leave the strip saying the figures are unavailable rather than showing zeroes.
      setSummary(null);
    }

    // Application history for the rows on screen — one batch call, not one per row. The server
    // caps the batch and rejects an over-long one rather than truncating, so summaryIds caps too.
    const ids = summaryIds(loadedRows);
    if (ids.length === 0) {
      setHistories({});
      setHistoryLoaded(true);
      return;
    }
    try {
      const historyResponse = await apiFetch(
        `/api/applicants/application-summaries?applicantIds=${ids.map(encodeURIComponent).join(',')}`,
      );
      if (historyResponse.ok) {
        const payload = await historyResponse.json();
        const valid: Record<string, ApplicationSummary> = {};
        if (payload && typeof payload === 'object') {
          for (const [id, entry] of Object.entries(payload)) {
            // An entry that is not a summary is dropped rather than coerced. A row with no history
            // reads "History unavailable", which is true; a zeroed one would claim they have never
            // applied, which may not be.
            if (isApplicationSummary(entry)) valid[id] = entry;
          }
        }
        setHistories(valid);
        setHistoryLoaded(true);
      } else {
        setHistories({});
        setHistoryLoaded(false);
      }
    } catch {
      setHistories({});
      setHistoryLoaded(false);
    }
  }, []);

  useEffect(() => {
    if (view === 'list') {
      loadApplicants(currentPage, searchTerm, sortKey);
    }
  }, [view, currentPage, sortKey, loadApplicants]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setCurrentPage(0);
      loadApplicants(0, value, sortKey);
    }, 400);
  };

  // The sort dropdown offered four options and carried no onChange handler at all: choosing
  // "Name A-Z" did nothing, and gave no sign that it had done nothing. Every option in
  // APPLICANT_SORTS maps to a sort/direction pair the API accepts, so all four now work.
  const handleSortChange = (key: string) => {
    setSortKey(key);
    setCurrentPage(0);
  };

  const handleFilterChange = (key: string) => {
    setStatusFilter(key);
  };

  const handleCreateNew = () => {
    setSelectedApplicantId(undefined);
    setView('create');
    window.scrollTo(0, 0);
  };

  const handleEdit = (applicantId: string | number) => {
    setSelectedApplicantId(applicantId);
    setView('edit');
    window.scrollTo(0, 0);
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedApplicantId(undefined);
  };

  const handleSave = () => {
    setView('list');
    loadApplicants(currentPage, searchTerm, sortKey);
  };

  const getPageTitle = () => {
    switch (view) {
      case 'create': return 'Create Applicant';
      case 'edit': return 'Edit Applicant';
      default: return 'Candidate Database';
    }
  };

  const getPageSubtitle = () => {
    switch (view) {
      case 'create': return 'Create a new applicant profile with personal information and documents.';
      case 'edit': return 'Edit applicant profile information and manage documents.';
      default: return 'Browse and manage applicant profiles with comprehensive tracking.';
    }
  };

  // Filtering happens on the loaded page, not on the server: GET /api/applicants has no history
  // filter, so this narrows what is on screen. The chip counts are whole-set and say so — a count
  // that described only the page would be the exact defect this page is being fixed for.
  const visibleApplicants = applicants.filter((applicant) =>
    matchesFilter(statusFilter, histories[String(applicant.id)]),
  );

  const actions = view === 'list' ? (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        onClick={handleCreateNew}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-cta border-2 border-cta text-foreground rounded-full hover:bg-cta-hover hover:border-cta-hover text-sm font-semibold uppercase tracking-wider transition-all"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="8.5" cy="7" r="4"></circle>
          <line x1="20" y1="8" x2="20" y2="14"></line>
          <line x1="23" y1="11" x2="17" y2="11"></line>
        </svg>
        Add Applicant
      </button>
    </div>
  ) : (
    <button
      onClick={handleBackToList}
      className="inline-flex items-center gap-2 px-4 py-2 border-2 border-border text-muted-foreground rounded-full hover:border-primary hover:text-primary text-sm font-semibold uppercase tracking-wider transition-all"
    >
      <ChevronLeftIcon className="w-4 h-4" />
      Back to Applicants
    </button>
  );

  return (
    <PageWrapper
      title={getPageTitle()}
      subtitle={getPageSubtitle()}
      actions={actions}
    >
      <div className="space-y-6">
        {view === 'list' && (
          <>
            {/* Where the candidate base actually sits.
                Every figure here counts people, and they come from one endpoint so they cannot
                disagree with each other. The tiles this replaces counted applications under a
                total that counted applicants. */}
            {summary ? (
              <DistributionStrip
                buckets={[
                  {
                    label: 'Registered, never applied',
                    count: summary.neverApplied,
                    detail: 'Profile created, nothing submitted',
                  },
                  {
                    label: 'Applied once',
                    count: summary.appliedOnce,
                    detail: 'One application, ever',
                  },
                  {
                    label: 'Repeat applicants',
                    count: summary.repeatApplicants,
                    detail: 'Two or more',
                    tone: 'positive',
                  },
                  {
                    label: 'In process now',
                    count: summary.inProcessNow,
                    detail: 'At least one live application',
                  },
                  {
                    label: 'Previously hired',
                    count: summary.previouslyHired,
                    detail: 'Hired at least once',
                    tone: 'positive',
                  },
                ]}
                footnote={
                  <>
                    Counts people, not applications, across all{' '}
                    <b className="font-bold text-foreground">{summary.registered}</b> applicants on
                    file — the first three account for every one of them.{' '}
                    <b className="font-bold text-foreground">{summary.applicationsRecorded}</b>{' '}
                    applications counted.
                    {summary.orphanedApplications > 0 && (
                      <>
                        {' '}
                        <span className="text-error">
                          {summary.orphanedApplications} application
                          {summary.orphanedApplications === 1 ? '' : 's'} belong to applicants no
                          longer on file and are excluded from the segments above.
                        </span>
                      </>
                    )}
                  </>
                }
              />
            ) : (
              <div className="enterprise-card p-5">
                <p className="text-sm font-medium text-muted-foreground">
                  Candidate base figures unavailable.{' '}
                  <span className="text-muted-foreground/70">
                    Showing {totalElements} applicant{totalElements !== 1 ? 's' : ''} matching the
                    current search. Page counts are not totals, so no breakdown is shown.
                  </span>
                </p>
              </div>
            )}

            {/* Filter Bar */}
            <div className="enterprise-card p-4">
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                {/* Search */}
                <div className="flex-1 min-w-0">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search applicants..."
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-9 pr-4 py-2 w-full border border-border rounded-control text-sm font-medium bg-card text-foreground focus:ring-2 focus:ring-ring/40 focus:border-ring outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Count & Sort row */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <p className="text-sm font-medium text-muted-foreground">
                  {totalElements} applicant{totalElements !== 1 ? 's' : ''}
                  {loading && <span className="ml-2 text-muted-foreground/60">(loading...)</span>}
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <label className="text-muted-foreground" htmlFor="applicant-sort">
                    Sort by:
                  </label>
                  {/* This control had no onChange handler: all four options were inert. */}
                  <select
                    id="applicant-sort"
                    className="py-1 px-2 border border-border rounded-control text-sm font-medium bg-card text-foreground focus:ring-2 focus:ring-ring/40 focus:border-ring"
                    value={sortKey}
                    onChange={(e) => handleSortChange(e.target.value)}
                  >
                    {APPLICANT_SORTS.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <FilterChips
              chips={APPLICANT_FILTERS.map((filter) => ({
                key: filter.key,
                label: filter.label,
                count: filterCount(summary, filter.key) ?? undefined,
              }))}
              activeKey={statusFilter}
              onChange={handleFilterChange}
              aria-label="Filter applicants by history"
              note={
                <>
                  Counts are of the whole base; filtering applies to this page
                  {historyLoaded ? '' : ' once history loads'}
                </>
              }
            />

            {/* Applicants list */}
            {loading && applicants.length === 0 ? (
              <div className="enterprise-card p-0 overflow-hidden">
                {/* Skeleton table */}
                <div className="animate-pulse">
                  <div className="bg-muted/50 border-b border-border px-6 py-3 flex gap-6">
                    <div className="h-3 bg-border rounded w-24"></div>
                    <div className="h-3 bg-border rounded w-32"></div>
                    <div className="h-3 bg-border rounded w-20"></div>
                    <div className="h-3 bg-border rounded w-16 ml-auto"></div>
                  </div>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="px-6 py-4 border-b border-border flex items-center gap-4">
                      <div className="w-9 h-9 bg-border rounded-full flex-shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 bg-border rounded w-36"></div>
                        <div className="h-3 bg-border rounded w-48"></div>
                      </div>
                      <div className="h-3 bg-border rounded w-20"></div>
                      <div className="h-3 bg-border rounded w-12"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : applicants.length === 0 ? (
              <div className="enterprise-card p-12 text-center">
                <UserGroupIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-1">No applicants found</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {searchTerm ? 'Try adjusting your search criteria.' : 'Create your first applicant profile to start managing candidates.'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={handleCreateNew}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-cta border-2 border-cta text-foreground rounded-full hover:bg-cta-hover hover:border-cta-hover text-sm font-semibold uppercase tracking-wider transition-all"
                  >
                    Create New Applicant
                  </button>
                )}
              </div>
            ) : (
              <div className="enterprise-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                          Applicant
                        </th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                          Contact
                        </th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                          Skills
                        </th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                          Application history
                        </th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                          Registered
                        </th>
                        <th className="px-4 lg:px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {visibleApplicants.map((applicant, idx) => {
                        const avatarColors = [
                          'bg-violet-600', 'bg-idc-pink-600', 'bg-teal-600', 'bg-gold-600',
                        ];
                        const colorClass = avatarColors[idx % avatarColors.length];
                        const summaryForRow = histories[String(applicant.id)];
                        const history = historyLabel(summaryForRow);
                        const state = stateOf(summaryForRow);
                        const lastApplied = lastAppliedLabel(summaryForRow);
                        const skills = skillList(applicant);
                        const docs = documentCount(applicant);

                        return (
                          <tr
                            key={applicant.id}
                            className="hover:bg-surface-navy transition-colors"
                          >
                            <td className="px-4 lg:px-6 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 ${colorClass} rounded-full flex items-center justify-center flex-shrink-0`}>
                                  <span className="text-xs font-bold text-white tracking-wide">
                                    {applicant.name.charAt(0)}{applicant.surname.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <p
                                    className="text-sm font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
                                    onClick={() => handleEdit(applicant.id)}
                                  >
                                    {applicant.name} {applicant.surname}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 lg:px-6 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 text-sm text-foreground/80">
                                <EnvelopeIcon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                {applicant.email}
                              </div>
                              {applicant.phone && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                  <PhoneIcon className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                  {applicant.phone}
                                </div>
                              )}
                            </td>
                            <td className="px-4 lg:px-6 py-3 align-top max-w-[15rem]">
                              {skills.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {skills.slice(0, 3).map((skill) => (
                                    <span
                                      key={skill}
                                      className="inline-block px-2 py-0.5 rounded-full bg-muted text-[0.6875rem] font-semibold text-muted-foreground"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                  {skills.length > 3 && (
                                    <span className="text-[0.6875rem] font-semibold text-muted-foreground/70 self-center">
                                      +{skills.length - 3}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground/60">None recorded</span>
                              )}
                              {docs !== null && docs > 0 && (
                                <p className="text-[0.6875rem] text-muted-foreground/70 mt-1">
                                  {docs} document{docs === 1 ? '' : 's'}
                                </p>
                              )}
                            </td>
                            <td className="px-4 lg:px-6 py-3 align-top whitespace-nowrap">
                              {history ? (
                                <>
                                  <p className="text-sm font-semibold text-foreground">{history}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {STATE_LABELS[state]}
                                    {lastApplied && ` · last ${lastApplied}`}
                                  </p>
                                </>
                              ) : (
                                // Not "never applied" — the batch call did not answer for this row,
                                // and saying so is the only honest option.
                                <span className="text-xs text-muted-foreground/60">
                                  History unavailable
                                </span>
                              )}
                            </td>
                            <td className="px-4 lg:px-6 py-3 whitespace-nowrap text-sm text-muted-foreground align-top">
                              {formatDate(applicant.createdAt)}
                            </td>
                            <td className="px-4 lg:px-6 py-3 whitespace-nowrap text-right">
                              <button
                                onClick={() => handleEdit(applicant.id)}
                                className="inline-flex items-center gap-1.5 text-primary hover:text-cta-hover text-[0.8125rem] font-semibold uppercase tracking-wider transition-colors"
                              >
                                <PencilSquareIcon className="w-4 h-4" />
                                Edit
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 lg:px-6 py-3 border-t border-border bg-muted/50">
                    <p className="text-sm font-medium text-muted-foreground">
                      Showing {currentPage * PAGE_SIZE + 1}--{Math.min((currentPage + 1) * PAGE_SIZE, totalElements)} of {totalElements} applicants
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                        disabled={currentPage === 0}
                        className="w-[34px] h-[34px] rounded-control border border-border bg-card flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronLeftIcon className="w-4 h-4" />
                      </button>
                      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 7) {
                          pageNum = i;
                        } else if (currentPage < 4) {
                          pageNum = i;
                        } else if (currentPage > totalPages - 4) {
                          pageNum = totalPages - 7 + i;
                        } else {
                          pageNum = currentPage - 3 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-[34px] h-[34px] rounded-control border text-[0.8125rem] font-semibold flex items-center justify-center transition-all ${
                              currentPage === pageNum
                                ? 'bg-primary border-primary text-white'
                                : 'border-border bg-card text-muted-foreground hover:border-primary hover:text-primary'
                            }`}
                          >
                            {pageNum + 1}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={currentPage >= totalPages - 1}
                        className="w-[34px] h-[34px] rounded-control border border-border bg-card flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronRightIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {(view === 'create' || view === 'edit') && (
          <ApplicantProfile
            applicantId={selectedApplicantId}
            onSave={handleSave}
          />
        )}
      </div>
    </PageWrapper>
  );
}
