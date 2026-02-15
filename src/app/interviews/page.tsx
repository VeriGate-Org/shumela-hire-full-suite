'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import InterviewScheduler from '@/components/InterviewScheduler';
import InterviewCalendar from '@/components/InterviewCalendar';
import InterviewFeedbackForm from '@/components/InterviewFeedbackForm';

interface Interview {
  id: number;
  title: string;
  type: string;
  typeDisplayName: string;
  round: string;
  roundDisplayName: string;
  status: string;
  statusDisplayName: string;
  scheduledAt: string;
  durationMinutes: number;
  location?: string;
  meetingLink?: string;
  phoneNumber?: string;
  meetingRoom?: string;
  instructions?: string;
  agenda?: string;
  interviewerId: number;
  additionalInterviewers?: string;
  feedback?: string;
  rating?: number;
  communicationSkills?: number;
  technicalSkills?: number;
  culturalFit?: number;
  overallImpression?: string;
  recommendation?: string;
  recommendationDisplayName?: string;
  nextSteps?: string;
  technicalAssessment?: string;
  candidateQuestions?: string;
  interviewerNotes?: string;
  rescheduledFrom?: string;
  rescheduleReason?: string;
  rescheduleCount: number;
  reminderSentAt?: string;
  feedbackRequestedAt?: string;
  feedbackSubmittedAt?: string;
  createdBy: number;
  createdAt: string;
  updatedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  canBeRescheduled: boolean;
  canBeCancelled: boolean;
  canBeStarted: boolean;
  canBeCompleted: boolean;
  requiresFeedback: boolean;
  isOverdue: boolean;
  isUpcoming: boolean;
  application: {
    id: number;
    applicant: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
    };
    jobPosting: {
      id: number;
      title: string;
      department: string;
    };
  };
}

export default function InterviewsPage() {
  const [view, setView] = useState<'calendar' | 'schedule' | 'feedback' | 'list'>('calendar');
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  useEffect(() => {
    if (view === 'list' || view === 'calendar') {
      loadInterviews();
    }
  }, [view]);

  const loadInterviews = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/interviews');
      if (response.ok) {
        const data = await response.json();
        setInterviews(data.content || data);
      }
    } catch (error) {
      console.error('Error loading interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInterviewScheduled = (interview: Interview) => {
    console.log('Interview scheduled:', interview);
    setView('calendar');
    loadInterviews();
  };

  const handleInterviewUpdated = (interviewId: number, updatedInterview: any) => {
    setInterviews(prev => prev.map(interview => 
      interview.id === interviewId ? updatedInterview : interview
    ));
    loadInterviews(); // Refresh to get updated data
  };

  const handleFeedbackSubmitted = (interviewId: number) => {
    console.log('Feedback submitted for interview:', interviewId);
    setView('calendar');
    loadInterviews();
  };

  const handleInterviewSelect = (interview: any) => {
    setSelectedInterview(interview);
  };

  const filteredInterviews = interviews.filter(interview => {
    const matchesSearch = !searchTerm || 
      interview.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interview.application.applicant.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interview.application.applicant.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interview.application.jobPosting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interview.application.jobPosting.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || interview.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || interview.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusOptions = () => {
    const statuses = [...new Set(interviews.map(interview => interview.status))];
    return statuses;
  };

  const getTypeOptions = () => {
    const types = [...new Set(interviews.map(interview => interview.type))];
    return types;
  };

  const getUpcomingInterviews = () => {
    return interviews.filter(interview => interview.isUpcoming).slice(0, 5);
  };

  const getOverdueInterviews = () => {
    return interviews.filter(interview => interview.isOverdue);
  };

  const getPendingFeedback = () => {
    return interviews.filter(interview => interview.requiresFeedback);
  };

  const getPageTitle = () => {
    switch (view) {
      case 'calendar': return 'Interview Calendar';
      case 'schedule': return 'Schedule Interview';
      case 'feedback': return 'Interview Feedback';
      default: return 'Interview Management';
    }
  };

  const getPageSubtitle = () => {
    switch (view) {
      case 'calendar': return 'View and manage all scheduled interviews in calendar format';
      case 'schedule': return 'Schedule new interviews with candidates and set up logistics';
      case 'feedback': return 'Provide feedback and ratings for completed interviews';
      default: return 'Comprehensive interview scheduling, calendar management, and feedback collection';
    }
  };

  return (
    <PageWrapper
      title={getPageTitle()}
      subtitle={getPageSubtitle()}
    >
      <div className="space-y-6">{/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setView('calendar')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                view === 'calendar'
                  ? 'border-violet-500 text-violet-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📅 Calendar View
            </button>
            <button
              onClick={() => setView('schedule')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                view === 'schedule'
                  ? 'border-violet-500 text-violet-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ➕ Schedule Interview
            </button>
            <button
              onClick={() => setView('list')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                view === 'list'
                  ? 'border-violet-500 text-violet-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📋 List View
            </button>
          </nav>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-violet-50 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-2xl mr-3">📅</span>
              <div>
                <p className="text-sm font-medium text-violet-900">Upcoming</p>
                <p className="text-lg font-bold text-violet-600">{getUpcomingInterviews().length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-2xl mr-3">⏰</span>
              <div>
                <p className="text-sm font-medium text-red-900">Overdue</p>
                <p className="text-lg font-bold text-red-600">{getOverdueInterviews().length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-2xl mr-3">💬</span>
              <div>
                <p className="text-sm font-medium text-yellow-900">Pending Feedback</p>
                <p className="text-lg font-bold text-yellow-600">{getPendingFeedback().length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-2xl mr-3">📊</span>
              <div>
                <p className="text-sm font-medium text-green-900">Total Interviews</p>
                <p className="text-lg font-bold text-green-600">{interviews.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar View */}
        {view === 'calendar' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Interview Calendar</h2>
              <button
                onClick={() => setView('schedule')}
                className="px-4 py-2 bg-violet-500 text-white rounded-md hover:bg-violet-600"
              >
                Schedule New Interview
              </button>
            </div>
            
            <InterviewCalendar 
              interviews={interviews}
              onInterviewSelect={handleInterviewSelect}
              onInterviewUpdate={handleInterviewUpdated}
            />
          </div>
        )}

        {/* Schedule Interview */}
        {view === 'schedule' && (
          <div>
            <div className="mb-4">
              <button
                onClick={() => setView('calendar')}
                className="text-violet-500 hover:text-violet-700 font-medium"
              >
                ← Back to Calendar
              </button>
            </div>
            
            <InterviewScheduler
              onSuccess={handleInterviewScheduled}
              onCancel={() => setView('calendar')}
            />
          </div>
        )}

        {/* Feedback Form */}
        {view === 'feedback' && selectedInterview && (
          <div>
            <div className="mb-4">
              <button
                onClick={() => setView('calendar')}
                className="text-violet-500 hover:text-violet-700 font-medium"
              >
                ← Back to Calendar
              </button>
            </div>
            
            <InterviewFeedbackForm
              interview={selectedInterview}
              onSuccess={handleFeedbackSubmitted}
              onCancel={() => setView('calendar')}
            />
          </div>
        )}

        {/* List View */}
        {view === 'list' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">All Interviews</h2>
              <button
                onClick={() => setView('schedule')}
                className="px-4 py-2 bg-violet-500 text-white rounded-md hover:bg-violet-600"
              >
                Schedule New Interview
              </button>
            </div>

            {/* Search and Filter */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search Interviews
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by title, candidate, or job..."
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filter by Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
                  >
                    <option value="ALL">All Statuses</option>
                    {getStatusOptions().map(status => (
                      <option key={status} value={status}>{status.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filter by Type
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
                  >
                    <option value="ALL">All Types</option>
                    {getTypeOptions().map(type => (
                      <option key={type} value={type}>{type.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Interviews List */}
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredInterviews.length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-8 text-center">
                    <p className="text-gray-600 mb-4">
                      {interviews.length === 0 ? 
                        'No interviews found. This is a demo of the Interview Scheduling System.' :
                        'No interviews match your search criteria.'
                      }
                    </p>
                    
                    {interviews.length === 0 && (
                      <div className="space-y-4">
                        <div className="border rounded-lg p-4 text-left">
                          <h3 className="font-medium text-lg mb-2">Feature Overview</h3>
                          <ul className="list-disc list-inside space-y-1 text-gray-600">
                            <li>Complete interview scheduling with calendar integration</li>
                            <li>Conflict detection and availability checking</li>
                            <li>Multiple interview types and rounds support</li>
                            <li>Comprehensive feedback and rating system</li>
                            <li>Automated reminders and notifications</li>
                            <li>Real-time status tracking and workflow management</li>
                            <li>Advanced search and filtering capabilities</li>
                            <li>Analytics and reporting dashboard</li>
                          </ul>
                        </div>
                        
                        <button
                          onClick={() => setView('schedule')}
                          className="px-4 py-2 bg-violet-500 text-white rounded-md hover:bg-violet-600"
                        >
                          Try Demo Interview Scheduler
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  filteredInterviews.map((interview) => (
                    <div key={interview.id} className="bg-white rounded-lg shadow p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-900">{interview.title}</h3>
                            {interview.isUpcoming && (
                              <span className="bg-violet-100 text-violet-800 text-xs font-medium px-2 py-1 rounded">
                                📅 Upcoming
                              </span>
                            )}
                            {interview.isOverdue && (
                              <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded">
                                ⏰ Overdue
                              </span>
                            )}
                            {interview.requiresFeedback && (
                              <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded">
                                💬 Feedback Needed
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <p><strong>Candidate:</strong> {interview.application.applicant.firstName} {interview.application.applicant.lastName}</p>
                              <p><strong>Position:</strong> {interview.application.jobPosting.title}</p>
                              <p><strong>Type:</strong> {interview.typeDisplayName}</p>
                            </div>
                            <div>
                              <p><strong>Round:</strong> {interview.roundDisplayName}</p>
                              <p><strong>Date:</strong> {new Date(interview.scheduledAt).toLocaleDateString()}</p>
                              <p><strong>Time:</strong> {new Date(interview.scheduledAt).toLocaleTimeString()}</p>
                            </div>
                          </div>
                          
                          {interview.location && (
                            <p className="text-sm text-gray-500 mt-2">
                              📍 {interview.location}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                            interview.status === 'SCHEDULED' ? 'bg-violet-100 text-violet-800' :
                            interview.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                            interview.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {interview.statusDisplayName}
                          </span>
                          
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setSelectedInterview(interview);
                                setView('schedule');
                              }}
                              className="text-violet-600 hover:text-violet-800 text-sm font-medium"
                            >
                              Edit
                            </button>
                            
                            {interview.requiresFeedback && (
                              <button
                                onClick={() => {
                                  setSelectedInterview(interview);
                                  setView('feedback');
                                }}
                                className="text-green-600 hover:text-green-800 text-sm font-medium"
                              >
                                Add Feedback
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}