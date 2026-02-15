'use client';

import React, { useState, useEffect } from 'react';

interface InterviewSchedulerProps {
  interviewId?: number;
  onSuccess?: (interview: any) => void;
  onCancel?: () => void;
}

interface Application {
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
  status: string;
}

interface InterviewData {
  id?: number;
  title: string;
  type: string;
  round: string;
  scheduledAt: string;
  durationMinutes: number;
  location: string;
  meetingLink: string;
  phoneNumber: string;
  meetingRoom: string;
  instructions: string;
  agenda: string;
  interviewerId: number;
  applicationId: number;
}

const INTERVIEW_TYPES = [
  { value: 'PHONE', label: 'Phone Interview' },
  { value: 'VIDEO', label: 'Video Interview' },
  { value: 'IN_PERSON', label: 'In-Person Interview' },
  { value: 'PANEL', label: 'Panel Interview' },
  { value: 'TECHNICAL', label: 'Technical Interview' },
  { value: 'BEHAVIOURAL', label: 'Behavioural Interview' },
  { value: 'COMPETENCY', label: 'Competency Interview' },
  { value: 'GROUP', label: 'Group Interview' },
  { value: 'PRESENTATION', label: 'Presentation Interview' },
  { value: 'CASE_STUDY', label: 'Case Study Interview' }
];

const INTERVIEW_ROUNDS = [
  { value: 'SCREENING', label: 'Phone Screening' },
  { value: 'FIRST_ROUND', label: 'First Interview' },
  { value: 'TECHNICAL', label: 'Technical Assessment' },
  { value: 'SECOND_ROUND', label: 'Second Interview' },
  { value: 'PANEL', label: 'Panel Interview' },
  { value: 'MANAGER', label: 'Manager Interview' },
  { value: 'FINAL', label: 'Final Interview' },
  { value: 'OFFER', label: 'Offer Discussion' }
];

const MOCK_INTERVIEWERS = [
  { id: 1, name: 'Sarah Johnson', role: 'Senior Recruiter' },
  { id: 2, name: 'Michael Chen', role: 'Engineering Manager' },
  { id: 3, name: 'Emily Rodriguez', role: 'HR Director' },
  { id: 4, name: 'David Kim', role: 'Technical Lead' },
  { id: 5, name: 'Lisa Thompson', role: 'Product Manager' }
];

export default function InterviewScheduler({ interviewId, onSuccess, onCancel }: InterviewSchedulerProps) {
  const [formData, setFormData] = useState<InterviewData>({
    title: '',
    type: 'VIDEO',
    round: 'SCREENING',
    scheduledAt: '',
    durationMinutes: 60,
    location: '',
    meetingLink: '',
    phoneNumber: '',
    meetingRoom: '',
    instructions: '',
    agenda: '',
    interviewerId: 1,
    applicationId: 0
  });

  const [applications, setApplications] = useState<Application[]>([]);
  const [availability, setAvailability] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Load applications and interview data if editing
  useEffect(() => {
    loadApplications();
    if (interviewId) {
      loadInterview();
    }
  }, [interviewId]);

  // Update title when application or round changes
  useEffect(() => {
    if (formData.applicationId > 0 && formData.round) {
      const application = applications.find(app => app.id === formData.applicationId);
      if (application) {
        const roundLabel = INTERVIEW_ROUNDS.find(r => r.value === formData.round)?.label || '';
        setFormData(prev => ({
          ...prev,
          title: `${roundLabel} - ${application.jobPosting.title}`
        }));
      }
    }
  }, [formData.applicationId, formData.round, applications]);

  const loadApplications = async () => {
    try {
      const response = await fetch('/api/applications?status=SCREENING,PHONE_INTERVIEW,FIRST_INTERVIEW,SECOND_INTERVIEW,TECHNICAL_ASSESSMENT,FINAL_INTERVIEW');
      if (response.ok) {
        const data = await response.json();
        setApplications(data.content || data);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
    }
  };

  const loadInterview = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/interviews/${interviewId}`);
      if (response.ok) {
        const data = await response.json();
        setFormData({
          ...data,
          scheduledAt: new Date(data.scheduledAt).toISOString().slice(0, 16),
          applicationId: data.application.id
        });
      }
    } catch (error) {
      console.error('Error loading interview:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAvailability = async () => {
    if (!formData.scheduledAt || !formData.interviewerId) return;

    try {
      setCheckingAvailability(true);
      const startTime = new Date(formData.scheduledAt).toISOString();
      
      const response = await fetch(
        `/api/interviews/availability/interviewer/${formData.interviewerId}?startTime=${startTime}&durationMinutes=${formData.durationMinutes}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (!data.available) {
          setErrors(prev => ({ ...prev, scheduledAt: 'Interviewer is not available at this time' }));
        } else {
          setErrors(prev => ({ ...prev, scheduledAt: '' }));
        }
      }

      // Also get suggested time slots
      const suggestionsResponse = await fetch(
        `/api/interviews/suggestions/interviewer/${formData.interviewerId}?preferredDate=${startTime}&durationMinutes=${formData.durationMinutes}&numberOfSuggestions=5`
      );
      
      if (suggestionsResponse.ok) {
        const suggestions = await suggestionsResponse.json();
        setAvailability(suggestions);
      }
    } catch (error) {
      console.error('Error checking availability:', error);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Interview title is required';
    if (!formData.scheduledAt) newErrors.scheduledAt = 'Interview date and time is required';
    if (formData.applicationId === 0) newErrors.applicationId = 'Please select an application';
    if (formData.durationMinutes < 15) newErrors.durationMinutes = 'Duration must be at least 15 minutes';
    if (formData.durationMinutes > 480) newErrors.durationMinutes = 'Duration cannot exceed 8 hours';

    // Validate business hours
    if (formData.scheduledAt) {
      const scheduledDate = new Date(formData.scheduledAt);
      const hour = scheduledDate.getHours();
      const dayOfWeek = scheduledDate.getDay();
      
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        newErrors.scheduledAt = 'Interviews must be scheduled on weekdays';
      } else if (hour < 8 || hour >= 18) {
        newErrors.scheduledAt = 'Interviews must be scheduled between 8 AM and 6 PM';
      }
    }

    // Validate minimum advance notice
    if (formData.scheduledAt) {
      const scheduledDate = new Date(formData.scheduledAt);
      const now = new Date();
      const hoursAhead = (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      if (hoursAhead < 2) {
        newErrors.scheduledAt = 'Interview must be scheduled at least 2 hours in advance';
      }
    }

    // Type-specific validations
    if (formData.type === 'PHONE' && !formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required for phone interviews';
    }

    if (formData.type === 'VIDEO' && !formData.meetingLink.trim()) {
      newErrors.meetingLink = 'Meeting link is required for video interviews';
    }

    if (['IN_PERSON', 'PANEL', 'GROUP'].includes(formData.type)) {
      if (!formData.location.trim()) {
        newErrors.location = 'Location is required for in-person interviews';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      const submitData = {
        ...formData,
        scheduledAt: new Date(formData.scheduledAt).toISOString()
      };

      let url, method;
      if (interviewId) {
        url = `/api/interviews/${interviewId}?updatedBy=1`;
        method = 'PUT';
      } else {
        url = '/api/interviews?createdBy=1';
        method = 'POST';
        submitData.applicationId = formData.applicationId;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        const result = await response.json();
        if (onSuccess) {
          onSuccess(result);
        }
      } else {
        const errorData = await response.json();
        setErrors({ general: errorData.message || 'Failed to save interview' });
      }
    } catch (error) {
      console.error('Error saving interview:', error);
      setErrors({ general: 'An error occurred while saving' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof InterviewData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSuggestedTimeSelect = (suggestedTime: string) => {
    const localTime = new Date(suggestedTime).toISOString().slice(0, 16);
    handleInputChange('scheduledAt', localTime);
  };

  if (loading && interviewId) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading interview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">
          {interviewId ? 'Edit Interview' : 'Schedule New Interview'}
        </h2>
        <p className="text-gray-600 mt-1">
          {interviewId ? 'Update interview details and scheduling' : 'Schedule an interview with a candidate'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6">
        {errors.general && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {errors.general}
          </div>
        )}

        <div className="space-y-6">
          {/* Application Selection */}
          {!interviewId && (
            <div>
              <label htmlFor="application-id" className="block text-sm font-medium text-gray-700 mb-1">
                Select Application *
              </label>
              <select
                id="application-id"
                value={formData.applicationId}
                onChange={(e) => handleInputChange('applicationId', parseInt(e.target.value))}
                aria-required="true"
                aria-invalid={!!errors.applicationId}
                aria-describedby={errors.applicationId ? 'application-id-error' : undefined}
                className={`w-full p-3 border rounded-md ${errors.applicationId ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value={0}>Select an application...</option>
                {applications.map(app => (
                  <option key={app.id} value={app.id}>
                    {app.applicant.firstName} {app.applicant.lastName} - {app.jobPosting.title} ({app.jobPosting.department})
                  </option>
                ))}
              </select>
              {errors.applicationId && <p id="application-id-error" role="alert" className="text-red-500 text-sm mt-1">{errors.applicationId}</p>}
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="interview-title" className="block text-sm font-medium text-gray-700 mb-1">
                Interview Title *
              </label>
              <input
                type="text"
                id="interview-title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                aria-required="true"
                aria-invalid={!!errors.title}
                aria-describedby={errors.title ? 'interview-title-error' : undefined}
                className={`w-full p-3 border rounded-md ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="e.g. Technical Interview - Senior Developer"
              />
              {errors.title && <p id="interview-title-error" role="alert" className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            <div>
              <label htmlFor="interview-type" className="block text-sm font-medium text-gray-700 mb-1">
                Interview Type *
              </label>
              <select
                id="interview-type"
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                aria-required="true"
                className="w-full p-3 border border-gray-300 rounded-md"
              >
                {INTERVIEW_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="interview-round" className="block text-sm font-medium text-gray-700 mb-1">
                Interview Round *
              </label>
              <select
                id="interview-round"
                value={formData.round}
                onChange={(e) => handleInputChange('round', e.target.value)}
                aria-required="true"
                className="w-full p-3 border border-gray-300 rounded-md"
              >
                {INTERVIEW_ROUNDS.map(round => (
                  <option key={round.value} value={round.value}>{round.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="interviewer-id" className="block text-sm font-medium text-gray-700 mb-1">
                Interviewer *
              </label>
              <select
                id="interviewer-id"
                value={formData.interviewerId}
                onChange={(e) => handleInputChange('interviewerId', parseInt(e.target.value))}
                aria-required="true"
                className="w-full p-3 border border-gray-300 rounded-md"
              >
                {MOCK_INTERVIEWERS.map(interviewer => (
                  <option key={interviewer.id} value={interviewer.id}>
                    {interviewer.name} ({interviewer.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Scheduling */}
          <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <legend className="sr-only">Interview Scheduling</legend>
            <div>
              <label htmlFor="scheduled-at" className="block text-sm font-medium text-gray-700 mb-1">
                Date & Time *
              </label>
              <input
                type="datetime-local"
                id="scheduled-at"
                value={formData.scheduledAt}
                onChange={(e) => handleInputChange('scheduledAt', e.target.value)}
                onBlur={checkAvailability}
                aria-required="true"
                aria-invalid={!!errors.scheduledAt}
                aria-describedby={errors.scheduledAt ? 'scheduled-at-error' : undefined}
                className={`w-full p-3 border rounded-md ${errors.scheduledAt ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.scheduledAt && <p id="scheduled-at-error" role="alert" className="text-red-500 text-sm mt-1">{errors.scheduledAt}</p>}
              {checkingAvailability && (
                <p className="text-violet-500 text-sm mt-1">Checking availability...</p>
              )}
            </div>

            <div>
              <label htmlFor="duration-minutes" className="block text-sm font-medium text-gray-700 mb-1">
                Duration (minutes) *
              </label>
              <input
                type="number"
                id="duration-minutes"
                min="15"
                max="480"
                step="15"
                value={formData.durationMinutes}
                onChange={(e) => handleInputChange('durationMinutes', parseInt(e.target.value))}
                aria-required="true"
                aria-invalid={!!errors.durationMinutes}
                aria-describedby={errors.durationMinutes ? 'duration-minutes-error' : undefined}
                className={`w-full p-3 border rounded-md ${errors.durationMinutes ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.durationMinutes && <p id="duration-minutes-error" role="alert" className="text-red-500 text-sm mt-1">{errors.durationMinutes}</p>}
            </div>
          </fieldset>

          {/* Suggested Times */}
          {availability.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Suggested Available Times
              </label>
              <div className="flex flex-wrap gap-2">
                {availability.map((time, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSuggestedTimeSelect(time)}
                    className="px-3 py-1 bg-violet-100 text-violet-800 rounded-md hover:bg-violet-200 text-sm"
                  >
                    {new Date(time).toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Location Details */}
          <div className="space-y-4">
            {(formData.type === 'IN_PERSON' || formData.type === 'PANEL' || formData.type === 'GROUP') && (
              <div>
                <label htmlFor="interview-location" className="block text-sm font-medium text-gray-700 mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  id="interview-location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  aria-required="true"
                  aria-invalid={!!errors.location}
                  aria-describedby={errors.location ? 'interview-location-error' : undefined}
                  className={`w-full p-3 border rounded-md ${errors.location ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="e.g. Conference Room A, 2nd Floor"
                />
                {errors.location && <p id="interview-location-error" role="alert" className="text-red-500 text-sm mt-1">{errors.location}</p>}
              </div>
            )}

            {formData.type === 'VIDEO' && (
              <div>
                <label htmlFor="meeting-link" className="block text-sm font-medium text-gray-700 mb-1">
                  Video Meeting Link *
                </label>
                <input
                  type="url"
                  id="meeting-link"
                  value={formData.meetingLink}
                  onChange={(e) => handleInputChange('meetingLink', e.target.value)}
                  aria-required="true"
                  aria-invalid={!!errors.meetingLink}
                  aria-describedby={errors.meetingLink ? 'meeting-link-error' : undefined}
                  className={`w-full p-3 border rounded-md ${errors.meetingLink ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="e.g. https://zoom.us/j/123456789"
                />
                {errors.meetingLink && <p id="meeting-link-error" role="alert" className="text-red-500 text-sm mt-1">{errors.meetingLink}</p>}
              </div>
            )}

            {formData.type === 'PHONE' && (
              <div>
                <label htmlFor="phone-number" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone-number"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  aria-required="true"
                  aria-invalid={!!errors.phoneNumber}
                  aria-describedby={errors.phoneNumber ? 'phone-number-error' : undefined}
                  className={`w-full p-3 border rounded-md ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="e.g. +27 11 123 4567"
                />
                {errors.phoneNumber && <p id="phone-number-error" role="alert" className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
              </div>
            )}

            {(formData.type === 'PANEL' || formData.type === 'GROUP') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Room
                </label>
                <input
                  type="text"
                  value={formData.meetingRoom}
                  onChange={(e) => handleInputChange('meetingRoom', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md"
                  placeholder="e.g. Boardroom 1"
                />
              </div>
            )}
          </div>

          {/* Additional Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interview Agenda
              </label>
              <textarea
                value={formData.agenda}
                onChange={(e) => handleInputChange('agenda', e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-md"
                placeholder="Outline what will be covered in this interview..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instructions for Candidate
              </label>
              <textarea
                value={formData.instructions}
                onChange={(e) => handleInputChange('instructions', e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-md"
                placeholder="Any special instructions, preparation requirements, or what to bring..."
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-6 mt-6 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </span>
            ) : (
              interviewId ? 'Update Interview' : 'Schedule Interview'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}