'use client';

import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PauseCircleIcon,
} from '@heroicons/react/24/outline';

interface SageSyncStatusProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; colorClasses: string; icon: React.ElementType }> = {
  SUCCESS: {
    label: 'Success',
    colorClasses: 'bg-green-100 text-green-800',
    icon: CheckCircleIcon,
  },
  COMPLETED: {
    label: 'Completed',
    colorClasses: 'bg-green-100 text-green-800',
    icon: CheckCircleIcon,
  },
  FAILED: {
    label: 'Failed',
    colorClasses: 'bg-red-100 text-red-800',
    icon: XCircleIcon,
  },
  ERROR: {
    label: 'Error',
    colorClasses: 'bg-red-100 text-red-800',
    icon: XCircleIcon,
  },
  IN_PROGRESS: {
    label: 'In Progress',
    colorClasses: 'bg-blue-100 text-blue-800',
    icon: ArrowPathIcon,
  },
  RUNNING: {
    label: 'Running',
    colorClasses: 'bg-blue-100 text-blue-800',
    icon: ArrowPathIcon,
  },
  PENDING: {
    label: 'Pending',
    colorClasses: 'bg-yellow-100 text-yellow-800',
    icon: ClockIcon,
  },
  SCHEDULED: {
    label: 'Scheduled',
    colorClasses: 'bg-yellow-100 text-yellow-800',
    icon: ClockIcon,
  },
  PARTIAL: {
    label: 'Partial',
    colorClasses: 'bg-orange-100 text-orange-800',
    icon: ExclamationTriangleIcon,
  },
  PAUSED: {
    label: 'Paused',
    colorClasses: 'bg-gray-100 text-gray-700',
    icon: PauseCircleIcon,
  },
  INACTIVE: {
    label: 'Inactive',
    colorClasses: 'bg-gray-100 text-gray-500',
    icon: PauseCircleIcon,
  },
};

const SIZE_CONFIG = {
  sm: { badge: 'px-2 py-0.5 text-xs', icon: 'w-3 h-3' },
  md: { badge: 'px-2.5 py-1 text-xs', icon: 'w-4 h-4' },
  lg: { badge: 'px-3 py-1.5 text-sm', icon: 'w-5 h-5' },
};

export default function SageSyncStatus({ status, size = 'md', showLabel = true }: SageSyncStatusProps) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    colorClasses: 'bg-gray-100 text-gray-600',
    icon: ClockIcon,
  };
  const sizeConfig = SIZE_CONFIG[size];
  const IconComponent = config.icon;
  const isAnimating = status === 'IN_PROGRESS' || status === 'RUNNING';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.colorClasses} ${sizeConfig.badge}`}
    >
      <IconComponent className={`${sizeConfig.icon} ${isAnimating ? 'animate-spin' : ''}`} />
      {showLabel && config.label}
    </span>
  );
}
