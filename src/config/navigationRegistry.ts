import {
  HomeIcon,
  DocumentTextIcon,
  CalendarIcon,
  ChartBarIcon,
  BriefcaseIcon,
  UsersIcon,
  Squares2X2Icon,
  CogIcon,
  ClipboardDocumentListIcon,
  AcademicCapIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  EnvelopeIcon,
  FlagIcon,
  UserGroupIcon,
  PresentationChartBarIcon,
  WrenchScrewdriverIcon,
  MagnifyingGlassIcon,
  StarIcon,
  DocumentCheckIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  CalendarIcon as CalendarIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  BriefcaseIcon as BriefcaseIconSolid,
  UsersIcon as UsersIconSolid,
} from '@heroicons/react/24/solid';
import { ComponentType } from 'react';

export type NavSection = 'recruitment' | 'analytics' | 'administration' | 'personal' | 'system';

export interface NavigationEntry {
  id: string;
  label: string;
  href: string;
  icon: ComponentType<any>;
  iconSolid?: ComponentType<any>;
  section: NavSection;
  requiredPermissions: string[];
  badge?: string;
}

export const navigationRegistry: NavigationEntry[] = [
  // Recruitment
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: HomeIcon, iconSolid: HomeIconSolid, section: 'recruitment', requiredPermissions: ['view_dashboard'] },
  { id: 'job-postings', label: 'Job Postings', href: '/job-postings', icon: BriefcaseIcon, iconSolid: BriefcaseIconSolid, section: 'recruitment', requiredPermissions: ['manage_jobs'] },
  { id: 'applications', label: 'Applications', href: '/applications', icon: DocumentTextIcon, iconSolid: DocumentTextIconSolid, section: 'recruitment', requiredPermissions: ['view_applications'] },
  { id: 'applicants', label: 'Applicants', href: '/applicants', icon: UsersIcon, iconSolid: UsersIconSolid, section: 'recruitment', requiredPermissions: ['view_applicants'] },
  { id: 'pipeline', label: 'Pipeline', href: '/pipeline', icon: Squares2X2Icon, section: 'recruitment', requiredPermissions: ['manage_pipeline'] },
  { id: 'interviews', label: 'Interviews', href: '/interviews', icon: CalendarIcon, iconSolid: CalendarIconSolid, section: 'recruitment', requiredPermissions: ['view_interviews'] },
  { id: 'offers', label: 'Offers', href: '/offers', icon: CurrencyDollarIcon, section: 'recruitment', requiredPermissions: ['manage_offers'] },
  { id: 'internal-jobs', label: 'Internal Jobs', href: '/internal/jobs', icon: BuildingOfficeIcon, section: 'recruitment', requiredPermissions: ['view_internal_jobs'] },
  { id: 'application-management', label: 'Application Management', href: '/applications/manage', icon: WrenchScrewdriverIcon, section: 'recruitment', requiredPermissions: ['manage_applications'] },
  { id: 'workflow', label: 'Workflow Management', href: '/workflow', icon: Squares2X2Icon, section: 'recruitment', requiredPermissions: ['manage_workflow'] },
  { id: 'salary-recommendations', label: 'Salary Recommendations', href: '/salary-recommendations', icon: CurrencyDollarIcon, section: 'recruitment', requiredPermissions: ['view_salary_data'] },

  // Analytics
  { id: 'analytics', label: 'Analytics', href: '/analytics', icon: ChartBarIcon, iconSolid: ChartBarIconSolid, section: 'analytics', requiredPermissions: ['view_analytics'] },
  { id: 'recruiter-dashboard', label: 'Recruiter Analytics', href: '/recruiter-dashboard', icon: PresentationChartBarIcon, section: 'analytics', requiredPermissions: ['view_recruiter_analytics'] },
  { id: 'reports', label: 'Reports', href: '/reports', icon: DocumentCheckIcon, section: 'analytics', requiredPermissions: ['view_reports'] },

  // Administration
  { id: 'permissions', label: 'Role Permissions', href: '/admin/permissions', icon: ShieldCheckIcon, section: 'administration', requiredPermissions: ['manage_permissions'] },
  { id: 'audit-logs', label: 'Audit Logs', href: '/admin/audit-logs', icon: ClipboardDocumentListIcon, section: 'administration', requiredPermissions: ['view_audit_logs'] },

  // Personal (Applicant-facing)
  { id: 'browse-jobs', label: 'Browse Jobs', href: '/candidate/jobs', icon: MagnifyingGlassIcon, section: 'personal', requiredPermissions: ['browse_jobs'] },
  { id: 'my-applications', label: 'My Applications', href: '/candidate/applications', icon: DocumentTextIcon, section: 'personal', requiredPermissions: ['manage_own_applications'] },
  { id: 'my-profile', label: 'My Profile', href: '/candidate/profile', icon: UsersIcon, section: 'personal', requiredPermissions: ['view_own_profile'] },
  { id: 'interview-schedule', label: 'Interview Schedule', href: '/candidate/interviews', icon: CalendarIcon, section: 'personal', requiredPermissions: ['view_own_interviews'] },
  { id: 'my-offers', label: 'My Offers', href: '/candidate/offers', icon: CurrencyDollarIcon, section: 'personal', requiredPermissions: ['view_own_offers'] },
  { id: 'messages', label: 'Messages', href: '/applicant/messages', icon: EnvelopeIcon, section: 'personal', requiredPermissions: ['send_messages'] },

  // System
  { id: 'training', label: 'Training', href: '/training', icon: AcademicCapIcon, section: 'system', requiredPermissions: ['view_training'] },
  { id: 'integrations', label: 'Integrations', href: '/integrations', icon: GlobeAltIcon, section: 'system', requiredPermissions: ['manage_integrations'] },
];

export const sectionLabels: Record<NavSection, string> = {
  recruitment: 'Recruitment',
  analytics: 'Analytics',
  administration: 'Administration',
  personal: 'Personal',
  system: 'System',
};
