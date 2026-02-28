'use client';

import { useState, useEffect, useCallback } from 'react';
import PageWrapper from '@/components/PageWrapper';
import EmptyState from '@/components/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import { getApplicantId, getOffersForApplicant } from '@/services/candidateService';
import { apiFetch } from '@/lib/api-fetch';
import {
  CurrencyDollarIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  MapPinIcon,
  BriefcaseIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  StarIcon,
  EnvelopeIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';

// --- O5: Currency formatter ---
function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: currency || 'ZAR',
    minimumFractionDigits: 0,
  }).format(amount);
}

// --- O3: offerType -> workSchedule.type mapping ---
function mapOfferType(offerType: string): 'full_time' | 'part_time' | 'contract' {
  const typeMap: Record<string, 'full_time' | 'part_time' | 'contract'> = {
    FULL_TIME_PERMANENT: 'full_time',
    PART_TIME_PERMANENT: 'part_time',
    CONTRACT_FIXED_TERM: 'contract',
    CONTRACT_RENEWABLE: 'contract',
    CONSULTANT: 'contract',
    INTERNSHIP: 'contract',
    APPRENTICESHIP: 'contract',
    TEMPORARY: 'contract',
    PROBATIONARY: 'full_time',
    EXECUTIVE: 'full_time',
  };
  return typeMap[offerType] || 'full_time';
}

// --- O3: salaryFrequency -> salary.frequency mapping ---
function mapSalaryFrequency(freq: string): 'annual' | 'monthly' | 'hourly' {
  const freqMap: Record<string, 'annual' | 'monthly' | 'hourly'> = {
    ANNUALLY: 'annual', ANNUAL: 'annual',
    MONTHLY: 'monthly',
    HOURLY: 'hourly',
    WEEKLY: 'monthly', // approximate
    DAILY: 'hourly',   // approximate
  };
  return freqMap[freq] || 'annual';
}

interface Offer {
  id: string;
  jobTitle: string;
  company: string;
  companyLogo?: string;
  department: string;
  location: string;
  offerDate: string;
  expirationDate: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'negotiating' | 'awaiting_signature' | 'signed' | 'superseded' | 'withdrawn';
  salary: {
    base: number;
    currency: string;
    frequency: 'annual' | 'monthly' | 'hourly';
  };
  bonus?: {
    signing: number;
    annual: number;
    currency: string;
  };
  benefits: string[];
  workSchedule: {
    type: 'full_time' | 'part_time' | 'contract';
    hoursPerWeek: number;
    remote: 'fully_remote' | 'hybrid' | 'on_site';
    flexibleHours: boolean;
  };
  startDate: string;
  contractLength?: string;
  equity?: {
    percentage: number;
    vestingPeriod: string;
  };
  relocationAssistance?: number;
  relocationCurrency?: string;
  additionalNotes: string;
  contactPerson: {
    name: string;
    title: string;
    email: string;
    phone: string;
  };
  documents: Array<{
    name: string;
    type: string;
    url: string;
  }>;
  negotiations: Array<{
    id: string;
    date: string;
    type: 'salary' | 'benefits' | 'start_date' | 'other';
    requestedBy: 'candidate' | 'employer';
    details: string;
    status: 'pending' | 'accepted' | 'declined';
  }>;
}

// --- O4: Complete status mappings ---
function mapOfferStatus(status: string): Offer['status'] {
  const statusMap: Record<string, Offer['status']> = {
    PENDING: 'pending', DRAFT: 'pending', PENDING_APPROVAL: 'pending',
    APPROVED: 'pending', SENT: 'pending',
    ACCEPTED: 'accepted',
    DECLINED: 'declined', REJECTED: 'declined',
    EXPIRED: 'expired',
    NEGOTIATING: 'negotiating', COUNTER_OFFERED: 'negotiating', UNDER_NEGOTIATION: 'negotiating',
    AWAITING_SIGNATURE: 'awaiting_signature',
    SIGNED: 'signed',
    SUPERSEDED: 'superseded',
    WITHDRAWN: 'withdrawn',
  };
  return statusMap[status] || 'pending';
}

export default function MyOffersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  // O2: Negotiation modal state
  const [showNegotiationModal, setShowNegotiationModal] = useState(false);
  const [negotiationOfferId, setNegotiationOfferId] = useState<string | null>(null);
  const [counterOfferText, setCounterOfferText] = useState('');
  const [negotiationSubmitting, setNegotiationSubmitting] = useState(false);
  // O1: Decline reason modal state
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineOfferId, setDeclineOfferId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [declineSubmitting, setDeclineSubmitting] = useState(false);

  // --- O6: Single-call offer loading via applicant endpoint ---
  const loadOffers = useCallback(async () => {
    if (!user?.email) { setLoading(false); return; }
    setLoading(true);
    try {
      const applicantId = await getApplicantId(user.email);
      if (!applicantId) { setOffers([]); return; }
      const rawOffers = await getOffersForApplicant(applicantId);
      const allOffers: Offer[] = rawOffers.map((o: any) => {
        const currency = o.currency || 'ZAR';

        // O3: Build documents from offerDocumentPath and signedDocumentPath
        const documents: Offer['documents'] = [];
        if (o.offerDocumentPath) {
          documents.push({ name: 'Offer Letter', type: 'pdf', url: o.offerDocumentPath });
        }
        if (o.signedDocumentPath) {
          documents.push({ name: 'Signed Offer', type: 'pdf', url: o.signedDocumentPath });
        }

        // O3: Build bonus from signingBonus, bonusTargetPercentage, bonusEligible
        let bonus: Offer['bonus'] | undefined;
        if (o.signingBonus || o.bonusTargetPercentage || o.bonusEligible) {
          bonus = {
            signing: o.signingBonus || 0,
            annual: o.bonusTargetPercentage
              ? Math.round((o.baseSalary || o.salary || 0) * (o.bonusTargetPercentage / 100))
              : 0,
            currency,
          };
        }

        // O3: Map remoteWorkAllowed -> workSchedule.remote
        let remote: 'fully_remote' | 'hybrid' | 'on_site' = 'on_site';
        if (o.remoteWorkAllowed === true || o.remoteWorkAllowed === 'FULLY_REMOTE') {
          remote = 'fully_remote';
        } else if (o.remoteWorkAllowed === 'HYBRID') {
          remote = 'hybrid';
        }

        // O3: Use application?.jobPosting?.company for company name
        const company = o.application?.jobPosting?.company || o.companyName || 'ShumelaHire';

        return {
          id: String(o.id),
          jobTitle: o.jobTitle || o.application?.jobPosting?.title || '',
          company,
          department: o.department || o.application?.jobPosting?.department || '',
          location: o.location || '',
          offerDate: o.createdAt || new Date().toISOString(),
          expirationDate: o.offerExpiryDate || o.expiresAt || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          status: mapOfferStatus(o.status || ''),
          salary: {
            base: o.baseSalary || o.salary || 0,
            currency,
            frequency: mapSalaryFrequency(o.salaryFrequency || ''),
          },
          bonus,
          benefits: o.benefits ? (typeof o.benefits === 'string' ? o.benefits.split('\n').filter(Boolean) : o.benefits) : [],
          workSchedule: {
            type: mapOfferType(o.offerType || ''),
            hoursPerWeek: o.hoursPerWeek || 40,
            remote,
            flexibleHours: o.flexibleHours || false,
          },
          startDate: o.proposedStartDate || o.startDate || '',
          relocationAssistance: o.relocationAssistance || undefined,
          relocationCurrency: currency,
          additionalNotes: o.notes || o.additionalNotes || '',
          contactPerson: {
            name: o.recruiterName || '',
            title: 'Recruiter',
            email: o.recruiterEmail || '',
            phone: '',
          },
          documents,
          negotiations: o.negotiationStatus ? [{
            id: `neg-${o.id}`,
            date: o.updatedAt || new Date().toISOString(),
            type: 'salary' as const,
            requestedBy: 'candidate' as const,
            details: o.candidateCounterOffer || o.companyResponse || '',
            status: o.negotiationStatus === 'RESOLVED' ? 'accepted' as const : 'pending' as const,
          }] : [],
        };
      });
      setOffers(allOffers);
    } catch (error) {
      console.error('Failed to load offers:', error);
      toast('Failed to load offers', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  const filteredOffers = offers.filter(offer =>
    filterStatus === 'all' || offer.status === filterStatus
  );

  // --- O4: Complete status colors ---
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'accepted': return 'bg-green-100 text-green-800 border-green-300';
      case 'declined': return 'bg-red-100 text-red-800 border-red-300';
      case 'expired': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'negotiating': return 'bg-gold-100 text-gold-800 border-violet-300';
      case 'awaiting_signature': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'signed': return 'bg-green-200 text-green-900 border-green-400';
      case 'superseded': return 'bg-gray-200 text-gray-600 border-gray-400';
      case 'withdrawn': return 'bg-red-50 text-red-600 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // --- O4: Complete status icons ---
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <ClockIcon className="w-4 h-4" />;
      case 'accepted': return <CheckCircleIcon className="w-4 h-4" />;
      case 'declined': return <XCircleIcon className="w-4 h-4" />;
      case 'expired': return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'negotiating': return <ChatBubbleLeftRightIcon className="w-4 h-4" />;
      case 'awaiting_signature': return <PencilSquareIcon className="w-4 h-4" />;
      case 'signed': return <DocumentTextIcon className="w-4 h-4" />;
      case 'superseded': return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'withdrawn': return <XCircleIcon className="w-4 h-4" />;
      default: return <ClockIcon className="w-4 h-4" />;
    }
  };

  const getDaysUntilExpiration = (expirationDate: string) => {
    const today = new Date();
    const expiry = new Date(expirationDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // --- O5: Fixed formatSalary using currency-aware formatter ---
  const formatSalary = (salary: Offer['salary']) => {
    const formatted = formatCurrency(salary.base, salary.currency);
    return `${formatted} ${salary.frequency === 'annual' ? '/year' : salary.frequency === 'monthly' ? '/month' : '/hour'}`;
  };

  // --- O1: Accept offer via backend ---
  const handleAcceptOffer = async (offerId: string) => {
    try {
      const response = await apiFetch(`/api/offers/${offerId}/accept`, { method: 'POST' });
      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || `HTTP ${response.status}`);
      }
      toast('Offer accepted successfully', 'success');
      setOffers(prev => prev.map(o => o.id === offerId ? { ...o, status: 'accepted' as const } : o));
    } catch (error: any) {
      toast(`Failed to accept offer: ${error.message || 'Unknown error'}`, 'error');
    }
  };

  // --- O1: Decline offer via backend with reason ---
  const handleDeclineOffer = async () => {
    if (!declineOfferId) return;
    setDeclineSubmitting(true);
    try {
      const response = await apiFetch(`/api/offers/${declineOfferId}/decline`, {
        method: 'POST',
        body: JSON.stringify({ declineReason }),
      });
      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || `HTTP ${response.status}`);
      }
      toast('Offer declined', 'success');
      setOffers(prev => prev.map(o => o.id === declineOfferId ? { ...o, status: 'declined' as const } : o));
      setShowDeclineModal(false);
      setDeclineReason('');
      setDeclineOfferId(null);
    } catch (error: any) {
      toast(`Failed to decline offer: ${error.message || 'Unknown error'}`, 'error');
    } finally {
      setDeclineSubmitting(false);
    }
  };

  // --- O2: Negotiate offer via backend ---
  const handleNegotiate = async () => {
    if (!negotiationOfferId || !counterOfferText.trim()) return;
    setNegotiationSubmitting(true);
    try {
      const response = await apiFetch(`/api/offers/${negotiationOfferId}/negotiate`, {
        method: 'POST',
        body: JSON.stringify({ candidateCounterOffer: counterOfferText }),
      });
      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || `HTTP ${response.status}`);
      }
      toast('Counter-offer submitted', 'success');
      setOffers(prev => prev.map(o => o.id === negotiationOfferId ? { ...o, status: 'negotiating' as const } : o));
      setShowNegotiationModal(false);
      setCounterOfferText('');
      setNegotiationOfferId(null);
    } catch (error: any) {
      toast(`Failed to submit counter-offer: ${error.message || 'Unknown error'}`, 'error');
    } finally {
      setNegotiationSubmitting(false);
    }
  };

  // --- O4: filter dropdown options ---
  const actions = (
    <div className="flex items-center gap-3">
      <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
      >
        <option value="all">All Offers</option>
        <option value="pending">Pending</option>
        <option value="negotiating">Negotiating</option>
        <option value="accepted">Accepted</option>
        <option value="declined">Declined</option>
        <option value="expired">Expired</option>
        <option value="awaiting_signature">Awaiting Signature</option>
        <option value="signed">Signed</option>
        <option value="superseded">Superseded</option>
        <option value="withdrawn">Withdrawn</option>
      </select>
    </div>
  );

  if (loading) {
    return (
      <PageWrapper title="My Offers" subtitle="Loading your job offers..." actions={actions}>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gold-500"></div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="My Offers"
      subtitle="Manage and track your job offers"
      actions={actions}
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center">
              <CurrencyDollarIcon className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Offers</p>
                <p className="text-2xl font-semibold text-gray-900">{offers.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center">
              <ClockIcon className="w-8 h-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {offers.filter(o => o.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center">
              <ChatBubbleLeftRightIcon className="w-8 h-8 text-violet-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Negotiating</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {offers.filter(o => o.status === 'negotiating').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center">
              <CheckCircleIcon className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Accepted</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {offers.filter(o => o.status === 'accepted').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Offers List */}
        <div className="space-y-4">
          {filteredOffers.map((offer) => {
            const daysUntilExpiry = getDaysUntilExpiration(offer.expirationDate);
            const isExpiringSoon = daysUntilExpiry <= 3 && daysUntilExpiry > 0;
            const isExpired = daysUntilExpiry <= 0;

            return (
              <div key={offer.id} className="bg-white rounded-sm shadow border-l-4 border-l-violet-500 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 bg-violet-600 rounded-sm flex items-center justify-center">
                          <BriefcaseIcon className="w-8 h-8 text-white" />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-xl font-semibold text-gray-900">{offer.jobTitle}</h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(offer.status)}`}>
                              {getStatusIcon(offer.status)}
                              <span className="ml-1 capitalize">{offer.status.replace('_', ' ')}</span>
                            </span>
                            {isExpiringSoon && (
                              <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                                <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                                Expires in {daysUntilExpiry} days
                              </span>
                            )}
                            {isExpired && (
                              <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                <XCircleIcon className="w-3 h-3 mr-1" />
                                Expired
                              </span>
                            )}
                          </div>

                          <p className="text-lg text-gold-600 font-medium">{offer.company}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center">
                              <MapPinIcon className="w-4 h-4 mr-1" />
                              {offer.location || 'Not specified'}
                            </span>
                            <span className="flex items-center">
                              <CalendarIcon className="w-4 h-4 mr-1" />
                              Offer date: {new Date(offer.offerDate).toLocaleDateString()}
                            </span>
                            <span className="flex items-center">
                              <ClockIcon className="w-4 h-4 mr-1" />
                              Expires: {new Date(offer.expirationDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-green-50 rounded-sm p-4">
                          <div className="flex items-center">
                            <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-500">Base Salary</p>
                              <p className="text-lg font-semibold text-gray-900">{formatSalary(offer.salary)}</p>
                            </div>
                          </div>
                        </div>

                        {offer.bonus && (
                          <div className="bg-gold-50 rounded-sm p-4">
                            <div className="flex items-center">
                              <StarIcon className="w-5 h-5 text-gold-600" />
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-500">Annual Bonus</p>
                                <p className="text-lg font-semibold text-gray-900">
                                  {formatCurrency(offer.bonus.annual, offer.bonus.currency)}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="bg-purple-50 rounded-sm p-4">
                          <div className="flex items-center">
                            <CalendarIcon className="w-5 h-5 text-purple-600" />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-500">Start Date</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {offer.startDate ? new Date(offer.startDate).toLocaleDateString() : 'TBD'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {offer.negotiations.length > 0 && (
                        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-sm p-3">
                          <h4 className="text-sm font-medium text-yellow-800 mb-2">Active Negotiations</h4>
                          <div className="space-y-2">
                            {offer.negotiations.filter(n => n.status === 'pending').map((negotiation) => (
                              <div key={negotiation.id} className="text-xs text-yellow-700">
                                <strong>{negotiation.type.replace('_', ' ').toUpperCase()}:</strong> {negotiation.details}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2 ml-6">
                      <button
                        onClick={() => setSelectedOffer(offer)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <EyeIcon className="w-4 h-4 mr-2" />
                        View Details
                      </button>

                      {offer.status === 'pending' && !isExpired && (
                        <>
                          <button
                            onClick={() => handleAcceptOffer(offer.id)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircleIcon className="w-4 h-4 mr-2" />
                            Accept
                          </button>
                          <button
                            onClick={() => {
                              setNegotiationOfferId(offer.id);
                              setShowNegotiationModal(true);
                            }}
                            className="inline-flex items-center px-3 py-2 bg-transparent border-2 border-gold-500 text-violet-900 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider rounded-full text-sm font-medium"
                          >
                            <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
                            Negotiate
                          </button>
                          <button
                            onClick={() => {
                              setDeclineOfferId(offer.id);
                              setShowDeclineModal(true);
                            }}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <XCircleIcon className="w-4 h-4 mr-2" />
                            Decline
                          </button>
                        </>
                      )}

                      {offer.status === 'negotiating' && (
                        <button
                          onClick={() => {
                            setNegotiationOfferId(offer.id);
                            setShowNegotiationModal(true);
                          }}
                          className="inline-flex items-center px-3 py-2 bg-transparent border-2 border-gold-500 text-violet-900 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider rounded-full text-sm font-medium"
                        >
                          <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
                          Continue Negotiation
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredOffers.length === 0 && (
          <EmptyState
            icon={CurrencyDollarIcon}
            title="No offers found"
            description={
              filterStatus === 'all'
                ? "You don't have any job offers yet. Keep applying to great opportunities."
                : `No offers with status "${filterStatus}" found.`
            }
          />
        )}

        {/* Offer Details Modal */}
        {selectedOffer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-sm shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedOffer.jobTitle}</h2>
                    <p className="text-lg text-gold-600 font-medium mt-1">{selectedOffer.company}</p>
                  </div>
                  <button
                    onClick={() => setSelectedOffer(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircleIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Compensation</h3>
                      <div className="bg-gray-50 rounded-sm p-4 space-y-3">
                        <div className="flex justify-between">
                          <span className="font-medium">Base Salary:</span>
                          <span>{formatSalary(selectedOffer.salary)}</span>
                        </div>
                        {selectedOffer.bonus && (
                          <>
                            <div className="flex justify-between">
                              <span className="font-medium">Signing Bonus:</span>
                              <span>{formatCurrency(selectedOffer.bonus.signing, selectedOffer.bonus.currency)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Annual Bonus:</span>
                              <span>{formatCurrency(selectedOffer.bonus.annual, selectedOffer.bonus.currency)}</span>
                            </div>
                          </>
                        )}
                        {selectedOffer.equity && (
                          <div className="flex justify-between">
                            <span className="font-medium">Equity:</span>
                            <span>{selectedOffer.equity.percentage}% ({selectedOffer.equity.vestingPeriod})</span>
                          </div>
                        )}
                        {selectedOffer.relocationAssistance && (
                          <div className="flex justify-between">
                            <span className="font-medium">Relocation:</span>
                            <span>{formatCurrency(selectedOffer.relocationAssistance, selectedOffer.relocationCurrency || selectedOffer.salary.currency)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Work Details</h3>
                      <div className="bg-gray-50 rounded-sm p-4 space-y-3">
                        <div className="flex justify-between">
                          <span className="font-medium">Schedule:</span>
                          <span className="capitalize">{selectedOffer.workSchedule.type.replace(/_/g, ' ')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Hours/Week:</span>
                          <span>{selectedOffer.workSchedule.hoursPerWeek}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Remote Work:</span>
                          <span className="capitalize">{selectedOffer.workSchedule.remote.replace(/_/g, ' ')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Start Date:</span>
                          <span>{selectedOffer.startDate ? new Date(selectedOffer.startDate).toLocaleDateString() : 'TBD'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Benefits</h3>
                      <div className="space-y-2">
                        {selectedOffer.benefits.length > 0 ? selectedOffer.benefits.map((benefit, index) => (
                          <div key={index} className="flex items-center">
                            <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                            <span className="text-sm">{benefit}</span>
                          </div>
                        )) : (
                          <p className="text-sm text-gray-500">No benefits listed.</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
                      <div className="bg-gray-50 rounded-sm p-4 space-y-3">
                        <div>
                          <p className="font-medium">{selectedOffer.contactPerson.name || 'Not provided'}</p>
                          <p className="text-sm text-gray-600">{selectedOffer.contactPerson.title}</p>
                        </div>
                        {selectedOffer.contactPerson.email && (
                          <div className="flex items-center text-sm">
                            <EnvelopeIcon className="w-4 h-4 mr-2" />
                            {selectedOffer.contactPerson.email}
                          </div>
                        )}
                        {selectedOffer.contactPerson.phone && (
                          <div className="flex items-center text-sm">
                            <PhoneIcon className="w-4 h-4 mr-2" />
                            {selectedOffer.contactPerson.phone}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Documents</h3>
                      <div className="space-y-2">
                        {selectedOffer.documents.length > 0 ? selectedOffer.documents.map((doc, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-sm">
                            <div className="flex items-center">
                              <DocumentTextIcon className="w-5 h-5 text-violet-500 mr-3" />
                              <span className="text-sm font-medium">{doc.name}</span>
                            </div>
                            <button className="text-gold-600 hover:text-gold-800 rounded-full">
                              <ArrowDownTrayIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )) : (
                          <p className="text-sm text-gray-500">No documents attached.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {selectedOffer.additionalNotes && (
                  <div className="mt-6 p-4 bg-gold-50 rounded-sm">
                    <h4 className="font-medium text-violet-900 mb-2">Additional Notes</h4>
                    <p className="text-violet-800 text-sm">{selectedOffer.additionalNotes}</p>
                  </div>
                )}

                <div className="flex justify-end mt-6 pt-6 border-t space-x-3">
                  <button
                    onClick={() => setSelectedOffer(null)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-full hover:bg-gray-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* O1: Decline Reason Modal */}
        {showDeclineModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-sm shadow-xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Decline Offer</h3>
                <p className="text-sm text-gray-600 mb-4">Please provide a reason for declining this offer.</p>
                <textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-sm p-3 text-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
                  placeholder="Reason for declining..."
                />
                <div className="flex justify-end mt-4 space-x-3">
                  <button
                    onClick={() => { setShowDeclineModal(false); setDeclineReason(''); setDeclineOfferId(null); }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50"
                    disabled={declineSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeclineOffer}
                    disabled={declineSubmitting}
                    className="px-4 py-2 bg-red-600 text-white rounded-full text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                  >
                    {declineSubmitting ? 'Declining...' : 'Confirm Decline'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* O2: Negotiation Modal */}
        {showNegotiationModal && negotiationOfferId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-sm shadow-xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Submit Counter-Offer</h3>
                {(() => {
                  const offer = offers.find(o => o.id === negotiationOfferId);
                  return offer ? (
                    <div className="mb-4 bg-gray-50 rounded-sm p-3">
                      <p className="text-sm font-medium text-gray-900">{offer.jobTitle}</p>
                      <p className="text-sm text-gray-600">Current offer: {formatSalary(offer.salary)}</p>
                    </div>
                  ) : null;
                })()}
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                    Counter-offer Details
                  </label>
                  <textarea
                    value={counterOfferText}
                    onChange={(e) => setCounterOfferText(e.target.value)}
                    rows={4}
                    className="w-full border border-gray-300 rounded-sm p-3 text-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
                    placeholder="Describe your counter-offer (e.g., desired salary, benefits, start date adjustments)..."
                  />
                </div>
                <div className="flex justify-end mt-4 space-x-3">
                  <button
                    onClick={() => { setShowNegotiationModal(false); setCounterOfferText(''); setNegotiationOfferId(null); }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50"
                    disabled={negotiationSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleNegotiate}
                    disabled={negotiationSubmitting || !counterOfferText.trim()}
                    className="px-4 py-2 border-2 border-gold-500 bg-gold-500 text-violet-950 rounded-full text-sm font-medium uppercase tracking-wider hover:bg-gold-600 disabled:opacity-50"
                  >
                    {negotiationSubmitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
