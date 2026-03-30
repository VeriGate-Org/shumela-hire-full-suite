'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { useAuth } from '@/contexts/AuthContext';
import {
  engagementService,
  Survey,
  SurveyQuestion,
} from '@/services/engagementService';
import {
  ArrowLeftIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function SurveyDetailPage() {
  const params = useParams();
  const surveyId = Number(params.id);
  const { user } = useAuth();

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<number, string | number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchSurvey = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await engagementService.getSurvey(surveyId);
      setSurvey(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [surveyId]);

  useEffect(() => {
    if (surveyId) {
      fetchSurvey();
    }
  }, [surveyId, fetchSurvey]);

  function handleResponseChange(questionId: number, value: string | number) {
    setResponses((prev) => ({ ...prev, [questionId]: value }));
  }

  async function handleSubmit() {
    if (!survey || !survey.questions) return;

    // Validate required questions
    const missingRequired = survey.questions
      .filter((q) => q.isRequired)
      .filter((q) => responses[q.id] === undefined || responses[q.id] === '');

    if (missingRequired.length > 0) {
      setSubmitError(
        `Please answer all required questions. Missing: ${missingRequired.length} question(s).`
      );
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);

      const responseData = Object.entries(responses).map(([questionId, value]) => ({
        questionId: Number(questionId),
        value: String(value),
      }));

      await engagementService.submitSurveyResponse(surveyId, {
        responses: responseData,
        respondentId: user?.id,
      });

      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  }

  function renderQuestion(question: SurveyQuestion) {
    const { id, questionText, questionType, options, isRequired } = question;

    return (
      <div key={id} className="bg-white rounded-[10px] border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-900 mb-3">
          {questionText}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </label>

        {questionType === 'RATING_1_5' && (
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => handleResponseChange(id, n)}
                className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                  responses[id] === n
                    ? 'bg-gold-500 text-violet-950'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        )}

        {questionType === 'RATING_1_10' && (
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => handleResponseChange(id, n)}
                className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                  responses[id] === n
                    ? 'bg-gold-500 text-violet-950'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        )}

        {questionType === 'YES_NO' && (
          <div className="flex gap-4">
            {['Yes', 'No'].map((option) => (
              <label key={option} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`question-${id}`}
                  value={option}
                  checked={responses[id] === option}
                  onChange={() => handleResponseChange(id, option)}
                  className="w-4 h-4 text-gold-500 focus:ring-gold-500"
                />
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        )}

        {questionType === 'MULTIPLE_CHOICE' && (() => {
          let parsedOptions: string[] = [];
          try {
            parsedOptions = options ? JSON.parse(options) : [];
          } catch {
            parsedOptions = [];
          }
          return (
            <div className="space-y-2">
              {parsedOptions.map((option: string) => (
                <label key={option} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`question-${id}`}
                    value={option}
                    checked={responses[id] === option}
                    onChange={() => handleResponseChange(id, option)}
                    className="w-4 h-4 text-gold-500 focus:ring-gold-500"
                  />
                  <span className="text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          );
        })()}

        {questionType === 'FREE_TEXT' && (
          <textarea
            value={(responses[id] as string) || ''}
            onChange={(e) => handleResponseChange(id, e.target.value)}
            rows={4}
            placeholder="Type your response..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold-500 focus:border-gold-500 resize-none"
          />
        )}

        {questionType === 'NPS' && (
          <div>
            <div className="flex flex-wrap gap-1.5">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
                let bgColor = 'bg-gray-100 text-gray-700 hover:bg-gray-200';
                if (responses[id] === n) {
                  if (n <= 6) bgColor = 'bg-red-500 text-white';
                  else if (n <= 8) bgColor = 'bg-yellow-500 text-white';
                  else bgColor = 'bg-green-500 text-white';
                } else {
                  if (n <= 6) bgColor = 'bg-red-50 text-red-700 hover:bg-red-100';
                  else if (n <= 8) bgColor = 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100';
                  else bgColor = 'bg-green-50 text-green-700 hover:bg-green-100';
                }
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => handleResponseChange(id, n)}
                    className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${bgColor}`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-400 px-1">
              <span>Not at all likely</span>
              <span>Extremely likely</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <FeatureGate feature="PULSE_SURVEYS">
        <PageWrapper title="Survey" subtitle="Loading survey...">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
          </div>
        </PageWrapper>
      </FeatureGate>
    );
  }

  if (error) {
    return (
      <FeatureGate feature="PULSE_SURVEYS">
        <PageWrapper title="Survey" subtitle="An error occurred">
          <div className="bg-white rounded-[10px] border border-gray-200 p-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ClipboardDocumentListIcon className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{error}</h3>
              <p className="text-sm text-gray-500 mb-6">
                Please try again or go back to the surveys list.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={fetchSurvey}
                  className="px-4 py-2 bg-gold-500 text-violet-950 rounded-full text-sm font-medium hover:bg-gold-600"
                >
                  Retry
                </button>
                <Link
                  href="/engagement/surveys"
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50"
                >
                  Back to Surveys
                </Link>
              </div>
            </div>
          </div>
        </PageWrapper>
      </FeatureGate>
    );
  }

  if (!survey) {
    return (
      <FeatureGate feature="PULSE_SURVEYS">
        <PageWrapper title="Survey" subtitle="Survey not found">
          <div className="bg-white rounded-[10px] border border-gray-200 p-12 text-center">
            <ClipboardDocumentListIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Survey not found</h3>
            <p className="text-sm text-gray-500 mb-6">
              The survey you are looking for does not exist.
            </p>
            <Link
              href="/engagement/surveys"
              className="px-4 py-2 bg-gold-500 text-violet-950 rounded-full text-sm font-medium hover:bg-gold-600"
            >
              Back to Surveys
            </Link>
          </div>
        </PageWrapper>
      </FeatureGate>
    );
  }

  // Submitted success state
  if (submitted) {
    return (
      <FeatureGate feature="PULSE_SURVEYS">
        <PageWrapper title={survey.title} subtitle="Response submitted">
          <div className="space-y-6">
            <Link
              href="/engagement/surveys"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gold-600 transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back to Surveys
            </Link>

            <div className="bg-white rounded-[10px] border border-gray-200 p-12 text-center">
              <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Thank you!</h3>
              <p className="text-sm text-gray-500 mb-6">
                Your response has been submitted successfully.
              </p>
              <Link
                href="/engagement/surveys"
                className="px-4 py-2 bg-gold-500 text-violet-950 rounded-full text-sm font-medium hover:bg-gold-600"
              >
                Back to Surveys
              </Link>
            </div>
          </div>
        </PageWrapper>
      </FeatureGate>
    );
  }

  // Active survey - show the form
  if (survey.status === 'ACTIVE') {
    const sortedQuestions = [...(survey.questions || [])].sort(
      (a, b) => a.displayOrder - b.displayOrder
    );

    return (
      <FeatureGate feature="PULSE_SURVEYS">
        <PageWrapper title={survey.title} subtitle="Take this survey">
          <div className="space-y-6">
            <Link
              href="/engagement/surveys"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gold-600 transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back to Surveys
            </Link>

            {/* Survey Info */}
            <div className="bg-white rounded-[10px] border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{survey.title}</h2>
                  {survey.description && (
                    <p className="text-sm text-gray-600 mt-1">{survey.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <span className="text-xs bg-green-100 text-green-800 px-2.5 py-1 rounded-full font-medium">
                    ACTIVE
                  </span>
                  {survey.isAnonymous && (
                    <span className="text-xs bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full font-medium">
                      Anonymous
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-4 text-xs text-gray-500">
                {survey.startDate && <span>Started: {formatDate(survey.startDate)}</span>}
                {survey.endDate && <span>Ends: {formatDate(survey.endDate)}</span>}
                <span>{sortedQuestions.length} question(s)</span>
              </div>
            </div>

            {/* Questions */}
            {sortedQuestions.map((question) => renderQuestion(question))}

            {/* Submit Error */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-[10px] p-4 text-sm text-red-700">
                {submitError}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2.5 bg-gold-500 text-violet-950 rounded-full text-sm font-medium hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Response'}
              </button>
            </div>
          </div>
        </PageWrapper>
      </FeatureGate>
    );
  }

  // Non-active survey - show read-only info
  return (
    <FeatureGate feature="PULSE_SURVEYS">
      <PageWrapper title={survey.title} subtitle={`Survey - ${survey.status}`}>
        <div className="space-y-6">
          <Link
            href="/engagement/surveys"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gold-600 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Surveys
          </Link>

          <div className="bg-white rounded-[10px] border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{survey.title}</h2>
                {survey.description && (
                  <p className="text-sm text-gray-600 mt-2">{survey.description}</p>
                )}
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  survey.status === 'CLOSED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {survey.status}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-gray-100">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Anonymous
                </p>
                <p className="text-sm text-gray-900 mt-0.5">
                  {survey.isAnonymous ? 'Yes' : 'No'}
                </p>
              </div>
              {survey.startDate && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Date
                  </p>
                  <p className="text-sm text-gray-900 mt-0.5">
                    {formatDate(survey.startDate)}
                  </p>
                </div>
              )}
              {survey.endDate && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    End Date
                  </p>
                  <p className="text-sm text-gray-900 mt-0.5">{formatDate(survey.endDate)}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Questions
                </p>
                <p className="text-sm text-gray-900 mt-0.5">
                  {survey.questions?.length || 0}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
              <Link
                href={`/engagement/surveys/${survey.id}/results`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500 text-violet-950 rounded-full text-sm font-medium hover:bg-gold-600"
              >
                <ChartBarIcon className="w-4 h-4" />
                View Results
              </Link>
            </div>
          </div>

          {/* List questions (read-only) */}
          {survey.questions && survey.questions.length > 0 && (
            <div className="bg-white rounded-[10px] border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">Survey Questions</h3>
              </div>
              <ul className="divide-y divide-gray-200">
                {[...(survey.questions || [])]
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((q, index) => (
                    <li key={q.id} className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs flex items-center justify-center font-medium">
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-sm text-gray-900">
                            {q.questionText}
                            {q.isRequired && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Type: {q.questionType.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
