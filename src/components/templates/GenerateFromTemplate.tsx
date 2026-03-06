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
import { getEnumLabel } from '@/utils/enumLabels';

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
  const [_showPreview, _setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'customize' | 'preview' | 'complete'>('select');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [templatesData, requisitionsData] = await Promise.all([
          jobTemplateService.getAllTemplates({ showArchived: false }),
          requisitionService.getAllRequisitions()
        ]);
        setTemplates(templatesData);
        setRequisitions(requisitionsData);
      } catch {
        setError('Failed to load data');
      }
    };

    loadData();
  }, []);

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
      <div className="bg-card rounded-card p-5 border border-border">
        <div className="space-y-5">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {generatedDraft.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {generatedDraft.location} &middot; {getEnumLabel('employmentType', generatedDraft.employmentType)}
            </p>
            {(generatedDraft.salaryRangeMin || generatedDraft.salaryRangeMax) && (
              <p className="text-sm text-muted-foreground mt-1">
                Salary: R{generatedDraft.salaryRangeMin?.toLocaleString()} - R{generatedDraft.salaryRangeMax?.toLocaleString()}
              </p>
            )}
          </div>

          {generatedDraft.intro && (
            <div
              className="prose prose-sm max-w-none text-foreground"
              dangerouslySetInnerHTML={{ __html: generatedDraft.intro }}
            />
          )}

          {generatedDraft.responsibilities && (
            <div
              className="prose prose-sm max-w-none text-foreground"
              dangerouslySetInnerHTML={{ __html: generatedDraft.responsibilities }}
            />
          )}

          {generatedDraft.requirements && (
            <div
              className="prose prose-sm max-w-none text-foreground"
              dangerouslySetInnerHTML={{ __html: generatedDraft.requirements }}
            />
          )}

          {generatedDraft.benefits && (
            <div
              className="prose prose-sm max-w-none text-foreground"
              dangerouslySetInnerHTML={{ __html: generatedDraft.benefits }}
            />
          )}

          <div className="border-t border-border pt-5">
            <h3 className="text-sm font-semibold text-foreground mb-2">How to Apply</h3>
            <p className="text-sm text-muted-foreground">
              To apply for this position, please send your resume and cover letter to:{' '}
              <strong className="text-foreground">{generatedDraft.contactEmail}</strong>
            </p>
            {generatedDraft.closingDate && (
              <p className="text-sm text-muted-foreground mt-2">
                Application deadline: {new Date(generatedDraft.closingDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }, [generatedDraft]);

  const inputClasses = "w-full border border-border rounded-control px-3 py-2 bg-background text-foreground text-sm focus:ring-2 focus:ring-cta/40 focus:border-primary";

  if (step === 'complete') {
    return (
      <div className={`text-center py-12 ${className}`}>
        <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">Job Ad Generated</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Your job ad draft has been created successfully and is ready for review.
        </p>
        <div className="flex justify-center space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-border text-sm text-muted-foreground rounded-full hover:bg-accent transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleComplete}
            className="inline-flex items-center px-4 py-2 border-2 border-cta text-sm font-medium rounded-full text-cta bg-transparent hover:bg-cta hover:text-foreground uppercase tracking-wider transition-colors"
          >
            View Draft
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center">
            <SparklesIcon className="w-5 h-5 mr-2" />
            Generate Job Ad
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Create a job ad from a template and requisition data
          </p>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-card">
          <div className="text-red-800 text-sm">{error}</div>
        </div>
      )}

      {/* Step Indicator */}
      <div className="mb-5 p-3 bg-muted rounded-card border border-border">
        <div className="flex items-center space-x-4">
          {[
            { key: 'select', label: 'Select Template & Requisition', icon: DocumentTextIcon },
            { key: 'customize', label: 'Customize Data', icon: DocumentDuplicateIcon },
            { key: 'preview', label: 'Preview & Generate', icon: EyeIcon }
          ].map(({ key, label, icon: Icon }, index) => (
            <div key={key} className="flex items-center">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full border-2 ${
                step === key ? 'bg-cta border-cta text-foreground' :
                ['customize', 'preview'].includes(step) && index < (['select', 'customize', 'preview'].indexOf(step)) ? 'bg-green-500 border-green-500 text-white' :
                'border-border text-muted-foreground'
              }`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className={`ml-2 text-xs font-medium ${
                step === key ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {label}
              </span>
              {index < 2 && (
                <div className={`ml-4 w-8 h-0.5 ${
                  ['customize', 'preview'].includes(step) && index < (['select', 'customize', 'preview'].indexOf(step)) ? 'bg-green-500' : 'bg-border'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        {/* Step 1: Select Template and Requisition */}
        {step === 'select' && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-[0.05em] mb-2">
                Select Template *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={`p-4 border-2 rounded-card cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id
                        ? 'border-cta bg-cta/10'
                        : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    <h3 className="text-sm font-semibold text-foreground">{template.name}</h3>
                    {template.description && (
                      <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        Used {template.usageCount} times
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {getEnumLabel('employmentType', template.employmentType)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-[0.05em] mb-2">
                Select Requisition (Optional)
              </label>
              <div className="space-y-2">
                <div
                  onClick={() => setSelectedRequisition(null)}
                  className={`p-4 border-2 rounded-card cursor-pointer transition-colors ${
                    !selectedRequisition
                      ? 'border-cta bg-cta/10'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <h3 className="text-sm font-semibold text-foreground">Manual Entry</h3>
                  <p className="text-xs text-muted-foreground">Enter job details manually</p>
                </div>

                {requisitions.map((requisition) => (
                  <div
                    key={requisition.id}
                    onClick={() => setSelectedRequisition(requisition)}
                    className={`p-4 border-2 rounded-card cursor-pointer transition-colors ${
                      selectedRequisition?.id === requisition.id
                        ? 'border-cta bg-cta/10'
                        : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    <h3 className="text-sm font-semibold text-foreground">{requisition.jobTitle}</h3>
                    <p className="text-xs text-muted-foreground">
                      {requisition.department} &middot; {requisition.location} &middot; {getEnumLabel('employmentType', requisition.employmentType)}
                    </p>
                    {(requisition.salaryMin || requisition.salaryMax) && (
                      <p className="text-xs text-muted-foreground mt-1">
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
                className="inline-flex items-center px-4 py-2 border-2 border-cta text-sm font-medium rounded-full text-cta bg-transparent hover:bg-cta hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider transition-colors"
              >
                Next: Customize Data
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Customize Data */}
        {step === 'customize' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">Customize Placeholder Values</h3>
              <p className="text-xs text-muted-foreground">
                Review and customize the values that will replace placeholders in the template.
              </p>
            </div>

            {selectedRequisition && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-card">
                <h4 className="text-sm font-medium text-green-900 mb-2">From Requisition: {selectedRequisition.jobTitle}</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
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
                    <span className="text-green-700">Employment Type:</span> {getEnumLabel('employmentType', selectedRequisition.employmentType)}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-[0.05em] mb-1.5">
                  Company Name
                </label>
                <input
                  type="text"
                  value={customData.companyName || ''}
                  onChange={(e) => setCustomData(prev => ({ ...prev, companyName: e.target.value }))}
                  className={inputClasses}
                  placeholder="Your Company Name"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-[0.05em] mb-1.5">
                  Application Deadline
                </label>
                <input
                  type="text"
                  value={customData.applicationDeadline || ''}
                  onChange={(e) => setCustomData(prev => ({ ...prev, applicationDeadline: e.target.value }))}
                  className={inputClasses}
                  placeholder="March 31, 2024"
                />
              </div>

              {!selectedRequisition && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground uppercase tracking-[0.05em] mb-1.5">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={customData.jobTitle || ''}
                      onChange={(e) => setCustomData(prev => ({ ...prev, jobTitle: e.target.value }))}
                      className={inputClasses}
                      placeholder="e.g., Senior Software Engineer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground uppercase tracking-[0.05em] mb-1.5">
                      Department
                    </label>
                    <input
                      type="text"
                      value={customData.department || ''}
                      onChange={(e) => setCustomData(prev => ({ ...prev, department: e.target.value }))}
                      className={inputClasses}
                      placeholder="e.g., Engineering"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground uppercase tracking-[0.05em] mb-1.5">
                      Location
                    </label>
                    <input
                      type="text"
                      value={customData.location || ''}
                      onChange={(e) => setCustomData(prev => ({ ...prev, location: e.target.value }))}
                      className={inputClasses}
                      placeholder="e.g., San Francisco, CA"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground uppercase tracking-[0.05em] mb-1.5">
                      Salary Range
                    </label>
                    <input
                      type="text"
                      value={customData.salaryRange || ''}
                      onChange={(e) => setCustomData(prev => ({ ...prev, salaryRange: e.target.value }))}
                      className={inputClasses}
                      placeholder="e.g., R2,000,000 - R3,000,000"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep('select')}
                className="px-4 py-2 border border-border text-sm text-muted-foreground rounded-full hover:bg-accent transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border-2 border-cta text-sm font-medium rounded-full text-cta bg-transparent hover:bg-cta hover:text-foreground disabled:opacity-50 uppercase tracking-wider transition-colors"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
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
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">Preview Generated Job Ad</h3>
              <p className="text-xs text-muted-foreground">
                Review the generated job ad and make any necessary adjustments.
              </p>
            </div>

            {renderPreview()}

            <div className="flex justify-between">
              <button
                onClick={() => setStep('customize')}
                className="px-4 py-2 border border-border text-sm text-muted-foreground rounded-full hover:bg-accent transition-colors"
              >
                Back to Customize
              </button>
              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('complete')}
                  className="px-4 py-2 border border-border text-sm text-muted-foreground rounded-full hover:bg-accent transition-colors"
                >
                  Save as Draft
                </button>
                <button
                  onClick={handleComplete}
                  className="inline-flex items-center px-4 py-2 border-2 border-cta text-sm font-medium rounded-full text-cta bg-transparent hover:bg-cta hover:text-foreground uppercase tracking-wider transition-colors"
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
