'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api-fetch';
import { useToast } from '@/components/Toast';
import PageWrapper from '@/components/PageWrapper';
import { formatSalaryRange } from '@/utils/currency';
import { getEnumLabel } from '@/utils/enumLabels';
import { shortRef } from '@/utils/identity';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';

interface ApplicationFormData {
  coverLetter: string;
  reasonForApplication: string;
  availabilityDate: string;
}

/** The vacancy being applied to, as far as the ad endpoint can describe it. */
interface VacancyDetail {
  title?: string;
  department?: string;
  location?: string;
  employmentType?: string;
  closingDate?: string;
  salaryRangeMin?: number;
  salaryRangeMax?: number;
}

function daysUntil(closingDate?: string): number | null {
  if (!closingDate) return null;
  const closes = new Date(closingDate);
  if (Number.isNaN(closes.getTime())) return null;
  const today = new Date();
  return Math.ceil((closes.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatClosingDate(closingDate: string): string {
  return new Date(closingDate).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function InternalApplicationPage() {
  // Static export: every /internal/apply/<requisitionId> URL is served the
  // same pre-rendered shell (built with the placeholder id "_" — see the
  // CloudFront "/internal/apply/*" rewrite behavior in
  // ShumelaHireFrontendStack.cs). useParams() would read that build-time
  // placeholder instead of the real id on a hard page load / refresh, so
  // the real id is read from the actual browser URL instead (same fix as
  // requisitions/[id], #187).
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  const requisitionId = useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);
    // ['internal', 'apply', '<requisitionId>']
    return parts.length >= 3 ? parts[2] : '';
  }, [pathname]);
  const jobId = searchParams.get('jobId');
  const jobTitle = decodeURIComponent(searchParams.get('title') || 'this position');
  // /apply/<id> (the public candidate entry point) redirects here with
  // ?source=external after login/registration. This page is also reached
  // directly for genuine internal mobility (/internal/jobs -> here, no
  // source param) — default to internal so that path is unaffected.
  const isExternal = searchParams.get('source') === 'external';

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vacancy, setVacancy] = useState<VacancyDetail | null>(null);

  const [formData, setFormData] = useState<ApplicationFormData>({
    coverLetter: '',
    reasonForApplication: '',
    availabilityDate: '',
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
      return;
    }
  }, [isLoading, isAuthenticated, router]);

  // Enrich the header with the vacancy's own details. Deliberately silent on
  // failure: the applicant already has everything they need to apply from the
  // query string, so a failed lookup should degrade the header, never block
  // the form or raise an error the applicant cannot act on.
  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    apiFetch(`/api/ads/${jobId}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && data) setVacancy(data as VacancyDetail);
      })
      .catch(() => {
        /* header stays on the query-string title */
      });
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  const handleInputChange = (field: keyof ApplicationFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      // Combine reasonForApplication and coverLetter for the backend coverLetter field
      const coverLetterParts = [formData.reasonForApplication, formData.coverLetter].filter(Boolean);
      const combinedCoverLetter = coverLetterParts.join('\n\n');

      const response = await apiFetch('/api/applications', {
        method: 'POST',
        body: JSON.stringify({
          // jobAdId is a String on the backend — these are UUIDs, and
          // Number('87173b20-59d8-…') is NaN, which serialises to null. The
          // application was accepted with no job attached to it.
          jobAdId: jobId || undefined,
          applicationSource: isExternal ? 'EXTERNAL' : 'INTERNAL',
          coverLetter: combinedCoverLetter || undefined,
          availabilityDate: formData.availabilityDate || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || errorData?.error || 'Failed to submit application');
      }

      setSubmitted(true);
      toast('Application submitted', 'success');
    } catch (err) {
      console.error('Error submitting application:', err);
      const message = err instanceof Error ? err.message : 'Failed to submit application';
      setError(message);
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  const jobsHref = isExternal ? '/candidate/jobs' : '/internal/jobs';
  const heading = vacancy?.title || jobTitle;
  const closesIn = daysUntil(vacancy?.closingDate);

  const backAction = (
    <Link href={jobsHref}>
      <button className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-button px-4 py-2 transition-colors">
        <ArrowLeftIcon className="w-4 h-4" />
        {isExternal ? 'Back to jobs' : 'Back to internal jobs'}
      </button>
    </Link>
  );

  if (submitted) {
    return (
      <PageWrapper
        title="Application submitted"
        subtitle={heading}
        actions={backAction}
      >
        <div className="max-w-xl mx-auto">
          <div className="enterprise-card p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-icon-bg-teal flex items-center justify-center mx-auto mb-5">
              <CheckCircleIcon className="w-7 h-7 text-accent-teal" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">You have applied for {heading}</h2>
            <p className="text-sm text-muted-foreground mb-7">
              {isExternal
                ? 'Your application is now with the recruitment team.'
                : 'Your application is now with the recruitment team, flagged as an internal candidate.'}
            </p>

            <ol className="text-left border-t border-border">
              {[
                {
                  label: 'Screening',
                  detail: 'HR reviews your application within 3–5 business days.',
                },
                {
                  label: 'Updates',
                  detail: isExternal
                    ? 'Every change of status reaches you by email.'
                    : 'Every change of status reaches you by email and in the internal portal.',
                },
                {
                  label: 'Tracking',
                  detail: 'Follow the application from My Applications at any time.',
                },
              ].map((step, index) => (
                <li key={step.label} className="flex gap-4 py-4 border-b border-border">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full border border-border flex items-center justify-center text-xs font-bold text-muted-foreground">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{step.label}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{step.detail}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="flex flex-col sm:flex-row gap-3 mt-7">
              <Link href="/candidate/applications" className="flex-1">
                <button className="btn-cta w-full">View my applications</button>
              </Link>
              <Link href={jobsHref} className="flex-1">
                <button className="btn-secondary w-full">
                  {isExternal ? 'Browse more jobs' : 'Browse more internal jobs'}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  const vacancyFacts = [
    {
      icon: BuildingOfficeIcon,
      label: 'Department',
      value: vacancy?.department,
    },
    {
      icon: MapPinIcon,
      label: 'Location',
      value: vacancy?.location,
    },
    {
      icon: BriefcaseIcon,
      label: 'Employment type',
      value: vacancy?.employmentType
        ? getEnumLabel('employmentType', vacancy.employmentType)
        : undefined,
    },
    {
      icon: BanknotesIcon,
      label: 'Salary range',
      value:
        vacancy?.salaryRangeMin || vacancy?.salaryRangeMax
          ? formatSalaryRange(vacancy.salaryRangeMin, vacancy.salaryRangeMax)
          : undefined,
    },
  ].filter((fact) => !!fact.value);

  return (
    <PageWrapper
      title={isExternal ? 'Apply' : 'Apply internally'}
      subtitle={`${heading} · ${shortRef('REQ', requisitionId)}`}
      actions={backAction}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* The vacancy — the reason the applicant is on this page, stated first. */}
        <section className="enterprise-card overflow-hidden">
          <div className="border-l-4 border-cta px-6 py-5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {isExternal ? 'You are applying for' : 'Internal vacancy'}
            </p>
            <h2 className="text-2xl font-bold text-foreground mt-1.5">{heading}</h2>

            {/* Two columns, not four: a salary band and a location are long
                enough that four cells inside this column truncate them, and a
                truncated salary is worse than no salary. */}
            {vacancyFacts.length > 0 && (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 mt-5">
                {vacancyFacts.map((fact) => (
                  <div key={fact.label} className="flex items-start gap-2.5">
                    <fact.icon className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <dt className="text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground">
                        {fact.label}
                      </dt>
                      <dd className="text-sm text-foreground mt-0.5">{fact.value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            )}
          </div>

          {vacancy?.closingDate && (
            <div className="flex items-center gap-2.5 px-6 py-3 border-t border-border bg-muted/40">
              <CalendarDaysIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Applications close {formatClosingDate(vacancy.closingDate)}
                {closesIn !== null && closesIn >= 0 && (
                  <span className={`ml-2 font-semibold ${closesIn <= 3 ? 'text-accent-pink' : 'text-foreground'}`}>
                    · {closesIn === 0 ? 'today' : closesIn === 1 ? '1 day left' : `${closesIn} days left`}
                  </span>
                )}
              </p>
            </div>
          )}
        </section>

        {error && (
          <div className="enterprise-card border-l-4 border-accent-pink p-4">
            <div className="flex gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-accent-pink flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">Your application was not submitted</h3>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Zone 1 — what IDC already holds. An internal application is short
              precisely because the organisation already has your record; say
              so, rather than presenting empty fields the applicant must fill. */}
          {user && (
            <section className="enterprise-card p-6">
              <div className="flex items-baseline justify-between gap-4 mb-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  From your record
                </h3>
                <p className="text-xs text-muted-foreground">Already on file — nothing to complete</p>
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <dt className="text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground">
                    Name
                  </dt>
                  <dd className="text-sm text-foreground mt-1">{user.name}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground">
                    Email
                  </dt>
                  <dd className="text-sm text-foreground mt-1 truncate">{user.email}</dd>
                </div>
              </dl>
            </section>
          )}

          {/* Zone 2 — the only things the organisation cannot answer for you. */}
          <section className="enterprise-card p-6">
            <div className="flex items-baseline justify-between gap-4 mb-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Only you can answer
              </h3>
              <p className="text-xs text-muted-foreground">
                <span className="text-accent-pink">*</span> Required
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label htmlFor="reason-for-application" className="form-label">
                  Why this role <span className="text-accent-pink">*</span>
                </label>
                <textarea
                  id="reason-for-application"
                  rows={4}
                  required
                  aria-required="true"
                  value={formData.reasonForApplication}
                  onChange={(e) => handleInputChange('reasonForApplication', e.target.value)}
                  className="form-input w-full"
                  placeholder={
                    isExternal
                      ? 'What draws you to this position?'
                      : 'What draws you to this role, and why now?'
                  }
                />
              </div>

              <div>
                <label htmlFor="cover-letter" className="form-label">
                  Cover letter
                </label>
                <textarea
                  id="cover-letter"
                  rows={6}
                  value={formData.coverLetter}
                  onChange={(e) => handleInputChange('coverLetter', e.target.value)}
                  className="form-input w-full"
                  placeholder={
                    isExternal
                      ? 'How does your experience match what the role needs?'
                      : 'How does your work at IDC so far match what this role needs?'
                  }
                />
              </div>

              <div className="max-w-xs">
                <label htmlFor="availability-date" className="form-label">
                  Earliest start date
                </label>
                <input
                  type="date"
                  id="availability-date"
                  value={formData.availabilityDate}
                  onChange={(e) => handleInputChange('availabilityDate', e.target.value)}
                  className="form-input w-full"
                />
              </div>
            </div>
          </section>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
            <p className="text-xs text-muted-foreground max-w-sm">
              Submitting confirms the information here is accurate and complete.
            </p>
            <button
              type="submit"
              disabled={loading || !formData.reasonForApplication}
              className="btn-cta inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Submitting
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="w-4 h-4" />
                  Submit application
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
}
