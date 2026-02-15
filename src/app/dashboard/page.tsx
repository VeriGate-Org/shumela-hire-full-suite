'use client';

import React, { useState } from 'react';
import PageWrapper from '../../components/PageWrapper';
import RoleDashboard from '../../components/dashboard/RoleDashboard';
import { useAuth, ROLE_DISPLAY_NAMES } from '../../contexts/AuthContext';

export default function DashboardPage() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30days');
  const { user } = useAuth();

  // Default to Hiring Manager if no user role is available
  const userRole = user?.role || 'HIRING_MANAGER';

  const actions = (
    <div className="flex items-center space-x-3">
      <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500/60">
        Export Data
      </button>
      <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500/60">
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