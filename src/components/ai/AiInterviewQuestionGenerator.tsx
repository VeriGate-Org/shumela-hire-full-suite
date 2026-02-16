'use client';

import React, { useState } from 'react';
import { aiInterviewService } from '@/services/aiInterviewService';
import AiDisclaimer from './AiDisclaimer';
import { InterviewType, GeneratedQuestion, InterviewQuestionsResult } from '@/types/ai';

interface AiInterviewQuestionGeneratorProps {
  jobTitle?: string;
  jobRequirements?: string[];
  onApply?: (questions: GeneratedQuestion[]) => void;
}

const interviewTypes: { value: InterviewType; label: string }[] = [
  { value: 'TECHNICAL', label: 'Technical' },
  { value: 'BEHAVIORAL', label: 'Behavioural' },
  { value: 'COMPETENCY', label: 'Competency' },
  { value: 'PANEL', label: 'Panel' },
  { value: 'CASE_STUDY', label: 'Case Study' },
];

export default function AiInterviewQuestionGenerator({ jobTitle: initialTitle, jobRequirements: initialReqs, onApply }: AiInterviewQuestionGeneratorProps) {
  const [jobTitle, setJobTitle] = useState(initialTitle || '');
  const [interviewType, setInterviewType] = useState<InterviewType>('TECHNICAL');
  const [level, setLevel] = useState('Senior');
  const [questionCount, setQuestionCount] = useState(5);
  const [candidateExperience, setCandidateExperience] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [candidateSkills, setCandidateSkills] = useState<string[]>([]);
  const [jobRequirements] = useState<string[]>(initialReqs || []);
  const [result, setResult] = useState<InterviewQuestionsResult | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  const addSkill = () => {
    if (!skillInput.trim()) return;
    setCandidateSkills(prev => [...prev, skillInput.trim()]);
    setSkillInput('');
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = await aiInterviewService.generateQuestions({
        jobTitle,
        jobRequirements,
        interviewType,
        candidateExperience,
        candidateSkills,
        questionCount,
        level,
      });
      setResult(data);
      setSelected(new Set(data.questions.map((_, i) => i)));
    } catch (error) {
      console.error('Failed to generate questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestion = (index: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toUpperCase()) {
      case 'JUNIOR': return 'bg-green-100 text-green-800';
      case 'MID': return 'bg-blue-100 text-blue-800';
      case 'SENIOR': return 'bg-orange-100 text-orange-800';
      case 'LEAD': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-teal-500" />
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">AI Interview Questions</h3>
        <span className="text-[10px] font-medium bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded">AI-generated</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Job Title</label>
          <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)}
            className="w-full text-sm p-2 border border-gray-300 rounded-md" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Interview Type</label>
          <select value={interviewType} onChange={e => setInterviewType(e.target.value as InterviewType)}
            className="w-full text-sm p-2 border border-gray-300 rounded-md">
            {interviewTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Level</label>
          <select value={level} onChange={e => setLevel(e.target.value)}
            className="w-full text-sm p-2 border border-gray-300 rounded-md">
            <option value="Junior">Junior</option>
            <option value="Mid-Level">Mid-Level</option>
            <option value="Senior">Senior</option>
            <option value="Lead">Lead</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Number of Questions</label>
          <input type="number" min={1} max={15} value={questionCount} onChange={e => setQuestionCount(Number(e.target.value))}
            className="w-full text-sm p-2 border border-gray-300 rounded-md" />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Candidate Experience</label>
          <input type="text" value={candidateExperience} onChange={e => setCandidateExperience(e.target.value)}
            className="w-full text-sm p-2 border border-gray-300 rounded-md" placeholder="e.g. 5 years in backend development" />
        </div>
      </div>

      {/* Skills */}
      <div>
        <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Candidate Skills</label>
        <div className="flex gap-2">
          <input type="text" value={skillInput} onChange={e => setSkillInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addSkill()}
            className="flex-1 text-sm p-2 border border-gray-300 rounded-md" placeholder="Add a skill" />
          <button onClick={addSkill} className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">Add</button>
        </div>
        {candidateSkills.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {candidateSkills.map((s, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-violet-50 text-violet-700 text-xs rounded-md">
                {s}
                <button onClick={() => setCandidateSkills(prev => prev.filter((_, j) => j !== i))} className="text-violet-400 hover:text-violet-600">&times;</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <button onClick={handleGenerate} disabled={loading || !jobTitle}
        className="px-4 py-2 text-sm bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed">
        {loading ? 'Generating...' : 'Generate Questions'}
      </button>

      {/* Results */}
      {result && result.questions && result.questions.length > 0 && (
        <div className="space-y-2">
          {result.questions.map((q, i) => (
            <div key={i} className={`border rounded-lg p-3 cursor-pointer transition-colors ${selected.has(i) ? 'border-violet-300 bg-violet-50' : 'border-gray-200 bg-gray-50'}`}
              onClick={() => toggleQuestion(i)}>
              <div className="flex items-start gap-3">
                <input type="checkbox" checked={selected.has(i)} onChange={() => toggleQuestion(i)}
                  className="mt-1 rounded border-gray-300 text-violet-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{q.question}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">{q.category}</span>
                    <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded ${getDifficultyColor(q.difficulty)}`}>{q.difficulty}</span>
                  </div>
                  {q.expectedAnswer && (
                    <p className="text-xs text-gray-500 mt-1 italic">{q.expectedAnswer}</p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {onApply && (
            <button onClick={() => onApply(result.questions.filter((_, i) => selected.has(i)))}
              disabled={selected.size === 0}
              className="px-4 py-2 text-sm bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed">
              Apply {selected.size} Question{selected.size !== 1 ? 's' : ''} to Interview
            </button>
          )}
          <AiDisclaimer level="advisory" />
        </div>
      )}
    </div>
  );
}
