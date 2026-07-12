'use client';

import React, { useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/components/Toast';

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
  const { toast } = useToast();
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [withdrawalReason, setWithdrawalReason] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  const statusSteps = [
    { key: 'SUBMITTED', label: 'Applied', description: 'Application received' },
    { key: 'SCREENING', label: 'Screening', description: 'Under initial review' },
    { key: 'INTERVIEW_SCHEDULED', label: 'Interview', description: 'Interview scheduled' },
    { key: 'INTERVIEW_COMPLETED', label: 'Reviewed', description: 'Interview completed' },
    { key: 'REFERENCE_CHECK', label: 'References', description: 'Checking references' },
    { key: 'OFFER_PENDING', label: 'Preparing', description: 'Preparing offer' },
    { key: 'OFFERED', label: 'Offered', description: 'Offer extended' },
    { key: 'OFFER_ACCEPTED', label: 'Accepted', description: 'Offer accepted' },
    { key: 'HIRED', label: 'Hired', description: 'Successfully hired' }
  ];

  const currentIndex = statusSteps.findIndex(step => step.key === application.status);

  const isTerminalStatus = ['WITHDRAWN', 'REJECTED', 'OFFER_DECLINED', 'HIRED'].includes(application.status);

  const getTerminalStatusInfo = () => {
    switch (application.status) {
      case 'WITHDRAWN':
        return {
          title: 'Application Withdrawn',
          description: application.withdrawalReason || 'Application was withdrawn',
          bgColor: 'bg-red-500/10 dark:bg-red-500/15',
          borderColor: 'border-red-500/20',
          textColor: 'text-red-600 dark:text-red-400',
          dot: 'bg-red-500',
        };
      case 'REJECTED':
        return {
          title: 'Application Not Successful',
          description: 'This application was not successful for this position',
          bgColor: 'bg-red-500/10 dark:bg-red-500/15',
          borderColor: 'border-red-500/20',
          textColor: 'text-red-600 dark:text-red-400',
          dot: 'bg-red-500',
        };
      case 'OFFER_DECLINED':
        return {
          title: 'Offer Declined',
          description: 'The job offer was declined',
          bgColor: 'bg-orange-500/10 dark:bg-orange-500/15',
          borderColor: 'border-orange-500/20',
          textColor: 'text-orange-600 dark:text-orange-400',
          dot: 'bg-orange-500',
        };
      case 'HIRED':
        return {
          title: 'Hired',
          description: 'Successfully hired for this position',
          bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/15',
          borderColor: 'border-emerald-500/20',
          textColor: 'text-emerald-600 dark:text-emerald-400',
          dot: 'bg-emerald-500',
        };
      default:
        return null;
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawalReason.trim()) {
      toast('Please provide a reason for withdrawal', 'info');
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

  const terminalInfo = getTerminalStatusInfo();

  return (
    <div className="space-y-4">
      {/* Horizontal Progress Stepper */}
      {!isTerminalStatus && currentIndex >= 0 && (
        <div className="bg-muted/30 rounded-card p-4">
          <div className="flex items-center overflow-x-auto pb-1">
            {statusSteps.map((step, index) => {
              const isCompleted = index < currentIndex;
              const isCurrent = index === currentIndex;
              return (
                <React.Fragment key={step.key}>
                  <div className="flex flex-col items-center shrink-0 gap-1.5">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                        isCompleted
                          ? 'bg-emerald-500 text-white'
                          : isCurrent
                            ? 'bg-cta text-deep-navy shadow-[0_0_0_3px_rgba(241,197,75,0.25)]'
                            : 'border-2 border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckIcon className="w-3.5 h-3.5" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span
                      className={`text-[10px] leading-tight text-center whitespace-nowrap ${
                        isCompleted
                          ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                          : isCurrent
                            ? 'text-foreground font-semibold'
                            : 'text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < statusSteps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-1 min-w-[12px] rounded-full self-start mt-[14px] ${
                        index < currentIndex
                          ? 'bg-emerald-500'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
            <span className="font-medium text-foreground">{statusSteps[currentIndex]?.label}</span>
            {' — '}
            {statusSteps[currentIndex]?.description}
          </p>
        </div>
      )}

      {/* Terminal Status Card */}
      {terminalInfo && (
        <div className={`${terminalInfo.bgColor} border ${terminalInfo.borderColor} rounded-card p-4`}>
          <div className="flex items-start gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${terminalInfo.dot} mt-1 shrink-0`} />
            <div>
              <h4 className={`text-sm font-semibold ${terminalInfo.textColor}`}>
                {terminalInfo.title}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {terminalInfo.description}
              </p>
              {application.withdrawnAt && (
                <p className="text-[10px] text-muted-foreground/70 mt-1.5">
                  Withdrawn on {new Date(application.withdrawnAt).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rating */}
      {application.rating && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-[0.05em]">Rating</span>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(star => (
              <svg
                key={star}
                className={`w-4 h-4 ${star <= application.rating! ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 dark:text-gray-600'}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">({application.rating}/5)</span>
        </div>
      )}

      {/* Withdraw Option */}
      {showWithdrawOption && application.canBeWithdrawn && !showWithdrawForm && (
        <div className="pt-3 border-t border-border">
          <button
            onClick={() => setShowWithdrawForm(true)}
            className="text-xs font-medium text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
          >
            Withdraw Application
          </button>
        </div>
      )}

      {/* Withdrawal Form */}
      {showWithdrawForm && (
        <div className="pt-3 border-t border-border space-y-3">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-[0.05em]">
            Withdraw Application
          </h4>
          <div>
            <label htmlFor="withdrawal-reason" className="block text-xs text-muted-foreground mb-1">
              Reason for withdrawal *
            </label>
            <textarea
              id="withdrawal-reason"
              value={withdrawalReason}
              onChange={(e) => setWithdrawalReason(e.target.value)}
              placeholder="Please provide a reason..."
              rows={3}
              aria-required="true"
              className="w-full px-3 py-2 text-sm border border-border rounded-control bg-background text-foreground focus:ring-2 focus:ring-cta/40 focus:border-primary"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowWithdrawForm(false);
                setWithdrawalReason('');
              }}
              className="px-3 py-1.5 text-xs font-medium text-muted-foreground border border-border rounded-full hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleWithdraw}
              disabled={withdrawing || !withdrawalReason.trim()}
              className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-full hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {withdrawing ? 'Withdrawing...' : 'Confirm Withdrawal'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
