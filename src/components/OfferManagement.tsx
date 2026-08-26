'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api-fetch';
import { useToast } from '@/components/Toast';
import AiOfferPrediction from '@/components/ai/AiOfferPrediction';
import { eSignatureService } from '@/services/eSignatureService';
import { getEnumLabel } from '@/utils/enumLabels';
import IdentityBand from '@/components/record/IdentityBand';
import DecisionBar, { PrimaryAction, SecondaryAction } from '@/components/record/DecisionBar';
import DistributionStrip from '@/components/record/DistributionStrip';
import FilterChips from '@/components/record/FilterChips';
import {
  OfferSummary,
  QUEUE_FILTERS,
  bySoonestExpiry,
  committedValue,
  expiryLabel,
  expiryTone,
  filterCount,
  isOfferSummary,
  isWithCandidate,
  showsClock,
} from '@/components/offers/queue';

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

/* Mirrors the backend OfferStatus enum. AWAITING_SIGNATURE and SIGNED were missing, which is
   how an offer sent for e-signature fell out of every tab below. */
const OFFER_TYPES = [
  'FULL_TIME_PERMANENT', 'PART_TIME_PERMANENT', 'CONTRACT_FIXED_TERM',
  'CONTRACT_RENEWABLE', 'CONSULTANT', 'INTERNSHIP', 'APPRENTICESHIP',
  'TEMPORARY', 'PROBATIONARY', 'EXECUTIVE'
];

/* Application statuses the backend accepts for offer creation.
   Mirrors OfferService.canCreateOfferForApplication -- keep in sync. */
const OFFER_ELIGIBLE_APPLICATION_STATUSES = ['REFERENCE_CHECK', 'OFFER_PENDING', 'OFFERED'];

interface EligibleApplication {
  id: string;
  jobTitle?: string;
  department?: string;
  status?: string;
  applicant?: {
    name?: string;
    surname?: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

interface CreateOfferForm {
  applicationId: string;
  offerType: string;
  baseSalary: string;
  currency: string;
  salaryFrequency: string;
  startDate: string;
  offerExpiryDate: string;
  signingBonus: string;
  probationaryPeriodDays: string;
  noticePeriodDays: string;
  workLocation: string;
}

const EMPTY_CREATE_FORM: CreateOfferForm = {
  applicationId: '',
  offerType: 'FULL_TIME_PERMANENT',
  baseSalary: '',
  currency: 'ZAR',
  salaryFrequency: 'ANNUALLY',
  startDate: '',
  offerExpiryDate: '',
  signingBonus: '',
  probationaryPeriodDays: '',
  noticePeriodDays: '30',
  workLocation: '',
};

const SALARY_FREQUENCIES = ['ANNUALLY', 'MONTHLY', 'HOURLY'];

const AVATAR_COLORS = [
  { bg: 'icon-tile-navy', text: 'text-accent-navy' },
  { bg: 'icon-tile-teal', text: 'text-accent-teal' },
  { bg: 'icon-tile-gold', text: 'text-accent-gold-on-tint' },
  { bg: 'icon-tile-pink', text: 'text-accent-pink' },
];

function getAvatarColor(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

/* The queue opens on what is closest to lapsing, because that is the only thing on this screen
   with a deadline attached. Deep links keep working: the keys are the chips' keys. */
const DEFAULT_TAB = 'expiring';
const TAB_KEYS = QUEUE_FILTERS.map(f => f.key);

/** Statuses an offer reaches only after it has been put to a candidate and settled. */
const DECIDED_STATUSES = ['ACCEPTED', 'DECLINED', 'WITHDRAWN', 'EXPIRED'];

/**
 * Statuses where the offer is out with the candidate and its expiry clock is running.
 *
 * Deliberately the same set as the "Sent" tab minus APPROVED, which has not reached the candidate
 * yet. Anything here can lapse, so anything here counts toward near-expiry.
 */
const IN_FLIGHT_WITH_CANDIDATE = ['SENT', 'AWAITING_SIGNATURE', 'SIGNED', 'UNDER_NEGOTIATION'];

function getStatusBadge(status: string): { className: string; label: string } {
  switch (status) {
    case 'DRAFT':
      return { className: 'icon-tile-navy', label: 'Draft' };
    case 'PENDING_APPROVAL':
      return { className: 'bg-warning-bg text-amber-800', label: 'Pending Approval' };
    case 'APPROVED':
      return { className: 'icon-tile-teal', label: 'Approved' };
    case 'SENT':
      return { className: 'bg-warning-bg text-amber-800', label: 'Sent' };
    case 'AWAITING_SIGNATURE':
      return { className: 'bg-warning-bg text-amber-800', label: 'Awaiting Signature' };
    case 'SIGNED':
      return { className: 'icon-tile-teal', label: 'Signed' };
    case 'UNDER_NEGOTIATION':
      return { className: 'icon-tile-gold-on-tint', label: 'Negotiating' };
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
    case 'AWAITING_SIGNATURE':
    case 'SIGNED':
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
  const canManageOffers = ['ADMIN', 'HR_MANAGER', 'HIRING_MANAGER'].includes(currentRole);
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
  /* Server-side total. The "Active Offers" tile used to show offers.length — the number of rows on
     the current page — so on any tenant with more than one page it silently read the page size. */
  const [totalOffers, setTotalOffers] = useState(0);
  const [showESignModal, setShowESignModal] = useState(false);
  const [eSignOffer, setESignOffer] = useState<Offer | null>(null);
  const [eSignLoading, setESignLoading] = useState(false);
  const [eSignStatuses, setESignStatuses] = useState<Record<number, string>>({});
  const [eSignEnvelopes, setESignEnvelopes] = useState<Record<number, string>>({});
  const [eSignSimulated, setESignSimulated] = useState(false);
  const [simulatingSign, setSimulatingSign] = useState<number | null>(null);
  const [showLetterModal, setShowLetterModal] = useState(false);
  const [letterOffer, setLetterOffer] = useState<Offer | null>(null);
  const [letterGenerated, setLetterGenerated] = useState<Record<number, boolean>>({});
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [payrollOffer, setPayrollOffer] = useState<Offer | null>(null);
  const [payrollSending, setPayrollSending] = useState(false);
  const [payrollSent, setPayrollSent] = useState<Record<number, boolean>>({});
  const [payrollError, setPayrollError] = useState<string | null>(null);
  // Expiry is what this page is organised around, so it is where it opens.
  const [activeTab, setActiveTab] = useState('expiring');
  const [summary, setSummary] = useState<OfferSummary | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateOfferForm>(EMPTY_CREATE_FORM);
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [eligibleApplications, setEligibleApplications] = useState<EligibleApplication[]>([]);
  const [eligibleLoading, setEligibleLoading] = useState(false);

  const computeClientSideCounts = useCallback((offersList: Offer[]): DashboardCounts => {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return {
      pendingApproval: offersList.filter(o => o.status === 'PENDING_APPROVAL').length,
      // Every status where the offer is genuinely with the candidate, not just SENT. An offer at
      // AWAITING_SIGNATURE or UNDER_NEGOTIATION with two days left is the one most likely to
      // lapse — signing and negotiating are exactly what consume the clock — and counting only
      // SENT excluded them. The tab grouping above already treats these as in-flight; this now
      // agrees with it.
      nearExpiry: offersList.filter(o => {
        if (!IN_FLIGHT_WITH_CANDIDATE.includes(o.status) || !o.offerExpiryDate) return false;
        return new Date(o.offerExpiryDate) <= sevenDaysFromNow && new Date(o.offerExpiryDate) > now;
      }).length,
      // 'NEGOTIATION' is not in OfferStatus — the residue of a rename, and a line that makes the
      // next reader doubt the enum rather than the code.
      activeNegotiations: offersList.filter(o => o.status === 'UNDER_NEGOTIATION').length,
      recentAcceptances: offersList.filter(o => o.status === 'ACCEPTED').length,
    };
  }, []);

  const loadDashboardCounts = useCallback(async (fallbackOffers: Offer[]) => {
    try {
      const response = await apiFetch('/api/offers/dashboard');
      if (response.ok) {
        const counts = await response.json();
        // Check the shape, not the values. This previously tested whether any count was truthy,
        // so a correct all-zero answer — a genuinely quiet week — was falsy, thrown away, and
        // replaced by counts recomputed from the loaded page. Zero was being read as "no answer"
        // at the exact moment the server was right.
        const answered = counts && typeof counts === 'object'
          && ['pendingApproval', 'nearExpiry', 'activeNegotiations', 'recentAcceptances']
            .some(key => typeof counts[key] === 'number');
        if (answered) {
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
        setTotalOffers(typeof data.totalElements === 'number' ? data.totalElements : loadedOffers.length);
        loadDashboardCounts(loadedOffers);
      }
    } catch (error) {
      console.error('Error loading offers:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, loadDashboardCounts]);

  const loadESignStatuses = useCallback(async (offersList: Offer[]) => {
    // AWAITING_SIGNATURE and SIGNED are the states an offer lands in once it has
    // actually been sent for signature — omitting them hid the badge and the
    // download button on exactly the offers that had an envelope.
    const relevantOffers = offersList.filter(o =>
      ['SENT', 'AWAITING_SIGNATURE', 'SIGNED', 'ACCEPTED', 'UNDER_NEGOTIATION'].includes(o.status)
    );
    const statuses: Record<number, string> = {};
    const envelopes: Record<number, string> = {};
    await Promise.allSettled(
      relevantOffers.map(async (offer) => {
        try {
          const result = await eSignatureService.getStatus(offer.id);
          statuses[offer.id] = result.status;
          if (result.envelopeId) envelopes[offer.id] = result.envelopeId;
        } catch {
          // ignore - status will just not show
        }
      })
    );
    setESignStatuses(statuses);
    setESignEnvelopes(envelopes);
  }, []);

  useEffect(() => {
    eSignatureService.getProvider()
      .then(info => setESignSimulated(info.simulated))
      .catch(() => setESignSimulated(false));
  }, []);

  /**
   * Whole-set counts.
   *
   * <p>Left null on failure rather than zeroed: every figure derived from it is then omitted,
   * because "0 expiring" against a failed request is a lie somebody acts on by doing nothing.
   */
  const loadSummary = useCallback(async () => {
    try {
      const response = await apiFetch('/api/offers/summary');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      // A payload that is not a summary is treated as no summary, not as an empty one.
      setSummary(isOfferSummary(payload) ? payload : null);
    } catch {
      setSummary(null);
    }
  }, []);

  useEffect(() => {
    if (canManageOffers) {
      loadOffers();
      void loadSummary();
    }
  }, [canManageOffers, loadOffers, loadSummary]);

  /* Applications the backend will actually accept an offer for. Anything else
     is rejected by OfferService with "Cannot create offer for application in
     current state", so we only offer the eligible ones in the picker. */
  const loadEligibleApplications = useCallback(async (preselectId?: string) => {
    setEligibleLoading(true);
    try {
      const params = new URLSearchParams({ size: '200' });
      OFFER_ELIGIBLE_APPLICATION_STATUSES.forEach(s => params.append('statuses', s));

      const response = await apiFetch(`/api/applications/manage/search?${params}`);
      let list: EligibleApplication[] = [];
      if (response.ok) {
        const data = await response.json();
        list = data.content || data || [];
      }

      /* A deep link from the pipeline may point at an application that is not in
         the eligible list. Fetch it anyway so the candidate is named in the form,
         and let the backend be the one to refuse it. */
      if (preselectId && !list.some(a => String(a.id) === String(preselectId))) {
        try {
          const single = await apiFetch(`/api/applications/${preselectId}`);
          if (single.ok) {
            list = [await single.json(), ...list];
          }
        } catch {
          // fall through - the select will simply not resolve a name
        }
      }

      setEligibleApplications(list);
    } catch (error) {
      console.error('Error loading eligible applications:', error);
    } finally {
      setEligibleLoading(false);
    }
  }, []);

  const openCreateModal = useCallback((applicationId?: string) => {
    setCreateForm({ ...EMPTY_CREATE_FORM, applicationId: applicationId || '' });
    setCreateError(null);
    setShowCreateModal(true);
    loadEligibleApplications(applicationId);
  }, [loadEligibleApplications]);

  /* Deep link to a tab: /offers?tab=accepted.
     Without this the screen always opened on Draft, so a refresh silently threw you back to the
     first tab and no link could point at a particular state. Same window.location.search approach
     as the create deep link below, and for the same reason.

     Applied in an effect rather than as the initial state: this component renders in a static
     export, where a lazy initialiser touching `window` would either break the prerender or
     mismatch on hydration.

     An unrecognised value is ignored rather than blanking the list. */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const requested = new URLSearchParams(window.location.search).get('tab');
    if (requested && TAB_KEYS.includes(requested)) {
      setActiveTab(requested);
    }
  }, []);

  /* Keep the URL in step so the tab survives a refresh and can be linked to.
     replaceState, not pushState: pushing an entry per tab click makes Back walk the tabs instead
     of leaving the page. The default tab drops the param so the canonical URL stays /offers. */
  const selectTab = useCallback((key: string) => {
    setActiveTab(key);
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (key === DEFAULT_TAB) {
      params.delete('tab');
    } else {
      params.set('tab', key);
    }
    const query = params.toString();
    window.history.replaceState({}, '', query ? `?${query}` : window.location.pathname);
  }, []);

  /* Deep link from OfferSummaryPanel: /offers?create=true&applicationId=X.
     Read from window rather than useSearchParams so the static export build
     does not need a Suspense boundary. */
  useEffect(() => {
    if (!canManageOffers || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('create') !== 'true') return;

    openCreateModal(params.get('applicationId') || undefined);

    // Drop the params so a refresh does not reopen the modal
    params.delete('create');
    params.delete('applicationId');
    const query = params.toString();
    window.history.replaceState({}, '', query ? `?${query}` : window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManageOffers]);

  const handleCreateOffer = async () => {
    if (!createForm.applicationId) {
      setCreateError('Select the candidate this offer is for.');
      return;
    }
    /* Offer.getTotalCompensation() dereferences baseSalary, so an offer without
       one fails server-side during approval routing. Require it here. */
    const baseSalary = Number(createForm.baseSalary);
    if (!createForm.baseSalary || Number.isNaN(baseSalary) || baseSalary <= 0) {
      setCreateError('Enter a base salary greater than zero.');
      return;
    }
    if (!createForm.startDate) {
      setCreateError('Select a start date.');
      return;
    }

    setCreateSaving(true);
    setCreateError(null);
    try {
      const payload: Record<string, unknown> = {
        offerType: createForm.offerType,
        baseSalary,
        currency: createForm.currency,
        salaryFrequency: createForm.salaryFrequency,
        startDate: createForm.startDate,
        noticePeriodDays: Number(createForm.noticePeriodDays) || 30,
      };
      if (createForm.offerExpiryDate) {
        payload.offerExpiryDate = `${createForm.offerExpiryDate}T23:59:59`;
      }
      if (createForm.signingBonus) {
        payload.signingBonus = Number(createForm.signingBonus);
      }
      if (createForm.probationaryPeriodDays) {
        payload.probationaryPeriodDays = Number(createForm.probationaryPeriodDays);
      }
      if (createForm.workLocation) {
        payload.workLocation = createForm.workLocation;
      }

      const response = await apiFetch(`/api/offers/applications/${createForm.applicationId}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setCreateForm(EMPTY_CREATE_FORM);
        setActiveTab('draft');
        toast('Offer created as a draft -- submit it for approval when ready', 'success');
        loadOffers();
        return;
      }

      /* Surface the backend reason verbatim: the common one is the application
         not being in an offer-eligible stage, which the user can act on. */
      let message = `Could not create the offer (HTTP ${response.status}).`;
      if (response.status === 403) {
        message = 'You do not have permission to create offers.';
      } else {
        try {
          const body = await response.json();
          if (body?.error) message = body.error;
        } catch {
          // keep the generic message
        }
      }
      setCreateError(message);
    } catch (error) {
      console.error('Error creating offer:', error);
      setCreateError('Could not create the offer. Please try again.');
    } finally {
      setCreateSaving(false);
    }
  };

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
               ['ADMIN', 'HR_MANAGER', 'HIRING_MANAGER'].includes(userRole);
      case 'send':
        return offer.status === 'APPROVED' &&
               ['ADMIN', 'HR_MANAGER', 'HIRING_MANAGER'].includes(userRole);
      case 'withdraw':
        // An offer awaiting signature or already signed can still be withdrawn; the narrower set
        // hid the control on exactly the offers most likely to need it.
        return isWithCandidate(offer.status) &&
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
          Offer management is available to administrators, HR managers and hiring managers.
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
      toast(eSignSimulated
        ? 'Offer sent for e-signature (simulated provider)'
        : 'Offer sent for e-signature', 'success');
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

  const handleSimulateSignature = async (offerId: number) => {
    const envelopeId = eSignEnvelopes[offerId];
    if (!envelopeId) return;
    setSimulatingSign(offerId);
    try {
      await eSignatureService.simulateSign(envelopeId);
      toast('Signature simulated — offer is now signed', 'success');
      loadOffers();
    } catch (error) {
      console.error('Error simulating signature:', error);
      toast('Failed to simulate signature.', 'error');
    } finally {
      setSimulatingSign(null);
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

  /* Filter offers for the active chip, then order so the soonest to lapse leads. */
  const activeFilterDef = QUEUE_FILTERS.find(f => f.key === activeTab) || QUEUE_FILTERS[0];
  const matchingOffers = activeTab === 'all'
    ? offers
    : activeTab === 'expiring'
      // Everything actually with a candidate and inside a week — the set the clock applies to.
      ? offers.filter(o => showsClock(o) && (expiryTone(o) !== null))
      : offers.filter(o => activeFilterDef.statuses.includes(o.status));
  const filteredOffers = bySoonestExpiry(matchingOffers);

  const committed = committedValue(summary);

  /* Chip counts come from the summary and describe the whole set. They used to be computed from
     the loaded page, which undercounts on any tenant with more offers than one page holds. */

  /* Acceptance rate: accepted offers as a share of those that actually reached a decision.
     It previously read `recentAcceptances / offers.length` — a *recent* count over *every* offer
     including drafts, displayed under the label "Acceptance Rate". On a tenant with 3 accepted and
     1 withdrawn it showed 10% instead of 75%, sitting directly above a tab badge reading
     "Accepted 3". Drafts and offers still out for signature are excluded: they have not been
     accepted or refused yet, so counting them as failures understates the rate. */
  const decidedOffers = offers.filter(o => DECIDED_STATUSES.includes(o.status));
  const acceptedOffers = offers.filter(o => o.status === 'ACCEPTED');
  const acceptanceRate = decidedOffers.length > 0
    ? Math.round((acceptedOffers.length / decidedOffers.length) * 100)
    : null;

  return (
    <div className="space-y-6">

      <IdentityBand
        eyebrow="Offer pipeline"
        title="Offers"
        subtitle={
          summary ? (
            <>
              {summary.total} offers · {summary.withCandidate} out with candidates
              {committed !== null && (
                <>
                  {' · '}
                  {formatCurrency(committed)} committed
                  {summary.committedValueExcluded > 0 && (
                    // Said out loud: an hourly offer cannot be annualised without contracted
                    // hours, so the total describes most of the set rather than all of it.
                    <> ({summary.committedValueExcluded} not annualisable)</>
                  )}
                </>
              )}
            </>
          ) : (
            'Counts unavailable'
          )
        }
        figures={
          summary
            ? [
                { label: 'Out with candidates', value: summary.withCandidate },
                {
                  label: 'Acceptance rate',
                  // Accepted over offers that actually reached a decision, not over everything —
                  // a dash where nothing has been decided, never 0%.
                  value: acceptanceRate === null ? '—' : `${acceptanceRate}%`,
                },
                {
                  label: 'Expiring in 7 days',
                  value: summary.expiringSoon,
                  tone: (summary.expiringImminently > 0 ? 'critical' : 'warning') as
                    | 'critical'
                    | 'warning',
                },
                {
                  label: 'Lapsed unanswered',
                  value: summary.lapsed,
                  tone: (summary.lapsed > 0 ? 'critical' : undefined) as 'critical' | undefined,
                },
              ]
            : []
        }
      />

      {summary && summary.expiringImminently > 0 && (
        <DecisionBar
          ask={`${summary.expiringImminently} ${
            summary.expiringImminently === 1 ? 'offer expires' : 'offers expire'
          } within 48 hours.`}
          why="An offer that lapses costs the whole hire — the candidate returns to the pipeline at the interview stage and the advert has usually closed already."
          tone="owed"
        >
          <PrimaryAction onClick={() => selectTab('expiring')}>Review expiring</PrimaryAction>
          <SecondaryAction onClick={() => openCreateModal()}>New offer</SecondaryAction>
        </DecisionBar>
      )}

      {summary ? (
        <DistributionStrip
          buckets={[
            { label: 'Draft', count: filterCount(summary, 'draft') ?? 0, detail: 'Not put to anyone' },
            {
              label: 'Out with candidate',
              count: summary.withCandidate,
              detail: 'Sent, signing or negotiating',
            },
            {
              label: 'Expiring ≤ 7 days',
              count: summary.expiringSoon,
              detail:
                summary.expiringImminently > 0
                  ? `${summary.expiringImminently} inside 48 hours`
                  : undefined,
            },
            { label: 'Accepted', count: summary.countsByStatus.ACCEPTED ?? 0 },
            { label: 'Lapsed', count: summary.lapsed, detail: 'Never answered' },
          ]}
          footnote={
            <>
              Expiring counts every offer actually with the candidate — sent, awaiting signature,
              signed and under negotiation alike.
              {summary.withoutExpiry > 0 && (
                <>
                  {' '}
                  <b className="font-bold text-foreground">{summary.withoutExpiry}</b> carry no
                  expiry date at all and appear in no expiry figure.
                </>
              )}
            </>
          }
        />
      ) : (
        !loading && (
          <p className="text-sm text-muted-foreground px-1">
            Counts are unavailable — the summary could not be loaded.
          </p>
        )
      )}

      <div className="flex justify-end">
        <button
          onClick={() => openCreateModal()}
          className="btn-primary px-5 py-2 text-sm inline-flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Offer
        </button>
      </div>

      <FilterChips
        chips={QUEUE_FILTERS.map((filter) => ({
          key: filter.key,
          label: filter.label,
          count: filterCount(summary, filter.key) ?? undefined,
        }))}
        activeKey={activeTab}
        onChange={selectTab}
        note={
          <>
            Sorted by <b className="font-bold text-foreground">soonest expiry</b>
          </>
        }
      />

      <div className="enterprise-card overflow-hidden">
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
              <h3 className="text-lg font-semibold text-foreground mb-1">
                No {activeFilterDef.label.toLowerCase()} offers
              </h3>
              <p className="text-sm text-muted-foreground mb-5">
                {activeTab === 'expiring'
                  ? 'Nothing is close to lapsing.'
                  : 'There are no offers in this category at the moment.'}
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
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[0.688rem] font-semibold bg-icon-bg-gold text-accent-gold-on-tint border border-gold-200">
                          Round {offer.negotiationRounds}
                        </span>
                      )}
                    </div>

                    {/* E-Sign status badge (if applicable) */}
                    {eSignStatuses[offer.id] && eSignStatuses[offer.id] !== 'not_sent' && (
                      <div className="mb-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getESignBadgeColor(eSignStatuses[offer.id])}`}>
                          E-Signature: {eSignStatuses[offer.id]}{eSignSimulated ? ' (simulated)' : ''}
                        </span>
                      </div>
                    )}

                    {/* Expiry warning for sent offers */}
                    {/* Every state where the offer is with the candidate. This was gated to SENT
                        and UNDER_NEGOTIATION, so an offer out for signature — a candidate sitting
                        on a signing link with a deadline — showed no clock at all. */}
                    {showsClock(offer) && (
                      <div
                        className={`rounded-control px-3.5 py-2.5 mb-3.5 text-[0.813rem] ${
                          expiryTone(offer) === 'critical'
                            ? 'bg-error-bg text-error-on-tint'
                            : 'bg-warning-bg text-amber-800'
                        }`}
                      >
                        <strong>Expires:</strong> {formatDate(offer.offerExpiryDate)} (
                        {expiryLabel(offer)})
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
                        {eSignSimulated && eSignEnvelopes[offer.id] && ['sent', 'delivered'].includes(eSignStatuses[offer.id]) && (
                          <button
                            onClick={() => handleSimulateSignature(offer.id)}
                            disabled={simulatingSign === offer.id}
                            className="btn-secondary px-3.5 py-1.5 text-xs"
                            title="Stand in for the candidate signing. Simulated provider only."
                          >
                            {simulatingSign === offer.id ? 'Signing...' : 'Simulate Sign'}
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

      {/* ====== CREATE OFFER MODAL ====== */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-8">
          <div className="bg-card rounded-card shadow-lg w-full max-w-[720px] max-h-[90vh] overflow-y-auto animate-in fade-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div>
                <h2 className="text-lg font-bold text-foreground">New Offer</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Saved as a draft. Job title and department are taken from the application.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-error-bg hover:text-error-on-tint transition-colors"
              >
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {createError && (
                <div className="px-4 py-3 rounded-control bg-error-bg text-red-800 text-sm">
                  {createError}
                </div>
              )}

              {/* Candidate */}
              <div>
                <label htmlFor="offer-candidate" className="block text-sm font-semibold text-foreground mb-1.5">
                  Candidate <span className="text-error">*</span>
                </label>
                <select
id="offer-candidate"
                                      value={createForm.applicationId}
                  onChange={(e) => setCreateForm({ ...createForm, applicationId: e.target.value })}
                  disabled={eligibleLoading}
                  className="w-full px-3.5 py-2.5 border border-border rounded-control text-sm text-foreground bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors disabled:opacity-60"
                >
                  <option value="">
                    {eligibleLoading ? 'Loading candidates...' : 'Select a candidate'}
                  </option>
                  {eligibleApplications.map(app => (
                    <option key={app.id} value={app.id}>
                      {getApplicantName(app.applicant)}
                      {app.jobTitle ? ` -- ${app.jobTitle}` : ''}
                    </option>
                  ))}
                </select>
                {!eligibleLoading && eligibleApplications.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    No candidates are at an offer-ready stage. Move a candidate to Reference Check
                    or Offer in the pipeline first.
                  </p>
                )}
              </div>

              {/* Offer type + salary frequency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="offer-type" className="block text-sm font-semibold text-foreground mb-1.5">Offer Type</label>
                  <select
id="offer-type"
                                        value={createForm.offerType}
                    onChange={(e) => setCreateForm({ ...createForm, offerType: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-border rounded-control text-sm text-foreground bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
                  >
                    {OFFER_TYPES.map(type => (
                      <option key={type} value={type}>{getEnumLabel('offerType', type)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="offer-frequency" className="block text-sm font-semibold text-foreground mb-1.5">Salary Frequency</label>
                  <select
id="offer-frequency"
                                        value={createForm.salaryFrequency}
                    onChange={(e) => setCreateForm({ ...createForm, salaryFrequency: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-border rounded-control text-sm text-foreground bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
                  >
                    {SALARY_FREQUENCIES.map(freq => (
                      <option key={freq} value={freq}>{freq.charAt(0) + freq.slice(1).toLowerCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Salary + currency */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="offer-salary" className="block text-sm font-semibold text-foreground mb-1.5">
                    Base Salary <span className="text-error">*</span>
                  </label>
                  <input
id="offer-salary"
                                        type="number"
                    min="0"
                    value={createForm.baseSalary}
                    onChange={(e) => setCreateForm({ ...createForm, baseSalary: e.target.value })}
                    placeholder="e.g. 750000"
                    className="w-full px-3.5 py-2.5 border border-border rounded-control text-sm text-foreground bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="offer-currency" className="block text-sm font-semibold text-foreground mb-1.5">Currency</label>
                  <input
id="offer-currency"
                                        type="text"
                    value={createForm.currency}
                    onChange={(e) => setCreateForm({ ...createForm, currency: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 border border-border rounded-control text-sm text-foreground bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Signing bonus + work location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="offer-bonus" className="block text-sm font-semibold text-foreground mb-1.5">Signing Bonus</label>
                  <input
id="offer-bonus"
                                        type="number"
                    min="0"
                    value={createForm.signingBonus}
                    onChange={(e) => setCreateForm({ ...createForm, signingBonus: e.target.value })}
                    placeholder="Optional"
                    className="w-full px-3.5 py-2.5 border border-border rounded-control text-sm text-foreground bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="offer-location" className="block text-sm font-semibold text-foreground mb-1.5">Work Location</label>
                  <input
id="offer-location"
                                        type="text"
                    value={createForm.workLocation}
                    onChange={(e) => setCreateForm({ ...createForm, workLocation: e.target.value })}
                    placeholder="Optional"
                    className="w-full px-3.5 py-2.5 border border-border rounded-control text-sm text-foreground bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="offer-start" className="block text-sm font-semibold text-foreground mb-1.5">
                    Start Date <span className="text-error">*</span>
                  </label>
                  <input
id="offer-start"
                                        type="date"
                    value={createForm.startDate}
                    onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-border rounded-control text-sm text-foreground bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="offer-expiry" className="block text-sm font-semibold text-foreground mb-1.5">Offer Expiry</label>
                  <input
id="offer-expiry"
                                        type="date"
                    value={createForm.offerExpiryDate}
                    onChange={(e) => setCreateForm({ ...createForm, offerExpiryDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-border rounded-control text-sm text-foreground bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">Defaults to the standard window if left blank.</p>
                </div>
              </div>

              {/* Periods */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="offer-probation" className="block text-sm font-semibold text-foreground mb-1.5">Probation (days)</label>
                  <input
id="offer-probation"
                                        type="number"
                    min="0"
                    value={createForm.probationaryPeriodDays}
                    onChange={(e) => setCreateForm({ ...createForm, probationaryPeriodDays: e.target.value })}
                    placeholder="Default for offer type"
                    className="w-full px-3.5 py-2.5 border border-border rounded-control text-sm text-foreground bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="offer-notice" className="block text-sm font-semibold text-foreground mb-1.5">Notice Period (days)</label>
                  <input
id="offer-notice"
                                        type="number"
                    min="0"
                    value={createForm.noticePeriodDays}
                    onChange={(e) => setCreateForm({ ...createForm, noticePeriodDays: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-border rounded-control text-sm text-foreground bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={createSaving}
                className="btn-secondary px-5 py-2 text-sm disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOffer}
                disabled={createSaving}
                className="btn-primary px-5 py-2 text-sm disabled:opacity-60"
              >
                {createSaving ? 'Creating...' : 'Create Draft Offer'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-error-bg hover:text-error-on-tint transition-colors"
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

              {/* Acceptance likelihood, shown where the decision is actually being taken.
                  Needs a specific application, which is why it cannot sit at page level.
                  Marked high-risk by its own disclaimer: it is a prediction about a person. */}
              {selectedOffer.application?.id && ['approve', 'negotiate', 'escalate'].includes(actionType) && (
                <div className="mb-4">
                  <AiOfferPrediction applicationId={String(selectedOffer.application.id)} />
                </div>
              )}

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
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-error-bg hover:text-error-on-tint transition-colors"
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
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-error-bg hover:text-error-on-tint transition-colors"
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
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-error-bg hover:text-error-on-tint transition-colors"
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
                <p className="text-sm font-medium text-foreground mb-2">Signature request goes to:</p>
                <p className="text-sm text-foreground">{getApplicantName(eSignOffer.application?.applicant)}</p>
                <p className="text-sm text-muted-foreground">{eSignOffer.application?.applicant?.email || ''}</p>
              </div>

              <p className="text-xs text-muted-foreground">
                {eSignSimulated
                  ? 'The simulated signature provider is active: the offer moves to Awaiting Signature and no email is sent. Use “Simulate Sign” on the offer to stand in for the candidate signing.'
                  : 'The offer letter will be sent for electronic signature. The candidate will receive an email with a link to review and sign the document.'}
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
