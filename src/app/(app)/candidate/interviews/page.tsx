'use client';

import { useState, useEffect, useCallback } from 'react';
import PageWrapper from '@/components/PageWrapper';
import EmptyState from '@/components/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { getApplicantId, getApplications, getInterviewsForApplication } from '@/services/candidateService';
import { 
  CalendarIcon,
  ClockIcon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightIcon,
  EnvelopeIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';

interface Interview {
  id: string;
  jobTitle: string;
  company: string;
  companyLogo?: string;
  interviewType: 'phone' | 'video' | 'in_person' | 'technical' | 'panel' | 'final';
  round: number;
  totalRounds: number;
  scheduledDate: string;
  scheduledTime: string;
  duration: number; // in minutes
  timezone: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show';
  location?: string;
  meetingLink?: string;
  meetingId?: string;
  meetingPassword?: string;
  interviewers: Array<{
    name: string;
    title: string;
    email: string;
    linkedinUrl?: string;
  }>;
  preparationMaterials: Array<{
    name: string;
    type: 'document' | 'link' | 'video';
    url: string;
    description?: string;
  }>;
  notes: string;
  feedback?: string;
  nextSteps?: string;
  contactPerson: {
    name: string;
    email: string;
    phone?: string;
  };
  reminders: Array<{
    type: 'email' | 'sms';
    timeBeforeInterview: number; // in minutes
    sent: boolean;
  }>;
}

interface _CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'interview' | 'preparation' | 'deadline';
  status: string;
}

function mapInterviewType(type: string): Interview['interviewType'] {
  const typeMap: Record<string, Interview['interviewType']> = {
    PHONE: 'phone', PHONE_SCREEN: 'phone',
    VIDEO: 'video', VIDEO_CALL: 'video',
    IN_PERSON: 'in_person', ONSITE: 'in_person',
    TECHNICAL: 'technical', TECHNICAL_ASSESSMENT: 'technical',
    PANEL: 'panel',
    FINAL: 'final', FINAL_ROUND: 'final',
  };
  return typeMap[type] || 'video';
}

function mapInterviewStatus(status: string): Interview['status'] {
  const statusMap: Record<string, Interview['status']> = {
    SCHEDULED: 'scheduled', CONFIRMED: 'confirmed',
    COMPLETED: 'completed', CANCELLED: 'cancelled',
    RESCHEDULED: 'rescheduled', NO_SHOW: 'no_show',
  };
  return statusMap[status] || 'scheduled';
}

export default function InterviewSchedulePage() {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInterviews = useCallback(async () => {
    if (!user?.email) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const applicantId = await getApplicantId(user.email);
      if (!applicantId) { setInterviews([]); return; }
      const apps = await getApplications(applicantId);
      const allInterviews: Interview[] = [];
      const results = await Promise.allSettled(
        apps.map((app: any) => getInterviewsForApplication(app.id))
      );
      results.forEach((result, idx) => {
        if (result.status !== 'fulfilled') return;
        const app = apps[idx];
        result.value.forEach((i: any) => {
          const scheduledAt = i.scheduledAt || i.scheduledDate || '';
          const date = scheduledAt ? new Date(scheduledAt) : new Date();
          allInterviews.push({
            id: i.id,
            jobTitle: app.jobTitle || '',
            company: 'ShumelaHire',
            interviewType: mapInterviewType(i.interviewType || i.type || ''),
            round: i.round || 1,
            totalRounds: i.totalRounds || 1,
            scheduledDate: date.toISOString().split('T')[0],
            scheduledTime: date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }),
            duration: i.durationMinutes || i.duration || 60,
            timezone: 'SAST',
            status: mapInterviewStatus(i.status || ''),
            location: i.location || undefined,
            meetingLink: i.meetingLink || undefined,
            interviewers: (i.interviewers || []).map((int: any) => ({
              name: int.name || `${int.firstName || ''} ${int.lastName || ''}`.trim(),
              title: int.title || int.role || '',
              email: int.email || '',
            })),
            preparationMaterials: [],
            notes: i.instructions || i.notes || '',
            feedback: i.feedback || undefined,
            contactPerson: {
              name: i.organizerName || '',
              email: i.organizerEmail || '',
            },
            reminders: [],
          });
        });
      });
      setInterviews(allInterviews);
    } catch (err) {
      console.error('Failed to load interviews:', err);
      setError('Failed to load interviews. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadInterviews();
  }, [user, loadInterviews]);

  const filteredInterviews = interviews.filter(interview => {
    const now = new Date();
    const interviewDateTime = new Date(`${interview.scheduledDate} ${interview.scheduledTime}`);
    
    switch (filterStatus) {
      case 'upcoming':
        return interviewDateTime > now && ['scheduled', 'confirmed'].includes(interview.status);
      case 'completed':
        return interview.status === 'completed';
      case 'cancelled':
        return ['cancelled', 'no_show', 'rescheduled'].includes(interview.status);
      default:
        return true;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-300';
      case 'scheduled': return 'bg-gold-100 text-gold-800 border-violet-300';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
      case 'rescheduled': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'no_show': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircleIcon className="w-4 h-4" />;
      case 'scheduled': return <CalendarIcon className="w-4 h-4" />;
      case 'completed': return <CheckCircleIcon className="w-4 h-4" />;
      case 'cancelled': return <XCircleIcon className="w-4 h-4" />;
      case 'rescheduled': return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'no_show': return <XCircleIcon className="w-4 h-4" />;
      default: return <CalendarIcon className="w-4 h-4" />;
    }
  };

  const getInterviewTypeColor = (type: string) => {
    switch (type) {
      case 'phone': return 'bg-gold-100 text-gold-800';
      case 'video': return 'bg-purple-100 text-purple-800';
      case 'in_person': return 'bg-green-100 text-green-800';
      case 'technical': return 'bg-orange-100 text-orange-800';
      case 'panel': return 'bg-red-100 text-red-800';
      case 'final': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInterviewTypeIcon = (type: string) => {
    switch (type) {
      case 'phone': return <PhoneIcon className="w-4 h-4" />;
      case 'video': return <VideoCameraIcon className="w-4 h-4" />;
      case 'in_person': return <MapPinIcon className="w-4 h-4" />;
      case 'technical': return <DocumentTextIcon className="w-4 h-4" />;
      case 'panel': return <UserIcon className="w-4 h-4" />;
      case 'final': return <CheckCircleIcon className="w-4 h-4" />;
      default: return <CalendarIcon className="w-4 h-4" />;
    }
  };

  const isUpcoming = (interview: Interview) => {
    const now = new Date();
    const interviewDateTime = new Date(`${interview.scheduledDate} ${interview.scheduledTime}`);
    return interviewDateTime > now;
  };

  const getTimeUntilInterview = (interview: Interview) => {
    const now = new Date();
    const interviewDateTime = new Date(`${interview.scheduledDate} ${interview.scheduledTime}`);
    const diffMs = interviewDateTime.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} days`;
    } else if (diffHours > 0) {
      return `${diffHours} hours`;
    } else {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return diffMins > 0 ? `${diffMins} minutes` : 'Now';
    }
  };

  const actions = (
    <div className="flex items-center gap-3">
      <div className="flex rounded-sm border border-gray-300">
        <button
          onClick={() => setViewMode('list')}
          className={`px-3 py-2 text-sm font-medium rounded-l-lg ${
            viewMode === 'list'
              ? 'bg-gold-500 text-violet-950'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          List
        </button>
        <button
          onClick={() => setViewMode('calendar')}
          className={`px-3 py-2 text-sm font-medium rounded-r-lg ${
            viewMode === 'calendar'
              ? 'bg-gold-500 text-violet-950'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          Calendar
        </button>
      </div>
      
      <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value as any)}
        className="px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
      >
        <option value="all">All Interviews</option>
        <option value="upcoming">Upcoming</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </div>
  );

  if (loading) {
    return (
      <PageWrapper title="Interview Schedule" subtitle="Loading your interviews..." actions={actions}>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gold-500"></div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Interview Schedule"
      subtitle="Manage your upcoming and past interviews"
      actions={actions}
    >
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center">
              <CalendarIcon className="w-8 h-8 text-violet-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Interviews</p>
                <p className="text-2xl font-semibold text-gray-900">{interviews.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center">
              <ClockIcon className="w-8 h-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Upcoming</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {interviews.filter(i => isUpcoming(i) && ['scheduled', 'confirmed'].includes(i.status)).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center">
              <CheckCircleIcon className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {interviews.filter(i => i.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Cancelled</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {interviews.filter(i => ['cancelled', 'no_show', 'rescheduled'].includes(i.status)).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-sm p-4 flex items-center justify-between">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-3" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
            <button
              onClick={() => { setError(null); loadInterviews(); }}
              className="px-3 py-1 text-sm font-medium text-red-700 border border-red-300 rounded-full hover:bg-red-100"
            >
              Retry
            </button>
          </div>
        )}

        {viewMode === 'list' && (
          <div className="space-y-4">
            {filteredInterviews.map((interview) => {
              const upcoming = isUpcoming(interview);
              const timeUntil = upcoming ? getTimeUntilInterview(interview) : null;

              return (
                <div key={interview.id} className="bg-white rounded-sm shadow border-l-4 border-l-violet-500 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start space-x-4">
                          <div className="w-16 h-16 bg-violet-600 rounded-sm flex items-center justify-center">
                            <BriefcaseIcon className="w-8 h-8 text-white" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-xl font-semibold text-gray-900">{interview.jobTitle}</h3>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(interview.status)}`}>
                                {getStatusIcon(interview.status)}
                                <span className="ml-1 capitalize">{interview.status}</span>
                              </span>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getInterviewTypeColor(interview.interviewType)}`}>
                                {getInterviewTypeIcon(interview.interviewType)}
                                <span className="ml-1 capitalize">{interview.interviewType}</span>
                              </span>
                              {upcoming && timeUntil && (
                                <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                                  <ClockIcon className="w-3 h-3 mr-1" />
                                  In {timeUntil}
                                </span>
                              )}
                            </div>
                            
                            <p className="text-lg text-gold-600 font-medium">{interview.company}</p>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                              <span className="flex items-center">
                                <CalendarIcon className="w-4 h-4 mr-1" />
                                {new Date(interview.scheduledDate).toLocaleDateString()}
                              </span>
                              <span className="flex items-center">
                                <ClockIcon className="w-4 h-4 mr-1" />
                                {interview.scheduledTime} {interview.timezone} ({interview.duration} min)
                              </span>
                              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                Round {interview.round} of {interview.totalRounds}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Interviewers</h4>
                            <div className="space-y-1">
                              {interview.interviewers.map((interviewer, index) => (
                                <div key={index} className="text-sm">
                                  <span className="font-medium">{interviewer.name}</span>
                                  <span className="text-gray-500 ml-2">{interviewer.title}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Meeting Details</h4>
                            {interview.meetingLink && (
                              <div className="text-sm space-y-1">
                                <div className="flex items-center">
                                  <VideoCameraIcon className="w-4 h-4 mr-2 text-gray-400" />
                                  <a href={interview.meetingLink} className="text-gold-600 hover:text-gold-800">
                                    Join Video Call
                                  </a>
                                </div>
                                {interview.meetingId && (
                                  <div className="text-gray-600">ID: {interview.meetingId}</div>
                                )}
                              </div>
                            )}
                            {interview.location && (
                              <div className="flex items-center text-sm">
                                <MapPinIcon className="w-4 h-4 mr-2 text-gray-400" />
                                {interview.location}
                              </div>
                            )}
                          </div>
                        </div>

                        {interview.notes && (
                          <div className="mt-4 p-3 bg-gold-50 rounded-sm">
                            <p className="text-sm text-violet-800">{interview.notes}</p>
                          </div>
                        )}

                        {interview.feedback && (
                          <div className="mt-4 p-3 bg-green-50 rounded-sm">
                            <h4 className="text-sm font-medium text-green-800 mb-1">Feedback</h4>
                            <p className="text-sm text-green-700">{interview.feedback}</p>
                            {interview.nextSteps && (
                              <div className="mt-2">
                                <h5 className="text-xs font-medium text-green-800">Next Steps:</h5>
                                <p className="text-xs text-green-600">{interview.nextSteps}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col space-y-2 ml-6">
                        <button
                          onClick={() => setSelectedInterview(interview)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50"
                        >
                          View Details
                        </button>
                        
                        {upcoming && interview.meetingLink && (
                          <a
                            href={interview.meetingLink}
                            className="inline-flex items-center px-3 py-2 bg-transparent border-2 border-gold-500 text-violet-900 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider rounded-full text-sm font-medium text-center"
                          >
                            <VideoCameraIcon className="w-4 h-4 mr-2" />
                            Join Call
                          </a>
                        )}
                        
                        {upcoming && (
                          <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50">
                            <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
                            Reschedule
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {viewMode === 'calendar' && (
          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Calendar View</h3>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
              />
            </div>
            
            {/* Simple calendar implementation */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Interviews for {new Date(selectedDate).toLocaleDateString()}</h4>
              {interviews
                .filter(interview => interview.scheduledDate === selectedDate)
                .map(interview => (
                  <div key={interview.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-sm">
                    <div className="flex-shrink-0">
                      {getInterviewTypeIcon(interview.interviewType)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{interview.jobTitle}</p>
                      <p className="text-sm text-gray-600">{interview.company}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{interview.scheduledTime}</p>
                      <p className="text-xs text-gray-500">{interview.duration} min</p>
                    </div>
                  </div>
                ))}
              {interviews.filter(interview => interview.scheduledDate === selectedDate).length === 0 && (
                <EmptyState
                  icon={CalendarIcon}
                  title="No interviews scheduled"
                  description="No interviews scheduled for this date."
                />
              )}
            </div>
          </div>
        )}

        {filteredInterviews.length === 0 && (
          <EmptyState
            icon={CalendarIcon}
            title="No interviews scheduled"
            description={
              filterStatus === 'all'
                ? "You don't have any interviews scheduled yet."
                : `No ${filterStatus} interviews found.`
            }
          />
        )}

        {/* Interview Details Modal */}
        {selectedInterview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-sm shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedInterview.jobTitle}</h2>
                    <p className="text-lg text-gold-600 font-medium mt-1">{selectedInterview.company}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Round {selectedInterview.round} of {selectedInterview.totalRounds} • {selectedInterview.interviewType}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedInterview(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircleIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Schedule Details</h3>
                      <div className="bg-gray-50 rounded-sm p-4 space-y-3">
                        <div className="flex items-center">
                          <CalendarIcon className="w-5 h-5 text-gray-600 mr-3" />
                          <span>{new Date(selectedInterview.scheduledDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center">
                          <ClockIcon className="w-5 h-5 text-gray-600 mr-3" />
                          <span>{selectedInterview.scheduledTime} {selectedInterview.timezone} ({selectedInterview.duration} minutes)</span>
                        </div>
                        {selectedInterview.location && (
                          <div className="flex items-center">
                            <MapPinIcon className="w-5 h-5 text-gray-600 mr-3" />
                            <span>{selectedInterview.location}</span>
                          </div>
                        )}
                        {selectedInterview.meetingLink && (
                          <div className="flex items-center">
                            <VideoCameraIcon className="w-5 h-5 text-gray-600 mr-3" />
                            <a href={selectedInterview.meetingLink} className="text-gold-600 hover:text-gold-800">
                              Join Video Call
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Interviewers</h3>
                      <div className="space-y-3">
                        {selectedInterview.interviewers.map((interviewer, index) => (
                          <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-sm">
                            <UserIcon className="w-8 h-8 text-gray-600" />
                            <div>
                              <p className="font-medium text-gray-900">{interviewer.name}</p>
                              <p className="text-sm text-gray-600">{interviewer.title}</p>
                              <p className="text-sm text-gray-500">{interviewer.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Preparation Materials</h3>
                      <div className="space-y-3">
                        {selectedInterview.preparationMaterials.map((material, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-sm">
                            <div className="flex items-center space-x-3">
                              <DocumentTextIcon className="w-5 h-5 text-violet-500" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{material.name}</p>
                                {material.description && (
                                  <p className="text-xs text-gray-600">{material.description}</p>
                                )}
                              </div>
                            </div>
                            <a href={material.url} className="text-gold-600 hover:text-gold-800">
                              <ArrowRightIcon className="w-4 h-4" />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
                      <div className="bg-gray-50 rounded-sm p-4 space-y-3">
                        <div>
                          <p className="font-medium">{selectedInterview.contactPerson.name}</p>
                        </div>
                        <div className="flex items-center text-sm">
                          <EnvelopeIcon className="w-4 h-4 mr-2" />
                          {selectedInterview.contactPerson.email}
                        </div>
                        {selectedInterview.contactPerson.phone && (
                          <div className="flex items-center text-sm">
                            <PhoneIcon className="w-4 h-4 mr-2" />
                            {selectedInterview.contactPerson.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {selectedInterview.notes && (
                  <div className="mt-6 p-4 bg-gold-50 rounded-sm">
                    <h4 className="font-medium text-violet-900 mb-2">Interview Notes</h4>
                    <p className="text-violet-800 text-sm">{selectedInterview.notes}</p>
                  </div>
                )}

                {selectedInterview.feedback && (
                  <div className="mt-4 p-4 bg-green-50 rounded-sm">
                    <h4 className="font-medium text-green-900 mb-2">Feedback</h4>
                    <p className="text-green-800 text-sm">{selectedInterview.feedback}</p>
                    {selectedInterview.nextSteps && (
                      <div className="mt-2">
                        <h5 className="font-medium text-green-900 text-xs">Next Steps:</h5>
                        <p className="text-green-700 text-xs">{selectedInterview.nextSteps}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end mt-6 pt-6 border-t space-x-3">
                  <button
                    onClick={() => setSelectedInterview(null)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-full hover:bg-gray-700"
                  >
                    Close
                  </button>
                  {selectedInterview.meetingLink && isUpcoming(selectedInterview) && (
                    <a
                      href={selectedInterview.meetingLink}
                      className="px-4 py-2 bg-gold-500 text-violet-950 rounded-full hover:bg-gold-600"
                    >
                      Join Interview
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
