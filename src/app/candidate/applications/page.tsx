'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { 
  BriefcaseIcon,
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ArrowRightIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
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

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'company' | 'status'>('date');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    
    // Mock application data
    const mockApplications: Application[] = [
      {
        id: 'app_001',
        jobTitle: 'Senior Software Engineer',
        company: 'Google',
        department: 'Engineering',
        location: 'Mountain View, CA',
        jobType: 'full_time',
        appliedDate: '2025-01-20T09:00:00Z',
        lastUpdated: '2025-01-22T14:30:00Z',
        status: 'technical_interview',
        currentStage: 'Technical Interview Scheduled',
        applicationSource: 'company_website',
        salaryRange: {
          min: 180000,
          max: 250000,
          currency: 'ZAR'
        },
        priority: 'high',
        timeline: [
          {
            id: 'timeline_001',
            date: '2025-01-20T09:00:00Z',
            stage: 'Applied',
            description: 'Application submitted successfully'
          },
          {
            id: 'timeline_002',
            date: '2025-01-21T11:30:00Z',
            stage: 'Under Review',
            description: 'Application is being reviewed by hiring team'
          },
          {
            id: 'timeline_003',
            date: '2025-01-22T14:30:00Z',
            stage: 'Phone Screening Completed',
            description: 'Initial phone screening with recruiter completed',
            notes: 'Great conversation about background and interest in the role'
          },
          {
            id: 'timeline_004',
            date: '2025-01-22T16:00:00Z',
            stage: 'Technical Interview Scheduled',
            description: 'Technical interview scheduled for January 25th'
          }
        ],
        documents: [
          { name: 'Resume_Sarah_Johnson.pdf', type: 'Resume', uploadedDate: '2025-01-20T09:00:00Z' },
          { name: 'Cover_Letter_Google.pdf', type: 'Cover Letter', uploadedDate: '2025-01-20T09:00:00Z' }
        ],
        jobDescription: 'We are looking for a Senior Software Engineer to join our team working on next-generation search technologies. You will be responsible for designing and implementing scalable systems that serve billions of users worldwide.',
        requirements: [
          '5+ years of software development experience',
          'Strong proficiency in Python, Java, or C++',
          'Experience with distributed systems',
          'BS/MS in Computer Science or related field'
        ],
        benefits: [
          'Comprehensive health insurance',
          'Stock options',
          '20% time for personal projects',
          'Free meals and snacks',
          'Gym membership'
        ],
        contactPerson: {
          name: 'Alex Chen',
          title: 'Senior Technical Recruiter',
          email: 'alex.chen@google.com'
        },
        interviewScheduled: {
          date: '2025-01-25',
          time: '14:00',
          type: 'video',
          interviewers: ['Sarah Martinez - Engineering Manager', 'Mike Wilson - Senior Engineer']
        },
        nextSteps: 'Technical interview scheduled for January 25th. Prepare for coding questions and system design.'
      },
      {
        id: 'app_002',
        jobTitle: 'Principal Software Engineer',
        company: 'Meta',
        department: 'Infrastructure',
        location: 'Menlo Park, CA',
        jobType: 'full_time',
        appliedDate: '2025-01-18T11:30:00Z',
        lastUpdated: '2025-01-19T10:15:00Z',
        status: 'under_review',
        currentStage: 'Application Review',
        applicationSource: 'linkedin',
        salaryRange: {
          min: 200000,
          max: 280000,
          currency: 'ZAR'
        },
        priority: 'high',
        timeline: [
          {
            id: 'timeline_005',
            date: '2025-01-18T11:30:00Z',
            stage: 'Applied',
            description: 'Application submitted via LinkedIn'
          },
          {
            id: 'timeline_006',
            date: '2025-01-19T10:15:00Z',
            stage: 'Under Review',
            description: 'Application is being reviewed by hiring team'
          }
        ],
        documents: [
          { name: 'Resume_Sarah_Johnson.pdf', type: 'Resume', uploadedDate: '2025-01-18T11:30:00Z' },
          { name: 'Portfolio_Link.txt', type: 'Portfolio', uploadedDate: '2025-01-18T11:30:00Z' }
        ],
        jobDescription: 'Join our Infrastructure team to build and scale systems that support billions of users. You will work on distributed systems, data infrastructure, and performance optimization.',
        requirements: [
          '8+ years of software engineering experience',
          'Experience with large-scale distributed systems',
          'Strong background in system design',
          'Leadership experience preferred'
        ],
        benefits: [
          'Comprehensive health coverage',
          'Equity compensation',
          'Unlimited PTO',
          'Professional development budget',
          'Remote work options'
        ],
        contactPerson: {
          name: 'Jennifer Liu',
          title: 'Engineering Recruiter',
          email: 'jennifer.liu@meta.com'
        }
      },
      {
        id: 'app_003',
        jobTitle: 'Staff Software Engineer',
        company: 'Netflix',
        department: 'Platform Engineering',
        location: 'Los Gatos, CA',
        jobType: 'full_time',
        appliedDate: '2025-01-15T16:45:00Z',
        lastUpdated: '2025-01-21T09:20:00Z',
        status: 'offer_extended',
        currentStage: 'Offer Extended',
        applicationSource: 'referral',
        salaryRange: {
          min: 220000,
          max: 300000,
          currency: 'ZAR'
        },
        priority: 'high',
        timeline: [
          {
            id: 'timeline_007',
            date: '2025-01-15T16:45:00Z',
            stage: 'Applied',
            description: 'Application submitted through employee referral'
          },
          {
            id: 'timeline_008',
            date: '2025-01-16T10:30:00Z',
            stage: 'Phone Screening',
            description: 'Initial phone screening completed'
          },
          {
            id: 'timeline_009',
            date: '2025-01-18T14:00:00Z',
            stage: 'Technical Interview',
            description: 'Technical interview completed successfully'
          },
          {
            id: 'timeline_010',
            date: '2025-01-20T11:00:00Z',
            stage: 'Final Interview',
            description: 'Final interview with VP of Engineering completed'
          },
          {
            id: 'timeline_011',
            date: '2025-01-21T09:20:00Z',
            stage: 'Offer Extended',
            description: 'Offer letter sent with competitive compensation package'
          }
        ],
        documents: [
          { name: 'Resume_Sarah_Johnson.pdf', type: 'Resume', uploadedDate: '2025-01-15T16:45:00Z' },
          { name: 'Technical_Portfolio.pdf', type: 'Portfolio', uploadedDate: '2025-01-15T16:45:00Z' }
        ],
        jobDescription: 'Lead the development of our streaming platform infrastructure. Work on cutting-edge technologies that deliver content to millions of users globally.',
        requirements: [
          '10+ years of software engineering experience',
          'Expertise in streaming technologies',
          'Strong leadership and mentoring skills',
          'Experience with microservices architecture'
        ],
        benefits: [
          'Top-tier health insurance',
          'Significant equity package',
          'Flexible PTO',
          'Learning and development budget',
          'Free Netflix subscription'
        ],
        feedback: 'Excellent technical skills and leadership experience. Strong cultural fit. All interviewers recommend moving forward.',
        nextSteps: 'Offer extended. Please review and let us know your decision by January 28th.',
        contactPerson: {
          name: 'David Park',
          title: 'VP of Engineering',
          email: 'david.park@netflix.com'
        }
      },
      {
        id: 'app_004',
        jobTitle: 'Software Engineer II',
        company: 'Spotify',
        department: 'Music Discovery',
        location: 'New York, NY',
        jobType: 'full_time',
        appliedDate: '2025-01-10T14:20:00Z',
        lastUpdated: '2025-01-16T13:45:00Z',
        status: 'rejected',
        currentStage: 'Application Rejected',
        applicationSource: 'indeed',
        salaryRange: {
          min: 120000,
          max: 160000,
          currency: 'ZAR'
        },
        priority: 'medium',
        timeline: [
          {
            id: 'timeline_012',
            date: '2025-01-10T14:20:00Z',
            stage: 'Applied',
            description: 'Application submitted via Indeed'
          },
          {
            id: 'timeline_013',
            date: '2025-01-12T09:15:00Z',
            stage: 'Under Review',
            description: 'Application under review by hiring team'
          },
          {
            id: 'timeline_014',
            date: '2025-01-14T11:30:00Z',
            stage: 'Phone Screening',
            description: 'Phone screening with recruiter'
          },
          {
            id: 'timeline_015',
            date: '2025-01-16T13:45:00Z',
            stage: 'Application Rejected',
            description: 'Application was not selected to move forward'
          }
        ],
        documents: [
          { name: 'Resume_Sarah_Johnson.pdf', type: 'Resume', uploadedDate: '2025-01-10T14:20:00Z' }
        ],
        jobDescription: 'Join our Music Discovery team to build recommendation algorithms that help users find their next favorite song.',
        requirements: [
          '3+ years of software development experience',
          'Experience with recommendation systems',
          'Strong Python and machine learning skills',
          'Passion for music and technology'
        ],
        benefits: [
          'Health insurance',
          'Spotify Premium',
          'Flexible working hours',
          'Professional development opportunities'
        ],
        rejectionReason: 'While your background is impressive, we decided to move forward with candidates who have more specific experience in music recommendation algorithms.',
        contactPerson: {
          name: 'Emma Rodriguez',
          title: 'Technical Recruiter',
          email: 'emma.rodriguez@spotify.com'
        }
      },
      {
        id: 'app_005',
        jobTitle: 'Senior Full Stack Developer',
        company: 'Airbnb',
        department: 'Host Platform',
        location: 'San Francisco, CA',
        jobType: 'full_time',
        appliedDate: '2025-01-08T10:00:00Z',
        lastUpdated: '2025-01-12T15:30:00Z',
        status: 'phone_screening',
        currentStage: 'Phone Screening Scheduled',
        applicationSource: 'direct_application',
        salaryRange: {
          min: 150000,
          max: 200000,
          currency: 'ZAR'
        },
        priority: 'medium',
        timeline: [
          {
            id: 'timeline_016',
            date: '2025-01-08T10:00:00Z',
            stage: 'Applied',
            description: 'Direct application submitted'
          },
          {
            id: 'timeline_017',
            date: '2025-01-10T14:20:00Z',
            stage: 'Under Review',
            description: 'Application being reviewed'
          },
          {
            id: 'timeline_018',
            date: '2025-01-12T15:30:00Z',
            stage: 'Phone Screening Scheduled',
            description: 'Phone screening scheduled for January 26th'
          }
        ],
        documents: [
          { name: 'Resume_Sarah_Johnson.pdf', type: 'Resume', uploadedDate: '2025-01-08T10:00:00Z' },
          { name: 'Cover_Letter_Airbnb.pdf', type: 'Cover Letter', uploadedDate: '2025-01-08T10:00:00Z' }
        ],
        jobDescription: 'Help build the platform that connects millions of hosts with guests around the world. Work on full-stack features that impact the host experience.',
        requirements: [
          '5+ years of full-stack development experience',
          'React and Node.js expertise',
          'Experience with scalable web applications',
          'Strong problem-solving skills'
        ],
        benefits: [
          'Health, dental, and vision insurance',
          'Annual travel stipend',
          'Equity participation',
          'Flexible work arrangements',
          'Professional development budget'
        ],
        interviewScheduled: {
          date: '2025-01-26',
          time: '10:00',
          type: 'phone',
          interviewers: ['Lisa Chen - Engineering Manager']
        },
        contactPerson: {
          name: 'Michael Torres',
          title: 'Senior Recruiter',
          email: 'michael.torres@airbnb.com'
        }
      }
    ];

    // Simulate loading delay
    setTimeout(() => {
      setApplications(mockApplications);
      setLoading(false);
    }, 800);
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
      case 'applied': return 'bg-violet-100 text-violet-800 border-violet-300';
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
      case 'full_time': return 'bg-violet-100 text-violet-800';
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
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
        />
      </div>
      
      <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
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
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
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
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-violet-500"></div>
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
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <BriefcaseIcon className="w-8 h-8 text-violet-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Applications</p>
                <p className="text-2xl font-semibold text-gray-900">{applications.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
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
          
          <div className="bg-white rounded-lg shadow p-6">
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
          
          <div className="bg-white rounded-lg shadow p-6">
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
            <div key={application.id} className="bg-white rounded-lg shadow border-l-4 border-l-violet-500 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-violet-700 rounded-lg flex items-center justify-center">
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
                        
                        <p className="text-lg text-violet-600 font-medium">{application.company}</p>
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
                          className="bg-violet-500 h-2 rounded-full transition-all" 
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
                      <div className="mt-4 p-3 bg-violet-50 border border-violet-200 rounded-lg">
                        <div className="flex items-center">
                          <CalendarIcon className="w-5 h-5 text-violet-600 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-violet-800">
                              {application.interviewScheduled.type.toUpperCase()} Interview Scheduled
                            </p>
                            <p className="text-sm text-violet-600">
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
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="text-sm font-medium text-green-800 mb-1">Feedback</h4>
                        <p className="text-sm text-green-700">{application.feedback}</p>
                      </div>
                    )}

                    {application.nextSteps && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h4 className="text-sm font-medium text-yellow-800 mb-1">Next Steps</h4>
                        <p className="text-sm text-yellow-700">{application.nextSteps}</p>
                      </div>
                    )}

                    {application.rejectionReason && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <h4 className="text-sm font-medium text-red-800 mb-1">Feedback</h4>
                        <p className="text-sm text-red-700">{application.rejectionReason}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2 ml-6">
                    <button
                      onClick={() => setSelectedApplication(application)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <EyeIcon className="w-4 h-4 mr-2" />
                      View Details
                    </button>
                    
                    {application.status === 'offer_extended' && (
                      <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
                        <CheckCircleIcon className="w-4 h-4 mr-2" />
                        View Offer
                      </button>
                    )}
                    
                    {['applied', 'under_review', 'phone_screening', 'technical_interview', 'final_interview'].includes(application.status) && (
                      <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
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
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <BriefcaseIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
            <p className="text-gray-600">
              {filterStatus === 'all' 
                ? searchTerm 
                  ? `No applications found for "${searchTerm}"`
                  : "You haven't submitted any job applications yet."
                : `No applications with status "${filterStatus}" found.`
              }
            </p>
          </div>
        )}

        {/* Application Details Modal */}
        {selectedApplication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedApplication.jobTitle}</h2>
                    <p className="text-lg text-violet-600 font-medium mt-1">{selectedApplication.company}</p>
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
                        {selectedApplication.timeline.map((event, index) => (
                          <div key={event.id} className="flex space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center">
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
                                <div className="text-xs text-violet-600 mt-1 italic">{event.notes}</div>
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
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                              <DocumentTextIcon className="w-5 h-5 text-violet-500 mr-3" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                                <p className="text-xs text-gray-500">
                                  {doc.type} • Uploaded {new Date(doc.uploadedDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <button className="text-violet-600 hover:text-violet-800">
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
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
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
                        <div className="bg-gray-50 rounded-lg p-4">
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
