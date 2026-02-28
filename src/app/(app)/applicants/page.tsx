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
  };

  const handleEdit = (applicantId: number) => {
    setSelectedApplicantId(applicantId);
    setView('edit');
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
      default: return 'Applicants';
    }
  };

  const getPageSubtitle = () => {
    switch (view) {
      case 'create': return 'Create a new applicant profile with personal information and documents.';
      case 'edit': return 'Edit applicant profile information and manage documents.';
      default: return 'Manage candidate profiles and applications with comprehensive tracking.';
    }
  };

  const actions = view === 'list' ? (
    <button
      onClick={handleCreateNew}
      className="px-4 py-2 bg-gold-500 text-white rounded-full hover:bg-gold-600 text-sm font-medium uppercase tracking-wider"
    >
      Create New Applicant
    </button>
  ) : (
    <button
      onClick={handleBackToList}
      className="text-violet-500 hover:text-gold-700 font-medium"
    >
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
            {/* Search */}
            <div className="bg-white rounded-[10px] border border-gray-200 p-5">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
                />
              </div>
              <p className="text-sm text-gray-500 mt-3">
                {totalElements} applicant{totalElements !== 1 ? 's' : ''}
                {loading && <span className="ml-2 text-gray-400">(loading...)</span>}
              </p>
            </div>

            {/* Applicants list */}
            {loading && applicants.length === 0 ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold-500"></div>
              </div>
            ) : applicants.length === 0 ? (
              <div className="bg-white rounded-[10px] border border-gray-200 p-12 text-center">
                <UserGroupIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No applicants found</h3>
                <p className="text-sm text-gray-500 mb-6">
                  {searchTerm ? 'Try adjusting your search criteria.' : 'Create your first applicant profile to start managing candidates.'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={handleCreateNew}
                    className="px-4 py-2 bg-gold-500 text-white rounded-full hover:bg-gold-600 text-sm font-medium"
                  >
                    Create New Applicant
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-[10px] border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {applicants.map((applicant) => (
                        <tr key={applicant.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-9 h-9 bg-gold-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-medium text-gold-700">
                                  {applicant.name.charAt(0)}{applicant.surname.charAt(0)}
                                </span>
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">{applicant.name} {applicant.surname}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <EnvelopeIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              {applicant.email}
                            </div>
                            {applicant.phone && (
                              <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                                <PhoneIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                {applicant.phone}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(applicant.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button
                              onClick={() => handleEdit(applicant.id)}
                              className="inline-flex items-center gap-1 text-gold-600 hover:text-gold-800 text-sm font-medium"
                            >
                              <PencilSquareIcon className="w-4 h-4" />
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50">
                    <p className="text-sm text-gray-500">
                      Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, totalElements)} of {totalElements}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                        disabled={currentPage === 0}
                        className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronLeftIcon className="w-5 h-5" />
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
                            className={`w-8 h-8 rounded-full text-sm font-medium ${
                              currentPage === pageNum
                                ? 'bg-gold-500 text-violet-950'
                                : 'text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {pageNum + 1}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={currentPage >= totalPages - 1}
                        className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronRightIcon className="w-5 h-5" />
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
