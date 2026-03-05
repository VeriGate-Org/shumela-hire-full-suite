'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api-fetch';
import PageWrapper from '@/components/PageWrapper';
import EmptyState from '@/components/EmptyState';
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
import { useToast } from '@/components/Toast';

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
  const { toast } = useToast();
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

        const response = await apiFetch(`/api/ads/${jobId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('Job not found');
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        // Backend wraps response in ApiResponse — unwrap the data field
        const jobData: InternalJobAd = result.data || result;
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

    if (job.requisitionId) {
      router.push(`/internal/apply/${job.requisitionId}?jobId=${job.id}&source=internal`);
    } else {
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
      } catch {
        // User cancelled sharing
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast('Job URL copied to clipboard', 'success');
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const headerActions = (
    <div className="flex items-center gap-2">
      <button
        onClick={handleShare}
        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-full text-sm hover:bg-gray-50 transition-colors"
      >
        <ShareIcon className="w-4 h-4 mr-1.5" />
        Share
      </button>
      <button
        onClick={() => {
          navigator.clipboard.writeText(window.location.href);
          toast('Job URL copied to clipboard', 'success');
        }}
        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-full text-sm hover:bg-gray-50 transition-colors"
      >
        <BookmarkIcon className="w-4 h-4 mr-1.5" />
        Copy Link
      </button>
      <Link href="/internal/jobs">
        <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-full text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          <ArrowLeftIcon className="w-4 h-4 mr-1.5" />
          Back
        </button>
      </Link>
    </div>
  );

  if (loading) {
    return (
      <PageWrapper title="Job Details" subtitle="Loading..." actions={headerActions}>
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
        </div>
      </PageWrapper>
    );
  }

  if (error || !job) {
    return (
      <PageWrapper title="Job Not Found" actions={headerActions}>
        <EmptyState
          icon={ExclamationTriangleIcon}
          title="Job Not Found"
          description={error || "The job posting you're looking for doesn't exist or you don't have access to it."}
          action={{ label: 'Back to Job Board', onClick: () => router.push('/internal/jobs') }}
        />
      </PageWrapper>
    );
  }

  const daysLeft = getDaysUntilExpiry(job.closingDate);
  const isActive = job.status === 'PUBLISHED' && daysLeft > 0;

  const JobBadges = () => {
    const isNew = isJobNew(job.createdAt);
    const closingSoon = isJobClosingSoon(job.closingDate);

    return (
      <div className="flex flex-wrap gap-2">
        {isNew && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <SparklesIcon className="w-3 h-3 mr-1" />
            New
          </span>
        )}
        {closingSoon && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            <ClockIcon className="w-3 h-3 mr-1" />
            Closing Soon
          </span>
        )}
        {job.channelInternal && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gold-100 text-gold-800">
            <UserGroupIcon className="w-3 h-3 mr-1" />
            Internal
          </span>
        )}
        {job.channelExternal && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <EyeIcon className="w-3 h-3 mr-1" />
            External
          </span>
        )}
      </div>
    );
  };

  return (
    <PageWrapper
      title={job.title}
      subtitle={[job.department, job.location, job.employmentType].filter(Boolean).join(' · ')}
      actions={headerActions}
    >
      <div className="space-y-6">
        {/* Job Header Card */}
        <div className="bg-white rounded-sm shadow border border-gray-200 p-6">
          <JobBadges />

          <div className="mt-4 flex flex-wrap items-center gap-6 text-sm text-gray-600">
            {job.companyName && (
              <div className="flex items-center">
                <BuildingOfficeIcon className="w-4 h-4 mr-1.5" />
                {job.companyName}
              </div>
            )}
            {job.location && (
              <div className="flex items-center">
                <MapPinIcon className="w-4 h-4 mr-1.5" />
                {job.location}
              </div>
            )}
            {job.employmentType && (
              <div className="flex items-center">
                <BriefcaseIcon className="w-4 h-4 mr-1.5" />
                {job.employmentType}
              </div>
            )}
            {job.closingDate && (
              <div className="flex items-center">
                <CalendarIcon className="w-4 h-4 mr-1.5" />
                Closes {new Date(job.closingDate).toLocaleDateString()}
              </div>
            )}
          </div>

          {(job.salaryRangeMin || job.salaryRangeMax) && (
            <div className="mt-3 flex items-center text-lg font-semibold text-green-600">
              <CurrencyDollarIcon className="w-5 h-5 mr-1.5" />
              {formatSalaryRange(job.salaryRangeMin, job.salaryRangeMax)}
            </div>
          )}

          {daysLeft > 0 && daysLeft <= 7 && (
            <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
              <ClockIcon className="w-3 h-3 mr-1" />
              {daysLeft} day{daysLeft !== 1 ? 's' : ''} left to apply
            </div>
          )}
        </div>

        {/* Apply Now */}
        {isActive && (
          <div className="bg-gold-50 border border-gold-200 rounded-sm p-6 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Ready to apply?</p>
              <p className="text-sm text-gray-600">As an internal candidate, you have priority access to this opportunity.</p>
            </div>
            <button
              onClick={handleApply}
              className="inline-flex items-center px-6 py-2.5 border-2 border-gold-500 text-sm font-medium rounded-full bg-transparent text-gold-500 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider transition-colors"
            >
              <PaperAirplaneIcon className="w-4 h-4 mr-2" />
              Apply Now
            </button>
          </div>
        )}

        {/* Expired Notice */}
        {!isActive && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-sm">
            <div className="flex">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
              <p className="ml-3 text-sm text-red-800">
                <strong>This job posting has expired.</strong> Applications are no longer being accepted.
              </p>
            </div>
          </div>
        )}

        {/* Job Description */}
        <div className="bg-white rounded-sm shadow border border-gray-200 p-6">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Job Description</h3>
          <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: job.htmlBody }} />
        </div>

        {/* Internal Application Benefits */}
        <div className="bg-white rounded-sm shadow border border-gray-200 p-6">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Internal Application Benefits</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start">
              <div className="w-8 h-8 bg-gold-100 rounded-full flex items-center justify-center flex-shrink-0">
                <UserGroupIcon className="w-4 h-4 text-gold-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Priority Consideration</p>
                <p className="text-sm text-gray-500">Internal candidates receive priority in the review process</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <ClockIcon className="w-4 h-4 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Faster Process</p>
                <p className="text-sm text-gray-500">Streamlined application and interview process</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <BuildingOfficeIcon className="w-4 h-4 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Career Development</p>
                <p className="text-sm text-gray-500">Opportunity for growth within the organisation</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <EyeIcon className="w-4 h-4 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Company Knowledge</p>
                <p className="text-sm text-gray-500">Your existing company knowledge is valued</p>
              </div>
            </div>
          </div>
        </div>

        {/* Job Stats */}
        {(job.applicationCount !== undefined || job.viewCount !== undefined) && (
          <div className="bg-white rounded-sm shadow border border-gray-200 p-6">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Application Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              {job.viewCount !== undefined && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-gold-600">{job.viewCount}</div>
                  <div className="text-sm text-gray-500">Total Views</div>
                </div>
              )}
              {job.applicationCount !== undefined && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{job.applicationCount}</div>
                  <div className="text-sm text-gray-500">Applications</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}