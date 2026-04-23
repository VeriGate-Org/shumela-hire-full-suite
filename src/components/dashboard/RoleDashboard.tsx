'use client';

import React from 'react';
import { UserRole } from '../../contexts/AuthContext';
import AdminDashboard from './role-dashboards/AdminDashboard';
import HRDashboard from './role-dashboards/HRDashboard';
import HiringManagerDashboard from './role-dashboards/HiringManagerDashboard';
import RecruiterDashboard from './role-dashboards/RecruiterDashboard';
import InterviewerDashboard from './role-dashboards/InterviewerDashboard';
import ApplicantDashboard from './role-dashboards/ApplicantDashboard';
import ExecutiveDashboard from './role-dashboards/ExecutiveDashboard';
import PlatformOwnerDashboard from './role-dashboards/PlatformOwnerDashboard';

interface RoleDashboardProps {
  role: UserRole;
  selectedTimeframe: string;
  onTimeframeChange: (timeframe: string) => void;
}

const RoleDashboard: React.FC<RoleDashboardProps> = ({
  role,
  selectedTimeframe,
  onTimeframeChange
}) => {
  const dashboardProps = { selectedTimeframe, onTimeframeChange };

  switch (role) {
    case 'ADMIN':
      return <AdminDashboard {...dashboardProps} />;
    case 'HR_MANAGER':
      return <HRDashboard {...dashboardProps} />;
    case 'HIRING_MANAGER':
      return <HiringManagerDashboard {...dashboardProps} />;
    case 'RECRUITER':
      return <RecruiterDashboard {...dashboardProps} />;
    case 'INTERVIEWER':
      return <InterviewerDashboard {...dashboardProps} />;
    case 'EMPLOYEE':
      return null; // Employees are redirected to /employee/portal
    case 'APPLICANT':
      return <ApplicantDashboard {...dashboardProps} />;
    case 'EXECUTIVE':
      return <ExecutiveDashboard {...dashboardProps} />;
    case 'PLATFORM_OWNER':
      return <PlatformOwnerDashboard {...dashboardProps} />;
    default:
      return null;
  }
};

export default RoleDashboard;
