'use client';

import React from 'react';
import RecruiterDashboard, { RecruiterDashboardFilters } from '@/components/RecruiterDashboard';
import PageWrapper from '@/components/PageWrapper';
import IdentityBand from '@/components/record/IdentityBand';
import { useAuth } from '@/contexts/AuthContext';

export default function RecruiterDashboardPage() {
  const { user } = useAuth();

  const hasAccess = user && (
    user.role === 'ADMIN' ||
    user.role === 'RECRUITER' ||
    user.role === 'HR_MANAGER' ||
    user.permissions?.includes('view_recruiter_analytics')
  );

  if (!hasAccess) {
    return (
      <PageWrapper>
        <IdentityBand eyebrow="Your desk" title="Access denied" subtitle="You do not have permission to view this dashboard." />
        <div className="flex items-center justify-center py-16">
          <div className="enterprise-card p-8 max-w-md w-full text-center">
            <h2 className="text-xl font-bold text-foreground mb-4">Insufficient Permissions</h2>
            <p className="text-muted-foreground mb-6">
              You need recruiter or HR permissions to access this dashboard.
            </p>
            <a
              href="/dashboard"
              className="btn-cta inline-flex items-center gap-2"
            >
              Go to Main Dashboard
            </a>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <IdentityBand
        eyebrow="Your desk"
        title="Recruiter Dashboard"
        subtitle="Whole-set recruiting figures, composed from the same summaries the linked pages use"
        actions={<RecruiterDashboardFilters />}
      />
      <RecruiterDashboard />
    </PageWrapper>
  );
}
