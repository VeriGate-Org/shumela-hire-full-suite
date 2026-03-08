'use client';

import React, { useState } from 'react';
import OnboardingWizard from '@/components/OnboardingWizard';
import { useRouter } from 'next/navigation';
import { aiHrGeneralService } from '@/services/aiHrGeneralService';
import { OnboardingPlanResult } from '@/types/ai';
import { SparklesIcon } from '@heroicons/react/24/outline';

export default function OnboardingPage() {
  const router = useRouter();
  const [aiPlan, setAiPlan] = useState<OnboardingPlanResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planForm, setPlanForm] = useState({ employeeName: '', jobTitle: '', department: '', startDate: '', experienceLevel: 'Mid-level' });

  const handleComplete = () => {
    router.push('/dashboard');
  };

  async function generatePlan() {
    if (!planForm.employeeName || !planForm.jobTitle) return;
    setAiLoading(true);
    try {
      const result = await aiHrGeneralService.generateOnboardingPlan({
        employeeName: planForm.employeeName,
        jobTitle: planForm.jobTitle,
        department: planForm.department,
        startDate: planForm.startDate,
        experienceLevel: planForm.experienceLevel,
      });
      setAiPlan(result);
      setShowPlanModal(false);
    } catch (error) {
      console.error('AI onboarding plan generation failed:', error);
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with logo */}
      <header className="w-full px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/icons/shumelahire-icon.svg" alt="ShumelaHire" className="h-8 w-8" />
            <span className="font-extrabold text-sm tracking-[-0.03em]">
              <span className="text-primary">Shumela</span><span className="text-cta">Hire</span>
            </span>
          </div>
          <button onClick={() => setShowPlanModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm flex items-center gap-1">
            <SparklesIcon className="h-4 w-4" />
            AI Onboarding Plan
          </button>
        </div>
      </header>

      {/* AI Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-medium mb-4">AI Onboarding Plan Generator</h3>
            <div className="space-y-3">
              <input value={planForm.employeeName} onChange={e => setPlanForm(f => ({...f, employeeName: e.target.value}))}
                placeholder="Employee Name" className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input value={planForm.jobTitle} onChange={e => setPlanForm(f => ({...f, jobTitle: e.target.value}))}
                placeholder="Job Title" className="w-full px-3 py-2 border rounded-lg text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input value={planForm.department} onChange={e => setPlanForm(f => ({...f, department: e.target.value}))}
                  placeholder="Department" className="px-3 py-2 border rounded-lg text-sm" />
                <input type="date" value={planForm.startDate} onChange={e => setPlanForm(f => ({...f, startDate: e.target.value}))}
                  className="px-3 py-2 border rounded-lg text-sm" />
              </div>
              <select value={planForm.experienceLevel} onChange={e => setPlanForm(f => ({...f, experienceLevel: e.target.value}))}
                className="w-full px-3 py-2 border rounded-lg text-sm">
                <option>Junior</option><option>Mid-level</option><option>Senior</option><option>Executive</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowPlanModal(false)} className="px-4 py-2 text-gray-600 text-sm">Cancel</button>
              <button onClick={generatePlan} disabled={aiLoading || !planForm.employeeName || !planForm.jobTitle}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm disabled:opacity-50">
                {aiLoading ? 'Generating...' : 'Generate Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Plan Results */}
      {aiPlan && (
        <div className="mx-6 mb-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-purple-900 flex items-center gap-2">
              <SparklesIcon className="h-5 w-5" />
              AI Onboarding Plan
            </h3>
            <button onClick={() => setAiPlan(null)} className="text-purple-400 hover:text-purple-600 text-sm">Dismiss</button>
          </div>
          <p className="text-sm text-gray-700 mb-3">{aiPlan.welcomeMessage}</p>
          <div className="space-y-3">
            <div className="bg-white p-3 rounded-lg">
              <h4 className="text-sm font-medium text-blue-700 mb-2">Weekly Plan</h4>
              <div className="space-y-2">
                {aiPlan.weeklyPlan?.map((week, i) => (
                  <div key={i} className="border-l-2 border-blue-300 pl-3">
                    <p className="text-xs font-semibold text-gray-800">Week {week.week}: {week.theme}</p>
                    <ul className="text-xs text-gray-600 mt-1 space-y-0.5">
                      {week.tasks?.map((task, j) => <li key={j}>- {task}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded-lg">
                <h4 className="text-sm font-medium text-amber-700 mb-1">Required Training</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  {aiPlan.requiredTraining?.map((t, i) => <li key={i}>- {t}</li>)}
                </ul>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <h4 className="text-sm font-medium text-green-700 mb-1">Key Meetings</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  {aiPlan.keyMeetings?.map((m, i) => <li key={i}>- {m}</li>)}
                </ul>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <h4 className="text-sm font-medium text-purple-700 mb-1">Success Metrics</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  {aiPlan.successMetrics?.map((s, i) => <li key={i}>- {s}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Centered wizard */}
      <main className="flex-1 flex items-center justify-center px-4 pb-12">
        <OnboardingWizard companyName="ShumelaHire" onComplete={handleComplete} />
      </main>

      {/* Minimal footer */}
      <footer className="w-full px-6 py-4 text-center">
        <p className="text-xs text-gray-400">&copy; 2026 <span className="text-primary">Shumela</span><span className="text-cta">Hire</span> by Arthmatic DevWorks</p>
      </footer>
    </div>
  );
}
