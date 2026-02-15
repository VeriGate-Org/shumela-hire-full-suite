'use client';

import React from 'react';
import { UserRole, ROLE_DISPLAY_NAMES } from '../../contexts/AuthContext';

interface RoleDashboardProps {
  role: UserRole;
  selectedTimeframe: string;
  onTimeframeChange: (timeframe: string) => void;
}

// Simplified dashboard component that works for all roles
const RoleDashboard: React.FC<RoleDashboardProps> = ({ 
  role, 
  selectedTimeframe, 
  onTimeframeChange 
}) => {
  const getRoleData = () => {
    switch (role) {
      case 'ADMIN':
        return {
          title: 'System Administration',
          description: 'Manage users, system settings, and oversee all recruitment activities.',
          stats: { total: 847, active: 156, pending: 23, completed: 1234 }
        };
      case 'HR_MANAGER':
        return {
          title: 'Human Resources Dashboard',
          description: 'Manage employee lifecycle, policies, and recruitment coordination.',
          stats: { total: 234, active: 67, pending: 12, completed: 456 }
        };
      case 'HIRING_MANAGER':
        return {
          title: 'Hiring Manager Dashboard',
          description: 'Oversee hiring for your team and manage interview processes.',
          stats: { total: 45, active: 12, pending: 5, completed: 28 }
        };
      case 'RECRUITER':
        return {
          title: 'Recruiter Dashboard',
          description: 'Source, screen, and manage candidates throughout the hiring process.',
          stats: { total: 123, active: 34, pending: 8, completed: 67 }
        };
      case 'INTERVIEWER':
        return {
          title: 'Interviewer Dashboard',
          description: 'Conduct interviews, provide feedback, and evaluate candidates.',
          stats: { total: 18, active: 5, pending: 3, completed: 10 }
        };
      case 'EMPLOYEE':
        return {
          title: 'Employee Dashboard',
          description: 'Access internal opportunities, training, and profile management.',
          stats: { total: 12, active: 4, pending: 1, completed: 7 }
        };
      case 'APPLICANT':
        return {
          title: 'Applicant Portal',
          description: 'Track your applications and manage your job search journey.',
          stats: { total: 8, active: 3, pending: 2, completed: 3 }
        };
      case 'EXECUTIVE':
        return {
          title: 'Executive Dashboard',
          description: 'Strategic oversight of organizational hiring and high-level approvals.',
          stats: { total: 156, active: 89, pending: 34, completed: 78 }
        };
      default:
        return {
          title: `${ROLE_DISPLAY_NAMES[role] ?? role} Dashboard`,
          description: 'Role-specific dashboard view.',
          stats: { total: 0, active: 0, pending: 0, completed: 0 }
        };
    }
  };

  const roleData = getRoleData();

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{roleData.title}</h1>
          <p className="text-gray-500 mt-1">{roleData.description}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={selectedTimeframe}
            onChange={(e) => onTimeframeChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{ROLE_DISPLAY_NAMES[role]} Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-violet-50 p-4 rounded-lg">
            <h4 className="font-medium text-violet-900">Total Items</h4>
            <p className="text-2xl font-bold text-violet-600 mt-1">{roleData.stats.total.toLocaleString()}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-900">Active</h4>
            <p className="text-2xl font-bold text-green-600 mt-1">{roleData.stats.active.toLocaleString()}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-medium text-yellow-900">Pending</h4>
            <p className="text-2xl font-bold text-yellow-600 mt-1">{roleData.stats.pending.toLocaleString()}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-medium text-purple-900">Completed</h4>
            <p className="text-2xl font-bold text-purple-600 mt-1">{roleData.stats.completed.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="text-center text-gray-500 py-8 border-t border-gray-200">
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
              <span className="text-2xl">
                {role === 'ADMIN' ? '👑' :
                 role === 'HR_MANAGER' ? '👔' :
                 role === 'HIRING_MANAGER' ? '🎯' :
                 role === 'RECRUITER' ? '🔍' :
                 role === 'INTERVIEWER' ? '🎤' :
                 role === 'EMPLOYEE' ? '👤' :
                 role === 'APPLICANT' ? '👤' :
                 role === 'EXECUTIVE' ? '🏛️' : '📊'}
              </span>
            </div>
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">{ROLE_DISPLAY_NAMES[role]} Features</h4>
          <p className="mb-4">Advanced role-specific dashboard components are being loaded.</p>
          <div className="inline-flex items-center text-sm text-violet-600 bg-violet-50 px-3 py-1 rounded-full">
            <span className="animate-pulse w-2 h-2 bg-violet-500 rounded-full mr-2"></span>
            Dashboard fully operational
          </div>
        </div>
      </div>

      {/* Role-specific Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {role === 'ADMIN' && (
            <>
              <button className="bg-red-600 text-white p-4 rounded-lg hover:bg-red-700 transition-colors text-left">
                <h4 className="font-medium mb-1">User Management</h4>
                <p className="text-sm opacity-90">Manage system users and permissions</p>
              </button>
              <button className="bg-violet-600 text-white p-4 rounded-lg hover:bg-violet-700 transition-colors text-left">
                <h4 className="font-medium mb-1">System Settings</h4>
                <p className="text-sm opacity-90">Configure system parameters</p>
              </button>
              <button className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors text-left">
                <h4 className="font-medium mb-1">Reports & Analytics</h4>
                <p className="text-sm opacity-90">View system-wide reports</p>
              </button>
            </>
          )}
          {role === 'HR_MANAGER' && (
            <>
              <button className="bg-violet-600 text-white p-4 rounded-lg hover:bg-violet-700 transition-colors text-left">
                <h4 className="font-medium mb-1">Employee Records</h4>
                <p className="text-sm opacity-90">Manage employee data</p>
              </button>
              <button className="bg-violet-600 text-white p-4 rounded-lg hover:bg-violet-700 transition-colors text-left">
                <h4 className="font-medium mb-1">Recruitment Overview</h4>
                <p className="text-sm opacity-90">Monitor hiring activities</p>
              </button>
              <button className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors text-left">
                <h4 className="font-medium mb-1">Onboarding</h4>
                <p className="text-sm opacity-90">Manage new hire onboarding</p>
              </button>
            </>
          )}
          {role === 'HIRING_MANAGER' && (
            <>
              <button className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors text-left">
                <h4 className="font-medium mb-1">My Job Postings</h4>
                <p className="text-sm opacity-90">Manage open positions</p>
              </button>
              <button className="bg-violet-600 text-white p-4 rounded-lg hover:bg-violet-700 transition-colors text-left">
                <h4 className="font-medium mb-1">Interview Schedule</h4>
                <p className="text-sm opacity-90">View and manage interviews</p>
              </button>
              <button className="bg-violet-600 text-white p-4 rounded-lg hover:bg-violet-700 transition-colors text-left">
                <h4 className="font-medium mb-1">Candidate Pipeline</h4>
                <p className="text-sm opacity-90">Track candidate progress</p>
              </button>
            </>
          )}
          {role === 'INTERVIEWER' && (
            <>
              <button className="bg-violet-600 text-white p-4 rounded-lg hover:bg-violet-700 transition-colors text-left">
                <h4 className="font-medium mb-1">My Interviews</h4>
                <p className="text-sm opacity-90">View upcoming interview schedule</p>
              </button>
              <button className="bg-violet-600 text-white p-4 rounded-lg hover:bg-violet-700 transition-colors text-left">
                <h4 className="font-medium mb-1">Submit Feedback</h4>
                <p className="text-sm opacity-90">Provide candidate evaluations</p>
              </button>
              <button className="bg-teal-600 text-white p-4 rounded-lg hover:bg-teal-700 transition-colors text-left">
                <h4 className="font-medium mb-1">Internal Jobs</h4>
                <p className="text-sm opacity-90">Browse internal opportunities</p>
              </button>
            </>
          )}
          {role === 'EMPLOYEE' && (
            <>
              <button className="bg-violet-600 text-white p-4 rounded-lg hover:bg-violet-700 transition-colors text-left">
                <h4 className="font-medium mb-1">Internal Jobs</h4>
                <p className="text-sm opacity-90">Browse internal opportunities</p>
              </button>
              <button className="bg-violet-600 text-white p-4 rounded-lg hover:bg-violet-700 transition-colors text-left">
                <h4 className="font-medium mb-1">My Profile</h4>
                <p className="text-sm opacity-90">Update your profile details</p>
              </button>
              <button className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors text-left">
                <h4 className="font-medium mb-1">Training</h4>
                <p className="text-sm opacity-90">View available training modules</p>
              </button>
            </>
          )}
          {(role === 'RECRUITER' || role === 'APPLICANT' || role === 'EXECUTIVE') && (
            <>
              <button className="bg-indigo-600 text-white p-4 rounded-lg hover:bg-indigo-700 transition-colors text-left">
                <h4 className="font-medium mb-1">Primary Action</h4>
                <p className="text-sm opacity-90">Main workflow action</p>
              </button>
              <button className="bg-teal-600 text-white p-4 rounded-lg hover:bg-teal-700 transition-colors text-left">
                <h4 className="font-medium mb-1">Secondary Action</h4>
                <p className="text-sm opacity-90">Supporting workflow</p>
              </button>
              <button className="bg-orange-600 text-white p-4 rounded-lg hover:bg-orange-700 transition-colors text-left">
                <h4 className="font-medium mb-1">Analytics</h4>
                <p className="text-sm opacity-90">View performance metrics</p>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoleDashboard;
