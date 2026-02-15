'use client';

import React, { useState } from 'react';

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
  feedback?: string;
  rating?: number;
  communicationSkills?: number;
  technicalSkills?: number;
  culturalFit?: number;
  overallImpression?: string;
  recommendation?: string;
  nextSteps?: string;
  technicalAssessment?: string;
  candidateQuestions?: string;
  interviewerNotes?: string;
  application: {
    id: number;
    applicant: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
    };
    jobPosting: {
      id: number;
      title: string;
      department: string;
    };
  };
}

interface InterviewFeedbackFormProps {
  interview: Interview;
  onSuccess?: (interviewId: number) => void;
  onCancel?: () => void;
}

const RECOMMENDATIONS = [
  { value: 'HIRE', label: 'Recommend for Hire', color: 'text-green-600' },
  { value: 'CONSIDER', label: 'Consider with Reservations', color: 'text-yellow-600' },
  { value: 'REJECT', label: 'Do Not Recommend', color: 'text-red-600' },
  { value: 'ANOTHER_ROUND', label: 'Recommend Another Round', color: 'text-violet-600' },
  { value: 'ON_HOLD', label: 'Put on Hold', color: 'text-gray-600' },
  { value: 'SECOND_OPINION', label: 'Needs Second Opinion', color: 'text-violet-600' }
];

export default function InterviewFeedbackForm({ interview, onSuccess, onCancel }: InterviewFeedbackFormProps) {
  const [formData, setFormData] = useState({
    feedback: interview.feedback || '',
    rating: interview.rating || 0,
    communicationSkills: interview.communicationSkills || 0,
    technicalSkills: interview.technicalSkills || 0,
    culturalFit: interview.culturalFit || 0,
    overallImpression: interview.overallImpression || '',
    recommendation: interview.recommendation || '',
    nextSteps: interview.nextSteps || '',
    technicalAssessment: interview.technicalAssessment || '',
    candidateQuestions: interview.candidateQuestions || '',
    interviewerNotes: interview.interviewerNotes || ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      const params = new URLSearchParams({
        feedback: formData.feedback,
        rating: formData.rating.toString(),
        communicationSkills: formData.communicationSkills.toString(),
        technicalSkills: formData.technicalSkills.toString(),
        culturalFit: formData.culturalFit.toString(),
        recommendation: formData.recommendation,
        submittedBy: '1'
      });

      if (formData.overallImpression) params.append('overallImpression', formData.overallImpression);
      if (formData.nextSteps) params.append('nextSteps', formData.nextSteps);
      if (formData.technicalAssessment) params.append('technicalAssessment', formData.technicalAssessment);
      if (formData.candidateQuestions) params.append('candidateQuestions', formData.candidateQuestions);
      if (formData.interviewerNotes) params.append('interviewerNotes', formData.interviewerNotes);

      const response = await fetch(`/api/interviews/${interview.id}/feedback?${params.toString()}`, {
        method: 'POST'
      });

      if (response.ok) {
        if (onSuccess) {
          onSuccess(interview.id);
        }
      } else {
        const errorData = await response.json();
        setErrors({ general: errorData.message || 'Failed to submit feedback' });
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setErrors({ general: 'An error occurred while submitting feedback' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const renderStarRating = (field: string, value: number, label: string, required = true) => {
    const errorId = `${field}-error`;
    return (
      <div role="group" aria-labelledby={`${field}-label`}>
        <label id={`${field}-label`} className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && '*'}
        </label>
        <div className="flex items-center space-x-1" aria-describedby={errors[field] ? errorId : undefined}>
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => handleInputChange(field, star)}
              aria-label={`Rate ${star} out of 5`}
              className={`text-2xl hover:scale-110 transition-transform ${
                star <= value ? 'text-yellow-400' : 'text-gray-300'
              }`}
            >
              ⭐
            </button>
          ))}
          <span className="ml-2 text-sm text-gray-600">
            {value > 0 ? `${value}/5` : 'Not rated'}
          </span>
        </div>
        {errors[field] && <p id={errorId} role="alert" className="text-red-500 text-sm mt-1">{errors[field]}</p>}
      </div>
    );
  };

  const getRecommendationInfo = (value: string) => {
    const rec = RECOMMENDATIONS.find(r => r.value === value);
    return rec || { label: '', color: 'text-gray-600' };
  };

  const getAverageSkillRating = () => {
    if (formData.communicationSkills > 0 && formData.technicalSkills > 0 && formData.culturalFit > 0) {
      return ((formData.communicationSkills + formData.technicalSkills + formData.culturalFit) / 3).toFixed(1);
    }
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">Interview Feedback</h2>
        <div className="mt-2 text-sm text-gray-600">
          <p><strong>Interview:</strong> {interview.title}</p>
          <p><strong>Candidate:</strong> {interview.application.applicant.firstName} {interview.application.applicant.lastName}</p>
          <p><strong>Position:</strong> {interview.application.jobPosting.title}</p>
          <p><strong>Date:</strong> {new Date(interview.scheduledAt).toLocaleString()}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6">
        {errors.general && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {errors.general}
          </div>
        )}

        <div className="space-y-8">
          {/* Overall Rating and Feedback */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              {renderStarRating('rating', formData.rating, 'Overall Interview Rating')}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Average Skills Rating
              </label>
              <div className="text-2xl font-bold text-violet-600">
                {getAverageSkillRating() || 'N/A'}
              </div>
              <p className="text-sm text-gray-500">Based on communication, technical, and cultural fit</p>
            </div>
          </div>

          <div>
            <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-1">
              Overall Feedback *
            </label>
            <textarea
              id="feedback"
              value={formData.feedback}
              onChange={(e) => handleInputChange('feedback', e.target.value)}
              rows={4}
              aria-required="true"
              aria-invalid={!!errors.feedback}
              aria-describedby={errors.feedback ? 'feedback-error' : undefined}
              className={`w-full p-3 border rounded-md ${errors.feedback ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Provide your overall assessment of the candidate's performance during the interview..."
            />
            {errors.feedback && <p id="feedback-error" role="alert" className="text-red-500 text-sm mt-1">{errors.feedback}</p>}
          </div>

          {/* Skills Assessment */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Skills Assessment</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {renderStarRating('communicationSkills', formData.communicationSkills, 'Communication Skills')}
              {renderStarRating('technicalSkills', formData.technicalSkills, 'Technical Skills')}
              {renderStarRating('culturalFit', formData.culturalFit, 'Cultural Fit')}
            </div>
          </div>

          {/* Recommendation */}
          <fieldset>
            <legend className="block text-sm font-medium text-gray-700 mb-1">
              Recommendation *
            </legend>
            <div className="space-y-2" aria-required="true">
              {RECOMMENDATIONS.map(rec => (
                <label key={rec.value} className="flex items-center">
                  <input
                    type="radio"
                    name="recommendation"
                    value={rec.value}
                    checked={formData.recommendation === rec.value}
                    onChange={(e) => handleInputChange('recommendation', e.target.value)}
                    aria-describedby={errors.recommendation ? 'recommendation-error' : undefined}
                    className="mr-3"
                  />
                  <span className={`font-medium ${rec.color}`}>{rec.label}</span>
                </label>
              ))}
            </div>
            {errors.recommendation && <p id="recommendation-error" role="alert" className="text-red-500 text-sm mt-1">{errors.recommendation}</p>}
          </fieldset>

          {/* Overall Impression */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Overall Impression
            </label>
            <textarea
              value={formData.overallImpression}
              onChange={(e) => handleInputChange('overallImpression', e.target.value)}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-md"
              placeholder="What are your overall thoughts about this candidate? What stood out (positive or negative)?"
            />
          </div>

          {/* Next Steps */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recommended Next Steps
            </label>
            <textarea
              value={formData.nextSteps}
              onChange={(e) => handleInputChange('nextSteps', e.target.value)}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-md"
              placeholder="What should happen next with this candidate? Any specific areas to explore in future rounds?"
            />
          </div>

          {/* Technical Assessment */}
          {(interview.type === 'TECHNICAL' || interview.round === 'TECHNICAL') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Technical Assessment Details
              </label>
              <textarea
                value={formData.technicalAssessment}
                onChange={(e) => handleInputChange('technicalAssessment', e.target.value)}
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-md"
                placeholder="Detail the technical questions asked, coding exercises, problem-solving approach, and technical competency demonstrated..."
              />
            </div>
          )}

          {/* Candidate Questions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Candidate Questions & Engagement
            </label>
            <textarea
              value={formData.candidateQuestions}
              onChange={(e) => handleInputChange('candidateQuestions', e.target.value)}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-md"
              placeholder="What questions did the candidate ask? How engaged were they during the interview?"
            />
          </div>

          {/* Interviewer Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Private Interviewer Notes
            </label>
            <textarea
              value={formData.interviewerNotes}
              onChange={(e) => handleInputChange('interviewerNotes', e.target.value)}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-md"
              placeholder="Private notes for your reference and internal team discussion (not shared with candidate)..."
            />
            <p className="text-sm text-gray-500 mt-1">
              These notes are for internal use only and will not be shared with the candidate.
            </p>
          </div>

          {/* Recommendation Summary */}
          {formData.recommendation && (
            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-violet-500">
              <h4 className="font-medium text-gray-900 mb-2">Recommendation Summary</h4>
              <p className={`font-medium ${getRecommendationInfo(formData.recommendation).color}`}>
                {getRecommendationInfo(formData.recommendation).label}
              </p>
              {formData.recommendation === 'HIRE' && (
                <p className="text-sm text-gray-600 mt-1">
                  This candidate should proceed with the next stage of the hiring process.
                </p>
              )}
              {formData.recommendation === 'CONSIDER' && (
                <p className="text-sm text-gray-600 mt-1">
                  This candidate has potential but requires additional evaluation or consideration of specific concerns.
                </p>
              )}
              {formData.recommendation === 'REJECT' && (
                <p className="text-sm text-gray-600 mt-1">
                  This candidate should not proceed further in the hiring process.
                </p>
              )}
              {formData.recommendation === 'ANOTHER_ROUND' && (
                <p className="text-sm text-gray-600 mt-1">
                  Schedule an additional interview round to further evaluate this candidate.
                </p>
              )}
              {formData.recommendation === 'SECOND_OPINION' && (
                <p className="text-sm text-gray-600 mt-1">
                  Another team member should interview this candidate before making a final decision.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-6 mt-8 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </span>
            ) : (
              'Submit Feedback'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}