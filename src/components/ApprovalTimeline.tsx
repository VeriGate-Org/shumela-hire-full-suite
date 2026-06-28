'use client';

import React from 'react';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/solid';

export interface ApprovalStep {
  role: string;
  approverName: string;
  status: 'approved' | 'rejected' | 'pending';
  timestamp?: string;
  comment?: string;
}

interface ApprovalTimelineProps {
  steps: ApprovalStep[];
  className?: string;
}

const ApprovalTimeline: React.FC<ApprovalTimelineProps> = ({ steps, className = '' }) => {
  const getStatusIcon = (status: ApprovalStep['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
      case 'rejected':
        return <XCircleIcon className="w-6 h-6 text-red-500" />;
      case 'pending':
        return <ClockIcon className="w-6 h-6 text-gray-400" />;
      default:
        return <ClockIcon className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusColor = (status: ApprovalStep['status']) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-50';
      case 'rejected':
        return 'text-red-600 bg-red-50';
      case 'pending':
        return 'text-gray-500 bg-gray-50';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  };

  const getRoleIcon = (role: string) => {
    const roleIcons: Record<string, string> = {
      'HR_MANAGER': '👥',
      'HIRING_MANAGER': '👔',
      'EXECUTIVE': '👑',
      'ADMIN': '⚙️',
      'RECRUITER': '🔍',
      'INTERVIEWER': '🎤',
      'EMPLOYEE': '👤',
      'APPLICANT': '👤',
    };
    return roleIcons[role] || '👤';
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {steps.map((step, index) => (
        <div key={index} className="relative flex items-start space-x-4">
          {/* Timeline Line */}
          {index < steps.length - 1 && (
            <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200" />
          )}
          
          {/* Role Avatar */}
          <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold ${
            step.status === 'pending' ? 'bg-gray-100 opacity-60' : 'bg-gold-100'
          }`}>
            {getRoleIcon(step.role)}
          </div>

          {/* Content */}
          <div className={`flex-1 min-w-0 ${step.status === 'pending' ? 'opacity-60' : ''}`}>
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="text-sm font-medium text-gray-900">{step.role}</h4>
              {getStatusIcon(step.status)}
            </div>
            
            <p className="text-sm text-gray-600 mb-1">{step.approverName}</p>
            
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(step.status)}`}>
              {step.status.charAt(0).toUpperCase() + step.status.slice(1)}
            </div>

            {step.timestamp && (
              <p className="text-xs text-gray-500 mt-1">{formatTimestamp(step.timestamp)}</p>
            )}

            {step.comment && (
              <div className="mt-2 p-2 bg-gray-50 rounded-control">
                <p className="text-sm text-gray-700">{step.comment}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ApprovalTimeline;