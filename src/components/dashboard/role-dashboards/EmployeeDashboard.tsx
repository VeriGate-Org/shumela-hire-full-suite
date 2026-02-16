'use client';

import React from 'react';

interface EmployeeDashboardProps {
  selectedTimeframe: string;
  onTimeframeChange: (timeframe: string) => void;
}

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  selectedTimeframe,
  onTimeframeChange,
}) => {
  // Mock data
  const internalJobs = [
    { id: 1, title: 'Senior Software Engineer', department: 'Engineering', location: 'Johannesburg', closingIn: 12 },
    { id: 2, title: 'Product Manager', department: 'Product', location: 'Cape Town', closingIn: 5 },
    { id: 3, title: 'Data Analyst', department: 'Data Science', location: 'Remote', closingIn: 20 },
  ];

  const trainingModules = [
    { id: 1, title: 'Leadership Fundamentals', progress: 75, status: 'in_progress' },
    { id: 2, title: 'Data Privacy & POPIA', progress: 100, status: 'completed' },
    { id: 3, title: 'Project Management Basics', progress: 0, status: 'not_started' },
  ];

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-sm border border-gray-200 p-5">
          <h4 className="text-sm font-medium text-gray-500">Open Internal Positions</h4>
          <p className="text-2xl font-bold text-gold-600 mt-1">{internalJobs.length}</p>
        </div>
        <div className="bg-white rounded-sm border border-gray-200 p-5">
          <h4 className="text-sm font-medium text-gray-500">My Applications</h4>
          <p className="text-2xl font-bold text-purple-600 mt-1">1</p>
        </div>
        <div className="bg-white rounded-sm border border-gray-200 p-5">
          <h4 className="text-sm font-medium text-gray-500">Training Completed</h4>
          <p className="text-2xl font-bold text-green-600 mt-1">{trainingModules.filter(t => t.status === 'completed').length}</p>
        </div>
        <div className="bg-white rounded-sm border border-gray-200 p-5">
          <h4 className="text-sm font-medium text-gray-500">Profile Completeness</h4>
          <p className="text-2xl font-bold text-teal-600 mt-1">85%</p>
        </div>
      </div>

      {/* Internal Job Openings */}
      <div className="bg-white rounded-sm border border-gray-200 border-t-2 border-t-gold-500 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Internal Job Openings</h3>
          <a href="/internal/jobs" className="text-sm font-medium text-gold-600 hover:text-gold-800">
            View All
          </a>
        </div>
        <div className="space-y-3">
          {internalJobs.map((job) => (
            <div key={job.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-sm">
              <div>
                <p className="font-medium text-gray-900">{job.title}</p>
                <p className="text-sm text-gray-500">{job.department} — {job.location}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Closes in {job.closingIn} days</p>
                <a href={`/internal/jobs/${job.id}`} className="text-sm font-medium text-gold-600 hover:text-gold-800">
                  View Details
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Training Modules */}
      <div className="bg-white rounded-sm border border-gray-200 border-t-2 border-t-gold-500 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Training Modules</h3>
          <a href="/training" className="text-sm font-medium text-gold-600 hover:text-gold-800">
            View All
          </a>
        </div>
        <div className="space-y-3">
          {trainingModules.map((module) => (
            <div key={module.id} className="p-4 bg-gray-50 rounded-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-gray-900">{module.title}</p>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  module.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : module.status === 'in_progress'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {module.status === 'completed' ? 'Completed' : module.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${module.status === 'completed' ? 'bg-green-500' : 'bg-gold-500'}`}
                  style={{ width: `${module.progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{module.progress}% complete</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-sm border border-gray-200 border-t-2 border-t-gold-500 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/profile" className="p-4 bg-gold-50 rounded-sm text-center hover:bg-gold-100 transition-colors">
            <p className="font-medium text-violet-900">My Profile</p>
            <p className="text-sm text-gold-600">Update your information</p>
          </a>
          <a href="/internal/jobs" className="p-4 bg-purple-50 rounded-sm text-center hover:bg-purple-100 transition-colors">
            <p className="font-medium text-purple-900">Internal Jobs</p>
            <p className="text-sm text-purple-600">Browse opportunities</p>
          </a>
          <a href="/training" className="p-4 bg-green-50 rounded-sm text-center hover:bg-green-100 transition-colors">
            <p className="font-medium text-green-900">Training</p>
            <p className="text-sm text-green-600">Continue learning</p>
          </a>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
