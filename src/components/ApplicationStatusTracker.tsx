'use client';

import React, { useState } from 'react';

interface ApplicationStatusTrackerProps {
  application: {
    id: number;
    jobTitle: string;
    department?: string;
    status: string;
    statusDisplayName: string;
    statusCssClass: string;
    submittedAt: string;
    withdrawnAt?: string;
    withdrawalReason?: string;
    rating?: number;
    canBeWithdrawn: boolean;
    daysFromSubmission: number;
  };
  onWithdraw?: (applicationId: number, reason: string) => void;
  showWithdrawOption?: boolean;
}

export default function ApplicationStatusTracker({ 
  application, 
  onWithdraw, 
  showWithdrawOption = true 
}: ApplicationStatusTrackerProps) {
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [withdrawalReason, setWithdrawalReason] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  const statusSteps = [
    { key: 'SUBMITTED', label: 'Submitted', description: 'Application received' },
    { key: 'SCREENING', label: 'Screening', description: 'Under review' },
    { key: 'INTERVIEW_SCHEDULED', label: 'Interview', description: 'Interview scheduled' },
    { key: 'INTERVIEW_COMPLETED', label: 'Interview', description: 'Interview completed' },
    { key: 'REFERENCE_CHECK', label: 'References', description: 'Checking references' },
    { key: 'OFFER_PENDING', label: 'Offer', description: 'Preparing offer' },
    { key: 'OFFERED', label: 'Offered', description: 'Offer extended' },
    { key: 'OFFER_ACCEPTED', label: 'Accepted', description: 'Offer accepted' },
    { key: 'HIRED', label: 'Hired', description: 'Successfully hired' }
  ];

  const getCurrentStepIndex = () => {
    return statusSteps.findIndex(step => step.key === application.status);
  };

  const isStepCompleted = (stepIndex: number) => {
    const currentIndex = getCurrentStepIndex();
    return stepIndex <= currentIndex && !isTerminalStatus();
  };

  const isStepCurrent = (stepIndex: number) => {
    return stepIndex === getCurrentStepIndex() && !isTerminalStatus();
  };

  const isTerminalStatus = () => {
    return ['WITHDRAWN', 'REJECTED', 'OFFER_DECLINED', 'HIRED'].includes(application.status);
  };

  const getTerminalStatusInfo = () => {
    switch (application.status) {
      case 'WITHDRAWN':
        return {
          icon: '🚫',
          title: 'Application Withdrawn',
          description: application.withdrawalReason || 'Application was withdrawn',
          color: 'text-red-600',
          bgColor: 'bg-red-50'
        };
      case 'REJECTED':
        return {
          icon: '❌',
          title: 'Application Not Successful',
          description: 'Unfortunately, your application was not successful for this position',
          color: 'text-red-600',
          bgColor: 'bg-red-50'
        };
      case 'OFFER_DECLINED':
        return {
          icon: '📝',
          title: 'Offer Declined',
          description: 'Job offer was declined',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50'
        };
      case 'HIRED':
        return {
          icon: '🎉',
          title: 'Congratulations!',
          description: 'You have been successfully hired for this position',
          color: 'text-green-600',
          bgColor: 'bg-green-50'
        };
      default:
        return null;
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawalReason.trim()) {
      alert('Please provide a reason for withdrawal');
      return;
    }

    setWithdrawing(true);
    try {
      if (onWithdraw) {
        await onWithdraw(application.id, withdrawalReason);
        setShowWithdrawForm(false);
        setWithdrawalReason('');
      }
    } catch (error) {
      console.error('Error withdrawing application:', error);
    } finally {
      setWithdrawing(false);
    }
  };

  const renderRating = () => {
    if (!application.rating) return null;
    
    return (
      <div className="flex items-center space-x-1 mt-2">
        <span className="text-sm font-medium text-gray-700">Rating:</span>
        {[1, 2, 3, 4, 5].map(star => (
          <span 
            key={star} 
            className={`text-lg ${star <= application.rating! ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            ⭐
          </span>
        ))}
        <span className="text-sm text-gray-600">({application.rating}/5)</span>
      </div>
    );
  };

  const terminalInfo = getTerminalStatusInfo();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{application.jobTitle}</h3>
            {application.department && (
              <p className="text-gray-600">{application.department}</p>
            )}
          </div>
          <div className="text-right">
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${application.statusCssClass}`}>
              {application.statusDisplayName}
            </span>
            <p className="text-sm text-gray-500 mt-1">
              Submitted {application.daysFromSubmission} days ago
            </p>
          </div>
        </div>
      </div>

      {/* Terminal Status Display */}
      {terminalInfo && (
        <div className={`${terminalInfo.bgColor} border rounded-lg p-4 mb-6`}>
          <div className="flex items-center">
            <span className="text-2xl mr-3">{terminalInfo.icon}</span>
            <div>
              <h4 className={`font-medium ${terminalInfo.color}`}>{terminalInfo.title}</h4>
              <p className="text-gray-700 text-sm">{terminalInfo.description}</p>
            </div>
          </div>
          {application.withdrawnAt && (
            <p className="text-xs text-gray-500 mt-2">
              Withdrawn on {new Date(application.withdrawnAt).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {/* Status Progress - Only show for active applications */}
      {!isTerminalStatus() && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-4">Application Progress</h4>
          <div className="space-y-4">
            {statusSteps.map((step, index) => (
              <div key={step.key} className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isStepCompleted(index) ? 'bg-green-500 text-white' :
                    isStepCurrent(index) ? 'bg-violet-500 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {isStepCompleted(index) ? '✓' : index + 1}
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-medium ${
                      isStepCompleted(index) || isStepCurrent(index) ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {step.label}
                    </p>
                    {isStepCurrent(index) && (
                      <span className="text-xs bg-violet-100 text-violet-800 px-2 py-1 rounded">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rating Display */}
      {renderRating()}

      {/* Withdrawal Section */}
      {showWithdrawOption && application.canBeWithdrawn && !showWithdrawForm && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={() => setShowWithdrawForm(true)}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Withdraw Application
          </button>
        </div>
      )}

      {/* Withdrawal Form */}
      {showWithdrawForm && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Withdraw Application</h4>
          <div className="space-y-3">
            <div>
              <label htmlFor="withdrawal-reason" className="block text-sm font-medium text-gray-700 mb-1">
                Reason for withdrawal *
              </label>
              <textarea
                id="withdrawal-reason"
                value={withdrawalReason}
                onChange={(e) => setWithdrawalReason(e.target.value)}
                placeholder="Please provide a reason for withdrawing your application..."
                rows={3}
                aria-required="true"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowWithdrawForm(false);
                  setWithdrawalReason('');
                }}
                className="px-3 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                disabled={withdrawing || !withdrawalReason.trim()}
                className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {withdrawing ? 'Withdrawing...' : 'Confirm Withdrawal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Application Timeline Info */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="font-medium text-gray-900 mb-2">Timeline</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• Submitted: {new Date(application.submittedAt).toLocaleDateString()}</p>
          <p>• Days since submission: {application.daysFromSubmission}</p>
          {application.withdrawnAt && (
            <p>• Withdrawn: {new Date(application.withdrawnAt).toLocaleDateString()}</p>
          )}
        </div>
      </div>
    </div>
  );
}