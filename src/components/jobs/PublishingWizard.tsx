'use client';

import React, { useState, useEffect } from 'react';
import { 
  JobAd, 
  PublishingChannel, 
  PublishingRequest,
  PUBLISHING_WIZARD_STEPS,
  DEFAULT_PUBLISHING_SETTINGS,
  generateSlug
} from '../../types/jobAd';
import { JobAdDraft } from '../../types/jobTemplate';
import { jobAdService } from '../../services/jobAdService';
import JobAdPreview from './JobAdPreview';
import { 
  CheckIcon,
  XMarkIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  SparklesIcon,
  GlobeAltIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface PublishingWizardProps {
  draft: JobAdDraft;
  onPublished?: (jobAd: JobAd) => void;
  onCancel?: () => void;
  className?: string;
}

const PublishingWizard: React.FC<PublishingWizardProps> = ({
  draft,
  onPublished,
  onCancel,
  className = ''
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishedJobAd, setPublishedJobAd] = useState<JobAd | null>(null);

  // Form data for publishing
  const [formData, setFormData] = useState({
    title: draft.title,
    intro: draft.intro,
    responsibilities: draft.responsibilities,
    requirements: draft.requirements,
    benefits: draft.benefits,
    location: draft.location,
    employmentType: draft.employmentType,
    salaryRangeMin: draft.salaryRangeMin,
    salaryRangeMax: draft.salaryRangeMax,
    contactEmail: draft.contactEmail,
    companyName: 'TechCorp Inc.',
    department: '',
    featured: false,
    channels: [] as PublishingChannel[],
    expiresAt: new Date(Date.now() + DEFAULT_PUBLISHING_SETTINGS.defaultExpiryDays * 24 * 60 * 60 * 1000),
    customSlug: ''
  });

  const [generatedSlug, setGeneratedSlug] = useState('');

  useEffect(() => {
    // Generate slug when title changes
    const slug = jobAdService.generateSlug(formData.title);
    setGeneratedSlug(slug);
    if (!formData.customSlug) {
      setFormData(prev => ({ ...prev, customSlug: slug }));
    }
  }, [formData.title]);

  const steps = PUBLISHING_WIZARD_STEPS.map((step, index) => ({
    ...step,
    completed: index < currentStep,
    current: index === currentStep
  }));

  const isStepValid = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0: // Details
        return !!(formData.title && formData.contactEmail && formData.companyName);
      case 1: // Targeting
        return formData.channels.length > 0;
      case 2: // Preview
        return true;
      case 3: // Publish
        return true;
      default:
        return false;
    }
  };

  const canProceed = (): boolean => {
    return isStepValid(currentStep);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1 && canProceed()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFormChange = (field: string, value: string | Date | number | boolean | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleChannelToggle = (channel: PublishingChannel) => {
    setFormData(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel]
    }));
  };

  const handlePublish = async () => {
    try {
      setLoading(true);
      setError(null);

      const publishingRequest: PublishingRequest = {
        draftId: draft.id,
        channels: formData.channels,
        expiresAt: formData.expiresAt,
        companyName: formData.companyName,
        department: formData.department || undefined,
        featured: formData.featured,
        customSlug: formData.customSlug
      };

      // Create updated draft with form data
      const updatedDraft: JobAdDraft = {
        ...draft,
        title: formData.title,
        intro: formData.intro,
        responsibilities: formData.responsibilities,
        requirements: formData.requirements,
        benefits: formData.benefits,
        location: formData.location,
        employmentType: formData.employmentType,
        salaryRangeMin: formData.salaryRangeMin,
        salaryRangeMax: formData.salaryRangeMax,
        contactEmail: formData.contactEmail
      };

      const publishedAd = await jobAdService.publishJobAd(
        updatedDraft,
        publishingRequest,
        draft.createdBy
      );

      setPublishedJobAd(publishedAd);
      setCurrentStep(steps.length); // Move to success step
      onPublished?.(publishedAd);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish job ad');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderDetailsStep();
      case 1:
        return renderTargetingStep();
      case 2:
        return renderPreviewStep();
      case 3:
        return renderPublishStep();
      default:
        return null;
    }
  };

  const renderDetailsStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h3>
        <p className="text-gray-600 mb-6">
          Review and edit the job information before publishing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleFormChange('title', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Name *
          </label>
          <input
            type="text"
            value={formData.companyName}
            onChange={(e) => handleFormChange('companyName', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Department
          </label>
          <input
            type="text"
            value={formData.department}
            onChange={(e) => handleFormChange('department', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
            placeholder="e.g., Engineering"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Email *
          </label>
          <input
            type="email"
            value={formData.contactEmail}
            onChange={(e) => handleFormChange('contactEmail', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => handleFormChange('location', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Employment Type
          </label>
          <select
            value={formData.employmentType}
            onChange={(e) => handleFormChange('employmentType', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
          >
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
          </select>
        </div>
      </div>

      {/* Salary Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Salary Range (Optional)
        </label>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="number"
            value={formData.salaryRangeMin || ''}
            onChange={(e) => handleFormChange('salaryRangeMin', parseInt(e.target.value) || undefined)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
            placeholder="Min salary"
          />
          <input
            type="number"
            value={formData.salaryRangeMax || ''}
            onChange={(e) => handleFormChange('salaryRangeMax', parseInt(e.target.value) || undefined)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
            placeholder="Max salary"
          />
        </div>
      </div>

      {/* URL Slug */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          URL Slug (for public posting)
        </label>
        <div className="flex items-center">
          <span className="text-gray-500 text-sm mr-2">/jobs/</span>
          <input
            type="text"
            value={formData.customSlug}
            onChange={(e) => handleFormChange('customSlug', e.target.value)}
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
            placeholder={generatedSlug}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          This will be the public URL for your job posting
        </p>
      </div>

      {/* Featured toggle */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="featured"
          checked={formData.featured}
          onChange={(e) => handleFormChange('featured', e.target.checked)}
          className="rounded border-gray-300 text-violet-600 focus:ring-violet-500/60"
        />
        <label htmlFor="featured" className="ml-2 text-sm text-gray-700">
          Mark as featured job (appears prominently in listings)
        </label>
      </div>
    </div>
  );

  const renderTargetingStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Publishing Channels</h3>
        <p className="text-gray-600 mb-6">
          Choose where you want to publish this job ad.
        </p>
      </div>

      <div className="space-y-4">
        {/* Internal Channel */}
        <div
          onClick={() => handleChannelToggle(PublishingChannel.INTERNAL)}
          className={`p-6 border-2 rounded-lg cursor-pointer transition-colors ${
            formData.channels.includes(PublishingChannel.INTERNAL)
              ? 'border-violet-500 bg-violet-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <BuildingOfficeIcon className="w-8 h-8 text-violet-600" />
            </div>
            <div className="ml-4">
              <h4 className="text-lg font-semibold text-gray-900">Internal Portal</h4>
              <p className="text-gray-600 mt-1">
                Visible to logged-in staff members only. Great for internal mobility and employee referrals.
              </p>
              <div className="mt-2 text-sm text-gray-500">
                • Visible to current employees
                • Access to detailed job information
                • Employee referral tracking
              </div>
            </div>
            {formData.channels.includes(PublishingChannel.INTERNAL) && (
              <CheckIcon className="w-6 h-6 text-violet-600 ml-auto" />
            )}
          </div>
        </div>

        {/* External Channel */}
        <div
          onClick={() => handleChannelToggle(PublishingChannel.EXTERNAL)}
          className={`p-6 border-2 rounded-lg cursor-pointer transition-colors ${
            formData.channels.includes(PublishingChannel.EXTERNAL)
              ? 'border-violet-500 bg-violet-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <GlobeAltIcon className="w-8 h-8 text-green-600" />
            </div>
            <div className="ml-4">
              <h4 className="text-lg font-semibold text-gray-900">Public Website</h4>
              <p className="text-gray-600 mt-1">
                Visible to everyone on your public careers page. Increases reach and attracts external candidates.
              </p>
              <div className="mt-2 text-sm text-gray-500">
                • Public visibility and SEO benefits
                • Shareable job URLs
                • Analytics and application tracking
              </div>
            </div>
            {formData.channels.includes(PublishingChannel.EXTERNAL) && (
              <CheckIcon className="w-6 h-6 text-green-600 ml-auto" />
            )}
          </div>
        </div>
      </div>

      {/* Expiry Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <CalendarIcon className="w-4 h-4 inline mr-1" />
          Expiry Date *
        </label>
        <input
          type="date"
          value={formData.expiresAt.toISOString().split('T')[0]}
          onChange={(e) => handleFormChange('expiresAt', new Date(e.target.value))}
          min={new Date().toISOString().split('T')[0]}
          max={new Date(Date.now() + DEFAULT_PUBLISHING_SETTINGS.maxExpiryDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
          className="w-full md:w-auto border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
        />
        <p className="text-xs text-gray-500 mt-1">
          Job will automatically unpublish after this date. Maximum {DEFAULT_PUBLISHING_SETTINGS.maxExpiryDays} days from today.
        </p>
      </div>

      {formData.channels.length === 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />
            <div className="ml-3">
              <p className="text-sm text-yellow-800">
                Please select at least one publishing channel to continue.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderPreviewStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview Job Ad</h3>
        <p className="text-gray-600 mb-6">
          Review how your job ad will appear to candidates.
        </p>
      </div>

      {/* Channel toggles for preview */}
      <div className="flex space-x-4 mb-6">
        {formData.channels.includes(PublishingChannel.EXTERNAL) && (
          <button className="px-4 py-2 bg-green-100 text-green-800 rounded-md text-sm font-medium">
            <GlobeAltIcon className="w-4 h-4 inline mr-1" />
            Public View
          </button>
        )}
        {formData.channels.includes(PublishingChannel.INTERNAL) && (
          <button className="px-4 py-2 bg-violet-100 text-violet-800 rounded-md text-sm font-medium">
            <BuildingOfficeIcon className="w-4 h-4 inline mr-1" />
            Internal View
          </button>
        )}
      </div>

      {/* Preview */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
          <span className="text-sm text-gray-600">Preview</span>
        </div>
        <div className="p-6">
          <JobAdPreview
            draft={{
              ...draft,
              title: formData.title,
              intro: formData.intro,
              responsibilities: formData.responsibilities,
              requirements: formData.requirements,
              benefits: formData.benefits,
              location: formData.location,
              employmentType: formData.employmentType,
              salaryRangeMin: formData.salaryRangeMin,
              salaryRangeMax: formData.salaryRangeMax,
              contactEmail: formData.contactEmail
            }}
            companyName={formData.companyName}
            department={formData.department}
            featured={formData.featured}
            channels={formData.channels}
            expiresAt={formData.expiresAt}
            viewMode={formData.channels.includes(PublishingChannel.EXTERNAL) ? 'external' : 'internal'}
          />
        </div>
      </div>
    </div>
  );

  const renderPublishStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ready to Publish</h3>
        <p className="text-gray-600 mb-6">
          Your job ad is ready to go live. Review the publishing summary below.
        </p>
      </div>

      {/* Publishing Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Publishing Summary</h4>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Job Title:</span>
            <span className="font-medium">{formData.title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Company:</span>
            <span className="font-medium">{formData.companyName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Channels:</span>
            <span className="font-medium">
              {formData.channels.map(ch => ch === PublishingChannel.INTERNAL ? 'Internal' : 'Public').join(', ')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Expires:</span>
            <span className="font-medium">{formData.expiresAt.toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">URL Slug:</span>
            <span className="font-medium font-mono text-xs">/jobs/{formData.customSlug}</span>
          </div>
          {formData.featured && (
            <div className="flex justify-between">
              <span className="text-gray-600">Featured:</span>
              <span className="font-medium text-yellow-600">Yes</span>
            </div>
          )}
        </div>
      </div>

      {/* Warning about expiry */}
      <div className="p-4 bg-violet-50 border border-violet-200 rounded-md">
        <div className="flex">
          <InformationCircleIcon className="w-5 h-5 text-violet-400" />
          <div className="ml-3">
            <p className="text-sm text-violet-800">
              <strong>Auto-expiry:</strong> This job will automatically unpublish on{' '}
              {formData.expiresAt.toLocaleDateString()} and the Apply button will be disabled.
              You can republish or extend the deadline later.
            </p>
          </div>
        </div>
      </div>

      {/* Publish button */}
      <div className="text-center">
        <button
          onClick={handlePublish}
          disabled={loading}
          className="inline-flex items-center px-6 py-3 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Publishing...
            </>
          ) : (
            <>
              <SparklesIcon className="w-5 h-5 mr-2" />
              Publish Job Ad
            </>
          )}
        </button>
      </div>
    </div>
  );

  // Success state
  if (currentStep >= steps.length && publishedJobAd) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-8 text-center ${className}`}>
        <CheckIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Ad Published!</h2>
        <p className="text-gray-600 mb-6">
          Your job ad is now live and accepting applications.
        </p>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="text-sm space-y-2">
            <div><strong>Job ID:</strong> {publishedJobAd.id}</div>
            <div><strong>Channels:</strong> {publishedJobAd.channels.map(ch => 
              ch === PublishingChannel.INTERNAL ? 'Internal Portal' : 'Public Website'
            ).join(', ')}</div>
            {publishedJobAd.channels.includes(PublishingChannel.EXTERNAL) && (
              <div><strong>Public URL:</strong> /jobs/{publishedJobAd.slug}</div>
            )}
            <div><strong>Expires:</strong> {new Date(publishedJobAd.expiresAt).toLocaleDateString()}</div>
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={() => window.open(`/jobs/${publishedJobAd.slug}`, '_blank')}
            className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
          >
            View Live Job
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Publish Job Ad</h2>
            <p className="text-sm text-gray-600 mt-1">
              {draft.title} • Step {currentStep + 1} of {steps.length}
            </p>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* Step Progress */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                step.completed ? 'bg-green-500 border-green-500 text-white' :
                step.current ? 'bg-violet-600 border-violet-600 text-white' :
                'border-gray-300 text-gray-400'
              }`}>
                {step.completed ? (
                  <CheckIcon className="w-4 h-4" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <div className="ml-3">
                <div className={`text-sm font-medium ${
                  step.current ? 'text-violet-600' : step.completed ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </div>
                <div className="text-xs text-gray-500">{step.description}</div>
              </div>
              {index < steps.length - 1 && (
                <div className={`ml-4 w-8 h-0.5 ${
                  step.completed ? 'bg-green-500' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Step Content */}
      <div className="p-6">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Previous
        </button>

        {currentStep < steps.length - 1 ? (
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="inline-flex items-center px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ArrowRightIcon className="w-4 h-4 ml-2" />
          </button>
        ) : (
          <div className="text-sm text-gray-500">
            Click &quot;Publish Job Ad&quot; to continue
          </div>
        )}
      </div>
    </div>
  );
};

export default PublishingWizard;