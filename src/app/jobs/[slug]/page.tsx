import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import JobDetailClient from '../../../components/JobDetailClient';
import { formatSalaryRange } from '@/utils/currency';

// Types for the backend API response
interface BackendJobAd {
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
  // Additional fields that might be included
  department?: string;
  location?: string;
  employmentType?: string;
  salaryRangeMin?: number;
  salaryRangeMax?: number;
  companyName?: string;
}

interface ApiResponse {
  success: boolean;
  data?: BackendJobAd;
  message?: string;
  error?: string;
}

// Utility functions
const stripHtmlTags = (html: string): string => {
  return html.replace(/<[^>]*>/g, '').trim();
};

const extractIntroFromHtml = (htmlBody: string): string => {
  // Extract first paragraph or first 160 characters for meta description
  const withoutTags = stripHtmlTags(htmlBody);
  return withoutTags.length > 160 ? withoutTags.substring(0, 157) + '...' : withoutTags;
};

const isJobExpired = (status: string, closingDate?: string): boolean => {
  if (status === 'EXPIRED') return true;
  if (!closingDate) return false;
  return new Date(closingDate) < new Date();
};

const getDaysUntilExpiry = (closingDate?: string): number => {
  if (!closingDate) return 0;
  const today = new Date();
  const expiry = new Date(closingDate);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Fetch job data from backend
async function fetchJobData(slug: string): Promise<BackendJobAd | null> {
  try {
    // Use environment variable for API base URL, fallback to localhost for development
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
    const response = await fetch(`${baseUrl}/ads/${slug}`, {
      next: { revalidate: 300 } // Revalidate every 5 minutes
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiResponse: ApiResponse = await response.json();
    
    if (!apiResponse.success || !apiResponse.data) {
      return null;
    }

    return apiResponse.data;
  } catch (error) {
    console.error('Error fetching job data:', error);
    return null;
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const job = await fetchJobData(slug);

  if (!job) {
    return {
      title: 'Job Not Found',
      description: 'The requested job posting could not be found.'
    };
  }

  const metaDescription = extractIntroFromHtml(job.htmlBody);
  const jobTitle = `${job.title}${job.department ? ` - ${job.department}` : ''}`;
  const companyName = job.companyName || 'Our Company';
  const pageTitle = `${jobTitle} at ${companyName}`;

  return {
    title: pageTitle,
    description: metaDescription,
    openGraph: {
      title: pageTitle,
      description: metaDescription,
      type: 'website',
      url: `/jobs/${job.slug}`,
      siteName: companyName,
      images: [
        {
          url: '/og-job-default.png', // You should add a default OG image
          width: 1200,
          height: 630,
          alt: `${jobTitle} job posting`
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: metaDescription,
      images: ['/og-job-default.png']
    },
    robots: {
      index: job.status === 'PUBLISHED' && !isJobExpired(job.status, job.closingDate),
      follow: true
    }
  };
}

// Job detail page component
export default async function JobDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const job = await fetchJobData(slug);

  if (!job) {
    notFound();
  }

  // Check if job is expired or not published
  const isExpired = isJobExpired(job.status, job.closingDate);
  const isPublished = job.status === 'PUBLISHED';
  const isActive = isPublished && !isExpired;
  const daysUntilExpiry = getDaysUntilExpiry(job.closingDate);

  // If job is not published or is expired, show appropriate message
  if (!isPublished || isExpired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-6">
            <ExclamationTriangleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isExpired ? 'Job Posting Expired' : 'Job Not Available'}
            </h1>
            <p className="text-gray-600">
              {isExpired 
                ? 'This job posting has expired and is no longer accepting applications.'
                : 'This job posting is not currently available for public viewing.'
              }
            </p>
          </div>
          <Link href="/jobs">
            <button className="inline-flex items-center px-4 py-2 bg-gold-500 text-violet-950 rounded-full hover:bg-gold-600 transition-colors">
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              View All Jobs
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // Build structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": job.title,
    "description": job.htmlBody,
    "identifier": {
      "@type": "PropertyValue",
      "name": job.companyName || "Company",
      "value": job.id.toString()
    },
    "datePosted": job.createdAt,
    "validThrough": job.closingDate || undefined,
    "employmentType": job.employmentType || "FULL_TIME",
    "hiringOrganization": {
      "@type": "Organization",
      "name": job.companyName || "Company"
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": job.location || "Various Locations"
      }
    },
    "baseSalary": job.salaryRangeMin || job.salaryRangeMax ? {
      "@type": "MonetaryAmount",
      "currency": "ZAR",
      "value": {
        "@type": "QuantitativeValue",
        "minValue": job.salaryRangeMin,
        "maxValue": job.salaryRangeMax,
        "unitText": "YEAR"
      }
    } : undefined
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex items-center justify-between">
                <Link href="/jobs">
                  <button className="inline-flex items-center text-gold-600 hover:text-gold-800 transition-colors">
                    <ArrowLeftIcon className="w-4 h-4 mr-2" />
                    Back to jobs
                  </button>
                </Link>
                
                <JobDetailClient jobTitle={job.title} companyName={job.companyName} />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Job Header */}
          <div className="bg-white rounded-sm shadow-lg mb-8">
            <div className="p-8">
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

                {daysUntilExpiry > 0 && daysUntilExpiry <= 7 && (
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800 mb-4">
                    ⏰ {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''} left to apply
                  </div>
                )}
              </div>

              {/* Apply Now Section */}
              {isActive && (
                <div className="mb-8 p-6 bg-gold-50 rounded-sm border border-violet-200">
                  <div className="text-center">
                    <h2 className="text-xl font-semibold text-violet-900 mb-2">Ready to Apply?</h2>
                    <p className="text-violet-700 mb-4">
                      Take the next step in your career journey with us.
                    </p>
                    {job.requisitionId ? (
                      <Link href={`/apply/${job.requisitionId}`}>
                        <button className="inline-flex items-center px-6 py-3 bg-gold-500 text-violet-950 text-lg font-medium rounded-full hover:bg-gold-600 transition-colors">
                          Apply Now
                        </button>
                      </Link>
                    ) : (
                      <button 
                        disabled 
                        className="inline-flex items-center px-6 py-3 bg-gray-400 text-white text-lg font-medium rounded-full cursor-not-allowed"
                      >
                        Application Not Available
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Job Description */}
              <div className="prose prose-lg max-w-none">
                <div dangerouslySetInnerHTML={{ __html: job.htmlBody }} />
              </div>
            </div>
          </div>

          {/* Company Info */}
          <div className="bg-white rounded-sm shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              About {job.companyName || 'Our Company'}
            </h3>
            <p className="text-gray-600 mb-4">
              {job.companyName || 'We'} are committed to building a diverse and inclusive team. 
              We&apos;re always looking for talented individuals who share our passion for innovation 
              and excellence.
            </p>
            <Link href="/jobs">
              <button className="text-gold-600 hover:text-gold-800 text-sm transition-colors rounded-full">
                View all open positions →
              </button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}