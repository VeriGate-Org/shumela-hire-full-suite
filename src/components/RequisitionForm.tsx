'use client';

import React, { useState } from 'react';
import { apiFetch } from '@/lib/api-fetch';
import { useToast } from '@/components/Toast';
import { useDepartments } from '@/hooks/useDepartments';
import { ArrowLeftIcon, DocumentTextIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import WizardShell, { WizardStep } from '@/components/WizardShell';

interface RequisitionFormData {
  jobTitle: string;
  department: string;
  location: string;
  employmentType: string;
  salaryMin: string;
  salaryMax: string;
  description: string;
}

interface FormErrors {
  jobTitle?: string;
  department?: string;
  location?: string;
  employmentType?: string;
  salaryMin?: string;
  salaryMax?: string;
  description?: string;
}

interface RequisitionFormProps {
  onSaveDraft?: (data: RequisitionFormData) => void;
  onSubmitForApproval?: (data: RequisitionFormData) => void;
  initialData?: Partial<RequisitionFormData>;
  onSuccess?: (requisition: unknown) => void;
}

const WIZARD_STEPS: WizardStep[] = [
  { id: 'role', label: 'Role', description: 'Position details' },
  { id: 'compensation', label: 'Compensation', description: 'Salary range', skippable: true },
  { id: 'description', label: 'Description', description: 'Job description' },
  { id: 'review', label: 'Review', description: 'Review and submit' },
];

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

const inputClass =
  'w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-[2px] bg-white dark:bg-charcoal text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary/30 focus:border-primary';

const labelClass =
  'block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-[0.05em] mb-1.5';

const errorInputClass =
  'w-full px-3 py-2 text-sm border border-red-300 dark:border-red-500 rounded-[2px] bg-white dark:bg-charcoal text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-300 focus:border-red-400';

const RequisitionForm: React.FC<RequisitionFormProps> = ({
  onSaveDraft,
  onSubmitForApproval,
  initialData = {},
  onSuccess,
}) => {
  const { toast } = useToast();
  const { departments } = useDepartments();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<RequisitionFormData>({
    jobTitle: initialData.jobTitle || '',
    department: initialData.department || '',
    location: initialData.location || '',
    employmentType: initialData.employmentType || '',
    salaryMin: initialData.salaryMin || '',
    salaryMax: initialData.salaryMax || '',
    description: initialData.description || '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateSalary = (): FormErrors => {
    const salaryErrors: FormErrors = {};
    const salaryMin = parseFloat(formData.salaryMin);
    const salaryMax = parseFloat(formData.salaryMax);

    if (formData.salaryMin && (isNaN(salaryMin) || salaryMin < 0)) {
      salaryErrors.salaryMin = 'Minimum salary must be a valid positive number';
    }
    if (formData.salaryMax && (isNaN(salaryMax) || salaryMax < 0)) {
      salaryErrors.salaryMax = 'Maximum salary must be a valid positive number';
    }
    if (formData.salaryMin && formData.salaryMax && salaryMin >= salaryMax) {
      salaryErrors.salaryMax = 'Maximum salary must be greater than minimum salary';
    }
    return salaryErrors;
  };

  const canProceedFromStep = (step: number): boolean => {
    switch (step) {
      case 0: // Role
        return !!(formData.jobTitle.trim() && formData.department.trim() && formData.location.trim() && formData.employmentType);
      case 1: // Compensation
        return Object.keys(validateSalary()).length === 0;
      case 2: // Description
        return true;
      case 3: // Review
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      const salaryErrors = validateSalary();
      if (Object.keys(salaryErrors).length > 0) {
        setErrors(salaryErrors);
        return;
      }
    }
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

  const handleSaveDraft = async () => {
    setIsSubmitting(true);

    const salaryErrors = validateSalary();
    if (Object.keys(salaryErrors).length > 0) {
      setErrors(salaryErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      if (onSaveDraft) {
        onSaveDraft(formData);
      } else {
        const response = await apiFetch('/api/requisitions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            salaryMin: formData.salaryMin ? Number(formData.salaryMin) : undefined,
            salaryMax: formData.salaryMax ? Number(formData.salaryMax) : undefined,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          toast('Draft saved successfully', 'success');
          if (onSuccess) onSuccess(result);
        } else {
          const err = await response.json().catch(() => null);
          toast(`Error: ${err?.message || 'Failed to save draft'}`, 'error');
        }
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      toast('Error saving draft', 'error');
    }

    setIsSubmitting(false);
  };

  const handleSubmitForApproval = async () => {
    setIsSubmitting(true);

    if (!formData.description.trim()) {
      setErrors({ description: 'Description is required for submission' });
      toast('Description is required for submission', 'info');
      setCurrentStep(2);
      setIsSubmitting(false);
      return;
    }

    try {
      if (onSubmitForApproval) {
        onSubmitForApproval(formData);
      } else {
        const createResponse = await apiFetch('/api/requisitions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            salaryMin: formData.salaryMin ? Number(formData.salaryMin) : undefined,
            salaryMax: formData.salaryMax ? Number(formData.salaryMax) : undefined,
          }),
        });

        if (!createResponse.ok) {
          const err = await createResponse.json().catch(() => null);
          toast(`Error creating requisition: ${err?.message || 'Failed to create'}`, 'error');
          setIsSubmitting(false);
          return;
        }

        const created = await createResponse.json();

        const submitResponse = await apiFetch(`/api/requisitions/${created.id}/submit`, {
          method: 'POST',
        });

        if (submitResponse.ok) {
          const submitted = await submitResponse.json();
          toast('Requisition submitted for approval successfully', 'success');
          if (onSuccess) onSuccess(submitted);
        } else {
          const err = await submitResponse.json().catch(() => null);
          toast(`Error submitting for approval: ${err?.message || 'Submit failed'}`, 'error');
        }
      }
    } catch (error) {
      console.error('Error submitting for approval:', error);
      toast('Error submitting for approval', 'error');
    }

    setIsSubmitting(false);
  };

  const employmentLabel = EMPLOYMENT_TYPES.find(t => t.value === formData.employmentType)?.label || formData.employmentType;

  const renderRoleStep = () => (
    <div className="space-y-5">
      <div>
        <label htmlFor="jobTitle" className={labelClass}>Job Title *</label>
        <input
          type="text"
          id="jobTitle"
          name="jobTitle"
          value={formData.jobTitle}
          onChange={handleInputChange}
          aria-required="true"
          aria-invalid={!!errors.jobTitle}
          className={errors.jobTitle ? errorInputClass : inputClass}
          placeholder="e.g., Senior Software Engineer"
        />
        {errors.jobTitle && (
          <p role="alert" className="mt-1 text-xs text-red-600">{errors.jobTitle}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="department" className={labelClass}>Department *</label>
          <select
            id="department"
            name="department"
            value={formData.department}
            onChange={handleInputChange}
            aria-required="true"
            aria-invalid={!!errors.department}
            className={errors.department ? errorInputClass : inputClass}
          >
            <option value="">Select Department</option>
            {(formData.department && !departments.includes(formData.department)
              ? [formData.department, ...departments]
              : departments
            ).map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          {errors.department && (
            <p role="alert" className="mt-1 text-xs text-red-600">{errors.department}</p>
          )}
        </div>

        <div>
          <label htmlFor="location" className={labelClass}>Location *</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            aria-required="true"
            aria-invalid={!!errors.location}
            className={errors.location ? errorInputClass : inputClass}
            placeholder="e.g., New York, NY or Remote"
          />
          {errors.location && (
            <p role="alert" className="mt-1 text-xs text-red-600">{errors.location}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="employmentType" className={labelClass}>Employment Type *</label>
        <select
          id="employmentType"
          name="employmentType"
          value={formData.employmentType}
          onChange={handleInputChange}
          aria-required="true"
          aria-invalid={!!errors.employmentType}
          className={errors.employmentType ? errorInputClass : inputClass}
        >
          <option value="">Select Employment Type</option>
          {EMPLOYMENT_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        {errors.employmentType && (
          <p role="alert" className="mt-1 text-xs text-red-600">{errors.employmentType}</p>
        )}
      </div>
    </div>
  );

  const renderCompensationStep = () => (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Specify the salary range for this position. This step is optional — you can skip it and add later.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="salaryMin" className={labelClass}>Minimum Salary ($)</label>
          <input
            type="number"
            id="salaryMin"
            name="salaryMin"
            value={formData.salaryMin}
            onChange={handleInputChange}
            min="0"
            step="1000"
            aria-invalid={!!errors.salaryMin}
            className={errors.salaryMin ? errorInputClass : inputClass}
            placeholder="50000"
          />
          {errors.salaryMin && (
            <p role="alert" className="mt-1 text-xs text-red-600">{errors.salaryMin}</p>
          )}
        </div>
        <div>
          <label htmlFor="salaryMax" className={labelClass}>Maximum Salary ($)</label>
          <input
            type="number"
            id="salaryMax"
            name="salaryMax"
            value={formData.salaryMax}
            onChange={handleInputChange}
            min="0"
            step="1000"
            aria-invalid={!!errors.salaryMax}
            className={errors.salaryMax ? errorInputClass : inputClass}
            placeholder="80000"
          />
          {errors.salaryMax && (
            <p role="alert" className="mt-1 text-xs text-red-600">{errors.salaryMax}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderDescriptionStep = () => (
    <div className="space-y-4">
      <div>
        <label htmlFor="description" className={labelClass}>Job Description</label>
        <textarea
          id="description"
          name="description"
          rows={10}
          value={formData.description}
          onChange={handleInputChange}
          aria-invalid={!!errors.description}
          className={errors.description ? errorInputClass : inputClass}
          placeholder="Describe the role, responsibilities, requirements, and qualifications..."
        />
        {errors.description && (
          <p role="alert" className="mt-1 text-xs text-red-600">{errors.description}</p>
        )}
        <p className="mt-1.5 text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-[0.05em]">
          Required for submission. You can save as draft without a description.
        </p>
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <ReviewCard label="Job Title" value={formData.jobTitle} />
        <ReviewCard label="Department" value={formData.department} />
        <ReviewCard label="Location" value={formData.location} />
        <ReviewCard label="Employment Type" value={employmentLabel} />
        <ReviewCard
          label="Salary Range"
          value={
            formData.salaryMin || formData.salaryMax
              ? `$${formData.salaryMin || '—'} – $${formData.salaryMax || '—'}`
              : 'Not specified'
          }
        />
        <ReviewCard
          label="Description"
          value={formData.description ? `${formData.description.length} characters` : 'Not provided'}
        />
      </div>

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

      {!formData.description && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-[2px] p-3">
          <p className="text-xs text-amber-700 dark:text-amber-400">
            No description provided. You can save as draft, but a description is required to submit for approval.
          </p>
        </div>
      )}
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderRoleStep();
      case 1:
        return renderCompensationStep();
      case 2:
        return renderDescriptionStep();
      case 3:
        return renderReviewStep();
      default:
        return null;
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
        <button
          onClick={handleSaveDraft}
          disabled={isSubmitting}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <BookmarkIcon className="w-3.5 h-3.5" />
          {isSubmitting ? 'Saving...' : 'Save Draft'}
        </button>
        <button
          onClick={handleSubmitForApproval}
          disabled={isSubmitting}
          className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold bg-cta text-deep-navy rounded-full hover:bg-cta/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <DocumentTextIcon className="w-4 h-4" />
          {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
        </button>
      </div>
    </div>
  ) : undefined;

  return (
    <div className="max-w-4xl mx-auto">
      <WizardShell
        steps={WIZARD_STEPS}
        currentStep={currentStep}
        onNext={handleNext}
        onBack={handleBack}
        onSkip={handleSkip}
        canProceed={canProceedFromStep(currentStep)}
        title="Job Requisition"
        subtitle="Create a new job requisition for your department"
        footer={reviewFooter}
      >
        {renderStepContent()}
      </WizardShell>
    </div>
  );
};

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

export default RequisitionForm;
