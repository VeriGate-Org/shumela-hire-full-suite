'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api-fetch';
import { useToast } from '@/components/Toast';
import PageWrapper from '@/components/PageWrapper';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  UserIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

interface ApplicationFormData {
  coverLetter: string;
  reasonForApplication: string;
  availabilityDate: string;
}

export default function InternalApplicationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const requisitionId = params.requisitionId as string;
  const jobId = searchParams.get('jobId');
  const jobTitle = searchParams.get('title') || 'Position';

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ApplicationFormData>({
    coverLetter: '',
    reasonForApplication: '',
    availabilityDate: '',
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, router]);

  const handleInputChange = (field: keyof ApplicationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      // Combine reasonForApplication and coverLetter for the backend coverLetter field
      const coverLetterParts = [formData.reasonForApplication, formData.coverLetter].filter(Boolean);
      const combinedCoverLetter = coverLetterParts.join('\n\n');

      const response = await apiFetch('/api/applications', {
        method: 'POST',
        body: JSON.stringify({
          jobAdId: jobId ? Number(jobId) : undefined,
          applicationSource: 'INTERNAL',
          coverLetter: combinedCoverLetter || undefined,
          availabilityDate: formData.availabilityDate || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || errorData?.error || 'Failed to submit application');
      }

      setSubmitted(true);
      toast('Application submitted successfully', 'success');
    } catch (err) {
      console.error('Error submitting application:', err);
      const message = err instanceof Error ? err.message : 'Failed to submit application';
      setError(message);
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  const backAction = (
    <Link href="/internal/jobs">
      <button className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-300 rounded-full px-4 py-2 transition-colors">
        <ArrowLeftIcon className="w-4 h-4 mr-2" />
        Back to Job Board
      </button>
    </Link>
  );

  if (submitted) {
    return (
      <PageWrapper title="Application Submitted" subtitle={`Internal application for ${decodeURIComponent(jobTitle)}`} actions={backAction}>
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-sm shadow border border-gray-200 p-8 text-center">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted</h2>
            <p className="text-gray-600 mb-6">
              Your internal application for <strong>{decodeURIComponent(jobTitle)}</strong> has been submitted successfully.
            </p>
            <div className="bg-gold-50 border border-gold-200 rounded-sm p-4 mb-6 text-left">
              <p className="text-sm font-semibold text-gray-900 mb-2">What happens next?</p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>Your application will be prioritised as an internal candidate</li>
                <li>HR will review your application within 3-5 business days</li>
                <li>You will receive updates via email and the internal portal</li>
              </ul>
            </div>
            <div className="space-y-3">
              <Link href="/internal/jobs">
                <button className="w-full border-2 border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-violet-950 px-4 py-2.5 rounded-full text-sm font-medium uppercase tracking-wider transition-colors">
                  Browse More Internal Jobs
                </button>
              </Link>
              <Link href="/applicant/applications">
                <button className="w-full border border-gray-300 text-gray-700 px-4 py-2.5 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors">
                  View My Applications
                </button>
              </Link>
            </div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Internal Job Application"
      subtitle={`Applying for: ${decodeURIComponent(jobTitle)} · Requisition ${requisitionId}`}
      actions={backAction}
    >
      <div className="space-y-6">
        {/* Internal Application Benefits */}
        <div className="bg-gold-50 border border-gold-200 rounded-sm p-6">
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Internal Application Advantages</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gold-500 rounded-full flex items-center justify-center mr-3">
                <UserIcon className="w-4 h-4 text-violet-950" />
              </div>
              <span className="text-sm text-gray-800">Priority Review</span>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mr-3">
                <BuildingOfficeIcon className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm text-gray-800">Known Performance</span>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-3">
                <DocumentTextIcon className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm text-gray-800">Faster Process</span>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-sm">
            <div className="flex">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Application Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Application Form */}
        <div className="bg-white rounded-sm shadow border border-gray-200">
          <form onSubmit={handleSubmit}>
            {/* Applicant Info (read-only) */}
            {user && (
              <div className="px-6 py-6 border-b border-gray-200">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Your Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm text-sm text-gray-700">{user.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm text-sm text-gray-700">{user.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Application Details */}
            <div className="px-6 py-6 space-y-4">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Application Details</h3>

              <div>
                <label htmlFor="availability-date" className="block text-sm font-medium text-gray-700 mb-1">
                  Available Start Date
                </label>
                <input
                  type="date"
                  id="availability-date"
                  value={formData.availabilityDate}
                  onChange={(e) => handleInputChange('availabilityDate', e.target.value)}
                  className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="reason-for-application" className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Application <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="reason-for-application"
                  rows={4}
                  required
                  aria-required="true"
                  value={formData.reasonForApplication}
                  onChange={(e) => handleInputChange('reasonForApplication', e.target.value)}
                  className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Why are you interested in this position? What motivates you to make this internal move?"
                />
              </div>

              <div>
                <label htmlFor="cover-letter" className="block text-sm font-medium text-gray-700 mb-1">
                  Cover Letter
                </label>
                <textarea
                  id="cover-letter"
                  rows={6}
                  value={formData.coverLetter}
                  onChange={(e) => handleInputChange('coverLetter', e.target.value)}
                  className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Describe how your current experience and skills make you a great fit for this role..."
                />
              </div>
            </div>

            {/* Submission */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                By submitting, you confirm that all information provided is accurate.
              </p>

              <button
                type="submit"
                disabled={loading || !formData.reasonForApplication}
                className="inline-flex items-center px-6 py-2.5 border-2 border-gold-500 text-sm font-medium rounded-full bg-transparent text-gold-500 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="w-4 h-4 mr-2" />
                    Submit Application
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageWrapper>
  );
}