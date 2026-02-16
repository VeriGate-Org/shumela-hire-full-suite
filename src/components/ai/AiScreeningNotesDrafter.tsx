'use client';

import React, { useState } from 'react';
import { aiScreeningNotesService } from '@/services/aiScreeningNotesService';
import AiDisclaimer from './AiDisclaimer';
import { ScreeningNotesResult } from '@/types/ai';

interface AiScreeningNotesDrafterProps {
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  onApply?: (notes: string) => void;
}

export default function AiScreeningNotesDrafter({ applicationId, candidateName, jobTitle, onApply }: AiScreeningNotesDrafterProps) {
  const [bulletPoints, setBulletPoints] = useState<string[]>([]);
  const [currentPoint, setCurrentPoint] = useState('');
  const [tone, setTone] = useState<'formal' | 'neutral' | 'concise'>('neutral');
  const [result, setResult] = useState<ScreeningNotesResult | null>(null);
  const [editedNotes, setEditedNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const addPoint = () => {
    if (!currentPoint.trim()) return;
    setBulletPoints(prev => [...prev, currentPoint.trim()]);
    setCurrentPoint('');
  };

  const removePoint = (index: number) => {
    setBulletPoints(prev => prev.filter((_, i) => i !== index));
  };

  const handleDraft = async () => {
    setLoading(true);
    try {
      const data = await aiScreeningNotesService.draft({
        applicationId,
        candidateName,
        jobTitle,
        bulletPoints,
        tone,
      });
      setResult(data);
      setEditedNotes(data.draftNotes);
    } catch (error) {
      console.error('Failed to draft screening notes:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-teal-500" />
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">AI Screening Notes</h3>
        <span className="text-[10px] font-medium bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded">AI-generated</span>
      </div>

      <p className="text-xs text-gray-500">
        {candidateName} &mdash; {jobTitle}
      </p>

      {/* Bullet points input */}
      <div>
        <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Observations</label>
        <div className="flex gap-2">
          <input type="text" value={currentPoint} onChange={e => setCurrentPoint(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addPoint()}
            className="flex-1 text-sm p-2 border border-gray-300 rounded-md" placeholder="Add an observation" />
          <button onClick={addPoint} className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">Add</button>
        </div>
        {bulletPoints.length > 0 && (
          <ul className="mt-2 space-y-1">
            {bulletPoints.map((point, i) => (
              <li key={i} className="flex items-center justify-between text-sm text-gray-700 bg-gray-50 px-3 py-1.5 rounded-md">
                <span>{point}</span>
                <button onClick={() => removePoint(i)} className="text-gray-400 hover:text-red-500 text-xs ml-2">&times;</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Tone selector */}
      <div>
        <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Tone</label>
        <div className="flex gap-2">
          {(['formal', 'neutral', 'concise'] as const).map(t => (
            <button key={t} onClick={() => setTone(t)}
              className={`px-3 py-1.5 text-xs rounded-md border ${tone === t ? 'bg-violet-600 text-white border-violet-600' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <button onClick={handleDraft} disabled={loading || bulletPoints.length === 0}
        className="px-4 py-2 text-sm bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed">
        {loading ? 'Drafting...' : 'Draft Notes'}
      </button>

      {/* Result */}
      {result && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
          <textarea value={editedNotes} onChange={e => setEditedNotes(e.target.value)}
            rows={8} className="w-full text-sm p-3 border border-gray-300 rounded-md resize-y leading-relaxed" />
          <div className="flex gap-2">
            <button onClick={() => navigator.clipboard.writeText(editedNotes)}
              className="px-3 py-1.5 text-xs border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100">
              Copy
            </button>
            {onApply && (
              <button onClick={() => onApply(editedNotes)}
                className="px-3 py-1.5 text-xs bg-violet-600 text-white rounded-md hover:bg-violet-700">
                Apply to Application
              </button>
            )}
          </div>
          <AiDisclaimer level="advisory" />
        </div>
      )}
    </div>
  );
}
