'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

/** Strip dangerous HTML: script tags, event handlers, and javascript: URLs */
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '')
    .replace(/javascript\s*:/gi, '');
}

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

/** Group placeholders by their category for the merge tag panel */
const PLACEHOLDER_GROUPS = [
  {
    title: 'Candidate Details',
    items: DOCUMENT_PLACEHOLDERS.filter(p =>
      ['candidateName', 'jobTitle', 'department'].includes(p.key)
    ),
  },
  {
    title: 'Employment',
    items: DOCUMENT_PLACEHOLDERS.filter(p =>
      ['startDate', 'salary', 'offerDeadline'].includes(p.key)
    ),
  },
  {
    title: 'Organisation',
    items: DOCUMENT_PLACEHOLDERS.filter(p =>
      ['companyName', 'managerName'].includes(p.key)
    ),
  },
];

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const insertPlaceholder = (key: string) => {
    const tag = `{{${key}}}`;
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent =
        formData.content.substring(0, start) +
        tag +
        formData.content.substring(end);
      setFormData(prev => ({ ...prev, content: newContent }));
      // Restore cursor position after the inserted tag
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + tag.length, start + tag.length);
      }, 0);
    } else {
      setFormData(prev => ({ ...prev, content: prev.content + tag }));
    }
  };

  const previewContent = documentTemplateService.replacePlaceholders(formData.content, SAMPLE_DATA);

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-error-bg border border-error/30 rounded-card p-4 text-sm text-error">
          {error}
        </div>
      )}

      {/* Editor Header Bar */}
      <div className="enterprise-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onCancel && (
              <button
                onClick={onCancel}
                className="w-9 h-9 inline-flex items-center justify-center rounded-control border border-border bg-card text-muted-foreground hover:border-primary hover:text-primary hover:bg-surface-navy transition-all"
                title="Back to list"
              >
                <ArrowLeftIcon className="h-4 w-4" />
              </button>
            )}
            <div>
              <h3 className="text-[1.0625rem] font-bold text-foreground">
                {template ? template.name : 'New Template'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {template
                  ? `${DOCUMENT_TEMPLATE_TYPES[template.type]} \u00b7 Last modified ${new Date(template.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                  : 'Unsaved template'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {template && (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                template.isArchived
                  ? 'bg-surface-navy text-muted-foreground'
                  : 'bg-success-bg text-success'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {template.isArchived ? 'Archived' : 'Active'}
              </span>
            )}
            {!template && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-surface-navy text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                Draft
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Form Fields Card */}
      <div className="enterprise-card p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as DocumentTemplateType }))}
              className="w-full px-3 py-2 text-sm border border-border rounded-control bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            >
              {Object.entries(DOCUMENT_TEMPLATE_TYPES).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-border rounded-control bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              placeholder="Template name"
            />
          </div>
        </div>

        {isEmailType && (
          <div className="mb-4">
            <label className="block text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Email Subject</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-border rounded-control bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              placeholder="Email subject line with {{placeholders}}"
            />
          </div>
        )}

        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={formData.isDefault}
            onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
            className="w-4 h-4 rounded"
          />
          Set as default template for this type
        </label>
      </div>

      {/* Editor Layout: Editor + Merge Tags Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Left: Editor */}
        <div className="flex flex-col">
          {/* Toolbar */}
          <div className="flex items-center gap-1 px-3.5 py-2.5 bg-background border border-border border-b-0 rounded-t-control flex-wrap">
            <button
              type="button"
              onClick={() => setShowPlaceholders(true)}
              className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md border border-transparent bg-transparent text-muted-foreground hover:bg-card hover:border-border hover:text-foreground transition-all text-xs font-medium"
              title="Insert placeholder"
            >
              <InformationCircleIcon className="h-4 w-4" />
              Placeholders
            </button>
            <div className="w-px h-6 bg-border mx-1.5" />
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className={`h-9 px-3 inline-flex items-center gap-1.5 rounded-md border text-xs font-medium transition-all ${
                showPreview
                  ? 'bg-primary text-white border-primary'
                  : 'border-transparent bg-transparent text-muted-foreground hover:bg-card hover:border-border hover:text-foreground'
              }`}
              aria-label={showPreview ? 'Switch to editor view' : 'Switch to preview view'}
              title={showPreview ? 'Editor' : 'Preview'}
            >
              {showPreview ? <CodeBracketIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              {showPreview ? 'Editor' : 'Preview'}
            </button>
          </div>

          {/* Content Area */}
          {showPreview ? (
            <div className="flex-1 min-h-[420px] p-6 border border-border rounded-b-control bg-card overflow-y-auto">
              <div className="text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-wider mb-4">
                Preview with sample data
              </div>
              {isEmailType && formData.subject && (
                <div className="mb-4 pb-3 border-b border-border">
                  <span className="text-[0.6875rem] text-muted-foreground uppercase tracking-wider font-bold">Subject: </span>
                  <span className="text-sm font-semibold text-foreground">
                    {documentTemplateService.replacePlaceholders(formData.subject, SAMPLE_DATA)}
                  </span>
                </div>
              )}
              <div
                className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(previewContent) }}
              />
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={20}
              className="flex-1 min-h-[420px] px-6 py-6 text-[0.9375rem] leading-relaxed border border-border rounded-b-control bg-card text-foreground font-mono focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors resize-y"
              placeholder="Enter template content with {{placeholders}}..."
            />
          )}

          {/* Editor Actions */}
          <div className="flex items-center justify-between mt-5">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground border-2 border-border rounded-full hover:border-primary hover:text-primary hover:bg-surface-navy transition-all"
              >
                <EyeIcon className="h-3.5 w-3.5" />
                {showPreview ? 'Editor' : 'Preview'}
              </button>
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground border-2 border-border rounded-full hover:border-primary hover:text-primary hover:bg-surface-navy transition-all"
                >
                  Cancel
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-extrabold uppercase tracking-wider bg-cta text-cta-foreground border-2 border-cta rounded-full hover:bg-cta-hover hover:border-cta-hover transition-all disabled:opacity-50"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              {saving ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </div>

        {/* Right: Merge Tags Panel */}
        <div className="enterprise-card p-5 h-fit lg:sticky lg:top-20">
          <div className="flex items-center gap-2 text-[0.9375rem] font-bold text-foreground mb-1">
            <CodeBracketIcon className="h-4 w-4 text-primary" />
            Merge Tags
          </div>
          <p className="text-xs text-muted-foreground mb-4">Click a tag to insert it at the cursor position</p>

          {PLACEHOLDER_GROUPS.map(group => (
            <div key={group.title}>
              <div className="text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-wider mt-4 mb-2 first:mt-0">
                {group.title}
              </div>
              <div className="flex flex-wrap gap-1.5 mb-1">
                {group.items.map(p => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => insertPlaceholder(p.key)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-border bg-card font-mono text-xs font-semibold text-primary hover:bg-surface-navy hover:border-primary hover:-translate-y-px transition-all"
                    title={p.description}
                  >
                    {`{{${p.key}}}`}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Placeholders modal */}
      {showPlaceholders && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div
            className="enterprise-card w-full max-w-lg p-8 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="doc-placeholders-title"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h4 id="doc-placeholders-title" className="text-lg font-extrabold text-foreground">Available Placeholders</h4>
                <p className="text-[0.8125rem] text-muted-foreground mt-0.5">
                  Use <code className="bg-surface-navy text-primary px-1.5 py-0.5 rounded text-xs font-mono">{'{{placeholderName}}'}</code> syntax in your template content.
                </p>
              </div>
              <button
                onClick={() => setShowPlaceholders(false)}
                className="w-9 h-9 inline-flex items-center justify-center rounded-control border border-border bg-card text-muted-foreground hover:border-primary hover:text-primary hover:bg-surface-navy transition-all"
                aria-label="Close placeholders panel"
              >
                <XMarkIcon className="h-4.5 w-4.5" />
              </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {DOCUMENT_PLACEHOLDERS.map(p => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => {
                    insertPlaceholder(p.key);
                    setShowPlaceholders(false);
                  }}
                  className="w-full flex items-start gap-3 p-3 bg-background rounded-control hover:bg-surface-navy transition-colors text-left"
                >
                  <code className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-mono whitespace-nowrap shrink-0">
                    {`{{${p.key}}}`}
                  </code>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground">{p.label}</div>
                    <div className="text-xs text-muted-foreground">{p.description}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Example: {p.example}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentTemplateEditor;
