'use client';

import React, { useState, useEffect } from 'react';
import {
  DocumentTemplate,
  DocumentTemplateType,
  DOCUMENT_TEMPLATE_TYPES,
  EMAIL_TYPES,
  DOCUMENT_PLACEHOLDERS,
} from '../../types/documentTemplate';
import { documentTemplateService } from '../../services/documentTemplateService';
import {
  EyeIcon,
  CodeBracketIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface DocumentTemplateEditorProps {
  template?: DocumentTemplate;
  onSave?: (template: DocumentTemplate) => void;
  onCancel?: () => void;
}

const SAMPLE_DATA: Record<string, string> = {
  candidateName: 'Jane Smith',
  jobTitle: 'Senior Software Engineer',
  department: 'Engineering',
  startDate: '1 April 2026',
  salary: 'R 850,000 per annum',
  companyName: 'Acme Corp',
  managerName: 'John Doe',
  offerDeadline: '15 March 2026',
};

const DocumentTemplateEditor: React.FC<DocumentTemplateEditorProps> = ({
  template,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    type: 'OFFER_LETTER' as DocumentTemplateType,
    name: '',
    subject: '',
    content: '',
    isDefault: false,
  });

  const [showPreview, setShowPreview] = useState(false);
  const [showPlaceholders, setShowPlaceholders] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (template) {
      setFormData({
        type: template.type,
        name: template.name,
        subject: template.subject || '',
        content: template.content,
        isDefault: template.isDefault,
      });
    }
  }, [template]);

  const isEmailType = EMAIL_TYPES.includes(formData.type);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Template name is required');
      return;
    }
    if (!formData.content.trim()) {
      setError('Template content is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let result: DocumentTemplate | null;
      if (template) {
        result = await documentTemplateService.updateTemplate(template.id, {
          type: formData.type,
          name: formData.name,
          subject: formData.subject || undefined,
          content: formData.content,
          isDefault: formData.isDefault,
        });
      } else {
        result = await documentTemplateService.createTemplate(
          {
            type: formData.type,
            name: formData.name,
            subject: formData.subject || undefined,
            content: formData.content,
            isDefault: formData.isDefault,
            isArchived: false,
            createdBy: '',
          },
          ''
        );
      }
      if (result && onSave) onSave(result);
    } catch {
      setError('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const previewContent = documentTemplateService.replacePlaceholders(formData.content, SAMPLE_DATA);

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-[2px] p-3 text-xs text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Header controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {template ? 'Edit Template' : 'New Template'}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPlaceholders(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-[2px] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <InformationCircleIcon className="h-3.5 w-3.5" />
            Placeholders
          </button>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] rounded-[2px] transition-colors ${
              showPreview
                ? 'bg-primary text-white'
                : 'text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            {showPreview ? <CodeBracketIcon className="h-3.5 w-3.5" /> : <EyeIcon className="h-3.5 w-3.5" />}
            {showPreview ? 'Editor' : 'Preview'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Form fields */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as DocumentTemplateType }))}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-[2px] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-ring/30"
              >
                {Object.entries(DOCUMENT_TEMPLATE_TYPES).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-[2px] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-ring/30"
                placeholder="Template name"
              />
            </div>
          </div>

          {isEmailType && (
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email Subject</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-[2px] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-ring/30"
                placeholder="Email subject line with {{placeholders}}"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Content (HTML)</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={18}
              className="w-full px-2.5 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-[2px] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono focus:outline-none focus:ring-2 focus:ring-ring/30"
              placeholder="Enter template content with {{placeholders}}..."
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isDefault}
              onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
              className="w-3.5 h-3.5"
            />
            Set as default template for this type
          </label>
        </div>

        {/* Preview panel */}
        {showPreview && (
          <div className="bg-white dark:bg-charcoal border border-gray-200 dark:border-gray-700 rounded-[2px] p-4 overflow-auto max-h-[600px]">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-3">Preview with sample data</div>
            {isEmailType && formData.subject && (
              <div className="mb-3 pb-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-[10px] text-gray-400">Subject: </span>
                <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                  {documentTemplateService.replacePlaceholders(formData.subject, SAMPLE_DATA)}
                </span>
              </div>
            )}
            <div
              className="prose prose-sm dark:prose-invert max-w-none text-xs"
              dangerouslySetInnerHTML={{ __html: previewContent }}
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-1.5 text-xs font-medium bg-primary text-white rounded-[2px] hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-[2px] hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Placeholders modal */}
      {showPlaceholders && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white dark:bg-charcoal border border-gray-200 dark:border-gray-700 rounded-[2px] w-full max-w-lg p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Available Placeholders</h4>
              <button onClick={() => setShowPlaceholders(false)}>
                <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Use <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-[10px]">{'{{placeholderName}}'}</code> syntax in your template content.
            </p>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {DOCUMENT_PLACEHOLDERS.map(p => (
                <div key={p.key} className="flex items-start gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-[2px]">
                  <code className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono whitespace-nowrap">
                    {`{{${p.key}}}`}
                  </code>
                  <div>
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300">{p.label}</div>
                    <div className="text-[10px] text-gray-500">{p.description}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">Example: {p.example}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentTemplateEditor;
