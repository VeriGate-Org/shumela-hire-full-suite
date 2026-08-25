'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-fetch';
import IdentityBand from '@/components/record/IdentityBand';
import DecisionBar, { SecondaryAction } from '@/components/record/DecisionBar';
import StatusPill from '@/components/StatusPill';
import { getEnumLabel } from '@/utils/enumLabels';
import { DocumentTextIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface Education {
  institution?: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
}

interface Experience {
  company?: string;
  position?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

interface ApplicantDocument {
  id: string;
  type: string;
  filename: string;
  url?: string;
  fileSizeFormatted?: string;
  uploadedAt?: string;
}

interface Applicant {
  id: string;
  name?: string;
  surname?: string;
  email?: string;
  phone?: string;
  idPassportNumber?: string;
  address?: string;
  education?: string;
  experience?: string;
  skills?: string;
  gender?: string;
  race?: string;
  disabilityStatus?: string;
  citizenshipStatus?: string;
  demographicsConsent?: boolean;
  demographicsRedacted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  documents?: ApplicantDocument[];
}

interface ApplicationEntry {
  applicationId?: string;
  jobTitle?: string;
  department?: string;
  status?: string;
  submittedAt?: string;
}

interface ApplicationSummary {
  total: number;
  active: number;
  hired: boolean;
  lastAppliedAt?: string;
  applications: ApplicationEntry[];
}

interface ApplicantRecordProps {
  applicantId: string | number;
  onEdit: () => void;
  onBack: () => void;
}

function formatDate(value?: string): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? undefined
    : d.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Education, experience and skills are JSON arrays kept in String columns, so every reader has to
 * parse them. A malformed value yields an empty list rather than throwing — one bad record should
 * not take the page with it.
 */
function parseList<T>(raw?: string): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

/**
 * The person, as distinct from any one of their applications.
 *
 * <p>This screen did not exist: {@code ApplicantProfile} is a form, so the only way to see who
 * someone was, was to open the thing that lets you change them. Everything drawn here was already
 * on the API and rendered nowhere.
 *
 * <p>Its reason to exist beside the application record is the application history — the one fact
 * that cannot live on a single application.
 */
export default function ApplicantRecord({ applicantId, onEdit, onBack }: ApplicantRecordProps) {
  const [applicant, setApplicant] = useState<Applicant | null>(null);
  const [summary, setSummary] = useState<ApplicationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/applicants/${applicantId}`);
      if (!res.ok) throw new Error(res.status === 404 ? 'Applicant not found' : `HTTP ${res.status}`);
      setApplicant(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load this applicant');
    } finally {
      setLoading(false);
    }

    try {
      const res = await apiFetch(`/api/applicants/${applicantId}/application-summary`);
      if (res.ok) setSummary(await res.json());
    } catch {
      // Left null. The history section then says it could not be read, rather than showing "none".
    }
  }, [applicantId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !applicant) {
    return (
      <div className="enterprise-card p-8 text-center">
        <p className="text-sm text-muted-foreground">{error ?? 'Applicant not found'}</p>
        <button onClick={onBack} className="mt-4 text-sm font-semibold text-primary hover:underline">
          Back to applicants
        </button>
      </div>
    );
  }

  const fullName = [applicant.name, applicant.surname].filter(Boolean).join(' ') || 'Unnamed applicant';
  const education = parseList<Education>(applicant.education);
  const experience = parseList<Experience>(applicant.experience);
  const skills = parseList<string>(applicant.skills);
  const documents = applicant.documents ?? [];

  // Three states, not two. Redacted means the answers are gone; withheld means they were never
  // given; shown means consent is recorded. Collapsing any pair of these misrepresents the record.
  const demographics = applicant.demographicsRedacted
    ? 'redacted'
    : applicant.demographicsConsent
      ? 'shown'
      : 'withheld';

  const period = (from?: string, to?: string) => {
    const start = formatDate(from) ?? from;
    const end = formatDate(to) ?? to;
    if (!start && !end) return undefined;
    return `${start ?? 'Unknown'} – ${end ?? 'present'}`;
  };

  return (
    <div className="space-y-4">
      <IdentityBand
        eyebrow="Applicant · the person, not an application"
        title={fullName}
        subtitle={
          <>
            {applicant.createdAt && <>On file since {formatDate(applicant.createdAt)}</>}
            {summary && summary.total > 0 && (
              <> · {summary.total} application{summary.total === 1 ? '' : 's'}</>
            )}
          </>
        }
        figures={
          summary
            ? [
                { label: 'Applications', value: String(summary.total) },
                { label: 'Live now', value: String(summary.active) },
                { label: 'Ever hired', value: summary.hired ? 'Yes' : 'No' },
              ]
            : []
        }
        actions={
          <button
            onClick={onEdit}
            className="rounded-full bg-band-accent px-4 py-2 text-xs font-extrabold uppercase tracking-[0.06em] text-band"
          >
            Edit details
          </button>
        }
      />

      {summary && summary.total > 0 && (
        <DecisionBar
          ask={
            summary.total === 1
              ? 'One application on record.'
              : `${summary.total} applications in this tenant.`
          }
          why={
            summary.lastAppliedAt
              ? `Last applied ${formatDate(summary.lastAppliedAt)}. ${
                  summary.active > 0
                    ? `${summary.active} still live.`
                    : 'None currently live.'
                }`
              : undefined
          }
          tone={summary.active > 0 ? 'owed' : 'settled'}
        >
          <SecondaryAction onClick={onEdit}>Edit details</SecondaryAction>
        </DecisionBar>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="enterprise-card overflow-hidden">
            <div className="flex items-baseline justify-between gap-3 border-b border-border px-5 py-4">
              <h2 className="text-[0.8125rem] font-extrabold tracking-tight">Applications</h2>
              {summary && (
                <span className="text-xs text-muted-foreground">
                  {summary.total} · {summary.active} live
                </span>
              )}
            </div>
            {!summary ? (
              <p className="px-5 py-4 text-sm text-muted-foreground">
                This person&rsquo;s application history could not be read.
              </p>
            ) : summary.applications.length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted-foreground">
                No applications on record for this person.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {summary.applications.map((entry, index) => (
                  <div
                    key={entry.applicationId ?? index}
                    className="flex items-center justify-between gap-4 px-5 py-3.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{entry.jobTitle || 'Unknown role'}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.department || 'No department recorded'}
                        {entry.submittedAt && <> · {formatDate(entry.submittedAt)}</>}
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-3">
                      {entry.status && (
                        <StatusPill value={entry.status} domain="applicationStatus" size="sm" />
                      )}
                      {entry.applicationId && (
                        <Link
                          href={`/applications/${entry.applicationId}`}
                          className="whitespace-nowrap text-xs font-extrabold text-primary hover:underline"
                        >
                          Open
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="border-t border-border bg-muted/40 px-5 py-2.5 text-xs text-muted-foreground">
              Counts <b className="font-bold text-foreground">applications</b>, not people — every
              figure here is about this one person.
            </p>
          </section>

          <section className="enterprise-card overflow-hidden">
            <div className="flex items-baseline justify-between gap-3 border-b border-border px-5 py-4">
              <h2 className="text-[0.8125rem] font-extrabold tracking-tight">Experience</h2>
              <span className="text-xs text-muted-foreground">
                {experience.length} {experience.length === 1 ? 'role' : 'roles'}
              </span>
            </div>
            {experience.length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted-foreground">No experience captured.</p>
            ) : (
              <div className="divide-y divide-border">
                {experience.map((role, index) => (
                  <div key={index} className="px-5 py-3.5">
                    <p className="text-sm font-bold">{role.position || 'Unnamed role'}</p>
                    <p className="text-xs text-muted-foreground">
                      {role.company || 'Unknown employer'}
                      {period(role.startDate, role.endDate) && <> · {period(role.startDate, role.endDate)}</>}
                    </p>
                    {role.description && (
                      <p className="mt-1.5 text-sm text-foreground">{role.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="enterprise-card overflow-hidden">
            <div className="flex items-baseline justify-between gap-3 border-b border-border px-5 py-4">
              <h2 className="text-[0.8125rem] font-extrabold tracking-tight">Education</h2>
              <span className="text-xs text-muted-foreground">
                {education.length} {education.length === 1 ? 'qualification' : 'qualifications'}
              </span>
            </div>
            {education.length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted-foreground">No qualifications captured.</p>
            ) : (
              <div className="divide-y divide-border">
                {education.map((qual, index) => (
                  <div key={index} className="px-5 py-3.5">
                    <p className="text-sm font-bold">
                      {[qual.degree, qual.fieldOfStudy].filter(Boolean).join(', ') || 'Unnamed qualification'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {qual.institution || 'Unknown institution'}
                      {period(qual.startDate, qual.endDate) && <> · {period(qual.startDate, qual.endDate)}</>}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="enterprise-card overflow-hidden">
            <div className="flex items-baseline justify-between gap-3 border-b border-border px-5 py-4">
              <h2 className="text-[0.8125rem] font-extrabold tracking-tight">Skills</h2>
              <span className="text-xs text-muted-foreground">{skills.length} listed</span>
            </div>
            <div className="p-5">
              {skills.length === 0 ? (
                <p className="text-sm text-muted-foreground">No skills captured.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <span
                      key={index}
                      className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-semibold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <section className="enterprise-card overflow-hidden">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-[0.8125rem] font-extrabold tracking-tight">Contact</h2>
            </div>
            <dl className="space-y-3 p-5">
              <Term label="Email" value={applicant.email} />
              <Term label="Phone" value={applicant.phone} />
              <Term label="Address" value={applicant.address} />
            </dl>
          </section>

          <section className="enterprise-card overflow-hidden">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-[0.8125rem] font-extrabold tracking-tight">Identity</h2>
            </div>
            <div className="p-5">
              <dt className="text-[0.5625rem] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
                ID number
              </dt>
              <dd className="mt-0.5 font-mono text-sm tabular-nums">
                {applicant.idPassportNumber || <span className="text-muted-foreground">Not recorded</span>}
              </dd>
              {applicant.idPassportNumber && (
                // Said, not left to be discovered. An unexplained row of asterisks reads as a bug.
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Masked by the API. The full number is never sent to this screen.
                </p>
              )}
            </div>
          </section>

          <section className="enterprise-card overflow-hidden">
            <div className="flex items-baseline justify-between gap-3 border-b border-border px-5 py-4">
              <h2 className="text-[0.8125rem] font-extrabold tracking-tight">Employment equity</h2>
              <span className="text-xs text-muted-foreground">
                {demographics === 'shown' ? 'Consented' : demographics === 'redacted' ? 'Redacted' : 'Withheld'}
              </span>
            </div>
            <div className="p-5">
              {demographics === 'redacted' ? (
                <p className="text-sm text-muted-foreground">
                  These answers have been erased from the record. They cannot be shown because they
                  no longer exist, which is not the same as never having been given.
                </p>
              ) : demographics === 'withheld' ? (
                <p className="text-sm text-muted-foreground">
                  Not given. This is optional and declining it does not affect any application.
                </p>
              ) : (
                <>
                  <dl className="space-y-3">
                    <Term label="Gender" value={applicant.gender} absent="Not declared" />
                    <Term label="Population group" value={applicant.race} absent="Not declared" />
                    <Term label="Disability" value={applicant.disabilityStatus} absent="Not declared" />
                    <Term label="Citizenship" value={applicant.citizenshipStatus} absent="Not declared" />
                  </dl>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Given voluntarily for employment-equity reporting.
                  </p>
                </>
              )}
            </div>
          </section>

          <section className="enterprise-card overflow-hidden">
            <div className="flex items-baseline justify-between gap-3 border-b border-border px-5 py-4">
              <h2 className="text-[0.8125rem] font-extrabold tracking-tight">Documents</h2>
              <span className="text-xs text-muted-foreground">{documents.length} on file</span>
            </div>
            {documents.length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted-foreground">No documents on file.</p>
            ) : (
              <div className="divide-y divide-border">
                {documents.map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-accent/50"
                  >
                    <div className="flex min-w-0 items-center">
                      <DocumentTextIcon className="mr-3 h-5 w-5 flex-shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{doc.filename}</p>
                        <p className="text-xs text-muted-foreground">
                          {getEnumLabel('documentType', doc.type)}
                          {doc.fileSizeFormatted ? ` · ${doc.fileSizeFormatted}` : ''}
                        </p>
                      </div>
                    </div>
                    <ArrowDownTrayIcon className="ml-3 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  </a>
                ))}
              </div>
            )}
          </section>

          <section className="enterprise-card overflow-hidden">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-[0.8125rem] font-extrabold tracking-tight">Record</h2>
            </div>
            <dl className="space-y-3 p-5">
              <Term label="Created" value={formatDate(applicant.createdAt)} />
              <Term label="Last updated" value={formatDate(applicant.updatedAt)} />
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}

function Term({ label, value, absent = 'Not recorded' }: { label: string; value?: string; absent?: string }) {
  return (
    <div>
      <dt className="text-[0.5625rem] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </dt>
      <dd className={`mt-0.5 text-sm ${value ? 'break-words text-foreground' : 'text-muted-foreground'}`}>
        {value || absent}
      </dd>
    </div>
  );
}
