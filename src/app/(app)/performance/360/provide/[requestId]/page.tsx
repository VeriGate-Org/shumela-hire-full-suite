'use client';

export function generateStaticParams() {
  return [];
}

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { performanceEnhancementService, FeedbackRequest } from '@/services/performanceEnhancementService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import { ArrowLeftIcon, StarIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const RATING_CATEGORIES = [
  'Leadership',
  'Communication',
  'Teamwork',
  'Technical Skills',
  'Problem Solving',
] as const;

type RatingCategory = (typeof RATING_CATEGORIES)[number];

export default function ProvideFeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const requestId = Number(params.requestId);

  const [request, setRequest] = useState<FeedbackRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [declining, setDeclining] = useState(false);

  const [ratings, setRatings] = useState<Record<RatingCategory, number>>({
    Leadership: 0,
    Communication: 0,
    Teamwork: 0,
    'Technical Skills': 0,
    'Problem Solving': 0,
  });
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [comments, setComments] = useState('');

  useEffect(() => {
    loadRequest();
  }, [requestId]);

  async function loadRequest() {
    setLoading(true);
    setError(null);
    try {
      const data = await performanceEnhancementService.getFeedbackRequest(requestId);
      setRequest(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load feedback request');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const hasAllRatings = RATING_CATEGORIES.every((cat) => ratings[cat] > 0);
    if (!hasAllRatings) {
      toast('Please provide a rating for all categories', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await performanceEnhancementService.submitFeedback(requestId, {
        respondentId: user?.id,
        ratings: JSON.stringify(ratings),
        strengths,
        improvements,
        comments,
      });
      toast('Feedback submitted successfully', 'success');
      router.push('/performance/360');
    } catch (err: any) {
      toast(err.message || 'Failed to submit feedback', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDecline() {
    if (!confirm('Are you sure you want to decline this feedback request?')) return;
    setDeclining(true);
    try {
      await performanceEnhancementService.declineFeedbackRequest(requestId);
      toast('Feedback request declined', 'success');
      router.push('/performance/360');
    } catch (err: any) {
      toast(err.message || 'Failed to decline request', 'error');
    } finally {
      setDeclining(false);
    }
  }

  const feedbackTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      PEER: 'bg-blue-100 text-blue-800',
      UPWARD: 'bg-purple-100 text-purple-800',
      DOWNWARD: 'bg-indigo-100 text-indigo-800',
      SELF: 'bg-teal-100 text-teal-800',
      EXTERNAL: 'bg-orange-100 text-orange-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      SUBMITTED: 'bg-green-100 text-green-800',
      DECLINED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <FeatureGate feature="PERFORMANCE_360_FEEDBACK">
        <PageWrapper title="Provide Feedback">
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500" />
          </div>
        </PageWrapper>
      </FeatureGate>
    );
  }

  if (error || !request) {
    return (
      <FeatureGate feature="PERFORMANCE_360_FEEDBACK">
        <PageWrapper title="Provide Feedback">
          <div className="bg-white rounded-[10px] border border-gray-200 p-6 text-center">
            <p className="text-red-600 mb-4">{error || 'Feedback request not found'}</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={loadRequest}
                className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 text-sm"
              >
                Retry
              </button>
              <Link href="/performance/360" className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                Back to 360 Feedback
              </Link>
            </div>
          </div>
        </PageWrapper>
      </FeatureGate>
    );
  }

  return (
    <FeatureGate feature="PERFORMANCE_360_FEEDBACK">
      <PageWrapper title="Provide Feedback" subtitle={`Feedback for ${request.employeeName}`}>
        {/* Back Link */}
        <Link
          href="/performance/360"
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to 360 Feedback
        </Link>

        {/* Reviewee Info Card */}
        <div className="bg-white rounded-[10px] border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Reviewee Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Employee</p>
              <p className="text-sm font-medium text-gray-900">{request.employeeName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Feedback Type</p>
              <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${feedbackTypeBadge(request.feedbackType)}`}>
                {request.feedbackType}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${statusBadge(request.status)}`}>
                {request.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Due Date</p>
              <p className="text-sm font-medium text-gray-900">
                {request.dueDate ? new Date(request.dueDate).toLocaleDateString() : 'No deadline'}
              </p>
            </div>
          </div>
        </div>

        {/* Feedback Form (PENDING only) */}
        {request.status === 'PENDING' ? (
          <form onSubmit={handleSubmit}>
            {/* Rating Categories */}
            <div className="bg-white rounded-[10px] border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Ratings</h2>
              <p className="text-sm text-gray-500 mb-6">Rate each category on a scale of 1 to 5</p>
              <div className="space-y-6">
                {RATING_CATEGORIES.map((category) => (
                  <div key={category}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{category}</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRatings((prev) => ({ ...prev, [category]: value }))}
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                            ratings[category] === value
                              ? 'bg-gold-500 text-white'
                              : ratings[category] > 0 && ratings[category] >= value
                              ? 'bg-gold-100 text-gold-700'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {value}
                        </button>
                      ))}
                      {ratings[category] > 0 && (
                        <span className="ml-2 text-sm text-gray-500 self-center">
                          {ratings[category]} / 5
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Text Feedback */}
            <div className="bg-white rounded-[10px] border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Written Feedback</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Strengths</label>
                  <textarea
                    value={strengths}
                    onChange={(e) => setStrengths(e.target.value)}
                    rows={3}
                    placeholder="What does this person do well?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-gold-500 focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Areas for Improvement</label>
                  <textarea
                    value={improvements}
                    onChange={(e) => setImprovements(e.target.value)}
                    rows={3}
                    placeholder="Where could this person improve?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-gold-500 focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Additional Comments</label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={3}
                    placeholder="Any other feedback you'd like to share..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-gold-500 focus:border-gold-500"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={handleDecline}
                disabled={declining}
                className="px-6 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm disabled:opacity-50"
              >
                {declining ? 'Declining...' : 'Decline Request'}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 text-sm disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </form>
        ) : (
          /* Read-only status for SUBMITTED or DECLINED */
          <div className="bg-white rounded-[10px] border border-gray-200 p-6 text-center">
            {request.status === 'SUBMITTED' ? (
              <div>
                <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Feedback Already Submitted</h3>
                <p className="text-sm text-gray-500">
                  You have already submitted your feedback for this request. Thank you for your contribution.
                </p>
              </div>
            ) : (
              <div>
                <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Request Declined</h3>
                <p className="text-sm text-gray-500">
                  This feedback request has been declined.
                </p>
              </div>
            )}
            <Link
              href="/performance/360"
              className="inline-block mt-4 px-4 py-2 text-sm text-gold-600 hover:text-gold-800"
            >
              Back to 360 Feedback
            </Link>
          </div>
        )}
      </PageWrapper>
    </FeatureGate>
  );
}
