import {
  ClockIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowUturnLeftIcon,
  CalendarIcon,
  GiftIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  ShieldCheckIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  FunnelIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
} from '@heroicons/react/24/outline';
import { ComponentType, SVGProps } from 'react';

type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>;

interface StatusConfig {
  color: string;
  icon: HeroIcon;
  label: string;
}

// Application status icons (for candidate applications pages)
export const applicationStatusConfig: Record<string, StatusConfig> = {
  applied: { color: 'bg-gold-100 text-gold-800 border-violet-300', icon: ClockIcon, label: 'Applied' },
  under_review: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: EyeIcon, label: 'Under Review' },
  phone_screening: { color: 'bg-purple-100 text-purple-800 border-purple-300', icon: ChatBubbleLeftRightIcon, label: 'Phone Screening' },
  technical_interview: { color: 'bg-orange-100 text-orange-800 border-orange-300', icon: DocumentTextIcon, label: 'Technical Interview' },
  final_interview: { color: 'bg-indigo-100 text-indigo-800 border-indigo-300', icon: UserIcon, label: 'Final Interview' },
  offer_extended: { color: 'bg-green-100 text-green-800 border-green-300', icon: GiftIcon, label: 'Offer Extended' },
  hired: { color: 'bg-green-600 text-white border-green-600', icon: CheckCircleIcon, label: 'Hired' },
  rejected: { color: 'bg-red-100 text-red-800 border-red-300', icon: XCircleIcon, label: 'Rejected' },
  withdrawn: { color: 'bg-gray-100 text-gray-800 border-gray-300', icon: ArrowUturnLeftIcon, label: 'Withdrawn' },
  // Additional statuses from candidate/profile
  reviewing: { color: 'bg-orange-100 text-orange-800', icon: ClockIcon, label: 'Reviewing' },
  interview_scheduled: { color: 'bg-gold-100 text-gold-800', icon: CalendarIcon, label: 'Interview Scheduled' },
  interview_completed: { color: 'bg-purple-100 text-purple-800', icon: EyeIcon, label: 'Interview Completed' },
};

// Pipeline stage icons (for pipeline/kanban page)
export const pipelineStageConfig: Record<string, StatusConfig> = {
  applied: { color: 'bg-gold-100 text-gold-800', icon: PaperAirplaneIcon, label: 'Applied' },
  screening: { color: 'bg-yellow-100 text-yellow-800', icon: FunnelIcon, label: 'Screening' },
  interview: { color: 'bg-orange-100 text-orange-800', icon: CalendarIcon, label: 'Interview' },
  assessment: { color: 'bg-purple-100 text-purple-800', icon: DocumentTextIcon, label: 'Assessment' },
  offer: { color: 'bg-green-100 text-green-800', icon: GiftIcon, label: 'Offer' },
  hired: { color: 'bg-green-600 text-white', icon: CheckCircleIcon, label: 'Hired' },
  rejected: { color: 'bg-red-100 text-red-800', icon: XCircleIcon, label: 'Rejected' },
};

// Pipeline application status icons (active/hired/rejected/withdrawn in pipeline cards)
export const pipelineApplicationStatusConfig: Record<string, StatusConfig> = {
  active: { color: 'bg-gold-100 text-gold-800', icon: ClockIcon, label: 'Active' },
  hired: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon, label: 'Hired' },
  rejected: { color: 'bg-red-100 text-red-800', icon: XCircleIcon, label: 'Rejected' },
  withdrawn: { color: 'bg-gray-100 text-gray-800', icon: ArrowUturnLeftIcon, label: 'Withdrawn' },
  offer_declined: { color: 'bg-orange-100 text-orange-800', icon: HandThumbDownIcon, label: 'Offer Declined' },
};

// Interview status icons
export const interviewStatusConfig: Record<string, StatusConfig> = {
  confirmed: { color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircleIcon, label: 'Confirmed' },
  scheduled: { color: 'bg-gold-100 text-gold-800 border-violet-300', icon: CalendarIcon, label: 'Scheduled' },
  completed: { color: 'bg-gray-100 text-gray-800 border-gray-300', icon: CheckCircleIcon, label: 'Completed' },
  cancelled: { color: 'bg-red-100 text-red-800 border-red-300', icon: XCircleIcon, label: 'Cancelled' },
  rescheduled: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: ExclamationTriangleIcon, label: 'Rescheduled' },
  no_show: { color: 'bg-red-100 text-red-800 border-red-300', icon: XCircleIcon, label: 'No Show' },
};

// Audit log action icons
export const auditActionConfig: Record<string, StatusConfig> = {
  create: { color: 'bg-green-100 text-green-800', icon: PencilSquareIcon, label: 'Create' },
  update: { color: 'bg-gold-100 text-gold-800', icon: ArrowPathIcon, label: 'Update' },
  delete: { color: 'bg-red-100 text-red-800', icon: TrashIcon, label: 'Delete' },
  approve: { color: 'bg-green-100 text-green-800', icon: HandThumbUpIcon, label: 'Approve' },
  reject: { color: 'bg-red-100 text-red-800', icon: HandThumbDownIcon, label: 'Reject' },
  login: { color: 'bg-blue-100 text-blue-800', icon: ShieldCheckIcon, label: 'Login' },
  export: { color: 'bg-purple-100 text-purple-800', icon: DocumentTextIcon, label: 'Export' },
};

// Audit log severity icons
export const auditSeverityConfig: Record<string, StatusConfig> = {
  info: { color: 'bg-gold-100 text-gold-800', icon: InformationCircleIcon, label: 'Info' },
  warning: { color: 'bg-yellow-100 text-yellow-800', icon: ExclamationTriangleIcon, label: 'Warning' },
  error: { color: 'bg-red-100 text-red-800', icon: XCircleIcon, label: 'Error' },
  critical: { color: 'bg-red-600 text-white', icon: ExclamationTriangleIcon, label: 'Critical' },
};

// Helper to get config with fallback
export function getStatusConfig(
  configMap: Record<string, StatusConfig>,
  status: string
): StatusConfig {
  return configMap[status] || {
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    icon: InformationCircleIcon,
    label: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
  };
}
