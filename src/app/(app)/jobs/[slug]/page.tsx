import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
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
import { fetchJobBySlug } from '@/lib/jobs-api';

const stripHtmlTags = (html: string): string =>
  html.replace(/<[^>]*>/g, '').trim();

const extractIntroFromHtml = (htmlBody: string): string => {
  const text = stripHtmlTags(htmlBody);
  return text.length > 160 ? text.substring(0, 157) + '...' : text;
};

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const job = await fetchJobBySlug(slug);

  if (!job) {
    return {
      title: 'Job Not Found',
      description: 'The requested job posting could not be found.',
    };
  }

  const metaDescription = extractIntroFromHtml(job.htmlBody);
  const jobTitle = `${job.title}${job.department ? ` - ${job.department}` : ''}`;
  const pageTitle = `${jobTitle} | IDC Careers`;

  return {
    title: pageTitle,
    description: metaDescription,
    openGraph: {
      title: pageTitle,
      description: metaDescription,
      type: 'website',
      url: `/jobs/${job.slug}`,
      siteName: 'Industrial Development Corporation',
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: metaDescription,
    },
    robots: {
      index:
        job.status === 'PUBLISHED' && !isJobExpired(job.status, job.closingDate),
      follow: true,
    },
  };
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = await fetchJobBySlug(slug);

  if (!job) {
    notFound();
  }

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
                  {job.employmentType}
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
                  {job.requisitionId ? (
                    <Link
                      href={`/apply/${job.requisitionId}`}
                      className="inline-flex items-center px-8 py-3 bg-[#F1C54B] text-[#0F172A] text-lg font-medium rounded-full hover:bg-[#F1C54B]/90 transition-colors"
                    >
                      Apply Now
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="inline-flex items-center px-8 py-3 bg-gray-300 text-gray-500 text-lg font-medium rounded-full cursor-not-allowed"
                    >
                      Application Not Available
                    </button>
                  )}
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
