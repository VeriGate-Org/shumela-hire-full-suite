'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MapPinIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import JobDetailClient from '@/components/JobDetailClient';
import { formatSalaryRange } from '@/utils/currency';
import { apiFetch } from '@/lib/api-fetch';
import { getEmploymentTypeLabel } from '@/utils/enumLabels';
import type { BackendJobAd, BackendApiResponse } from './types';

const isJobExpired = (status: string, closingDate?: string): boolean => {
  if (status === 'EXPIRED') return true;
  if (!closingDate) return false;
  return new Date(closingDate) < new Date();
};

const getDaysUntilExpiry = (closingDate?: string): number => {
  if (!closingDate) return 0;
  return Math.ceil(
    (new Date(closingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
};

/**
 * Every /jobs/<slug> URL is served the same static shell (see the CloudFront
 * "/jobs/*" rewrite behavior in ShumelaHireFrontendStack.cs — S3/CloudFront
 * can't host arbitrary dynamic paths, and a CloudFront Function can't fix
 * this up on the way out because CloudFront skips viewer-response functions
 * entirely for any origin response of 400+). So the real slug is read here
 * from the browser's actual URL, and the job is fetched client-side via
 * apiFetch — the same tenant-aware helper used by the job list — instead of
 * at build time, when neither the real slug nor the visitor's tenant is known.
 */
export default function IDCJobDetailClient() {
  const pathname = usePathname();
  const slug = useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);
    // ['jobs', '<slug>']
    return parts.length >= 2 ? parts[1] : null;
  }, [pathname]);

  const [job, setJob] = useState<BackendJobAd | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug || slug === '_') {
      setLoading(false);
      setNotFound(true);
      return;
    }

    let cancelled = false;

    async function loadJob() {
      try {
        const response = await apiFetch(`/api/ads/${slug}`);
        if (!response.ok) {
          if (!cancelled) setNotFound(true);
          return;
        }
        const apiResponse: BackendApiResponse<BackendJobAd> = await response.json();
        if (cancelled) return;
        if (!apiResponse.success || !apiResponse.data) {
          setNotFound(true);
          return;
        }
        setJob(apiResponse.data);
        document.title = `${apiResponse.data.title}${apiResponse.data.department ? ` - ${apiResponse.data.department}` : ''} | IDC Careers`;
      } catch (error) {
        console.error('Error fetching job data:', error);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadJob();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        <div className="h-4 w-32 bg-gray-200 rounded mb-6" />
        <div className="bg-white rounded-[2px] shadow-lg p-8">
          <div className="h-8 w-2/3 bg-gray-200 rounded mb-4" />
          <div className="h-4 w-1/2 bg-gray-100 rounded mb-8" />
          <div className="space-y-2">
            <div className="h-3 w-full bg-gray-100 rounded" />
            <div className="h-3 w-full bg-gray-100 rounded" />
            <div className="h-3 w-3/4 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !job) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center max-w-md mx-auto px-4">
          <ExclamationTriangleIcon className="w-16 h-16 text-[#64748B] mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#0F172A] mb-2 tracking-[-0.03em]">
            Job Not Found
          </h1>
          <p className="text-[#64748B] mb-6">
            The requested job posting could not be found.
          </p>
          <Link
            href="/jobs"
            className="inline-flex items-center px-6 py-2 bg-[#F1C54B] text-[#0F172A] rounded-full font-medium hover:bg-[#F1C54B]/90 transition-colors"
          >
            View All Positions
          </Link>
        </div>
      </div>
    );
  }

  // The posting the advert belongs to. Falls back to the advert's own id only
  // so the CTA still renders on an advert with no posting link — better a
  // possibly-misfiled application than a dead end, and every advert on the IDC
  // tenant carries jobPostingId.
  const applyId = String(job.jobPostingId ?? job.id);

  const isExpired = isJobExpired(job.status, job.closingDate);
  const isPublished = job.status === 'PUBLISHED';
  const isActive = isPublished && !isExpired;
  const daysUntilExpiry = getDaysUntilExpiry(job.closingDate);

  if (!isPublished || isExpired) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center max-w-md mx-auto px-4">
          <ExclamationTriangleIcon className="w-16 h-16 text-[#64748B] mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#0F172A] mb-2 tracking-[-0.03em]">
            {isExpired ? 'Job Posting Expired' : 'Job Not Available'}
          </h1>
          <p className="text-[#64748B] mb-6">
            {isExpired
              ? 'This job posting has expired and is no longer accepting applications.'
              : 'This job posting is not currently available for public viewing.'}
          </p>
          <Link
            href="/jobs"
            className="inline-flex items-center px-6 py-2 bg-[#F1C54B] text-[#0F172A] rounded-full font-medium hover:bg-[#F1C54B]/90 transition-colors"
          >
            View All Positions
          </Link>
        </div>
      </div>
    );
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.htmlBody,
    identifier: {
      '@type': 'PropertyValue',
      name: 'Industrial Development Corporation',
      value: job.id.toString(),
    },
    datePosted: job.createdAt,
    validThrough: job.closingDate || undefined,
    employmentType: job.employmentType || 'FULL_TIME',
    hiringOrganization: {
      '@type': 'Organization',
      name: 'Industrial Development Corporation',
      sameAs: 'https://www.idc.co.za',
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location || 'South Africa',
        addressCountry: 'ZA',
      },
    },
    baseSalary:
      job.salaryRangeMin || job.salaryRangeMax
        ? {
            '@type': 'MonetaryAmount',
            currency: 'ZAR',
            value: {
              '@type': 'QuantitativeValue',
              minValue: job.salaryRangeMin,
              maxValue: job.salaryRangeMax,
              unitText: 'YEAR',
            },
          }
        : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center text-sm text-[#64748B] mb-6">
          <Link href="/jobs" className="hover:text-[#05527E] transition-colors">
            Careers
          </Link>
          <ChevronRightIcon className="w-4 h-4 mx-2" />
          <span className="text-[#0F172A] font-medium truncate">{job.title}</span>
        </nav>

        {/* Share button */}
        <div className="flex justify-end mb-4">
          <JobDetailClient jobTitle={job.title} companyName="Industrial Development Corporation" />
        </div>

        {/* Job Header Card */}
        <div className="bg-white rounded-[2px] shadow-lg mb-8">
          <div className="p-8">
            <h1 className="text-3xl font-bold text-[#0F172A] mb-4 tracking-[-0.03em]">
              {job.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-sm text-[#64748B] mb-4">
              <div className="flex items-center">
                <BuildingOfficeIcon className="w-4 h-4 mr-2" />
                Industrial Development Corporation
              </div>

              {job.department && (
                <div className="flex items-center font-medium">
                  {job.department}
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
                  {/* The raw enum was rendered straight onto the public advert,
                      so candidates read "FULL_TIME". */}
                  {getEmploymentTypeLabel(job.employmentType)}
                </div>
              )}

              {job.closingDate && (
                <div className="flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Closes{' '}
                  {new Date(job.closingDate).toLocaleDateString('en-ZA', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
              )}
            </div>

            {(job.salaryRangeMin || job.salaryRangeMax) && (
              <div className="flex items-center text-lg font-semibold text-[#05527E] mb-4">
                <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                {formatSalaryRange(job.salaryRangeMin, job.salaryRangeMax)}
              </div>
            )}

            {daysUntilExpiry > 0 && daysUntilExpiry <= 7 && (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800 mb-4">
                {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''} left to
                apply
              </div>
            )}

            {/* Apply CTA */}
            {isActive && (
              <div className="mt-6 p-6 bg-[#F8FAFC] rounded-[2px] border border-gray-200">
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-[#0F172A] mb-2 tracking-[-0.03em]">
                    Ready to apply?
                  </h2>
                  <p className="text-[#64748B] mb-4">
                    Take the next step in your career with the IDC.
                  </p>
                  {/* Keyed off the advert, not the requisition. A candidate
                      applies to what is advertised; gating on job.requisitionId
                      disabled the button on every advert whose posting had no
                      linked requisition, which is most of them.

                      jobId must be the JOB POSTING id, not the advert's own id:
                      the value is submitted as jobAdId and the service stores it
                      straight into the application's jobPostingId. Passing the
                      advert id attaches applications to something that is not a
                      posting, so they never count toward the vacancy. */}
                  <Link
                    href={`/apply/${applyId}?jobId=${encodeURIComponent(applyId)}&title=${encodeURIComponent(job.title)}`}
                    className="inline-flex items-center px-8 py-3 bg-[#F1C54B] text-[#0F172A] text-lg font-medium rounded-full hover:bg-[#F1C54B]/90 transition-colors"
                  >
                    Apply Now
                  </Link>
                </div>
              </div>
            )}

            {/* Job Description */}
            <div className="mt-8 prose prose-lg max-w-none">
              <div dangerouslySetInnerHTML={{ __html: job.htmlBody }} />
            </div>
          </div>
        </div>

        {/* About IDC */}
        <div className="bg-white rounded-[2px] shadow p-6">
          <h3 className="text-lg font-semibold text-[#0F172A] mb-4 tracking-[-0.03em]">
            About the Industrial Development Corporation
          </h3>
          <p className="text-[#64748B] mb-4 leading-relaxed">
            The IDC is a national development finance institution that promotes
            economic growth and industrial development in South Africa. We invest
            in a diverse range of sectors and are committed to building a
            workforce that reflects the diversity of our nation.
          </p>
          <Link
            href="/jobs"
            className="text-[#05527E] hover:text-[#05527E]/80 text-sm transition-colors"
          >
            View all open positions &rarr;
          </Link>
        </div>
      </div>
    </>
  );
}
