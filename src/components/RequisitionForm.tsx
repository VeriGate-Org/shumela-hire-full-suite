'use client';

import React, { useState } from 'react';
import { apiFetch } from '@/lib/api-fetch';
import { useToast } from '@/components/Toast';
import { useDepartments } from '@/hooks/useDepartments';

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

const RequisitionForm: React.FC<RequisitionFormProps> = ({
  onSaveDraft,
  onSubmitForApproval,
  initialData = {},
  onSuccess
}) => {
  const { toast } = useToast();
  const { departments } = useDepartments();
  const [formData, setFormData] = useState<RequisitionFormData>({
    jobTitle: initialData.jobTitle || '',
    department: initialData.department || '',
    location: initialData.location || '',
    employmentType: initialData.employmentType || '',
    salaryMin: initialData.salaryMin || '',
    salaryMax: initialData.salaryMax || '',
    description: initialData.description || ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = (isFullSubmission: boolean = false): boolean => {
    const newErrors: FormErrors = {};

    // Required field validation
    if (!formData.jobTitle.trim()) {
      newErrors.jobTitle = 'Job title is required';
    }

    if (!formData.department.trim()) {
      newErrors.department = 'Department is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!formData.employmentType) {
      newErrors.employmentType = 'Employment type is required';
    }

    // For full submission, require all fields including description
    if (isFullSubmission && !formData.description.trim()) {
      newErrors.description = 'Description is required for submission';
    }

    // Salary validation
    const salaryMin = parseFloat(formData.salaryMin);
    const salaryMax = parseFloat(formData.salaryMax);

    if (formData.salaryMin && (isNaN(salaryMin) || salaryMin < 0)) {
      newErrors.salaryMin = 'Minimum salary must be a valid positive number';
    }

    if (formData.salaryMax && (isNaN(salaryMax) || salaryMax < 0)) {
      newErrors.salaryMax = 'Maximum salary must be a valid positive number';
    }

    if (formData.salaryMin && formData.salaryMax && salaryMin >= salaryMax) {
      newErrors.salaryMax = 'Maximum salary must be greater than minimum salary';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    
    // Basic validation for draft (only check format, not required fields)
    const salaryMin = parseFloat(formData.salaryMin);
    const salaryMax = parseFloat(formData.salaryMax);
    const salaryErrors: FormErrors = {};

    if (formData.salaryMin && (isNaN(salaryMin) || salaryMin < 0)) {
      salaryErrors.salaryMin = 'Minimum salary must be a valid positive number';
    }

    if (formData.salaryMax && (isNaN(salaryMax) || salaryMax < 0)) {
      salaryErrors.salaryMax = 'Maximum salary must be a valid positive number';
    }

    if (formData.salaryMin && formData.salaryMax && salaryMin >= salaryMax) {
      salaryErrors.salaryMax = 'Maximum salary must be greater than minimum salary';
    }

    if (Object.keys(salaryErrors).length > 0) {
      setErrors(salaryErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      if (onSaveDraft) {
        onSaveDraft(formData);
      } else {
        // Default: save via API
        const response = await apiFetch('/api/requisitions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            salaryMin: formData.salaryMin ? Number(formData.salaryMin) : undefined,
            salaryMax: formData.salaryMax ? Number(formData.salaryMax) : undefined
          })
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
    
    if (!validateForm(true)) {
      setIsSubmitting(false);
      return;
    }

    try {
      if (onSubmitForApproval) {
        onSubmitForApproval(formData);
      } else {
        // Default: create and submit via API
        const createResponse = await apiFetch('/api/requisitions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            salaryMin: formData.salaryMin ? Number(formData.salaryMin) : undefined,
            salaryMax: formData.salaryMax ? Number(formData.salaryMax) : undefined
          })
        });

        if (!createResponse.ok) {
          const err = await createResponse.json().catch(() => null);
          toast(`Error creating requisition: ${err?.message || 'Failed to create'}`, 'error');
          setIsSubmitting(false);
          return;
        }

        const created = await createResponse.json();

        // Submit for approval
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

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-sm shadow-md">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-900">Job Requisition Form</h2>
        <p className="mt-1 text-sm text-gray-600">Create a new job requisition for your department</p>
      </div>

      <form className="px-6 py-6 space-y-6">
        {/* Job Title */}
        <div>
          <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">
            Job Title *
          </label>
          <input
            type="text"
            id="jobTitle"
            name="jobTitle"
            value={formData.jobTitle}
            onChange={handleInputChange}
            aria-required="true"
            aria-invalid={!!errors.jobTitle}
            aria-describedby={errors.jobTitle ? 'job-title-error' : undefined}
            className={`w-full px-3 py-2 border rounded-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400 ${
              errors.jobTitle ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="e.g., Senior Software Engineer"
          />
          {errors.jobTitle && (
            <p id="job-title-error" role="alert" className="mt-1 text-sm text-red-600">{errors.jobTitle}</p>
          )}
        </div>

        {/* Department and Location Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
              Department *
            </label>
            <select
              id="department"
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              aria-required="true"
              aria-invalid={!!errors.department}
              aria-describedby={errors.department ? 'department-error' : undefined}
              className={`w-full px-3 py-2 border rounded-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400 ${
                errors.department ? 'border-red-300' : 'border-gray-300'
              }`}
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
              <p id="department-error" role="alert" className="mt-1 text-sm text-red-600">{errors.department}</p>
            )}
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location *
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              aria-required="true"
              aria-invalid={!!errors.location}
              aria-describedby={errors.location ? 'location-error' : undefined}
              className={`w-full px-3 py-2 border rounded-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400 ${
                errors.location ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g., New York, NY or Remote"
            />
            {errors.location && (
              <p id="location-error" role="alert" className="mt-1 text-sm text-red-600">{errors.location}</p>
            )}
          </div>
        </div>

        {/* Employment Type */}
        <div>
          <label htmlFor="employmentType" className="block text-sm font-medium text-gray-700 mb-1">
            Employment Type *
          </label>
          <select
            id="employmentType"
            name="employmentType"
            value={formData.employmentType}
            onChange={handleInputChange}
            aria-required="true"
            aria-invalid={!!errors.employmentType}
            aria-describedby={errors.employmentType ? 'employment-type-error' : undefined}
            className={`w-full px-3 py-2 border rounded-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400 ${
              errors.employmentType ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Select Employment Type</option>
            <option value="FULL_TIME">Full-time</option>
            <option value="PART_TIME">Part-time</option>
            <option value="CONTRACT">Contract</option>
            <option value="TEMPORARY">Temporary</option>
            <option value="FREELANCE">Freelance</option>
            <option value="INTERNSHIP">Internship</option>
            <option value="APPRENTICESHIP">Apprenticeship</option>
            <option value="VOLUNTEER">Volunteer</option>
          </select>
          {errors.employmentType && (
            <p id="employment-type-error" role="alert" className="mt-1 text-sm text-red-600">{errors.employmentType}</p>
          )}
        </div>

        {/* Salary Range */}
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-1">
            Salary Range
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="salaryMin" className="block text-xs text-gray-500 mb-1">
                Minimum ($)
              </label>
              <input
                type="number"
                id="salaryMin"
                name="salaryMin"
                value={formData.salaryMin}
                onChange={handleInputChange}
                min="0"
                step="1000"
                aria-invalid={!!errors.salaryMin}
                aria-describedby={errors.salaryMin ? 'salary-min-error' : undefined}
                className={`w-full px-3 py-2 border rounded-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400 ${
                  errors.salaryMin ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="50000"
              />
              {errors.salaryMin && (
                <p id="salary-min-error" role="alert" className="mt-1 text-sm text-red-600">{errors.salaryMin}</p>
              )}
            </div>
            <div>
              <label htmlFor="salaryMax" className="block text-xs text-gray-500 mb-1">
                Maximum ($)
              </label>
              <input
                type="number"
                id="salaryMax"
                name="salaryMax"
                value={formData.salaryMax}
                onChange={handleInputChange}
                min="0"
                step="1000"
                aria-invalid={!!errors.salaryMax}
                aria-describedby={errors.salaryMax ? 'salary-max-error' : undefined}
                className={`w-full px-3 py-2 border rounded-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400 ${
                  errors.salaryMax ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="80000"
              />
              {errors.salaryMax && (
                <p id="salary-max-error" role="alert" className="mt-1 text-sm text-red-600">{errors.salaryMax}</p>
              )}
            </div>
          </div>
        </fieldset>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Job Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={6}
            value={formData.description}
            onChange={handleInputChange}
            aria-invalid={!!errors.description}
            aria-describedby={errors.description ? 'description-error' : undefined}
            className={`w-full px-3 py-2 border rounded-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400 ${
              errors.description ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Describe the role, responsibilities, requirements, and qualifications..."
          />
          {errors.description && (
            <p id="description-error" role="alert" className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Required for submission. You can save as draft without a description.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-2 border border-gray-300 text-gray-700 bg-white rounded-sm shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gold-500/60 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Save as Draft'}
          </button>
          <button
            type="button"
            onClick={handleSubmitForApproval}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-2 bg-gold-500 text-violet-950 rounded-sm shadow-sm hover:bg-gold-600 focus:outline-none focus:ring-2 focus:ring-gold-500/60 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RequisitionForm;