'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api-fetch';
import { useDepartments } from '@/hooks/useDepartments';
import AiAssistPanel from '@/components/ai/AiAssistPanel';
import AiJobDescriptionWriter from '@/components/ai/AiJobDescriptionWriter';
import { JobDescriptionResult } from '@/types/ai';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import WizardShell, { WizardStep } from '@/components/WizardShell';

interface JobPostingFormProps {
  jobPostingId?: string | number;
  currentUserId?: string | number | null;
  onSuccess?: (jobPosting: { id: string | number; title: string; status: string }) => void;
  onCancel?: () => void;
}

interface CheckType {
  code: string;
  name: string;
  description: string;
  turnaround: string;
  price: number;
  currency: string;
}

interface JobPostingData {
  id?: number;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  experienceLevel: string;
  description: string;
  requirements: string;
  responsibilities: string;
  qualifications: string;
  benefits: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  remoteWorkAllowed: boolean;
  travelRequired: boolean;
  applicationDeadline?: string;
  positionsAvailable: number;
  internalNotes: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  featured: boolean;
  urgent: boolean;
  requiredCheckTypes: string[];
  enforceCheckCompletion: boolean;
}

const EMPLOYMENT_TYPES = [
  { value: 'FULL_TIME', label: 'Full-time' },
  { value: 'PART_TIME', label: 'Part-time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'TEMPORARY', label: 'Temporary' },
  { value: 'FREELANCE', label: 'Freelance' },
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'APPRENTICESHIP', label: 'Apprenticeship' },
  { value: 'VOLUNTEER', label: 'Volunteer' },
];

const EXPERIENCE_LEVELS = [
  { value: 'ENTRY_LEVEL', label: 'Entry Level (0-2 years)' },
  { value: 'JUNIOR', label: 'Junior (1-3 years)' },
  { value: 'MID_LEVEL', label: 'Mid-Level (3-6 years)' },
  { value: 'SENIOR', label: 'Senior (6-10 years)' },
  { value: 'LEAD', label: 'Lead (8+ years)' },
  { value: 'EXECUTIVE', label: 'Executive (10+ years)' },
  { value: 'EXPERT', label: 'Expert (15+ years)' },
];

const WIZARD_STEPS: WizardStep[] = [
  { id: 'basic', label: 'Basics', description: 'Position details' },
  { id: 'details', label: 'Details', description: 'Description and requirements' },
  { id: 'compensation', label: 'Compensation', description: 'Salary range', skippable: true },
  { id: 'verification', label: 'Verification', description: 'Background checks', skippable: true },
  { id: 'seo', label: 'SEO & Notes', description: 'Search and internal notes', skippable: true },
  { id: 'review', label: 'Review', description: 'Review and submit' },
];

const inputClass =
  'w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-[2px] bg-white dark:bg-charcoal text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary/30 focus:border-primary';

const errorInputClass =
  'w-full px-3 py-2 text-sm border border-red-300 dark:border-red-500 rounded-[2px] bg-white dark:bg-charcoal text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-300 focus:border-red-400';

const labelClass =
  'block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-[0.05em] mb-1.5';

export default function JobPostingForm({ jobPostingId, currentUserId, onSuccess, onCancel }: JobPostingFormProps) {
  const { user } = useAuth();
  const { departments: DEPARTMENTS } = useDepartments();
  const [formData, setFormData] = useState<JobPostingData>({
    title: '',
    department: '',
    location: '',
    employmentType: 'FULL_TIME',
    experienceLevel: 'MID_LEVEL',
    description: '',
    requirements: '',
    responsibilities: '',
    qualifications: '',
    benefits: '',
    salaryCurrency: 'ZAR',
    remoteWorkAllowed: false,
    travelRequired: false,
    positionsAvailable: 1,
    internalNotes: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    featured: false,
    urgent: false,
    requiredCheckTypes: [],
    enforceCheckCompletion: false,
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [availableCheckTypes, setAvailableCheckTypes] = useState<CheckType[]>([]);
  const [checkTypesLoading, setCheckTypesLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const actorId = useMemo(() => {
    if (currentUserId) return String(currentUserId);
    return user?.id || null;
  }, [currentUserId, user?.id]);

  const loadJobPosting = useCallback(async () => {
    if (!jobPostingId) return;
    try {
      setLoading(true);
      const response = await apiFetch(`/api/job-postings/${jobPostingId}`);
      if (response.ok) {
        const data = await response.json();
        let parsedCheckTypes: string[] = [];
        if (data.requiredCheckTypes) {
          try { parsedCheckTypes = JSON.parse(data.requiredCheckTypes); } catch { /* ignore */ }
        }
        setFormData({
          ...data,
          applicationDeadline: data.applicationDeadline
            ? new Date(data.applicationDeadline).toISOString().slice(0, 16) : '',
          salaryMin: data.salaryMin || undefined,
          salaryMax: data.salaryMax || undefined,
          requiredCheckTypes: parsedCheckTypes,
          enforceCheckCompletion: data.enforceCheckCompletion || false,
        });
      }
    } catch (error) {
      console.error('Error loading job posting:', error);
    } finally {
      setLoading(false);
    }
  }, [jobPostingId]);

  useEffect(() => {
    if (jobPostingId) loadJobPosting();
  }, [jobPostingId, loadJobPosting]);

  useEffect(() => {
    async function loadCheckTypes() {
      setCheckTypesLoading(true);
      try {
        const response = await apiFetch('/api/background-checks/check-types');
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) setAvailableCheckTypes(data);
        }
      } catch {
        // Feature gate may block this
      } finally {
        setCheckTypesLoading(false);
      }
    }
    loadCheckTypes();
  }, []);

  const handleInputChange = <K extends keyof JobPostingData>(field: K, value: JobPostingData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAiDescriptionApply = useCallback((result: JobDescriptionResult) => {
    setFormData(prev => ({
      ...prev,
      description: result.intro,
      responsibilities: result.responsibilities.join('\n'),
      requirements: result.requirements.join('\n'),
      benefits: result.benefits.join('\n'),
    }));
    setErrors(prev => {
      const next = { ...prev };
      delete next.description;
      return next;
    });
  }, []);

  const canProceedFromStep = (step: number): boolean => {
    switch (step) {
      case 0: // Basic
        return !!(formData.title.trim() && formData.department.trim());
      case 1: // Details
        return !!(formData.description.trim() && formData.description.length >= 100);
      case 2: // Compensation
        return !(formData.salaryMin && formData.salaryMax && formData.salaryMin > formData.salaryMax);
      case 3: // Verification
        return true;
      case 4: // SEO
        return !(formData.seoTitle && formData.seoTitle.length > 60) &&
          !(formData.seoDescription && formData.seoDescription.length > 160);
      case 5: // Review
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSubmit = async () => {
    if (!actorId) {
      setErrors({ general: 'Unable to determine the signed-in user for audit tracking. Please sign in again.' });
      return;
    }

    setLoading(true);

    const submitData = {
      ...formData,
      applicationDeadline: formData.applicationDeadline
        ? new Date(formData.applicationDeadline).toISOString() : null,
      requiredCheckTypes: formData.requiredCheckTypes.length > 0
        ? JSON.stringify(formData.requiredCheckTypes) : null,
    };

    const actorParam = jobPostingId ? `updatedBy=${actorId}` : `createdBy=${actorId}`;
    const url = jobPostingId
      ? `/api/job-postings/${jobPostingId}?${actorParam}`
      : `/api/job-postings?${actorParam}`;
    const method = jobPostingId ? 'PUT' : 'POST';

    try {
      const response = await apiFetch(url, {
        method,
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        const result = await response.json();
        if (onSuccess) onSuccess(result);
      } else {
        const errorData = await response.json();
        setErrors({ general: errorData.message || 'Failed to save job posting' });
      }
    } catch (error) {
      console.error('Error saving job posting:', error);
      setErrors({ general: 'An error occurred while saving' });
    } finally {
      setLoading(false);
    }
  };

  const employmentLabel = EMPLOYMENT_TYPES.find(t => t.value === formData.employmentType)?.label || formData.employmentType;
  const experienceLabel = EXPERIENCE_LEVELS.find(l => l.value === formData.experienceLevel)?.label || formData.experienceLevel;

  const checkboxClass =
    'flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-[2px] cursor-pointer hover:bg-off-white dark:hover:bg-gray-800 transition-colors';

  const renderBasicStep = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="job-title" className={labelClass}>Job Title *</label>
          <input
            type="text"
            id="job-title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            aria-required="true"
            aria-invalid={!!errors.title}
            className={errors.title ? errorInputClass : inputClass}
            placeholder="e.g. Senior Software Engineer"
          />
          {errors.title && <p role="alert" className="mt-1 text-xs text-red-600">{errors.title}</p>}
        </div>

        <div>
          <label htmlFor="job-department" className={labelClass}>Department *</label>
          <select
            id="job-department"
            value={formData.department}
            onChange={(e) => handleInputChange('department', e.target.value)}
            aria-required="true"
            aria-invalid={!!errors.department}
            className={errors.department ? errorInputClass : inputClass}
          >
            <option value="">Select Department</option>
            {(formData.department && !DEPARTMENTS.includes(formData.department)
              ? [formData.department, ...DEPARTMENTS]
              : DEPARTMENTS
            ).map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          {errors.department && <p role="alert" className="mt-1 text-xs text-red-600">{errors.department}</p>}
        </div>

        <div>
          <label className={labelClass}>Location</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            className={inputClass}
            placeholder="e.g. Cape Town, South Africa"
          />
        </div>

        <div>
          <label htmlFor="positions-available" className={labelClass}>Positions Available *</label>
          <input
            type="number"
            id="positions-available"
            min="1"
            value={formData.positionsAvailable}
            onChange={(e) => {
              const parsed = Number.parseInt(e.target.value, 10);
              handleInputChange('positionsAvailable', Number.isNaN(parsed) ? 0 : parsed);
            }}
            aria-required="true"
            aria-invalid={!!errors.positionsAvailable}
            className={errors.positionsAvailable ? errorInputClass : inputClass}
          />
          {errors.positionsAvailable && <p role="alert" className="mt-1 text-xs text-red-600">{errors.positionsAvailable}</p>}
        </div>

        <div>
          <label htmlFor="employment-type" className={labelClass}>Employment Type *</label>
          <select
            id="employment-type"
            value={formData.employmentType}
            onChange={(e) => handleInputChange('employmentType', e.target.value)}
            aria-required="true"
            className={inputClass}
          >
            {EMPLOYMENT_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="experience-level" className={labelClass}>Experience Level *</label>
          <select
            id="experience-level"
            value={formData.experienceLevel}
            onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
            aria-required="true"
            className={inputClass}
          >
            {EXPERIENCE_LEVELS.map(level => (
              <option key={level.value} value={level.value}>{level.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Application Deadline</label>
        <input
          type="datetime-local"
          value={formData.applicationDeadline}
          onChange={(e) => handleInputChange('applicationDeadline', e.target.value)}
          className={inputClass}
        />
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-[0.05em]">Leave empty for no deadline</p>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <label className={checkboxClass}>
          <input
            type="checkbox"
            checked={formData.remoteWorkAllowed}
            onChange={(e) => handleInputChange('remoteWorkAllowed', e.target.checked)}
            className="mr-2 h-4 w-4 text-primary border-gray-300 dark:border-gray-600 rounded-[2px] focus:ring-primary/30"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Remote work allowed</span>
        </label>

        <label className={checkboxClass}>
          <input
            type="checkbox"
            checked={formData.travelRequired}
            onChange={(e) => handleInputChange('travelRequired', e.target.checked)}
            className="mr-2 h-4 w-4 text-primary border-gray-300 dark:border-gray-600 rounded-[2px] focus:ring-primary/30"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Travel required</span>
        </label>

        <label className={checkboxClass}>
          <input
            type="checkbox"
            checked={formData.featured}
            onChange={(e) => handleInputChange('featured', e.target.checked)}
            className="mr-2 h-4 w-4 text-primary border-gray-300 dark:border-gray-600 rounded-[2px] focus:ring-primary/30"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Featured position</span>
        </label>

        <label className={checkboxClass}>
          <input
            type="checkbox"
            checked={formData.urgent}
            onChange={(e) => handleInputChange('urgent', e.target.checked)}
            className="mr-2 h-4 w-4 text-primary border-gray-300 dark:border-gray-600 rounded-[2px] focus:ring-primary/30"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Urgent hiring</span>
        </label>
      </div>
    </div>
  );

  const renderDetailsStep = () => (
    <div className="space-y-5">
      <AiAssistPanel title="Generate with AI" feature="AI_JOB_DESCRIPTION" description="Auto-generate description, responsibilities, requirements, and benefits from the job title and department">
        <AiJobDescriptionWriter
          initialTitle={formData.title}
          initialDepartment={formData.department}
          onApply={handleAiDescriptionApply}
        />
      </AiAssistPanel>

      <div>
        <label htmlFor="job-description" className={labelClass}>Job Description *</label>
        <textarea
          id="job-description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={6}
          aria-required="true"
          aria-invalid={!!errors.description}
          className={errors.description ? errorInputClass : inputClass}
          placeholder="Provide a detailed description of the role..."
        />
        <div className="flex justify-between mt-1">
          {errors.description && <p role="alert" className="text-xs text-red-600">{errors.description}</p>}
          <p className="text-[10px] text-gray-400 dark:text-gray-500 ml-auto uppercase tracking-[0.05em]">
            {formData.description.length} characters (minimum 100)
          </p>
        </div>
      </div>

      <div>
        <label className={labelClass}>Key Responsibilities</label>
        <textarea
          value={formData.responsibilities}
          onChange={(e) => handleInputChange('responsibilities', e.target.value)}
          rows={4}
          className={inputClass}
          placeholder="List the main responsibilities and duties..."
        />
      </div>

      <div>
        <label className={labelClass}>Requirements</label>
        <textarea
          value={formData.requirements}
          onChange={(e) => handleInputChange('requirements', e.target.value)}
          rows={4}
          className={inputClass}
          placeholder="List the essential requirements, skills, and experience..."
        />
      </div>

      <div>
        <label className={labelClass}>Qualifications</label>
        <textarea
          value={formData.qualifications}
          onChange={(e) => handleInputChange('qualifications', e.target.value)}
          rows={3}
          className={inputClass}
          placeholder="Educational qualifications, certifications..."
        />
      </div>

      <div>
        <label className={labelClass}>Benefits & Perks</label>
        <textarea
          value={formData.benefits}
          onChange={(e) => handleInputChange('benefits', e.target.value)}
          rows={3}
          className={inputClass}
          placeholder="List the benefits, perks, and what makes this opportunity attractive..."
        />
      </div>
    </div>
  );

  const renderCompensationStep = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="salary-min" className={labelClass}>Minimum Salary</label>
          <input
            type="number"
            id="salary-min"
            min="0"
            step="1000"
            value={formData.salaryMin || ''}
            onChange={(e) => handleInputChange('salaryMin', e.target.value ? parseFloat(e.target.value) : undefined)}
            className={inputClass}
            placeholder="e.g. 50000"
          />
        </div>

        <div>
          <label htmlFor="salary-max" className={labelClass}>Maximum Salary</label>
          <input
            type="number"
            id="salary-max"
            min="0"
            step="1000"
            value={formData.salaryMax || ''}
            onChange={(e) => handleInputChange('salaryMax', e.target.value ? parseFloat(e.target.value) : undefined)}
            aria-invalid={!!errors.salaryMax}
            className={errors.salaryMax ? errorInputClass : inputClass}
            placeholder="e.g. 80000"
          />
          {errors.salaryMax && <p role="alert" className="mt-1 text-xs text-red-600">{errors.salaryMax}</p>}
        </div>

        <div>
          <label htmlFor="salary-currency" className={labelClass}>Currency</label>
          <select
            id="salary-currency"
            value={formData.salaryCurrency}
            onChange={(e) => handleInputChange('salaryCurrency', e.target.value)}
            className={inputClass}
          >
            <option value="ZAR">ZAR (South African Rand)</option>
            <option value="USD">USD (US Dollar)</option>
            <option value="EUR">EUR (Euro)</option>
            <option value="GBP">GBP (British Pound)</option>
          </select>
        </div>
      </div>

      <div className="bg-off-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-[2px] p-4">
        <div className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-[0.05em] mb-1">Salary Range Preview</div>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {formData.salaryMin || formData.salaryMax ? (
            <>
              {formData.salaryMin && formData.salaryMax
                ? `${formData.salaryCurrency} ${formData.salaryMin.toLocaleString()} – ${formData.salaryMax.toLocaleString()}`
                : formData.salaryMin
                  ? `${formData.salaryCurrency} ${formData.salaryMin.toLocaleString()}+`
                  : `Up to ${formData.salaryCurrency} ${formData.salaryMax?.toLocaleString()}`
              } per annum
            </>
          ) : (
            'Salary negotiable'
          )}
        </p>
      </div>
    </div>
  );

  const renderVerificationStep = () => (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Required Verification Checks</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Select the background checks that must be completed for candidates applying to this role.
        </p>
      </div>

      {checkTypesLoading ? (
        <div className="flex items-center justify-center py-8 text-gray-500 dark:text-gray-400 text-sm">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cta mr-2" />
          Loading check types...
        </div>
      ) : availableCheckTypes.length === 0 ? (
        <div className="bg-off-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-[2px] p-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Background checks feature is not available for your account.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {availableCheckTypes.map(ct => {
              const isSelected = formData.requiredCheckTypes.includes(ct.code);
              return (
                <label
                  key={ct.code}
                  className={`flex items-start p-3 rounded-[2px] border cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-primary/5 border-primary/30'
                      : 'bg-white dark:bg-charcoal border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {
                      setFormData(prev => ({
                        ...prev,
                        requiredCheckTypes: isSelected
                          ? prev.requiredCheckTypes.filter(c => c !== ct.code)
                          : [...prev.requiredCheckTypes, ct.code],
                      }));
                    }}
                    className="mt-0.5 h-4 w-4 text-primary border-gray-300 dark:border-gray-600 rounded-[2px] focus:ring-primary/30"
                  />
                  <div className="ml-3 flex-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{ct.name}</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{ct.description}</p>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">{ct.turnaround}</span>
                      <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">
                        R{ct.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          {formData.requiredCheckTypes.length > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-[2px] px-4 py-3">
              <span className="text-sm text-primary">
                {formData.requiredCheckTypes.length} check{formData.requiredCheckTypes.length > 1 ? 's' : ''} required for this role
              </span>
            </div>
          )}

          <div className="bg-off-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-[2px] p-4">
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={formData.enforceCheckCompletion}
                onChange={(e) => handleInputChange('enforceCheckCompletion', e.target.checked)}
                className="mt-0.5 h-4 w-4 text-primary border-gray-300 dark:border-gray-600 rounded-[2px] focus:ring-primary/30"
              />
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Enforce check completion
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  When enabled, candidates cannot progress past the Background Check pipeline stage
                  until all required checks are completed with a CLEAR result.
                </p>
              </div>
            </label>
          </div>
        </>
      )}
    </div>
  );

  const renderSeoStep = () => (
    <div className="space-y-5">
      <div>
        <label htmlFor="seo-title" className={labelClass}>SEO Title</label>
        <input
          type="text"
          id="seo-title"
          maxLength={60}
          value={formData.seoTitle}
          onChange={(e) => handleInputChange('seoTitle', e.target.value)}
          aria-invalid={!!errors.seoTitle}
          className={errors.seoTitle ? errorInputClass : inputClass}
          placeholder="Custom title for search engines (optional)"
        />
        <div className="flex justify-between mt-1">
          {errors.seoTitle && <p role="alert" className="text-xs text-red-600">{errors.seoTitle}</p>}
          <p className="text-[10px] text-gray-400 dark:text-gray-500 ml-auto uppercase tracking-[0.05em]">
            {formData.seoTitle.length}/60
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="seo-description" className={labelClass}>SEO Description</label>
        <textarea
          id="seo-description"
          maxLength={160}
          value={formData.seoDescription}
          onChange={(e) => handleInputChange('seoDescription', e.target.value)}
          rows={3}
          aria-invalid={!!errors.seoDescription}
          className={errors.seoDescription ? errorInputClass : inputClass}
          placeholder="Brief description for search engines (optional)"
        />
        <div className="flex justify-between mt-1">
          {errors.seoDescription && <p role="alert" className="text-xs text-red-600">{errors.seoDescription}</p>}
          <p className="text-[10px] text-gray-400 dark:text-gray-500 ml-auto uppercase tracking-[0.05em]">
            {formData.seoDescription.length}/160
          </p>
        </div>
      </div>

      <div>
        <label className={labelClass}>SEO Keywords</label>
        <input
          type="text"
          value={formData.seoKeywords}
          onChange={(e) => handleInputChange('seoKeywords', e.target.value)}
          className={inputClass}
          placeholder="Comma-separated keywords for search optimization"
        />
      </div>

      <div>
        <label className={labelClass}>Internal Notes</label>
        <textarea
          value={formData.internalNotes}
          onChange={(e) => handleInputChange('internalNotes', e.target.value)}
          rows={3}
          className={inputClass}
          placeholder="Internal notes for hiring team (not visible to applicants)"
        />
      </div>
    </div>
  );

  const renderReviewStep = () => {
    const flags = [
      formData.remoteWorkAllowed && 'Remote',
      formData.travelRequired && 'Travel Required',
      formData.featured && 'Featured',
      formData.urgent && 'Urgent',
    ].filter(Boolean);

    return (
      <div className="space-y-6">
        {errors.general && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-[2px] p-3 text-sm text-red-700 dark:text-red-400">
            {errors.general}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <ReviewCard label="Job Title" value={formData.title} />
          <ReviewCard label="Department" value={formData.department} />
          <ReviewCard label="Location" value={formData.location || 'Not specified'} />
          <ReviewCard label="Employment Type" value={employmentLabel} />
          <ReviewCard label="Experience Level" value={experienceLabel} />
          <ReviewCard label="Positions" value={String(formData.positionsAvailable)} />
          <ReviewCard
            label="Salary"
            value={
              formData.salaryMin || formData.salaryMax
                ? `${formData.salaryCurrency} ${formData.salaryMin?.toLocaleString() || '—'} – ${formData.salaryMax?.toLocaleString() || '—'}`
                : 'Negotiable'
            }
          />
          <ReviewCard label="Deadline" value={formData.applicationDeadline ? new Date(formData.applicationDeadline).toLocaleDateString() : 'No deadline'} />
          <ReviewCard label="Checks Required" value={formData.requiredCheckTypes.length > 0 ? `${formData.requiredCheckTypes.length} check(s)` : 'None'} />
        </div>

        {flags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {flags.map(flag => (
              <span key={flag as string} className="inline-block px-2 py-1 text-[10px] font-medium uppercase tracking-[0.05em] bg-cta/10 text-cta border border-cta/20 rounded-[2px]">
                {flag}
              </span>
            ))}
          </div>
        )}

        {formData.description && (
          <div className="bg-off-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-[2px] p-4">
            <div className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-[0.05em] mb-2">
              Description Preview
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap line-clamp-6">
              {formData.description}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: return renderBasicStep();
      case 1: return renderDetailsStep();
      case 2: return renderCompensationStep();
      case 3: return renderVerificationStep();
      case 4: return renderSeoStep();
      case 5: return renderReviewStep();
      default: return null;
    }
  };

  const reviewFooter = currentStep === WIZARD_STEPS.length - 1 ? (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
      <button
        onClick={handleBack}
        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <ArrowLeftIcon className="w-3.5 h-3.5" />
        Back
      </button>
      <div className="flex items-center gap-2">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold bg-cta text-deep-navy rounded-full hover:bg-cta/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-deep-navy" />
              Saving...
            </>
          ) : (
            jobPostingId ? 'Update Job Posting' : 'Create Job Posting'
          )}
        </button>
      </div>
    </div>
  ) : undefined;

  if (loading && jobPostingId) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cta mx-auto mb-4" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading job posting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <WizardShell
        steps={WIZARD_STEPS}
        currentStep={currentStep}
        onNext={handleNext}
        onBack={handleBack}
        onSkip={handleSkip}
        canProceed={canProceedFromStep(currentStep)}
        title={jobPostingId ? 'Edit Job Posting' : 'Create Job Posting'}
        subtitle={jobPostingId ? 'Update job posting details and requirements' : 'Create a new job posting with detailed requirements'}
        footer={reviewFooter}
      >
        {renderStepContent()}
      </WizardShell>
    </div>
  );
}

function ReviewCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-off-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-[2px] p-3">
      <div className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-[0.05em] mb-1">
        {label}
      </div>
      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
        {value}
      </div>
    </div>
  );
}
