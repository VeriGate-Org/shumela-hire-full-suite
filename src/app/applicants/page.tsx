'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import EmptyState from '@/components/EmptyState';
import ApplicantProfile from '@/components/ApplicantProfile';
import { useTheme } from '@/contexts/ThemeContext';
import { UserGroupIcon } from '@heroicons/react/24/outline';
export default function ApplicantsPage() {
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedApplicantId, setSelectedApplicantId] = useState<number | undefined>();
  const { setCurrentRole } = useTheme();

  // Set theme to recruiter for applicants page
  useEffect(() => {
    setCurrentRole('RECRUITER');
  }, [setCurrentRole]);

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

  const handleSave = (applicant: { id?: number; name: string; surname: string; email: string }) => {
    // Handle successful save - could navigate back to list or show success message
    console.log('Applicant saved:', applicant);
    // For demo purposes, stay on the form
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
      className="px-4 py-2 bg-gold-500 text-white rounded-sm hover:bg-gold-600"
    >
      Create New Applicant
    </button>
  ) : (
    <button
      onClick={handleBackToList}
      className="text-violet-500 hover:text-gold-700 font-medium"
    >
      ← Back to Applicants
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
          <EmptyState
            icon={UserGroupIcon}
            title="No applicants yet"
            description="Create your first applicant profile to start managing candidates."
            action={{
              label: 'Create New Applicant',
              onClick: handleCreateNew,
            }}
          />
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