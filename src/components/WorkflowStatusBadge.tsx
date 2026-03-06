'use client';

import React from 'react';
import { RequisitionStatus } from '../types/workflow';
import { WORKFLOW_STATES, getWorkflowProgress } from '../services/workflowDefinition';
import StatusPill from '@/components/StatusPill';

interface WorkflowStatusBadgeProps {
  status: RequisitionStatus;
  showIcon?: boolean;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const WorkflowStatusBadge: React.FC<WorkflowStatusBadgeProps> = ({
  status,
  showIcon = true,
  showProgress = false,
  size = 'md'
}) => {
  const state = WORKFLOW_STATES[status];
  const progress = getWorkflowProgress(status);

  const pillSizeMap: Record<string, 'sm' | 'md' | 'lg'> = {
    sm: 'sm',
    md: 'md',
    lg: 'lg'
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <span title={state.description}>
        <StatusPill
          value={status}
          label={showIcon ? `${state.icon} ${state.name}` : state.name}
          color={state.color}
          size={pillSizeMap[size]}
          className="normal-case tracking-normal"
        />
      </span>

      {showProgress && (
        <div className="flex items-center space-x-2 w-full">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                progress === 100 && status === RequisitionStatus.APPROVED 
                  ? 'bg-green-500' 
                  : progress === 100 && status === RequisitionStatus.REJECTED
                  ? 'bg-red-500'
                  : 'bg-gold-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 min-w-[3rem]">{progress}%</span>
        </div>
      )}
    </div>
  );
};

export default WorkflowStatusBadge;