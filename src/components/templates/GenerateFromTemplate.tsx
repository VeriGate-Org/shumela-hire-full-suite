'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { JobAdTemplate, JobAdDraft, RequisitionData } from '../../types/jobTemplate';
import { jobTemplateService } from '../../services/jobTemplateService';
import { requisitionService } from '../../services/requisitionService';
import { 
  DocumentTextIcon,
  SparklesIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  XMarkIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface GenerateFromTemplateProps {
  template?: JobAdTemplate;
  requisition?: RequisitionData;
  onGenerated?: (draft: JobAdDraft) => void;
  onCancel?: () => void;
  className?: string;
}

const GenerateFromTemplate: React.FC<GenerateFromTemplateProps> = ({
  template: initialTemplate,
  requisition: initialRequisition,
  onGenerated,
  onCancel,
  className = ''
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<JobAdTemplate | null>(initialTemplate || null);
  const [selectedRequisition, setSelectedRequisition] = useState<RequisitionData | null>(initialRequisition || null);
  const [templates, setTemplates] = useState<JobAdTemplate[]>([]);
  const [requisitions, setRequisitions] = useState<RequisitionData[]>([]);
  const [customData, setCustomData] = useState<Record<string, string>>({});
  const [generatedDraft, setGeneratedDraft] = useState<JobAdDraft | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'customize' | 'preview' | 'complete'>('select');

  // Load templates and requisitions
  useEffect(() => {
    const loadData = async () => {
      try {
        const [templatesData, requisitionsData] = await Promise.all([
          jobTemplateService.getAllTemplates({ showArchived: false }),
          requisitionService.getAllRequisitions()
        ]);
        setTemplates(templatesData);
        setRequisitions(requisitionsData);
      } catch (err) {
        setError('Failed to load data');
      }
    };

    loadData();
  }, []);

  // Initialize custom data when requisition changes
  useEffect(() => {
    if (selectedRequisition) {
      setCustomData({
        companyName: 'Your Company',
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      });
    }
  }, [selectedRequisition]);

  const handleGenerate = async () => {
    if (!selectedTemplate) {
      setError('Please select a template');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const draft = await jobTemplateService.generateJobAdDraft(
        {
          templateId: selectedTemplate.id,
          requisitionId: selectedRequisition?.id,
          customData
        },
        selectedRequisition || undefined
      );

      setGeneratedDraft(draft);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate job ad');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    if (generatedDraft) {
      onGenerated?.(generatedDraft);
    }
  };

  const renderPreview = useCallback(() => {
    if (!generatedDraft) return null;

    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="space-y-6">
          {/* Job Title */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {generatedDraft.title}
            </h1>
            <p className="text-gray-600 mt-1">
              {generatedDraft.location} • {generatedDraft.employmentType}
            </p>
            {(generatedDraft.salaryRangeMin || generatedDraft.salaryRangeMax) && (
              <p className="text-gray-600 mt-1">
                Salary: R{generatedDraft.salaryRangeMin?.toLocaleString()} - R{generatedDraft.salaryRangeMax?.toLocaleString()}
              </p>
            )}
          </div>

          {/* Introduction */}
          {generatedDraft.intro && (
            <div>
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: generatedDraft.intro }}
              />
            </div>
          )}

          {/* Responsibilities */}
          {generatedDraft.responsibilities && (
            <div>
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: generatedDraft.responsibilities }}
              />
            </div>
          )}

          {/* Requirements */}
          {generatedDraft.requirements && (
            <div>
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: generatedDraft.requirements }}
              />
            </div>
          )}

          {/* Benefits */}
          {generatedDraft.benefits && (
            <div>
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: generatedDraft.benefits }}
              />
            </div>
          )}

          {/* Contact Information */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">How to Apply</h3>
            <p className="text-gray-600">
              To apply for this position, please send your resume and cover letter to:{' '}
              <strong className="text-gray-900">{generatedDraft.contactEmail}</strong>
            </p>
            {generatedDraft.closingDate && (
              <p className="text-gray-600 mt-2">
                Application deadline: {new Date(generatedDraft.closingDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }, [generatedDraft]);

  if (step === 'complete') {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-8 text-center ${className}`}>
        <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Ad Generated!</h2>
        <p className="text-gray-600 mb-6">
          Your job ad draft has been created successfully and is ready for review.
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={handleComplete}
            className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
          >
            View Draft
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
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <SparklesIcon className="w-6 h-6 mr-2" />
              Generate Job Ad
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Create a job ad from a template and requisition data
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

      {/* Error Display */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Step Indicator */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          {[
            { key: 'select', label: 'Select Template & Requisition', icon: DocumentTextIcon },
            { key: 'customize', label: 'Customize Data', icon: DocumentDuplicateIcon },
            { key: 'preview', label: 'Preview & Generate', icon: EyeIcon }
          ].map(({ key, label, icon: Icon }, index) => (
            <div key={key} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                step === key ? 'bg-violet-600 border-violet-600 text-white' :
                ['customize', 'preview'].includes(step) && index < (['select', 'customize', 'preview'].indexOf(step)) ? 'bg-green-500 border-green-500 text-white' :
                'border-gray-300 text-gray-400'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className={`ml-2 text-sm font-medium ${
                step === key ? 'text-violet-600' : 'text-gray-500'
              }`}>
                {label}
              </span>
              {index < 2 && (
                <div className={`ml-4 w-8 h-0.5 ${
                  ['customize', 'preview'].includes(step) && index < (['select', 'customize', 'preview'].indexOf(step)) ? 'bg-green-500' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* Step 1: Select Template and Requisition */}
        {step === 'select' && (
          <div className="space-y-6">
            {/* Template Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Template *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    {template.description && (
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        Used {template.usageCount} times
                      </span>
                      <span className="text-xs text-gray-500">
                        {template.employmentType}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Requisition Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Requisition (Optional)
              </label>
              <div className="space-y-3">
                <div
                  onClick={() => setSelectedRequisition(null)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    !selectedRequisition
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <h3 className="font-semibold text-gray-900">Manual Entry</h3>
                  <p className="text-sm text-gray-600">Enter job details manually</p>
                </div>
                
                {requisitions.map((requisition) => (
                  <div
                    key={requisition.id}
                    onClick={() => setSelectedRequisition(requisition)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedRequisition?.id === requisition.id
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <h3 className="font-semibold text-gray-900">{requisition.jobTitle}</h3>
                    <p className="text-sm text-gray-600">
                      {requisition.department} • {requisition.location} • {requisition.employmentType}
                    </p>
                    {(requisition.salaryMin || requisition.salaryMax) && (
                      <p className="text-sm text-gray-500 mt-1">
                        R{requisition.salaryMin?.toLocaleString()} - R{requisition.salaryMax?.toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setStep('customize')}
                disabled={!selectedTemplate}
                className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next: Customize Data
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Customize Data */}
        {step === 'customize' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customize Placeholder Values</h3>
              <p className="text-sm text-gray-600 mb-6">
                Review and customize the values that will replace placeholders in the template.
              </p>
            </div>

            {selectedRequisition && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">From Requisition: {selectedRequisition.jobTitle}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-green-700">Job Title:</span> {selectedRequisition.jobTitle}
                  </div>
                  <div>
                    <span className="text-green-700">Department:</span> {selectedRequisition.department}
                  </div>
                  <div>
                    <span className="text-green-700">Location:</span> {selectedRequisition.location}
                  </div>
                  <div>
                    <span className="text-green-700">Employment Type:</span> {selectedRequisition.employmentType}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={customData.companyName || ''}
                  onChange={(e) => setCustomData(prev => ({ ...prev, companyName: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
                  placeholder="Your Company Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Application Deadline
                </label>
                <input
                  type="text"
                  value={customData.applicationDeadline || ''}
                  onChange={(e) => setCustomData(prev => ({ ...prev, applicationDeadline: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
                  placeholder="March 31, 2024"
                />
              </div>

              {!selectedRequisition && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={customData.jobTitle || ''}
                      onChange={(e) => setCustomData(prev => ({ ...prev, jobTitle: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
                      placeholder="e.g., Senior Software Engineer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      value={customData.department || ''}
                      onChange={(e) => setCustomData(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
                      placeholder="e.g., Engineering"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={customData.location || ''}
                      onChange={(e) => setCustomData(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
                      placeholder="e.g., San Francisco, CA"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Salary Range
                    </label>
                    <input
                      type="text"
                      value={customData.salaryRange || ''}
                      onChange={(e) => setCustomData(prev => ({ ...prev, salaryRange: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
                      placeholder="e.g., R2,000,000 - R3,000,000"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep('select')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4 mr-2" />
                    Generate Job Ad
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 'preview' && generatedDraft && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Preview Generated Job Ad</h3>
              <p className="text-sm text-gray-600">
                Review the generated job ad and make any necessary adjustments.
              </p>
            </div>

            {renderPreview()}

            <div className="flex justify-between">
              <button
                onClick={() => setStep('customize')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Back to Customize
              </button>
              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('complete')}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Save as Draft
                </button>
                <button
                  onClick={handleComplete}
                  className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
                >
                  Use This Job Ad
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateFromTemplate;