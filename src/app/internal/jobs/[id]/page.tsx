'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  ShareIcon,
  BookmarkIcon,
  MapPinIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  EyeIcon,
  UserGroupIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { formatSalaryRange } from '@/utils/currency';

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

interface ApiResponse {
  success: boolean;
  data?: InternalJobAd;
  message?: string;
  error?: string;
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

export default function InternalJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const jobId = params.id as string;
  
  const [job, setJob] = useState<InternalJobAd | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, router]);

  // Fetch job details
  useEffect(() => {
    if (!isAuthenticated || !jobId) return;

    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
        const response = await fetch(`${baseUrl}/ads/${jobId}`, {
          headers: {
            'Authorization': `Bearer ${user?.id}`, // Use proper JWT token in production
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Job not found');
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const apiResponse: ApiResponse = await response.json();
        
        if (!apiResponse.success || !apiResponse.data) {
          setError(apiResponse.error || 'Failed to load job details');
          return;
        }
        
        // Check if user has access to this job based on role
        const jobData = apiResponse.data;
        if (!jobData.channelInternal && user?.role === 'APPLICANT') {
          setError('You do not have access to this job posting');
          return;
        }
        
        setJob(jobData);
      } catch (err) {
        console.error('Error fetching job details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load job details');
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [isAuthenticated, user, jobId]);

  const handleApply = () => {
    if (!job) return;
    
    // Route to internal application flow with pre-authenticated context
    if (job.requisitionId) {
      router.push(`/internal/apply/${job.requisitionId}?jobId=${job.id}&source=internal`);
    } else {
      // Fallback to general application
      router.push(`/internal/apply/general?jobId=${job.id}&title=${encodeURIComponent(job.title)}`);
    }
  };

  const handleShare = async () => {
    if (!job) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: job.title,
          text: `Check out this internal job opportunity: ${job.title}`,
          url: window.location.href
        });
      } catch (err) {
        // User cancelled sharing
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
      alert('Job URL copied to clipboard!');
    }
  };

  const JobBadges = ({ job }: { job: InternalJobAd }) => {
    const isNew = isJobNew(job.createdAt);
    const isClosingSoon = isJobClosingSoon(job.closingDate);
    const isInternal = job.channelInternal;
    
    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {isNew && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <SparklesIcon className="w-4 h-4 mr-1" />
            New Posting
          </span>
        )}
        {isClosingSoon && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
            <ClockIcon className="w-4 h-4 mr-1" />
            Closing Soon
          </span>
        )}
        {isInternal && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-violet-100 text-violet-800">
            <UserGroupIcon className="w-4 h-4 mr-1" />
            Internal Opportunity
          </span>
        )}
        {job.channelExternal && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
            <EyeIcon className="w-4 h-4 mr-1" />
            Also External
          </span>
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
        <div className="text-gray-500">Loading job details...</div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-6">
            <ExclamationTriangleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h1>
            <p className="text-gray-600">
              {error || 'The job posting you\'re looking for doesn\'t exist or you don\'t have access to it.'}
            </p>
          </div>
          <Link href="/internal/jobs">
            <button className="inline-flex items-center px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 transition-colors">
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Job Board
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const daysLeft = getDaysUntilExpiry(job.closingDate);
  const isActive = job.status === 'PUBLISHED' && daysLeft > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <Link href="/internal/jobs">
                <button className="inline-flex items-center text-violet-600 hover:text-violet-800 transition-colors">
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Back to Job Board
                </button>
              </Link>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleShare}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <ShareIcon className="w-4 h-4 mr-2" />
                  Share
                </button>
                <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                  <BookmarkIcon className="w-4 h-4 mr-2" />
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Job Header */}
        <div className="bg-white rounded-lg shadow-lg mb-8">
          <div className="p-8">
            <JobBadges job={job} />
            
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{job.title}</h1>
              
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 mb-4">
                {job.companyName && (
                  <div className="flex items-center">
                    <BuildingOfficeIcon className="w-4 h-4 mr-2" />
                    {job.companyName}
                  </div>
                )}
                
                {job.department && (
                  <div className="flex items-center">
                    <span className="font-medium">{job.department}</span>
                  </div>
                )}
                
                {job.location && (
                  <div className="flex items-center">
                    <MapPinIcon className="w-4 h-4 mr-2" />
                    {job.location}
                  </div>
                )}
                
                {job.employmentType && (
                  <div className="flex items-center">
                    <BriefcaseIcon className="w-4 h-4 mr-2" />
                    {job.employmentType}
                  </div>
                )}
                
                {job.closingDate && (
                  <div className="flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Closes {new Date(job.closingDate).toLocaleDateString()}
                  </div>
                )}
              </div>

              {(job.salaryRangeMin || job.salaryRangeMax) && (
                <div className="flex items-center text-lg font-semibold text-green-600 mb-4">
                  <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                  {formatSalaryRange(job.salaryRangeMin, job.salaryRangeMax)}
                </div>
              )}

              {daysLeft > 0 && daysLeft <= 7 && (
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800 mb-4">
                  ⏰ {daysLeft} day{daysLeft !== 1 ? 's' : ''} left to apply
                </div>
              )}
            </div>

            {/* Apply Now Section */}
            {isActive && (
              <div className="mb-8 p-6 bg-violet-50 rounded-lg border border-violet-200">
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-violet-900 mb-2">Ready to Apply?</h2>
                  <p className="text-violet-700 mb-4">
                    As an internal candidate, you have priority access to this opportunity.
                  </p>
                  <button
                    onClick={handleApply}
                    className="inline-flex items-center px-6 py-3 bg-violet-600 text-white text-lg font-medium rounded-lg hover:bg-violet-700 transition-colors"
                  >
                    <PaperAirplaneIcon className="w-5 h-5 mr-2" />
                    Apply Now (Internal)
                  </button>
                </div>
              </div>
            )}

            {/* Expired Job Notice */}
            {!isActive && (
              <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-800">
                      <strong>This job posting has expired.</strong> Applications are no longer being accepted.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Job Description */}
            <div className="prose prose-lg max-w-none">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Description</h3>
              <div dangerouslySetInnerHTML={{ __html: job.htmlBody }} />
            </div>
          </div>
        </div>

        {/* Internal Application Benefits */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Internal Application Benefits</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center">
                  <UserGroupIcon className="w-4 h-4 text-violet-600" />
                </div>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-gray-900">Priority Consideration</h4>
                <p className="text-sm text-gray-600">Internal candidates receive priority in the review process</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <ClockIcon className="w-4 h-4 text-green-600" />
                </div>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-gray-900">Faster Process</h4>
                <p className="text-sm text-gray-600">Streamlined application and interview process</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <BuildingOfficeIcon className="w-4 h-4 text-purple-600" />
                </div>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-gray-900">Career Development</h4>
                <p className="text-sm text-gray-600">Opportunity for growth within the organization</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <EyeIcon className="w-4 h-4 text-orange-600" />
                </div>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-gray-900">Company Knowledge</h4>
                <p className="text-sm text-gray-600">Your existing company knowledge is valued</p>
              </div>
            </div>
          </div>
        </div>

        {/* Job Stats */}
        {(job.applicationCount !== undefined || job.viewCount !== undefined) && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              {job.viewCount !== undefined && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-violet-600">{job.viewCount}</div>
                  <div className="text-sm text-gray-600">Total Views</div>
                </div>
              )}
              {job.applicationCount !== undefined && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{job.applicationCount}</div>
                  <div className="text-sm text-gray-600">Applications</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}