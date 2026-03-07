'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api-fetch';
import SearchableDropdown from '@/components/SearchableDropdown';
import WizardShell from '@/components/WizardShell';
import type { WizardStep } from '@/components/WizardShell';
import type { DropdownOption } from '@/components/SearchableDropdown';

const HARDCODED_INTERVIEWERS: DropdownOption[] = [
  { value: '1', label: 'Thabo Mokoena', description: 'Engineering Manager' },
  { value: '2', label: 'Naledi Sithole', description: 'Senior Developer' },
  { value: '3', label: 'Pieter van der Merwe', description: 'HR Manager' },
  { value: '4', label: 'Ayanda Dlamini', description: 'Technical Lead' },
  { value: '5', label: 'Fatima Patel', description: 'Head of Product' },
  { value: '6', label: 'Johan Botha', description: 'CTO' },
  { value: '7', label: 'Zanele Mthembu', description: 'Senior Recruiter' },
  { value: '8', label: 'David Naidoo', description: 'Software Architect' },
  { value: '9', label: 'Lerato Molefe', description: 'QA Lead' },
  { value: '10', label: 'Sarah Jacobs', description: 'Operations Director' },
  { value: '11', label: 'Sipho Ndaba', description: 'DevOps Engineer' },
  { value: '12', label: 'Amahle Zulu', description: 'UX Designer' },
  { value: '13', label: 'Rudi Erasmus', description: 'Finance Manager' },
  { value: '14', label: 'Nomsa Khumalo', description: 'People & Culture Lead' },
  { value: '15', label: 'Raj Govender', description: 'Data Science Manager' },
];

interface InterviewSchedulerProps {
  interviewId?: number;
  onSuccess?: (interview: InterviewSaveResponse) => void;
  onCancel?: () => void;
}

interface Application {
  id: number;
  applicantId: number;
  applicantName: string;
  applicantEmail: string;
  jobAdId: number;
  jobTitle: string;
  department: string;
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
  interviewerIds: string[];
  applicationId: number;
}

interface InterviewSaveResponse {
  id: number;
  title: string;
  scheduledAt: string;
  application: {
    id: number;
  };
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
  { value: 'CASE_STUDY', label: 'Case Study Interview' },
];

const INTERVIEW_ROUNDS = [
  { value: 'SCREENING', label: 'Phone Screening' },
  { value: 'FIRST_ROUND', label: 'First Interview' },
  { value: 'TECHNICAL', label: 'Technical Assessment' },
  { value: 'SECOND_ROUND', label: 'Second Interview' },
  { value: 'PANEL', label: 'Panel Interview' },
  { value: 'MANAGER', label: 'Manager Interview' },
  { value: 'FINAL', label: 'Final Interview' },
  { value: 'OFFER', label: 'Offer Discussion' },
];

interface Interviewer {
  id: number;
  name: string;
  email: string;
  role: string;
}

const WIZARD_STEPS: WizardStep[] = [
  { id: 'candidate', label: 'Candidate', description: 'Select application' },
  { id: 'setup', label: 'Setup', description: 'Round, type & panel' },
  { id: 'schedule', label: 'Schedule', description: 'Date & availability' },
  { id: 'details', label: 'Details', description: 'Location & agenda' },
  { id: 'review', label: 'Review', description: 'Confirm & schedule' },
];

const inputClass = (hasError?: boolean) =>
  `w-full p-3 border rounded-[2px] bg-white dark:bg-charcoal text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gold-500/60 focus:border-primary focus:outline-none ${hasError ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'}`;

const selectClass =
  'w-full p-3 border border-gray-200 dark:border-gray-700 rounded-[2px] bg-white dark:bg-charcoal text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gold-500/60 focus:border-primary focus:outline-none';

const labelClass = 'block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-[0.05em] mb-1.5';

export default function InterviewScheduler({ interviewId, onSuccess, onCancel }: InterviewSchedulerProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(interviewId ? 1 : 0);
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
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
    interviewerIds: [],
    applicationId: 0,
  });

  const [applications, setApplications] = useState<Application[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [availability, setAvailability] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const getActorId = useCallback((): number | null => {
    const actorId = Number(user?.id);
    if (!Number.isFinite(actorId) || actorId <= 0) {
      setErrors((prev) => ({ ...prev, general: 'Unable to identify current user. Please sign in again.' }));
      return null;
    }
    return actorId;
  }, [user]);

  const interviewerOptions: DropdownOption[] = useMemo(() => {
    const apiOptions = interviewers.map((i) => ({ value: String(i.id), label: i.name, description: i.role }));
    const apiNames = new Set(apiOptions.map((o) => o.label.toLowerCase()));
    const additional = HARDCODED_INTERVIEWERS.filter((h) => !apiNames.has(h.label.toLowerCase()));
    return [...apiOptions, ...additional];
  }, [interviewers]);

  const applicationOptions: DropdownOption[] = useMemo(
    () => applications.map((app) => ({
      value: String(app.id),
      label: `${app.applicantName || 'Unknown'} - ${app.jobTitle || 'Unknown'}`,
      description: app.department ? `Department: ${app.department}` : undefined,
    })),
    [applications],
  );

  const selectedApplication = useMemo(
    () => applications.find((app) => app.id === formData.applicationId),
    [applications, formData.applicationId],
  );

  const loadApplications = useCallback(async () => {
    try {
      setApplicationsLoading(true);
      const response = await apiFetch('/api/applications?status=SCREENING&size=200');
      if (response.ok) {
        const data = await response.json();
        setApplications(data.content || data);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setApplicationsLoading(false);
    }
  }, []);

  const loadInterview = useCallback(async () => {
    if (!interviewId) return;
    try {
      setLoading(true);
      const response = await apiFetch(`/api/interviews/${interviewId}`);
      if (response.ok) {
        const data = await response.json();
        setFormData({
          ...data,
          scheduledAt: new Date(data.scheduledAt).toISOString().slice(0, 16),
          applicationId: data.application.id,
        });
      }
    } catch (error) {
      console.error('Error loading interview:', error);
    } finally {
      setLoading(false);
    }
  }, [interviewId]);

  const loadInterviewers = useCallback(async () => {
    try {
      const response = await apiFetch('/api/auth/interviewers');
      if (response.ok) {
        const data = await response.json();
        setInterviewers(data);
      }
    } catch (error) {
      console.error('Error loading interviewers:', error);
    }
  }, []);

  useEffect(() => {
    void loadApplications();
    void loadInterviewers();
    if (interviewId) {
      void loadInterview();
    }
  }, [interviewId, loadApplications, loadInterview, loadInterviewers]);

  useEffect(() => {
    if (formData.applicationId > 0 && formData.round) {
      const application = applications.find((app) => app.id === formData.applicationId);
      if (application) {
        const roundLabel = INTERVIEW_ROUNDS.find((round) => round.value === formData.round)?.label || '';
        setFormData((prev) => ({
          ...prev,
          title: `${roundLabel} - ${application.jobTitle || 'Untitled Position'}`,
        }));
      }
    }
  }, [formData.applicationId, formData.round, applications]);

  const handleInputChange = <K extends keyof InterviewData>(field: K, value: InterviewData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const checkAvailability = async () => {
    const primaryInterviewerId = formData.interviewerIds.length > 0 ? Number(formData.interviewerIds[0]) : formData.interviewerId;
    if (!formData.scheduledAt || !primaryInterviewerId) return;

    try {
      setCheckingAvailability(true);
      const startTime = new Date(formData.scheduledAt).toISOString();

      const availabilityResponse = await apiFetch(
        `/api/interviews/availability/interviewer/${primaryInterviewerId}?startTime=${startTime}&durationMinutes=${formData.durationMinutes}`,
      );

      if (availabilityResponse.ok) {
        const data = await availabilityResponse.json();
        if (!data.available) {
          setErrors((prev) => ({ ...prev, scheduledAt: 'Interviewer is not available at this time' }));
        } else {
          setErrors((prev) => ({ ...prev, scheduledAt: '' }));
        }
      }

      const suggestionsResponse = await apiFetch(
        `/api/interviews/suggestions/interviewer/${primaryInterviewerId}?preferredDate=${startTime}&durationMinutes=${formData.durationMinutes}&numberOfSuggestions=5`,
      );

      if (suggestionsResponse.ok) {
        const suggestions = await suggestionsResponse.json() as string[];
        setAvailability(suggestions);
      }
    } catch (error) {
      console.error('Error checking availability:', error);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleSuggestedTimeSelect = (suggestedTime: string) => {
    const localTime = new Date(suggestedTime).toISOString().slice(0, 16);
    handleInputChange('scheduledAt', localTime);
  };

  // ── Per-step validation ──────────────────────────────────────────────

  const canProceedFromStep = (step: number): boolean => {
    switch (step) {
      case 0: return formData.applicationId > 0;
      case 1: return !!formData.round && !!formData.type && formData.interviewerIds.length > 0;
      case 2: {
        if (!formData.scheduledAt) return false;
        if (formData.durationMinutes < 15 || formData.durationMinutes > 480) return false;
        const d = new Date(formData.scheduledAt);
        const day = d.getDay();
        const hour = d.getHours();
        if (day === 0 || day === 6) return false;
        if (hour < 8 || hour >= 18) return false;
        const hoursAhead = (d.getTime() - Date.now()) / (1000 * 60 * 60);
        if (hoursAhead < 2) return false;
        return true;
      }
      case 3: {
        if (formData.type === 'PHONE' && !formData.phoneNumber.trim()) return false;
        if (formData.type === 'VIDEO' && !formData.meetingLink.trim()) return false;
        if (['IN_PERSON', 'PANEL', 'GROUP'].includes(formData.type) && !formData.location.trim()) return false;
        return true;
      }
      case 4: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1 && canProceedFromStep(currentStep)) {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > (interviewId ? 1 : 0)) {
      setCurrentStep((s) => s - 1);
    }
  };

  const handleSubmit = async () => {
    const actorId = getActorId();
    if (!actorId) return;

    try {
      setLoading(true);

      const submitData: InterviewData = {
        ...formData,
        interviewerId: formData.interviewerIds.length > 0 ? Number(formData.interviewerIds[0]) : formData.interviewerId,
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
      };

      const url = interviewId
        ? `/api/interviews/${interviewId}?updatedBy=${actorId}`
        : `/api/interviews?createdBy=${actorId}`;
      const method = interviewId ? 'PUT' : 'POST';

      const response = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        const result = await response.json() as InterviewSaveResponse;
        onSuccess?.(result);
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

  // ── Step renderers ───────────────────────────────────────────────────

  const renderCandidateStep = () => (
    <div>
      <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">Select Candidate</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">Search for the application you want to schedule an interview for.</p>

      <SearchableDropdown
        label="Application"
        required
        options={applicationOptions}
        value={formData.applicationId > 0 ? [String(formData.applicationId)] : []}
        onChange={(vals) => handleInputChange('applicationId', vals.length > 0 ? Number(vals[0]) : 0)}
        multi={false}
        loading={applicationsLoading}
        placeholder="Search by candidate name or job title..."
        searchPlaceholder="Search by candidate name or job title..."
      />

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-[2px] text-xs text-blue-700 dark:text-blue-300">
        Only applications in active pipeline stages are shown.
      </div>
    </div>
  );

  const renderSetupStep = () => (
    <div>
      <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">Interview Setup</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">Configure the interview round, type, and panel.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="interview-round" className={labelClass}>Interview Round *</label>
          <select
            id="interview-round"
            value={formData.round}
            onChange={(e) => handleInputChange('round', e.target.value)}
            className={selectClass}
          >
            {INTERVIEW_ROUNDS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="interview-type" className={labelClass}>Interview Type *</label>
          <select
            id="interview-type"
            value={formData.type}
            onChange={(e) => handleInputChange('type', e.target.value)}
            className={selectClass}
          >
            {INTERVIEW_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="interview-title" className={labelClass}>Interview Title</label>
        <input
          type="text"
          id="interview-title"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          className={inputClass()}
          placeholder="Auto-populated from round + job title"
        />
        <p className="text-[10px] text-gray-400 mt-1">Auto-populated from round and job title</p>
      </div>

      <div className="mt-4">
        <SearchableDropdown
          label="Interviewer(s)"
          required
          options={interviewerOptions}
          value={formData.interviewerIds}
          onChange={(vals) => handleInputChange('interviewerIds', vals as unknown as string[])}
          multi={true}
          placeholder="Select interviewers..."
          searchPlaceholder="Search by name or role..."
        />
      </div>
    </div>
  );

  const renderScheduleStep = () => (
    <div>
      <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">Date and Time</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">Choose when the interview will take place. Availability is checked automatically.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="scheduled-at" className={labelClass}>Date &amp; Time *</label>
          <input
            type="datetime-local"
            id="scheduled-at"
            value={formData.scheduledAt}
            onChange={(e) => handleInputChange('scheduledAt', e.target.value)}
            onBlur={checkAvailability}
            className={inputClass(!!errors.scheduledAt)}
          />
          {errors.scheduledAt && <p className="text-red-500 text-xs mt-1">{errors.scheduledAt}</p>}
          {checkingAvailability && <p className="text-primary text-xs mt-1">Checking availability...</p>}
        </div>
        <div>
          <label htmlFor="duration-minutes" className={labelClass}>Duration (minutes) *</label>
          <input
            type="number"
            id="duration-minutes"
            min="15"
            max="480"
            step="15"
            value={formData.durationMinutes}
            onChange={(e) => handleInputChange('durationMinutes', Number(e.target.value))}
            className={inputClass(!!errors.durationMinutes)}
          />
          {errors.durationMinutes && <p className="text-red-500 text-xs mt-1">{errors.durationMinutes}</p>}
        </div>
      </div>

      <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-[2px] text-xs text-amber-700 dark:text-amber-300">
        Weekdays only, 08:00 — 18:00. Must be at least 2 hours from now.
      </div>

      {availability.length > 0 && (
        <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-[2px]">
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-2">Suggested available times</p>
          <div className="flex flex-wrap gap-2">
            {availability.map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => handleSuggestedTimeSelect(time)}
                className="px-3 py-1.5 bg-white dark:bg-charcoal border border-emerald-200 dark:border-emerald-700 rounded-full text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
              >
                {new Date(time).toLocaleString()}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderDetailsStep = () => (
    <div>
      <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">Interview Details</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">Add location, agenda, and candidate instructions.</p>

      {/* Conditional location fields */}
      {formData.type === 'VIDEO' && (
        <div className="mb-4">
          <label htmlFor="meeting-link" className={labelClass}>Meeting Link *</label>
          <input
            type="url"
            id="meeting-link"
            value={formData.meetingLink}
            onChange={(e) => handleInputChange('meetingLink', e.target.value)}
            className={inputClass(!!errors.meetingLink)}
            placeholder="https://meet.google.com/..."
          />
          {errors.meetingLink && <p className="text-red-500 text-xs mt-1">{errors.meetingLink}</p>}
        </div>
      )}

      {formData.type === 'PHONE' && (
        <div className="mb-4">
          <label htmlFor="phone-number" className={labelClass}>Phone Number *</label>
          <input
            type="tel"
            id="phone-number"
            value={formData.phoneNumber}
            onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
            className={inputClass(!!errors.phoneNumber)}
            placeholder="+27 11 123 4567"
          />
          {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>}
        </div>
      )}

      {['IN_PERSON', 'PANEL', 'GROUP'].includes(formData.type) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="interview-location" className={labelClass}>Location *</label>
            <input
              type="text"
              id="interview-location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className={inputClass(!!errors.location)}
              placeholder="Conference Room A, 2nd Floor"
            />
            {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
          </div>
          {['PANEL', 'GROUP'].includes(formData.type) && (
            <div>
              <label className={labelClass}>Meeting Room</label>
              <input
                type="text"
                value={formData.meetingRoom}
                onChange={(e) => handleInputChange('meetingRoom', e.target.value)}
                className={inputClass()}
                placeholder="Boardroom 1"
              />
            </div>
          )}
        </div>
      )}

      <div className="mb-4">
        <label className={labelClass}>Interview Agenda</label>
        <textarea
          value={formData.agenda}
          onChange={(e) => handleInputChange('agenda', e.target.value)}
          rows={3}
          className={inputClass()}
          placeholder="Outline the topics and structure of the interview..."
        />
      </div>

      <div>
        <label className={labelClass}>Instructions for Candidate</label>
        <textarea
          value={formData.instructions}
          onChange={(e) => handleInputChange('instructions', e.target.value)}
          rows={3}
          className={inputClass()}
          placeholder="What to prepare, where to go, what to bring..."
        />
      </div>
    </div>
  );

  const renderReviewStep = () => {
    const roundLabel = INTERVIEW_ROUNDS.find((r) => r.value === formData.round)?.label || formData.round;
    const typeLabel = INTERVIEW_TYPES.find((t) => t.value === formData.type)?.label || formData.type;
    const interviewerNames = formData.interviewerIds
      .map((id) => interviewerOptions.find((o) => o.value === id)?.label)
      .filter(Boolean)
      .join(', ');

    const locationDisplay =
      formData.type === 'VIDEO' ? formData.meetingLink :
      formData.type === 'PHONE' ? formData.phoneNumber :
      formData.location || '—';

    const locationLabel =
      formData.type === 'VIDEO' ? 'Meeting Link' :
      formData.type === 'PHONE' ? 'Phone Number' :
      'Location';

    return (
      <div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">Review Interview</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">Confirm all details before scheduling.</p>

        {errors.general && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-[2px] text-xs text-red-700 dark:text-red-300">
            {errors.general}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ReviewCard label="Candidate" value={selectedApplication?.applicantName || '—'} sub={selectedApplication ? `${selectedApplication.jobTitle} — ${selectedApplication.department}` : undefined} />
          <ReviewCard label="Interview" value={`${roundLabel} — ${typeLabel}`} />
          <ReviewCard label="Date & Time" value={formData.scheduledAt ? new Date(formData.scheduledAt).toLocaleString() : '—'} sub={`${formData.durationMinutes} minutes`} />
          <ReviewCard label="Interviewers" value={interviewerNames || '—'} />
          <div className="md:col-span-2">
            <ReviewCard label={locationLabel} value={locationDisplay} />
          </div>
          {formData.agenda && (
            <div className="md:col-span-2">
              <ReviewCard label="Agenda" value={formData.agenda} />
            </div>
          )}
          {formData.instructions && (
            <div className="md:col-span-2">
              <ReviewCard label="Candidate Instructions" value={formData.instructions} />
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Render ───────────────────────────────────────────────────────────

  if (loading && interviewId) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cta mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading interview...</p>
        </div>
      </div>
    );
  }

  const steps = interviewId ? WIZARD_STEPS.slice(1) : WIZARD_STEPS;
  const effectiveStep = interviewId ? currentStep - 1 : currentStep;

  const stepContent = [renderCandidateStep, renderSetupStep, renderScheduleStep, renderDetailsStep, renderReviewStep];

  const reviewFooter = (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
      <button
        onClick={handleBack}
        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        &larr; Back
      </button>
      <div className="flex items-center gap-2">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
              Saving...
            </>
          ) : (
            interviewId ? 'Update Interview' : 'Schedule Interview'
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <WizardShell
        steps={steps}
        currentStep={effectiveStep}
        onNext={handleNext}
        onBack={handleBack}
        canProceed={canProceedFromStep(currentStep)}
        title={interviewId ? 'Edit Interview' : 'Schedule Interview'}
        subtitle={selectedApplication ? `${selectedApplication.applicantName} — ${selectedApplication.jobTitle}` : undefined}
        footer={currentStep === 4 || (interviewId && currentStep === 4) ? reviewFooter : undefined}
        onClose={onCancel}
      >
        {stepContent[currentStep]()}
      </WizardShell>
    </div>
  );
}

function ReviewCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-[2px] p-4">
      <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-[0.05em] mb-1">{label}</div>
      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">{value}</div>
      {sub && <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}
