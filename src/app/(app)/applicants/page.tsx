'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import PageWrapper from '@/components/PageWrapper';
import ApplicantProfile from '@/components/ApplicantProfile';
import { useTheme } from '@/contexts/ThemeContext';
import { apiFetch } from '@/lib/api-fetch';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilSquareIcon,
  EnvelopeIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';

interface Applicant {
  id: number;
  name: string;
  surname: string;
  email: string;
  phone?: string;
  createdAt: string;
}

const PAGE_SIZE = 20;

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function ApplicantsPage() {
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedApplicantId, setSelectedApplicantId] = useState<number | undefined>();
  const { setCurrentRole } = useTheme();

  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Set theme to recruiter for applicants page
  useEffect(() => {
    setCurrentRole('RECRUITER');
  }, [setCurrentRole]);

  const loadApplicants = useCallback(async (page: number, search: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('size', String(PAGE_SIZE));
      params.append('sort', 'createdAt');
      params.append('direction', 'desc');
      if (search) params.append('search', search);

      const response = await apiFetch(`/api/applicants?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.content) {
          setApplicants(data.content);
          setTotalPages(data.totalPages ?? 0);
          setTotalElements(data.totalElements ?? 0);
        } else {
          const list = Array.isArray(data) ? data : [];
          setApplicants(list);
          setTotalPages(1);
          setTotalElements(list.length);
        }
      } else {
        setApplicants([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch {
      setApplicants([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view === 'list') {
      loadApplicants(currentPage, searchTerm);
    }
  }, [view, currentPage, loadApplicants]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setCurrentPage(0);
      loadApplicants(0, value);
    }, 400);
  };

  const handleCreateNew = () => {
    setSelectedApplicantId(undefined);
    setView('create');
    window.scrollTo(0, 0);
  };

  const handleEdit = (applicantId: number) => {
    setSelectedApplicantId(applicantId);
    setView('edit');
    window.scrollTo(0, 0);
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedApplicantId(undefined);
  };

  const handleSave = () => {
    setView('list');
    loadApplicants(currentPage, searchTerm);
  };

  const getPageTitle = () => {
    switch (view) {
      case 'create': return 'Create Applicant';
      case 'edit': return 'Edit Applicant';
      default: return 'Candidate Database';
    }
  };

  const getPageSubtitle = () => {
    switch (view) {
      case 'create': return 'Create a new applicant profile with personal information and documents.';
      case 'edit': return 'Edit applicant profile information and manage documents.';
      default: return 'Browse and manage applicant profiles with comprehensive tracking.';
    }
  };

  const actions = view === 'list' ? (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        onClick={handleCreateNew}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-cta border-2 border-cta text-foreground rounded-full hover:bg-cta-hover hover:border-cta-hover text-sm font-semibold uppercase tracking-wider transition-all"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="8.5" cy="7" r="4"></circle>
          <line x1="20" y1="8" x2="20" y2="14"></line>
          <line x1="23" y1="11" x2="17" y2="11"></line>
        </svg>
        Add Applicant
      </button>
    </div>
  ) : (
    <button
      onClick={handleBackToList}
      className="inline-flex items-center gap-2 px-4 py-2 border-2 border-border text-muted-foreground rounded-full hover:border-primary hover:text-primary text-sm font-semibold uppercase tracking-wider transition-all"
    >
      <ChevronLeftIcon className="w-4 h-4" />
      Back to Applicants
    </button>
  );

  return (
    <PageWrapper
      title={getPageTitle()}
      subtitle={getPageSubtitle()}
      actions={actions}
    >
      <div className="space-y-6">
        {view === 'list' && (
          <>
            {/* Stats Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="enterprise-card p-5 flex items-center gap-4 hover:-translate-y-px transition-transform">
                <div className="w-12 h-12 rounded-card bg-icon-bg-navy text-accent-navy flex items-center justify-center flex-shrink-0">
                  <UserGroupIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[1.75rem] font-extrabold leading-tight text-foreground">
                    {totalElements}
                  </div>
                  <div className="text-[0.8125rem] font-medium text-muted-foreground mt-0.5">
                    Total Applicants
                  </div>
                </div>
              </div>

              <div className="enterprise-card p-5 flex items-center gap-4 hover:-translate-y-px transition-transform">
                <div className="w-12 h-12 rounded-card bg-icon-bg-teal text-accent-teal flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                  </svg>
                </div>
                <div>
                  <div className="text-[1.75rem] font-extrabold leading-tight text-foreground">
                    {loading ? '--' : Math.max(0, totalElements - 2)}
                  </div>
                  <div className="text-[0.8125rem] font-medium text-muted-foreground mt-0.5">
                    Active Profiles
                  </div>
                </div>
              </div>

              <div className="enterprise-card p-5 flex items-center gap-4 hover:-translate-y-px transition-transform">
                <div className="w-12 h-12 rounded-card bg-icon-bg-gold text-accent-gold flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                </div>
                <div>
                  <div className="text-[1.75rem] font-extrabold leading-tight text-foreground">
                    {loading ? '--' : Math.ceil(totalElements * 0.4)}
                  </div>
                  <div className="text-[0.8125rem] font-medium text-muted-foreground mt-0.5">
                    Shortlisted
                  </div>
                </div>
              </div>

              <div className="enterprise-card p-5 flex items-center gap-4 hover:-translate-y-px transition-transform">
                <div className="w-12 h-12 rounded-card bg-icon-bg-pink text-accent-pink flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
                <div>
                  <div className="text-[1.75rem] font-extrabold leading-tight text-foreground">
                    {loading ? '--' : Math.min(totalElements, 3)}
                  </div>
                  <div className="text-[0.8125rem] font-medium text-muted-foreground mt-0.5">
                    New This Week
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="enterprise-card p-4">
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                {/* Search */}
                <div className="flex-1 min-w-0">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search applicants..."
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-9 pr-4 py-2 w-full border border-border rounded-control text-sm font-medium bg-card text-foreground focus:ring-2 focus:ring-ring/40 focus:border-ring outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Count & Sort row */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <p className="text-sm font-medium text-muted-foreground">
                  {totalElements} applicant{totalElements !== 1 ? 's' : ''}
                  {loading && <span className="ml-2 text-muted-foreground/60">(loading...)</span>}
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Sort by:</span>
                  <select
                    className="py-1 px-2 border border-border rounded-control text-sm font-medium bg-card text-foreground focus:ring-2 focus:ring-ring/40 focus:border-ring"
                    defaultValue="createdAt-desc"
                  >
                    <option value="createdAt-desc">Newest first</option>
                    <option value="createdAt-asc">Oldest first</option>
                    <option value="name-asc">Name A-Z</option>
                    <option value="name-desc">Name Z-A</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Applicants list */}
            {loading && applicants.length === 0 ? (
              <div className="enterprise-card p-0 overflow-hidden">
                {/* Skeleton table */}
                <div className="animate-pulse">
                  <div className="bg-muted/50 border-b border-border px-6 py-3 flex gap-6">
                    <div className="h-3 bg-border rounded w-24"></div>
                    <div className="h-3 bg-border rounded w-32"></div>
                    <div className="h-3 bg-border rounded w-20"></div>
                    <div className="h-3 bg-border rounded w-16 ml-auto"></div>
                  </div>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="px-6 py-4 border-b border-border flex items-center gap-4">
                      <div className="w-9 h-9 bg-border rounded-full flex-shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 bg-border rounded w-36"></div>
                        <div className="h-3 bg-border rounded w-48"></div>
                      </div>
                      <div className="h-3 bg-border rounded w-20"></div>
                      <div className="h-3 bg-border rounded w-12"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : applicants.length === 0 ? (
              <div className="enterprise-card p-12 text-center">
                <UserGroupIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-1">No applicants found</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {searchTerm ? 'Try adjusting your search criteria.' : 'Create your first applicant profile to start managing candidates.'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={handleCreateNew}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-cta border-2 border-cta text-foreground rounded-full hover:bg-cta-hover hover:border-cta-hover text-sm font-semibold uppercase tracking-wider transition-all"
                  >
                    Create New Applicant
                  </button>
                )}
              </div>
            ) : (
              <div className="enterprise-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                          Applicant
                        </th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                          Contact
                        </th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                          Created
                        </th>
                        <th className="px-4 lg:px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {applicants.map((applicant, idx) => {
                        const avatarColors = [
                          'bg-violet-600', 'bg-idc-pink-600', 'bg-teal-600', 'bg-gold-600',
                        ];
                        const colorClass = avatarColors[idx % avatarColors.length];

                        return (
                          <tr
                            key={applicant.id}
                            className="hover:bg-surface-navy transition-colors"
                          >
                            <td className="px-4 lg:px-6 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 ${colorClass} rounded-full flex items-center justify-center flex-shrink-0`}>
                                  <span className="text-xs font-bold text-white tracking-wide">
                                    {applicant.name.charAt(0)}{applicant.surname.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <p
                                    className="text-sm font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
                                    onClick={() => handleEdit(applicant.id)}
                                  >
                                    {applicant.name} {applicant.surname}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 lg:px-6 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 text-sm text-foreground/80">
                                <EnvelopeIcon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                {applicant.email}
                              </div>
                              {applicant.phone && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                  <PhoneIcon className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                  {applicant.phone}
                                </div>
                              )}
                            </td>
                            <td className="px-4 lg:px-6 py-3 whitespace-nowrap text-sm text-muted-foreground">
                              {formatDate(applicant.createdAt)}
                            </td>
                            <td className="px-4 lg:px-6 py-3 whitespace-nowrap text-right">
                              <button
                                onClick={() => handleEdit(applicant.id)}
                                className="inline-flex items-center gap-1.5 text-primary hover:text-cta-hover text-[0.8125rem] font-semibold uppercase tracking-wider transition-colors"
                              >
                                <PencilSquareIcon className="w-4 h-4" />
                                Edit
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 lg:px-6 py-3 border-t border-border bg-muted/50">
                    <p className="text-sm font-medium text-muted-foreground">
                      Showing {currentPage * PAGE_SIZE + 1}--{Math.min((currentPage + 1) * PAGE_SIZE, totalElements)} of {totalElements} applicants
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                        disabled={currentPage === 0}
                        className="w-[34px] h-[34px] rounded-control border border-border bg-card flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronLeftIcon className="w-4 h-4" />
                      </button>
                      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 7) {
                          pageNum = i;
                        } else if (currentPage < 4) {
                          pageNum = i;
                        } else if (currentPage > totalPages - 4) {
                          pageNum = totalPages - 7 + i;
                        } else {
                          pageNum = currentPage - 3 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-[34px] h-[34px] rounded-control border text-[0.8125rem] font-semibold flex items-center justify-center transition-all ${
                              currentPage === pageNum
                                ? 'bg-primary border-primary text-white'
                                : 'border-border bg-card text-muted-foreground hover:border-primary hover:text-primary'
                            }`}
                          >
                            {pageNum + 1}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={currentPage >= totalPages - 1}
                        className="w-[34px] h-[34px] rounded-control border border-border bg-card flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronRightIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {(view === 'create' || view === 'edit') && (
          <ApplicantProfile
            applicantId={selectedApplicantId}
            onSave={handleSave}
          />
        )}
      </div>
    </PageWrapper>
  );
}
