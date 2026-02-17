'use client';

import React from 'react';
import RecruiterDashboard, { RecruiterDashboardFilters } from '@/components/RecruiterDashboard';
import PageWrapper from '@/components/PageWrapper';
import { useAuth } from '@/contexts/AuthContext';

export default function RecruiterDashboardPage() {
  const { user } = useAuth();

  const hasAccess = user && (user.role === 'RECRUITER' || user.role === 'HIRING_MANAGER' || user.role === 'HR_MANAGER');

  if (!hasAccess) {
    return (
      <PageWrapper title="Access Denied">
        <div className="flex items-center justify-center py-16">
          <div className="bg-white p-8 rounded-sm shadow border border-gray-200 max-w-md w-full text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Insufficient Permissions</h2>
            <p className="text-gray-600 mb-6">
              You need recruiter, hiring manager, or HR permissions to access this dashboard.
            </p>
            <a
              href="/dashboard"
              className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-full bg-[#05527E] text-white hover:bg-[#044668]"
            >
              Go to Main Dashboard
            </a>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Recruiter Dashboard"
      subtitle="Analytics and insights for recruitment performance"
      actions={<RecruiterDashboardFilters />}
    >
      <RecruiterDashboard />
    </PageWrapper>
  );
}
