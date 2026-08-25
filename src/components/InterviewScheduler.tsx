'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api-fetch';
import SearchableDropdown from '@/components/SearchableDropdown';
import { useInterviewTypes, useInterviewRounds } from '@/hooks/useLookups';
import WizardShell from '@/components/WizardShell';
import type { WizardStep } from '@/components/WizardShell';
import type { DropdownOption } from '@/components/SearchableDropdown';
import { useToast } from '@/components/Toast';
import { useWizardDraft } from '@/hooks/useWizardDraft';
import { CardSkeleton } from '@/components/LoadingComponents';
import ErrorState from '@/components/ErrorState';

interface InterviewSchedulerProps {
  interviewId?: number;
  applicationId?: string;
  onSuccess?: (interview: InterviewSaveResponse) => void;
  onCancel?: () => void;
  /**
   * Defaults to 'page'. It defaulted to 'modal', which was invisible while every caller passed the
   * prop — and would have rendered an overlay on top of the new routes, which pass nothing.
   * RequisitionForm already defaulted to 'page', which is why /requisitions/new worked and these
   * would not have.
   */
  variant?: 'page' | 'modal';
}

interface Application {
  id: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  jobAdId: string;
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
  // Application ids are UUID strings, like every other id in this component.
  // This was typed `number` and the picker below coerced the selected value
  // with Number(...), which is always NaN for a UUID — and `NaN > 0` is false,
  // so canProceedFromStep(0) never became true and the wizard could not be
  // left. Same defect as the interviewerIds and getActorId comments below.
  applicationId: string;
}

interface InterviewSaveResponse {
  id: number;
  title: string;
  scheduledAt: string;
  application: {
    id: number;
  };
}

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

// The backend's Interview.scheduledAt is a plain LocalDateTime — a naive
// wall-clock string with no timezone ("2026-06-30T09:12:38", never a "Z" or
// offset) — and every backend rule (business hours, 2-hour lead time,
// LocalDateTime.now() comparisons) evaluates it as-is, in whatever local
// time it represents. Round-tripping these through `new Date(x).toISOString()`
// re-expresses the value in UTC, silently shifting it by the browser's
// timezone offset (e.g. SAST, UTC+2, turns an intended 09:12 into a stored
// 07:12) — which either trips the backend's business-hours check (a
// legitimate update gets misreported as 404, see updateInterview's
// catch-all IllegalArgumentException -> notFound() mapping) or, worse,
// silently schedules the interview 2 hours off from what was entered with
// no error at all. Treat these values as plain strings instead.
const toLocalInputValue = (backendDateTime: string): string => backendDateTime.slice(0, 16);
const toBackendDateTime = (localInputValue: string): string =>
  localInputValue.length === 16 ? `${localInputValue}:00` : localInputValue;

const inputClass = (hasError?: boolean) =>
  `w-full p-3 border rounded-[2px] bg-card text-foreground focus:ring-2 focus:ring-ring/40 focus:border-ring focus:outline-none ${hasError ? 'border-destructive' : 'border-border'}`;

const selectClass =
  'w-full p-3 border border-border rounded-[2px] bg-card text-foreground focus:ring-2 focus:ring-ring/40 focus:border-ring focus:outline-none';

const labelClass = 'block text-xs font-semibold text-muted-foreground uppercase tracking-[0.05em] mb-1.5';

const DEFAULT_INTERVIEW_DATA: InterviewData = {
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
  applicationId: '',
};

export default function InterviewScheduler({ interviewId, applicationId: prefilledApplicationId, onSuccess, onCancel, variant = 'page' }: InterviewSchedulerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { interviewTypes: INTERVIEW_TYPES } = useInterviewTypes();
  const { interviewRounds: INTERVIEW_ROUNDS } = useInterviewRounds();
  const skipCandidateStep = !!prefilledApplicationId;
  const [currentStep, setCurrentStep] = useState(interviewId || skipCandidateStep ? 1 : 0);
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [formData, setFormData] = useState<InterviewData>({
    ...DEFAULT_INTERVIEW_DATA,
    applicationId: prefilledApplicationId || '',
  });

  const draft = useWizardDraft(formData, {
    wizardType: 'interview',
    entityId: interviewId,
    initialData: { ...DEFAULT_INTERVIEW_DATA, applicationId: prefilledApplicationId || '' },
    currentStep,
    enabled: !interviewId,
    onDraftRestored: (data, step) => {
      setFormData(data);
      setCurrentStep(step);
    },
  });

  useEffect(() => {
    if (draft.draftRestored) {
      toast('Draft restored', 'info', {
        label: 'Discard',
        onClick: () => {
          setFormData({ ...DEFAULT_INTERVIEW_DATA, applicationId: prefilledApplicationId || '' });
          setCurrentStep(skipCandidateStep ? 1 : 0);
          draft.discardDraft();
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.draftRestored]);

  const [applications, setApplications] = useState<Application[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [availability, setAvailability] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // user.id is a UUID string (DynamoDB single-table id), not a numeric id —
  // Number(user?.id) always evaluated to NaN here, so this blocked every
  // interview create/update for every user with "Unable to identify current
  // user". Both /api/interviews createdBy/updatedBy params are plain
  // Strings on the backend, so there was never a reason to coerce this.
  const getActorId = useCallback((): string | null => {
    const actorId = user?.id;
    if (!actorId) {
      setErrors((prev) => ({ ...prev, general: 'Unable to identify current user. Please sign in again.' }));
      return null;
    }
    return actorId;
  }, [user]);

  const interviewerOptions: DropdownOption[] = useMemo(() => {
    return interviewers.map((i) => ({ value: String(i.id), label: i.name, description: i.role }));
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
          scheduledAt: toLocalInputValue(data.scheduledAt),
          applicationId: data.application?.id ?? '',
          // The backend has no interviewerIds array — it stores a single
          // interviewerId plus additionalInterviewers as a comma-separated
          // string of *names* (see handleSubmit below), which can't be
          // reliably resolved back to ids. Without this, interviewerIds
          // stays undefined after loading an existing interview (the
          // DEFAULT_INTERVIEW_DATA's [] only applies before this spread
          // overwrites it), and every .length read on it throughout this
          // component throws. At minimum, preserve the primary interviewer.
          interviewerIds: data.interviewerId != null ? [String(data.interviewerId)] : [],
        });

        // loadApplications() only ever loads SCREENING-stage candidates for
        // the "create new interview" picker. By the time an interview
        // exists to edit, its application has usually moved past that
        // stage (e.g. INTERVIEW, OFFER), so it's simply absent from that
        // list — selectedApplication then never resolves, and the Review
        // step's Candidate field silently shows "—" even though the
        // interview genuinely has one. Fetch this specific application
        // directly so it's always resolvable regardless of its current
        // status, and merge it in rather than replacing the list.
        const applicationId = data.application?.id;
        if (applicationId) {
          try {
            const appResponse = await apiFetch(`/api/applications/${applicationId}`);
            if (appResponse.ok) {
              const appData = await appResponse.json();
              setApplications((prev) => (prev.some((a) => a.id === appData.id) ? prev : [...prev, appData]));
            }
          } catch (err) {
            console.error('Error loading interview application:', err);
          }
        }
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
    if (formData.applicationId && formData.round) {
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
    // interviewerIds holds UUID strings (see interviewerOptions above) —
    // Number(...) on one of these is always NaN, which sent every
    // availability/suggestion request to ".../interviewer/NaN". Use the id
    // as-is; it's a path segment, not a number.
    const primaryInterviewerId = formData.interviewerIds[0];
    if (!formData.scheduledAt || !primaryInterviewerId) return;

    try {
      setCheckingAvailability(true);
      const startTime = toBackendDateTime(formData.scheduledAt);

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
    // GET /api/interviews/suggestions/interviewer/{id} returns a plain
    // List<LocalDateTime> — naive wall-clock strings with no timezone, same
    // as scheduledAt everywhere else (see toLocalInputValue above). Take it
    // as-is rather than parsing through Date/toISOString, which would
    // incorrectly reinterpret it as a UTC instant and shift it by the
    // browser's offset.
    handleInputChange('scheduledAt', toLocalInputValue(suggestedTime));
  };

  // ── Per-step validation ──────────────────────────────────────────────

  // Returns why the current scheduledAt fails the weekday/business-hours/
  // lead-time rule, or null if it's fine. The Next button used to just go
  // disabled with nothing but the static amber hint paragraph to explain
  // why — indistinguishable from "nothing I pick ever works". This gives
  // a specific, live reason instead.
  const getScheduleError = (): string | null => {
    if (!formData.scheduledAt) return null; // handled separately as "required"
    const d = new Date(formData.scheduledAt);
    if (isNaN(d.getTime())) return 'Enter a valid date and time';
    const day = d.getDay();
    if (day === 0 || day === 6) return 'Interviews can only be scheduled on a weekday (Monday–Friday)';
    const hour = d.getHours();
    if (hour < 8 || hour >= 18) return 'Interview time must be between 08:00 and 18:00';
    const hoursAhead = (d.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursAhead < 2) return 'Interviews must be scheduled at least 2 hours from now';
    return null;
  };

  const canProceedFromStep = (step: number): boolean => {
    switch (step) {
      case 0: return !!formData.applicationId;
      case 1: return !!formData.round && !!formData.type && formData.interviewerIds.length > 0;
      case 2: {
        if (!formData.scheduledAt) return false;
        if (formData.durationMinutes < 15 || formData.durationMinutes > 480) return false;
        if (getScheduleError()) return false;
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

      // interviewerIds holds UUID strings — Number(...) on one of these is
      // always NaN, which JSON.stringify then always serializes as null.
      // That's exactly why every update/create silently saved with no
      // interviewer attached, and (worse) why validateInterviewScheduling's
      // isInterviewerAvailable(null, ...) call could itself throw, which the
      // controller's catch-all reports back as a plain 404.
      const primaryInterviewerId = formData.interviewerIds[0] ?? null;

      const additionalIds = formData.interviewerIds.slice(1);

      const submitData = {
        title: formData.title,
        type: formData.type,
        round: formData.round,
        scheduledAt: toBackendDateTime(formData.scheduledAt),
        durationMinutes: formData.durationMinutes,
        location: formData.location || null,
        meetingLink: formData.meetingLink || null,
        phoneNumber: formData.phoneNumber || null,
        meetingRoom: formData.meetingRoom || null,
        instructions: formData.instructions || null,
        agenda: formData.agenda || null,
        interviewerId: primaryInterviewerId,
        additionalInterviewers: additionalIds.length > 0
          ? additionalIds.map((id) => interviewerOptions.find((o) => o.value === id)?.label).filter(Boolean).join(', ')
          : null,
        applicationId: formData.applicationId,
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
        draft.clearDraft();
        toast('Interview scheduled successfully', 'success');
        onSuccess?.(result);
      } else {
        let errorMessage = 'Failed to save interview';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // Response body may be empty on 400
        }
        setErrors({ general: errorMessage });
        toast('Failed to save interview', 'error');
      }
    } catch (error) {
      console.error('Error saving interview:', error);
      setErrors({ general: 'An error occurred while saving' });
      toast('Failed to save interview', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Step renderers ───────────────────────────────────────────────────

  const renderCandidateStep = () => (
    <div>
      <h3 className="text-sm font-bold text-foreground mb-1">Select Candidate</h3>
      <p className="text-xs text-muted-foreground mb-5">Search for the application you want to schedule an interview for.</p>

      <SearchableDropdown
        label="Application"
        required
        options={applicationOptions}
        value={formData.applicationId ? [formData.applicationId] : []}
        onChange={(vals) => handleInputChange('applicationId', vals.length > 0 ? vals[0] : '')}
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
      <h3 className="text-sm font-bold text-foreground mb-1">Interview Setup</h3>
      <p className="text-xs text-muted-foreground mb-5">Configure the interview round, type, and panel.</p>

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
        <p className="text-[10px] text-muted-foreground mt-1">Auto-populated from round and job title</p>
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

  const renderScheduleStep = () => {
    const scheduleError = getScheduleError();
    return (
    <div>
      <h3 className="text-sm font-bold text-foreground mb-1">Date and Time</h3>
      <p className="text-xs text-muted-foreground mb-5">Choose when the interview will take place. Availability is checked automatically.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="scheduled-at" className={labelClass}>Date &amp; Time *</label>
          <input
            type="datetime-local"
            id="scheduled-at"
            value={formData.scheduledAt}
            onChange={(e) => handleInputChange('scheduledAt', e.target.value)}
            onBlur={checkAvailability}
            className={inputClass(!!errors.scheduledAt || !!scheduleError)}
          />
          {scheduleError && <p className="text-red-500 text-xs mt-1">{scheduleError}</p>}
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
                className="px-3 py-1.5 bg-card border border-border rounded-full text-xs font-medium text-foreground hover:bg-accent transition-colors"
              >
                {new Date(time).toLocaleString()}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
    );
  };

  const renderDetailsStep = () => (
    <div>
      <h3 className="text-sm font-bold text-foreground mb-1">Interview Details</h3>
      <p className="text-xs text-muted-foreground mb-5">Add location, agenda, and candidate instructions.</p>

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
        <h3 className="text-sm font-bold text-foreground mb-1">Review Interview</h3>
        <p className="text-xs text-muted-foreground mb-5">Confirm all details before scheduling.</p>

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
    return <CardSkeleton count={2} />;
  }

  const steps = interviewId ? WIZARD_STEPS.slice(1) : WIZARD_STEPS;
  const effectiveStep = interviewId ? currentStep - 1 : currentStep;

  const stepContent = [renderCandidateStep, renderSetupStep, renderScheduleStep, renderDetailsStep, renderReviewStep];

  const reviewFooter = (
    <div className="flex items-center justify-between px-6 py-4 border-t border-border">
      <button
        onClick={handleBack}
        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-muted-foreground border border-border rounded-full hover:bg-accent transition-colors"
      >
        &larr; Back
      </button>
      <div className="flex items-center gap-2">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold btn-cta rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
    <WizardShell
      steps={steps}
      currentStep={effectiveStep}
      onNext={handleNext}
      onBack={handleBack}
      canProceed={canProceedFromStep(currentStep)}
      title={interviewId ? 'Edit Interview' : 'Schedule Interview'}
      subtitle={selectedApplication ? `${selectedApplication.applicantName} — ${selectedApplication.jobTitle}` : undefined}
      footer={currentStep === 4 || (interviewId && currentStep === 4) ? reviewFooter : undefined}
      variant={variant}
      onClose={onCancel}
      statusIndicator={draft.statusText || undefined}
    >
      {stepContent[currentStep]()}
    </WizardShell>
  );
}

function ReviewCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-muted/50 border border-border rounded-[2px] p-4">
      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.05em] mb-1">{label}</div>
      <div className="text-sm font-semibold text-foreground break-words">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}
