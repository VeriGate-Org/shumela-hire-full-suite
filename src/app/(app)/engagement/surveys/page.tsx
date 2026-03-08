'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { engagementService, Survey } from '@/services/engagementService';
import { PlusIcon, ChartBarIcon, PlayIcon, StopIcon, TrashIcon, ClipboardDocumentListIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { aiEngagementService } from '@/services/aiEngagementService';
import { SentimentAnalysisResult } from '@/types/ai';

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [aiSentiment, setAiSentiment] = useState<SentimentAnalysisResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    loadSurveys();
  }, []);

  async function loadSurveys() {
    setLoading(true);
    try {
      const data = await engagementService.getSurveys(0, 100);
      setSurveys(data.content);
    } catch (error) {
      console.error('Failed to load surveys:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleActivate(id: number) {
    try {
      await engagementService.activateSurvey(id);
      loadSurveys();
    } catch (error) {
      console.error('Failed to activate survey:', error);
    }
  }

  async function handleClose(id: number) {
    try {
      await engagementService.closeSurvey(id);
      loadSurveys();
    } catch (error) {
      console.error('Failed to close survey:', error);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this survey?')) return;
    try {
      await engagementService.deleteSurvey(id);
      loadSurveys();
    } catch (error) {
      console.error('Failed to delete survey:', error);
    }
  }

  async function analyzeSentiment() {
    setAiLoading(true);
    try {
      const result = await aiEngagementService.analyzeSentiment({
        surveyName: 'Latest Survey',
        surveyType: 'Engagement',
        totalResponses: surveys.length,
        eNpsScore: 0,
        responses: [],
      });
      setAiSentiment(result);
    } catch (error) {
      console.error('AI sentiment analysis failed:', error);
    } finally {
      setAiLoading(false);
    }
  }

  const filteredSurveys = filter === 'all' ? surveys : surveys.filter(s => s.status === filter);

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      ACTIVE: 'bg-green-100 text-green-800',
      CLOSED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <FeatureGate feature="PULSE_SURVEYS">
      <PageWrapper title="Pulse Surveys" subtitle="Create and manage employee engagement surveys"
        actions={
          <button onClick={analyzeSentiment} disabled={aiLoading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm disabled:opacity-50 flex items-center gap-1">
            <SparklesIcon className="h-4 w-4" />
            {aiLoading ? 'Analysing...' : 'AI Sentiment Analysis'}
          </button>
        }
      >
        {aiSentiment && (
          <div className="mb-6 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-purple-900 dark:text-purple-100 flex items-center gap-2">
                <SparklesIcon className="h-5 w-5" />
                AI Sentiment Analysis
              </h3>
              <button onClick={() => setAiSentiment(null)} className="text-purple-400 hover:text-purple-600 text-sm">Dismiss</button>
            </div>
            <div className="flex items-center gap-4 mb-3">
              <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg text-center">
                <p className="text-xs text-gray-500">Overall Sentiment</p>
                <p className={`text-lg font-bold ${
                  aiSentiment.overallSentiment === 'Positive' ? 'text-green-600' :
                  aiSentiment.overallSentiment === 'Negative' ? 'text-red-600' : 'text-yellow-600'
                }`}>{aiSentiment.overallSentiment}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg text-center">
                <p className="text-xs text-gray-500">Sentiment Score</p>
                <p className="text-lg font-bold text-purple-600">{aiSentiment.sentimentScore}/10</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              {aiSentiment.keyThemes?.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">Key Themes</h4>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    {aiSentiment.keyThemes.map((t, i) => <li key={i}>- {t}</li>)}
                  </ul>
                </div>
              )}
              {aiSentiment.concerns?.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">Concerns</h4>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    {aiSentiment.concerns.map((c, i) => <li key={i}>- {c}</li>)}
                  </ul>
                </div>
              )}
              {aiSentiment.positives?.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">Positives</h4>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    {aiSentiment.positives.map((p, i) => <li key={i}>- {p}</li>)}
                  </ul>
                </div>
              )}
              {aiSentiment.actionItems?.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-1">Action Items</h4>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    {aiSentiment.actionItems.map((a, i) => <li key={i}>- {a}</li>)}
                  </ul>
                </div>
              )}
            </div>
            {aiSentiment.departmentBreakdown?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Department Breakdown</h4>
                <div className="flex gap-2 overflow-x-auto">
                  {aiSentiment.departmentBreakdown.map((d, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 p-2 rounded-lg min-w-[140px] text-center">
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{d.department}</p>
                      <p className={`text-xs font-bold ${
                        d.sentiment === 'Positive' ? 'text-green-600' :
                        d.sentiment === 'Negative' ? 'text-red-600' : 'text-yellow-600'
                      }`}>{d.sentiment}</p>
                      <p className="text-xs text-gray-500">{d.keyIssue}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <div className="space-y-6">
          {/* Filters and Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex gap-2">
              {['all', 'DRAFT', 'ACTIVE', 'CLOSED'].map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-sm rounded-lg ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                  {f === 'all' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
            <button onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
              <PlusIcon className="h-4 w-4 mr-2" /> New Survey
            </button>
          </div>

          {/* Surveys List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : filteredSurveys.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <ClipboardDocumentListIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No surveys found</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredSurveys.map((survey) => (
                <div key={survey.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{survey.title}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${statusBadge(survey.status)}`}>
                          {survey.status}
                        </span>
                        {survey.isAnonymous && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-800">Anonymous</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{survey.description}</p>
                      <div className="mt-2 flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                        {survey.startDate && <span>Start: {new Date(survey.startDate).toLocaleDateString()}</span>}
                        {survey.endDate && <span>End: {new Date(survey.endDate).toLocaleDateString()}</span>}
                        <span>Questions: {survey.questions?.length || 0}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {survey.status === 'ACTIVE' && (
                        <Link href={`/engagement/surveys/${survey.id}`} title="Take Survey"
                          className="p-2 text-gold-600 hover:bg-gold-50 rounded-lg">
                          <ClipboardDocumentListIcon className="h-5 w-5" />
                        </Link>
                      )}
                      {survey.status === 'DRAFT' && (
                        <button onClick={() => handleActivate(survey.id)} title="Activate"
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                          <PlayIcon className="h-5 w-5" />
                        </button>
                      )}
                      {survey.status === 'ACTIVE' && (
                        <button onClick={() => handleClose(survey.id)} title="Close"
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg">
                          <StopIcon className="h-5 w-5" />
                        </button>
                      )}
                      {(survey.status === 'ACTIVE' || survey.status === 'CLOSED') && (
                        <Link href={`/engagement/surveys/${survey.id}/results`} title="View Results"
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                          <ChartBarIcon className="h-5 w-5" />
                        </Link>
                      )}
                      {survey.status === 'DRAFT' && (
                        <button onClick={() => handleDelete(survey.id)} title="Delete"
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
