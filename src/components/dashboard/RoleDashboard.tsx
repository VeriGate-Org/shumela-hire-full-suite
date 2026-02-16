'use client';

import React from 'react';
import { UserRole } from '../../contexts/AuthContext';
import AdminDashboard from './role-dashboards/AdminDashboard';
import HRDashboard from './role-dashboards/HRDashboard';
import HiringManagerDashboard from './role-dashboards/HiringManagerDashboard';
import RecruiterDashboard from './role-dashboards/RecruiterDashboard';
import InterviewerDashboard from './role-dashboards/InterviewerDashboard';
import EmployeeDashboard from './role-dashboards/EmployeeDashboard';
import ApplicantDashboard from './role-dashboards/ApplicantDashboard';
import ExecutiveDashboard from './role-dashboards/ExecutiveDashboard';

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
      return <EmployeeDashboard {...dashboardProps} />;
    case 'APPLICANT':
      return <ApplicantDashboard {...dashboardProps} />;
    case 'EXECUTIVE':
      return <ExecutiveDashboard {...dashboardProps} />;
    default:
      return <EmployeeDashboard {...dashboardProps} />;
  }
};

export default RoleDashboard;
