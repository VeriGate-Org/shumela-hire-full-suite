'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { trainingService } from '@/services/trainingService';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeftIcon,
  StarIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface StarRatingProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
}

function StarRating({ label, value, onChange }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => {
          const filled = star <= (hovered || value);
          return (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => onChange(star)}
              className="focus:outline-none"
            >
              {filled ? (
                <StarIconSolid className="w-8 h-8 text-yellow-400" />
              ) : (
                <StarIcon className="w-8 h-8 text-gray-300 hover:text-yellow-300" />
              )}
            </button>
          );
        })}
        <span className="ml-2 text-sm text-gray-500">{value > 0 ? `${value}/5` : 'Not rated'}</span>
      </div>
    </div>
  );
}

export default function EvaluationPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const { user } = useAuth();
  const employeeId = user?.employeeId || null;

  const [overallRating, setOverallRating] = useState(0);
  const [contentRating, setContentRating] = useState(0);
  const [instructorRating, setInstructorRating] = useState(0);
  const [relevanceRating, setRelevanceRating] = useState(0);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) {
      setError('Unable to determine your employee record. Please contact your administrator.');
      return;
    }
    if (overallRating === 0) {
      setError('Please provide an overall rating.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await trainingService.submitEvaluation(sessionId, {
        employeeId,
        overallRating,
        contentRating: contentRating || null,
        instructorRating: instructorRating || null,
        relevanceRating: relevanceRating || null,
        comments: comments.trim() || null,
      });
      setSubmitted(true);
      // Redirect after a brief delay
      setTimeout(() => {
        router.push('/training/sessions');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit evaluation');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <FeatureGate feature="TRAINING_MANAGEMENT">
        <PageWrapper title="Evaluation Submitted" subtitle="Thank you for your feedback">
          <div className="enterprise-card p-12 text-center">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Thank You!</h2>
            <p className="text-sm text-gray-500 mb-6">
              Your evaluation has been submitted successfully. Your feedback helps us improve future training sessions.
            </p>
            <p className="text-xs text-gray-400">Redirecting to sessions page...</p>
            <div className="mt-6">
              <Link
                href="/training/sessions"
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Go to Sessions
              </Link>
            </div>
          </div>
        </PageWrapper>
      </FeatureGate>
    );
  }

  return (
    <FeatureGate feature="TRAINING_MANAGEMENT">
      <PageWrapper
        title="Training Evaluation"
        subtitle="Share your feedback on this training session"
      >
        <div className="space-y-6">
          {/* Back link */}
          <Link
            href="/training/sessions"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Sessions
          </Link>

          <form onSubmit={handleSubmit} className="enterprise-card p-6 space-y-6">
            <h3 className="text-sm font-semibold text-foreground">Rate Your Experience</h3>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Star Ratings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <StarRating
                label="Overall Rating *"
                value={overallRating}
                onChange={setOverallRating}
              />
              <StarRating
                label="Content Quality"
                value={contentRating}
                onChange={setContentRating}
              />
              <StarRating
                label="Instructor / Facilitator"
                value={instructorRating}
                onChange={setInstructorRating}
              />
              <StarRating
                label="Relevance to Your Role"
                value={relevanceRating}
                onChange={setRelevanceRating}
              />
            </div>

            {/* Comments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Comments
              </label>
              <textarea
                value={comments}
                onChange={e => setComments(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                rows={4}
                placeholder="Share any additional feedback, suggestions, or comments about this training session..."
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3">
              <Link
                href="/training/sessions"
                className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Evaluation'}
              </button>
            </div>
          </form>
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
