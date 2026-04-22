'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import PageWrapper from '@/components/PageWrapper';
import EmptyState from '@/components/EmptyState';
import JobPostingForm from '@/components/JobPostingForm';
import JobPostingWorkflow from '@/components/JobPostingWorkflow';
import JobBoardManager from '@/components/JobBoardManager';
import MultiChannelPublishWizard from '@/components/MultiChannelPublishWizard';
import VacancyReportActions from '@/components/VacancyReportActions';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api-fetch';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import LinkedInPostToCompany from '@/components/LinkedInPostToCompany';

interface JobPosting {
  id: string | number;
  title: string;
  department: string;
  status: string;
  statusDisplayName: string;
  statusCssClass: string;
  statusIcon: string;
  employmentType: string;
  employmentTypeDisplayName: string;
  experienceLevel: string;
  experienceLevelDisplayName: string;
  location?: string;
  salaryRange: string;
  canBeEdited: boolean;
  canBeSubmittedForApproval: boolean;
  canBeApproved: boolean;
  canBeRejected: boolean;
  canBePublished: boolean;
  canBeUnpublished: boolean;
  canBeClosed: boolean;
  createdAt: string;
  submittedForApprovalAt?: string;
  approvedAt?: string;
  publishedAt?: string;
  unpublishedAt?: string;
  closedAt?: string;
  approvalNotes?: string;
  rejectionReason?: string;
  createdBy: number;
  approvedBy?: number;
  publishedBy?: number;
  daysFromCreation: number;
  daysFromPublication: number;
  applicationsCount: number;
  viewsCount: number;
  featured: boolean;
  urgent: boolean;
  remoteWorkAllowed: boolean;
}

const PAGE_SIZE = 10;

const ALL_STATUSES = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'UNPUBLISHED', label: 'Unpublished' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function JobPostingsPage() {
  const [view, setView] = useState<'list' | 'create' | 'edit' | 'workflow'>('list');
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [selectedJobPosting, setSelectedJobPosting] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [showLinkedInModal, setShowLinkedInModal] = useState(false);
  const [linkedInJobPosting, setLinkedInJobPosting] = useState<JobPosting | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingJobPosting, setDeletingJobPosting] = useState<JobPosting | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPublishWizard, setShowPublishWizard] = useState(false);
  const { setCurrentRole } = useTheme();
  const { user } = useAuth();
  const currentUserId = useMemo(() => {
    return user?.id || null;
  }, [user?.id]);

  // Debounce timer ref
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const searchParams = useSearchParams();

  // Set theme to admin for job postings page
  useEffect(() => {
    setCurrentRole('ADMIN');
  }, [setCurrentRole]);

  // Handle ?action=create from dashboard "Create Position" button
  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setView('create');
    }
  }, [searchParams]);

  const loadJobPostings = useCallback(async (page = currentPage) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        size: String(PAGE_SIZE),
        sort: 'createdAt',
        direction: 'desc',
      });

      if (searchTerm.trim()) {
        params.set('search', searchTerm.trim());
      }
      if (statusFilter !== 'ALL') {
        params.set('status', statusFilter);
      }

      const response = await apiFetch(`/api/job-postings/search?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setJobPostings(data.content || []);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      }
    } catch (error) {
      console.error('Error loading job postings:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter]);

  // Load when view switches to list or pagination/filters change
  useEffect(() => {
    if (view === 'list') {
      loadJobPostings();
    }
  }, [view, currentPage, loadJobPostings]);

  // Reset page to 0 when search or filter changes (debounced for search)
  useEffect(() => {
    setCurrentPage(0);
  }, [statusFilter]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setCurrentPage(0);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchTerm]);

  const handleJobPostingSaved = (jobPosting: { id: string | number; title: string; status: string }) => {
    console.log('Job posting saved:', jobPosting);
    setView('list');
    loadJobPostings(0);
  };

  const handleStatusChange = async (jobPostingId: string | number, _newStatus: string) => {
    // Refresh the list to get server-authoritative data
    await loadJobPostings();

    // If viewing workflow, re-fetch individual posting for updated canBe* flags
    if (view === 'workflow') {
      try {
        const response = await apiFetch(`/api/job-postings/${jobPostingId}`);
        if (response.ok) {
          const updated = await response.json();
          setSelectedJobPosting(updated);
        }
      } catch (error) {
        console.error('Error refreshing job posting:', error);
      }
    }
  };

  const handleDeleteJobPosting = async () => {
    if (!deletingJobPosting || !currentUserId) return;

    try {
      setIsDeleting(true);
      const response = await apiFetch(
        `/api/job-postings/${deletingJobPosting.id}?deletedBy=${currentUserId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        setShowDeleteConfirm(false);
        setDeletingJobPosting(null);
        loadJobPostings();
      } else {
        let message = 'Failed to delete job posting';
        try {
          const errorData = await response.json();
          if (errorData?.message) {
            message = errorData.message;
          }
        } catch {
          // Leave default message
        }
        console.error(message);
      }
    } catch (error) {
      console.error('Error deleting job posting:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getPageTitle = () => {
    switch (view) {
      case 'create': return 'Create Job Posting';
      case 'edit': return 'Edit Job Posting';
      case 'workflow': return 'Job Posting Workflow';
      default: return 'Job Postings';
    }
  };

  const getPageSubtitle = () => {
    switch (view) {
      case 'create': return 'Fill in the details to create a new job posting.';
      case 'edit': return 'Update the job posting details.';
      case 'workflow': return 'Manage the approval and publishing workflow.';
      default: return 'Create, review, and publish job postings with full workflow controls.';
    }
  };

  const pageActions = view === 'list' ? (
    <button
      onClick={() => setView('create')}
      className="px-4 py-2 bg-transparent border-2 border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider rounded-full font-medium"
    >
      Create Job Posting
    </button>
  ) : undefined;

  // Pagination helpers
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(0, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible);
    start = Math.max(0, end - maxVisible);

    for (let i = start; i < end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <PageWrapper
      title={getPageTitle()}
      subtitle={getPageSubtitle()}
      actions={pageActions}
    >
      <div className="space-y-6">
        {view === 'list' && (
          <div>
            {!currentUserId && (
              <div className="mb-6 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Workflow actions require a valid signed-in numeric user ID for audit tracking.
              </div>
            )}

            {/* Search and Filter */}
            <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Search Job Postings
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by title or department..."
                    className="w-full rounded-md border border-gray-300 p-2 focus:border-violet-400 focus:ring-2 focus:ring-gold-500/60"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Filter by Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full rounded-md border border-gray-300 p-2 focus:border-violet-400 focus:ring-2 focus:ring-gold-500/60"
                  >
                    <option value="ALL">All Statuses</option>
                    {ALL_STATUSES.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Job Postings List */}
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {jobPostings.length === 0 ? (
                  <EmptyState
                    icon={DocumentTextIcon}
                    title="No job postings available"
                    description={
                      searchTerm || statusFilter !== 'ALL'
                        ? 'No job postings match your search criteria.'
                        : 'No job postings are currently available. Create your first one to get started.'
                    }
                    action={!searchTerm && statusFilter === 'ALL' ? {
                      label: 'Create Job Posting',
                      onClick: () => setView('create'),
                    } : undefined}
                  />
                ) : (
                  <>
                    {jobPostings.map((jobPosting) => (
                      <div key={jobPosting.id} className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3
                                className="text-lg font-medium text-gray-900 cursor-pointer hover:text-[#05527E] transition-colors"
                                onClick={() => { setSelectedJobPosting(jobPosting); setView('workflow'); window.scrollTo(0, 0); }}
                              >{jobPosting.title}</h3>
                              {jobPosting.featured && (
                                <span className="inline-flex items-center rounded-full border border-yellow-300 bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800">
                                  Featured
                                </span>
                              )}
                              {jobPosting.urgent && (
                                <span className="inline-flex items-center rounded-full border border-red-300 bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                                  Urgent
                                </span>
                              )}
                              {jobPosting.remoteWorkAllowed && (
                                <span className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                                  Remote
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                              <div>
                                <p><strong>Department:</strong> {jobPosting.department}</p>
                                <p><strong>Type:</strong> {jobPosting.employmentTypeDisplayName}</p>
                                <p><strong>Experience:</strong> {jobPosting.experienceLevelDisplayName}</p>
                              </div>
                              <div>
                                <p><strong>Location:</strong> {jobPosting.location || 'Not specified'}</p>
                                <p><strong>Salary:</strong> {jobPosting.salaryRange}</p>
                                <p><strong>Applications:</strong> {jobPosting.applicationsCount}</p>
                              </div>
                            </div>

                            <p className="text-sm text-gray-500 mt-2">
                              Created {jobPosting.daysFromCreation} days ago
                              {jobPosting.status === 'PUBLISHED' && ` • Published ${jobPosting.daysFromPublication} days ago`}
                            </p>
                          </div>

                          <div className="flex items-center space-x-3">
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${jobPosting.statusCssClass}`}>
                              {jobPosting.statusDisplayName}
                            </span>

                            <div className="flex space-x-2">
                              {jobPosting.canBeEdited && (
                                <button
                                  onClick={() => {
                                    setSelectedJobPosting(jobPosting);
                                    setView('edit');
                                    window.scrollTo(0, 0);
                                  }}
                                  className="text-gold-600 hover:text-gold-800 text-sm font-medium"
                                >
                                  Edit
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setSelectedJobPosting(jobPosting);
                                  setView('workflow');
                                  window.scrollTo(0, 0);
                                }}
                                className="text-violet-600 hover:text-violet-800 text-sm font-medium"
                              >
                                Workflow
                              </button>

                              {jobPosting.status === 'PUBLISHED' && user?.role && ['ADMIN', 'HR_MANAGER', 'RECRUITER'].includes(user.role) && (
                                <button
                                  onClick={() => {
                                    setLinkedInJobPosting(jobPosting);
                                    setShowLinkedInModal(true);
                                  }}
                                  className="text-[#0A66C2] hover:text-[#004182] text-sm font-medium flex items-center gap-1"
                                  title="Post to company LinkedIn page"
                                >
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                  </svg>
                                  LinkedIn
                                </button>
                              )}

                              {(jobPosting.status === 'DRAFT' || jobPosting.status === 'REJECTED') && currentUserId && (
                                <button
                                  onClick={() => {
                                    setDeletingJobPosting(jobPosting);
                                    setShowDeleteConfirm(true);
                                  }}
                                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between pt-4">
                        <p className="text-sm text-gray-600">
                          Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, totalElements)} of {totalElements}
                        </p>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                            disabled={currentPage === 0}
                            className="px-3 py-1 text-sm rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          {getPageNumbers().map(page => (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`px-3 py-1 text-sm rounded-full ${
                                page === currentPage
                                  ? 'bg-gold-500 text-white border border-gold-500'
                                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {page + 1}
                            </button>
                          ))}
                          <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                            disabled={currentPage >= totalPages - 1}
                            className="px-3 py-1 text-sm rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {view === 'create' && (
          <div>
            <div className="mb-4">
              <button
                onClick={() => setView('list')}
                className="text-violet-500 hover:text-gold-700 font-medium"
              >
                &larr; Back to Job Postings
              </button>
            </div>

            <JobPostingForm
              currentUserId={currentUserId}
              onSuccess={handleJobPostingSaved}
              onCancel={() => setView('list')}
            />
          </div>
        )}

        {view === 'edit' && selectedJobPosting && (
          <div>
            <div className="mb-4">
              <button
                onClick={() => setView('list')}
                className="text-violet-500 hover:text-gold-700 font-medium"
              >
                &larr; Back to Job Postings
              </button>
            </div>

            <JobPostingForm
              jobPostingId={selectedJobPosting.id}
              currentUserId={currentUserId}
              onSuccess={handleJobPostingSaved}
              onCancel={() => setView('list')}
            />
          </div>
        )}

        {view === 'workflow' && selectedJobPosting && (
          <div>
            <div className="mb-4">
              <button
                onClick={() => setView('list')}
                className="text-violet-500 hover:text-gold-700 font-medium"
              >
                &larr; Back to Job Postings
              </button>
            </div>

            <JobPostingWorkflow
              jobPosting={selectedJobPosting}
              onStatusChange={handleStatusChange}
              currentUserId={currentUserId ?? undefined}
            />

            {selectedJobPosting.status === 'PUBLISHED' && (
              <>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowPublishWizard(true)}
                    className="px-4 py-2 bg-gold-500 text-violet-950 rounded-sm hover:bg-gold-600 text-sm font-medium"
                  >
                    Publish to All Channels
                  </button>
                </div>
                <div className="mt-3 rounded-md border border-gray-200 bg-white p-6 shadow-sm">
                  <JobBoardManager jobId={String(selectedJobPosting.id)} />
                </div>
              </>
            )}

            {(selectedJobPosting.status === 'PUBLISHED' || selectedJobPosting.status === 'CLOSED') && (
              <div className="mt-6 rounded-md border border-gray-200 bg-white p-6 shadow-sm">
                <VacancyReportActions
                  jobId={String(selectedJobPosting.id)}
                  showDemographics={user?.role === 'ADMIN' || user?.role === 'HR_MANAGER'}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {linkedInJobPosting && (
        <LinkedInPostToCompany
          jobPosting={linkedInJobPosting}
          isOpen={showLinkedInModal}
          onClose={() => {
            setShowLinkedInModal(false);
            setLinkedInJobPosting(null);
          }}
        />
      )}

      {/* Multi-Channel Publish Wizard */}
      {selectedJobPosting && (
        <MultiChannelPublishWizard
          jobId={String(selectedJobPosting.id)}
          isOpen={showPublishWizard}
          onClose={() => setShowPublishWizard(false)}
          onComplete={() => {
            // Refresh to reflect new postings
            if (selectedJobPosting) {
              handleStatusChange(selectedJobPosting.id, selectedJobPosting.status);
            }
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deletingJobPosting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className="mx-4 w-full max-w-md rounded-md border border-gray-200 bg-white p-6 shadow-lg"
            role="dialog"
            aria-modal="true"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Job Posting</h3>
            <p className="text-sm text-gray-600 mb-1">
              Are you sure you want to delete <strong>{deletingJobPosting.title}</strong>?
            </p>
            <p className="text-sm text-red-600 mb-6">
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletingJobPosting(null);
                }}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteJobPosting}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-full hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
