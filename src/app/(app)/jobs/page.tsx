'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { JobAd, PublishingChannel, formatSalaryRange, isJobAdActive } from '@/types/jobAd';
import { jobAdService } from '@/services/jobAdService';
import { 
  MapPinIcon, 
  BriefcaseIcon, 
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  StarIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

const JobsPortalPage: React.FC = () => {
  const [jobs, setJobs] = useState<JobAd[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = [...jobs];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchLower) ||
        job.companyName.toLowerCase().includes(searchLower) ||
        job.intro.toLowerCase().includes(searchLower)
      );
    }

    // Location filter
    if (locationFilter) {
      filtered = filtered.filter(job =>
        job.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    // Department filter
    if (departmentFilter) {
      filtered = filtered.filter(job =>
        job.department?.toLowerCase().includes(departmentFilter.toLowerCase())
      );
    }

    // Employment type filter
    if (employmentTypeFilter) {
      filtered = filtered.filter(job => job.employmentType === employmentTypeFilter);
    }

    setFilteredJobs(filtered);
  }, [jobs, searchTerm, locationFilter, departmentFilter, employmentTypeFilter]);

  useEffect(() => {
    applyFilters();
  }, [jobs, searchTerm, locationFilter, departmentFilter, employmentTypeFilter, applyFilters]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch published external jobs
      const publishedJobs = await jobAdService.getPublishedJobAds(PublishingChannel.EXTERNAL);

      // Filter to only active jobs
      const activeJobs = publishedJobs.filter(isJobAdActive);

      setJobs(activeJobs);
    } catch {
      setError('Failed to load job listings');
    } finally {
      setLoading(false);
    }
  };

  const formatRelativeDate = (date: Date) => {
    const now = new Date();
    const diffTime = now.getTime() - new Date(date).getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const getDaysUntilExpiry = (expiresAt: Date) => {
    const now = new Date();
    const diffTime = new Date(expiresAt).getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading job listings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900">Join Our Team</h1>
              <p className="text-xl text-gray-600 mt-4">
                Discover exciting career opportunities and help us shape the future
              </p>
              <div className="mt-6 text-sm text-gray-500">
                {jobs.length} open position{jobs.length !== 1 ? 's' : ''} available
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="bg-white rounded-sm shadow p-6">
            {/* Search Bar */}
            <div className="relative mb-4">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs by title, company, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
              />
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50"
              >
                <FunnelIcon className="w-4 h-4 mr-2" />
                Filters
                {(locationFilter || departmentFilter || employmentTypeFilter) && (
                  <span className="ml-2 px-2 py-1 bg-gold-100 text-gold-800 text-xs rounded-full">
                    Active
                  </span>
                )}
              </button>

              <div className="text-sm text-gray-600">
                Showing {filteredJobs.length} of {jobs.length} jobs
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      placeholder="Enter location..."
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="w-full border border-gray-300 rounded-sm px-3 py-2 focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      placeholder="Enter department..."
                      value={departmentFilter}
                      onChange={(e) => setDepartmentFilter(e.target.value)}
                      className="w-full border border-gray-300 rounded-sm px-3 py-2 focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employment Type
                    </label>
                    <select
                      value={employmentTypeFilter}
                      onChange={(e) => setEmploymentTypeFilter(e.target.value)}
                      className="w-full border border-gray-300 rounded-sm px-3 py-2 focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
                    >
                      <option value="">All Types</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                    </select>
                  </div>
                </div>

                {/* Clear Filters */}
                {(locationFilter || departmentFilter || employmentTypeFilter || searchTerm) && (
                  <div className="mt-4">
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setLocationFilter('');
                        setDepartmentFilter('');
                        setEmploymentTypeFilter('');
                      }}
                      className="text-sm text-gold-600 hover:text-gold-800"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-sm">
            <div className="text-red-800">{error}</div>
          </div>
        )}

        {/* Job Listings */}
        {filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">
              {jobs.length === 0 ? 'No job openings available at the moment' : 'No jobs match your search criteria'}
            </div>
            {jobs.length > 0 && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setLocationFilter('');
                  setDepartmentFilter('');
                  setEmploymentTypeFilter('');
                }}
                className="text-gold-600 hover:text-gold-800"
              >
                Clear filters to see all jobs
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredJobs.map((job) => {
              const daysUntilExpiry = getDaysUntilExpiry(job.expiresAt);
              
              return (
                <div key={job.id} className="bg-white rounded-sm shadow hover:shadow-md transition-shadow border border-gray-200">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Link 
                            href={`/jobs/${job.slug}`}
                            className="hover:text-gold-600 transition-colors"
                          >
                            <h2 className="text-xl font-semibold text-gray-900 hover:text-gold-600">
                              {job.title}
                            </h2>
                          </Link>
                          {job.featured && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                              <StarIcon className="w-3 h-3 mr-1" />
                              Featured
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-6 text-sm text-gray-600 mb-3">
                          <div className="flex items-center">
                            <BuildingOfficeIcon className="w-4 h-4 mr-1" />
                            {job.companyName}
                          </div>
                          {job.department && (
                            <div className="flex items-center">
                              <span>{job.department}</span>
                            </div>
                          )}
                          <div className="flex items-center">
                            <MapPinIcon className="w-4 h-4 mr-1" />
                            {job.location}
                          </div>
                          <div className="flex items-center">
                            <BriefcaseIcon className="w-4 h-4 mr-1" />
                            {job.employmentType}
                          </div>
                        </div>

                        <div className="text-lg font-semibold text-green-600 mb-3">
                          {formatSalaryRange(job.salaryRangeMin, job.salaryRangeMax)}
                        </div>

                        <div 
                          className="text-gray-700 line-clamp-3 prose prose-sm max-w-none mb-4"
                          dangerouslySetInnerHTML={{ __html: job.intro }}
                        />

                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center space-x-4">
                            <span>Posted {formatRelativeDate(job.publishedAt || job.createdAt)}</span>
                            <div className="flex items-center">
                              <CalendarIcon className="w-4 h-4 mr-1" />
                              {daysUntilExpiry > 0 ? (
                                <span>{daysUntilExpiry} days left to apply</span>
                              ) : (
                                <span className="text-red-600">Expires today</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <span>{job.viewCount} views</span>
                            <span>{job.applicationCount} applications</span>
                          </div>
                        </div>
                      </div>

                      <div className="ml-6">
                        <Link href={`/jobs/${job.slug}`}>
                          <button className="bg-transparent border-2 border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider px-6 py-2 rounded-full font-medium transition-colors">
                            Apply Now
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500">
          <p>Don&apos;t see a perfect match? Send us your resume and we&apos;ll keep you in mind for future opportunities.</p>
          <p className="mt-2">
            <a href="mailto:careers@company.com" className="text-gold-600 hover:text-gold-800">
              careers@company.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default JobsPortalPage;