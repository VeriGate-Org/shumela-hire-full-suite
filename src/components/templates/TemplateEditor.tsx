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

  // Initialize form data
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

  // Initialize preview data with sample values
  useEffect(() => {
    setPreviewData({
      jobTitle: 'Senior Software Engineer',
      department: 'Engineering',
      location: 'San Francisco, CA',
      employmentType: 'Full-time',
      salaryRange: '$120,000 - $180,000',
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

      // Validate required fields
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
        // Update existing template
        const updated = await jobTemplateService.updateTemplate(template.id, formData);
        if (!updated) throw new Error('Failed to update template');
        savedTemplate = updated;
      } else {
        // Create new template
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

  const insertPlaceholder = (placeholder: string, targetField: keyof JobAdTemplate) => {
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

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {template ? 'Edit Template' : 'Create New Template'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {template ? `Editing: ${template.name}` : 'Create a reusable job ad template'}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowPlaceholders(!showPlaceholders)}
              className="inline-flex items-center px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              <CodeBracketIcon className="w-4 h-4 mr-1" />
              Placeholders
            </button>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`inline-flex items-center px-3 py-1 text-sm border rounded transition-colors ${
                showPreview 
                  ? 'bg-violet-600 text-white border-violet-600' 
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <EyeIcon className="w-4 h-4 mr-1" />
              Preview
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-200px)]">
        {/* Main Editor */}
        <div className={`${showPreview ? 'w-1/2' : 'w-full'} overflow-y-auto`}>
          <div className="p-6">
            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="text-red-800">{error}</div>
              </div>
            )}

            {/* Basic Info */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
                  placeholder="e.g., Software Engineer Template"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
                  placeholder="Brief description of this template"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employment Type
                  </label>
                  <select
                    value={formData.employmentType || 'Full-time'}
                    onChange={(e) => handleInputChange('employmentType', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    value={formData.contactEmail || ''}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
                    placeholder="careers@company.com"
                  />
                </div>
              </div>

              {/* Job Title Template */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title Template *
                </label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
                  placeholder="{{jobTitle}} - {{department}}"
                />
              </div>

              {/* Location Template */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location Template
                </label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
                  placeholder="{{location}}"
                />
              </div>

              {/* Rich Text Content Fields */}
              {[
                { key: 'intro', label: 'Introduction', placeholder: 'Write an engaging introduction...' },
                { key: 'responsibilities', label: 'Responsibilities', placeholder: 'List key responsibilities...' },
                { key: 'requirements', label: 'Requirements', placeholder: 'Specify requirements and qualifications...' },
                { key: 'benefits', label: 'Benefits', placeholder: 'Describe benefits and perks...' }
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                  </label>
                  <textarea
                    value={(formData[key as keyof JobAdTemplate] as string) || ''}
                    onChange={(e) => handleInputChange(key as keyof JobAdTemplate, e.target.value)}
                    rows={6}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400 font-mono text-sm"
                    placeholder={placeholder}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supports HTML formatting and placeholders like {`{{jobTitle}}`}
                  </p>
                </div>
              ))}

              {/* Salary Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salary Range (Optional)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="number"
                      value={formData.salaryRangeMin || ''}
                      onChange={(e) => handleInputChange('salaryRangeMin', parseInt(e.target.value) || undefined)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
                      placeholder="Min salary"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      value={formData.salaryRangeMax || ''}
                      onChange={(e) => handleInputChange('salaryRangeMax', parseInt(e.target.value) || undefined)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
                      placeholder="Max salary"
                    />
                  </div>
                </div>
              </div>

              {/* Closing Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Closing Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.closingDate ? formData.closingDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => handleInputChange('closingDate', e.target.value ? new Date(e.target.value) : undefined)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50 flex items-center"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
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
          <div className="w-1/2 border-l border-gray-200 bg-gray-50">
            <div className="p-6 h-full overflow-y-auto">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <EyeIcon className="w-5 h-5 mr-2" />
                  Preview
                </h3>
                
                <div className="space-y-6">
                  {/* Job Title */}
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {preview.title || 'Job Title Preview'}
                    </h1>
                    <p className="text-gray-600 mt-1">
                      {preview.location} • {preview.employmentType}
                    </p>
                  </div>

                  {/* Introduction */}
                  {preview.intro && (
                    <div>
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: preview.intro }}
                      />
                    </div>
                  )}

                  {/* Responsibilities */}
                  {preview.responsibilities && (
                    <div>
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: preview.responsibilities }}
                      />
                    </div>
                  )}

                  {/* Requirements */}
                  {preview.requirements && (
                    <div>
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: preview.requirements }}
                      />
                    </div>
                  )}

                  {/* Benefits */}
                  {preview.benefits && (
                    <div>
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: preview.benefits }}
                      />
                    </div>
                  )}

                  {/* Contact */}
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-sm text-gray-600">
                      To apply, please send your resume to:{' '}
                      <strong>{preview.contactEmail}</strong>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Available Placeholders</h3>
                <button
                  onClick={() => setShowPlaceholders(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {TEMPLATE_PLACEHOLDERS.map((placeholder) => (
                  <div key={placeholder.key} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                            {placeholder.key}
                          </code>
                          <span className="ml-2 font-medium text-gray-900">
                            {placeholder.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {placeholder.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Example: {placeholder.example}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-violet-50 rounded-lg">
                <div className="flex">
                  <InformationCircleIcon className="w-5 h-5 text-violet-400 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm text-violet-800">
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