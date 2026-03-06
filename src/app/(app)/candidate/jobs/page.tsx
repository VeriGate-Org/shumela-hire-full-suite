'use client';

import { useState, useEffect, useCallback } from 'react';
import PageWrapper from '@/components/PageWrapper';
import EmptyState from '@/components/EmptyState';
import { apiFetch } from '@/lib/api-fetch';
import StatusPill from '@/components/StatusPill';
import { getEnumLabel } from '@/utils/enumLabels';
import {
  BriefcaseIcon,
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  BookmarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  StarIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowRightIcon,
  EyeIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import {
  BookmarkIcon as BookmarkIconSolid,
  StarIcon as StarIconSolid
} from '@heroicons/react/24/solid';

interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  department: string;
  location: string;
  jobType: 'full_time' | 'part_time' | 'contract' | 'internship' | 'remote' | 'hybrid';
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
  postedDate: string;
  applicationDeadline?: string;
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  description: string;
  responsibilities: string[];
  requirements: string[];
  qualifications: string[];
  benefits: string[];
  skills: string[];
  tags: string[];
  companySize: string;
  industry: string;
  rating?: number;
  reviewCount?: number;
  applicantCount?: number;
  isRemote: boolean;
  isUrgent?: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
  isEasyApply?: boolean;
  savedByUser?: boolean;
  matchScore?: number;
  contactPerson?: {
    name: string;
    title: string;
    email: string;
  };
}

export default function BrowseJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('all');
  const [experienceLevelFilter, setExperienceLevelFilter] = useState('all');
  const [salaryMinFilter, setSalaryMinFilter] = useState('');
  const [remoteOnlyFilter, setRemoteOnlyFilter] = useState(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'salary' | 'company'>('relevance');
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/job-postings/published?size=50');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      const postings = result.content || result.data || result || [];
      const mapped: Job[] = postings.map((p: any) => ({
        id: p.id,
        title: p.title || '',
        company: 'ShumelaHire',
        department: p.department || '',
        location: p.location || '',
        jobType: (p.employmentType || 'full_time').toLowerCase().replace('-', '_') as Job['jobType'],
        experienceLevel: (p.experienceLevel || 'mid').toLowerCase() as Job['experienceLevel'],
        postedDate: p.publishedAt || p.createdAt || new Date().toISOString(),
        applicationDeadline: p.applicationDeadline,
        salaryRange: p.salaryMin != null ? { min: p.salaryMin, max: p.salaryMax, currency: 'ZAR' } : undefined,
        description: p.description || '',
        responsibilities: p.responsibilities ? (typeof p.responsibilities === 'string' ? p.responsibilities.split('\n').filter(Boolean) : p.responsibilities) : [],
        requirements: p.requirements ? (typeof p.requirements === 'string' ? p.requirements.split('\n').filter(Boolean) : p.requirements) : [],
        qualifications: p.qualifications ? (typeof p.qualifications === 'string' ? p.qualifications.split('\n').filter(Boolean) : p.qualifications) : [],
        benefits: p.benefits ? (typeof p.benefits === 'string' ? p.benefits.split('\n').filter(Boolean) : p.benefits) : [],
        skills: p.skills || p.requiredSkills || [],
        tags: p.tags || [],
        companySize: '',
        industry: '',
        applicantCount: p.applicationsCount || 0,
        isRemote: p.remoteWorkAllowed || false,
        isUrgent: p.urgent || false,
        isFeatured: p.featured || false,
        isNew: p.publishedAt ? (Date.now() - new Date(p.publishedAt).getTime()) < 7 * 24 * 60 * 60 * 1000 : false,
      }));
      setJobs(mapped);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterJobs = useCallback(() => {
    const filtered = jobs.filter(job => {
      const matchesSearch = searchTerm === '' ||
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase())) ||
        job.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesLocation = locationFilter === '' ||
        job.location.toLowerCase().includes(locationFilter.toLowerCase()) ||
        (job.isRemote && locationFilter.toLowerCase().includes('remote'));

      const matchesJobType = jobTypeFilter === 'all' || job.jobType === jobTypeFilter;
      const matchesExperience = experienceLevelFilter === 'all' || job.experienceLevel === experienceLevelFilter;
      const matchesSalary = salaryMinFilter === '' ||
        (job.salaryRange && job.salaryRange.min >= parseInt(salaryMinFilter));
      const matchesRemote = !remoteOnlyFilter || job.isRemote;

      return matchesSearch && matchesLocation && matchesJobType && matchesExperience && matchesSalary && matchesRemote;
    });

    // Sort filtered jobs
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'relevance':
          return (b.matchScore || 0) - (a.matchScore || 0);
        case 'date':
          return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
        case 'salary':
          return (b.salaryRange?.max || 0) - (a.salaryRange?.max || 0);
        case 'company':
          return a.company.localeCompare(b.company);
        default:
          return 0;
      }
    });

    setFilteredJobs(filtered);
  }, [jobs, searchTerm, locationFilter, jobTypeFilter, experienceLevelFilter, salaryMinFilter, remoteOnlyFilter, sortBy]);

  useEffect(() => {
    filterJobs();
  }, [jobs, searchTerm, locationFilter, jobTypeFilter, experienceLevelFilter, salaryMinFilter, remoteOnlyFilter, sortBy, filterJobs]);

  const toggleSaveJob = (jobId: string) => {
    setSavedJobs(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const getDaysAgo = (date: string) => {
    const today = new Date();
    const postedDate = new Date(date);
    const diffTime = today.getTime() - postedDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  const actions = (
    <div className="flex items-center gap-3">
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search jobs, companies, skills..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400 w-80"
        />
      </div>
      
      <input
        type="text"
        placeholder="Location"
        value={locationFilter}
        onChange={(e) => setLocationFilter(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400 w-40"
      />
      
      <button className="flex items-center px-3 py-2 border border-gray-300 rounded-full hover:bg-gray-50 text-foreground">
        <FunnelIcon className="w-4 h-4 mr-2" />
        Filters
      </button>
      
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value as any)}
        className="px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
      >
        <option value="relevance">Most Relevant</option>
        <option value="date">Most Recent</option>
        <option value="salary">Highest Salary</option>
        <option value="company">Company A-Z</option>
      </select>
    </div>
  );

  if (loading) {
    return (
      <PageWrapper title="Browse Jobs" subtitle="Loading available positions..." actions={actions}>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gold-500"></div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Browse Jobs"
      subtitle={`${filteredJobs.length} jobs found matching your criteria`}
      actions={actions}
    >
      <div className="space-y-6">
        {/* Filter Bar */}
        <div className="bg-white rounded-sm shadow p-4">
          <div className="flex flex-wrap items-center gap-4">
            <select
              value={jobTypeFilter}
              onChange={(e) => setJobTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-sm text-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
            >
              <option value="all">All Types</option>
              <option value="full_time">Full Time</option>
              <option value="part_time">Part Time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
            </select>

            <select
              value={experienceLevelFilter}
              onChange={(e) => setExperienceLevelFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-sm text-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
            >
              <option value="all">All Levels</option>
              <option value="entry">Entry Level</option>
              <option value="mid">Mid Level</option>
              <option value="senior">Senior Level</option>
              <option value="executive">Executive</option>
            </select>

            <input
              type="number"
              placeholder="Min Salary"
              value={salaryMinFilter}
              onChange={(e) => setSalaryMinFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-sm text-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400 w-32"
            />

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={remoteOnlyFilter}
                onChange={(e) => setRemoteOnlyFilter(e.target.checked)}
                className="rounded border-gray-300 text-gold-600 focus:ring-gold-500/60"
              />
              <span className="ml-2 text-sm text-gray-700">Remote Only</span>
            </label>

            <div className="flex items-center ml-auto">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-sm ${viewMode === 'list' ? 'bg-gold-100 text-gold-600' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 000 2h1a1 1 0 000-2H3zM3 8a1 1 0 000 2h1a1 1 0 000-2H3zM3 12a1 1 0 100 2h1a1 1 0 100-2H3zM7 4a1 1 0 000 2h9a1 1 0 100-2H7zM7 8a1 1 0 000 2h9a1 1 0 100-2H7zM7 12a1 1 0 000 2h9a1 1 0 100-2H7z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-sm ml-2 ${viewMode === 'grid' ? 'bg-gold-100 text-gold-600' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Jobs List/Grid */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredJobs.map((job) => (
            <div key={job.id} className="bg-white rounded-sm shadow border hover:shadow-md transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-violet-600 rounded-sm flex items-center justify-center flex-shrink-0">
                        <BuildingOfficeIcon className="w-6 h-6 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 truncate">{job.title}</h3>
                            <p className="text-base text-gold-600 font-medium">{job.company}</p>
                            <div className="flex items-center space-x-2 mt-1 text-sm text-gray-600">
                              <MapPinIcon className="w-4 h-4" />
                              <span>{job.location}</span>
                              <span>•</span>
                              <span>{getDaysAgo(job.postedDate)}</span>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => toggleSaveJob(job.id)}
                            className="p-2 hover:bg-gray-100 rounded-full"
                          >
                            {savedJobs.includes(job.id) ? (
                              <BookmarkIconSolid className="w-5 h-5 text-gold-600" />
                            ) : (
                              <BookmarkIcon className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-3">
                          <StatusPill value={job.jobType} domain="employmentType" size="sm" />
                          <StatusPill value={job.experienceLevel} domain="experienceLevel" size="sm" />
                          {job.isNew && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              NEW
                            </span>
                          )}
                          {job.isUrgent && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              URGENT
                            </span>
                          )}
                          {job.isFeatured && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <StarIcon className="w-3 h-3 mr-1" />
                              FEATURED
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-gray-700 line-clamp-2">{job.description}</p>
                  
                  {job.salaryRange && (
                    <div className="flex items-center text-sm text-gray-600">
                      <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                      R{job.salaryRange.min.toLocaleString()} - R{job.salaryRange.max.toLocaleString()} {job.salaryRange.currency}
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-1">
                    {job.skills.slice(0, 4).map((skill, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-sm text-xs font-medium bg-gray-100 text-gray-700">
                        {skill}
                      </span>
                    ))}
                    {job.skills.length > 4 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-sm text-xs font-medium bg-gray-100 text-gray-700">
                        +{job.skills.length - 4} more
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between pt-3">
                    <div className="flex items-center space-x-4">
                      {job.rating && (
                        <div className="flex items-center text-sm text-gray-600">
                          <StarIconSolid className="w-4 h-4 text-yellow-400 mr-1" />
                          {job.rating} ({job.reviewCount?.toLocaleString()})
                        </div>
                      )}
                      
                      {job.matchScore && (
                        <div className="flex items-center text-sm text-green-600">
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          {job.matchScore}% match
                        </div>
                      )}
                      
                      {job.applicantCount && (
                        <div className="flex items-center text-sm text-gray-500">
                          <UserGroupIcon className="w-4 h-4 mr-1" />
                          {job.applicantCount} applicants
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedJob(job)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <EyeIcon className="w-4 h-4 mr-2" />
                        View Details
                      </button>
                      
                      <button className="inline-flex items-center px-3 py-2 bg-transparent border-2 border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider rounded-full text-sm font-medium">
                        {job.isEasyApply ? (
                          <>
                            <CheckCircleIcon className="w-4 h-4 mr-2" />
                            Easy Apply
                          </>
                        ) : (
                          <>
                            <ArrowRightIcon className="w-4 h-4 mr-2" />
                            Apply
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredJobs.length === 0 && (
          <EmptyState
            icon={BriefcaseIcon}
            title="No jobs found"
            description="Try adjusting your search criteria or filters to find more opportunities."
          />
        )}

        {/* Job Details Modal */}
        {selectedJob && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-sm shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-violet-600 rounded-sm flex items-center justify-center">
                      <BuildingOfficeIcon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedJob.title}</h2>
                      <p className="text-lg text-gold-600 font-medium mt-1">{selectedJob.company}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <span className="flex items-center">
                          <MapPinIcon className="w-4 h-4 mr-1" />
                          {selectedJob.location}
                        </span>
                        <span className="flex items-center">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          {getDaysAgo(selectedJob.postedDate)}
                        </span>
                        {selectedJob.applicationDeadline && (
                          <span className="flex items-center text-red-600">
                            <CalendarIcon className="w-4 h-4 mr-1" />
                            Deadline: {new Date(selectedJob.applicationDeadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedJob(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Description</h3>
                      <p className="text-sm text-gray-700">{selectedJob.description}</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Responsibilities</h3>
                      <ul className="space-y-2">
                        {selectedJob.responsibilities.map((resp, index) => (
                          <li key={index} className="flex items-start text-sm text-gray-700">
                            <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            {resp}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h3>
                      <ul className="space-y-2">
                        {selectedJob.requirements.map((req, index) => (
                          <li key={index} className="flex items-start text-sm text-gray-700">
                            <CheckCircleIcon className="w-4 h-4 text-violet-500 mr-2 mt-0.5 flex-shrink-0" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Preferred Qualifications</h3>
                      <ul className="space-y-2">
                        {selectedJob.qualifications.map((qual, index) => (
                          <li key={index} className="flex items-start text-sm text-gray-700">
                            <CheckCircleIcon className="w-4 h-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                            {qual}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Details</h3>
                      <div className="bg-gray-50 rounded-sm p-4 space-y-3">
                        <div className="flex justify-between">
                          <span className="font-medium">Department:</span>
                          <span>{selectedJob.department}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Job Type:</span>
                          <span>{getEnumLabel('employmentType', selectedJob.jobType)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Experience Level:</span>
                          <span className="capitalize">{selectedJob.experienceLevel}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Company Size:</span>
                          <span>{selectedJob.companySize}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Industry:</span>
                          <span>{selectedJob.industry}</span>
                        </div>
                        {selectedJob.salaryRange && (
                          <div className="flex justify-between">
                            <span className="font-medium">Salary Range:</span>
                            <span>R{selectedJob.salaryRange.min.toLocaleString()} - R{selectedJob.salaryRange.max.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Skills & Technologies</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedJob.skills.map((skill, index) => (
                          <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gold-100 text-gold-800">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Benefits & Perks</h3>
                      <ul className="space-y-2">
                        {selectedJob.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-start text-sm text-gray-700">
                            <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {selectedJob.rating && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Company Rating</h3>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <StarIconSolid
                                key={i}
                                className={`w-5 h-5 ${
                                  i < Math.floor(selectedJob.rating!)
                                    ? 'text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-lg font-medium">{selectedJob.rating}</span>
                          <span className="text-sm text-gray-500">({selectedJob.reviewCount?.toLocaleString()} reviews)</span>
                        </div>
                      </div>
                    )}

                    {selectedJob.contactPerson && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Person</h3>
                        <div className="bg-gray-50 rounded-sm p-4">
                          <p className="font-medium">{selectedJob.contactPerson.name}</p>
                          <p className="text-sm text-gray-600">{selectedJob.contactPerson.title}</p>
                          <p className="text-sm text-gray-600">{selectedJob.contactPerson.email}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center mt-6 pt-6 border-t">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => toggleSaveJob(selectedJob.id)}
                      className={`flex items-center px-4 py-2 border rounded-full ${
                        savedJobs.includes(selectedJob.id)
                          ? 'bg-gold-50 border-violet-300 text-violet-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {savedJobs.includes(selectedJob.id) ? (
                        <BookmarkIconSolid className="w-4 h-4 mr-2" />
                      ) : (
                        <BookmarkIcon className="w-4 h-4 mr-2" />
                      )}
                      {savedJobs.includes(selectedJob.id) ? 'Saved' : 'Save Job'}
                    </button>
                    
                    <button className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50">
                      <ShareIcon className="w-4 h-4 mr-2" />
                      Share
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setSelectedJob(null)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-full hover:bg-gray-700"
                    >
                      Close
                    </button>
                    
                    <button className="flex items-center px-6 py-2 bg-gold-500 text-violet-950 rounded-full hover:bg-gold-600">
                      {selectedJob.isEasyApply ? (
                        <>
                          <CheckCircleIcon className="w-4 h-4 mr-2" />
                          Easy Apply
                        </>
                      ) : (
                        <>
                          <ArrowRightIcon className="w-4 h-4 mr-2" />
                          Apply Now
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
