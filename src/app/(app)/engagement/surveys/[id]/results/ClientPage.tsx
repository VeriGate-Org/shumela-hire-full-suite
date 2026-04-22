'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import {
  engagementService,
  SurveyResults,
  QuestionResult,
} from '@/services/engagementService';
import {
  ArrowLeftIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

export default function SurveyResultsPage() {
  const params = useParams();
  const surveyId = params.id as string;

  const [results, setResults] = useState<SurveyResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await engagementService.getSurveyResults(surveyId);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [surveyId]);

  useEffect(() => {
    if (surveyId) {
      fetchResults();
    }
  }, [surveyId, fetchResults]);

  function getRatingColor(avg: number, max: number): string {
    const pct = avg / max;
    if (pct >= 0.7) return 'bg-green-500';
    if (pct >= 0.4) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  function getRatingMax(questionType: string): number {
    if (questionType === 'RATING_1_5') return 5;
    if (questionType === 'RATING_1_10') return 10;
    if (questionType === 'NPS') return 10;
    return 5;
  }

  function renderQuestionResult(qr: QuestionResult) {
    const hasRating = qr.averageRating !== null;
    const hasText = qr.textResponses && qr.textResponses.length > 0;

    return (
      <div key={qr.questionId} className="bg-white rounded-[10px] border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <h4 className="text-sm font-medium text-gray-900 flex-1">{qr.questionText}</h4>
          <span className="text-xs text-gray-400 ml-4 flex-shrink-0">
            {qr.responseCount} response{qr.responseCount !== 1 ? 's' : ''}
          </span>
        </div>

        {hasRating && qr.averageRating !== null && (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-gray-900">
                {qr.averageRating.toFixed(1)}
              </span>
              <span className="text-sm text-gray-500">
                / {getRatingMax(qr.questionType)}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getRatingColor(
                  qr.averageRating,
                  getRatingMax(qr.questionType)
                )}`}
                style={{
                  width: `${(qr.averageRating / getRatingMax(qr.questionType)) * 100}%`,
                }}
              />
            </div>
            <p className="text-xs text-gray-400">
              Average rating across {qr.responseCount} response{qr.responseCount !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {hasText && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <ChatBubbleLeftRightIcon className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Text Responses
              </span>
            </div>
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {qr.textResponses.map((text, index) => (
                <li
                  key={index}
                  className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-700"
                >
                  {text}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!hasRating && !hasText && (
          <p className="text-sm text-gray-400">No responses yet for this question.</p>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <FeatureGate feature="PULSE_SURVEYS">
        <PageWrapper title="Survey Results" subtitle="Loading results...">
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
        <PageWrapper title="Survey Results" subtitle="An error occurred">
          <div className="bg-white rounded-[10px] border border-gray-200 p-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChartBarIcon className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{error}</h3>
              <p className="text-sm text-gray-500 mb-6">
                Please try again or go back to the surveys list.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={fetchResults}
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

  if (!results) {
    return (
      <FeatureGate feature="PULSE_SURVEYS">
        <PageWrapper title="Survey Results" subtitle="No results found">
          <div className="bg-white rounded-[10px] border border-gray-200 p-12 text-center">
            <ChartBarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No results available</h3>
            <p className="text-sm text-gray-500 mb-6">
              There are no results for this survey yet.
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

  return (
    <FeatureGate feature="PULSE_SURVEYS">
      <PageWrapper title={`Results: ${results.surveyTitle}`} subtitle="Survey results and analytics">
        <div className="space-y-6">
          {/* Back link */}
          <Link
            href="/engagement/surveys"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gold-600 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Surveys
          </Link>

          {/* Summary Card */}
          <div className="bg-white rounded-[10px] border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{results.surveyTitle}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {results.questionResults.length} question{results.questionResults.length !== 1 ? 's' : ''} analyzed
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-gold-50 px-4 py-2 rounded-full">
                  <UserGroupIcon className="w-5 h-5 text-gold-600" />
                  <div>
                    <p className="text-xs font-medium text-gray-500">Total Respondents</p>
                    <p className="text-lg font-bold text-gray-900">{results.totalRespondents}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Per-question Results */}
          {results.questionResults.length === 0 ? (
            <div className="bg-white rounded-[10px] border border-gray-200 p-12 text-center">
              <ChartBarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-sm text-gray-500">No question results to display.</p>
            </div>
          ) : (
            results.questionResults.map((qr) => renderQuestionResult(qr))
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
