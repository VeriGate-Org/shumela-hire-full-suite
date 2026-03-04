'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { JobAdTemplate, TEMPLATE_PLACEHOLDERS, DEFAULT_TEMPLATE_CONTENT } from '../../types/jobTemplate';
import { jobTemplateService } from '../../services/jobTemplateService';
import {
  EyeIcon,
  CodeBracketIcon,
  InformationCircleIcon,
  XMarkIcon,
  DocumentCheckIcon
} from '@heroicons/react/24/outline';

interface TemplateEditorProps {
  template?: JobAdTemplate;
  onSave?: (template: JobAdTemplate) => void;
  onCancel?: () => void;
  className?: string;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  onSave,
  onCancel,
  className = ''
}) => {
  const [formData, setFormData] = useState<Partial<JobAdTemplate>>({
    name: '',
    description: '',
    title: '',
    intro: '',
    responsibilities: '',
    requirements: '',
    benefits: '',
    location: '',
    employmentType: 'Full-time',
    salaryRangeMin: undefined,
    salaryRangeMax: undefined,
    closingDate: undefined,
    contactEmail: '',
    isArchived: false
  });

  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<Record<string, string>>({});
  const [showPlaceholders, setShowPlaceholders] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (template) {
      setFormData(template);
    } else {
      setFormData({
        name: '',
        description: '',
        ...DEFAULT_TEMPLATE_CONTENT,
        employmentType: 'Full-time',
        isArchived: false
      });
    }
  }, [template]);

  useEffect(() => {
    setPreviewData({
      jobTitle: 'Senior Software Engineer',
      department: 'Engineering',
      location: 'San Francisco, CA',
      employmentType: 'Full-time',
      salaryRange: 'R120,000 - R180,000',
      companyName: 'TechCorp Inc.',
      contactEmail: 'careers@techcorp.com',
      applicationDeadline: 'March 31, 2024'
    });
  }, []);

  const handleInputChange = (field: keyof JobAdTemplate, value: string | number | boolean | Date | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!formData.name?.trim()) {
        throw new Error('Template name is required');
      }
      if (!formData.title?.trim()) {
        throw new Error('Job title template is required');
      }
      if (!formData.contactEmail?.trim()) {
        throw new Error('Contact email is required');
      }

      let savedTemplate: JobAdTemplate;

      if (template) {
        const updated = await jobTemplateService.updateTemplate(template.id, formData);
        if (!updated) throw new Error('Failed to update template');
        savedTemplate = updated;
      } else {
        savedTemplate = await jobTemplateService.createTemplate(
          formData as Omit<JobAdTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>,
          formData.createdBy || 'current_user@company.com'
        );
      }

      onSave?.(savedTemplate);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const _insertPlaceholder = (placeholder: string, targetField: keyof JobAdTemplate) => {
    const currentValue = (formData[targetField] as string) || '';
    const newValue = currentValue + placeholder;
    handleInputChange(targetField, newValue);
  };

  const renderPreview = useCallback(() => {
    const replacePlaceholders = (content: string) => {
      let result = content;
      for (const [key, value] of Object.entries(previewData)) {
        const placeholder = key.startsWith('{{') ? key : `{{${key}}}`;
        const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
        result = result.replace(regex, value);
      }
      return result;
    };

    return {
      title: replacePlaceholders(formData.title || ''),
      intro: replacePlaceholders(formData.intro || ''),
      responsibilities: replacePlaceholders(formData.responsibilities || ''),
      requirements: replacePlaceholders(formData.requirements || ''),
      benefits: replacePlaceholders(formData.benefits || ''),
      location: replacePlaceholders(formData.location || ''),
      employmentType: replacePlaceholders(formData.employmentType || ''),
      contactEmail: replacePlaceholders(formData.contactEmail || '')
    };
  }, [formData, previewData]);

  const preview = renderPreview();

  const inputClasses = "w-full border border-border rounded-control px-3 py-2 bg-background text-foreground text-sm focus:ring-2 focus:ring-cta/40 focus:border-primary";

  return (
    <div className={`bg-card rounded-card ${className}`}>
      {/* Header */}
      <div className="px-4 md:px-5 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {template ? 'Edit Template' : 'Create New Template'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {template ? `Editing: ${template.name}` : 'Create a reusable job ad template'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowPlaceholders(!showPlaceholders)}
              className="inline-flex items-center px-3 py-1.5 text-xs border border-border rounded-full text-muted-foreground hover:bg-accent transition-colors"
            >
              <CodeBracketIcon className="w-3.5 h-3.5 mr-1" />
              Placeholders
            </button>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`inline-flex items-center px-3 py-1.5 text-xs rounded-full transition-colors ${
                showPreview
                  ? 'border-2 border-cta text-cta'
                  : 'border border-border text-muted-foreground hover:bg-accent'
              }`}
            >
              <EyeIcon className="w-3.5 h-3.5 mr-1" />
              Preview
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-200px)]">
        {/* Main Editor */}
        <div className={`${showPreview ? 'w-1/2' : 'w-full'} overflow-y-auto`}>
          <div className="p-4 md:p-5">
            {error && (
              <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-card">
                <div className="text-red-800 text-sm">{error}</div>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-[0.05em] mb-1.5">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={inputClasses}
                  placeholder="e.g., Software Engineer Template"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-[0.05em] mb-1.5">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className={inputClasses}
                  placeholder="Brief description of this template"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-[0.05em] mb-1.5">
                    Employment Type
                  </label>
                  <select
                    value={formData.employmentType || 'Full-time'}
                    onChange={(e) => handleInputChange('employmentType', e.target.value)}
                    className={inputClasses}
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-[0.05em] mb-1.5">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    value={formData.contactEmail || ''}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    className={inputClasses}
                    placeholder="careers@company.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-[0.05em] mb-1.5">
                  Job Title Template *
                </label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={inputClasses}
                  placeholder="{{jobTitle}} - {{department}}"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-[0.05em] mb-1.5">
                  Location Template
                </label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className={inputClasses}
                  placeholder="{{location}}"
                />
              </div>

              {[
                { key: 'intro', label: 'Introduction', placeholder: 'Write an engaging introduction...' },
                { key: 'responsibilities', label: 'Responsibilities', placeholder: 'List key responsibilities...' },
                { key: 'requirements', label: 'Requirements', placeholder: 'Specify requirements and qualifications...' },
                { key: 'benefits', label: 'Benefits', placeholder: 'Describe benefits and perks...' }
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-[0.05em] mb-1.5">
                    {label}
                  </label>
                  <textarea
                    value={(formData[key as keyof JobAdTemplate] as string) || ''}
                    onChange={(e) => handleInputChange(key as keyof JobAdTemplate, e.target.value)}
                    rows={6}
                    className={`${inputClasses} font-mono`}
                    placeholder={placeholder}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports HTML formatting and placeholders like {`{{jobTitle}}`}
                  </p>
                </div>
              ))}

              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-[0.05em] mb-1.5">
                  Salary Range (Optional)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    value={formData.salaryRangeMin || ''}
                    onChange={(e) => handleInputChange('salaryRangeMin', parseInt(e.target.value) || undefined)}
                    className={inputClasses}
                    placeholder="Min salary"
                  />
                  <input
                    type="number"
                    value={formData.salaryRangeMax || ''}
                    onChange={(e) => handleInputChange('salaryRangeMax', parseInt(e.target.value) || undefined)}
                    className={inputClasses}
                    placeholder="Max salary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-[0.05em] mb-1.5">
                  Default Closing Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.closingDate ? formData.closingDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => handleInputChange('closingDate', e.target.value ? new Date(e.target.value) : undefined)}
                  className={inputClasses}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-4 md:px-5 py-4 border-t border-border flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-border text-muted-foreground text-sm rounded-full hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border-2 border-cta text-sm font-medium rounded-full text-cta bg-transparent hover:bg-cta hover:text-foreground disabled:opacity-50 uppercase tracking-wider transition-colors"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <DocumentCheckIcon className="w-4 h-4 mr-2" />
                  {template ? 'Update Template' : 'Create Template'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className="w-1/2 border-l border-border bg-background">
            <div className="p-4 md:p-5 h-full overflow-y-auto">
              <div className="bg-card rounded-card p-5 border border-border">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center">
                  <EyeIcon className="w-4 h-4 mr-2" />
                  Preview
                </h3>

                <div className="space-y-5">
                  <div>
                    <h1 className="text-xl font-bold text-foreground">
                      {preview.title || 'Job Title Preview'}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      {preview.location} &middot; {preview.employmentType}
                    </p>
                  </div>

                  {preview.intro && (
                    <div
                      className="prose prose-sm max-w-none text-foreground"
                      dangerouslySetInnerHTML={{ __html: preview.intro }}
                    />
                  )}

                  {preview.responsibilities && (
                    <div
                      className="prose prose-sm max-w-none text-foreground"
                      dangerouslySetInnerHTML={{ __html: preview.responsibilities }}
                    />
                  )}

                  {preview.requirements && (
                    <div
                      className="prose prose-sm max-w-none text-foreground"
                      dangerouslySetInnerHTML={{ __html: preview.requirements }}
                    />
                  )}

                  {preview.benefits && (
                    <div
                      className="prose prose-sm max-w-none text-foreground"
                      dangerouslySetInnerHTML={{ __html: preview.benefits }}
                    />
                  )}

                  <div className="border-t border-border pt-4">
                    <p className="text-xs text-muted-foreground">
                      To apply, please send your resume to:{' '}
                      <strong className="text-foreground">{preview.contactEmail}</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Placeholders Panel */}
      {showPlaceholders && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-card max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-border shadow-xl">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Available Placeholders</h3>
                <button
                  onClick={() => setShowPlaceholders(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {TEMPLATE_PLACEHOLDERS.map((placeholder) => (
                  <div key={placeholder.key} className="border border-border rounded-card p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <code className="text-xs bg-muted px-2 py-0.5 rounded-control font-mono text-foreground">
                            {placeholder.key}
                          </code>
                          <span className="ml-2 text-sm font-medium text-foreground">
                            {placeholder.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {placeholder.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Example: {placeholder.example}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 p-3 bg-cta/10 rounded-card">
                <div className="flex">
                  <InformationCircleIcon className="w-4 h-4 text-primary mt-0.5" />
                  <div className="ml-2">
                    <p className="text-xs text-foreground">
                      <strong>Tip:</strong> Copy and paste placeholders into your template content.
                      They will be automatically replaced with actual values when generating job ads.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateEditor;
