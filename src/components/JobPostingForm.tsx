'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface JobPostingFormProps {
  jobPostingId?: number;
  currentUserId?: number | null;
  onSuccess?: (jobPosting: { id: number; title: string; status: string }) => void;
  onCancel?: () => void;
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
}

const EMPLOYMENT_TYPES = [
  { value: 'FULL_TIME', label: 'Full-time' },
  { value: 'PART_TIME', label: 'Part-time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'TEMPORARY', label: 'Temporary' },
  { value: 'FREELANCE', label: 'Freelance' },
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'APPRENTICESHIP', label: 'Apprenticeship' },
  { value: 'VOLUNTEER', label: 'Volunteer' }
];

const EXPERIENCE_LEVELS = [
  { value: 'ENTRY_LEVEL', label: 'Entry Level (0-2 years)' },
  { value: 'JUNIOR', label: 'Junior (1-3 years)' },
  { value: 'MID_LEVEL', label: 'Mid-Level (3-6 years)' },
  { value: 'SENIOR', label: 'Senior (6-10 years)' },
  { value: 'LEAD', label: 'Lead (8+ years)' },
  { value: 'EXECUTIVE', label: 'Executive (10+ years)' },
  { value: 'EXPERT', label: 'Expert (15+ years)' }
];

const DEPARTMENTS = [
  'Engineering',
  'Marketing',
  'Sales',
  'Human Resources',
  'Finance',
  'Operations',
  'Customer Support',
  'Product',
  'Design',
  'Analytics',
  'Legal',
  'Administration'
];

export default function JobPostingForm({ jobPostingId, currentUserId, onSuccess, onCancel }: JobPostingFormProps) {
  const { user } = useAuth();
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
    urgent: false
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('basic');
  const actorId = useMemo(() => {
    if (typeof currentUserId === 'number' && Number.isFinite(currentUserId)) {
      return currentUserId;
    }
    if (!user?.id) {
      return null;
    }
    const parsedId = Number.parseInt(user.id, 10);
    return Number.isFinite(parsedId) ? parsedId : null;
  }, [currentUserId, user?.id]);

  const loadJobPosting = useCallback(async () => {
    if (!jobPostingId) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/job-postings/${jobPostingId}`);
      if (response.ok) {
        const data = await response.json();
        setFormData({
          ...data,
          applicationDeadline: data.applicationDeadline ? 
            new Date(data.applicationDeadline).toISOString().slice(0, 16) : '',
          salaryMin: data.salaryMin || undefined,
          salaryMax: data.salaryMax || undefined
        });
      }
    } catch (error) {
      console.error('Error loading job posting:', error);
    } finally {
      setLoading(false);
    }
  }, [jobPostingId]);

  // Load job posting data if editing
  useEffect(() => {
    if (jobPostingId) {
      loadJobPosting();
    }
  }, [jobPostingId, loadJobPosting]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Job title is required';
    if (!formData.department.trim()) newErrors.department = 'Department is required';
    if (!formData.description.trim()) newErrors.description = 'Job description is required';
    if (formData.description.length < 100) newErrors.description = 'Job description must be at least 100 characters';
    
    if (formData.salaryMin && formData.salaryMax && formData.salaryMin > formData.salaryMax) {
      newErrors.salaryMax = 'Maximum salary must be greater than minimum salary';
    }

    if (formData.positionsAvailable < 1) {
      newErrors.positionsAvailable = 'At least one position must be available';
    }

    if (formData.seoTitle && formData.seoTitle.length > 60) {
      newErrors.seoTitle = 'SEO title must be 60 characters or less';
    }

    if (formData.seoDescription && formData.seoDescription.length > 160) {
      newErrors.seoDescription = 'SEO description must be 160 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (!actorId) {
      setErrors({ general: 'Unable to determine the signed-in user for audit tracking. Please sign in again.' });
      return;
    }

    try {
      setLoading(true);

      const submitData = {
        ...formData,
        applicationDeadline: formData.applicationDeadline ? 
          new Date(formData.applicationDeadline).toISOString() : null
      };

      const actorParam = jobPostingId ? `updatedBy=${actorId}` : `createdBy=${actorId}`;
      const url = jobPostingId ?
        `/api/job-postings/${jobPostingId}?${actorParam}` :
        `/api/job-postings?${actorParam}`;
      const method = jobPostingId ? 'PUT' : 'POST';

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
        setErrors({ general: errorData.message || 'Failed to save job posting' });
      }
    } catch (error) {
      console.error('Error saving job posting:', error);
      setErrors({ general: 'An error occurred while saving' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = <K extends keyof JobPostingData>(field: K, value: JobPostingData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic Information' },
    { id: 'details', label: 'Job Details' },
    { id: 'compensation', label: 'Compensation' },
    { id: 'seo', label: 'SEO & Settings' }
  ];

  if (loading && jobPostingId) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job posting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl rounded-md border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-2xl font-bold text-gray-900">
          {jobPostingId ? 'Edit Job Posting' : 'Create Job Posting'}
        </h2>
        <p className="text-gray-600 mt-1">
          {jobPostingId ? 'Update job posting details and requirements' : 'Create a new job posting with detailed requirements'}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 pt-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`border-b-2 px-2 py-2 text-sm font-medium ${
                  activeTab === tab.id
                    ? 'border-gold-500 text-gold-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6">
        {errors.general && (
          <div className="mb-6 rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-700">
            {errors.general}
          </div>
        )}

        {/* Basic Information Tab */}
        {activeTab === 'basic' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="job-title" className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title *
                </label>
                <input
                  type="text"
                  id="job-title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  aria-required="true"
                  aria-invalid={!!errors.title}
                  aria-describedby={errors.title ? 'job-title-error' : undefined}
                  className={`w-full rounded-md border p-3 focus:border-violet-400 focus:ring-2 focus:ring-gold-500/60 ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="e.g. Senior Software Engineer"
                />
                {errors.title && <p id="job-title-error" role="alert" className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>

              <div>
                <label htmlFor="job-department" className="block text-sm font-medium text-gray-700 mb-1">
                  Department *
                </label>
                <select
                  id="job-department"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  aria-required="true"
                  aria-invalid={!!errors.department}
                  aria-describedby={errors.department ? 'job-department-error' : undefined}
                  className={`w-full rounded-md border p-3 focus:border-violet-400 focus:ring-2 focus:ring-gold-500/60 ${errors.department ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                {errors.department && <p id="job-department-error" role="alert" className="text-red-500 text-sm mt-1">{errors.department}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-3 focus:border-violet-400 focus:ring-2 focus:ring-gold-500/60"
                  placeholder="e.g. Cape Town, South Africa"
                />
              </div>

              <div>
                <label htmlFor="positions-available" className="block text-sm font-medium text-gray-700 mb-1">
                  Positions Available *
                </label>
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
                  aria-describedby={errors.positionsAvailable ? 'positions-available-error' : undefined}
                  className={`w-full rounded-md border p-3 focus:border-violet-400 focus:ring-2 focus:ring-gold-500/60 ${errors.positionsAvailable ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.positionsAvailable && <p id="positions-available-error" role="alert" className="text-red-500 text-sm mt-1">{errors.positionsAvailable}</p>}
              </div>

              <div>
                <label htmlFor="employment-type" className="block text-sm font-medium text-gray-700 mb-1">
                  Employment Type *
                </label>
                <select
                  id="employment-type"
                  value={formData.employmentType}
                  onChange={(e) => handleInputChange('employmentType', e.target.value)}
                  aria-required="true"
                  className="w-full rounded-md border border-gray-300 p-3 focus:border-violet-400 focus:ring-2 focus:ring-gold-500/60"
                >
                  {EMPLOYMENT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="experience-level" className="block text-sm font-medium text-gray-700 mb-1">
                  Experience Level *
                </label>
                <select
                  id="experience-level"
                  value={formData.experienceLevel}
                  onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
                  aria-required="true"
                  className="w-full rounded-md border border-gray-300 p-3 focus:border-violet-400 focus:ring-2 focus:ring-gold-500/60"
                >
                  {EXPERIENCE_LEVELS.map(level => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Application Deadline
              </label>
              <input
                type="datetime-local"
                value={formData.applicationDeadline}
                onChange={(e) => handleInputChange('applicationDeadline', e.target.value)}
                className="w-full rounded-md border border-gray-300 p-3 focus:border-violet-400 focus:ring-2 focus:ring-gold-500/60"
              />
              <p className="text-sm text-gray-500 mt-1">Leave empty for no deadline</p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="flex items-center rounded-md border border-gray-200 px-3 py-2">
                <input
                  type="checkbox"
                  checked={formData.remoteWorkAllowed}
                  onChange={(e) => handleInputChange('remoteWorkAllowed', e.target.checked)}
                  className="mr-2"
                />
                Remote work allowed
              </label>

              <label className="flex items-center rounded-md border border-gray-200 px-3 py-2">
                <input
                  type="checkbox"
                  checked={formData.travelRequired}
                  onChange={(e) => handleInputChange('travelRequired', e.target.checked)}
                  className="mr-2"
                />
                Travel required
              </label>

              <label className="flex items-center rounded-md border border-gray-200 px-3 py-2">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => handleInputChange('featured', e.target.checked)}
                  className="mr-2"
                />
                Featured position
              </label>

              <label className="flex items-center rounded-md border border-gray-200 px-3 py-2">
                <input
                  type="checkbox"
                  checked={formData.urgent}
                  onChange={(e) => handleInputChange('urgent', e.target.checked)}
                  className="mr-2"
                />
                Urgent hiring
              </label>
            </div>
          </div>
        )}

        {/* Job Details Tab */}
        {activeTab === 'details' && (
          <div className="space-y-6">
            <div>
              <label htmlFor="job-description" className="block text-sm font-medium text-gray-700 mb-1">
                Job Description *
              </label>
              <textarea
                id="job-description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={6}
                aria-required="true"
                aria-invalid={!!errors.description}
                aria-describedby={errors.description ? 'job-description-error' : undefined}
                className={`w-full rounded-md border p-3 focus:border-violet-400 focus:ring-2 focus:ring-gold-500/60 ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Provide a detailed description of the role, including key objectives and what the successful candidate will be responsible for..."
              />
              <div className="flex justify-between mt-1">
                {errors.description && <p id="job-description-error" role="alert" className="text-red-500 text-sm">{errors.description}</p>}
                <p className="text-gray-500 text-sm ml-auto">
                  {formData.description.length} characters (minimum 100)
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Key Responsibilities
              </label>
              <textarea
                value={formData.responsibilities}
                onChange={(e) => handleInputChange('responsibilities', e.target.value)}
                rows={4}
                className="w-full rounded-md border border-gray-300 p-3 focus:border-violet-400 focus:ring-2 focus:ring-gold-500/60"
                placeholder="List the main responsibilities and duties for this position..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Requirements
              </label>
              <textarea
                value={formData.requirements}
                onChange={(e) => handleInputChange('requirements', e.target.value)}
                rows={4}
                className="w-full rounded-md border border-gray-300 p-3 focus:border-violet-400 focus:ring-2 focus:ring-gold-500/60"
                placeholder="List the essential requirements, skills, and experience needed..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Qualifications
              </label>
              <textarea
                value={formData.qualifications}
                onChange={(e) => handleInputChange('qualifications', e.target.value)}
                rows={3}
                className="w-full rounded-md border border-gray-300 p-3 focus:border-violet-400 focus:ring-2 focus:ring-gold-500/60"
                placeholder="Educational qualifications, certifications, or preferred qualifications..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Benefits & Perks
              </label>
              <textarea
                value={formData.benefits}
                onChange={(e) => handleInputChange('benefits', e.target.value)}
                rows={3}
                className="w-full rounded-md border border-gray-300 p-3 focus:border-violet-400 focus:ring-2 focus:ring-gold-500/60"
                placeholder="List the benefits, perks, and what makes this opportunity attractive..."
              />
            </div>
          </div>
        )}

        {/* Compensation Tab */}
        {activeTab === 'compensation' && (
          <div className="space-y-6">
            <fieldset className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <legend className="sr-only">Salary Range</legend>
              <div>
                <label htmlFor="salary-min" className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Salary
                </label>
                <input
                  type="number"
                  id="salary-min"
                  min="0"
                  step="1000"
                  value={formData.salaryMin || ''}
                  onChange={(e) => handleInputChange('salaryMin', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full rounded-md border border-gray-300 p-3 focus:border-violet-400 focus:ring-2 focus:ring-gold-500/60"
                  placeholder="e.g. 50000"
                />
              </div>

              <div>
                <label htmlFor="salary-max" className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Salary
                </label>
                <input
                  type="number"
                  id="salary-max"
                  min="0"
                  step="1000"
                  value={formData.salaryMax || ''}
                  onChange={(e) => handleInputChange('salaryMax', e.target.value ? parseFloat(e.target.value) : undefined)}
                  aria-invalid={!!errors.salaryMax}
                  aria-describedby={errors.salaryMax ? 'salary-max-error' : undefined}
                  className={`w-full rounded-md border p-3 focus:border-violet-400 focus:ring-2 focus:ring-gold-500/60 ${errors.salaryMax ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="e.g. 80000"
                />
                {errors.salaryMax && <p id="salary-max-error" role="alert" className="text-red-500 text-sm mt-1">{errors.salaryMax}</p>}
              </div>

              <div>
                <label htmlFor="salary-currency" className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  id="salary-currency"
                  value={formData.salaryCurrency}
                  onChange={(e) => handleInputChange('salaryCurrency', e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-3 focus:border-violet-400 focus:ring-2 focus:ring-gold-500/60"
                >
                  <option value="ZAR">ZAR (South African Rand)</option>
                  <option value="USD">USD (US Dollar)</option>
                  <option value="EUR">EUR (Euro)</option>
                  <option value="GBP">GBP (British Pound)</option>
                </select>
              </div>
            </fieldset>

            <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
              <h4 className="font-medium text-gray-900 mb-2">Salary Range Preview</h4>
              <p className="text-gray-600">
                {formData.salaryMin || formData.salaryMax ? (
                  <>
                    {formData.salaryMin && formData.salaryMax ? 
                      `${formData.salaryCurrency} ${formData.salaryMin.toLocaleString()} - ${formData.salaryMax.toLocaleString()}` :
                      formData.salaryMin ? 
                        `${formData.salaryCurrency} ${formData.salaryMin.toLocaleString()}+` :
                        `Up to ${formData.salaryCurrency} ${formData.salaryMax?.toLocaleString()}`
                    } per annum
                  </>
                ) : (
                  'Salary negotiable'
                )}
              </p>
            </div>
          </div>
        )}

        {/* SEO & Settings Tab */}
        {activeTab === 'seo' && (
          <div className="space-y-6">
            <div>
              <label htmlFor="seo-title" className="block text-sm font-medium text-gray-700 mb-1">
                SEO Title
              </label>
              <input
                type="text"
                id="seo-title"
                maxLength={60}
                value={formData.seoTitle}
                onChange={(e) => handleInputChange('seoTitle', e.target.value)}
                aria-invalid={!!errors.seoTitle}
                aria-describedby={errors.seoTitle ? 'seo-title-error' : undefined}
                className={`w-full rounded-md border p-3 focus:border-violet-400 focus:ring-2 focus:ring-gold-500/60 ${errors.seoTitle ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Custom title for search engines (optional)"
              />
              <div className="flex justify-between mt-1">
                {errors.seoTitle && <p id="seo-title-error" role="alert" className="text-red-500 text-sm">{errors.seoTitle}</p>}
                <p className="text-gray-500 text-sm ml-auto">
                  {formData.seoTitle.length}/60 characters
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="seo-description" className="block text-sm font-medium text-gray-700 mb-1">
                SEO Description
              </label>
              <textarea
                id="seo-description"
                maxLength={160}
                value={formData.seoDescription}
                onChange={(e) => handleInputChange('seoDescription', e.target.value)}
                rows={3}
                aria-invalid={!!errors.seoDescription}
                aria-describedby={errors.seoDescription ? 'seo-description-error' : undefined}
                className={`w-full rounded-md border p-3 focus:border-violet-400 focus:ring-2 focus:ring-gold-500/60 ${errors.seoDescription ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Brief description for search engines (optional)"
              />
              <div className="flex justify-between mt-1">
                {errors.seoDescription && <p id="seo-description-error" role="alert" className="text-red-500 text-sm">{errors.seoDescription}</p>}
                <p className="text-gray-500 text-sm ml-auto">
                  {formData.seoDescription.length}/160 characters
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SEO Keywords
              </label>
              <input
                type="text"
                value={formData.seoKeywords}
                onChange={(e) => handleInputChange('seoKeywords', e.target.value)}
                className="w-full rounded-md border border-gray-300 p-3 focus:border-violet-400 focus:ring-2 focus:ring-gold-500/60"
                placeholder="Comma-separated keywords for search optimization"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Internal Notes
              </label>
              <textarea
                value={formData.internalNotes}
                onChange={(e) => handleInputChange('internalNotes', e.target.value)}
                rows={3}
                className="w-full rounded-md border border-gray-300 p-3 focus:border-violet-400 focus:ring-2 focus:ring-gold-500/60"
                placeholder="Internal notes for hiring team (not visible to applicants)"
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end space-x-4 border-t border-gray-200 pt-6">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-gold-500 text-violet-950 rounded-sm hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </span>
            ) : (
              jobPostingId ? 'Update Job Posting' : 'Create Job Posting'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
