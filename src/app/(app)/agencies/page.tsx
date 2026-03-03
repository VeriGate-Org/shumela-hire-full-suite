'use client';

import React, { useState, useEffect, useCallback } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { useToast } from '@/components/Toast';
import { apiFetch } from '@/lib/api-fetch';

// ─── Types ────────────────────────────────────────────────────────────────────

type AgencyStatus = 'PENDING_APPROVAL' | 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
type SubmissionStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

interface Agency {
  id: number;
  agencyName: string;
  registrationNumber?: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone?: string;
  specializations?: string;
  status: AgencyStatus;
  feePercentage?: number;
  contractStartDate?: string;
  contractEndDate?: string;
  beeLevel?: number;
  createdAt: string;
  updatedAt?: string;
}

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
  ACTIVE: 'bg-green-100 text-green-700',
  SUSPENDED: 'bg-orange-100 text-orange-700',
  TERMINATED: 'bg-red-100 text-red-700',
};

const STATUS_LABEL: Record<AgencyStatus, string> = {
  PENDING_APPROVAL: 'Pending Approval',
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  TERMINATED: 'Terminated',
};

const SUBMISSION_BADGE: Record<SubmissionStatus, string> = {
  SUBMITTED: 'bg-blue-50 text-blue-700',
  UNDER_REVIEW: 'bg-yellow-50 text-yellow-700',
  ACCEPTED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-600',
  WITHDRAWN: 'bg-gray-100 text-gray-500',
};

const SUBMISSION_LABEL: Record<SubmissionStatus, string> = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
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

  // Agency list
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [agenciesLoading, setAgenciesLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AgencyStatus | 'ALL'>('ALL');

  // Selected agency detail
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [submissions, setSubmissions] = useState<AgencySubmission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [dashboard, setDashboard] = useState<AgencyDashboard | null>(null);

  // Modals
  const [modal, setModal] = useState<ModalType>(null);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [reviewingSubmission, setReviewingSubmission] = useState<AgencySubmission | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusActionLoading, setStatusActionLoading] = useState<number | null>(null);

  // Forms
  const [agencyForm, setAgencyForm] = useState(EMPTY_AGENCY_FORM);
  const [submissionForm, setSubmissionForm] = useState(EMPTY_SUBMISSION_FORM);

  // ─── Data loading ───────────────────────────────────────────────────────────

  const loadAgencies = useCallback(async () => {
    try {
      setAgenciesLoading(true);
      const data = await apiFetch('/api/agencies');
      setAgencies(Array.isArray(data) ? data : data.content ?? []);
    } catch {
      toast('Failed to load agencies', 'error');
    } finally {
      setAgenciesLoading(false);
    }
  }, [toast]);

  const loadAgencyDetail = useCallback(
    async (agency: Agency) => {
      setSubmissionsLoading(true);
      setSubmissions([]);
      setDashboard(null);
      try {
        const dashboardData = await apiFetch(`/api/agencies/${agency.id}/dashboard`);
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
      await apiFetch('/api/agencies/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      toast('Agency registered successfully', 'success');
      setModal(null);
      await loadAgencies();
    } catch {
      toast('Failed to register agency', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Approve / suspend ─────────────────────────────────────────────────────

  const handleApprove = async (agency: Agency) => {
    try {
      setStatusActionLoading(agency.id);
      const updated: Agency = await apiFetch(`/api/agencies/${agency.id}/approve`, { method: 'POST' });
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

  const handleSuspend = async (agency: Agency) => {
    try {
      setStatusActionLoading(agency.id);
      const updated: Agency = await apiFetch(`/api/agencies/${agency.id}/suspend`, { method: 'POST' });
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
      await apiFetch(`/api/agencies/${selectedAgency.id}/submissions`, {
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

  const openReview = (submission: AgencySubmission) => {
    setReviewingSubmission(submission);
    setModal('reviewSubmission');
  };

  const handleReview = async (accept: boolean) => {
    if (!reviewingSubmission) return;
    try {
      setActionLoading(true);
      await apiFetch(`/api/agencies/submissions/${reviewingSubmission.id}/review`, {
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

  const filteredAgencies = agencies.filter((a) => {
    const matchesSearch =
      a.agencyName.toLowerCase().includes(search.toLowerCase()) ||
      a.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
      (a.contactEmail ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <PageWrapper
      title="Recruitment Agencies"
      subtitle="Register and manage your recruitment agency partners"
      actions={
        <button
          onClick={openRegister}
          className="px-4 py-2 text-sm bg-gold-500 text-violet-950 rounded-full hover:bg-gold-600 font-medium"
        >
          + Register Agency
        </button>
      }
    >
      <div className="flex gap-6 min-h-0">
        {/* ── Left panel: Agency list ── */}
        <div className="w-1/3 flex flex-col gap-3 min-w-0">
          {/* Search + filter */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agencies..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-gold-400"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AgencyStatus | 'ALL')}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-gold-400"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="TERMINATED">Terminated</option>
          </select>

          {/* List */}
          {agenciesLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold-500" />
            </div>
          ) : filteredAgencies.length === 0 ? (
            <div className="bg-white rounded-[10px] border border-gray-200 p-8 text-center">
              <p className="text-gray-400 text-sm">
                {search || statusFilter !== 'ALL'
                  ? 'No agencies match your filters.'
                  : 'No agencies registered yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto">
              {filteredAgencies.map((agency) => (
                <button
                  key={agency.id}
                  onClick={() => handleSelectAgency(agency)}
                  className={`w-full text-left bg-white rounded-[10px] border p-4 transition-all hover:shadow-sm ${
                    selectedAgency?.id === agency.id
                      ? 'border-gold-400 bg-gold-50/50 shadow-sm'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-gray-900 truncate">{agency.agencyName}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{agency.contactPerson}</p>
                    </div>
                    <span
                      className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[agency.status]}`}
                    >
                      {STATUS_LABEL[agency.status]}
                    </span>
                  </div>
                  {agency.specializations && (
                    <p className="text-xs text-gray-400 mt-2 truncate">{agency.specializations}</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Right panel: Agency detail ── */}
        <div className="flex-1 min-w-0">
          {!selectedAgency ? (
            <div className="bg-white rounded-[10px] border border-gray-200 h-64 flex items-center justify-center">
              <div className="text-center">
                <p className="text-4xl mb-3">🤝</p>
                <p className="text-gray-500 text-sm">Select an agency to view details</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Agency header */}
              <div className="bg-white rounded-[10px] border border-gray-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h2 className="text-lg font-semibold text-gray-900">{selectedAgency.agencyName}</h2>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[selectedAgency.status]}`}
                      >
                        {STATUS_LABEL[selectedAgency.status]}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-3 text-sm text-gray-600">
                      <div>
                        <span className="text-gray-400 text-xs">Contact</span>
                        <p>{selectedAgency.contactPerson}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 text-xs">Email</span>
                        <p className="truncate">{selectedAgency.contactEmail}</p>
                      </div>
                      {selectedAgency.contactPhone && (
                        <div>
                          <span className="text-gray-400 text-xs">Phone</span>
                          <p>{selectedAgency.contactPhone}</p>
                        </div>
                      )}
                      {selectedAgency.registrationNumber && (
                        <div>
                          <span className="text-gray-400 text-xs">Registration No.</span>
                          <p>{selectedAgency.registrationNumber}</p>
                        </div>
                      )}
                      {selectedAgency.feePercentage != null && (
                        <div>
                          <span className="text-gray-400 text-xs">Fee %</span>
                          <p>{selectedAgency.feePercentage}%</p>
                        </div>
                      )}
                      {selectedAgency.beeLevel != null && (
                        <div>
                          <span className="text-gray-400 text-xs">BEE Level</span>
                          <p>Level {selectedAgency.beeLevel}</p>
                        </div>
                      )}
                      {selectedAgency.contractStartDate && (
                        <div>
                          <span className="text-gray-400 text-xs">Contract Start</span>
                          <p>{new Date(selectedAgency.contractStartDate).toLocaleDateString()}</p>
                        </div>
                      )}
                      {selectedAgency.contractEndDate && (
                        <div>
                          <span className="text-gray-400 text-xs">Contract End</span>
                          <p>{new Date(selectedAgency.contractEndDate).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                    {selectedAgency.specializations && (
                      <p className="text-xs text-gray-500 mt-3">
                        <span className="text-gray-400">Specializations: </span>
                        {selectedAgency.specializations}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => openEdit(selectedAgency)}
                      className="px-3 py-1.5 text-xs border border-gray-300 rounded-full hover:bg-gray-50"
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
                    {selectedAgency.status === 'ACTIVE' && (
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
                    <div className="bg-white rounded-[10px] border border-gray-200 p-4">
                      <p className="text-xs text-gray-500 mb-1">Total Submissions</p>
                      <p className="text-2xl font-bold text-gray-900">{dashboard.totalSubmissions}</p>
                    </div>
                    <div className="bg-white rounded-[10px] border border-gray-200 p-4">
                      <p className="text-xs text-gray-500 mb-1">Accepted</p>
                      <p className="text-2xl font-bold text-green-700">{dashboard.acceptedSubmissions}</p>
                    </div>
                    <div className="bg-white rounded-[10px] border border-gray-200 p-4">
                      <p className="text-xs text-gray-500 mb-1">Placement Rate</p>
                      <p className="text-2xl font-bold text-gold-600">
                        {dashboard.placementRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Submit candidate action */}
                  {selectedAgency.status === 'ACTIVE' && (
                    <div className="bg-white rounded-[10px] border border-gray-200 p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Submit a candidate</p>
                        <p className="text-xs text-gray-400 mt-0.5">
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
          <div className="bg-white rounded-[10px] shadow-xl max-w-lg w-full p-6 overflow-y-auto max-h-[90vh]">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {modal === 'edit' ? 'Edit Agency' : 'Register Agency'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Agency Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={agencyForm.agencyName}
                  onChange={(e) => setAgencyForm((f) => ({ ...f, agencyName: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                  placeholder="e.g. TalentBridge Staffing"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Person <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={agencyForm.contactPerson}
                    onChange={(e) => setAgencyForm((f) => ({ ...f, contactPerson: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                    placeholder="Jane Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={agencyForm.contactEmail}
                    onChange={(e) => setAgencyForm((f) => ({ ...f, contactEmail: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                    placeholder="jane@agency.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={agencyForm.contactPhone}
                    onChange={(e) => setAgencyForm((f) => ({ ...f, contactPhone: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                    placeholder="+27 11 000 0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration No.</label>
                  <input
                    type="text"
                    value={agencyForm.registrationNumber}
                    onChange={(e) => setAgencyForm((f) => ({ ...f, registrationNumber: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                    placeholder="2023/000000/07"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specializations</label>
                <textarea
                  value={agencyForm.specializations}
                  onChange={(e) => setAgencyForm((f) => ({ ...f, specializations: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                  rows={2}
                  placeholder="IT, Finance, Engineering..."
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fee %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={agencyForm.feePercentage}
                    onChange={(e) => setAgencyForm((f) => ({ ...f, feePercentage: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                    placeholder="15"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">BEE Level</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={agencyForm.beeLevel}
                    onChange={(e) => setAgencyForm((f) => ({ ...f, beeLevel: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                    placeholder="2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contract Start</label>
                  <input
                    type="date"
                    value={agencyForm.contractStartDate}
                    onChange={(e) => setAgencyForm((f) => ({ ...f, contractStartDate: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contract End</label>
                  <input
                    type="date"
                    value={agencyForm.contractEndDate}
                    onChange={(e) => setAgencyForm((f) => ({ ...f, contractEndDate: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setModal(null)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50 disabled:opacity-50"
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
          <div className="bg-white rounded-[10px] shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Submit Candidate</h3>
            <p className="text-sm text-gray-500 mb-4">Via {selectedAgency.agencyName}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Posting ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={submissionForm.jobPostingId}
                  onChange={(e) => setSubmissionForm((f) => ({ ...f, jobPostingId: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                  placeholder="Enter job posting ID"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Candidate Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={submissionForm.candidateName}
                    onChange={(e) => setSubmissionForm((f) => ({ ...f, candidateName: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Candidate Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={submissionForm.candidateEmail}
                    onChange={(e) => setSubmissionForm((f) => ({ ...f, candidateEmail: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                    placeholder="candidate@email.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={submissionForm.candidatePhone}
                  onChange={(e) => setSubmissionForm((f) => ({ ...f, candidatePhone: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                  placeholder="+27 82 000 0000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cover Note</label>
                <textarea
                  value={submissionForm.coverNote}
                  onChange={(e) => setSubmissionForm((f) => ({ ...f, coverNote: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                  rows={3}
                  placeholder="Brief note about this candidate..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setModal(null)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50 disabled:opacity-50"
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
          <div className="bg-white rounded-[10px] shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Review Submission</h3>
            <p className="text-sm text-gray-500 mb-6">
              <span className="font-medium text-gray-700">{reviewingSubmission.candidateName}</span>
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
                className="w-full px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
