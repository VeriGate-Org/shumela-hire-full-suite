'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import JobPostingForm from '@/components/JobPostingForm';
import JobPostingWorkflow from '@/components/JobPostingWorkflow';
import { useTheme } from '@/contexts/ThemeContext';
import EnterpriseThemeToggle from '@/components/EnterpriseThemeToggle';

interface JobPosting {
  id: number;
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

export default function JobPostingsPage() {
  const [view, setView] = useState<'list' | 'create' | 'edit' | 'workflow'>('list');
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [selectedJobPosting, setSelectedJobPosting] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const { setCurrentRole } = useTheme();

  // Set theme to admin for job postings page
  useEffect(() => {
    setCurrentRole('ADMIN');
  }, [setCurrentRole]);

  useEffect(() => {
    if (view === 'list') {
      loadJobPostings();
    }
  }, [view]);

  const loadJobPostings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/job-postings');
      if (response.ok) {
        const data = await response.json();
        setJobPostings(data.content || data);
      }
    } catch (error) {
      console.error('Error loading job postings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJobPostingSaved = (jobPosting: { id: number; title: string; status: string }) => {
    console.log('Job posting saved:', jobPosting);
    setView('list');
    loadJobPostings();
  };

  const handleStatusChange = (jobPostingId: number, newStatus: string) => {
    // Update local state
    setJobPostings(prev => prev.map(jp => 
      jp.id === jobPostingId ? { ...jp, status: newStatus } : jp
    ));
    loadJobPostings(); // Refresh to get updated data
  };

  const filteredJobPostings = jobPostings.filter(jp => {
    const matchesSearch = !searchTerm || 
      jp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      jp.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || jp.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusOptions = () => {
    const statuses = [...new Set(jobPostings.map(jp => jp.status))];
    return statuses;
  };

  return (
    <PageWrapper
      title={
        view === 'list' ? 'Job Postings' :
        view === 'create' ? 'Create Job Posting' :
        view === 'edit' ? 'Edit Job Posting' :
        'Job Posting Workflow'
      }
    >
      <div className="space-y-6">
        {view === 'list' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold">Job Posting Management</h1>
                <p className="text-gray-500 mt-1">Create and manage job postings</p>
              </div>
              <div className="flex items-center gap-2">
                <EnterpriseThemeToggle variant="compact" />
                <button
                  onClick={() => setView('create')}
                  className="px-4 py-2 bg-violet-500 text-white rounded-md hover:bg-violet-600"
                >
                  Create Job Posting
                </button>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search Job Postings
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by title or department..."
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filter by Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
                  >
                    <option value="ALL">All Statuses</option>
                    {getStatusOptions().map(status => (
                      <option key={status} value={status}>{status.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Job Postings List */}
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredJobPostings.length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-8 text-center">
                    <p className="text-gray-600 mb-4">
                      {jobPostings.length === 0 ? 
                        'No job postings found. This is a demo of the Job Posting Management feature.' :
                        'No job postings match your search criteria.'
                      }
                    </p>
                    
                    {jobPostings.length === 0 && (
                      <div className="space-y-4">
                        <div className="border rounded-lg p-4 text-left">
                          <h3 className="font-medium text-lg mb-2">Feature Overview</h3>
                          <ul className="list-disc list-inside space-y-1 text-gray-600">
                            <li>Complete job posting creation with rich form validation</li>
                            <li>Comprehensive approval workflow (Draft → Approval → Published)</li>
                            <li>Status-based permissions and workflow actions</li>
                            <li>Publication and unpublication controls</li>
                            <li>SEO optimization fields and settings</li>
                            <li>Analytics tracking (views, applications)</li>
                            <li>Advanced search and filtering capabilities</li>
                            <li>Role-based access control and audit logging</li>
                          </ul>
                        </div>
                        
                        <button
                          onClick={() => setView('create')}
                          className="px-4 py-2 bg-violet-500 text-white rounded-md hover:bg-violet-600"
                        >
                          Try Demo Job Posting Form
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  filteredJobPostings.map((jobPosting) => (
                    <div key={jobPosting.id} className="bg-white rounded-lg shadow p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-900">{jobPosting.title}</h3>
                            {jobPosting.featured && (
                              <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded">
                                ⭐ Featured
                              </span>
                            )}
                            {jobPosting.urgent && (
                              <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded">
                                🚨 Urgent
                              </span>
                            )}
                            {jobPosting.remoteWorkAllowed && (
                              <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                                🏠 Remote
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
                            <span className="mr-1">{jobPosting.statusIcon}</span>
                            {jobPosting.statusDisplayName}
                          </span>
                          
                          <div className="flex space-x-2">
                            {jobPosting.canBeEdited && (
                              <button
                                onClick={() => {
                                  setSelectedJobPosting(jobPosting);
                                  setView('edit');
                                }}
                                className="text-violet-600 hover:text-violet-800 text-sm font-medium"
                              >
                                Edit
                              </button>
                            )}
                            
                            <button
                              onClick={() => {
                                setSelectedJobPosting(jobPosting);
                                setView('workflow');
                              }}
                              className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                            >
                              Workflow
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
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
                className="text-violet-500 hover:text-violet-700 font-medium"
              >
                ← Back to Job Postings
              </button>
            </div>
            
            <JobPostingForm
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
                className="text-violet-500 hover:text-violet-700 font-medium"
              >
                ← Back to Job Postings
              </button>
            </div>

            <JobPostingForm
              jobPostingId={selectedJobPosting.id}
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
                className="text-violet-500 hover:text-violet-700 font-medium"
              >
                ← Back to Job Postings
              </button>
            </div>

            <JobPostingWorkflow
              jobPosting={selectedJobPosting}
              onStatusChange={handleStatusChange}
              currentUserId={1}
            />
          </div>
        )}
      </div>
    </PageWrapper>
  );
}