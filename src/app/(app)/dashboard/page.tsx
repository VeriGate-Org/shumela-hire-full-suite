'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageWrapper from '@/components/PageWrapper';
import RoleDashboard from '@/components/dashboard/RoleDashboard';
import { useAuth, ROLE_DISPLAY_NAMES } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';

export default function DashboardPage() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30days');
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Redirect employees to their dedicated portal
  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role === 'EMPLOYEE') {
      router.replace('/employee/portal');
    }
  }, [isLoading, isAuthenticated, user?.role, router]);

  // Show nothing while auth is loading or redirecting
  if (isLoading || !isAuthenticated || user?.role === 'EMPLOYEE') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500" />
      </div>
    );
  }

  const userRole = user?.role || 'HIRING_MANAGER';

  const handleExportData = () => {
    toast('Exporting dashboard data...', 'info');
    // Generate a basic CSV of visible dashboard summary
    const csvContent = '\ufeff' + [
      'Metric,Value',
      `Role,${userRole}`,
      `Timeframe,${selectedTimeframe}`,
      `Export Date,${new Date().toISOString()}`,
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Dashboard data exported', 'success');
  };

  const actions = (
    <div className="flex items-center space-x-3">
      <button
        onClick={handleExportData}
        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500/60"
      >
        Export Data
      </button>
      <button
        onClick={() => router.push('/job-postings?action=create')}
        className="inline-flex items-center px-4 py-2 border-2 border-gold-500 text-sm font-medium rounded-full shadow-sm bg-transparent text-gold-500 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500/60"
      >
        Create Position
      </button>
    </div>
  );

  const dashboardContent = (
    <RoleDashboard
      role={userRole}
      selectedTimeframe={selectedTimeframe}
      onTimeframeChange={setSelectedTimeframe}
    />
  );

  const displayName = ROLE_DISPLAY_NAMES[userRole];

  return (
    <PageWrapper
      title={`${displayName} Dashboard`}
      subtitle={`Welcome back. Here is your ${displayName.toLowerCase()} overview for the selected timeframe.`}
      actions={actions}
    >
      {dashboardContent}
    </PageWrapper>
  );
}
