'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

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
      firstName: string;
      lastName: string;
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

const NEGOTIATION_STATUSES = [
  'NOT_STARTED', 'IN_PROGRESS', 'CANDIDATE_RESPONSE_PENDING',
  'COMPANY_RESPONSE_PENDING', 'STALLED', 'ESCALATED', 'FINAL_OFFER',
  'AGREED', 'FAILED'
];

export default function OfferManagement() {
  const { user } = useAuth();
  const currentRole = user?.role || 'recruiter';
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

  useEffect(() => {
    loadOffers();
    loadDashboardCounts();
  }, [filters, currentPage]);

  const loadOffers = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        size: '10',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
        )
      });

      const response = await fetch(`/api/offers/search?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setOffers(data.content || []);
        setTotalPages(data.totalPages || 0);
      }
    } catch (error) {
      console.error('Error loading offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardCounts = async () => {
    try {
      const response = await fetch('/api/offers/dashboard');
      if (response.ok) {
        const counts = await response.json();
        setDashboardCounts(counts);
      }
    } catch (error) {
      console.error('Error loading dashboard counts:', error);
    }
  };

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
      const method = 'POST';
      const headers: any = {
        'Content-Type': 'application/json',
        'X-User-ID': '1' // Mock user ID
      };

      let body = null;
      if (['approve', 'reject', 'withdraw', 'decline', 'negotiate', 'escalate'].includes(actionType)) {
        body = JSON.stringify(actionData);
      }

      const response = await fetch(endpoint, { method, headers, body });
      
      if (response.ok) {
        setShowActionModal(false);
        loadOffers();
        loadDashboardCounts();
      } else {
        alert('Action failed. Please try again.');
      }
    } catch (error) {
      console.error('Error executing action:', error);
      alert('Action failed. Please try again.');
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
               ['ADMIN', 'HR_MANAGER', 'HIRING_MANAGER'].includes(userRole);
      case 'send':
        return offer.status === 'APPROVED' &&
               ['ADMIN', 'HR_MANAGER', 'HIRING_MANAGER'].includes(userRole);
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

  return (
    <div className="space-y-6">
      {/* Dashboard Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-800">Pending Approval</p>
              <p className="text-2xl font-bold text-yellow-900">{dashboardCounts.pendingApproval}</p>
            </div>
            <div className="text-yellow-500">⏳</div>
          </div>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-800">Near Expiry</p>
              <p className="text-2xl font-bold text-red-900">{dashboardCounts.nearExpiry}</p>
            </div>
            <div className="text-red-500">⚠️</div>
          </div>
        </div>
        
        <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-violet-800">Active Negotiations</p>
              <p className="text-2xl font-bold text-violet-900">{dashboardCounts.activeNegotiations}</p>
            </div>
            <div className="text-violet-500">🤝</div>
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Recent Acceptances</p>
              <p className="text-2xl font-bold text-green-900">{dashboardCounts.recentAcceptances}</p>
            </div>
            <div className="text-green-500">🎉</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters({...filters, status: e.target.value || undefined})}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
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
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
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
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Salary</label>
            <input
              type="number"
              value={filters.minSalary || ''}
              onChange={(e) => setFilters({...filters, minSalary: e.target.value ? Number(e.target.value) : undefined})}
              placeholder="Min salary"
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Salary</label>
            <input
              type="number"
              value={filters.maxSalary || ''}
              onChange={(e) => setFilters({...filters, maxSalary: e.target.value ? Number(e.target.value) : undefined})}
              placeholder="Max salary"
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-end space-x-2">
          <button
            onClick={() => setFilters({})}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Clear Filters
          </button>
          <button
            onClick={() => {setCurrentPage(0); loadOffers();}}
            className="px-4 py-2 text-sm bg-violet-600 text-white rounded-md hover:bg-violet-700"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Offers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Offers</h3>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500 mx-auto"></div>
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
                          {offer.application.applicant.firstName} {offer.application.applicant.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {offer.application.applicant.email}
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
                            className="text-violet-600 hover:text-violet-900"
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
                            className="text-violet-600 hover:text-violet-900"
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
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
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
                  Candidate: {selectedOffer.application.applicant.firstName} {selectedOffer.application.applicant.lastName}
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
                    className="w-full p-3 border border-gray-300 rounded-md"
                    placeholder={`Enter ${actionType} details...`}
                  />
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => setShowActionModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={executeAction}
                className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
              >
                Confirm {actionType.charAt(0).toUpperCase() + actionType.slice(1)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}