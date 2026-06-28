'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api-fetch';
import { useToast } from '@/components/Toast';
import { CardSkeleton } from '@/components/LoadingComponents';
import ErrorState from '@/components/ErrorState';

interface Interview {
  id: number;
  title: string;
  type: string;
  typeDisplayName: string;
  round: string;
  roundDisplayName: string;
  status: string;
  statusDisplayName: string;
  scheduledAt: string;
  durationMinutes: number;
  application: {
    id: number;
    applicant: {
      id: number;
      name: string;
      surname: string;
      email: string;
    };
    jobPosting: {
      id: number;
      title: string;
      department: string;
    };
  };
}

interface FeedbackEntry {
  id: number;
  submittedBy: number;
  interviewerName?: string;
  feedback: string;
  rating?: number;
  communicationSkills?: number;
  technicalSkills?: number;
  culturalFit?: number;
  overallImpression?: string;
  recommendation: string;
  nextSteps?: string;
  submittedAt: string;
}

interface InterviewFeedbackFormProps {
  interview: Interview;
  onSuccess?: (interviewId: number) => void;
  onCancel?: () => void;
}

interface FeedbackFormData {
  feedback: string;
  rating: number;
  communicationSkills: number;
  technicalSkills: number;
  culturalFit: number;
  overallImpression: string;
  recommendation: string;
  nextSteps: string;
  technicalAssessment: string;
  candidateQuestions: string;
  interviewerNotes: string;
}

const RECOMMENDATIONS = [
  { value: 'HIRE', label: 'Recommend for Hire', color: 'text-green-600' },
  { value: 'CONSIDER', label: 'Consider with Reservations', color: 'text-yellow-600' },
  { value: 'REJECT', label: 'Do Not Recommend', color: 'text-red-600' },
  { value: 'ANOTHER_ROUND', label: 'Recommend Another Round', color: 'text-gold-700' },
  { value: 'ON_HOLD', label: 'Put on Hold', color: 'text-muted-foreground' },
  { value: 'SECOND_OPINION', label: 'Needs Second Opinion', color: 'text-gold-700' },
] as const;

export default function InterviewFeedbackForm({ interview, onSuccess, onCancel }: InterviewFeedbackFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [existingFeedbacks, setExistingFeedbacks] = useState<FeedbackEntry[]>([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);
  const [feedbacksError, setFeedbacksError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FeedbackFormData>({
    feedback: '',
    rating: 0,
    communicationSkills: 0,
    technicalSkills: 0,
    culturalFit: 0,
    overallImpression: '',
    recommendation: '',
    nextSteps: '',
    technicalAssessment: '',
    candidateQuestions: '',
    interviewerNotes: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadExistingFeedbacks = useCallback(async () => {
    try {
      setLoadingFeedbacks(true);
      setFeedbacksError(null);
      const response = await apiFetch(`/api/interviews/${interview.id}/feedbacks`);
      if (response.ok) {
        const data = await response.json();
        setExistingFeedbacks(data);
      } else {
        setFeedbacksError('Failed to load existing feedbacks.');
        toast('Failed to load existing feedbacks', 'error');
      }
    } catch (error) {
      console.error('Error loading feedbacks:', error);
      setFeedbacksError('Failed to load existing feedbacks. Please try again.');
      toast('Failed to load existing feedbacks', 'error');
    } finally {
      setLoadingFeedbacks(false);
    }
  }, [interview.id, toast]);

  // Load existing feedbacks and check if current user already submitted
  useEffect(() => {
    void loadExistingFeedbacks();
  }, [loadExistingFeedbacks]);

  // Pre-fill form if current user has existing feedback
  useEffect(() => {
    const userId = Number(user?.id);
    const myFeedback = existingFeedbacks.find((f) => f.submittedBy === userId);
    if (myFeedback) {
      setFormData({
        feedback: myFeedback.feedback || '',
        rating: myFeedback.rating || 0,
        communicationSkills: myFeedback.communicationSkills || 0,
        technicalSkills: myFeedback.technicalSkills || 0,
        culturalFit: myFeedback.culturalFit || 0,
        overallImpression: myFeedback.overallImpression || '',
        recommendation: myFeedback.recommendation || '',
        nextSteps: myFeedback.nextSteps || '',
        technicalAssessment: '',
        candidateQuestions: '',
        interviewerNotes: '',
      });
    }
  }, [existingFeedbacks, user?.id]);

  const currentUserHasFeedback = existingFeedbacks.some(
    (f) => f.submittedBy === Number(user?.id)
  );

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.feedback.trim()) {
      newErrors.feedback = 'Overall feedback is required';
    }

    if (!formData.recommendation) {
      newErrors.recommendation = 'Recommendation is required';
    }

    if (formData.rating < 1 || formData.rating > 5) {
      newErrors.rating = 'Overall rating is required (1-5 stars)';
    }

    if (formData.communicationSkills < 1 || formData.communicationSkills > 5) {
      newErrors.communicationSkills = 'Communication skills rating is required (1-5)';
    }

    if (formData.technicalSkills < 1 || formData.technicalSkills > 5) {
      newErrors.technicalSkills = 'Technical skills rating is required (1-5)';
    }

    if (formData.culturalFit < 1 || formData.culturalFit > 5) {
      newErrors.culturalFit = 'Cultural fit rating is required (1-5)';
    }

    const actorId = Number(user?.id);
    if (!Number.isFinite(actorId) || actorId <= 0) {
      newErrors.general = 'Unable to identify current user. Please sign in again.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      const submittedBy = Number(user?.id);
      const params = new URLSearchParams({
        feedback: formData.feedback,
        rating: String(formData.rating),
        communicationSkills: String(formData.communicationSkills),
        technicalSkills: String(formData.technicalSkills),
        culturalFit: String(formData.culturalFit),
        recommendation: formData.recommendation,
        submittedBy: String(submittedBy),
      });

      const displayName = user?.name || user?.email || '';
      if (displayName) params.append('interviewerName', displayName);
      if (formData.overallImpression) params.append('overallImpression', formData.overallImpression);
      if (formData.nextSteps) params.append('nextSteps', formData.nextSteps);
      if (formData.technicalAssessment) params.append('technicalAssessment', formData.technicalAssessment);
      if (formData.candidateQuestions) params.append('candidateQuestions', formData.candidateQuestions);
      if (formData.interviewerNotes) params.append('interviewerNotes', formData.interviewerNotes);

      const response = await apiFetch(`/api/interviews/${interview.id}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (response.ok) {
        toast('Feedback submitted successfully', 'success');
        if (onSuccess) {
          onSuccess(interview.id);
        }
      } else {
        const errorData = await response.json();
        setErrors({ general: errorData.message || 'Failed to submit feedback' });
        toast('Failed to submit feedback', 'error');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setErrors({ general: 'An error occurred while submitting feedback' });
      toast('Failed to submit feedback', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = <K extends keyof FeedbackFormData>(field: K, value: FeedbackFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const renderStarRating = (field: keyof FeedbackFormData, value: number, label: string, required = true) => {
    const errorId = `${String(field)}-error`;
    return (
      <div role="group" aria-labelledby={`${String(field)}-label`}>
        <label id={`${String(field)}-label`} className="block text-sm font-medium text-foreground mb-2">
          {label} {required && '*'}
        </label>
        <div className="flex items-center space-x-1" aria-describedby={errors[String(field)] ? errorId : undefined}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleInputChange(field, star as FeedbackFormData[typeof field])}
              aria-label={`Rate ${star} out of 5`}
              className={`text-2xl hover:scale-110 transition-transform ${
                star <= value ? 'text-yellow-400' : 'text-muted'
              }`}
            >
              ★
            </button>
          ))}
          <span className="ml-2 text-sm text-muted-foreground">
            {value > 0 ? `${value}/5` : 'Not rated'}
          </span>
        </div>
        {errors[String(field)] && <p id={errorId} role="alert" className="text-red-500 text-sm mt-1">{errors[String(field)]}</p>}
      </div>
    );
  };

  const getRecommendationInfo = (value: string) => {
    const recommendation = RECOMMENDATIONS.find((item) => item.value === value);
    return recommendation || { label: value, color: 'text-muted-foreground' };
  };

  const getAverageSkillRating = () => {
    if (formData.communicationSkills > 0 && formData.technicalSkills > 0 && formData.culturalFit > 0) {
      return ((formData.communicationSkills + formData.technicalSkills + formData.culturalFit) / 3).toFixed(1);
    }
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Existing Feedbacks */}
      {existingFeedbacks.length > 0 && (
        <div className="bg-card rounded-card border border-border shadow-md">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-lg font-bold text-foreground">
              Submitted Feedback ({existingFeedbacks.length})
            </h2>
          </div>
          <div className="divide-y divide-border">
            {existingFeedbacks.map((fb) => (
              <div key={fb.id} className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                      {(fb.interviewerName || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {fb.interviewerName || `User #${fb.submittedBy}`}
                        {fb.submittedBy === Number(user?.id) && (
                          <span className="ml-2 text-xs bg-gold-100 text-gold-800 px-2 py-0.5 rounded-full">You</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(fb.submittedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {fb.rating && (
                      <span className="text-sm font-medium text-yellow-500">
                        {'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}
                      </span>
                    )}
                    <span className={`text-sm font-medium ${getRecommendationInfo(fb.recommendation).color}`}>
                      {getRecommendationInfo(fb.recommendation).label}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{fb.feedback}</p>
                {(fb.communicationSkills || fb.technicalSkills || fb.culturalFit) && (
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    {fb.communicationSkills && <span>Communication: {fb.communicationSkills}/5</span>}
                    {fb.technicalSkills && <span>Technical: {fb.technicalSkills}/5</span>}
                    {fb.culturalFit && <span>Cultural Fit: {fb.culturalFit}/5</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {feedbacksError && (
        <ErrorState
          title="Failed to load feedbacks"
          message={feedbacksError}
          onRetry={loadExistingFeedbacks}
        />
      )}

      {loadingFeedbacks && (
        <CardSkeleton count={2} />
      )}

      {/* Feedback Form */}
      <div className="bg-card rounded-card border border-border shadow-md">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-2xl font-bold text-foreground">
            {currentUserHasFeedback ? 'Update Your Feedback' : 'Submit Your Feedback'}
          </h2>
          <div className="mt-2 text-sm text-muted-foreground">
            <p><strong className="text-foreground">Interview:</strong> {interview.title}</p>
            <p><strong className="text-foreground">Candidate:</strong> {((interview.application?.applicant?.name ?? '') + ' ' + (interview.application?.applicant?.surname ?? '')).trim() || 'Unknown Candidate'}</p>
            <p><strong className="text-foreground">Position:</strong> {interview.application?.jobPosting?.title || 'Unknown Position'}</p>
            <p><strong className="text-foreground">Date:</strong> {new Date(interview.scheduledAt).toLocaleString()}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {errors.general && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-control">
              {errors.general}
            </div>
          )}

          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                {renderStarRating('rating', formData.rating, 'Overall Interview Rating')}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Average Skills Rating
                </label>
                <div className="text-2xl font-bold text-primary">
                  {getAverageSkillRating() || 'N/A'}
                </div>
                <p className="text-sm text-muted-foreground">Based on communication, technical, and cultural fit</p>
              </div>
            </div>

            <div>
              <label htmlFor="feedback" className="block text-sm font-medium text-foreground mb-1">
                Overall Feedback *
              </label>
              <textarea
                id="feedback"
                value={formData.feedback}
                onChange={(event) => handleInputChange('feedback', event.target.value)}
                rows={4}
                aria-required="true"
                aria-invalid={!!errors.feedback}
                aria-describedby={errors.feedback ? 'feedback-error' : undefined}
                className={`w-full p-3 border rounded-control bg-card focus:ring-2 focus:ring-ring/40 focus:border-ring ${errors.feedback ? 'border-red-500' : 'border-border'}`}
                placeholder="Provide your overall assessment of the candidate's interview performance"
              />
              {errors.feedback && <p id="feedback-error" role="alert" className="text-red-500 text-sm mt-1">{errors.feedback}</p>}
            </div>

            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">Skills Assessment</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {renderStarRating('communicationSkills', formData.communicationSkills, 'Communication Skills')}
                {renderStarRating('technicalSkills', formData.technicalSkills, 'Technical Skills')}
                {renderStarRating('culturalFit', formData.culturalFit, 'Cultural Fit')}
              </div>
            </div>

            <fieldset>
              <legend className="block text-sm font-medium text-foreground mb-1">
                Recommendation *
              </legend>
              <div className="space-y-2" aria-required="true">
                {RECOMMENDATIONS.map((recommendation) => (
                  <label key={recommendation.value} className="flex items-center">
                    <input
                      type="radio"
                      name="recommendation"
                      value={recommendation.value}
                      checked={formData.recommendation === recommendation.value}
                      onChange={(event) => handleInputChange('recommendation', event.target.value)}
                      aria-describedby={errors.recommendation ? 'recommendation-error' : undefined}
                      className="mr-3"
                    />
                    <span className={`font-medium ${recommendation.color}`}>{recommendation.label}</span>
                  </label>
                ))}
              </div>
              {errors.recommendation && <p id="recommendation-error" role="alert" className="text-red-500 text-sm mt-1">{errors.recommendation}</p>}
            </fieldset>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Overall Impression
              </label>
              <textarea
                value={formData.overallImpression}
                onChange={(event) => handleInputChange('overallImpression', event.target.value)}
                rows={3}
                className="w-full p-3 border border-border rounded-control bg-card focus:ring-2 focus:ring-ring/40 focus:border-ring"
                placeholder="What stood out about this candidate, positive or negative"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Recommended Next Steps
              </label>
              <textarea
                value={formData.nextSteps}
                onChange={(event) => handleInputChange('nextSteps', event.target.value)}
                rows={3}
                className="w-full p-3 border border-border rounded-control bg-card focus:ring-2 focus:ring-ring/40 focus:border-ring"
                placeholder="What should happen next with this candidate"
              />
            </div>

            {(interview.type === 'TECHNICAL' || interview.round === 'TECHNICAL') && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Technical Assessment Details
                </label>
                <textarea
                  value={formData.technicalAssessment}
                  onChange={(event) => handleInputChange('technicalAssessment', event.target.value)}
                  rows={4}
                  className="w-full p-3 border border-border rounded-control bg-card focus:ring-2 focus:ring-ring/40 focus:border-ring"
                  placeholder="Capture technical questioning, evaluation, and demonstrated competency"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Candidate Questions & Engagement
              </label>
              <textarea
                value={formData.candidateQuestions}
                onChange={(event) => handleInputChange('candidateQuestions', event.target.value)}
                rows={3}
                className="w-full p-3 border border-border rounded-control bg-card focus:ring-2 focus:ring-ring/40 focus:border-ring"
                placeholder="Document candidate questions and engagement level"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Private Interviewer Notes
              </label>
              <textarea
                value={formData.interviewerNotes}
                onChange={(event) => handleInputChange('interviewerNotes', event.target.value)}
                rows={3}
                className="w-full p-3 border border-border rounded-control bg-card focus:ring-2 focus:ring-ring/40 focus:border-ring"
                placeholder="Internal notes for recruiter and hiring team discussion"
              />
              <p className="text-sm text-muted-foreground mt-1">
                These notes are internal and not shared with the candidate.
              </p>
            </div>

            {formData.recommendation && (
              <div className="bg-muted rounded-control p-4 border-l-4 border-cta">
                <h4 className="font-medium text-foreground mb-2">Recommendation Summary</h4>
                <p className={`font-medium ${getRecommendationInfo(formData.recommendation).color}`}>
                  {getRecommendationInfo(formData.recommendation).label}
                </p>
                {formData.recommendation === 'HIRE' && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Candidate is recommended to proceed to the next hiring stage.
                  </p>
                )}
                {formData.recommendation === 'CONSIDER' && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Candidate has potential with reservations requiring targeted follow-up.
                  </p>
                )}
                {formData.recommendation === 'REJECT' && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Candidate is not recommended to proceed in the hiring process.
                  </p>
                )}
                {formData.recommendation === 'ANOTHER_ROUND' && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Additional round recommended to resolve open evaluation questions.
                  </p>
                )}
                {formData.recommendation === 'SECOND_OPINION' && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Additional interviewer input is recommended before final decision.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4 pt-6 mt-8 border-t border-border">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 border border-border text-foreground rounded-control hover:bg-accent"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-cta text-cta-foreground rounded-full border border-cta-border hover:bg-cta-hover disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {loading ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cta-foreground mr-2" />
                  Submitting...
                </span>
              ) : (
                currentUserHasFeedback ? 'Update Feedback' : 'Submit Feedback'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
