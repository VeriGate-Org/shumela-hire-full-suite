'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api-fetch';
import { useToast } from '@/components/Toast';
import { eSignatureService } from '@/services/eSignatureService';
import { getEnumLabel } from '@/utils/enumLabels';

interface Offer {
  id: number;
  offerNumber: string;
  version: number;
  status: string;
  statusDisplayName: string;
  statusIcon: string;
  statusCssClass: string;
  offerType: string;
  negotiationStatus: string;
  negotiationStatusDisplayName: string;
  negotiationStatusIcon: string;
  negotiationStatusCssClass: string;
  jobTitle: string;
  department: string;
  baseSalary: number;
  currency: string;
  totalCompensation: number;
  startDate: string;
  offerExpiryDate: string;
  offerSentAt?: string;
  acceptedAt?: string;
  declinedAt?: string;
  negotiationRounds: number;
  application: {
    id: number;
    applicant: {
      name?: string;
      surname?: string;
      fullName?: string;
      firstName?: string;
      lastName?: string;
      email: string;
    };
    jobPosting: {
      title: string;
      department: string;
    };
  };
  createdAt: string;
  createdBy: number;
}

function getApplicantName(applicant?: { name?: string; surname?: string; fullName?: string; firstName?: string; lastName?: string } | null): string {
  if (!applicant) return 'Unknown Candidate';
  if (applicant.fullName) return applicant.fullName;
  const first = applicant.firstName || applicant.name || '';
  const last = applicant.lastName || applicant.surname || '';
  return `${first} ${last}`.trim() || 'Unknown Candidate';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface OfferSearchFilters {
  status?: string;
  offerType?: string;
  negotiationStatus?: string;
  department?: string;
  jobTitle?: string;
  minSalary?: number;
  maxSalary?: number;
  startDate?: string;
  endDate?: string;
}

interface DashboardCounts {
  pendingApproval: number;
  nearExpiry: number;
  activeNegotiations: number;
  recentAcceptances: number;
}

const OFFER_STATUSES = [
  'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'UNDER_NEGOTIATION',
  'ACCEPTED', 'DECLINED', 'WITHDRAWN', 'EXPIRED', 'SUPERSEDED'
];

const OFFER_TYPES = [
  'FULL_TIME_PERMANENT', 'PART_TIME_PERMANENT', 'CONTRACT_FIXED_TERM',
  'CONTRACT_RENEWABLE', 'CONSULTANT', 'INTERNSHIP', 'APPRENTICESHIP',
  'TEMPORARY', 'PROBATIONARY', 'EXECUTIVE'
];

const AVATAR_COLORS = [
  { bg: 'bg-icon-bg-navy', text: 'text-accent-navy' },
  { bg: 'bg-icon-bg-teal', text: 'text-accent-teal' },
  { bg: 'bg-icon-bg-gold', text: 'text-accent-gold' },
  { bg: 'bg-icon-bg-pink', text: 'text-accent-pink' },
];

function getAvatarColor(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

/* Tab definitions mapping to backend status groups */
const TABS = [
  { key: 'draft', label: 'Draft', statuses: ['DRAFT', 'PENDING_APPROVAL'] },
  { key: 'sent', label: 'Sent', statuses: ['APPROVED', 'SENT', 'UNDER_NEGOTIATION'] },
  { key: 'accepted', label: 'Accepted', statuses: ['ACCEPTED'] },
  { key: 'declined', label: 'Declined', statuses: ['DECLINED', 'WITHDRAWN', 'EXPIRED', 'SUPERSEDED'] },
];

function getStatusBadge(status: string): { className: string; label: string } {
  switch (status) {
    case 'DRAFT':
      return { className: 'bg-icon-bg-navy text-accent-navy', label: 'Draft' };
    case 'PENDING_APPROVAL':
      return { className: 'bg-warning-bg text-amber-800', label: 'Pending Approval' };
    case 'APPROVED':
      return { className: 'bg-icon-bg-teal text-accent-teal', label: 'Approved' };
    case 'SENT':
      return { className: 'bg-warning-bg text-amber-800', label: 'Sent' };
    case 'UNDER_NEGOTIATION':
      return { className: 'bg-icon-bg-gold text-accent-gold', label: 'Negotiating' };
    case 'ACCEPTED':
      return { className: 'bg-success-bg text-emerald-800', label: 'Accepted' };
    case 'DECLINED':
      return { className: 'bg-error-bg text-red-800', label: 'Declined' };
    case 'WITHDRAWN':
      return { className: 'bg-error-bg text-red-800', label: 'Withdrawn' };
    case 'EXPIRED':
      return { className: 'bg-muted text-muted-foreground', label: 'Expired' };
    case 'SUPERSEDED':
      return { className: 'bg-muted text-muted-foreground', label: 'Superseded' };
    default:
      return { className: 'bg-muted text-muted-foreground', label: status };
  }
}

function getStatusDotColor(status: string): string {
  switch (status) {
    case 'DRAFT':
    case 'PENDING_APPROVAL':
      return 'bg-accent-navy';
    case 'APPROVED':
    case 'SENT':
    case 'UNDER_NEGOTIATION':
      return 'bg-warning';
    case 'ACCEPTED':
      return 'bg-success';
    case 'DECLINED':
    case 'WITHDRAWN':
    case 'EXPIRED':
    case 'SUPERSEDED':
      return 'bg-error';
    default:
      return 'bg-muted-foreground';
  }
}

export default function OfferManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const currentRole = user?.role || 'RECRUITER';
  const canManageOffers = currentRole === 'ADMIN' || currentRole === 'HR_MANAGER';
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [filters, setFilters] = useState<OfferSearchFilters>({});
  const [dashboardCounts, setDashboardCounts] = useState<DashboardCounts>({
    pendingApproval: 0,
    nearExpiry: 0,
    activeNegotiations: 0,
    recentAcceptances: 0
  });
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<string>('');
  const [actionData, setActionData] = useState<any>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showESignModal, setShowESignModal] = useState(false);
  const [eSignOffer, setESignOffer] = useState<Offer | null>(null);
  const [eSignLoading, setESignLoading] = useState(false);
  const [eSignStatuses, setESignStatuses] = useState<Record<number, string>>({});
  const [showLetterModal, setShowLetterModal] = useState(false);
  const [letterOffer, setLetterOffer] = useState<Offer | null>(null);
  const [letterGenerated, setLetterGenerated] = useState<Record<number, boolean>>({});
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [payrollOffer, setPayrollOffer] = useState<Offer | null>(null);
  const [payrollSending, setPayrollSending] = useState(false);
  const [payrollSent, setPayrollSent] = useState<Record<number, boolean>>({});
  const [payrollError, setPayrollError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('draft');

  const computeClientSideCounts = useCallback((offersList: Offer[]): DashboardCounts => {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return {
      pendingApproval: offersList.filter(o => o.status === 'PENDING_APPROVAL').length,
      nearExpiry: offersList.filter(o => {
        if (o.status !== 'SENT' || !o.offerExpiryDate) return false;
        return new Date(o.offerExpiryDate) <= sevenDaysFromNow && new Date(o.offerExpiryDate) > now;
      }).length,
      activeNegotiations: offersList.filter(o => o.status === 'UNDER_NEGOTIATION' || o.status === 'NEGOTIATION').length,
      recentAcceptances: offersList.filter(o => o.status === 'ACCEPTED').length,
    };
  }, []);

  const loadDashboardCounts = useCallback(async (fallbackOffers: Offer[]) => {
    try {
      const response = await apiFetch('/api/offers/dashboard');
      if (response.ok) {
        const counts = await response.json();
        const hasData = counts.pendingApproval || counts.nearExpiry || counts.activeNegotiations || counts.recentAcceptances;
        if (hasData) {
          setDashboardCounts(counts);
          return;
        }
      }
    } catch (error) {
      console.error('Error loading dashboard counts:', error);
    }
    // Fallback: compute from loaded offers
    if (fallbackOffers.length > 0) {
      setDashboardCounts(computeClientSideCounts(fallbackOffers));
    }
  }, [computeClientSideCounts]);

  const loadOffers = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        size: '10',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
        )
      });

      const response = await apiFetch(`/api/offers/search?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        const loadedOffers = data.content || [];
        setOffers(loadedOffers);
        setTotalPages(data.totalPages || 0);
        loadDashboardCounts(loadedOffers);
      }
    } catch (error) {
      console.error('Error loading offers:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, loadDashboardCounts]);

  const loadESignStatuses = useCallback(async (offersList: Offer[]) => {
    const relevantOffers = offersList.filter(o =>
      ['SENT', 'ACCEPTED', 'UNDER_NEGOTIATION'].includes(o.status)
    );
    const statuses: Record<number, string> = {};
    await Promise.allSettled(
      relevantOffers.map(async (offer) => {
        try {
          const result = await eSignatureService.getStatus(offer.id);
          statuses[offer.id] = result.status;
        } catch {
          // ignore - status will just not show
        }
      })
    );
    setESignStatuses(statuses);
  }, []);

  useEffect(() => {
    if (canManageOffers) {
      loadOffers();
    }
  }, [canManageOffers, loadOffers]);

  useEffect(() => {
    if (offers.length > 0) {
      loadESignStatuses(offers);
    }
  }, [offers, loadESignStatuses]);

  const handleOfferAction = async (offer: Offer, action: string) => {
    setSelectedOffer(offer);
    setActionType(action);
    setActionData({});
    setShowActionModal(true);
  };

  const executeAction = async () => {
    if (!selectedOffer || !actionType) return;

    try {
      const endpoint = `/api/offers/${selectedOffer.id}/${actionType}`;
      let body = null;
      if (['approve', 'reject', 'withdraw', 'decline', 'negotiate', 'escalate'].includes(actionType)) {
        body = JSON.stringify(actionData);
      }

      const response = await apiFetch(endpoint, {
        method: 'POST',
        body: body ?? undefined,
      });

      if (response.ok) {
        setShowActionModal(false);
        if (actionType === 'approve' && selectedOffer) {
          setLetterGenerated(prev => ({ ...prev, [selectedOffer.id]: true }));
          toast('Offer approved -- letter generated automatically', 'success');
          window.open('/reports/offer-letter-sample.pdf', '_blank');
        }
        if (actionType === 'accept' && selectedOffer) {
          setPayrollOffer(selectedOffer);
          setShowPayrollModal(true);
        }
        loadOffers();
      } else {
        toast('Action failed. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error executing action:', error);
      toast('Action failed. Please try again.', 'error');
    }
  };

  const formatCurrency = (amount: number, currency: string = 'ZAR') => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getTimeUntilExpiry = (expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffMs = expiry.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 0) return 'Expired';
    if (diffHours < 24) return `${diffHours}h remaining`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d remaining`;
  };

  const getTimeSince = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  const canPerformAction = (offer: Offer, action: string) => {
    const userRole = currentRole || '';

    switch (action) {
      case 'approve':
        return offer.status === 'PENDING_APPROVAL' &&
               ['ADMIN', 'HR_MANAGER'].includes(userRole);
      case 'send':
        return offer.status === 'APPROVED' &&
               ['ADMIN', 'HR_MANAGER'].includes(userRole);
      case 'withdraw':
        return ['SENT', 'UNDER_NEGOTIATION'].includes(offer.status) &&
               ['ADMIN', 'HR_MANAGER', 'HIRING_MANAGER'].includes(userRole);
      case 'accept':
        return ['SENT', 'UNDER_NEGOTIATION'].includes(offer.status) &&
               userRole === 'APPLICANT';
      case 'decline':
        return ['SENT', 'UNDER_NEGOTIATION'].includes(offer.status) &&
               userRole === 'APPLICANT';
      case 'negotiate':
        return offer.status === 'SENT' && userRole === 'APPLICANT';
      default:
        return false;
    }
  };

  if (!canManageOffers) {
    return (
      <div className="enterprise-card flex flex-col items-center justify-center py-16 px-4">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground">Access denied</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Offer management is available to administrators and HR managers.
        </p>
      </div>
    );
  }

  const handleSendForSignature = async () => {
    if (!eSignOffer) return;
    setESignLoading(true);
    try {
      await eSignatureService.sendForSignature(eSignOffer.id, {
        signerEmail: eSignOffer.application?.applicant?.email || '',
        signerName: getApplicantName(eSignOffer.application?.applicant),
      });
      toast('Offer sent for e-signature via DocuSign', 'success');
      setShowESignModal(false);
      setESignOffer(null);
      loadOffers();
    } catch (error) {
      console.error('Error sending for signature:', error);
      toast('Failed to send for e-signature. Please try again.', 'error');
    } finally {
      setESignLoading(false);
    }
  };

  const handleSendToPayroll = async () => {
    if (!payrollOffer || !user?.id) return;
    setPayrollSending(true);
    setPayrollError(null);
    try {
      const validateResponse = await apiFetch(`/api/sap-payroll/offers/${payrollOffer.id}/validate`);
      const validation = await validateResponse.json().catch(() => null);

      if (!validateResponse.ok) {
        setPayrollError(validation?.error || validation?.message || 'SAP Payroll integration is not available.');
        return;
      }
      if (validation && validation.valid === false) {
        const errors = validation.errors ? Object.values(validation.errors).join(', ') : 'Employee data failed validation.';
        setPayrollError(errors);
        return;
      }

      const transmitResponse = await apiFetch(
        `/api/sap-payroll/offers/${payrollOffer.id}/transmit?userId=${encodeURIComponent(user.id)}`,
        { method: 'POST' }
      );
      const transmission = await transmitResponse.json().catch(() => null);

      if (!transmitResponse.ok) {
        setPayrollError(transmission?.error || transmission?.message || 'Failed to transmit employee details to SAP.');
        return;
      }

      if (transmission?.status === 'FAILED') {
        setPayrollError('SAP rejected the transmission. Check the transmission log for details.');
        return;
      }

      setPayrollSent(prev => ({ ...prev, [payrollOffer.id]: true }));
      toast(
        transmission?.status === 'CONFIRMED'
          ? 'Employee details sent to SAP Payroll successfully'
          : 'Employee details submitted to SAP Payroll and are pending confirmation',
        'success'
      );
      setShowPayrollModal(false);
      setPayrollOffer(null);
    } catch (error) {
      console.error('Error sending to payroll:', error);
      setPayrollError('An unexpected error occurred while contacting the payroll system.');
    } finally {
      setPayrollSending(false);
    }
  };

  const handleDownloadSigned = async (offerId: number) => {
    try {
      await eSignatureService.downloadSignedDocument(offerId);
    } catch (error) {
      console.error('Error downloading signed document:', error);
      toast('Failed to download signed document.', 'error');
    }
  };

  const getESignBadgeColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-indigo-100 text-indigo-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'voided': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  /* Filter offers for the active tab */
  const activeTabDef = TABS.find(t => t.key === activeTab) || TABS[0];
  const filteredOffers = offers.filter(o => activeTabDef.statuses.includes(o.status));

  /* Tab counts */
  const tabCounts: Record<string, number> = {};
  TABS.forEach(tab => {
    tabCounts[tab.key] = offers.filter(o => tab.statuses.includes(o.status)).length;
  });

  return (
    <div className="space-y-6">

      {/* ====== STAT STRIP ====== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Offers */}
        <div className="enterprise-card p-5 flex items-center gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-icon-bg-navy flex items-center justify-center">
            <svg className="w-[22px] h-[22px] text-accent-navy" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-foreground leading-tight">{offers.length}</div>
            <div className="text-[0.813rem] font-medium text-muted-foreground">Active Offers</div>
          </div>
        </div>

        {/* Acceptance Rate */}
        <div className="enterprise-card p-5 flex items-center gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-icon-bg-teal flex items-center justify-center">
            <svg className="w-[22px] h-[22px] text-accent-teal" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-foreground leading-tight">
              {offers.length > 0
                ? `${Math.round((dashboardCounts.recentAcceptances / offers.length) * 100)}%`
                : '0%'}
            </div>
            <div className="text-[0.813rem] font-medium text-muted-foreground">Acceptance Rate</div>
          </div>
        </div>

        {/* Active Negotiations */}
        <div className="enterprise-card p-5 flex items-center gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-icon-bg-gold flex items-center justify-center">
            <svg className="w-[22px] h-[22px] text-accent-gold" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-foreground leading-tight">{dashboardCounts.activeNegotiations}</div>
            <div className="text-[0.813rem] font-medium text-muted-foreground">Active Negotiations</div>
          </div>
        </div>

        {/* Pending Approval */}
        <div className="enterprise-card p-5 flex items-center gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-icon-bg-pink flex items-center justify-center">
            <svg className="w-[22px] h-[22px] text-accent-pink" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-foreground leading-tight">{dashboardCounts.pendingApproval}</div>
            <div className="text-[0.813rem] font-medium text-muted-foreground">Pending Approval</div>
          </div>
        </div>
      </div>

      {/* ====== TABBED CONTENT ====== */}
      <div className="enterprise-card overflow-hidden">
        {/* Tab Header */}
        <div className="flex border-b border-border px-6 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative top-[1px] px-5 py-4 font-semibold text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'text-primary border-primary'
                  : 'text-muted-foreground border-transparent hover:text-primary'
              }`}
            >
              {tab.label}
              <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[0.688rem] font-bold ml-1.5 ${
                activeTab === tab.key
                  ? 'bg-icon-bg-navy text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {tabCounts[tab.key] || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {loading ? (
            /* Skeleton loading state matching mock */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="border border-border rounded-card p-5 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-full bg-muted" />
                    <div className="flex-1">
                      <div className="h-3.5 bg-muted rounded w-2/3 mb-2" />
                      <div className="h-2.5 bg-muted rounded w-1/2" />
                    </div>
                    <div className="h-5 w-16 bg-muted rounded-full" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <div className="h-2.5 bg-muted rounded w-1/2 mb-1" />
                      <div className="h-3 bg-muted rounded w-3/4" />
                    </div>
                    <div>
                      <div className="h-2.5 bg-muted rounded w-1/2 mb-1" />
                      <div className="h-3 bg-muted rounded w-3/4" />
                    </div>
                  </div>
                  <div className="flex gap-2 mb-4">
                    <div className="h-5 w-20 bg-muted rounded" />
                    <div className="h-5 w-16 bg-muted rounded" />
                  </div>
                  <div className="border-t border-border pt-4 flex justify-between items-center">
                    <div className="h-3 bg-muted rounded w-1/3" />
                    <div className="flex gap-2">
                      <div className="h-8 w-16 bg-muted rounded-full" />
                      <div className="h-8 w-20 bg-muted rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredOffers.length === 0 ? (
            /* Empty state */
            <div className="text-center py-12 px-6">
              <div className="w-20 h-20 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">No {activeTabDef.label.toLowerCase()} offers</h3>
              <p className="text-sm text-muted-foreground mb-5">
                There are no offers in this category at the moment.
              </p>
            </div>
          ) : (
            /* Offer cards grid - 2 columns like the mock */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredOffers.map((offer, idx) => {
                const avatarColor = getAvatarColor(idx);
                const candidateName = getApplicantName(offer.application?.applicant);
                const initials = getInitials(candidateName);
                const badge = getStatusBadge(offer.status);
                const dotColor = getStatusDotColor(offer.status);

                return (
                  <div
                    key={offer.id}
                    className="border border-border rounded-card p-5 bg-card transition-shadow hover:shadow-sm"
                  >
                    {/* Card Header: avatar + name + badge */}
                    <div className="flex items-start justify-between mb-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${avatarColor.bg} ${avatarColor.text}`}>
                          {initials}
                        </div>
                        <div>
                          <div className="font-bold text-[0.938rem] text-foreground">{candidateName}</div>
                          <div className="text-[0.813rem] text-muted-foreground mt-0.5">{offer.jobTitle}</div>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.className}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                        {badge.label}
                      </span>
                    </div>

                    {/* Card Body: salary & start date grid */}
                    <div className="grid grid-cols-2 gap-3 mb-3.5">
                      <div className="text-[0.813rem]">
                        <div className="text-muted-foreground font-medium mb-0.5">Annual Salary</div>
                        <div className="text-foreground font-semibold">{formatCurrency(offer.baseSalary, offer.currency)}</div>
                      </div>
                      <div className="text-[0.813rem]">
                        <div className="text-muted-foreground font-medium mb-0.5">Start Date</div>
                        <div className="text-foreground font-semibold">{offer.startDate ? formatDate(offer.startDate) : 'TBD'}</div>
                      </div>
                    </div>

                    {/* Offer Type & Department tags */}
                    <div className="flex flex-wrap gap-1.5 mb-3.5">
                      {offer.offerType && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[0.688rem] font-semibold bg-muted text-muted-foreground border border-border">
                          <svg className="w-2.5 h-2.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" strokeLinecap="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          {getEnumLabel('offerType', offer.offerType)}
                        </span>
                      )}
                      {offer.department && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[0.688rem] font-semibold bg-muted text-muted-foreground border border-border">
                          <svg className="w-2.5 h-2.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" strokeLinecap="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          {offer.department}
                        </span>
                      )}
                      {offer.negotiationRounds > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[0.688rem] font-semibold bg-icon-bg-gold text-accent-gold border border-gold-200">
                          Round {offer.negotiationRounds}
                        </span>
                      )}
                    </div>

                    {/* E-Sign status badge (if applicable) */}
                    {eSignStatuses[offer.id] && eSignStatuses[offer.id] !== 'not_sent' && (
                      <div className="mb-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getESignBadgeColor(eSignStatuses[offer.id])}`}>
                          DocuSign: {eSignStatuses[offer.id]}
                        </span>
                      </div>
                    )}

                    {/* Expiry warning for sent offers */}
                    {offer.offerExpiryDate && ['SENT', 'UNDER_NEGOTIATION'].includes(offer.status) && (
                      <div className="bg-warning-bg rounded-control px-3.5 py-2.5 mb-3.5 text-[0.813rem] text-amber-800">
                        <strong>Expires:</strong> {formatDate(offer.offerExpiryDate)} ({getTimeUntilExpiry(offer.offerExpiryDate)})
                      </div>
                    )}

                    {/* Card Footer */}
                    <div className="flex items-center justify-between pt-3.5 border-t border-border">
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" strokeLinecap="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        {offer.acceptedAt
                          ? `Accepted ${getTimeSince(offer.acceptedAt)}`
                          : offer.declinedAt
                          ? `Declined ${getTimeSince(offer.declinedAt)}`
                          : offer.offerSentAt
                          ? `Sent ${getTimeSince(offer.offerSentAt)}`
                          : `Created ${getTimeSince(offer.createdAt)}`}
                      </div>
                      <div className="flex gap-2">
                        {/* Action buttons styled as pills matching the mock */}
                        {canPerformAction(offer, 'approve') && (
                          <button
                            onClick={() => handleOfferAction(offer, 'approve')}
                            className="btn-primary px-3.5 py-1.5 text-xs"
                          >
                            Approve
                          </button>
                        )}
                        {canPerformAction(offer, 'send') && (
                          <button
                            onClick={() => handleOfferAction(offer, 'send')}
                            className="btn-primary px-3.5 py-1.5 text-xs"
                          >
                            Send
                          </button>
                        )}
                        {canPerformAction(offer, 'accept') && (
                          <button
                            onClick={() => handleOfferAction(offer, 'accept')}
                            className="btn-primary px-3.5 py-1.5 text-xs"
                          >
                            Accept
                          </button>
                        )}
                        {canPerformAction(offer, 'negotiate') && (
                          <button
                            onClick={() => handleOfferAction(offer, 'negotiate')}
                            className="btn-secondary px-3.5 py-1.5 text-xs"
                          >
                            Negotiate
                          </button>
                        )}
                        {canPerformAction(offer, 'withdraw') && (
                          <button
                            onClick={() => handleOfferAction(offer, 'withdraw')}
                            className="px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-full border-2 border-error text-error bg-transparent hover:bg-error hover:text-white transition-colors"
                          >
                            Withdraw
                          </button>
                        )}
                        {canPerformAction(offer, 'decline') && (
                          <button
                            onClick={() => handleOfferAction(offer, 'decline')}
                            className="px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-full border-2 border-error text-error bg-transparent hover:bg-error hover:text-white transition-colors"
                          >
                            Decline
                          </button>
                        )}
                        {['DRAFT', 'APPROVED'].includes(offer.status) && !letterGenerated[offer.id] && (
                          <button
                            onClick={() => { setLetterOffer(offer); setShowLetterModal(true); }}
                            className="btn-secondary px-3.5 py-1.5 text-xs"
                          >
                            Letter
                          </button>
                        )}
                        {letterGenerated[offer.id] && (
                          <a
                            href="/reports/offer-letter-sample.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary px-3.5 py-1.5 text-xs inline-flex items-center"
                          >
                            View Letter
                          </a>
                        )}
                        {offer.status === 'SENT' && (!eSignStatuses[offer.id] || eSignStatuses[offer.id] === 'not_sent') && (
                          <button
                            onClick={() => { setESignOffer(offer); setShowESignModal(true); }}
                            className="btn-secondary px-3.5 py-1.5 text-xs"
                          >
                            E-Sign
                          </button>
                        )}
                        {eSignStatuses[offer.id] === 'completed' && (
                          <button
                            onClick={() => handleDownloadSigned(offer.id)}
                            className="btn-secondary px-3.5 py-1.5 text-xs"
                          >
                            Download
                          </button>
                        )}
                        {offer.status === 'ACCEPTED' && !payrollSent[offer.id] && (
                          <button
                            onClick={() => { setPayrollOffer(offer); setShowPayrollModal(true); }}
                            className="btn-primary px-3.5 py-1.5 text-xs"
                          >
                            Payroll
                          </button>
                        )}
                        {payrollSent[offer.id] && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-success-bg text-emerald-800">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" strokeLinecap="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Payroll Sent
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 bg-muted border-t border-border flex items-center justify-between">
            <div className="text-sm text-foreground">
              Page {currentPage + 1} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
                className="btn-secondary px-4 py-1.5 text-xs disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage === totalPages - 1}
                className="btn-secondary px-4 py-1.5 text-xs disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ====== ACTION MODAL ====== */}
      {showActionModal && selectedOffer && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-8">
          <div className="bg-card rounded-card shadow-lg w-full max-w-[640px] max-h-[90vh] overflow-y-auto animate-in fade-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">
                {actionType.charAt(0).toUpperCase() + actionType.slice(1)} Offer
              </h2>
              <button
                onClick={() => setShowActionModal(false)}
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-error-bg hover:text-error transition-colors"
              >
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  Offer: <span className="font-medium text-foreground">{selectedOffer.offerNumber}</span> &mdash; {selectedOffer.jobTitle}
                </p>
                <p className="text-sm text-muted-foreground">
                  Candidate: <span className="font-medium text-foreground">{getApplicantName(selectedOffer.application?.applicant)}</span>
                </p>
              </div>

              {['approve', 'reject', 'withdraw', 'decline', 'negotiate', 'escalate'].includes(actionType) && (
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-foreground mb-1.5">
                    {actionType === 'approve' && 'Approval Notes'}
                    {actionType === 'reject' && 'Rejection Reason'}
                    {actionType === 'withdraw' && 'Withdrawal Reason'}
                    {actionType === 'decline' && 'Decline Reason'}
                    {actionType === 'negotiate' && 'Counter Offer Details'}
                    {actionType === 'escalate' && 'Escalation Reason'}
                  </label>
                  <textarea
                    value={actionData.reason || actionData.notes || actionData.candidateCounterOffer || actionData.escalationReason || ''}
                    onChange={(e) => {
                      const field = actionType === 'approve' ? 'approvalNotes' :
                                   actionType === 'reject' ? 'rejectionReason' :
                                   actionType === 'withdraw' ? 'withdrawalReason' :
                                   actionType === 'decline' ? 'declineReason' :
                                   actionType === 'negotiate' ? 'candidateCounterOffer' :
                                   'escalationReason';
                      setActionData({...actionData, [field]: e.target.value});
                    }}
                    rows={3}
                    className="w-full px-3.5 py-2.5 border border-border rounded-control text-sm text-foreground bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
                    placeholder={`Enter ${actionType} details...`}
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
              <button
                onClick={() => setShowActionModal(false)}
                className="btn-secondary px-5 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={executeAction}
                className="btn-primary px-5 py-2 text-sm"
              >
                Confirm {actionType.charAt(0).toUpperCase() + actionType.slice(1)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== GENERATE LETTER MODAL ====== */}
      {showLetterModal && letterOffer && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-8">
          <div className="bg-card rounded-card shadow-lg w-full max-w-[640px] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Generate Offer Letter</h2>
              <button
                onClick={() => { setShowLetterModal(false); setLetterOffer(null); }}
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-error-bg hover:text-error transition-colors"
              >
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="rounded-control border border-border bg-muted p-4 space-y-1">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Offer:</span> {letterOffer.offerNumber}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Position:</span> {letterOffer.jobTitle} &mdash; {letterOffer.department}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Candidate:</span> {getApplicantName(letterOffer.application?.applicant)}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Compensation:</span> {formatCurrency(letterOffer.baseSalary, letterOffer.currency)}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Start Date:</span> {letterOffer.startDate ? formatDate(letterOffer.startDate) : 'TBD'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">Generation Mode</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                    <input type="radio" name="letterMode" value="automatic" defaultChecked className="accent-primary" />
                    Automatic &mdash; use standard template
                  </label>
                  <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                    <input type="radio" name="letterMode" value="manual" className="accent-primary" />
                    Manual &mdash; review before finalising
                  </label>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                The offer letter will be generated using company templates and the offer details above. You can preview and download the letter once generated.
              </p>
            </div>

            <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
              <button
                onClick={() => { setShowLetterModal(false); setLetterOffer(null); }}
                className="btn-secondary px-5 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setLetterGenerated(prev => ({ ...prev, [letterOffer.id]: true }));
                  toast('Offer letter generated successfully', 'success');
                  setShowLetterModal(false);
                  setLetterOffer(null);
                  window.open('/reports/offer-letter-sample.pdf', '_blank');
                }}
                className="btn-primary px-5 py-2 text-sm"
              >
                Generate Letter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== SEND TO PAYROLL MODAL ====== */}
      {showPayrollModal && payrollOffer && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-8">
          <div className="bg-card rounded-card shadow-lg w-full max-w-[640px] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div>
                <h2 className="text-lg font-bold text-foreground">Send to Payroll</h2>
                <p className="text-sm text-muted-foreground mt-1">Register this new employee in the payroll system</p>
              </div>
              <button
                onClick={() => { setShowPayrollModal(false); setPayrollOffer(null); setPayrollError(null); }}
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-error-bg hover:text-error transition-colors"
              >
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="rounded-control border border-border bg-muted p-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Employee Details</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Name:</span> {getApplicantName(payrollOffer.application?.applicant)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Email:</span> {payrollOffer.application?.applicant?.email || '\u2014'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Position:</span> {payrollOffer.jobTitle}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Department:</span> {payrollOffer.department}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Base Salary:</span> {formatCurrency(payrollOffer.baseSalary, payrollOffer.currency)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Total Comp:</span> {formatCurrency(payrollOffer.totalCompensation, payrollOffer.currency)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Start Date:</span> {payrollOffer.startDate ? formatDate(payrollOffer.startDate) : 'TBD'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Offer Type:</span> {payrollOffer.offerType ? getEnumLabel('offerType', payrollOffer.offerType) : '\u2014'}
                  </p>
                </div>
              </div>

              <div className="rounded-control border border-primary/20 bg-surface-navy p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-primary">Sage 300 People</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      The employee record will be created in Sage with the details above. Payroll processing, tax setup, and benefits enrolment will be configured based on the offer type and department defaults.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                This action will transmit the candidate&apos;s details to the connected payroll system. Ensure all details are correct before proceeding.
              </p>

              {payrollError && (
                <div className="rounded-control border border-error bg-error-bg p-3">
                  <p className="text-sm text-error">{payrollError}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-border flex justify-between items-center">
              <button
                onClick={() => { setShowPayrollModal(false); setPayrollOffer(null); setPayrollError(null); }}
                disabled={payrollSending}
                className="btn-secondary px-5 py-2 text-sm"
              >
                Cancel
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowPayrollModal(false); setPayrollOffer(null); setPayrollError(null); }}
                  disabled={payrollSending}
                  className="btn-secondary px-4 py-2 text-xs"
                >
                  Skip for Now
                </button>
                <button
                  onClick={handleSendToPayroll}
                  disabled={payrollSending}
                  className="btn-primary px-5 py-2 text-sm disabled:opacity-50"
                >
                  {payrollSending ? 'Sending...' : 'Send to Payroll'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== E-SIGN MODAL ====== */}
      {showESignModal && eSignOffer && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-8">
          <div className="bg-card rounded-card shadow-lg w-full max-w-[640px] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Send for E-Signature</h2>
              <button
                onClick={() => { setShowESignModal(false); setESignOffer(null); }}
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-error-bg hover:text-error transition-colors"
              >
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  Offer: <span className="font-medium text-foreground">{eSignOffer.offerNumber}</span> &mdash; {eSignOffer.jobTitle}
                </p>
                <p className="text-sm text-muted-foreground">
                  Candidate: <span className="font-medium text-foreground">{getApplicantName(eSignOffer.application?.applicant)}</span>
                </p>
              </div>

              <div className="mb-4 rounded-control border border-border bg-muted p-4">
                <p className="text-sm font-medium text-foreground mb-2">DocuSign will send to:</p>
                <p className="text-sm text-foreground">{getApplicantName(eSignOffer.application?.applicant)}</p>
                <p className="text-sm text-muted-foreground">{eSignOffer.application?.applicant?.email || ''}</p>
              </div>

              <p className="text-xs text-muted-foreground">
                The offer letter will be sent via DocuSign for electronic signature. The candidate will receive an email with a link to review and sign the document.
              </p>
            </div>

            <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
              <button
                onClick={() => { setShowESignModal(false); setESignOffer(null); }}
                disabled={eSignLoading}
                className="btn-secondary px-5 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSendForSignature}
                disabled={eSignLoading}
                className="btn-primary px-5 py-2 text-sm disabled:opacity-50"
              >
                {eSignLoading ? 'Sending...' : 'Send for Signature'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
