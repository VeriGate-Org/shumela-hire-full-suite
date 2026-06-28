'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageWrapper from '@/components/PageWrapper';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import { CardSkeleton } from '@/components/LoadingComponents';
import { apiFetch } from '@/lib/api-fetch';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  MapPinIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  EyeIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { formatSalaryRange } from '@/utils/currency';

// Types for internal job data (maps to JobAdResponse from backend)
interface InternalJobAd {
  id: number;
  requisitionId?: number;
  title: string;
  htmlBody: string;
  channelInternal: boolean;
  channelExternal: boolean;
  status: 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED' | 'EXPIRED';
  closingDate?: string;
  slug: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  department?: string;
  location?: string;
  employmentType?: string;
  salaryRangeMin?: number;
  salaryRangeMax?: number;
  salaryCurrency?: string;
  jobPostingId?: number;
}

interface JobFilters {
  department: string;
  location: string;
  employmentType: string;
  closingDate: string;
  search: string;
}

// Utility functions
const getDaysUntilExpiry = (closingDate?: string): number => {
  if (!closingDate) return Infinity;
  const today = new Date();
  const expiry = new Date(closingDate);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const isJobNew = (createdAt: string): boolean => {
  const created = new Date(createdAt);
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  return created > threeDaysAgo;
};

const isJobClosingSoon = (closingDate?: string): boolean => {
  if (!closingDate) return false;
  const daysLeft = getDaysUntilExpiry(closingDate);
  return daysLeft > 0 && daysLeft <= 7;
};

const stripHtmlTags = (html: string | null | undefined): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
};

const INTERNAL_PAGE_SIZE = 20;

export default function InternalJobsBoard() {
  const { user: _user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [allJobs, setAllJobs] = useState<InternalJobAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  // Filter states
  const [filters, setFilters] = useState<JobFilters>({
    department: '',
    location: '',
    employmentType: '',
    closingDate: '',
    search: ''
  });

  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Filter options (these would typically come from backend)
  const [filterOptions, setFilterOptions] = useState({
    departments: [] as string[],
    locations: [] as string[],
    employmentTypes: [] as string[]
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
      return;
    }
  }, [isLoading, isAuthenticated, router]);

  // Fetch jobs from backend (only on mount / page change)
  const fetchJobs = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch(`/api/ads/internal?page=${currentPage}&size=${INTERNAL_PAGE_SIZE}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();
      const content = result.data?.content || result.content || [];

      setAllJobs(content);
      // Filter options derived from full results (before filtering).
      setFilterOptions({
        departments: [...new Set(content.map((j: InternalJobAd) => j.department).filter(Boolean))] as string[],
        locations: [...new Set(content.map((j: InternalJobAd) => j.location).filter(Boolean))] as string[],
        employmentTypes: [...new Set(content.map((j: InternalJobAd) => j.employmentType).filter(Boolean))] as string[],
      });
    } catch (err) {
      console.error('Error fetching internal jobs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load internal jobs');
      setAllJobs([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, currentPage]);

  // Fetch jobs on mount and page changes only
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Client-side filtering (no re-fetch)
  const jobs = useMemo(() => {
    let filtered = allJobs;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter((j) =>
        j.title?.toLowerCase().includes(q) || j.department?.toLowerCase().includes(q)
      );
    }
    if (filters.department) {
      filtered = filtered.filter((j) => j.department === filters.department);
    }
    if (filters.location) {
      filtered = filtered.filter((j) => j.location === filters.location);
    }
    if (filters.employmentType) {
      filtered = filtered.filter((j) => j.employmentType === filters.employmentType);
    }
    if (filters.closingDate) {
      const days = parseInt(filters.closingDate, 10);
      if (!isNaN(days)) {
        filtered = filtered.filter((j) => {
          const daysLeft = getDaysUntilExpiry(j.closingDate);
          return daysLeft >= 0 && daysLeft <= days;
        });
      }
    }
    return filtered;
  }, [allJobs, filters]);

  const totalJobs = allJobs.length;

  const handleFilterChange = (key: keyof JobFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      department: '',
      location: '',
      employmentType: '',
      closingDate: '',
      search: ''
    });
  };

  const handleApply = (job: InternalJobAd) => {
    if (job.jobPostingId) {
      router.push(`/internal/apply/general?jobId=${job.jobPostingId}&title=${encodeURIComponent(job.title)}`);
    } else {
      router.push(`/internal/apply/general?jobId=${job.id}&title=${encodeURIComponent(job.title)}`);
    }
  };

  const JobBadges = ({ job }: { job: InternalJobAd }) => {
    const isNew = isJobNew(job.createdAt);
    const isClosingSoon = isJobClosingSoon(job.closingDate);
    const isInternal = job.channelInternal;

    return (
      <div className="flex flex-wrap gap-2 mb-3">
        {isNew && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <SparklesIcon className="w-3 h-3 mr-1" />
            New
          </span>
        )}
        {isClosingSoon && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            <ClockIcon className="w-3 h-3 mr-1" />
            Closing Soon
          </span>
        )}
        {isInternal && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gold-100 text-gold-800">
            <UserGroupIcon className="w-3 h-3 mr-1" />
            Internal
          </span>
        )}
        {job.channelExternal && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <EyeIcon className="w-3 h-3 mr-1" />
            External
          </span>
        )}
      </div>
    );
  };

  const JobCard = ({ job }: { job: InternalJobAd }) => {
    const daysLeft = getDaysUntilExpiry(job.closingDate);
    const description = stripHtmlTags(job.htmlBody).substring(0, 120) + '...';

    return (
      <div className="enterprise-card hover:shadow-md transition-shadow p-6">
        <JobBadges job={job} />

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground mb-2">{job.title}</h3>
          <p className="text-muted-foreground text-sm mb-3">{description}</p>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
            {job.department && (
              <div className="flex items-center">
                <BuildingOfficeIcon className="w-4 h-4 mr-1" />
                {job.department}
              </div>
            )}
            {job.location && (
              <div className="flex items-center">
                <MapPinIcon className="w-4 h-4 mr-1" />
                {job.location}
              </div>
            )}
            {job.employmentType && (
              <div className="flex items-center">
                <BriefcaseIcon className="w-4 h-4 mr-1" />
                {job.employmentType}
              </div>
            )}
          </div>

          {(job.salaryRangeMin || job.salaryRangeMax) && (
            <div className="flex items-center text-green-600 font-medium mb-3">
              <CurrencyDollarIcon className="w-4 h-4 mr-1" />
              {formatSalaryRange(job.salaryRangeMin, job.salaryRangeMax)}
            </div>
          )}

          {job.closingDate && (
            <div className="flex items-center text-sm text-muted-foreground mb-4">
              <CalendarIcon className="w-4 h-4 mr-1" />
              {daysLeft > 0 ? (
                <span>Closes in {daysLeft} days ({new Date(job.closingDate).toLocaleDateString()})</span>
              ) : (
                <span className="text-red-600">Closing date passed</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Link
            href={`/internal/jobs/${job.id}`}
            className="text-primary hover:text-primary/80 text-sm font-medium"
          >
            View Details
          </Link>

          {daysLeft > 0 && (
            <button
              onClick={() => handleApply(job)}
              className="btn-primary"
            >
              Apply Now
            </button>
          )}
        </div>
      </div>
    );
  };

  const JobTable = () => (
    <div className="enterprise-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 font-semibold text-foreground">Title</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Department</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Location</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Type</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Closing</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Salary</th>
              <th className="text-right px-4 py-3 font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {jobs.map((job) => {
              const daysLeft = getDaysUntilExpiry(job.closingDate);
              return (
                <tr key={job.id} className="hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/internal/jobs/${job.id}`} className="font-medium text-foreground hover:text-primary">
                        {job.title}
                      </Link>
                      {isJobNew(job.createdAt) && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-800">New</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{job.department || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{job.location || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{job.employmentType || '—'}</td>
                  <td className="px-4 py-3">
                    {job.closingDate ? (
                      daysLeft > 0 ? (
                        <span className={daysLeft <= 7 ? 'text-orange-600 font-medium' : 'text-muted-foreground'}>
                          {daysLeft}d left
                        </span>
                      ) : (
                        <span className="text-destructive font-medium">Expired</span>
                      )
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {(job.salaryRangeMin || job.salaryRangeMax)
                      ? formatSalaryRange(job.salaryRangeMin, job.salaryRangeMax)
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {daysLeft > 0 && (
                      <button onClick={() => handleApply(job)} className="btn-primary text-xs px-3 py-1.5">
                        Apply
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  const actions = (
    <button
      onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}
      className="px-3 py-2 border border-border rounded-full text-sm hover:bg-accent text-foreground"
    >
      {viewMode === 'cards' ? 'Table View' : 'Card View'}
    </button>
  );

  if (loading) {
    return (
      <PageWrapper title="Internal Job Board" subtitle="Browse internal opportunities and advance your career" actions={actions}>
        <CardSkeleton count={6} />
      </PageWrapper>
    );
  }

  if (error && allJobs.length === 0) {
    return (
      <PageWrapper title="Internal Job Board" subtitle="Browse internal opportunities and advance your career" actions={actions}>
        <ErrorState
          title="Error Loading Jobs"
          message={error}
          onRetry={fetchJobs}
        />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Internal Job Board"
      subtitle="Browse internal opportunities and advance your career"
      actions={actions}
    >
      <div className="space-y-6">
        {/* Search and Filters */}
        <div className="enterprise-card p-6">
            {/* Search Bar */}
            <div className="relative mb-4">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by job title or department..."
                aria-label="Search jobs by title or department"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-border rounded-sm bg-card text-foreground focus:ring-2 focus:ring-ring/40 focus:border-ring"
              />
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowFilters(!showFilters)}
                aria-expanded={showFilters}
                aria-controls="job-filters-panel"
                className="inline-flex items-center px-4 py-2 border border-border rounded-sm hover:bg-accent text-foreground"
              >
                <FunnelIcon className="w-4 h-4 mr-2" />
                Filters
                {Object.values(filters).some(v => v) && (
                  <span className="ml-2 px-2 py-1 bg-gold-100 text-gold-800 text-xs rounded-full">
                    Active
                  </span>
                )}
              </button>

              <div className="text-sm text-muted-foreground">
                Showing {jobs.length} of {totalJobs} jobs
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div id="job-filters-panel" className="mt-6 pt-6 border-t border-border">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Department
                    </label>
                    <select
                      value={filters.department}
                      onChange={(e) => handleFilterChange('department', e.target.value)}
                      className="w-full border border-border rounded-sm px-3 py-2 bg-card text-foreground focus:ring-2 focus:ring-ring/40 focus:border-ring"
                    >
                      <option value="">All Departments</option>
                      {filterOptions.departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Location
                    </label>
                    <select
                      value={filters.location}
                      onChange={(e) => handleFilterChange('location', e.target.value)}
                      className="w-full border border-border rounded-sm px-3 py-2 bg-card text-foreground focus:ring-2 focus:ring-ring/40 focus:border-ring"
                    >
                      <option value="">All Locations</option>
                      {filterOptions.locations.map(location => (
                        <option key={location} value={location}>{location}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Employment Type
                    </label>
                    <select
                      value={filters.employmentType}
                      onChange={(e) => handleFilterChange('employmentType', e.target.value)}
                      className="w-full border border-border rounded-sm px-3 py-2 bg-card text-foreground focus:ring-2 focus:ring-ring/40 focus:border-ring"
                    >
                      <option value="">All Types</option>
                      {filterOptions.employmentTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Closing Date
                    </label>
                    <select
                      value={filters.closingDate}
                      onChange={(e) => handleFilterChange('closingDate', e.target.value)}
                      className="w-full border border-border rounded-sm px-3 py-2 bg-card text-foreground focus:ring-2 focus:ring-ring/40 focus:border-ring"
                    >
                      <option value="">Any Time</option>
                      <option value="7">Next 7 days</option>
                      <option value="14">Next 14 days</option>
                      <option value="30">Next 30 days</option>
                    </select>
                  </div>
                </div>

                {/* Clear Filters */}
                {Object.values(filters).some(v => v) && (
                  <div className="mt-4">
                    <button
                      onClick={clearFilters}
                      className="text-sm text-primary hover:text-primary/80"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-sm">
            <div className="flex">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error Loading Jobs</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <button
                  onClick={fetchJobs}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Job Listings */}
        {jobs.length === 0 ? (
          <EmptyState
            icon={BriefcaseIcon}
            title="No internal job openings found"
            description={
              Object.values(filters).some(v => v)
                ? 'Try adjusting your filters to see more results.'
                : 'Check back later for new opportunities.'
            }
            action={Object.values(filters).some(v => v) ? {
              label: 'Clear Filters',
              onClick: clearFilters,
            } : undefined}
          />
        ) : (
          <>
            {viewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            ) : (
              <JobTable />
            )}

            {/* Pagination Controls */}
            {allJobs.length >= INTERNAL_PAGE_SIZE && (
              <div className="flex items-center justify-between pt-6">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage + 1}
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                    disabled={currentPage === 0}
                    className="px-3 py-1 text-sm rounded-full border border-border text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-full">
                    {currentPage + 1}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={allJobs.length < INTERNAL_PAGE_SIZE}
                    className="px-3 py-1 text-sm rounded-full border border-border text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PageWrapper>
  );
}