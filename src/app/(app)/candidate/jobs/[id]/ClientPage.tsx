'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { formatSalaryRange } from '@/utils/currency';
import { useToast } from '@/components/Toast';

// Job detail page for Browse Jobs — reached via View Details on
// /candidate/jobs. Deliberately kept in-app (not the public /jobs/[slug]
// marketing page) so an Applicant clicking through never leaves the
// authenticated app shell, matching how /internal/jobs/[id] behaves for
// Internal Job Board. Same backend record (JobAd via /api/ads/{id}) as the
// internal detail page, but no internal-only access gate (Browse Jobs
// already only lists channelExternal ads) and the external apply flow.
interface ExternalJobAd {
  id: number;
  jobPostingId?: number;
  title: string;
  htmlBody: string;
  channelExternal: boolean;
  status: 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED' | 'EXPIRED';
  closingDate?: string;
  slug?: string;
  createdAt: string;
  department?: string;
  location?: string;
  employmentType?: string;
  salaryRangeMin?: number;
  salaryRangeMax?: number;
  companyName?: string;
  applicationCount?: number;
  viewCount?: number;
}

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

export default function CandidateJobDetailPage() {
  // Static export: this page is pre-rendered once at build time with a
  // placeholder id ("_" — see generateStaticParams in page.tsx and the
  // CloudFront "/candidate/jobs/*" rewrite behavior in
  // ShumelaHireFrontendStack.cs). useParams() would read that build-time
  // placeholder instead of the real id on a hard page load/refresh, so the
  // real id is read from the actual browser URL instead.
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const jobId = useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);
    // ['candidate', 'jobs', '<id>']
    return parts.length >= 3 ? parts[2] : '';
  }, [pathname]);

  const [job, setJob] = useState<ExternalJobAd | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
      return;
    }
  }, [isLoading, isAuthenticated, router]);

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
        const jobData: ExternalJobAd = result.data || result;
        setJob(jobData);
      } catch (err) {
        console.error('Error fetching job details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load job details');
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [isAuthenticated, jobId]);

  const applyHref = () => {
    if (!job) return '#';
    const applyId = String(job.jobPostingId ?? job.id);
    return `/apply/${applyId}?jobId=${encodeURIComponent(applyId)}&title=${encodeURIComponent(job.title)}`;
  };

  const handleShare = async () => {
    if (!job) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: job.title,
          text: `Check out this job opportunity: ${job.title}`,
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
      <Link href="/candidate/jobs">
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
          description={error || "The job posting you're looking for doesn't exist or is no longer available."}
          action={{ label: 'Back to Browse Jobs', onClick: () => router.push('/candidate/jobs') }}
        />
      </PageWrapper>
    );
  }

  const daysLeft = getDaysUntilExpiry(job.closingDate);
  const isActive = job.status === 'PUBLISHED' && daysLeft > 0;

  const JobBadges = () => {
    const isNew = isJobNew(job.createdAt);
    const closingSoon = isJobClosingSoon(job.closingDate);

    if (!isNew && !closingSoon) return null;

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
        <div className="bg-white rounded-control shadow border border-gray-200 p-6">
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
          <div className="bg-gold-50 border border-gold-200 rounded-control p-6 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Ready to apply?</p>
              <p className="text-sm text-gray-600">Submit your application in just a few minutes.</p>
            </div>
            <Link
              href={applyHref()}
              className="inline-flex items-center px-6 py-2.5 border-2 border-gold-500 text-sm font-medium rounded-full bg-transparent text-gold-500 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider transition-colors"
            >
              <PaperAirplaneIcon className="w-4 h-4 mr-2" />
              Apply Now
            </Link>
          </div>
        )}

        {/* Expired Notice */}
        {!isActive && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-control">
            <div className="flex">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
              <p className="ml-3 text-sm text-red-800">
                <strong>This job posting has expired.</strong> Applications are no longer being accepted.
              </p>
            </div>
          </div>
        )}

        {/* Job Description */}
        <div className="bg-white rounded-control shadow border border-gray-200 p-6">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Job Description</h3>
          <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: job.htmlBody }} />
        </div>

        {/* Job Stats */}
        {(job.applicationCount !== undefined || job.viewCount !== undefined) && (
          <div className="bg-white rounded-control shadow border border-gray-200 p-6">
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
