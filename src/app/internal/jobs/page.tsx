'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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

// Types for internal job data
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
  companyName?: string;
  applicationCount?: number;
  viewCount?: number;
}

interface JobFilters {
  department: string;
  location: string;
  employmentType: string;
  closingDate: string;
  search: string;
}

interface ApiResponse {
  success: boolean;
  data?: {
    content: InternalJobAd[];
    totalElements: number;
    totalPages: number;
    numberOfElements: number;
  };
  message?: string;
  error?: string;
}

// Utility functions
const formatSalaryRange = (min?: number, max?: number): string => {
  if (!min && !max) return 'Competitive salary';
  if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  if (min) return `$${min.toLocaleString()}+`;
  if (max) return `Up to $${max.toLocaleString()}`;
  return 'Competitive salary';
};

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

const stripHtmlTags = (html: string): string => {
  return html.replace(/<[^>]*>/g, '').trim();
};

export default function InternalJobsBoard() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [jobs, setJobs] = useState<InternalJobAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalJobs, setTotalJobs] = useState(0);
  
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
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, router]);

  const generateDemoJobs = (): InternalJobAd[] => {
    const titles = [
      'Senior Software Engineer', 'HR Business Partner', 'Financial Analyst',
      'Marketing Manager', 'Product Designer', 'Data Engineer',
      'Operations Coordinator', 'Legal Counsel', 'Sales Executive',
      'DevOps Engineer', 'Talent Acquisition Specialist', 'Project Manager',
    ];
    const departments = ['Engineering', 'Human Resources', 'Finance', 'Marketing', 'Product', 'Operations', 'Legal', 'Sales'];
    const locations = ['Johannesburg', 'Cape Town', 'Pretoria', 'Durban', 'Remote'];
    const types = ['Full-time', 'Part-time', 'Contract', 'Internship'];

    return titles.map((title, i) => {
      const created = new Date();
      created.setDate(created.getDate() - Math.floor(Math.random() * 14));
      const closing = new Date();
      closing.setDate(closing.getDate() + Math.floor(Math.random() * 30) + 3);
      const dept = departments[i % departments.length];

      return {
        id: i + 1,
        requisitionId: 1000 + i,
        title,
        htmlBody: `<p>We are looking for a talented ${title} to join our ${dept} team. This is an exciting opportunity to grow your career internally.</p>`,
        channelInternal: true,
        channelExternal: i % 3 === 0,
        status: 'PUBLISHED' as const,
        closingDate: closing.toISOString(),
        slug: title.toLowerCase().replace(/\s+/g, '-'),
        createdBy: 'HR Team',
        createdAt: created.toISOString(),
        updatedAt: created.toISOString(),
        department: dept,
        location: locations[Math.floor(Math.random() * locations.length)],
        employmentType: types[i % types.length],
        salaryRangeMin: (Math.floor(Math.random() * 20) + 15) * 10000,
        salaryRangeMax: (Math.floor(Math.random() * 20) + 40) * 10000,
        applicationCount: Math.floor(Math.random() * 25),
        viewCount: Math.floor(Math.random() * 200) + 20,
      };
    });
  };

  const loadDemoJobs = useCallback(() => {
    const demoJobs = generateDemoJobs();
    setJobs(demoJobs);
    setTotalJobs(demoJobs.length);
    setFilterOptions({
      departments: [...new Set(demoJobs.map(j => j.department).filter(Boolean))] as string[],
      locations: [...new Set(demoJobs.map(j => j.location).filter(Boolean))] as string[],
      employmentTypes: [...new Set(demoJobs.map(j => j.employmentType).filter(Boolean))] as string[],
    });
  }, []);

  // Fetch jobs from backend (or use demo data when API not configured)
  const fetchJobs = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    // Use demo data when backend API URL is not configured
    if (!baseUrl) {
      loadDemoJobs();
      setLoading(false);
      return;
    }

    try {
      const url = new URL('/ads', baseUrl);

      url.searchParams.set('status', 'PUBLISHED');
      url.searchParams.set('channel', 'internal');

      if (filters.search) url.searchParams.set('q', filters.search);
      if (filters.department) url.searchParams.set('department', filters.department);
      if (filters.location) url.searchParams.set('location', filters.location);
      if (filters.employmentType) url.searchParams.set('employmentType', filters.employmentType);
      if (filters.closingDate) url.searchParams.set('closingDate', filters.closingDate);

      url.searchParams.set('size', '50');
      url.searchParams.set('sort', 'createdAt,desc');

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${user?.id}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiResponse: ApiResponse = await response.json();

      if (!apiResponse.success || !apiResponse.data) {
        throw new Error(apiResponse.error || 'Failed to fetch jobs');
      }

      const filteredJobs = apiResponse.data.content.filter(job => {
        if (job.channelInternal) return true;
        if (job.channelExternal) return user?.role !== 'APPLICANT';
        return false;
      });

      setJobs(filteredJobs);
      setTotalJobs(apiResponse.data.totalElements);

      setFilterOptions({
        departments: [...new Set(filteredJobs.map(job => job.department).filter(Boolean))] as string[],
        locations: [...new Set(filteredJobs.map(job => job.location).filter(Boolean))] as string[],
        employmentTypes: [...new Set(filteredJobs.map(job => job.employmentType).filter(Boolean))] as string[],
      });
    } catch (err) {
      console.error('Error fetching jobs:', err);
      loadDemoJobs();
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, filters, loadDemoJobs]);

  // Fetch jobs on mount and filter changes
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

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
    // Route to internal application flow with pre-authenticated context
    if (job.requisitionId) {
      router.push(`/internal/apply/${job.requisitionId}?jobId=${job.id}&source=internal`);
    } else {
      // Fallback to general application
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
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-800">
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
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 p-6">
        <JobBadges job={job} />
        
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{job.title}</h3>
          <p className="text-gray-600 text-sm mb-3">{description}</p>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
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
            <div className="flex items-center text-sm text-gray-500 mb-4">
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
          <Link href={`/internal/jobs/${job.id}`}>
            <button className="text-violet-600 hover:text-violet-800 text-sm font-medium">
              View Details
            </button>
          </Link>
          
          {daysLeft > 0 && (
            <button
              onClick={() => handleApply(job)}
              className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Apply Now
            </button>
          )}
        </div>
        
        {(job.applicationCount !== undefined || job.viewCount !== undefined) && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-xs text-gray-500">
            {job.viewCount !== undefined && <span>{job.viewCount} views</span>}
            {job.applicationCount !== undefined && <span>{job.applicationCount} applications</span>}
          </div>
        )}
      </div>
    );
  };

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading internal job board...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Internal Job Board</h1>
                <p className="text-gray-600 mt-1">
                  Browse internal opportunities and advance your career
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                >
                  {viewMode === 'cards' ? 'Table View' : 'Card View'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            {/* Search Bar */}
            <div className="relative mb-4">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs by title, keywords, or description..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
              />
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <FunnelIcon className="w-4 h-4 mr-2" />
                Filters
                {Object.values(filters).some(v => v) && (
                  <span className="ml-2 px-2 py-1 bg-violet-100 text-violet-800 text-xs rounded-full">
                    Active
                  </span>
                )}
              </button>

              <div className="text-sm text-gray-600">
                Showing {jobs.length} of {totalJobs} jobs
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <select
                      value={filters.department}
                      onChange={(e) => handleFilterChange('department', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
                    >
                      <option value="">All Departments</option>
                      {filterOptions.departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <select
                      value={filters.location}
                      onChange={(e) => handleFilterChange('location', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
                    >
                      <option value="">All Locations</option>
                      {filterOptions.locations.map(location => (
                        <option key={location} value={location}>{location}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employment Type
                    </label>
                    <select
                      value={filters.employmentType}
                      onChange={(e) => handleFilterChange('employmentType', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
                    >
                      <option value="">All Types</option>
                      {filterOptions.employmentTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Closing Date
                    </label>
                    <select
                      value={filters.closingDate}
                      onChange={(e) => handleFilterChange('closingDate', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
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
                      className="text-sm text-violet-600 hover:text-violet-800"
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
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-md">
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
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">
              No internal job openings found
            </div>
            <p className="text-gray-400 mb-4">
              {Object.values(filters).some(v => v) 
                ? 'Try adjusting your filters to see more results'
                : 'Check back later for new opportunities'
              }
            </p>
            {Object.values(filters).some(v => v) && (
              <button
                onClick={clearFilters}
                className="text-violet-600 hover:text-violet-800"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className={`${viewMode === 'cards' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}`}>
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}