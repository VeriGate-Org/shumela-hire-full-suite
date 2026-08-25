'use client';

import React, { useState, useEffect, useCallback } from 'react';
import PageWrapper from '@/components/PageWrapper';
import IdentityBand from '@/components/record/IdentityBand';
import { useToast } from '@/components/Toast';
import { apiFetchJson } from '@/lib/api-fetch';
import { useAuth } from '@/contexts/AuthContext';
import SearchableDropdown from '@/components/SearchableDropdown';
import type { DropdownOption } from '@/components/SearchableDropdown';
import ConfirmDialog from '@/components/ConfirmDialog';
import DistributionStrip from '@/components/record/DistributionStrip';
import FilterChips from '@/components/record/FilterChips';
import {
  AGENCY_FILTERS,
  AgencyRow,
  AgencySummary,
  NO_RAND_FIGURE,
  beeLabel,
  byContractState,
  contractLabel,
  feeLabel,
  filterCount,
  isAgencySummary,
  matchesFilter,
  placementLabel,
  stateOf,
  STATE_LABELS,
} from './queue';

const SPECIALIZATION_OPTIONS: DropdownOption[] = [
  { value: 'IT & Software Development', label: 'IT & Software Development' },
  { value: 'Finance & Accounting', label: 'Finance & Accounting' },
  { value: 'Engineering', label: 'Engineering' },
  { value: 'Healthcare & Medical', label: 'Healthcare & Medical' },
  { value: 'Sales & Marketing', label: 'Sales & Marketing' },
  { value: 'Human Resources', label: 'Human Resources' },
  { value: 'Legal & Compliance', label: 'Legal & Compliance' },
  { value: 'Manufacturing & Operations', label: 'Manufacturing & Operations' },
  { value: 'Construction & Mining', label: 'Construction & Mining' },
  { value: 'Education & Training', label: 'Education & Training' },
  { value: 'Logistics & Supply Chain', label: 'Logistics & Supply Chain' },
  { value: 'Retail & Hospitality', label: 'Retail & Hospitality' },
  { value: 'Media & Communications', label: 'Media & Communications' },
  { value: 'Agriculture', label: 'Agriculture' },
  { value: 'Government & Public Sector', label: 'Government & Public Sector' },
  { value: 'Executive Search', label: 'Executive Search' },
  { value: 'Temporary Staffing', label: 'Temporary Staffing' },
  { value: 'General Recruitment', label: 'General Recruitment' },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type AgencyStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'SUSPENDED' | 'TERMINATED';
type SubmissionStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

// The row shape now comes from queue.ts, which mirrors AgencyResponse — contract state derived
// against today, and the placement rate that previously needed one dashboard call per agency.
type Agency = AgencyRow & {
  contactPerson: string;
  contactEmail: string;
  createdAt: string;
  updatedAt?: string;
};

interface AgencySubmission {
  id: number;
  agency?: { id: number; agencyName: string };
  jobPosting?: { id: number; title?: string };
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  cvFileKey?: string;
  coverNote?: string;
  status: SubmissionStatus;
  submittedAt: string;
  reviewedAt?: string;
}

interface AgencyDashboard {
  agencyName: string;
  status: AgencyStatus;
  totalSubmissions: number;
  acceptedSubmissions: number;
  placementRate: number;
}

type ModalType = null | 'register' | 'edit' | 'submitCandidate' | 'reviewSubmission';

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_BADGE: Record<AgencyStatus, string> = {
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-700',
  SUSPENDED: 'bg-orange-100 text-orange-700',
  TERMINATED: 'bg-red-100 text-red-700',
};

const STATUS_LABEL: Record<AgencyStatus, string> = {
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  SUSPENDED: 'Suspended',
  TERMINATED: 'Terminated',
};


// ─── Default form values ──────────────────────────────────────────────────────

const EMPTY_AGENCY_FORM = {
  agencyName: '',
  registrationNumber: '',
  contactPerson: '',
  contactEmail: '',
  contactPhone: '',
  specializations: '',
  feePercentage: '',
  contractStartDate: '',
  contractEndDate: '',
  beeLevel: '',
};

const EMPTY_SUBMISSION_FORM = {
  jobPostingId: '',
  candidateName: '',
  candidateEmail: '',
  candidatePhone: '',
  coverNote: '',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AgenciesPage() {
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const hasAccess = user?.role === 'ADMIN' || user?.role === 'HR_MANAGER' || user?.role === 'RECRUITER';

  // Agency list
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [agenciesLoading, setAgenciesLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AgencyStatus | 'ALL'>('ALL');
  // Counts across the whole panel, from GET /api/agencies/summary.
  const [summary, setSummary] = useState<AgencySummary | null>(null);
  const [contractFilter, setContractFilter] = useState('all');

  // Selected agency detail
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [dashboard, setDashboard] = useState<AgencyDashboard | null>(null);

  // Modals
  const [modal, setModal] = useState<ModalType>(null);
  // The getter used to be discarded — `const [, setEditingAgency]`. openEdit() set this and
  // nothing could read it, so handleSaveAgency had no way to tell an edit from a registration and
  // posted to /register either way. Every edit created a duplicate. The modal title reads off
  // `modal === 'edit'`, which is why the form looked right while the save was wrong.
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [reviewingSubmission, setReviewingSubmission] = useState<AgencySubmission | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  // Holds the id of the agency whose approve/suspend call is in flight. Widened to string because
  // the API returns string ids — the numeric type was a lie the value only ever survived by being
  // compared against another id of the same wrong type.
  const [statusActionLoading, setStatusActionLoading] = useState<string | number | null>(null);
  const [approveAgency, setApproveAgency] = useState<Agency | null>(null);
  const [suspendAgency, setSuspendAgency] = useState<Agency | null>(null);

  // Forms
  const [agencyForm, setAgencyForm] = useState(EMPTY_AGENCY_FORM);
  const [submissionForm, setSubmissionForm] = useState(EMPTY_SUBMISSION_FORM);

  // Job postings for submission dropdown
  const [jobPostings, setJobPostings] = useState<{ id: number; title: string; department?: string }[]>([]);
  const [jobPostingsLoading, setJobPostingsLoading] = useState(false);

  const jobPostingOptions: DropdownOption[] = jobPostings.map((jp) => ({
    value: String(jp.id),
    label: jp.title,
    description: jp.department ? `Department: ${jp.department}` : undefined,
  }));

  // ─── Data loading ───────────────────────────────────────────────────────────

  const loadJobPostings = useCallback(async () => {
    try {
      setJobPostingsLoading(true);
      const data = await apiFetchJson<{ id: number; title: string; department?: string }[] | { content: { id: number; title: string; department?: string }[] }>('/api/job-postings?size=200');
      setJobPostings(Array.isArray(data) ? data : data.content ?? []);
    } catch {
      // silently fail - dropdown will just be empty
    } finally {
      setJobPostingsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobPostings();
  }, [loadJobPostings]);

  const loadAgencies = useCallback(async () => {
    try {
      setAgenciesLoading(true);
      const data = await apiFetchJson<Agency[] | { content: Agency[] }>('/api/agencies');
      setAgencies(Array.isArray(data) ? data : data.content ?? []);
    } catch {
      toast('Failed to load agencies', 'error');
    } finally {
      setAgenciesLoading(false);
    }

    // Counts across the whole panel, guarded — an error body is an object too, and reading .lapsed
    // off it would render a strip of zeroes that looks like a panel with nothing wrong.
    try {
      const payload = await apiFetchJson<unknown>('/api/agencies/summary');
      setSummary(isAgencySummary(payload) ? payload : null);
    } catch {
      setSummary(null);
    }
  }, [toast]);

  const loadAgencyDetail = useCallback(
    async (agency: Agency) => {
      setSubmissionsLoading(true);
      setDashboard(null);
      try {
        const dashboardData = await apiFetchJson<AgencyDashboard>(`/api/agencies/${agency.id}/dashboard`);
        setDashboard(dashboardData);
        // Submissions list is not a separate endpoint — we derive counts from dashboard
        // and show submission form separately
      } catch {
        toast('Failed to load agency details', 'error');
      } finally {
        setSubmissionsLoading(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    loadAgencies();
  }, [loadAgencies]);

  const handleSelectAgency = (agency: Agency) => {
    setSelectedAgency(agency);
    loadAgencyDetail(agency);
  };

  // ─── Register / edit agency ────────────────────────────────────────────────

  const openRegister = () => {
    setEditingAgency(null);
    setAgencyForm(EMPTY_AGENCY_FORM);
    setModal('register');
  };

  const openEdit = (agency: Agency) => {
    setEditingAgency(agency);
    setAgencyForm({
      agencyName: agency.agencyName,
      registrationNumber: agency.registrationNumber ?? '',
      contactPerson: agency.contactPerson,
      contactEmail: agency.contactEmail,
      contactPhone: agency.contactPhone ?? '',
      specializations: agency.specializations ?? '',
      feePercentage: agency.feePercentage != null ? String(agency.feePercentage) : '',
      contractStartDate: agency.contractStartDate ?? '',
      contractEndDate: agency.contractEndDate ?? '',
      beeLevel: agency.beeLevel != null ? String(agency.beeLevel) : '',
    });
    setModal('edit');
  };

  const handleSaveAgency = async () => {
    if (!agencyForm.agencyName.trim() || !agencyForm.contactPerson.trim() || !agencyForm.contactEmail.trim()) {
      toast('Agency name, contact person, and email are required', 'error');
      return;
    }
    try {
      setActionLoading(true);
      const payload = {
        ...agencyForm,
        feePercentage: agencyForm.feePercentage ? Number(agencyForm.feePercentage) : undefined,
        beeLevel: agencyForm.beeLevel ? Number(agencyForm.beeLevel) : undefined,
        contractStartDate: agencyForm.contractStartDate || undefined,
        contractEndDate: agencyForm.contractEndDate || undefined,
        registrationNumber: agencyForm.registrationNumber || undefined,
        contactPhone: agencyForm.contactPhone || undefined,
        specializations: agencyForm.specializations || undefined,
      };
      // An edit updates the record it was opened from. This used to POST to /register
      // unconditionally — ignoring editingAgency entirely — so every edit created a duplicate
      // under a new id and left the original untouched.
      if (editingAgency) {
        const updated = await apiFetchJson<Agency>(`/api/agencies/${editingAgency.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        // The detail pane holds its own copy, so it would keep showing the old name until the
        // agency was re-selected.
        setSelectedAgency((current) =>
          current && current.id === editingAgency.id ? { ...current, ...updated } : current,
        );
        toast('Agency updated successfully', 'success');
      } else {
        await apiFetchJson('/api/agencies/register', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast('Agency registered successfully', 'success');
      }
      setModal(null);
      setEditingAgency(null);
      await loadAgencies();
    } catch {
      toast(editingAgency ? 'Failed to update agency' : 'Failed to register agency', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Approve / suspend ─────────────────────────────────────────────────────

  const handleApprove = (agency: Agency) => {
    setApproveAgency(agency);
  };

  const confirmApprove = async () => {
    if (!approveAgency) return;
    const agency = approveAgency;
    setApproveAgency(null);
    try {
      setStatusActionLoading(agency.id);
      const updated = await apiFetchJson<Agency>(`/api/agencies/${agency.id}/approve`, { method: 'POST' });
      toast('Agency approved', 'success');
      setAgencies((prev) => prev.map((a) => (a.id === agency.id ? updated : a)));
      if (selectedAgency?.id === agency.id) {
        setSelectedAgency(updated);
        loadAgencyDetail(updated);
      }
    } catch {
      toast('Failed to approve agency', 'error');
    } finally {
      setStatusActionLoading(null);
    }
  };

  const handleSuspend = (agency: Agency) => {
    setSuspendAgency(agency);
  };

  const confirmSuspend = async () => {
    if (!suspendAgency) return;
    const agency = suspendAgency;
    setSuspendAgency(null);
    try {
      setStatusActionLoading(agency.id);
      const updated = await apiFetchJson<Agency>(`/api/agencies/${agency.id}/suspend`, { method: 'POST' });
      toast('Agency suspended', 'success');
      setAgencies((prev) => prev.map((a) => (a.id === agency.id ? updated : a)));
      if (selectedAgency?.id === agency.id) {
        setSelectedAgency(updated);
        loadAgencyDetail(updated);
      }
    } catch {
      toast('Failed to suspend agency', 'error');
    } finally {
      setStatusActionLoading(null);
    }
  };

  // ─── Submit candidate ──────────────────────────────────────────────────────

  const openSubmitCandidate = () => {
    setSubmissionForm(EMPTY_SUBMISSION_FORM);
    setModal('submitCandidate');
  };

  const handleSubmitCandidate = async () => {
    if (!selectedAgency) return;
    if (
      !submissionForm.jobPostingId.trim() ||
      !submissionForm.candidateName.trim() ||
      !submissionForm.candidateEmail.trim()
    ) {
      toast('Job posting ID, candidate name, and email are required', 'error');
      return;
    }
    try {
      setActionLoading(true);
      await apiFetchJson(`/api/agencies/${selectedAgency.id}/submissions`, {
        method: 'POST',
        body: JSON.stringify({
          jobPosting: { id: Number(submissionForm.jobPostingId) },
          candidateName: submissionForm.candidateName,
          candidateEmail: submissionForm.candidateEmail,
          candidatePhone: submissionForm.candidatePhone || undefined,
          coverNote: submissionForm.coverNote || undefined,
        }),
      });
      toast('Candidate submitted successfully', 'success');
      setModal(null);
      await loadAgencyDetail(selectedAgency);
    } catch {
      toast('Failed to submit candidate', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Review submission ─────────────────────────────────────────────────────

  const handleReview = async (accept: boolean) => {
    if (!reviewingSubmission) return;
    try {
      setActionLoading(true);
      await apiFetchJson(`/api/agencies/submissions/${reviewingSubmission.id}/review`, {
        method: 'POST',
        body: JSON.stringify({ accept }),
      });
      toast(accept ? 'Submission accepted' : 'Submission rejected', 'success');
      setModal(null);
      setReviewingSubmission(null);
      if (selectedAgency) await loadAgencyDetail(selectedAgency);
    } catch {
      toast('Failed to review submission', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Derived values ────────────────────────────────────────────────────────

  // Ordered by what needs attention: lapsed first, longest lapse leading, then expiring, then by
  // placement rate — because once nothing is on fire the question is who is filling roles.
  const filteredAgencies = byContractState(
    agencies.filter((a) => {
      const matchesSearch =
        a.agencyName.toLowerCase().includes(search.toLowerCase()) ||
        a.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
        (a.contactEmail ?? '').toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
      return matchesSearch && matchesStatus && matchesFilter(contractFilter, a);
    }),
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <PageWrapper>
        <IdentityBand eyebrow="Supplier panel" title="Recruitment Agencies" subtitle="Loading…" />
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold-500" />
        </div>
      </PageWrapper>
    );
  }

  if (!hasAccess) {
    return (
      <PageWrapper>
        <IdentityBand eyebrow="Supplier panel" title="Recruitment Agencies" subtitle="You do not have permission to manage agencies." />
        <div className="bg-card rounded-[10px] border border-border p-8 text-center">
          <p className="text-muted-foreground text-sm">
            Agencies can be managed by administrators, HR managers, and recruiters.
          </p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      {/* The navy band is the page header on a queue screen, not a record component sitting under
          one — see #285. Figures here are deliberately the ones the strip below does not carry:
          the strip shows contract state, this shows what that state has cost. */}
      <IdentityBand
        eyebrow="Supplier panel"
        title="Recruitment Agencies"
        subtitle={
          summary
            ? `${summary.agencies} ${summary.agencies === 1 ? 'agency' : 'agencies'} · ${summary.totalSubmissions} ${summary.totalSubmissions === 1 ? 'submission' : 'submissions'}`
            : 'Counts unavailable'
        }
        figures={
          summary
            ? [
                {
                  label: 'Awaiting review',
                  value: summary.awaitingReview,
                  tone: (summary.awaitingReview > 0 ? 'warning' : undefined) as 'warning' | undefined,
                },
                // The headline is not "two contracts lapsed" but how many candidates were put
                // forward under contracts that had already ended.
                ...(summary.submissionsOnLapsedContracts > 0
                  ? [{
                      label: 'Sent on lapsed contracts',
                      value: summary.submissionsOnLapsedContracts,
                      tone: 'critical' as const,
                    }]
                  : []),
                // Omitted rather than shown as zero when nothing has been reviewed yet.
                ...(typeof summary.medianReviewDays === 'number'
                  ? [{ label: 'Median review', value: `${summary.medianReviewDays} days` }]
                  : []),
              ]
            : []
        }
        actions={
          <button
            onClick={openRegister}
            className="px-4 py-2 text-sm bg-gold-500 text-violet-950 rounded-full hover:bg-gold-600 font-medium"
          >
            + Register Agency
          </button>
        }
      />
      {/* Where the panel actually stands. The headline is not "two contracts lapsed" but how many
          candidates have been put forward under contracts that had already ended. */}
      {summary && (
        <div className="mb-6">
          <DistributionStrip
            buckets={[
              {
                label: 'Contract lapsed',
                count: summary.lapsed,
                detail:
                  summary.submissionsOnLapsedContracts > 0
                    ? `${summary.submissionsOnLapsedContracts} submission${
                        summary.submissionsOnLapsedContracts === 1 ? '' : 's'
                      } received since`
                    : 'Still able to submit',
                tone: summary.lapsed > 0 ? 'critical' : 'default',
              },
              {
                label: 'Expiring in 60 days',
                count: summary.expiringSoon,
                detail: 'Renewal decision due',
                tone: summary.expiringSoon > 0 ? 'warning' : 'default',
              },
              {
                label: 'No end date',
                count: summary.noEndDate,
                detail: 'Never appears in any expiry check',
                tone: summary.noEndDate > 0 ? 'warning' : 'default',
              },
              {
                label: 'Awaiting our review',
                count: summary.awaitingReview,
                detail: 'Submissions owed a decision',
              },
            ]}
            footnote={
              <>
                Across <b className="font-bold text-foreground">{summary.agencies}</b> agencies and{' '}
                <b className="font-bold text-foreground">{summary.totalSubmissions}</b> submissions.
                {summary.medianReviewDays != null && (
                  <>
                    {' '}
                    We take a median{' '}
                    <b className="font-bold text-foreground">
                      {summary.medianReviewDays} day
                      {summary.medianReviewDays === 1 ? '' : 's'}
                    </b>{' '}
                    to review a submission — a number about us, not about the panel, and it includes
                    the ones still waiting.
                  </>
                )}{' '}
                {NO_RAND_FIGURE}
              </>
            }
          />
        </div>
      )}

      <div className="flex gap-6 min-h-0">
        {/* ── Left panel: Agency list ── */}
        <div className="w-1/3 flex flex-col gap-3 min-w-0">
          {/* Search + filter */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agencies..."
            className="w-full px-3 py-2 text-sm border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-gold-400"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AgencyStatus | 'ALL')}
            className="w-full px-3 py-2 text-sm border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-gold-400"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="TERMINATED">Terminated</option>
          </select>

          {/* Contract state, which the status dropdown above cannot express: there is no EXPIRED in
              AgencyStatus, so a lapsed contract is an APPROVED agency with a past end date. */}
          <FilterChips
            chips={AGENCY_FILTERS.map((filter) => ({
              key: filter.key,
              label: filter.label,
              count: filterCount(summary, filter.key) ?? undefined,
            }))}
            activeKey={contractFilter}
            onChange={setContractFilter}
            aria-label="Filter agencies by contract state"
            note={<>Lapsed first</>}
          />

          {/* List */}
          {agenciesLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold-500" />
            </div>
          ) : filteredAgencies.length === 0 ? (
            <div className="bg-card rounded-[10px] border border-border p-8 text-center">
              <p className="text-muted-foreground text-sm">
                {search || statusFilter !== 'ALL'
                  ? 'No agencies match your filters.'
                  : 'No agencies registered yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto">
              {filteredAgencies.map((agency) => {
                const contractState = stateOf(agency);
                const contract = contractLabel(agency);
                const placement = placementLabel(agency);
                const fee = feeLabel(agency);

                return (
                <button
                  key={agency.id}
                  onClick={() => handleSelectAgency(agency)}
                  className={`w-full text-left bg-card rounded-[10px] border p-4 transition-all hover:shadow-sm ${
                    selectedAgency?.id === agency.id
                      ? 'border-gold-400 bg-gold-50/50 shadow-sm'
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-foreground truncate">{agency.agencyName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{agency.contactPerson}</p>
                    </div>
                    {/* The contract state, not the status pill. An agency whose contract ended
                        seventy days ago showed "Approved" and still does, on the record — this says
                        whether it is actually entitled to be submitting. */}
                    <span
                      className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        contractState === 'LAPSED'
                          ? 'bg-red-100 text-red-700'
                          : contractState === 'EXPIRING_SOON'
                            ? 'bg-amber-100 text-amber-800'
                            : contractState === 'SUSPENDED' || contractState === 'TERMINATED'
                              ? 'bg-muted text-muted-foreground'
                              : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {STATE_LABELS[contractState]}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    {placement ? (
                      <span className="text-xs font-semibold text-foreground tabular-nums">
                        {placement}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">No submissions yet</span>
                    )}
                    {/* Fee sits beside the rate because neither means anything alone: 18% at a 9%
                        placement rate and 12.5% at 31% are not close decisions on the same row. */}
                    {fee && <span className="text-xs text-muted-foreground">fee {fee}</span>}
                    <span className="text-xs text-muted-foreground">{beeLabel(agency)}</span>
                  </div>

                  <p
                    className={`text-xs mt-1 ${
                      contractState === 'LAPSED' ? 'text-red-600 font-medium' : 'text-muted-foreground'
                    }`}
                  >
                    {contract}
                    {contractState === 'LAPSED' &&
                      agency.submissionsSinceLapse != null &&
                      agency.submissionsSinceLapse > 0 &&
                      ` · ${agency.submissionsSinceLapse} submission${
                        agency.submissionsSinceLapse === 1 ? '' : 's'
                      } since`}
                  </p>

                  {agency.specializations && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">{agency.specializations}</p>
                  )}
                </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Right panel: Agency detail ── */}
        <div className="flex-1 min-w-0">
          {!selectedAgency ? (
            <div className="bg-card rounded-[10px] border border-border h-64 flex items-center justify-center">
              <div className="text-center">
                <p className="text-4xl mb-3">🤝</p>
                <p className="text-muted-foreground text-sm">Select an agency to view details</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Agency header */}
              <div className="bg-card rounded-[10px] border border-border p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h2 className="text-lg font-semibold text-foreground">{selectedAgency.agencyName}</h2>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[selectedAgency.status]}`}
                      >
                        {STATUS_LABEL[selectedAgency.status]}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-3 text-sm text-muted-foreground">
                      <div>
                        <span className="text-muted-foreground text-xs">Contact</span>
                        <p>{selectedAgency.contactPerson}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Email</span>
                        <p className="truncate">{selectedAgency.contactEmail}</p>
                      </div>
                      {selectedAgency.contactPhone && (
                        <div>
                          <span className="text-muted-foreground text-xs">Phone</span>
                          <p>{selectedAgency.contactPhone}</p>
                        </div>
                      )}
                      {selectedAgency.registrationNumber && (
                        <div>
                          <span className="text-muted-foreground text-xs">Registration No.</span>
                          <p>{selectedAgency.registrationNumber}</p>
                        </div>
                      )}
                      {selectedAgency.feePercentage != null && (
                        <div>
                          <span className="text-muted-foreground text-xs">Fee %</span>
                          <p>{selectedAgency.feePercentage}%</p>
                        </div>
                      )}
                      {selectedAgency.beeLevel != null && (
                        <div>
                          <span className="text-muted-foreground text-xs">BEE Level</span>
                          <p>Level {selectedAgency.beeLevel}</p>
                        </div>
                      )}
                      {selectedAgency.contractStartDate && (
                        <div>
                          <span className="text-muted-foreground text-xs">Contract Start</span>
                          <p>{new Date(selectedAgency.contractStartDate).toLocaleDateString()}</p>
                        </div>
                      )}
                      {selectedAgency.contractEndDate && (
                        <div>
                          <span className="text-muted-foreground text-xs">Contract End</span>
                          <p>{new Date(selectedAgency.contractEndDate).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                    {selectedAgency.specializations && (
                      <p className="text-xs text-muted-foreground mt-3">
                        <span className="text-muted-foreground">Specializations: </span>
                        {selectedAgency.specializations}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => openEdit(selectedAgency)}
                      className="px-3 py-1.5 text-xs border border-border rounded-full hover:bg-muted"
                    >
                      Edit
                    </button>
                    {selectedAgency.status === 'PENDING_APPROVAL' && (
                      <button
                        onClick={() => handleApprove(selectedAgency)}
                        disabled={statusActionLoading === selectedAgency.id}
                        className="px-3 py-1.5 text-xs text-white bg-green-600 rounded-full hover:bg-green-700 disabled:opacity-50"
                      >
                        {statusActionLoading === selectedAgency.id ? '...' : 'Approve'}
                      </button>
                    )}
                    {selectedAgency.status === 'APPROVED' && (
                      <button
                        onClick={() => handleSuspend(selectedAgency)}
                        disabled={statusActionLoading === selectedAgency.id}
                        className="px-3 py-1.5 text-xs text-orange-700 border border-orange-300 rounded-full hover:bg-orange-50 disabled:opacity-50"
                      >
                        {statusActionLoading === selectedAgency.id ? '...' : 'Suspend'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Dashboard / analytics */}
              {submissionsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold-500" />
                </div>
              ) : dashboard && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-card rounded-[10px] border border-border p-4">
                      <p className="text-xs text-muted-foreground mb-1">Total Submissions</p>
                      <p className="text-2xl font-bold text-foreground">{dashboard.totalSubmissions}</p>
                    </div>
                    <div className="bg-card rounded-[10px] border border-border p-4">
                      <p className="text-xs text-muted-foreground mb-1">Accepted</p>
                      <p className="text-2xl font-bold text-green-700">{dashboard.acceptedSubmissions}</p>
                    </div>
                    <div className="bg-card rounded-[10px] border border-border p-4">
                      <p className="text-xs text-muted-foreground mb-1">Placement Rate</p>
                      <p className="text-2xl font-bold text-gold-600">
                        {dashboard.placementRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Submit candidate action */}
                  {selectedAgency.status === 'APPROVED' && (
                    <div className="bg-card rounded-[10px] border border-border p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">Submit a candidate</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Add a candidate submission for a job posting
                        </p>
                      </div>
                      <button
                        onClick={openSubmitCandidate}
                        className="px-4 py-2 text-xs bg-gold-500 text-violet-950 rounded-full hover:bg-gold-600 font-medium"
                      >
                        + Submit Candidate
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Register Agency Modal ── */}
      {(modal === 'register' || modal === 'edit') && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-[10px] shadow-xl max-w-lg w-full p-6 overflow-y-auto max-h-[90vh]">
            <h3 className="text-lg font-bold text-foreground mb-4">
              {modal === 'edit' ? 'Edit Agency' : 'Register Agency'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Agency Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={agencyForm.agencyName}
                  onChange={(e) => setAgencyForm((f) => ({ ...f, agencyName: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-control focus:outline-none focus:ring-2 focus:ring-gold-400"
                  placeholder="e.g. TalentBridge Staffing"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Contact Person <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={agencyForm.contactPerson}
                    onChange={(e) => setAgencyForm((f) => ({ ...f, contactPerson: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-control focus:outline-none focus:ring-2 focus:ring-gold-400"
                    placeholder="Jane Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Contact Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={agencyForm.contactEmail}
                    onChange={(e) => setAgencyForm((f) => ({ ...f, contactEmail: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-control focus:outline-none focus:ring-2 focus:ring-gold-400"
                    placeholder="jane@agency.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={agencyForm.contactPhone}
                    onChange={(e) => setAgencyForm((f) => ({ ...f, contactPhone: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-control focus:outline-none focus:ring-2 focus:ring-gold-400"
                    placeholder="+27 11 000 0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Registration No.</label>
                  <input
                    type="text"
                    value={agencyForm.registrationNumber}
                    onChange={(e) => setAgencyForm((f) => ({ ...f, registrationNumber: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-control focus:outline-none focus:ring-2 focus:ring-gold-400"
                    placeholder="2023/000000/07"
                  />
                </div>
              </div>

              <SearchableDropdown
                label="Specializations"
                options={SPECIALIZATION_OPTIONS}
                value={agencyForm.specializations ? agencyForm.specializations.split(',').map((s) => s.trim()).filter(Boolean) : []}
                onChange={(vals) => setAgencyForm((f) => ({ ...f, specializations: vals.join(', ') }))}
                multi={true}
                placeholder="Select specializations..."
                searchPlaceholder="Search specializations..."
              />

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Fee %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={agencyForm.feePercentage}
                    onChange={(e) => setAgencyForm((f) => ({ ...f, feePercentage: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-control focus:outline-none focus:ring-2 focus:ring-gold-400"
                    placeholder="15"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">BEE Level</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={agencyForm.beeLevel}
                    onChange={(e) => setAgencyForm((f) => ({ ...f, beeLevel: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-control focus:outline-none focus:ring-2 focus:ring-gold-400"
                    placeholder="2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Contract Start</label>
                  <input
                    type="date"
                    value={agencyForm.contractStartDate}
                    onChange={(e) => setAgencyForm((f) => ({ ...f, contractStartDate: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-control focus:outline-none focus:ring-2 focus:ring-gold-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Contract End</label>
                  <input
                    type="date"
                    value={agencyForm.contractEndDate}
                    onChange={(e) => setAgencyForm((f) => ({ ...f, contractEndDate: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-control focus:outline-none focus:ring-2 focus:ring-gold-400"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setModal(null)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm text-foreground border border-border rounded-full hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAgency}
                disabled={actionLoading}
                className="px-4 py-2 text-sm bg-gold-500 text-violet-950 rounded-full hover:bg-gold-600 disabled:opacity-50 font-medium"
              >
                {actionLoading
                  ? 'Saving...'
                  : modal === 'edit'
                  ? 'Save Changes'
                  : 'Register Agency'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Submit Candidate Modal ── */}
      {modal === 'submitCandidate' && selectedAgency && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-[10px] shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-foreground mb-1">Submit Candidate</h3>
            <p className="text-sm text-muted-foreground mb-4">Via {selectedAgency.agencyName}</p>
            <div className="space-y-4">
              <SearchableDropdown
                label="Job Posting"
                required
                options={jobPostingOptions}
                value={submissionForm.jobPostingId ? [submissionForm.jobPostingId] : []}
                onChange={(vals) => setSubmissionForm((f) => ({ ...f, jobPostingId: vals[0] ?? '' }))}
                multi={false}
                loading={jobPostingsLoading}
                placeholder="Select a job posting..."
                searchPlaceholder="Search job postings..."
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Candidate Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={submissionForm.candidateName}
                    onChange={(e) => setSubmissionForm((f) => ({ ...f, candidateName: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-control focus:outline-none focus:ring-2 focus:ring-gold-400"
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Candidate Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={submissionForm.candidateEmail}
                    onChange={(e) => setSubmissionForm((f) => ({ ...f, candidateEmail: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-control focus:outline-none focus:ring-2 focus:ring-gold-400"
                    placeholder="candidate@email.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
                <input
                  type="tel"
                  value={submissionForm.candidatePhone}
                  onChange={(e) => setSubmissionForm((f) => ({ ...f, candidatePhone: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-control focus:outline-none focus:ring-2 focus:ring-gold-400"
                  placeholder="+27 82 000 0000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Cover Note</label>
                <textarea
                  value={submissionForm.coverNote}
                  onChange={(e) => setSubmissionForm((f) => ({ ...f, coverNote: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-control focus:outline-none focus:ring-2 focus:ring-gold-400"
                  rows={3}
                  placeholder="Brief note about this candidate..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setModal(null)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm text-foreground border border-border rounded-full hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitCandidate}
                disabled={actionLoading}
                className="px-4 py-2 text-sm bg-gold-500 text-violet-950 rounded-full hover:bg-gold-600 disabled:opacity-50 font-medium"
              >
                {actionLoading ? 'Submitting...' : 'Submit Candidate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Review Submission Modal ── */}
      {modal === 'reviewSubmission' && reviewingSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-[10px] shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-foreground mb-1">Review Submission</h3>
            <p className="text-sm text-muted-foreground mb-6">
              <span className="font-medium text-foreground">{reviewingSubmission.candidateName}</span>
              {reviewingSubmission.jobPosting?.title && (
                <> — {reviewingSubmission.jobPosting.title}</>
              )}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleReview(true)}
                disabled={actionLoading}
                className="w-full px-4 py-2.5 text-sm text-white bg-green-600 rounded-full hover:bg-green-700 disabled:opacity-50 font-medium"
              >
                {actionLoading ? 'Processing...' : '✓ Accept Submission'}
              </button>
              <button
                onClick={() => handleReview(false)}
                disabled={actionLoading}
                className="w-full px-4 py-2.5 text-sm text-red-700 border border-red-300 rounded-full hover:bg-red-50 disabled:opacity-50"
              >
                ✕ Reject Submission
              </button>
              <button
                onClick={() => { setModal(null); setReviewingSubmission(null); }}
                disabled={actionLoading}
                className="w-full px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={approveAgency !== null}
        title="Approve Agency"
        message={`Are you sure you want to approve "${approveAgency?.agencyName}"? This will allow them to submit candidates for your job postings.`}
        confirmLabel="Approve"
        variant="default"
        onConfirm={confirmApprove}
        onCancel={() => setApproveAgency(null)}
      />
      <ConfirmDialog
        open={suspendAgency !== null}
        title="Suspend Agency"
        message={`Are you sure you want to suspend "${suspendAgency?.agencyName}"? They will no longer be able to submit candidates.`}
        confirmLabel="Suspend"
        variant="warning"
        onConfirm={confirmSuspend}
        onCancel={() => setSuspendAgency(null)}
      />
    </PageWrapper>
  );
}
