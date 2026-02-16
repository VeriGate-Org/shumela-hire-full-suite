'use client';

import React, { useState } from 'react';
import { aiEmailService } from '@/services/aiEmailService';
import AiDisclaimer from './AiDisclaimer';
import { EmailType, EmailDraftResult } from '@/types/ai';

interface AiEmailDrafterProps {
  candidateName?: string;
  jobTitle?: string;
  onSend?: (subject: string, body: string) => void;
}

const emailTypes: { value: EmailType; label: string }[] = [
  { value: 'INTERVIEW_INVITATION', label: 'Interview Invitation' },
  { value: 'REJECTION', label: 'Rejection' },
  { value: 'OFFER', label: 'Offer' },
  { value: 'FOLLOW_UP', label: 'Follow-up' },
];

export default function AiEmailDrafter({ candidateName: initialName, jobTitle: initialJob, onSend }: AiEmailDrafterProps) {
  const [emailType, setEmailType] = useState<EmailType>('INTERVIEW_INVITATION');
  const [candidateName, setCandidateName] = useState(initialName || '');
  const [jobTitle, setJobTitle] = useState(initialJob || '');
  const [tone, setTone] = useState<'formal' | 'friendly' | 'concise'>('formal');
  const [contextKey, setContextKey] = useState('');
  const [contextValue, setContextValue] = useState('');
  const [context, setContext] = useState<Record<string, string>>({});
  const [result, setResult] = useState<EmailDraftResult | null>(null);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedBody, setEditedBody] = useState('');
  const [loading, setLoading] = useState(false);

  const addContext = () => {
    if (!contextKey.trim() || !contextValue.trim()) return;
    setContext(prev => ({ ...prev, [contextKey.trim()]: contextValue.trim() }));
    setContextKey('');
    setContextValue('');
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = await aiEmailService.draft({ emailType, candidateName, jobTitle, context, tone });
      setResult(data);
      setEditedSubject(data.subject);
      setEditedBody(data.body);
    } catch (error) {
      console.error('Failed to draft email:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-teal-500" />
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">AI Email Drafter</h3>
        <span className="text-[10px] font-medium bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded">AI-generated</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Email Type</label>
          <select value={emailType} onChange={e => setEmailType(e.target.value as EmailType)}
            className="w-full text-sm p-2 border border-gray-300 rounded-md">
            {emailTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Tone</label>
          <div className="flex gap-2">
            {(['formal', 'friendly', 'concise'] as const).map(t => (
              <button key={t} onClick={() => setTone(t)}
                className={`px-3 py-1.5 text-xs rounded-md border ${tone === t ? 'bg-violet-600 text-white border-violet-600' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Candidate Name</label>
          <input type="text" value={candidateName} onChange={e => setCandidateName(e.target.value)}
            className="w-full text-sm p-2 border border-gray-300 rounded-md" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Job Title</label>
          <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)}
            className="w-full text-sm p-2 border border-gray-300 rounded-md" />
        </div>
      </div>

      {/* Additional context */}
      <div>
        <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Additional Context</label>
        <div className="flex gap-2">
          <input type="text" value={contextKey} onChange={e => setContextKey(e.target.value)}
            className="w-1/3 text-sm p-2 border border-gray-300 rounded-md" placeholder="Key" />
          <input type="text" value={contextValue} onChange={e => setContextValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addContext()}
            className="flex-1 text-sm p-2 border border-gray-300 rounded-md" placeholder="Value" />
          <button onClick={addContext} className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">Add</button>
        </div>
        {Object.keys(context).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {Object.entries(context).map(([k, v]) => (
              <span key={k} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                <strong>{k}:</strong> {v}
                <button onClick={() => { const c = { ...context }; delete c[k]; setContext(c); }}
                  className="text-gray-400 hover:text-red-500">&times;</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <button onClick={handleGenerate} disabled={loading || !candidateName}
        className="px-4 py-2 text-sm bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed">
        {loading ? 'Drafting...' : 'Generate Email'}
      </button>

      {/* Result */}
      {result && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Subject</label>
            <input type="text" value={editedSubject} onChange={e => setEditedSubject(e.target.value)}
              className="w-full text-sm p-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Body</label>
            <textarea value={editedBody} onChange={e => setEditedBody(e.target.value)}
              rows={10} className="w-full text-sm p-3 border border-gray-300 rounded-md resize-y leading-relaxed" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigator.clipboard.writeText(`Subject: ${editedSubject}\n\n${editedBody}`)}
              className="px-3 py-1.5 text-xs border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100">
              Copy
            </button>
            {onSend && (
              <button onClick={() => onSend(editedSubject, editedBody)}
                className="px-3 py-1.5 text-xs bg-violet-600 text-white rounded-md hover:bg-violet-700">
                Send Email
              </button>
            )}
          </div>
          <AiDisclaimer level="advisory" />
        </div>
      )}
    </div>
  );
}
