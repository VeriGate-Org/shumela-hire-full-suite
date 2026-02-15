'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
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
  InformationCircleIcon,
  StarIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

interface Offer {
  id: string;
  jobTitle: string;
  company: string;
  companyLogo?: string;
  department: string;
  location: string;
  offerDate: string;
  expirationDate: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'negotiating';
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

export default function MyOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'accepted' | 'declined' | 'expired' | 'negotiating'>('all');
  const [loading, setLoading] = useState(true);
  const [showNegotiationModal, setShowNegotiationModal] = useState(false);

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    setLoading(true);
    
    // Mock offer data
    const mockOffers: Offer[] = [
      {
        id: 'offer_001',
        jobTitle: 'Senior Software Engineer',
        company: 'TechCorp Inc.',
        department: 'Engineering',
        location: 'San Francisco, CA',
        offerDate: '2025-01-20T10:00:00Z',
        expirationDate: '2025-02-03T17:00:00Z',
        status: 'pending',
        salary: {
          base: 165000,
          currency: 'USD',
          frequency: 'annual'
        },
        bonus: {
          signing: 25000,
          annual: 30000,
          currency: 'USD'
        },
        benefits: [
          'Health Insurance (100% covered)',
          'Dental & Vision',
          '401k with 6% match',
          '20 days PTO',
          'Stock Options',
          'Home Office Stipend',
          'Professional Development Budget'
        ],
        workSchedule: {
          type: 'full_time',
          hoursPerWeek: 40,
          remote: 'hybrid',
          flexibleHours: true
        },
        startDate: '2025-03-01',
        equity: {
          percentage: 0.25,
          vestingPeriod: '4 years with 1 year cliff'
        },
        relocationAssistance: 15000,
        additionalNotes: 'Exceptional opportunity to lead our new AI initiatives. Remote work available 3 days per week.',
        contactPerson: {
          name: 'Sarah Martinez',
          title: 'Senior Talent Acquisition Manager',
          email: 'sarah.martinez@techcorp.com',
          phone: '+1 (555) 123-4567'
        },
        documents: [
          { name: 'Offer Letter.pdf', type: 'offer_letter', url: '/docs/offer1.pdf' },
          { name: 'Benefits Overview.pdf', type: 'benefits', url: '/docs/benefits1.pdf' },
          { name: 'Employee Handbook.pdf', type: 'handbook', url: '/docs/handbook1.pdf' }
        ],
        negotiations: [
          {
            id: 'neg_001',
            date: '2025-01-22T14:30:00Z',
            type: 'salary',
            requestedBy: 'candidate',
            details: 'Requesting base salary increase to $175,000',
            status: 'pending'
          }
        ]
      },
      {
        id: 'offer_002',
        jobTitle: 'Principal Engineer',
        company: 'InnovateLabs',
        department: 'R&D',
        location: 'Austin, TX',
        offerDate: '2025-01-18T15:30:00Z',
        expirationDate: '2025-01-30T17:00:00Z',
        status: 'negotiating',
        salary: {
          base: 180000,
          currency: 'USD',
          frequency: 'annual'
        },
        bonus: {
          signing: 35000,
          annual: 40000,
          currency: 'USD'
        },
        benefits: [
          'Premium Health Insurance',
          'Dental & Vision',
          '401k with 8% match',
          'Unlimited PTO',
          'Stock Options',
          'Learning & Development Budget',
          'Gym Membership'
        ],
        workSchedule: {
          type: 'full_time',
          hoursPerWeek: 40,
          remote: 'fully_remote',
          flexibleHours: true
        },
        startDate: '2025-02-15',
        equity: {
          percentage: 0.5,
          vestingPeriod: '4 years with 6 month cliff'
        },
        additionalNotes: 'Leading our next-generation platform architecture. Fully remote with quarterly team meetups.',
        contactPerson: {
          name: 'Michael Chen',
          title: 'VP of Engineering',
          email: 'michael.chen@innovatelabs.com',
          phone: '+1 (555) 987-6543'
        },
        documents: [
          { name: 'Offer Package.pdf', type: 'offer_letter', url: '/docs/offer2.pdf' },
          { name: 'Equity Agreement.pdf', type: 'equity', url: '/docs/equity2.pdf' }
        ],
        negotiations: [
          {
            id: 'neg_002',
            date: '2025-01-20T10:00:00Z',
            type: 'start_date',
            requestedBy: 'candidate',
            details: 'Requesting start date moved to March 1st',
            status: 'accepted'
          },
          {
            id: 'neg_003',
            date: '2025-01-21T16:00:00Z',
            type: 'benefits',
            requestedBy: 'candidate',
            details: 'Requesting additional home office budget',
            status: 'pending'
          }
        ]
      },
      {
        id: 'offer_003',
        jobTitle: 'Lead Frontend Developer',
        company: 'DesignCo',
        department: 'Product',
        location: 'Remote',
        offerDate: '2025-01-10T09:00:00Z',
        expirationDate: '2025-01-25T17:00:00Z',
        status: 'accepted',
        salary: {
          base: 145000,
          currency: 'USD',
          frequency: 'annual'
        },
        bonus: {
          signing: 15000,
          annual: 20000,
          currency: 'USD'
        },
        benefits: [
          'Health Insurance',
          'Dental & Vision',
          '401k with 4% match',
          '25 days PTO',
          'Remote Work Stipend',
          'Professional Development'
        ],
        workSchedule: {
          type: 'full_time',
          hoursPerWeek: 40,
          remote: 'fully_remote',
          flexibleHours: true
        },
        startDate: '2025-02-01',
        additionalNotes: 'Exciting opportunity to shape the future of design tools.',
        contactPerson: {
          name: 'Emily Rodriguez',
          title: 'Head of Talent',
          email: 'emily.rodriguez@designco.com',
          phone: '+1 (555) 456-7890'
        },
        documents: [
          { name: 'Final Offer.pdf', type: 'offer_letter', url: '/docs/offer3.pdf' }
        ],
        negotiations: []
      }
    ];

    // Simulate loading delay
    setTimeout(() => {
      setOffers(mockOffers);
      setLoading(false);
    }, 800);
  };

  const filteredOffers = offers.filter(offer => 
    filterStatus === 'all' || offer.status === filterStatus
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'accepted': return 'bg-green-100 text-green-800 border-green-300';
      case 'declined': return 'bg-red-100 text-red-800 border-red-300';
      case 'expired': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'negotiating': return 'bg-violet-100 text-violet-800 border-violet-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <ClockIcon className="w-4 h-4" />;
      case 'accepted': return <CheckCircleIcon className="w-4 h-4" />;
      case 'declined': return <XCircleIcon className="w-4 h-4" />;
      case 'expired': return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'negotiating': return <ChatBubbleLeftRightIcon className="w-4 h-4" />;
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

  const formatSalary = (salary: any) => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: salary.currency,
      minimumFractionDigits: 0,
    }).format(salary.base);
    
    return `${formatted} ${salary.frequency === 'annual' ? '/year' : salary.frequency === 'monthly' ? '/month' : '/hour'}`;
  };

  const handleOfferAction = (offerId: string, action: 'accept' | 'decline') => {
    setOffers(prev => prev.map(offer => 
      offer.id === offerId ? { ...offer, status: action === 'accept' ? 'accepted' : 'declined' } : offer
    ));
  };

  const actions = (
    <div className="flex items-center gap-3">
      <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value as any)}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
      >
        <option value="all">All Offers</option>
        <option value="pending">Pending</option>
        <option value="negotiating">Negotiating</option>
        <option value="accepted">Accepted</option>
        <option value="declined">Declined</option>
        <option value="expired">Expired</option>
      </select>
    </div>
  );

  if (loading) {
    return (
      <PageWrapper title="My Offers" subtitle="Loading your job offers..." actions={actions}>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-violet-500"></div>
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
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CurrencyDollarIcon className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Offers</p>
                <p className="text-2xl font-semibold text-gray-900">{offers.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
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
          
          <div className="bg-white rounded-lg shadow p-6">
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
          
          <div className="bg-white rounded-lg shadow p-6">
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
              <div key={offer.id} className="bg-white rounded-lg shadow border-l-4 border-l-violet-500 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-violet-700 rounded-lg flex items-center justify-center">
                          <BriefcaseIcon className="w-8 h-8 text-white" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-xl font-semibold text-gray-900">{offer.jobTitle}</h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(offer.status)}`}>
                              {getStatusIcon(offer.status)}
                              <span className="ml-1 capitalize">{offer.status}</span>
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
                          
                          <p className="text-lg text-violet-600 font-medium">{offer.company}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center">
                              <MapPinIcon className="w-4 h-4 mr-1" />
                              {offer.location}
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
                        <div className="bg-green-50 rounded-lg p-4">
                          <div className="flex items-center">
                            <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-500">Base Salary</p>
                              <p className="text-lg font-semibold text-gray-900">{formatSalary(offer.salary)}</p>
                            </div>
                          </div>
                        </div>
                        
                        {offer.bonus && (
                          <div className="bg-violet-50 rounded-lg p-4">
                            <div className="flex items-center">
                              <StarIcon className="w-5 h-5 text-violet-600" />
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-500">Annual Bonus</p>
                                <p className="text-lg font-semibold text-gray-900">
                                  ${offer.bonus.annual.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="bg-purple-50 rounded-lg p-4">
                          <div className="flex items-center">
                            <CalendarIcon className="w-5 h-5 text-purple-600" />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-500">Start Date</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {new Date(offer.startDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {offer.negotiations.length > 0 && (
                        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
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
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <EyeIcon className="w-4 h-4 mr-2" />
                        View Details
                      </button>
                      
                      {offer.status === 'pending' && !isExpired && (
                        <>
                          <button
                            onClick={() => handleOfferAction(offer.id, 'accept')}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircleIcon className="w-4 h-4 mr-2" />
                            Accept
                          </button>
                          <button
                            onClick={() => setShowNegotiationModal(true)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-violet-600 hover:bg-violet-700"
                          >
                            <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
                            Negotiate
                          </button>
                          <button
                            onClick={() => handleOfferAction(offer.id, 'decline')}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <XCircleIcon className="w-4 h-4 mr-2" />
                            Decline
                          </button>
                        </>
                      )}
                      
                      {offer.status === 'negotiating' && (
                        <button
                          onClick={() => setShowNegotiationModal(true)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-violet-600 hover:bg-violet-700"
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
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <CurrencyDollarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No offers found</h3>
            <p className="text-gray-600">
              {filterStatus === 'all' 
                ? "You don't have any job offers yet. Keep applying to great opportunities!"
                : `No offers with status "${filterStatus}" found.`
              }
            </p>
          </div>
        )}

        {/* Offer Details Modal */}
        {selectedOffer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedOffer.jobTitle}</h2>
                    <p className="text-lg text-violet-600 font-medium mt-1">{selectedOffer.company}</p>
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
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between">
                          <span className="font-medium">Base Salary:</span>
                          <span>{formatSalary(selectedOffer.salary)}</span>
                        </div>
                        {selectedOffer.bonus && (
                          <>
                            <div className="flex justify-between">
                              <span className="font-medium">Signing Bonus:</span>
                              <span>${selectedOffer.bonus.signing.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Annual Bonus:</span>
                              <span>${selectedOffer.bonus.annual.toLocaleString()}</span>
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
                            <span>${selectedOffer.relocationAssistance.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Work Details</h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between">
                          <span className="font-medium">Schedule:</span>
                          <span className="capitalize">{selectedOffer.workSchedule.type.replace('_', ' ')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Hours/Week:</span>
                          <span>{selectedOffer.workSchedule.hoursPerWeek}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Remote Work:</span>
                          <span className="capitalize">{selectedOffer.workSchedule.remote.replace('_', ' ')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Start Date:</span>
                          <span>{new Date(selectedOffer.startDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Benefits</h3>
                      <div className="space-y-2">
                        {selectedOffer.benefits.map((benefit, index) => (
                          <div key={index} className="flex items-center">
                            <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                            <span className="text-sm">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div>
                          <p className="font-medium">{selectedOffer.contactPerson.name}</p>
                          <p className="text-sm text-gray-600">{selectedOffer.contactPerson.title}</p>
                        </div>
                        <div className="flex items-center text-sm">
                          <EnvelopeIcon className="w-4 h-4 mr-2" />
                          {selectedOffer.contactPerson.email}
                        </div>
                        <div className="flex items-center text-sm">
                          <PhoneIcon className="w-4 h-4 mr-2" />
                          {selectedOffer.contactPerson.phone}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Documents</h3>
                      <div className="space-y-2">
                        {selectedOffer.documents.map((doc, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                              <DocumentTextIcon className="w-5 h-5 text-violet-500 mr-3" />
                              <span className="text-sm font-medium">{doc.name}</span>
                            </div>
                            <button className="text-violet-600 hover:text-violet-800">
                              <ArrowDownTrayIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {selectedOffer.additionalNotes && (
                  <div className="mt-6 p-4 bg-violet-50 rounded-lg">
                    <h4 className="font-medium text-violet-900 mb-2">Additional Notes</h4>
                    <p className="text-violet-800 text-sm">{selectedOffer.additionalNotes}</p>
                  </div>
                )}

                <div className="flex justify-end mt-6 pt-6 border-t space-x-3">
                  <button
                    onClick={() => setSelectedOffer(null)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Close
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
