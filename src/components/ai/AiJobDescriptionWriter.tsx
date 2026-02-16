'use client';

import React, { useState } from 'react';
import { aiJobDescriptionService } from '@/services/aiJobDescriptionService';
import AiDisclaimer from './AiDisclaimer';
import { JobDescriptionRequest, JobDescriptionResult, BiasCheckResult } from '@/types/ai';

interface AiJobDescriptionWriterProps {
  onApply?: (result: JobDescriptionResult) => void;
  initialTitle?: string;
  initialDepartment?: string;
}

export default function AiJobDescriptionWriter({ onApply, initialTitle, initialDepartment }: AiJobDescriptionWriterProps) {
  const [form, setForm] = useState<JobDescriptionRequest>({
    title: initialTitle || '',
    department: initialDepartment || '',
    level: '',
    employmentType: 'Full-time',
    location: '',
    keyResponsibilities: [],
    keyRequirements: [],
  });
  const [responsibilityInput, setResponsibilityInput] = useState('');
  const [requirementInput, setRequirementInput] = useState('');
  const [result, setResult] = useState<JobDescriptionResult | null>(null);
  const [biasResult, setBiasResult] = useState<BiasCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [biasLoading, setBiasLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = await aiJobDescriptionService.generate(form);
      setResult(data);
      setBiasResult(null);
    } catch (error) {
      console.error('Failed to generate job description:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBiasCheck = async () => {
    if (!result) return;
    setBiasLoading(true);
    try {
      const fullText = [result.intro, ...(result.responsibilities || []), ...(result.requirements || [])].join('\n');
      const data = await aiJobDescriptionService.checkBias(fullText);
      setBiasResult(data);
    } catch (error) {
      console.error('Failed to check bias:', error);
    } finally {
      setBiasLoading(false);
    }
  };

  const addItem = (field: 'keyResponsibilities' | 'keyRequirements', value: string, setter: (v: string) => void) => {
    if (!value.trim()) return;
    setForm(prev => ({ ...prev, [field]: [...prev[field], value.trim()] }));
    setter('');
  };

  const removeItem = (field: 'keyResponsibilities' | 'keyRequirements', index: number) => {
    setForm(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-teal-500" />
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">AI Job Description Writer</h3>
        <span className="text-[10px] font-medium bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded">AI-generated</span>
      </div>

      {/* Form */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Title</label>
          <input type="text" value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
            className="w-full text-sm p-2 border border-gray-300 rounded-md" placeholder="e.g. Senior Software Engineer" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Department</label>
          <input type="text" value={form.department} onChange={e => setForm(prev => ({ ...prev, department: e.target.value }))}
            className="w-full text-sm p-2 border border-gray-300 rounded-md" placeholder="e.g. Engineering" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Level</label>
          <select value={form.level} onChange={e => setForm(prev => ({ ...prev, level: e.target.value }))}
            className="w-full text-sm p-2 border border-gray-300 rounded-md">
            <option value="">Select level</option>
            <option value="Junior">Junior</option>
            <option value="Mid-Level">Mid-Level</option>
            <option value="Senior">Senior</option>
            <option value="Lead">Lead</option>
            <option value="Principal">Principal</option>
            <option value="Director">Director</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Employment Type</label>
          <select value={form.employmentType} onChange={e => setForm(prev => ({ ...prev, employmentType: e.target.value }))}
            className="w-full text-sm p-2 border border-gray-300 rounded-md">
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Location</label>
          <input type="text" value={form.location} onChange={e => setForm(prev => ({ ...prev, location: e.target.value }))}
            className="w-full text-sm p-2 border border-gray-300 rounded-md" placeholder="e.g. Johannesburg, South Africa" />
        </div>
      </div>

      {/* Responsibilities */}
      <div>
        <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Key Responsibilities</label>
        <div className="flex gap-2">
          <input type="text" value={responsibilityInput} onChange={e => setResponsibilityInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addItem('keyResponsibilities', responsibilityInput, setResponsibilityInput)}
            className="flex-1 text-sm p-2 border border-gray-300 rounded-md" placeholder="Add a responsibility" />
          <button onClick={() => addItem('keyResponsibilities', responsibilityInput, setResponsibilityInput)}
            className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">Add</button>
        </div>
        {form.keyResponsibilities.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {form.keyResponsibilities.map((item, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-violet-50 text-violet-700 text-xs rounded-md">
                {item}
                <button onClick={() => removeItem('keyResponsibilities', i)} className="text-violet-400 hover:text-violet-600">&times;</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Requirements */}
      <div>
        <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Key Requirements</label>
        <div className="flex gap-2">
          <input type="text" value={requirementInput} onChange={e => setRequirementInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addItem('keyRequirements', requirementInput, setRequirementInput)}
            className="flex-1 text-sm p-2 border border-gray-300 rounded-md" placeholder="Add a requirement" />
          <button onClick={() => addItem('keyRequirements', requirementInput, setRequirementInput)}
            className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">Add</button>
        </div>
        {form.keyRequirements.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {form.keyRequirements.map((item, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-violet-50 text-violet-700 text-xs rounded-md">
                {item}
                <button onClick={() => removeItem('keyRequirements', i)} className="text-violet-400 hover:text-violet-600">&times;</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <button onClick={handleGenerate} disabled={loading || !form.title}
        className="px-4 py-2 text-sm bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed">
        {loading ? 'Generating...' : 'Generate Job Description'}
      </button>

      {/* Result Preview */}
      {result && (
        <div className="border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50">
          <h4 className="text-lg font-bold text-gray-900">{result.title}</h4>
          {result.intro && <p className="text-sm text-gray-700 leading-relaxed">{result.intro}</p>}

          {result.responsibilities && result.responsibilities.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Responsibilities</h5>
              <ul className="space-y-1">
                {result.responsibilities.map((r, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-violet-500 mt-1">&#8226;</span>{r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.requirements && result.requirements.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Requirements</h5>
              <ul className="space-y-1">
                {result.requirements.map((r, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-violet-500 mt-1">&#8226;</span>{r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.benefits && result.benefits.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Benefits</h5>
              <ul className="space-y-1">
                {result.benefits.map((b, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-violet-500 mt-1">&#8226;</span>{b}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.biasWarnings && result.biasWarnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <h5 className="text-xs font-semibold text-yellow-800 uppercase tracking-wider mb-1">Bias Warnings</h5>
              {result.biasWarnings.map((w, i) => (
                <p key={i} className="text-sm text-yellow-700">{w}</p>
              ))}
            </div>
          )}

          {biasResult && (
            <div className={`border rounded-md p-3 ${biasResult.biasWarnings && biasResult.biasWarnings.length > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
              <h5 className="text-xs font-semibold uppercase tracking-wider mb-1 text-gray-700">Bias Analysis</h5>
              <p className="text-sm text-gray-700">{biasResult.overallAssessment}</p>
              {biasResult.biasWarnings && biasResult.biasWarnings.map((w, i) => (
                <p key={i} className="text-sm text-yellow-700 mt-1">{w}</p>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button onClick={handleBiasCheck} disabled={biasLoading}
              className="px-3 py-1.5 text-xs border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-50">
              {biasLoading ? 'Checking...' : 'Check for Bias'}
            </button>
            <button onClick={() => navigator.clipboard.writeText(JSON.stringify(result, null, 2))}
              className="px-3 py-1.5 text-xs border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100">
              Copy JSON
            </button>
            {onApply && (
              <button onClick={() => onApply(result)}
                className="px-3 py-1.5 text-xs bg-violet-600 text-white rounded-md hover:bg-violet-700">
                Apply to Job Posting
              </button>
            )}
          </div>
          <AiDisclaimer level="advisory" />
        </div>
      )}
    </div>
  );
}
