'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api-fetch';
import { useToast } from '@/components/Toast';
import PageWrapper from '@/components/PageWrapper';
import { getEmploymentTypeLabel } from '@/utils/enumLabels';
import { formatCurrency } from '@/utils/currency';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  PaperAirplaneIcon,
  CheckIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface ApplicationFormData {
  coverLetter: string;
  reasonForApplication: string;
  availabilityDate: string;
}

/** Only the fields this page shows. GET /api/requisitions/{id} returns the entity. */
interface RequisitionSummary {
  jobTitle?: string;
  department?: string;
  location?: string;
  employmentType?: string;
  salaryMin?: number;
  salaryMax?: number;
}

/** Only the fields this page shows. GET /api/ads/{id} returns JobAdResponse. */
interface JobAdSummary {
  title?: string;
  department?: string;
  location?: string;
  employmentType?: string;
  salaryRangeMin?: number;
  salaryRangeMax?: number;
  closingDate?: string;
}

/** Only the fields this page shows. GET /api/employees/{id} returns EmployeeResponse. */
interface EmployeeSummary {
  fullName?: string;
  employeeNumber?: string;
  jobTitle?: string;
  department?: string;
  jobGrade?: string;
  hireDate?: string;
  reportingManagerName?: string;
}

/** Shape of the created application, as far as the confirmation needs it. */
interface SubmittedApplication {
  id?: string;
  statusDisplayName?: string;
  status?: string;
}

const WORD_TARGET_MIN = 80;
const WORD_TARGET_MAX = 250;

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function formatDate(value?: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysUntil(value?: string): number | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const days = Math.ceil((date.getTime() - Date.now()) / 86_400_000);
  return days;
}

/** "3 yr 2 mo" — how long they have been in the role they are asking to leave. */
function formatTenure(hireDate?: string): string | null {
  if (!hireDate) return null;
  const start = new Date(hireDate);
  if (Number.isNaN(start.getTime())) return null;
  const now = new Date();
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) months -= 1;
  if (months < 0) return null;
  const years = Math.floor(months / 12);
  const remainder = months % 12;
  if (years === 0) return `${remainder} mo`;
  if (remainder === 0) return `${years} yr`;
  return `${years} yr ${remainder} mo`;
}

function initials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

function formatSalaryBand(min?: number, max?: number): string | null {
  if (min == null && max == null) return null;
  const money = (value: number) => formatCurrency(value, 'ZAR', 'en-ZA', { maximumFractionDigits: 0 });
  if (min != null && max != null) return `${money(min)} – ${money(max)}`;
  return money((min ?? max) as number);
}

/**
 * A fact in the strip under the header. It is a term/definition pair because
 * that is what it is; the strip is a <dl>. The strip draws its own rules with a
 * 1px grid gap over a border-coloured background, so the separators land
 * correctly at one, two or four columns without per-cell border juggling.
 */
function Fact({ label, value, note }: { label: string; value: string; note?: string | null }) {
  return (
    <div className="bg-card px-4 py-3.5">
      <dt className="text-[0.5625rem] font-extrabold uppercase tracking-[0.15em] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 ml-0 text-[0.9375rem] font-bold tracking-[-0.015em] text-foreground">
        {value}
        {note && (
          <small className="block mt-px text-[0.6875rem] font-semibold tracking-normal text-muted-foreground">{note}</small>
        )}
      </dd>
    </div>
  );
}

/** One side of the move: where they are now, or where they are asking to go. */
function MoveSide({
  kicker,
  role,
  facts,
  highlight,
}: {
  kicker: string;
  role: string;
  facts: React.ReactNode[];
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-control px-4 py-3.5 border ${
        highlight ? 'bg-band-accent-fill border-band-accent-line' : 'bg-band-fill border-band-line'
      }`}
    >
      <div
        className={`text-[0.5625rem] font-extrabold uppercase tracking-[0.16em] ${
          highlight ? 'text-band-accent' : 'text-band-faint'
        }`}
      >
        {kicker}
      </div>
      <div className="mt-1 text-base font-extrabold tracking-[-0.02em] leading-snug">{role}</div>
      {facts.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-band-muted">
          {facts.map((fact, index) => (
            <span key={index}>{fact}</span>
          ))}
        </div>
      )}
    </div>
  );
}

/** One step of "what happens next". */
function Step({
  step,
  label,
  detail,
  current,
  last,
}: {
  step: number;
  label: string;
  detail: string;
  current?: boolean;
  last?: boolean;
}) {
  return (
    <div className="relative pl-11 pr-5 py-3">
      {!last && (
        <span
          aria-hidden="true"
          className="absolute left-[1.6875rem] top-[1.9375rem] bottom-[-0.8125rem] w-0.5 bg-border"
        />
      )}
      <span
        aria-hidden="true"
        className={`absolute left-5 top-3.5 w-4 h-4 rounded-full grid place-items-center text-[0.5625rem] font-extrabold border-2 ${
          current ? 'bg-cta border-cta text-cta-foreground' : 'bg-card border-border text-muted-foreground'
        }`}
      >
        {step}
      </span>
      <div className="text-[0.8125rem] font-extrabold tracking-[-0.01em] text-foreground">{label}</div>
      <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{detail}</div>
    </div>
  );
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
  const jobTitle = searchParams.get('title') || 'Position';
  // /apply/<id> (the public candidate entry point) redirects here with
  // ?source=external after login/registration. This page is also reached
  // directly for genuine internal mobility (/internal/jobs -> here, no
  // source param) — default to internal so that path is unaffected.
  const isExternal = searchParams.get('source') === 'external';

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState<SubmittedApplication | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [requisition, setRequisition] = useState<RequisitionSummary | null>(null);
  const [jobAd, setJobAd] = useState<JobAdSummary | null>(null);
  const [employee, setEmployee] = useState<EmployeeSummary | null>(null);

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

  // Everything the header and the facts strip need is optional context: none of
  // it gates submission, and two of the three sources are routinely refused.
  // /api/requisitions/** is closed to the EMPLOYEE role in SecurityConfig, so a
  // 403 there is the *expected* answer for the very people this page is for;
  // and there is no "my employee record" endpoint, only /api/employees/{id}
  // reached through the id AuthContext already resolved from /api/auth/me. So
  // each read is best-effort and a failure simply removes what it would have
  // shown.
  const readOptional = useCallback(async <T,>(path: string): Promise<T | null> => {
    try {
      const response = await apiFetch(path);
      if (!response.ok) return null;
      return (await response.json()) as T;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    // "general" is the placeholder the internal job board uses when an advert
    // carries no requisition — there is nothing to fetch.
    const wantsRequisition = Boolean(requisitionId) && requisitionId !== 'general';
    const employeeId = user?.employeeId;

    (async () => {
      const [req, ad, emp] = await Promise.all([
        wantsRequisition ? readOptional<RequisitionSummary>(`/api/requisitions/${requisitionId}`) : null,
        jobId ? readOptional<JobAdSummary>(`/api/ads/${jobId}`) : null,
        !isExternal && employeeId ? readOptional<EmployeeSummary>(`/api/employees/${employeeId}`) : null,
      ]);
      if (cancelled) return;
      setRequisition(req);
      setJobAd(ad);
      setEmployee(emp);
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, requisitionId, jobId, isExternal, user?.employeeId, readOptional]);

  const handleInputChange = (field: keyof ApplicationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.reasonForApplication.trim()) {
      const message = isExternal
        ? 'Tell us why this role before submitting.'
        : 'Tell us why this move before submitting.';
      setError(message);
      toast(message, 'error');
      return;
    }

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

      const created = (await response.json().catch(() => null)) as SubmittedApplication | null;
      setSubmitted(created ?? {});
      // The confirmation replaces a much taller page; without this the reader is
      // dropped into the middle of it, or under the fixed top bar.
      window.scrollTo({ top: 0 });
      toast('Application submitted successfully', 'success');
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
  const profileHref = isExternal ? '/candidate/profile' : '/profile';

  // The requisition is the authority when the caller may read it; the advert is
  // the fallback, and the only place a closing date exists at all.
  const roleTitle = requisition?.jobTitle || jobAd?.title || decodeURIComponent(jobTitle);
  const roleDepartment = requisition?.department || jobAd?.department || null;
  const roleLocation = requisition?.location || jobAd?.location || null;
  const roleEmploymentType = requisition?.employmentType || jobAd?.employmentType || null;
  const salaryBand = formatSalaryBand(
    requisition?.salaryMin ?? jobAd?.salaryRangeMin,
    requisition?.salaryMax ?? jobAd?.salaryRangeMax,
  );
  const closingDate = jobAd?.closingDate ?? undefined;
  const closingDateLabel = formatDate(closingDate);
  const closingIn = daysUntil(closingDate);

  // No employee record means no honest "you are here" — hide that side of the
  // move rather than showing a column of blanks.
  const showCurrentRole = !isExternal && Boolean(employee?.jobTitle);
  const tenure = formatTenure(employee?.hireDate);
  const managerName = employee?.reportingManagerName || null;

  const whyWords = countWords(formData.reasonForApplication);
  const bringWords = countWords(formData.coverLetter);
  const whyPercent = Math.min(100, Math.round((whyWords / WORD_TARGET_MAX) * 100));

  const requisitionLine = [
    requisitionId && requisitionId !== 'general' ? `Requisition ${requisitionId}` : null,
    roleDepartment,
    closingDateLabel ? `closes ${closingDateLabel}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  // The way back sits above the identity band rather than in PageWrapper's
  // header slot: passing `actions` alone renders an otherwise empty header card,
  // and the band already carries the h1 that card would duplicate.
  const backLink = (
    <Link
      href={jobsHref}
      className="inline-flex items-center gap-2 text-[0.8125rem] font-semibold text-muted-foreground hover:text-foreground transition-colors"
    >
      <ArrowLeftIcon className="w-4 h-4" aria-hidden="true" />
      {isExternal ? 'Back to jobs' : 'Back to job board'}
    </Link>
  );

  const factsStrip = (
    <dl className="mt-3.5 grid grid-cols-1 gap-px min-[560px]:grid-cols-2 min-[760px]:grid-cols-4 rounded-card overflow-hidden bg-border border border-border shadow-sm">
      <Fact label="Employment type" value={roleEmploymentType ? getEmploymentTypeLabel(roleEmploymentType) : 'Not stated'} />
      <Fact label="Salary band" value={salaryBand ?? 'Not published'} />
      <Fact label="Location" value={roleLocation ?? 'Not stated'} />
      <Fact
        label="Applications close"
        value={closingDateLabel ?? 'No closing date'}
        note={closingIn != null && closingIn >= 0 ? `${closingIn} day${closingIn === 1 ? '' : 's'} left` : null}
      />
    </dl>
  );

  if (submitted) {
    const reference = submitted.id;
    const availableFrom = formatDate(formData.availabilityDate);
    const statusLabel = submitted.statusDisplayName || submitted.status || 'Submitted';

    return (
      <PageWrapper>
        <div className="max-w-[1020px] mx-auto w-full">
          <div className="mb-3.5">{backLink}</div>
          <div className="bg-card border border-border rounded-card shadow-sm p-7 md:p-8">
            <div
              aria-hidden="true"
              className="w-11 h-11 rounded-full grid place-items-center bg-icon-bg-teal text-accent-teal"
            >
              <CheckIcon className="w-6 h-6" />
            </div>

            <h1 className="mt-3.5 text-2xl font-extrabold tracking-[-0.03em] text-foreground">
              Your application is in.
            </h1>
            <p className="mt-1.5 max-w-[58ch] text-[0.9375rem] leading-relaxed text-muted-foreground">
              Submitted for <strong className="font-bold text-foreground">{roleTitle}</strong>
              {roleDepartment ? ` in ${roleDepartment}` : ''}. It goes to the hiring team on{' '}
              {requisitionId && requisitionId !== 'general' ? `requisition ${requisitionId}` : 'this requisition'}, alongside
              every other candidate.
            </p>

            <dl className="mt-5 grid grid-cols-1 gap-px min-[560px]:grid-cols-2 min-[760px]:grid-cols-4 rounded-card overflow-hidden bg-border border border-border">
              <Fact label="Reference" value={reference ?? 'Issued by email'} />
              <Fact label="Available from" value={availableFrom ?? 'Not stated'} />
              <Fact label="Status" value={statusLabel} />
              <Fact label="Applications close" value={closingDateLabel ?? 'No closing date'} />
            </dl>

            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link
                href="/candidate/applications"
                className="inline-flex items-center px-5 py-2.5 rounded-full text-xs font-extrabold uppercase tracking-[0.07em] bg-cta text-cta-foreground hover:bg-cta-hover transition-colors"
              >
                Track my application
              </Link>
              <Link
                href={jobsHref}
                className="inline-flex items-center px-5 py-2.5 rounded-full text-xs font-extrabold uppercase tracking-[0.07em] border border-border text-foreground hover:bg-muted transition-colors"
              >
                {isExternal ? 'Back to jobs' : 'Back to internal jobs'}
              </Link>
            </div>

            {!isExternal && (
              <p className="mt-5 max-w-[58ch] text-[0.8125rem] leading-relaxed text-muted-foreground">
                One thing left to do:{' '}
                <strong className="font-extrabold text-foreground">
                  {managerName ? `${managerName} has not been told.` : 'your current manager has not been told.'}
                </strong>{' '}
                ShumelaHire does not notify your current manager — that conversation is yours to have.
              </p>
            )}
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-[1020px] mx-auto w-full">
        <div className="mb-3.5">{backLink}</div>

        {/* 1. The move itself: what the job is, and — internally — where you are coming from. */}
        <header className="band-glow relative overflow-hidden rounded-card bg-band text-band-foreground px-6 py-6 md:px-7">
          <div className="relative z-[1]">
            <p className="text-[0.625rem] font-extrabold uppercase tracking-[0.16em] text-band-accent">
              {isExternal ? 'Application' : 'Internal move'}
            </p>
            <h1 className="mt-1.5 text-[1.6rem] font-extrabold tracking-[-0.035em] leading-[1.14] text-balance">
              {roleTitle}
            </h1>
            {requisitionLine && <p className="mt-1.5 text-[0.8125rem] text-band-muted">{requisitionLine}</p>}

            <div
              className={`mt-5 grid gap-2.5 ${
                showCurrentRole ? 'min-[720px]:[grid-template-columns:1fr_44px_1fr] min-[720px]:gap-0' : ''
              }`}
            >
              {showCurrentRole && (
                <>
                  <MoveSide
                    kicker="You are here"
                    role={employee?.jobTitle ?? ''}
                    facts={[
                      employee?.department,
                      employee?.jobGrade ? (
                        <>
                          Grade <b className="font-bold text-band-strong">{employee.jobGrade}</b>
                        </>
                      ) : null,
                      tenure ? (
                        <>
                          <b className="font-bold text-band-strong">{tenure}</b> in role
                        </>
                      ) : null,
                      managerName ? (
                        <>
                          Reports to <b className="font-bold text-band-strong">{managerName}</b>
                        </>
                      ) : null,
                    ].filter(Boolean)}
                  />
                  <div className="grid place-items-center text-band-dim" aria-hidden="true">
                    <ArrowRightIcon className="w-5 h-5 rotate-90 min-[720px]:rotate-0" />
                  </div>
                </>
              )}

              <MoveSide
                highlight
                kicker="Applying for"
                role={roleTitle}
                facts={[
                  roleDepartment,
                  roleLocation,
                  roleEmploymentType ? getEmploymentTypeLabel(roleEmploymentType) : null,
                ].filter(Boolean)}
              />
            </div>
          </div>
        </header>

        {/* 2. The facts of the role, off the requisition and the advert. */}
        {factsStrip}

        {error && (
          <div
            role="alert"
            className="mt-3.5 p-4 bg-error-bg border border-error rounded-control flex gap-3"
          >
            <ExclamationTriangleIcon className="w-5 h-5 shrink-0 text-error" aria-hidden="true" />
            <div>
              <h2 className="text-sm font-bold text-foreground">Application not submitted</h2>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* 3. + 4. The questions, and what happens after them. */}
        <div className="mt-3.5 grid gap-3.5 items-start min-[900px]:[grid-template-columns:1.55fr_1fr]">
          <form
            onSubmit={handleSubmit}
            noValidate
            className="bg-card border border-border rounded-card shadow-sm"
          >
            {/* Who is applying — one line, not a section of disabled boxes. */}
            <div className="flex flex-wrap items-center gap-2.5 px-5 py-3 border-b border-border bg-muted text-[0.8125rem] text-muted-foreground rounded-t-card">
              <span
                aria-hidden="true"
                className="w-[30px] h-[30px] shrink-0 rounded-full grid place-items-center bg-primary text-primary-foreground text-[0.6875rem] font-extrabold"
              >
                {initials(user?.name)}
              </span>
              <span>
                Applying as <b className="font-extrabold text-foreground">{user?.name ?? 'you'}</b>
                {user?.email ? <> · {user.email}</> : null}
                {employee?.employeeNumber ? (
                  <>
                    {' '}· Employee no. <b className="font-extrabold text-foreground">{employee.employeeNumber}</b>
                  </>
                ) : null}
              </span>
              <Link
                href={profileHref}
                className="ml-auto text-xs font-bold text-link hover:text-link-hover hover:underline"
              >
                Update my profile
              </Link>
            </div>

            {/* Q1 — availability */}
            <div className="px-5 py-5 border-b border-border">
              <label htmlFor="availability-date" className="block text-[0.9375rem] font-extrabold tracking-[-0.015em] text-foreground">
                <span
                  aria-hidden="true"
                  className="inline-grid place-items-center w-5 h-5 rounded-md mr-2 align-[2px] bg-icon-bg-navy text-primary text-[0.6875rem] font-extrabold"
                >
                  1
                </span>
                {isExternal ? 'When could you start?' : 'When could you start in the new role?'}
              </label>
              <p className="mt-1.5 mb-3 ml-7 max-w-[56ch] text-[0.8125rem] leading-relaxed text-muted-foreground">
                {isExternal
                  ? 'Include any notice period you owe your current employer.'
                  : 'Your current team will need notice. Most internal moves allow four to six weeks — a date you can genuinely meet is better than the earliest possible one.'}
              </p>
              <div className="ml-7">
                <input
                  type="date"
                  id="availability-date"
                  value={formData.availabilityDate}
                  onChange={(e) => handleInputChange('availabilityDate', e.target.value)}
                  className="w-full max-w-[260px] text-[0.9375rem] text-foreground bg-card border border-border rounded-control px-3 py-2.5 transition-colors focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Q2 — the one question that is required */}
            <div className="px-5 py-5 border-b border-border">
              <label htmlFor="reason-for-application" className="block text-[0.9375rem] font-extrabold tracking-[-0.015em] text-foreground">
                <span
                  aria-hidden="true"
                  className="inline-grid place-items-center w-5 h-5 rounded-md mr-2 align-[2px] bg-icon-bg-navy text-primary text-[0.6875rem] font-extrabold"
                >
                  2
                </span>
                {isExternal ? 'Why this role?' : 'Why this move?'}
                <span className="text-error ml-1" aria-hidden="true">*</span>
              </label>
              <p className="mt-1.5 mb-3 ml-7 max-w-[56ch] text-[0.8125rem] leading-relaxed text-muted-foreground">
                {isExternal
                  ? 'What draws you to the role and to the organisation. A few specific sentences beat a page of general enthusiasm.'
                  : 'What draws you to this role now, and what you want from it. The hiring manager and your HR partner both read this — a few honest sentences beat a page of general enthusiasm.'}
              </p>
              <div className="ml-7">
                <textarea
                  id="reason-for-application"
                  rows={4}
                  required
                  aria-required="true"
                  aria-describedby="reason-for-application-count"
                  value={formData.reasonForApplication}
                  onChange={(e) => handleInputChange('reasonForApplication', e.target.value)}
                  className="w-full min-h-[118px] resize-y leading-relaxed text-[0.9375rem] text-foreground bg-card border border-border rounded-control px-3 py-2.5 transition-colors focus:outline-none focus:border-primary"
                  placeholder={
                    isExternal
                      ? 'I have spent six years building payment systems and want to work somewhere the reliability actually matters…'
                      : 'I have spent three years on the payments platform and want to take on the design of it rather than the delivery…'
                  }
                />
                <div
                  id="reason-for-application-count"
                  aria-live="polite"
                  className="mt-1.5 flex justify-between gap-3 text-[0.6875rem] text-muted-foreground"
                >
                  <span>
                    Aim for{' '}
                    <b className="font-bold text-foreground">
                      {WORD_TARGET_MIN}–{WORD_TARGET_MAX} words
                    </b>
                  </span>
                  <span>
                    <b className="font-bold text-foreground tabular-nums">{whyWords}</b> words
                  </span>
                </div>
                <div className="mt-1.5 h-[3px] rounded-full bg-border overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      whyWords > 0 && whyWords < WORD_TARGET_MIN ? 'bg-accent-gold' : 'bg-accent-teal'
                    }`}
                    style={{ width: `${whyPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Q3 — optional */}
            <div className="px-5 py-5">
              <label htmlFor="cover-letter" className="block text-[0.9375rem] font-extrabold tracking-[-0.015em] text-foreground">
                <span
                  aria-hidden="true"
                  className="inline-grid place-items-center w-5 h-5 rounded-md mr-2 align-[2px] bg-icon-bg-navy text-primary text-[0.6875rem] font-extrabold"
                >
                  3
                </span>
                {isExternal ? 'Cover letter' : 'What you bring to it'}
                <span className="ml-2 text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  Optional
                </span>
              </label>
              <p className="mt-1.5 mb-3 ml-7 max-w-[56ch] text-[0.8125rem] leading-relaxed text-muted-foreground">
                {isExternal
                  ? 'Anything your CV does not already cover.'
                  : 'Work here that is relevant, and anything the panel would not already know. Your record and current grade are already on your employee file — you do not need to repeat them.'}
              </p>
              <div className="ml-7">
                <textarea
                  id="cover-letter"
                  rows={4}
                  aria-describedby="cover-letter-count"
                  value={formData.coverLetter}
                  onChange={(e) => handleInputChange('coverLetter', e.target.value)}
                  className="w-full min-h-[118px] resize-y leading-relaxed text-[0.9375rem] text-foreground bg-card border border-border rounded-control px-3 py-2.5 transition-colors focus:outline-none focus:border-primary"
                  placeholder={
                    isExternal
                      ? 'Describe how your experience fits this role…'
                      : 'Led the migration off the legacy ledger; mentored two graduates through their first year…'
                  }
                />
                <div
                  id="cover-letter-count"
                  aria-live="polite"
                  className="mt-1.5 flex justify-between gap-3 text-[0.6875rem] text-muted-foreground"
                >
                  <span>Optional</span>
                  <span>
                    <b className="font-bold text-foreground tabular-nums">{bringWords}</b> words
                  </span>
                </div>
              </div>
            </div>

            {/* 5. The form's own footer. Deliberately not sticky: on a three-question
                form it bought nothing and floated over the last question. */}
            <div className="flex flex-wrap items-center gap-3.5 px-5 py-4 border-t border-border bg-muted rounded-b-card">
              <p className="flex-1 min-w-[220px] m-0 text-xs leading-relaxed text-muted-foreground">
                Submitting confirms the information here is accurate. You can withdraw at any point before an offer is made.
              </p>
              <button
                type="submit"
                disabled={loading}
                className="ml-auto inline-flex items-center px-5 py-2.5 rounded-full text-xs font-extrabold uppercase tracking-[0.07em] bg-cta text-cta-foreground hover:bg-cta-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin"
                    />
                    Submitting…
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="w-4 h-4 mr-2" aria-hidden="true" />
                    Submit application
                  </>
                )}
              </button>
            </div>
          </form>

          <aside className="flex flex-col gap-3.5 min-[900px]:sticky min-[900px]:top-[4.5rem]">
            <section className="bg-card border border-border rounded-card shadow-sm" aria-labelledby="next-steps-heading">
              <div className="px-5 py-3.5 border-b border-border">
                <h2 id="next-steps-heading" className="text-[0.8125rem] font-extrabold tracking-[-0.01em] text-foreground">
                  What happens next
                </h2>
              </div>
              <div className="flex flex-col">
                <Step
                  step={1}
                  current
                  label="You submit"
                  detail="It appears immediately under My Applications, where you can follow it."
                />
                <Step
                  step={2}
                  label={isExternal ? 'Screening' : 'The hiring team reviews it'}
                  detail={
                    isExternal
                      ? 'The recruitment team reviews applications as they arrive.'
                      : 'The hiring manager on this requisition sees your application alongside external candidates.'
                  }
                />
                <Step
                  step={3}
                  last
                  label="Shortlist"
                  detail="If shortlisted you will be invited to interview. You are told either way."
                />
              </div>
            </section>

            {!isExternal && (
              <p className="px-4 py-3.5 rounded-control text-xs leading-relaxed bg-surface-navy border border-icon-bg-navy text-foreground">
                <b className="font-extrabold">Your current manager is not notified by ShumelaHire.</b>{' '}
                {managerName ? `Telling ${managerName} yourself` : 'Telling them yourself'}, before or soon after you apply,
                is the courtesy most teams expect.
              </p>
            )}
          </aside>
        </div>
      </div>
    </PageWrapper>
  );
}
