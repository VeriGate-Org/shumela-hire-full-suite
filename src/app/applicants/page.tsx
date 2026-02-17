'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import ApplicantProfile from '@/components/ApplicantProfile';
import { useTheme } from '@/contexts/ThemeContext';
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
          <div>
            <div className="bg-white rounded-sm shadow p-6">
              <p className="text-gray-600 mb-4">
                This is a demo of the Applicant Profile & Document Upload feature.
              </p>
              
              <div className="space-y-4">
                <div className="border rounded-sm p-4">
                  <h3 className="font-medium text-lg mb-2">Feature Overview</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>Create and edit applicant profiles with personal information</li>
                    <li>Manage education history with multiple entries</li>
                    <li>Track work experience and skills</li>
                    <li>Upload and manage CV and supporting documents</li>
                    <li>File validation (10MB limit, PDF/Word only)</li>
                    <li>Document preview and deletion functionality</li>
                    <li>Form validation and error handling</li>
                    <li>Audit logging for all actions</li>
                  </ul>
                </div>
                
                <div className="border rounded-sm p-4">
                  <h3 className="font-medium text-lg mb-2">Demo Actions</h3>
                  <div className="space-y-2">
                    <button
                      onClick={handleCreateNew}
                      className="block w-full text-left px-3 py-2 bg-gold-50 text-violet-700 rounded border hover:bg-gold-100"
                    >
                      Create New Applicant Profile
                    </button>
                    <button
                      onClick={() => handleEdit(1)}
                      className="block w-full text-left px-3 py-2 bg-green-50 text-green-700 rounded border hover:bg-green-100"
                    >
                      Edit Sample Applicant (Demo)
                    </button>
                  </div>
                </div>
                
                <div className="border rounded-sm p-4 bg-yellow-50">
                  <h3 className="font-medium text-lg mb-2 text-yellow-800">Implementation Notes</h3>
                  <ul className="list-disc list-inside space-y-1 text-yellow-700 text-sm">
                    <li>Backend API endpoints: POST/PUT /api/applicants, POST /api/applicants/{"{id}"}/documents</li>
                    <li>File storage service handles document uploads with unique filenames</li>
                    <li>Audit logging service tracks all profile and document actions</li>
                    <li>Form validation on both client and server side</li>
                    <li>POPIA compliance - PII handling with proper validation</li>
                    <li>Role-based access control integration ready</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
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