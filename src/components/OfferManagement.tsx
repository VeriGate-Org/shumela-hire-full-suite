'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api-fetch';
import { useToast } from '@/components/Toast';
import { eSignatureService } from '@/services/eSignatureService';

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
          toast('Offer approved — letter generated automatically', 'success');
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
    return new Date(dateString).toLocaleDateString();
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
      <div className="bg-white rounded-[10px] border border-gray-200 p-8 text-center">
        <h3 className="text-lg font-semibold text-gray-900">Access denied</h3>
        <p className="text-sm text-gray-500 mt-2">
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

  return (
    <div className="space-y-6">
      {/* Dashboard Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-800">Pending Approval</p>
              <p className="text-2xl font-bold text-yellow-900">{dashboardCounts.pendingApproval}</p>
            </div>
            <svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-800">Near Expiry</p>
              <p className="text-2xl font-bold text-red-900">{dashboardCounts.nearExpiry}</p>
            </div>
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
        </div>
        
        <div className="bg-gold-50 border border-violet-200 rounded-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-violet-800">Active Negotiations</p>
              <p className="text-2xl font-bold text-violet-900">{dashboardCounts.activeNegotiations}</p>
            </div>
            <svg className="w-6 h-6 text-violet-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Recent Acceptances</p>
              <p className="text-2xl font-bold text-green-900">{dashboardCounts.recentAcceptances}</p>
            </div>
            <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-sm shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters({...filters, status: e.target.value || undefined})}
              className="w-full p-2 border border-gray-300 rounded-sm text-sm"
            >
              <option value="">All Statuses</option>
              {OFFER_STATUSES.map(status => (
                <option key={status} value={status}>
                  {status.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filters.offerType || ''}
              onChange={(e) => setFilters({...filters, offerType: e.target.value || undefined})}
              className="w-full p-2 border border-gray-300 rounded-sm text-sm"
            >
              <option value="">All Types</option>
              {OFFER_TYPES.map(type => (
                <option key={type} value={type}>
                  {type.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <input
              type="text"
              value={filters.department || ''}
              onChange={(e) => setFilters({...filters, department: e.target.value || undefined})}
              placeholder="Filter by department"
              className="w-full p-2 border border-gray-300 rounded-sm text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Salary</label>
            <input
              type="number"
              value={filters.minSalary || ''}
              onChange={(e) => setFilters({...filters, minSalary: e.target.value ? Number(e.target.value) : undefined})}
              placeholder="Min salary"
              className="w-full p-2 border border-gray-300 rounded-sm text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Salary</label>
            <input
              type="number"
              value={filters.maxSalary || ''}
              onChange={(e) => setFilters({...filters, maxSalary: e.target.value ? Number(e.target.value) : undefined})}
              placeholder="Max salary"
              className="w-full p-2 border border-gray-300 rounded-sm text-sm"
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-end space-x-2">
          <button
            onClick={() => setFilters({})}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-sm hover:bg-gray-50"
          >
            Clear Filters
          </button>
          <button
            onClick={() => setCurrentPage(0)}
            className="px-4 py-2 text-sm bg-gold-500 text-violet-950 rounded-sm hover:bg-gold-600"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Offers Table */}
      <div className="bg-white rounded-sm shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Offers</h3>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500 mx-auto"></div>
            </div>
          ) : offers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No offers found
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Offer Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Candidate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Compensation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Negotiation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expiry
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {offers.map((offer) => (
                  <tr key={offer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {offer.offerNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          Version {offer.version}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {getApplicantName(offer.application?.applicant)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {offer.application?.applicant?.email || ''}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {offer.jobTitle}
                        </div>
                        <div className="text-sm text-gray-500">
                          {offer.department}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(offer.baseSalary, offer.currency)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Total: {formatCurrency(offer.totalCompensation, offer.currency)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${offer.statusCssClass}`}>
                        <span className="mr-1">{offer.statusIcon}</span>
                        {offer.statusDisplayName}
                      </span>
                      {eSignStatuses[offer.id] && eSignStatuses[offer.id] !== 'not_sent' && (
                        <span className={`mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getESignBadgeColor(eSignStatuses[offer.id])}`}>
                          DocuSign: {eSignStatuses[offer.id]}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${offer.negotiationStatusCssClass}`}>
                          <span className="mr-1">{offer.negotiationStatusIcon}</span>
                          {offer.negotiationStatusDisplayName}
                        </span>
                        {offer.negotiationRounds > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            Round {offer.negotiationRounds}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {offer.offerExpiryDate ? (
                        <div>
                          <div>{formatDate(offer.offerExpiryDate)}</div>
                          <div className="text-xs text-gray-500">
                            {getTimeUntilExpiry(offer.offerExpiryDate)}
                          </div>
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {canPerformAction(offer, 'approve') && (
                          <button
                            onClick={() => handleOfferAction(offer, 'approve')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Approve
                          </button>
                        )}
                        {canPerformAction(offer, 'send') && (
                          <button
                            onClick={() => handleOfferAction(offer, 'send')}
                            className="text-gold-600 hover:text-violet-900"
                          >
                            Send
                          </button>
                        )}
                        {canPerformAction(offer, 'accept') && (
                          <button
                            onClick={() => handleOfferAction(offer, 'accept')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Accept
                          </button>
                        )}
                        {canPerformAction(offer, 'decline') && (
                          <button
                            onClick={() => handleOfferAction(offer, 'decline')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Decline
                          </button>
                        )}
                        {canPerformAction(offer, 'negotiate') && (
                          <button
                            onClick={() => handleOfferAction(offer, 'negotiate')}
                            className="text-gold-600 hover:text-violet-900"
                          >
                            Negotiate
                          </button>
                        )}
                        {canPerformAction(offer, 'withdraw') && (
                          <button
                            onClick={() => handleOfferAction(offer, 'withdraw')}
                            className="text-orange-600 hover:text-orange-900"
                          >
                            Withdraw
                          </button>
                        )}
                        {['DRAFT', 'APPROVED'].includes(offer.status) && !letterGenerated[offer.id] && (
                          <button
                            onClick={() => { setLetterOffer(offer); setShowLetterModal(true); }}
                            className="text-[#05527E] hover:text-[#033d5e]"
                          >
                            Generate Letter
                          </button>
                        )}
                        {letterGenerated[offer.id] && (
                          <a
                            href="/reports/offer-letter-sample.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#05527E] hover:text-[#033d5e]"
                          >
                            View Letter
                          </a>
                        )}
                        {offer.status === 'SENT' && (!eSignStatuses[offer.id] || eSignStatuses[offer.id] === 'not_sent') && (
                          <button
                            onClick={() => { setESignOffer(offer); setShowESignModal(true); }}
                            className="text-violet-600 hover:text-violet-900"
                          >
                            E-Sign
                          </button>
                        )}
                        {eSignStatuses[offer.id] === 'completed' && (
                          <button
                            onClick={() => handleDownloadSigned(offer.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Download Signed
                          </button>
                        )}
                        {offer.status === 'ACCEPTED' && !payrollSent[offer.id] && (
                          <button
                            onClick={() => { setPayrollOffer(offer); setShowPayrollModal(true); }}
                            className="text-[#05527E] hover:text-[#033d5e]"
                          >
                            Send to Payroll
                          </button>
                        )}
                        {payrollSent[offer.id] && (
                          <span className="text-green-600 text-xs font-medium">
                            Payroll Sent
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {currentPage + 1} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage === totalPages - 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {showActionModal && selectedOffer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-sm shadow-xl max-w-md w-full m-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {actionType.charAt(0).toUpperCase() + actionType.slice(1)} Offer
              </h3>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Offer: {selectedOffer.offerNumber} - {selectedOffer.jobTitle}
                </p>
                <p className="text-sm text-gray-600">
                  Candidate: {getApplicantName(selectedOffer.application?.applicant)}
                </p>
              </div>
              
              {['approve', 'reject', 'withdraw', 'decline', 'negotiate', 'escalate'].includes(actionType) && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full p-3 border border-gray-300 rounded-sm"
                    placeholder={`Enter ${actionType} details...`}
                  />
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => setShowActionModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={executeAction}
                className="px-4 py-2 bg-gold-500 text-violet-950 rounded-sm hover:bg-gold-600"
              >
                Confirm {actionType.charAt(0).toUpperCase() + actionType.slice(1)}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Generate Offer Letter Modal */}
      {showLetterModal && letterOffer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-sm shadow-xl max-w-lg w-full m-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Generate Offer Letter
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div className="rounded-sm border border-gray-200 bg-gray-50 p-4 space-y-1">
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-gray-700">Offer:</span> {letterOffer.offerNumber}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-gray-700">Position:</span> {letterOffer.jobTitle} — {letterOffer.department}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-gray-700">Candidate:</span> {getApplicantName(letterOffer.application?.applicant)}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-gray-700">Compensation:</span> {formatCurrency(letterOffer.baseSalary, letterOffer.currency)}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-gray-700">Start Date:</span> {letterOffer.startDate ? formatDate(letterOffer.startDate) : 'TBD'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Generation Mode</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="radio" name="letterMode" value="automatic" defaultChecked className="text-[#05527E]" />
                    Automatic — use standard template
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="radio" name="letterMode" value="manual" className="text-[#05527E]" />
                    Manual — review before finalising
                  </label>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                The offer letter will be generated using company templates and the offer details above. You can preview and download the letter once generated.
              </p>
            </div>

            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => { setShowLetterModal(false); setLetterOffer(null); }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-sm hover:bg-gray-50"
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
                className="px-4 py-2 bg-gold-500 text-violet-950 rounded-sm hover:bg-gold-600"
              >
                Generate Letter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send to Payroll Modal */}
      {showPayrollModal && payrollOffer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-sm shadow-xl max-w-lg w-full m-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Send to Payroll
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Register this new employee in the payroll system
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="rounded-sm border border-gray-200 bg-gray-50 p-4 space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Employee Details</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-gray-700">Name:</span> {getApplicantName(payrollOffer.application?.applicant)}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-gray-700">Email:</span> {payrollOffer.application?.applicant?.email || '—'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-gray-700">Position:</span> {payrollOffer.jobTitle}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-gray-700">Department:</span> {payrollOffer.department}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-gray-700">Base Salary:</span> {formatCurrency(payrollOffer.baseSalary, payrollOffer.currency)}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-gray-700">Total Comp:</span> {formatCurrency(payrollOffer.totalCompensation, payrollOffer.currency)}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-gray-700">Start Date:</span> {payrollOffer.startDate ? formatDate(payrollOffer.startDate) : 'TBD'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-gray-700">Offer Type:</span> {payrollOffer.offerType?.replace(/_/g, ' ') || '—'}
                  </p>
                </div>
              </div>

              <div className="rounded-sm border border-[#05527E]/20 bg-[#05527E]/5 p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-[#05527E] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-[#05527E]">Sage 300 People</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      The employee record will be created in Sage with the details above. Payroll processing, tax setup, and benefits enrolment will be configured based on the offer type and department defaults.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                This action will transmit the candidate's details to the connected payroll system. Ensure all details are correct before proceeding.
              </p>
            </div>

            <div className="px-6 py-4 bg-gray-50 flex justify-between items-center">
              <button
                onClick={() => { setShowPayrollModal(false); setPayrollOffer(null); }}
                disabled={payrollSending}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowPayrollModal(false); setPayrollOffer(null); }}
                  disabled={payrollSending}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-sm hover:bg-gray-50"
                >
                  Skip for Now
                </button>
                <button
                  onClick={() => {
                    setPayrollSending(true);
                    // Mock: simulate API call delay
                    setTimeout(() => {
                      setPayrollSent(prev => ({ ...prev, [payrollOffer.id]: true }));
                      toast('Employee details sent to Sage 300 People successfully', 'success');
                      setShowPayrollModal(false);
                      setPayrollOffer(null);
                      setPayrollSending(false);
                    }, 1500);
                  }}
                  disabled={payrollSending}
                  className="px-4 py-2 bg-gold-500 text-violet-950 rounded-sm hover:bg-gold-600 disabled:opacity-50"
                >
                  {payrollSending ? 'Sending...' : 'Send to Payroll'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* E-Sign Modal */}
      {showESignModal && eSignOffer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-sm shadow-xl max-w-md w-full m-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Send for E-Signature
              </h3>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Offer: {eSignOffer.offerNumber} - {eSignOffer.jobTitle}
                </p>
                <p className="text-sm text-gray-600">
                  Candidate: {getApplicantName(eSignOffer.application?.applicant)}
                </p>
              </div>

              <div className="mb-4 rounded-sm border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">DocuSign will send to:</p>
                <p className="text-sm text-gray-900">{getApplicantName(eSignOffer.application?.applicant)}</p>
                <p className="text-sm text-gray-500">{eSignOffer.application?.applicant?.email || ''}</p>
              </div>

              <p className="text-xs text-gray-500">
                The offer letter will be sent via DocuSign for electronic signature. The candidate will receive an email with a link to review and sign the document.
              </p>
            </div>

            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => { setShowESignModal(false); setESignOffer(null); }}
                disabled={eSignLoading}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendForSignature}
                disabled={eSignLoading}
                className="px-4 py-2 bg-gold-500 text-violet-950 rounded-sm hover:bg-gold-600 disabled:opacity-50"
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
