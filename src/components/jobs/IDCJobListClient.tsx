'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import type { BackendJobAd } from './types';
import {
  MapPinIcon,
  BriefcaseIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

interface Props {
  jobs: BackendJobAd[];
}

export default function IDCJobListClient({ jobs }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filteredJobs = useMemo(() => {
    let filtered = jobs;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          (j.companyName ?? '').toLowerCase().includes(q) ||
          (j.department ?? '').toLowerCase().includes(q)
      );
    }

    if (locationFilter) {
      const loc = locationFilter.toLowerCase();
      filtered = filtered.filter((j) =>
        (j.location ?? '').toLowerCase().includes(loc)
      );
    }

    if (departmentFilter) {
      const dep = departmentFilter.toLowerCase();
      filtered = filtered.filter((j) =>
        (j.department ?? '').toLowerCase().includes(dep)
      );
    }

    if (employmentTypeFilter) {
      filtered = filtered.filter((j) => j.employmentType === employmentTypeFilter);
    }

    return filtered;
  }, [jobs, searchTerm, locationFilter, departmentFilter, employmentTypeFilter]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setLocationFilter('');
    setDepartmentFilter('');
    setEmploymentTypeFilter('');
  }, []);

  const hasFilters = searchTerm || locationFilter || departmentFilter || employmentTypeFilter;

  const getDaysUntilExpiry = (closingDate?: string) => {
    if (!closingDate) return null;
    const diff = new Date(closingDate).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // Derive unique locations/departments for dropdowns
  const locations = useMemo(
    () => [...new Set(jobs.map((j) => j.location).filter(Boolean))].sort() as string[],
    [jobs]
  );
  const departments = useMemo(
    () => [...new Set(jobs.map((j) => j.department).filter(Boolean))].sort() as string[],
    [jobs]
  );

  return (
    <>
      {/* Hero */}
      <div className="bg-[#05527E] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-4xl font-bold tracking-[-0.04em] mb-4">
            Career Opportunities
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
            Join the Industrial Development Corporation and contribute to the
            economic growth and industrial development of South Africa.
          </p>
          <div className="mt-6 text-sm text-white/60 uppercase tracking-[0.05em]">
            {jobs.length} open position{jobs.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Search and Filters */}
        <div className="bg-white rounded-[2px] shadow p-6 mb-8">
          {/* Search */}
          <div className="relative mb-4">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search by title, company or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-[2px] focus:ring-2 focus:ring-[#05527E]/30 focus:border-[#05527E] text-[#1E293B]"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50 text-sm text-[#1E293B]"
            >
              <FunnelIcon className="w-4 h-4 mr-2" />
              Filters
              {hasFilters && (
                <span className="ml-2 px-2 py-0.5 bg-[#F1C54B]/20 text-[#05527E] text-xs rounded-full font-medium">
                  Active
                </span>
              )}
            </button>

            <span className="text-sm text-[#64748B]">
              Showing {filteredJobs.length} of {jobs.length}
            </span>
          </div>

          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#64748B] uppercase tracking-[0.05em] mb-2">
                    Location
                  </label>
                  <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-[2px] px-3 py-2 text-sm text-[#1E293B]"
                  >
                    <option value="">All Locations</option>
                    {locations.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#64748B] uppercase tracking-[0.05em] mb-2">
                    Department
                  </label>
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-[2px] px-3 py-2 text-sm text-[#1E293B]"
                  >
                    <option value="">All Departments</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#64748B] uppercase tracking-[0.05em] mb-2">
                    Employment Type
                  </label>
                  <select
                    value={employmentTypeFilter}
                    onChange={(e) => setEmploymentTypeFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-[2px] px-3 py-2 text-sm text-[#1E293B]"
                  >
                    <option value="">All Types</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
              </div>

              {hasFilters && (
                <div className="mt-4">
                  <button
                    onClick={clearFilters}
                    className="text-sm text-[#05527E] hover:text-[#05527E]/80"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Job cards */}
        {filteredJobs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[#64748B] text-lg mb-4">
              {jobs.length === 0
                ? 'No positions available at the moment'
                : 'No positions match your search criteria'}
            </p>
            {jobs.length > 0 && (
              <button
                onClick={clearFilters}
                className="text-[#05527E] hover:text-[#05527E]/80 text-sm"
              >
                Clear filters to see all positions
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => {
              const daysLeft = getDaysUntilExpiry(job.closingDate);

              return (
                <div
                  key={job.id}
                  className="bg-white rounded-[2px] shadow hover:shadow-md transition-shadow border border-gray-200"
                >
                  <div className="p-6 flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/jobs/${job.slug}`}
                        className="text-xl font-bold text-[#0F172A] hover:text-[#05527E] tracking-[-0.03em] transition-colors"
                      >
                        {job.title}
                      </Link>

                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-[#64748B]">
                        {job.department && <span>{job.department}</span>}
                        {job.location && (
                          <span className="inline-flex items-center">
                            <MapPinIcon className="w-4 h-4 mr-1" />
                            {job.location}
                          </span>
                        )}
                        {job.employmentType && (
                          <span className="inline-flex items-center">
                            <BriefcaseIcon className="w-4 h-4 mr-1" />
                            {job.employmentType}
                          </span>
                        )}
                        {job.closingDate && (
                          <span className="inline-flex items-center">
                            <CalendarIcon className="w-4 h-4 mr-1" />
                            Closes {new Date(job.closingDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {daysLeft !== null && daysLeft <= 7 && daysLeft > 0 && (
                              <span className="ml-2 text-orange-600 font-medium">
                                ({daysLeft}d left)
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    <Link
                      href={`/jobs/${job.slug}`}
                      className="ml-6 shrink-0 inline-flex items-center px-6 py-2 bg-[#F1C54B] text-[#0F172A] text-sm font-medium uppercase tracking-[0.05em] rounded-full hover:bg-[#F1C54B]/90 transition-colors"
                    >
                      View Position
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
