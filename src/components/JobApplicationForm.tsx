'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api-fetch';
import ScreeningQuestions from '@/components/ScreeningQuestions';

interface JobApplicationFormProps {
  jobAdId: number;
  jobTitle: string;
  department?: string;
  applicantId?: number;
  onSuccess?: (application: { id: number; jobTitle: string; status: string }) => void;
  onCancel?: () => void;
}

interface ApplicantBasicInfo {
  id: number;
  name: string;
  surname: string;
  email: string;
  phone: string;
}

export default function JobApplicationForm({ 
  jobAdId, 
  jobTitle, 
  department, 
  applicantId, 
  onSuccess, 
  onCancel 
}: JobApplicationFormProps) {
  const { user: _user } = useAuth();
  const [applicant, setApplicant] = useState<ApplicantBasicInfo | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [applicationSource, setApplicationSource] = useState('EXTERNAL');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [canApply, setCanApply] = useState(true);
  const [checkingEligibility, setCheckingEligibility] = useState(true);
  const [createdApplication, setCreatedApplication] = useState<{ id: number; jobTitle: string; status: string } | null>(null);
  const [hasScreeningQuestions, setHasScreeningQuestions] = useState(false);

  const loadApplicantInfo = useCallback(async () => {
    try {
      const response = await apiFetch(`/api/applicants/${applicantId}`);
      if (response.ok) {
        const data = await response.json();
        setApplicant({
          id: data.id,
          name: data.name,
          surname: data.surname,
          email: data.email,
          phone: data.phone
        });
      }
    } catch (error) {
      console.error('Error loading applicant info:', error);
    }
  }, [applicantId]);

  const checkApplicationEligibility = useCallback(async () => {
    try {
      setCheckingEligibility(true);
      const response = await apiFetch(`/api/applications/can-apply?applicantId=${applicantId}&jobAdId=${jobAdId}`);
      if (response.ok) {
        const data = await response.json();
        setCanApply(data.canApply);
      }
    } catch (error) {
      console.error('Error checking application eligibility:', error);
      setCanApply(false);
    } finally {
      setCheckingEligibility(false);
    }
  }, [applicantId, jobAdId]);

  const checkScreeningQuestions = useCallback(async () => {
    try {
      const response = await apiFetch(`/api/screening/questions/job-posting/${jobAdId}`);
      if (response.ok) {
        const data = await response.json();
        setHasScreeningQuestions(Array.isArray(data) && data.length > 0);
      }
    } catch (error) {
      console.error('Error checking screening questions:', error);
    }
  }, [jobAdId]);

  useEffect(() => {
    checkScreeningQuestions();
    if (applicantId) {
      loadApplicantInfo();
      checkApplicationEligibility();
    } else {
      setCheckingEligibility(false);
    }
  }, [applicantId, jobAdId, loadApplicantInfo, checkApplicationEligibility, checkScreeningQuestions]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!applicantId) {
      newErrors.applicant = 'Applicant selection is required';
    }
    
    if (!coverLetter.trim()) {
      newErrors.coverLetter = 'Cover letter is required';
    } else if (coverLetter.length < 100) {
      newErrors.coverLetter = 'Cover letter must be at least 100 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      const submitData = {
        applicantId,
        jobAdId,
        jobTitle,
        department,
        coverLetter: coverLetter.trim(),
        applicationSource
      };

      const response = await apiFetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        const result = await response.json();
        if (hasScreeningQuestions) {
          setCreatedApplication(result);
        } else if (onSuccess) {
          onSuccess(result);
        }
      } else {
        const errorData = await response.json();
        setErrors({ general: errorData.message || 'Failed to submit application' });
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      setErrors({ general: 'An error occurred while submitting your application' });
    } finally {
      setLoading(false);
    }
  };

  if (checkingEligibility) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking application eligibility...</p>
        </div>
      </div>
    );
  }

  if (!canApply) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-sm p-6">
        <div className="flex items-center mb-4">
          <span className="text-yellow-600 text-2xl mr-3">⚠️</span>
          <h3 className="text-lg font-medium text-yellow-800">Application Not Available</h3>
        </div>
        <p className="text-yellow-700 mb-4">
          You have already submitted an application for this position, or you are not eligible to apply at this time.
        </p>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-yellow-600 text-white rounded-sm hover:bg-yellow-700"
          >
            Go Back
          </button>
        )}
      </div>
    );
  }

  if (createdApplication) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-sm shadow-lg p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Screening Questions</h2>
          <div className="bg-gold-50 border border-violet-200 rounded-sm p-4">
            <h3 className="font-medium text-violet-900">{jobTitle}</h3>
            {department && <p className="text-violet-700 text-sm">{department}</p>}
          </div>
          <p className="text-sm text-gray-600 mt-3">
            Your application has been submitted. Please complete the screening questions below to finalise your application.
          </p>
        </div>
        <ScreeningQuestions
          applicationId={createdApplication.id}
          jobPostingId={jobAdId}
          onComplete={() => {
            if (onSuccess) {
              onSuccess(createdApplication);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-sm shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Apply for Position</h2>
        <div className="bg-gold-50 border border-violet-200 rounded-sm p-4">
          <h3 className="font-medium text-violet-900">{jobTitle}</h3>
          {department && <p className="text-violet-700 text-sm">{department}</p>}
        </div>
      </div>

      {applicant && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Applicant Information</h3>
          <div className="bg-gray-50 rounded-sm p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="text-gray-900">{applicant.name} {applicant.surname}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900">{applicant.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="text-gray-900">{applicant.phone || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {errors.general && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Application Source */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How did you hear about this position? *
          </label>
          <select
            value={applicationSource}
            onChange={(e) => setApplicationSource(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
          >
            <option value="EXTERNAL">Job Board / Website</option>
            <option value="INTERNAL">Internal Posting</option>
            <option value="REFERRAL">Employee Referral</option>
            <option value="RECRUITER">Recruiter Contact</option>
            <option value="SOCIAL_MEDIA">Social Media</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        {/* Cover Letter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cover Letter *
          </label>
          <textarea
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            placeholder="Please explain why you are interested in this position and how your skills and experience make you a good fit..."
            rows={8}
            className={`w-full p-3 border rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400 ${
              errors.coverLetter ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          <div className="mt-1 flex justify-between">
            {errors.coverLetter && (
              <p className="text-red-500 text-sm">{errors.coverLetter}</p>
            )}
            <p className="text-gray-500 text-sm ml-auto">
              {coverLetter.length} characters (minimum 100)
            </p>
          </div>
        </div>

        {/* Application Notes */}
        <div className="bg-gray-50 border border-gray-200 rounded-sm p-4">
          <h4 className="font-medium text-gray-900 mb-2">Important Notes</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Ensure your applicant profile is complete before submitting</li>
            <li>• Upload your latest CV and any supporting documents</li>
            <li>• You will receive email notifications about your application status</li>
            <li>• Applications are typically reviewed within 3-5 business days</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-gold-500 text-violet-950 rounded-sm hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </span>
            ) : (
              'Submit Application'
            )}
          </button>
        </div>
      </form>

      {/* Privacy Notice */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          By submitting this application, you consent to the processing of your personal information 
          in accordance with our Privacy Policy and the Protection of Personal Information Act (POPIA). 
          Your information will be used solely for recruitment purposes.
        </p>
      </div>
    </div>
  );
}