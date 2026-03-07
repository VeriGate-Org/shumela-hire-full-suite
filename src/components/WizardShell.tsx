'use client';

import React, { useEffect, useCallback } from 'react';
import { CheckIcon, ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

export interface WizardStep {
  id: string;
  label: string;
  description?: string;
  skippable?: boolean;
}

interface WizardShellProps {
  steps: WizardStep[];
  currentStep: number;
  onNext: () => void;
  onBack: () => void;
  onSkip?: () => void;
  canProceed: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'page' | 'modal';
  onClose?: () => void;
}

export default function WizardShell({
  steps,
  currentStep,
  onNext,
  onBack,
  onSkip,
  canProceed,
  title,
  subtitle,
  children,
  footer,
  variant = 'page',
  onClose,
}: WizardShellProps) {
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const currentStepConfig = steps[currentStep];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && variant === 'modal' && onClose) {
        onClose();
      }
    },
    [variant, onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const stepIndicator = (
    <div className="flex items-center px-6 py-4 bg-off-white dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        return (
          <React.Fragment key={step.id}>
            <div className="flex items-center gap-2.5 shrink-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isCompleted
                    ? 'bg-emerald-500 text-white'
                    : isCurrent
                      ? 'bg-cta text-deep-navy shadow-[0_0_0_4px_rgba(241,197,75,0.2)]'
                      : 'border-2 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500'
                }`}
              >
                {isCompleted ? (
                  <CheckIcon className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              <div className="min-w-0">
                <div
                  className={`text-xs font-semibold whitespace-nowrap ${
                    isCompleted
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : isCurrent
                        ? 'text-gray-900 dark:text-gray-100'
                        : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {step.label}
                </div>
                {step.description && (
                  <div className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
                    {step.description}
                  </div>
                )}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-3 min-w-[16px] rounded-full ${
                  index < currentStep
                    ? 'bg-emerald-500'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  const defaultFooter = (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
      <div>
        {!isFirst && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            Back
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {currentStepConfig?.skippable && onSkip && (
          <button
            onClick={onSkip}
            className="px-4 py-2 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            Skip
          </button>
        )}
        {!isLast && (
          <button
            onClick={onNext}
            disabled={!canProceed}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold bg-cta text-deep-navy rounded-full hover:bg-cta/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
            <ArrowRightIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );

  const shell = (
    <div className="bg-white dark:bg-charcoal border border-gray-200 dark:border-gray-700 rounded-[2px] overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-base font-bold tracking-[-0.02em] text-gray-900 dark:text-gray-100">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Step {currentStep + 1} of {steps.length}
          </span>
          {variant === 'modal' && onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-lg leading-none"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Step indicator */}
      {stepIndicator}

      {/* Content */}
      <div className="p-6">{children}</div>

      {/* Footer */}
      {footer || defaultFooter}
    </div>
  );

  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {shell}
        </div>
      </div>
    );
  }

  return shell;
}
