'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import EmptyState from '@/components/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { getApplicantId, getApplications as fetchApplications } from '@/services/candidateService';
import { 
  BriefcaseIcon,
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  UserIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  companyLogo?: string;
  department: string;
  location: string;
  jobType: 'full_time' | 'part_time' | 'contract' | 'internship';
  appliedDate: string;
  lastUpdated: string;
  status: 'applied' | 'under_review' | 'phone_screening' | 'technical_interview' | 'final_interview' | 'offer_extended' | 'hired' | 'rejected' | 'withdrawn';
  currentStage: string;
  applicationSource: 'company_website' | 'linkedin' | 'indeed' | 'referral' | 'direct_application';
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  timeline: Array<{
    id: string;
    date: string;
    stage: string;
    description: string;
    notes?: string;
  }>;
  documents: Array<{
    name: string;
    type: string;
    uploadedDate: string;
  }>;
  jobDescription: string;
  requirements: string[];
  benefits: string[];
  contactPerson?: {
    name: string;
    title: string;
    email: string;
  };
  interviewScheduled?: {
    date: string;
    time: string;
    type: 'phone' | 'video' | 'in_person';
    interviewers: string[];
  };
  feedback?: string;
  nextSteps?: string;
  rejectionReason?: string;
  priority: 'high' | 'medium' | 'low';
}

function mapApplicationStatus(status: string): Application['status'] {
  const statusMap: Record<string, Application['status']> = {
    SUBMITTED: 'applied',
    UNDER_REVIEW: 'under_review',
    SCREENING: 'under_review',
    PHONE_INTERVIEW: 'phone_screening',
    TECHNICAL_INTERVIEW: 'technical_interview',
    FINAL_INTERVIEW: 'final_interview',
    OFFER_EXTENDED: 'offer_extended',
    HIRED: 'hired',
    REJECTED: 'rejected',
    WITHDRAWN: 'withdrawn',
  };
  return statusMap[status] || 'applied';
}

export default function MyApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'company' | 'status'>('date');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, [user]);

  const loadApplications = async () => {
    if (!user?.email) { setLoading(false); return; }
    setLoading(true);
    try {
      const applicantId = await getApplicantId(user.email);
      if (!applicantId) { setApplications([]); return; }
      const apps = await fetchApplications(applicantId);
      const mapped: Application[] = apps.map((a: any) => ({
        id: a.id,
        jobTitle: a.jobTitle || '',
        company: 'ShumelaHire',
        department: a.department || '',
        location: a.location || '',
        jobType: 'full_time' as const,
        appliedDate: a.submittedAt || a.createdAt || new Date().toISOString(),
        lastUpdated: a.updatedAt || a.submittedAt || new Date().toISOString(),
        status: mapApplicationStatus(a.status),
        currentStage: a.statusDisplayName || a.status || '',
        applicationSource: 'direct_application' as const,
        timeline: [],
        documents: (a.applicationDocuments || []).map((d: any) => ({
          name: d.fileName || d.name || 'Document',
          type: d.documentType || d.type || 'other',
          uploadedDate: d.uploadedAt || d.createdAt || new Date().toISOString(),
        })),
        jobDescription: '',
        requirements: [],
        benefits: [],
        feedback: a.feedback || undefined,
        rejectionReason: a.rejectionReason || undefined,
        priority: 'medium' as const,
      }));
      setApplications(mapped);
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      case 'company':
        return a.company.localeCompare(b.company);
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'bg-gold-100 text-gold-800 border-violet-300';
      case 'under_review': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'phone_screening': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'technical_interview': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'final_interview': return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'offer_extended': return 'bg-green-100 text-green-800 border-green-300';
      case 'hired': return 'bg-green-600 text-white border-green-600';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-300';
      case 'withdrawn': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'applied': return <ClockIcon className="w-4 h-4" />;
      case 'under_review': return <EyeIcon className="w-4 h-4" />;
      case 'phone_screening': return <ChatBubbleLeftRightIcon className="w-4 h-4" />;
      case 'technical_interview': return <DocumentTextIcon className="w-4 h-4" />;
      case 'final_interview': return <UserIcon className="w-4 h-4" />;
      case 'offer_extended': return <CheckCircleIcon className="w-4 h-4" />;
      case 'hired': return <CheckCircleIcon className="w-4 h-4" />;
      case 'rejected': return <XCircleIcon className="w-4 h-4" />;
      case 'withdrawn': return <XCircleIcon className="w-4 h-4" />;
      default: return <ClockIcon className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getJobTypeColor = (jobType: string) => {
    switch (jobType) {
      case 'full_time': return 'bg-gold-100 text-gold-800';
      case 'part_time': return 'bg-green-100 text-green-800';
      case 'contract': return 'bg-purple-100 text-purple-800';
      case 'internship': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysAgo = (date: string) => {
    const today = new Date();
    const applicationDate = new Date(date);
    const diffTime = today.getTime() - applicationDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  const actions = (
    <div className="flex items-center gap-3">
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search applications..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
        />
      </div>
      
      <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
      >
        <option value="all">All Status</option>
        <option value="applied">Applied</option>
        <option value="under_review">Under Review</option>
        <option value="phone_screening">Phone Screening</option>
        <option value="technical_interview">Technical Interview</option>
        <option value="final_interview">Final Interview</option>
        <option value="offer_extended">Offer Extended</option>
        <option value="hired">Hired</option>
        <option value="rejected">Rejected</option>
        <option value="withdrawn">Withdrawn</option>
      </select>
      
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value as any)}
        className="px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
      >
        <option value="date">Sort by Date</option>
        <option value="company">Sort by Company</option>
        <option value="status">Sort by Status</option>
      </select>
    </div>
  );

  if (loading) {
    return (
      <PageWrapper title="My Applications" subtitle="Loading your applications..." actions={actions}>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gold-500"></div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="My Applications"
      subtitle="Track and manage your job applications"
      actions={actions}
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center">
              <BriefcaseIcon className="w-8 h-8 text-violet-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Applications</p>
                <p className="text-2xl font-semibold text-gray-900">{applications.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center">
              <ClockIcon className="w-8 h-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">In Progress</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {applications.filter(app => 
                    ['applied', 'under_review', 'phone_screening', 'technical_interview', 'final_interview'].includes(app.status)
                  ).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center">
              <CheckCircleIcon className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Offers</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {applications.filter(app => ['offer_extended', 'hired'].includes(app.status)).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center">
              <XCircleIcon className="w-8 h-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Rejected</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {applications.filter(app => app.status === 'rejected').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {filteredApplications.map((application) => (
            <div key={application.id} className="bg-white rounded-sm shadow border-l-4 border-l-violet-500 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-violet-600 rounded-sm flex items-center justify-center">
                        <BuildingOfficeIcon className="w-8 h-8 text-white" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">{application.jobTitle}</h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(application.status)}`}>
                            {getStatusIcon(application.status)}
                            <span className="ml-1 capitalize">{application.status.replace('_', ' ')}</span>
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getJobTypeColor(application.jobType)}`}>
                            {application.jobType.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(application.priority)}`}>
                            {application.priority.toUpperCase()}
                          </span>
                        </div>
                        
                        <p className="text-lg text-gold-600 font-medium">{application.company}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center">
                            <MapPinIcon className="w-4 h-4 mr-1" />
                            {application.location}
                          </span>
                          <span className="flex items-center">
                            <CalendarIcon className="w-4 h-4 mr-1" />
                            Applied {getDaysAgo(application.appliedDate)}
                          </span>
                          <span className="flex items-center">
                            <ClockIcon className="w-4 h-4 mr-1" />
                            Updated {getDaysAgo(application.lastUpdated)}
                          </span>
                          {application.salaryRange && (
                            <span className="flex items-center">
                              <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                              R{application.salaryRange.min.toLocaleString()} - R{application.salaryRange.max.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Current Stage: {application.currentStage}</p>
                      <div className="bg-gray-100 rounded-full h-2">
                        <div 
                          className="bg-gold-500 h-2 rounded-full transition-all" 
                          style={{ 
                            width: `${
                              application.status === 'applied' ? 20 :
                              application.status === 'under_review' ? 30 :
                              application.status === 'phone_screening' ? 40 :
                              application.status === 'technical_interview' ? 60 :
                              application.status === 'final_interview' ? 80 :
                              ['offer_extended', 'hired'].includes(application.status) ? 100 :
                              application.status === 'rejected' ? 100 : 20
                            }%` 
                          }}
                        ></div>
                      </div>
                    </div>

                    {application.interviewScheduled && (
                      <div className="mt-4 p-3 bg-gold-50 border border-violet-200 rounded-sm">
                        <div className="flex items-center">
                          <CalendarIcon className="w-5 h-5 text-gold-600 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-violet-800">
                              {application.interviewScheduled.type.toUpperCase()} Interview Scheduled
                            </p>
                            <p className="text-sm text-gold-600">
                              {new Date(application.interviewScheduled.date).toLocaleDateString()} at {application.interviewScheduled.time}
                            </p>
                            <p className="text-xs text-violet-500">
                              Interviewers: {application.interviewScheduled.interviewers.join(', ')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {application.feedback && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-sm">
                        <h4 className="text-sm font-medium text-green-800 mb-1">Feedback</h4>
                        <p className="text-sm text-green-700">{application.feedback}</p>
                      </div>
                    )}

                    {application.nextSteps && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-sm">
                        <h4 className="text-sm font-medium text-yellow-800 mb-1">Next Steps</h4>
                        <p className="text-sm text-yellow-700">{application.nextSteps}</p>
                      </div>
                    )}

                    {application.rejectionReason && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-sm">
                        <h4 className="text-sm font-medium text-red-800 mb-1">Feedback</h4>
                        <p className="text-sm text-red-700">{application.rejectionReason}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2 ml-6">
                    <button
                      onClick={() => setSelectedApplication(application)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <EyeIcon className="w-4 h-4 mr-2" />
                      View Details
                    </button>
                    
                    {application.status === 'offer_extended' && (
                      <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-green-600 hover:bg-green-700">
                        <CheckCircleIcon className="w-4 h-4 mr-2" />
                        View Offer
                      </button>
                    )}
                    
                    {['applied', 'under_review', 'phone_screening', 'technical_interview', 'final_interview'].includes(application.status) && (
                      <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50">
                        <XCircleIcon className="w-4 h-4 mr-2" />
                        Withdraw
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredApplications.length === 0 && (
          <EmptyState
            icon={BriefcaseIcon}
            title="No applications found"
            description={
              filterStatus === 'all'
                ? searchTerm
                  ? `No applications found for "${searchTerm}"`
                  : "You haven't submitted any job applications yet."
                : `No applications with status "${filterStatus}" found.`
            }
          />
        )}

        {/* Application Details Modal */}
        {selectedApplication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-sm shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedApplication.jobTitle}</h2>
                    <p className="text-lg text-gold-600 font-medium mt-1">{selectedApplication.company}</p>
                    <p className="text-sm text-gray-600 mt-1">{selectedApplication.department} • {selectedApplication.location}</p>
                  </div>
                  <button
                    onClick={() => setSelectedApplication(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircleIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Application Timeline</h3>
                      <div className="space-y-4">
                        {selectedApplication.timeline.map((event, _index) => (
                          <div key={event.id} className="flex space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-gold-100 rounded-full flex items-center justify-center">
                                <div className="w-3 h-3 bg-violet-600 rounded-full"></div>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-gray-900">
                                <strong>{event.stage}</strong>
                              </div>
                              <div className="text-sm text-gray-600">{event.description}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {new Date(event.date).toLocaleDateString()} at {new Date(event.date).toLocaleTimeString()}
                              </div>
                              {event.notes && (
                                <div className="text-xs text-gold-600 mt-1 italic">{event.notes}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Documents</h3>
                      <div className="space-y-2">
                        {selectedApplication.documents.map((doc, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-sm">
                            <div className="flex items-center">
                              <DocumentTextIcon className="w-5 h-5 text-violet-500 mr-3" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                                <p className="text-xs text-gray-500">
                                  {doc.type} • Uploaded {new Date(doc.uploadedDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <button className="text-gold-600 hover:text-gold-800 rounded-full">
                              <EyeIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Details</h3>
                      <div className="bg-gray-50 rounded-sm p-4 space-y-3">
                        <div className="flex justify-between">
                          <span className="font-medium">Position:</span>
                          <span>{selectedApplication.jobTitle}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Department:</span>
                          <span>{selectedApplication.department}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Location:</span>
                          <span>{selectedApplication.location}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Job Type:</span>
                          <span className="capitalize">{selectedApplication.jobType.replace('_', ' ')}</span>
                        </div>
                        {selectedApplication.salaryRange && (
                          <div className="flex justify-between">
                            <span className="font-medium">Salary Range:</span>
                            <span>R{selectedApplication.salaryRange.min.toLocaleString()} - R{selectedApplication.salaryRange.max.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Description</h3>
                      <p className="text-sm text-gray-700">{selectedApplication.jobDescription}</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h3>
                      <ul className="space-y-1">
                        {selectedApplication.requirements.map((req, index) => (
                          <li key={index} className="flex items-start text-sm text-gray-700">
                            <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Benefits</h3>
                      <ul className="space-y-1">
                        {selectedApplication.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-start text-sm text-gray-700">
                            <CheckCircleIcon className="w-4 h-4 text-violet-500 mr-2 mt-0.5 flex-shrink-0" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {selectedApplication.contactPerson && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Person</h3>
                        <div className="bg-gray-50 rounded-sm p-4">
                          <p className="font-medium">{selectedApplication.contactPerson.name}</p>
                          <p className="text-sm text-gray-600">{selectedApplication.contactPerson.title}</p>
                          <p className="text-sm text-gray-600">{selectedApplication.contactPerson.email}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end mt-6 pt-6 border-t space-x-3">
                  <button
                    onClick={() => setSelectedApplication(null)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-full hover:bg-gray-700"
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
