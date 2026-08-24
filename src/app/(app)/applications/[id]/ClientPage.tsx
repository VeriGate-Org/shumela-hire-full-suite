'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api-fetch';
import PageWrapper from '@/components/PageWrapper';
import EmptyState from '@/components/EmptyState';
import StatusPill from '@/components/StatusPill';
import ConfirmDialog from '@/components/ConfirmDialog';
import VerificationReportDownload from '@/components/VerificationReportDownload';
import ShortlistButton from '@/components/ShortlistButton';
import { getEnumLabel } from '@/utils/enumLabels';
import { useToast } from '@/components/Toast';
import {
  ArrowLeftIcon,
  UserCircleIcon,
  EnvelopeIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  StarIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

// Application detail page — reached via the "View" action in
// ApplicationManagementConsole (and anywhere else linking to
// /applications/{id}), which pushed to this route even though it never
// existed: every visit 403'd straight from S3 with no matching object.
interface DocumentInfo {
  id: string;
  filename: string;
  url: string;
  type: string;
  fileSizeFormatted?: string;
  uploadedAt?: string;
}

interface ApplicationDetail {
  id: string;
  applicantId?: string;
  applicantName?: string;
  applicantEmail?: string;
  jobAdId?: string;
  jobTitle?: string;
  department?: string;
  status: string;
  statusDisplayName?: string;
  coverLetter?: string;
  applicationSource?: string;
  submittedAt?: string;
  withdrawnAt?: string;
  withdrawalReason?: string;
  screeningNotes?: string;
  interviewFeedback?: string;
  rating?: number;
  rejectionReason?: string;
  offerDetails?: string;
  applicationDocuments?: DocumentInfo[];
  daysFromSubmission?: number;
  canBeWithdrawn?: boolean;
}

export default function ApplicationDetailPage() {
  // Static export: this page is pre-rendered once at build time with a
  // placeholder id ("_" — see generateStaticParams in page.tsx and the
  // CloudFront "/applications/*" rewrite behavior in
  // ShumelaHireFrontendStack.cs). useParams() would read that build-time
  // placeholder instead of the real id on a hard page load/refresh, so the
  // real id is read from the actual browser URL instead.
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const applicationId = useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);
    // ['applications', '<id>']
    return parts.length >= 2 ? parts[1] : '';
  }, [pathname]);

  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFetch(`/api/applications/${applicationId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('Application not found');
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      const data: ApplicationDetail = await response.json();
      setApplication(data);
    } catch (err) {
      console.error('Error loading application:', err);
      setError(err instanceof Error ? err.message : 'Failed to load application');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !applicationId) return;
    fetchApplication();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, applicationId]);

  const handleReject = async () => {
    if (!application) return;
    setRejecting(true);
    try {
      const response = await apiFetch(`/api/applications/${application.id}/status?status=REJECTED`, {
        method: 'PUT',
      });
      if (response.ok) {
        toast('Application rejected', 'success');
        setShowRejectConfirm(false);
        fetchApplication();
      } else {
        toast('Failed to reject application', 'error');
      }
    } catch (err) {
      console.error('Error rejecting application:', err);
      toast('Failed to reject application', 'error');
    } finally {
      setRejecting(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const headerActions = (
    <div className="flex items-center gap-2">
      {/* The candidate's own record is the most natural place to take the decision, and until now
          the only route to it was the shortlisting panel on the vacancy. */}
      {application && (
        <ShortlistButton
          applicationId={application.id}
          candidateName={application.applicantName}
        />
      )}
      <Link href="/applications">
        <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-full text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          <ArrowLeftIcon className="w-4 h-4 mr-1.5" />
          Back
        </button>
      </Link>
    </div>
  );

  if (loading) {
    return (
      <PageWrapper title="Application" subtitle="Loading..." actions={headerActions}>
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
        </div>
      </PageWrapper>
    );
  }

  if (error || !application) {
    return (
      <PageWrapper title="Application Not Found" actions={headerActions}>
        <EmptyState
          icon={ExclamationTriangleIcon}
          title="Application Not Found"
          description={error || "The application you're looking for doesn't exist or you don't have access to it."}
          action={{ label: 'Back to Applications', onClick: () => router.push('/applications') }}
        />
      </PageWrapper>
    );
  }

  const canReject = !['REJECTED', 'WITHDRAWN', 'HIRED', 'OFFER_ACCEPTED'].includes(application.status);

  return (
    <PageWrapper
      title={application.applicantName || 'Application'}
      subtitle={[application.jobTitle, application.department].filter(Boolean).join(' · ')}
      actions={headerActions}
    >
      <div className="space-y-6">
        {/* Header Card */}
        <div className="bg-white rounded-control shadow border border-gray-200 p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-violet-600 rounded-full flex items-center justify-center flex-shrink-0">
                <UserCircleIcon className="w-9 h-9 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{application.applicantName || 'Unknown Candidate'}</h2>
                {application.applicantEmail && (
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <EnvelopeIcon className="w-4 h-4 mr-1.5" />
                    {application.applicantEmail}
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                  {application.jobTitle && (
                    <div className="flex items-center">
                      <BriefcaseIcon className="w-4 h-4 mr-1.5" />
                      {application.jobTitle}
                    </div>
                  )}
                  {application.department && (
                    <div className="flex items-center">
                      <BuildingOfficeIcon className="w-4 h-4 mr-1.5" />
                      {application.department}
                    </div>
                  )}
                  {application.submittedAt && (
                    <div className="flex items-center">
                      <CalendarIcon className="w-4 h-4 mr-1.5" />
                      Applied {new Date(application.submittedAt).toLocaleDateString()}
                      {typeof application.daysFromSubmission === 'number' && (
                        <span className="ml-1">({application.daysFromSubmission}d ago)</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <StatusPill value={application.status} domain="applicationStatus" size="md" />
              {typeof application.rating === 'number' && application.rating > 0 && (
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((n) =>
                    n <= application.rating! ? (
                      <StarIconSolid key={n} className="w-4 h-4 text-yellow-400" />
                    ) : (
                      <StarIcon key={n} className="w-4 h-4 text-gray-300" />
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          {canReject && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowRejectConfirm(true)}
                className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-full text-red-700 bg-white hover:bg-red-50 transition-colors"
              >
                <XCircleIcon className="w-4 h-4 mr-1.5" />
                Reject Application
              </button>
            </div>
          )}
        </div>

        {/* Withdrawal / Rejection notices */}
        {application.status === 'WITHDRAWN' && application.withdrawalReason && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-control">
            <p className="text-sm font-medium text-gray-900">Withdrawn</p>
            <p className="text-sm text-gray-600 mt-1">{application.withdrawalReason}</p>
          </div>
        )}
        {application.status === 'REJECTED' && application.rejectionReason && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-control">
            <p className="text-sm font-medium text-red-800">Rejection Reason</p>
            <p className="text-sm text-red-700 mt-1">{application.rejectionReason}</p>
          </div>
        )}
        {application.offerDetails && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-control">
            <p className="text-sm font-medium text-green-800">Offer Details</p>
            <p className="text-sm text-green-700 mt-1">{application.offerDetails}</p>
          </div>
        )}

        {/* Cover Letter */}
        {application.coverLetter && (
          <div className="bg-white rounded-control shadow border border-gray-200 p-6">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Cover Letter</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{application.coverLetter}</p>
          </div>
        )}

        {/* Screening Notes */}
        {application.screeningNotes && (
          <div className="bg-white rounded-control shadow border border-gray-200 p-6">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Screening Notes</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{application.screeningNotes}</p>
          </div>
        )}

        {/* Interview Feedback */}
        {application.interviewFeedback && (
          <div className="bg-white rounded-control shadow border border-gray-200 p-6">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Interview Feedback</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{application.interviewFeedback}</p>
          </div>
        )}

        {/* Documents */}
        <div className="bg-white rounded-control shadow border border-gray-200 p-6">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Documents</h3>
          {!application.applicationDocuments || application.applicationDocuments.length === 0 ? (
            <p className="text-sm text-gray-500">No documents attached to this application.</p>
          ) : (
            <div className="space-y-2">
              {application.applicationDocuments.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-control hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center min-w-0">
                    <DocumentTextIcon className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{doc.filename}</p>
                      <p className="text-xs text-gray-500">{getEnumLabel('documentType', doc.type)}{doc.fileSizeFormatted ? ` · ${doc.fileSizeFormatted}` : ''}</p>
                    </div>
                  </div>
                  <ArrowDownTrayIcon className="w-4 h-4 text-gray-400 flex-shrink-0 ml-3" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Verification — the candidate's own record is the obvious place to look for their
            verification report, and until now the only route to one was the pipeline's Checks
            stage. */}
        <div className="bg-white rounded-control shadow border border-gray-200 p-6">
          <VerificationReportDownload applicationId={application.id} />
        </div>
      </div>

      <ConfirmDialog
        open={showRejectConfirm}
        title="Reject Application"
        message={`Are you sure you want to reject ${application.applicantName || 'this candidate'}'s application? This action can be reversed by changing the status again.`}
        confirmLabel={rejecting ? 'Rejecting...' : 'Reject'}
        variant="danger"
        onConfirm={handleReject}
        onCancel={() => setShowRejectConfirm(false)}
      />
    </PageWrapper>
  );
}
