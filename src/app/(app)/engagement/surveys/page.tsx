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

  async function handleActivate(id: string) {
    try {
      await engagementService.activateSurvey(id);
      loadSurveys();
    } catch (error) {
      console.error('Failed to activate survey:', error);
    }
  }

  async function handleClose(id: string) {
    try {
      await engagementService.closeSurvey(id);
      loadSurveys();
    } catch (error) {
      console.error('Failed to close survey:', error);
    }
  }

  async function handleDelete(id: string) {
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

  const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    ACTIVE: { bg: 'bg-success-bg', text: 'text-green-800 dark:text-green-300', dot: 'bg-success', label: 'Active' },
    DRAFT: { bg: 'bg-muted', text: 'text-muted-foreground', dot: 'bg-muted-foreground', label: 'Draft' },
    CLOSED: { bg: 'bg-[var(--icon-bg-gold)]', text: 'text-amber-800 dark:text-amber-300', dot: 'bg-accent-gold', label: 'Completed' },
  };

  const tabItems = [
    { key: 'all', label: 'All' },
    { key: 'ACTIVE', label: 'Active' },
    { key: 'DRAFT', label: 'Draft' },
    { key: 'CLOSED', label: 'Completed' },
  ];

  // Compute stats from real data
  const activeSurveyCount = surveys.filter(s => s.status === 'ACTIVE').length;
  const totalQuestions = surveys.reduce((sum, s) => sum + (s.questions?.length || 0), 0);

  // Sentiment color mapping
  const sentimentColor = (sentiment: string) => {
    if (sentiment === 'Positive') return 'text-success';
    if (sentiment === 'Negative') return 'text-destructive';
    return 'text-warning';
  };

  // Department bar colors for AI breakdown
  const deptBarColors = ['bg-accent-teal', 'bg-primary', 'bg-accent-gold', 'bg-accent-teal', 'bg-accent-pink'];

  return (
    <FeatureGate feature="PULSE_SURVEYS">
      <PageWrapper title="Pulse Surveys" subtitle="Create surveys, track engagement, and analyse employee sentiment"
        actions={
          <button onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-button bg-cta text-cta-foreground font-semibold text-xs uppercase tracking-wider hover:bg-cta-hover transition-colors">
            <PlusIcon className="h-4 w-4" />
            Create Survey
          </button>
        }
      >
        {/* ====== STAT CARDS ====== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Active Surveys */}
          <div className="enterprise-card p-5 flex items-center gap-4">
            <div className="flex-shrink-0 w-[52px] h-[52px] rounded-card bg-[var(--icon-bg-navy)] flex items-center justify-center">
              <ClipboardDocumentListIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-foreground leading-none mb-1">{activeSurveyCount}</div>
              <div className="text-[0.813rem] font-semibold text-muted-foreground">Active Surveys</div>
            </div>
          </div>
          {/* Avg Response Rate */}
          <div className="enterprise-card p-5 flex items-center gap-4">
            <div className="flex-shrink-0 w-[52px] h-[52px] rounded-card bg-[var(--icon-bg-teal)] flex items-center justify-center">
              <ChartBarIcon className="h-6 w-6 text-accent-teal" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-foreground leading-none mb-1">
                {aiSentiment ? `${Math.round(aiSentiment.sentimentScore * 10)}%` : '--'}
              </div>
              <div className="text-[0.813rem] font-semibold text-muted-foreground">Avg Response Rate</div>
            </div>
          </div>
          {/* Sentiment Score */}
          <div className="enterprise-card p-5 flex items-center gap-4">
            <div className="flex-shrink-0 w-[52px] h-[52px] rounded-card bg-[var(--icon-bg-gold)] flex items-center justify-center">
              <SparklesIcon className="h-6 w-6 text-accent-gold" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-foreground leading-none mb-1">
                {aiSentiment ? aiSentiment.sentimentScore.toFixed(1) : '--'}
              </div>
              <div className="text-[0.813rem] font-semibold text-muted-foreground">Sentiment Score</div>
            </div>
          </div>
          {/* Questions Created */}
          <div className="enterprise-card p-5 flex items-center gap-4">
            <div className="flex-shrink-0 w-[52px] h-[52px] rounded-card bg-[var(--icon-bg-pink)] flex items-center justify-center">
              <svg className="h-6 w-6 text-accent-pink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-foreground leading-none mb-1">{totalQuestions}</div>
              <div className="text-[0.813rem] font-semibold text-muted-foreground">Questions Created</div>
            </div>
          </div>
        </div>

        {/* ====== CONTENT LAYOUT: Surveys + Sentiment Sidebar ====== */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">

          {/* Left Column: Tabbed Survey List */}
          <div className="enterprise-card overflow-hidden">
            {/* Tabs Header */}
            <div className="flex border-b border-border px-6 overflow-x-auto">
              {tabItems.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-5 py-4 font-semibold text-sm whitespace-nowrap border-b-2 transition-colors relative top-[1px] ${
                    filter === tab.key
                      ? 'text-primary border-primary'
                      : 'text-muted-foreground border-transparent hover:text-primary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Panel Content */}
            <div className="p-6">
              {loading ? (
                /* Skeleton Loading */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="border border-border rounded-card p-5 animate-pulse">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                          <div className="h-3 bg-muted rounded w-1/2" />
                        </div>
                        <div className="h-5 bg-muted rounded-button w-16" />
                      </div>
                      <div className="my-3">
                        <div className="flex justify-between mb-1.5">
                          <div className="h-3 bg-muted rounded w-24" />
                          <div className="h-3 bg-muted rounded w-8" />
                        </div>
                        <div className="h-1.5 bg-muted rounded-full w-full" />
                      </div>
                      <div className="pt-3 border-t border-border flex justify-between items-center">
                        <div className="h-3 bg-muted rounded w-32" />
                        <div className="h-7 bg-muted rounded-button w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredSurveys.length === 0 ? (
                /* Empty State */
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                    <ClipboardDocumentListIcon className="h-9 w-9 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">No surveys found</h3>
                  <p className="text-sm text-muted-foreground">There are currently no surveys with this status.</p>
                </div>
              ) : (
                /* Survey Cards Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredSurveys.map((survey) => {
                    const config = statusConfig[survey.status] || statusConfig.DRAFT;
                    const questionCount = survey.questions?.length || 0;

                    return (
                      <div key={survey.id} className="border border-border rounded-card p-5 bg-card transition-all hover:shadow-sm">
                        {/* Card Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-[0.938rem] text-foreground mb-1 truncate">{survey.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {survey.startDate
                                ? new Date(survey.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                                : 'TBD'
                              }
                              {' \u2013 '}
                              {survey.endDate
                                ? new Date(survey.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                                : 'TBD'
                              }
                            </div>
                          </div>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-button text-xs font-semibold leading-none ${config.bg} ${config.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                            {config.label}
                          </span>
                        </div>

                        {/* Description */}
                        {survey.description && (
                          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{survey.description}</p>
                        )}

                        {/* Response Rate Bar */}
                        <div className="my-3">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-xs font-semibold text-muted-foreground">Questions</span>
                            <span className="text-sm font-extrabold text-foreground">{questionCount}</span>
                          </div>
                          <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-500"
                              style={{ width: `${Math.min(questionCount * 10, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Anonymous Badge */}
                        {survey.isAnonymous && (
                          <div className="mb-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-button text-[0.688rem] font-semibold bg-surface-teal text-accent-teal">
                              Anonymous
                            </span>
                          </div>
                        )}

                        {/* Card Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-border">
                          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
                            </svg>
                            {questionCount} question{questionCount !== 1 ? 's' : ''}
                          </span>
                          <div className="flex items-center gap-1">
                            {survey.status === 'ACTIVE' && (
                              <Link href={`/engagement/surveys/${survey.id}`} title="Take Survey"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button bg-accent-teal text-white text-xs font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity">
                                Take Survey
                              </Link>
                            )}
                            {survey.status === 'CLOSED' && (
                              <Link href={`/engagement/surveys/${survey.id}/results`} title="View Results"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button border-2 border-border text-muted-foreground text-xs font-semibold uppercase tracking-wider hover:border-primary hover:text-primary transition-colors">
                                View Results
                              </Link>
                            )}
                            {survey.status === 'DRAFT' && (
                              <>
                                <button onClick={() => handleActivate(survey.id)} title="Activate"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button border-2 border-border text-muted-foreground text-xs font-semibold uppercase tracking-wider hover:border-primary hover:text-primary transition-colors">
                                  Activate
                                </button>
                                <button onClick={() => handleDelete(survey.id)} title="Delete"
                                  className="p-1.5 rounded-full text-muted-foreground hover:bg-error-bg hover:text-destructive transition-colors">
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            {survey.status === 'ACTIVE' && (
                              <>
                                <button onClick={() => handleClose(survey.id)} title="Close Survey"
                                  className="p-1.5 rounded-full text-muted-foreground hover:bg-warning-bg hover:text-warning transition-colors">
                                  <StopIcon className="h-4 w-4" />
                                </button>
                                <Link href={`/engagement/surveys/${survey.id}/results`} title="View Results"
                                  className="p-1.5 rounded-full text-muted-foreground hover:bg-[var(--icon-bg-navy)] hover:text-primary transition-colors">
                                  <ChartBarIcon className="h-4 w-4" />
                                </Link>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: AI Sentiment Panel */}
          <div>
            <div className="enterprise-card p-6">
              {/* Panel Header */}
              <div className="flex items-center gap-2 mb-5">
                <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                </svg>
                <h2 className="text-base font-bold text-foreground">AI Sentiment Analysis</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-button text-[0.625rem] font-bold uppercase tracking-wider bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                  <SparklesIcon className="h-2.5 w-2.5" />
                  AI
                </span>
              </div>

              {!aiSentiment ? (
                /* Pre-analysis State */
                <div className="text-center py-8">
                  <div className="text-center pb-6 border-b border-border mb-5">
                    <div>
                      <span className="text-[3.5rem] font-extrabold text-muted-foreground leading-none">--</span>
                      <span className="text-xl font-semibold text-muted-foreground">/10</span>
                    </div>
                    <div className="text-[0.813rem] text-muted-foreground mt-1.5">Overall Sentiment Score</div>
                    <div className="w-full h-2 bg-border rounded-full overflow-hidden mt-3">
                      <div className="h-full rounded-full bg-border w-0" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Run AI analysis to see sentiment insights from your survey data.
                  </p>
                  <button
                    onClick={analyzeSentiment}
                    disabled={aiLoading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-button bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <SparklesIcon className="h-4 w-4" />
                    {aiLoading ? 'Analysing...' : 'Run Analysis'}
                  </button>
                </div>
              ) : (
                /* Analysis Results */
                <>
                  {/* Sentiment Score Gauge */}
                  <div className="text-center py-6 border-b border-border mb-5">
                    <div>
                      <span className={`text-[3.5rem] font-extrabold leading-none ${sentimentColor(aiSentiment.overallSentiment)}`}>
                        {aiSentiment.sentimentScore.toFixed(1)}
                      </span>
                      <span className="text-xl font-semibold text-muted-foreground">/10</span>
                    </div>
                    <div className="text-[0.813rem] text-muted-foreground mt-1.5">
                      Overall Sentiment: <span className={`font-bold ${sentimentColor(aiSentiment.overallSentiment)}`}>{aiSentiment.overallSentiment}</span>
                    </div>
                    <div className="w-full h-2 bg-border rounded-full overflow-hidden mt-3 relative">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${aiSentiment.sentimentScore * 10}%`,
                          background: 'linear-gradient(90deg, var(--error) 0%, var(--warning) 40%, var(--success) 70%, var(--accent-teal) 100%)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Trending Themes / Key Themes */}
                  {aiSentiment.keyThemes?.length > 0 && (
                    <div className="mb-5">
                      <div className="font-bold text-[0.813rem] text-muted-foreground uppercase tracking-wider mb-3">Trending Themes</div>
                      <div className="flex flex-wrap gap-2">
                        {aiSentiment.keyThemes.map((theme, i) => {
                          const dotColors = ['bg-accent-teal', 'bg-primary', 'bg-accent-gold', 'bg-accent-pink', 'bg-success'];
                          return (
                            <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-semibold border border-border bg-card text-foreground">
                              <span className={`w-2 h-2 rounded-full ${dotColors[i % dotColors.length]}`} />
                              {theme}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Positives & Concerns */}
                  {aiSentiment.positives?.length > 0 && (
                    <div className="mb-5">
                      <div className="font-bold text-[0.813rem] text-muted-foreground uppercase tracking-wider mb-3">Positives</div>
                      <ul className="space-y-1.5">
                        {aiSentiment.positives.map((p, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                            <span className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 flex-shrink-0" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {aiSentiment.concerns?.length > 0 && (
                    <div className="mb-5">
                      <div className="font-bold text-[0.813rem] text-muted-foreground uppercase tracking-wider mb-3">Concerns</div>
                      <ul className="space-y-1.5">
                        {aiSentiment.concerns.map((c, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                            <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 flex-shrink-0" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Items */}
                  {aiSentiment.actionItems?.length > 0 && (
                    <div className="mb-5">
                      <div className="font-bold text-[0.813rem] text-muted-foreground uppercase tracking-wider mb-3">Action Items</div>
                      <ul className="space-y-1.5">
                        {aiSentiment.actionItems.map((a, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent-gold mt-1.5 flex-shrink-0" />
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Department Comparison (horizontal bar chart) */}
                  {aiSentiment.departmentBreakdown?.length > 0 && (
                    <div className="mb-5">
                      <div className="font-bold text-[0.813rem] text-muted-foreground uppercase tracking-wider mb-3">Department Comparison</div>
                      <div className="flex flex-col gap-2.5">
                        {aiSentiment.departmentBreakdown.map((d, i) => {
                          const score = d.sentiment === 'Positive' ? 8 : d.sentiment === 'Negative' ? 4 : 6;
                          const pct = score * 10;
                          return (
                            <div key={i} className="flex items-center gap-3">
                              <div className="text-xs font-semibold text-foreground w-[120px] flex-shrink-0 text-right truncate">{d.department}</div>
                              <div className="flex-1 h-5 bg-muted rounded overflow-hidden relative">
                                <div
                                  className={`h-full rounded flex items-center justify-end pr-2 transition-all duration-500 ${deptBarColors[i % deptBarColors.length]}`}
                                  style={{ width: `${pct}%` }}
                                >
                                  <span className="text-[0.625rem] font-bold text-white">{score.toFixed(1)}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Dismiss / Re-run Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <button
                      onClick={() => setAiSentiment(null)}
                      className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={analyzeSentiment}
                      disabled={aiLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      <SparklesIcon className="h-3 w-3" />
                      {aiLoading ? 'Analysing...' : 'Re-run'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
