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
      case 'phone': return 'bg-violet-100 text-violet-600';
      case 'video': return 'bg-purple-100 text-purple-600';
      case 'in_person': return 'bg-green-100 text-green-800';
      case 'technical': return 'bg-teal-100 text-teal-600';
      case 'panel': return 'bg-gold-100 text-gold-600';
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

  // Separate interviews into upcoming and past
  const upcomingInterviews = filteredInterviews.filter(i => isUpcoming(i) && ['scheduled', 'confirmed'].includes(i.status));
  const pastInterviews = filteredInterviews.filter(i => !isUpcoming(i) || ['completed', 'cancelled', 'no_show', 'rescheduled'].includes(i.status));

  // Calendar helpers
  const selectedDateObj = new Date(selectedDate + 'T00:00:00');
  const currentMonth = selectedDateObj.getMonth();
  const currentYear = selectedDateObj.getFullYear();
  const monthName = selectedDateObj.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });

  const getCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    // Monday = 0 in our grid (ISO week)
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;
    const days: { day: number; isCurrentMonth: boolean; date: string; hasInterview: boolean; isToday: boolean }[] = [];
    // Previous month days
    const prevMonthLast = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDow - 1; i >= 0; i--) {
      const d = prevMonthLast - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, isCurrentMonth: false, date: dateStr, hasInterview: interviews.some(iv => iv.scheduledDate === dateStr), isToday: false });
    }
    // Current month days
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, isCurrentMonth: true, date: dateStr, hasInterview: interviews.some(iv => iv.scheduledDate === dateStr), isToday: dateStr === todayStr });
    }
    // Next month days
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
        const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
        const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        days.push({ day: d, isCurrentMonth: false, date: dateStr, hasInterview: interviews.some(iv => iv.scheduledDate === dateStr), isToday: false });
      }
    }
    return days;
  };

  const navigateMonth = (delta: number) => {
    const newDate = new Date(currentYear, currentMonth + delta, 1);
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  const getInterviewerInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const interviewerColors = ['bg-violet-600', 'bg-teal-600', 'bg-gold-600', 'bg-idc-pink-600', 'bg-violet-500'];

  const actions = (
    <div className="flex items-center gap-3">
      <div className="flex rounded-control border border-border">
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
        className="px-3 py-2 border border-border rounded-control text-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
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
      <PageWrapper title="My Interviews & Offers" subtitle="Track your interview schedule and review employment offers" actions={actions}>
        <div className="space-y-6">
          {/* Skeleton Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white border border-border rounded-card shadow-sm p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-card bg-gray-200 animate-pulse" />
                <div className="flex-1">
                  <div className="h-6 w-12 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
          {/* Skeleton Interview Cards */}
          {[1, 2].map(i => (
            <div key={i} className="bg-white border border-border rounded-card shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
                <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
              </div>
              <div className="flex gap-4 mb-3">
                <div className="h-4 w-44 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-52 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full bg-gray-200 animate-pulse" />
                <div className="w-7 h-7 rounded-full bg-gray-200 animate-pulse" />
                <div className="h-4 w-44 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-16 w-full bg-gray-100 rounded-control animate-pulse" />
            </div>
          ))}
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="My Interviews & Offers"
      subtitle="Track your interview schedule and review employment offers"
      actions={actions}
    >
      <div className="space-y-6">
        {/* ========== SECTION: MY INTERVIEWS ========== */}
        <div className="flex items-center gap-2 mb-1">
          <CalendarIcon className="w-[22px] h-[22px] text-violet-600" />
          <h2 className="text-xl font-bold text-gray-900">My Interviews</h2>
        </div>

        {/* Stats Bar - 3 column grid matching mock */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Upcoming stat */}
          <div className="bg-white border border-border rounded-card shadow-sm p-5 flex items-center gap-4 transition-all hover:shadow-md hover:-translate-y-px">
            <div className="w-12 h-12 rounded-card bg-icon-bg-navy flex items-center justify-center flex-shrink-0">
              <ClockIcon className="w-6 h-6 text-violet-600" />
            </div>
            <div className="flex-1">
              <div className="text-[1.75rem] font-extrabold leading-tight text-gray-900">
                {interviews.filter(i => isUpcoming(i) && ['scheduled', 'confirmed'].includes(i.status)).length}
              </div>
              <div className="text-[0.8125rem] font-medium text-gray-500 mt-0.5">Upcoming</div>
            </div>
          </div>

          {/* Completed stat */}
          <div className="bg-white border border-border rounded-card shadow-sm p-5 flex items-center gap-4 transition-all hover:shadow-md hover:-translate-y-px">
            <div className="w-12 h-12 rounded-card bg-icon-bg-teal flex items-center justify-center flex-shrink-0">
              <CheckCircleIcon className="w-6 h-6 text-teal-600" />
            </div>
            <div className="flex-1">
              <div className="text-[1.75rem] font-extrabold leading-tight text-gray-900">
                {interviews.filter(i => i.status === 'completed').length}
              </div>
              <div className="text-[0.8125rem] font-medium text-gray-500 mt-0.5">Completed</div>
            </div>
          </div>

          {/* Total stat */}
          <div className="bg-white border border-border rounded-card shadow-sm p-5 flex items-center gap-4 transition-all hover:shadow-md hover:-translate-y-px">
            <div className="w-12 h-12 rounded-card bg-icon-bg-gold flex items-center justify-center flex-shrink-0">
              <UserIcon className="w-6 h-6 text-gold-600" />
            </div>
            <div className="flex-1">
              <div className="text-[1.75rem] font-extrabold leading-tight text-gray-900">
                {interviews.length}
              </div>
              <div className="text-[0.8125rem] font-medium text-gray-500 mt-0.5">Total</div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-card p-4 flex items-center justify-between">
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

        {/* Calendar + Upcoming Interviews side-by-side layout */}
        {viewMode === 'list' && (
          <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-6">
            {/* Mini Calendar */}
            <div className="bg-white border border-border rounded-card shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => navigateMonth(-1)}
                  className="w-7 h-7 rounded-md border border-border flex items-center justify-center text-gray-500 hover:border-violet-600 hover:text-violet-600 transition-all"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                <h3 className="text-[0.9375rem] font-bold text-gray-900">{monthName}</h3>
                <button
                  onClick={() => navigateMonth(1)}
                  className="w-7 h-7 rounded-md border border-border flex items-center justify-center text-gray-500 hover:border-violet-600 hover:text-violet-600 transition-all"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-0.5 mb-1">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <div key={day} className="text-center text-[0.6875rem] font-bold text-gray-500 uppercase tracking-wide py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-0.5">
                {getCalendarDays().map((calDay, idx) => (
                  <button
                    key={idx}
                    onClick={() => calDay.hasInterview ? setSelectedDate(calDay.date) : undefined}
                    className={`text-center py-1.5 text-[0.8125rem] font-medium rounded-md relative transition-all
                      ${!calDay.isCurrentMonth ? 'text-gray-300' : 'text-gray-900'}
                      ${calDay.isToday && !calDay.hasInterview ? 'bg-violet-600 text-white font-bold' : ''}
                      ${calDay.isToday && calDay.hasInterview ? 'bg-violet-600 text-white font-bold' : ''}
                      ${calDay.hasInterview && !calDay.isToday ? 'bg-teal-100 text-teal-600 font-bold cursor-pointer hover:bg-teal-600 hover:text-white' : ''}
                    `}
                  >
                    {calDay.day}
                    {calDay.hasInterview && (
                      <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${calDay.isToday ? 'bg-gold-500' : 'bg-teal-600'}`} />
                    )}
                  </button>
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                <div className="flex items-center gap-1.5 text-[0.6875rem] font-medium text-gray-500">
                  <span className="w-2 h-2 rounded-full bg-violet-600 flex-shrink-0" />
                  Today
                </div>
                <div className="flex items-center gap-1.5 text-[0.6875rem] font-medium text-gray-500">
                  <span className="w-2 h-2 rounded-full bg-teal-600 flex-shrink-0" />
                  Interview
                </div>
              </div>
            </div>

            {/* Upcoming Interview Cards */}
            <div className="flex flex-col gap-4">
              {upcomingInterviews.length > 0 ? (
                upcomingInterviews.map((interview) => {
                  const timeUntil = getTimeUntilInterview(interview);
                  return (
                    <div
                      key={interview.id}
                      className="bg-white border border-border rounded-card shadow-sm p-5 transition-all hover:shadow-md hover:border-violet-600/30 hover:-translate-y-px"
                    >
                      {/* Card header: position + type badge */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="font-bold text-base text-gray-900 leading-snug">{interview.jobTitle}</div>
                          {timeUntil && (
                            <span className="inline-flex items-center mt-1.5 px-2 py-0.5 bg-gold-100 text-gold-700 text-xs font-semibold rounded-full">
                              <ClockIcon className="w-3 h-3 mr-1" />
                              In {timeUntil}
                            </span>
                          )}
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide whitespace-nowrap ${getInterviewTypeColor(interview.interviewType)}`}>
                          {getInterviewTypeIcon(interview.interviewType)}
                          <span className="capitalize">{interview.interviewType.replace('_', ' ')}</span>
                        </span>
                      </div>

                      {/* Details grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 mb-3">
                        <div className="flex items-center gap-2 text-[0.8125rem] text-gray-500">
                          <CalendarIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <strong className="text-gray-900 font-semibold">
                            {new Date(interview.scheduledDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}, {interview.scheduledTime}
                            {interview.duration ? ` - ${(() => {
                              const [h, m] = interview.scheduledTime.split(':').map(Number);
                              const endDate = new Date(2000, 0, 1, h, m + interview.duration);
                              return endDate.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
                            })()}` : ''}
                          </strong>
                        </div>
                        {interview.location && (
                          <div className="flex items-center gap-2 text-[0.8125rem] text-gray-500">
                            <MapPinIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span>{interview.location}</span>
                          </div>
                        )}
                        {interview.meetingLink && (
                          <div className="flex items-center gap-2 text-[0.8125rem] text-gray-500">
                            <VideoCameraIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <a href={interview.meetingLink} className="text-violet-600 hover:text-violet-800 font-medium">
                              Join Video Call
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Interviewers row */}
                      {interview.interviewers.length > 0 && (
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Interviewers:</span>
                          <div className="flex items-center">
                            {interview.interviewers.map((interviewer, idx) => (
                              <div
                                key={idx}
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[0.5625rem] font-bold border-2 border-white ${interviewerColors[idx % interviewerColors.length]} ${idx > 0 ? '-ml-1' : ''}`}
                                title={interviewer.name}
                              >
                                {getInterviewerInitials(interviewer.name)}
                              </div>
                            ))}
                          </div>
                          <span className="text-[0.8125rem] text-gray-900 font-medium">
                            {interview.interviewers.map(iv => iv.name).join(', ')}
                          </span>
                        </div>
                      )}

                      {/* Preparation tips */}
                      {interview.notes && (
                        <div className="bg-violet-50 border border-violet-100 rounded-control p-3 mt-1">
                          <div className="text-[0.6875rem] font-bold uppercase tracking-wider text-violet-600 mb-1 flex items-center gap-1.5">
                            <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                            Preparation Tips
                          </div>
                          <p className="text-[0.8125rem] text-gray-500 leading-relaxed">{interview.notes}</p>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 mt-4">
                        <button
                          onClick={() => setSelectedInterview(interview)}
                          className="inline-flex items-center gap-2 px-4 py-2 border-2 border-border rounded-full text-xs font-semibold uppercase tracking-wider text-gray-500 hover:border-violet-600 hover:text-violet-600 transition-all"
                        >
                          View Details
                        </button>
                        {interview.meetingLink && (
                          <a
                            href={interview.meetingLink}
                            className="inline-flex items-center gap-2 px-4 py-2 border-2 border-gold-500 rounded-full text-xs font-semibold uppercase tracking-wider text-violet-600 hover:bg-gold-500 hover:text-gray-900 transition-all"
                          >
                            <VideoCameraIcon className="w-4 h-4" />
                            Join Call
                          </a>
                        )}
                        <button className="inline-flex items-center gap-2 px-4 py-2 border-2 border-border rounded-full text-xs font-semibold uppercase tracking-wider text-gray-500 hover:border-violet-600 hover:text-violet-600 transition-all">
                          <ChatBubbleLeftRightIcon className="w-4 h-4" />
                          Reschedule
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <EmptyState
                  icon={CalendarIcon}
                  title="No upcoming interviews"
                  description="You don't have any upcoming interviews scheduled."
                />
              )}
            </div>
          </div>
        )}

        {/* Calendar View (full-width) */}
        {viewMode === 'calendar' && (
          <div className="bg-white border border-border rounded-card shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Calendar View</h3>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-border rounded-control text-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
              />
            </div>

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
                  <div key={interview.id} className="flex items-center space-x-4 p-4 border border-border rounded-card hover:shadow-sm transition-all">
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

        {/* ========== Past Interviews Section ========== */}
        {pastInterviews.length > 0 && (
          <div className="mt-2">
            <div className="flex items-center gap-2 mb-4">
              <BriefcaseIcon className="w-[22px] h-[22px] text-violet-600" />
              <h2 className="text-xl font-bold text-gray-900">Past Interviews</h2>
            </div>

            <div className="flex flex-col gap-3">
              {pastInterviews.map((interview) => (
                <div
                  key={interview.id}
                  className="bg-white border border-border rounded-card shadow-sm px-5 py-4 flex items-center justify-between gap-4 flex-wrap transition-all hover:shadow-md"
                >
                  {/* Left: icon + info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-control flex items-center justify-center flex-shrink-0 ${
                      interview.interviewType === 'technical' ? 'bg-teal-100 text-teal-600' : 'bg-violet-100 text-violet-600'
                    }`}>
                      {getInterviewTypeIcon(interview.interviewType)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[0.9375rem] font-semibold text-gray-900 truncate">{interview.jobTitle}</h3>
                      <p className="text-[0.8125rem] text-gray-500">
                        <span className="capitalize">{interview.interviewType.replace('_', ' ')}</span>
                        {' - '}
                        {new Date(interview.scheduledDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Right: feedback badge + action */}
                  <div className="flex items-center gap-3">
                    {interview.feedback ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                        Feedback Received
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gold-50 text-gold-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-gold-600" />
                        Feedback Pending
                      </span>
                    )}
                    <button
                      onClick={() => setSelectedInterview(interview)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 border-2 border-border rounded-full text-xs font-semibold uppercase tracking-wider text-gray-500 hover:border-violet-600 hover:text-violet-600 transition-all"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Divider before empty state if no interviews at all */}
        {filteredInterviews.length === 0 && !loading && (
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

        {/* ========== Interview Details Modal ========== */}
        {selectedInterview && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-card shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedInterview.jobTitle}</h2>
                    <p className="text-lg text-gold-600 font-medium mt-1">{selectedInterview.company}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-gray-600">
                        Round {selectedInterview.round} of {selectedInterview.totalRounds}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${getInterviewTypeColor(selectedInterview.interviewType)}`}>
                        {getInterviewTypeIcon(selectedInterview.interviewType)}
                        <span className="capitalize">{selectedInterview.interviewType.replace('_', ' ')}</span>
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(selectedInterview.status)}`}>
                        {getStatusIcon(selectedInterview.status)}
                        <span className="capitalize">{selectedInterview.status}</span>
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedInterview(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XCircleIcon className="w-6 h-6" />
                  </button>
                </div>

                {/* Modal Body - 2 column grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left column */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Schedule Details</h3>
                      <div className="bg-gray-50 rounded-card p-4 space-y-3">
                        <div className="flex items-center">
                          <CalendarIcon className="w-5 h-5 text-gray-600 mr-3" />
                          <span>{new Date(selectedInterview.scheduledDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
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
                            <a href={selectedInterview.meetingLink} className="text-violet-600 hover:text-violet-800 font-medium">
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
                          <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-card">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${interviewerColors[index % interviewerColors.length]}`}>
                              {getInterviewerInitials(interviewer.name)}
                            </div>
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

                  {/* Right column */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Preparation Materials</h3>
                      <div className="space-y-3">
                        {selectedInterview.preparationMaterials.length > 0 ? (
                          selectedInterview.preparationMaterials.map((material, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-card">
                              <div className="flex items-center space-x-3">
                                <DocumentTextIcon className="w-5 h-5 text-violet-500" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{material.name}</p>
                                  {material.description && (
                                    <p className="text-xs text-gray-600">{material.description}</p>
                                  )}
                                </div>
                              </div>
                              <a href={material.url} className="text-violet-600 hover:text-violet-800">
                                <ArrowRightIcon className="w-4 h-4" />
                              </a>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 italic">No preparation materials provided.</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
                      <div className="bg-gray-50 rounded-card p-4 space-y-3">
                        <div>
                          <p className="font-medium">{selectedInterview.contactPerson.name}</p>
                        </div>
                        <div className="flex items-center text-sm">
                          <EnvelopeIcon className="w-4 h-4 mr-2 text-gray-400" />
                          {selectedInterview.contactPerson.email}
                        </div>
                        {selectedInterview.contactPerson.phone && (
                          <div className="flex items-center text-sm">
                            <PhoneIcon className="w-4 h-4 mr-2 text-gray-400" />
                            {selectedInterview.contactPerson.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes / feedback sections */}
                {selectedInterview.notes && (
                  <div className="mt-6 p-4 bg-violet-50 border border-violet-100 rounded-card">
                    <h4 className="font-semibold text-violet-800 mb-2 text-sm uppercase tracking-wider">Interview Notes</h4>
                    <p className="text-violet-700 text-sm">{selectedInterview.notes}</p>
                  </div>
                )}

                {selectedInterview.feedback && (
                  <div className="mt-4 p-4 bg-teal-50 border border-teal-100 rounded-card">
                    <h4 className="font-semibold text-teal-800 mb-2 text-sm uppercase tracking-wider">Feedback</h4>
                    <p className="text-teal-700 text-sm">{selectedInterview.feedback}</p>
                    {selectedInterview.nextSteps && (
                      <div className="mt-2">
                        <h5 className="font-semibold text-teal-800 text-xs uppercase tracking-wider">Next Steps:</h5>
                        <p className="text-teal-600 text-xs">{selectedInterview.nextSteps}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Modal Footer */}
                <div className="flex justify-end mt-6 pt-6 border-t border-border gap-3">
                  <button
                    onClick={() => setSelectedInterview(null)}
                    className="inline-flex items-center px-5 py-2.5 border-2 border-border rounded-full text-sm font-semibold text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-all"
                  >
                    Close
                  </button>
                  {selectedInterview.meetingLink && isUpcoming(selectedInterview) && (
                    <a
                      href={selectedInterview.meetingLink}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold-500 border-2 border-gold-500 rounded-full text-sm font-semibold text-gray-900 hover:bg-gold-600 hover:border-gold-600 transition-all"
                    >
                      <VideoCameraIcon className="w-4 h-4" />
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
