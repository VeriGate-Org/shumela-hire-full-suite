import {
  HomeIcon,
  DocumentTextIcon,
  CalendarIcon,
  ChartBarIcon,
  BriefcaseIcon,
  UsersIcon,
  Squares2X2Icon,
  ClipboardDocumentListIcon,
  AcademicCapIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  BuildingOffice2Icon,
  CurrencyDollarIcon,
  PresentationChartBarIcon,
  WrenchScrewdriverIcon,
  MagnifyingGlassIcon,
  DocumentCheckIcon,
  Cog6ToothIcon,
  ServerStackIcon,
  QuestionMarkCircleIcon,
  UserGroupIcon,
  SparklesIcon,
  ClockIcon,
  HandThumbUpIcon,
  HeartIcon,
  ExclamationTriangleIcon,
  FolderIcon,
  ArrowPathIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  TrophyIcon,
  LightBulbIcon,
  SwatchIcon,
  DocumentDuplicateIcon,
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

export type NavSection = 'overview' | 'recruitment' | 'hr_core' | 'talent' | 'engagement' | 'workflow' | 'analytics' | 'administration' | 'personal' | 'system' | 'platform';

export interface NavigationEntry {
  id: string;
  label: string;
  href: string;
  icon: ComponentType<any>;
  iconSolid?: ComponentType<any>;
  section: NavSection;
  requiredPermissions: string[];
  requiredFeature?: string;
  badge?: string;
}

export const navigationRegistry: NavigationEntry[] = [
  // Overview
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: HomeIcon, iconSolid: HomeIconSolid, section: 'overview', requiredPermissions: ['view_dashboard'] },

  // Recruitment — job lifecycle
  { id: 'job-postings', label: 'Job Postings', href: '/job-postings', icon: BriefcaseIcon, iconSolid: BriefcaseIconSolid, section: 'recruitment', requiredPermissions: ['manage_jobs'] },
  { id: 'job-templates', label: 'Job Templates', href: '/job-templates', icon: DocumentTextIcon, section: 'recruitment', requiredPermissions: ['manage_jobs'] },
  { id: 'requisitions', label: 'Requisitions', href: '/requisitions', icon: ClipboardDocumentListIcon, section: 'recruitment', requiredPermissions: ['manage_requisitions'] },
  { id: 'internal-jobs', label: 'Internal Jobs', href: '/internal/jobs', icon: BuildingOfficeIcon, section: 'recruitment', requiredPermissions: ['view_internal_jobs'] },

  // Candidates — people and pipeline
  { id: 'applications', label: 'Applications', href: '/applications', icon: DocumentTextIcon, iconSolid: DocumentTextIconSolid, section: 'recruitment', requiredPermissions: ['view_applications'] },
  { id: 'applicants', label: 'Applicants', href: '/applicants', icon: UsersIcon, iconSolid: UsersIconSolid, section: 'recruitment', requiredPermissions: ['view_applicants'] },
  { id: 'pipeline', label: 'Pipeline', href: '/pipeline', icon: Squares2X2Icon, section: 'recruitment', requiredPermissions: ['manage_pipeline'] },
  { id: 'application-management', label: 'Application Management', href: '/applications/manage', icon: WrenchScrewdriverIcon, section: 'recruitment', requiredPermissions: ['manage_applications'] },
  { id: 'talent-pools', label: 'Talent Pools', href: '/talent-pools', icon: UserGroupIcon, section: 'recruitment', requiredPermissions: ['view_applicants'] },
  { id: 'agencies', label: 'Agencies', href: '/agencies', icon: BuildingOffice2Icon, section: 'recruitment', requiredPermissions: ['view_applicants'] },

  // Scheduling — interviews, offers, compensation
  { id: 'interviews', label: 'Interviews', href: '/interviews', icon: CalendarIcon, iconSolid: CalendarIconSolid, section: 'recruitment', requiredPermissions: ['view_interviews'] },
  { id: 'offers', label: 'Offers', href: '/offers', icon: CurrencyDollarIcon, section: 'recruitment', requiredPermissions: ['manage_offers'] },
  { id: 'salary-recommendations', label: 'Salary Recommendations', href: '/salary-recommendations', icon: CurrencyDollarIcon, section: 'recruitment', requiredPermissions: ['view_salary_data'] },

  // HR Core — leave, time & attendance, employee self-service
  { id: 'leave', label: 'Leave Management', href: '/leave', icon: CalendarIcon, section: 'hr_core', requiredPermissions: ['manage_leave'], requiredFeature: 'LEAVE_MANAGEMENT' },
  { id: 'time-attendance', label: 'Time & Attendance', href: '/time-attendance', icon: ClockIcon, section: 'hr_core', requiredPermissions: ['view_attendance'], requiredFeature: 'TIME_ATTENDANCE' },
  { id: 'shift-scheduling', label: 'Shift Scheduling', href: '/shift-scheduling', icon: ArrowPathIcon, section: 'hr_core', requiredPermissions: ['manage_attendance'], requiredFeature: 'SHIFT_SCHEDULING' },
  { id: 'employee-self-service', label: 'My HR Portal', href: '/employee/portal', icon: UserIcon, section: 'hr_core', requiredPermissions: ['view_own_profile'], requiredFeature: 'EMPLOYEE_SELF_SERVICE' },
  { id: 'employee-documents', label: 'Documents', href: '/employee/documents', icon: FolderIcon, section: 'hr_core', requiredPermissions: ['manage_documents'], requiredFeature: 'EMPLOYEE_DOCUMENTS' },

  // Talent & Performance — training, performance, competencies
  { id: 'performance', label: 'Performance', href: '/performance', icon: PresentationChartBarIcon, section: 'talent', requiredPermissions: ['view_performance'] },
  { id: 'training', label: 'Training', href: '/training', icon: AcademicCapIcon, section: 'talent', requiredPermissions: ['view_training'], requiredFeature: 'TRAINING_MANAGEMENT' },
  { id: 'training-admin', label: 'Training Admin', href: '/training/admin', icon: AcademicCapIcon, section: 'talent', requiredPermissions: ['manage_training'], requiredFeature: 'TRAINING_MANAGEMENT' },
  { id: 'competencies', label: 'Competency Framework', href: '/competencies', icon: LightBulbIcon, section: 'talent', requiredPermissions: ['manage_performance'], requiredFeature: 'COMPETENCY_MAPPING' },

  // Engagement — surveys, recognition, wellness
  { id: 'engagement', label: 'Engagement', href: '/engagement', icon: HeartIcon, section: 'engagement', requiredPermissions: ['manage_engagement'], requiredFeature: 'EMPLOYEE_ENGAGEMENT' },
  { id: 'surveys', label: 'Pulse Surveys', href: '/engagement/surveys', icon: ChatBubbleLeftRightIcon, section: 'engagement', requiredPermissions: ['manage_engagement'], requiredFeature: 'PULSE_SURVEYS' },
  { id: 'recognition', label: 'Recognition', href: '/engagement/recognition', icon: TrophyIcon, section: 'engagement', requiredPermissions: ['view_own_profile'], requiredFeature: 'RECOGNITION_REWARDS' },

  // Workflow & AI — automation tools
  { id: 'workflow', label: 'Workflow Management', href: '/workflow', icon: Squares2X2Icon, section: 'workflow', requiredPermissions: ['manage_workflow'], requiredFeature: 'WORKFLOW_MANAGEMENT' },
  { id: 'ai-tools', label: 'AI Tools', href: '/ai-tools', icon: SparklesIcon, section: 'workflow', requiredPermissions: ['view_dashboard'], requiredFeature: 'AI_ENABLED', badge: 'AI' },

  // Analytics
  { id: 'analytics', label: 'Analytics', href: '/analytics', icon: ChartBarIcon, iconSolid: ChartBarIconSolid, section: 'analytics', requiredPermissions: ['view_analytics'] },
  { id: 'hr-analytics', label: 'HR Analytics', href: '/analytics/hr-overview', icon: PresentationChartBarIcon, section: 'analytics', requiredPermissions: ['view_analytics'], requiredFeature: 'ADVANCED_ANALYTICS' },
  { id: 'recruiter-dashboard', label: 'Recruiter Analytics', href: '/recruiter-dashboard', icon: PresentationChartBarIcon, section: 'analytics', requiredPermissions: ['view_recruiter_analytics'] },
  { id: 'reports', label: 'Reports', href: '/reports', icon: DocumentCheckIcon, section: 'analytics', requiredPermissions: ['view_reports'] },
  { id: 'report-export', label: 'Report Export', href: '/reports/export', icon: DocumentCheckIcon, section: 'analytics', requiredPermissions: ['view_reports'], requiredFeature: 'REPORT_EXPORT' },

  // Administration
  { id: 'permissions', label: 'Role Permissions', href: '/admin/permissions', icon: ShieldCheckIcon, section: 'administration', requiredPermissions: ['manage_permissions'] },
  { id: 'audit-logs', label: 'Audit Logs', href: '/admin/audit-logs', icon: ClipboardDocumentListIcon, section: 'administration', requiredPermissions: ['view_audit_logs'] },
  { id: 'departments', label: 'Departments', href: '/admin/departments', icon: BuildingOfficeIcon, section: 'administration', requiredPermissions: ['manage_departments'] },
  { id: 'compliance', label: 'Compliance', href: '/admin/compliance', icon: ExclamationTriangleIcon, section: 'administration', requiredPermissions: ['manage_compliance'], requiredFeature: 'POPIA_COMPLIANCE' },
  { id: 'labour-relations', label: 'Labour Relations', href: '/admin/labour-relations', icon: HandThumbUpIcon, section: 'administration', requiredPermissions: ['manage_compliance'], requiredFeature: 'LABOUR_RELATIONS' },
  { id: 'branding', label: 'Branding', href: '/admin/branding', icon: SwatchIcon, section: 'administration', requiredPermissions: ['manage_permissions'], requiredFeature: 'CUSTOM_BRANDING' },
  { id: 'document-templates', label: 'Document Templates', href: '/admin/document-templates', icon: DocumentDuplicateIcon, section: 'administration', requiredPermissions: ['manage_permissions'], requiredFeature: 'DOCUMENT_TEMPLATES' },

  // Personal (Applicant-facing)
  { id: 'browse-jobs', label: 'Browse Jobs', href: '/candidate/jobs', icon: MagnifyingGlassIcon, section: 'personal', requiredPermissions: ['browse_jobs'] },
  { id: 'my-applications', label: 'My Applications', href: '/candidate/applications', icon: DocumentTextIcon, section: 'personal', requiredPermissions: ['manage_own_applications'] },
  { id: 'my-profile', label: 'My Profile', href: '/candidate/profile', icon: UsersIcon, section: 'personal', requiredPermissions: ['view_own_profile'] },
  { id: 'interview-schedule', label: 'Interview Schedule', href: '/candidate/interviews', icon: CalendarIcon, section: 'personal', requiredPermissions: ['view_own_interviews'] },
  { id: 'my-offers', label: 'My Offers', href: '/candidate/offers', icon: CurrencyDollarIcon, section: 'personal', requiredPermissions: ['view_own_offers'] },

  // System
  { id: 'integrations', label: 'Integrations', href: '/integrations', icon: GlobeAltIcon, section: 'system', requiredPermissions: ['manage_integrations'] },
  { id: 'sage-integration', label: 'Sage Integration', href: '/integrations/sage', icon: ServerStackIcon, section: 'system', requiredPermissions: ['manage_integrations'], requiredFeature: 'SAGE_300_PEOPLE' },
  { id: 'sso-configuration', label: 'SSO Configuration', href: '/integrations/sso', icon: ShieldCheckIcon, section: 'system', requiredPermissions: ['manage_integrations'], requiredFeature: 'AD_SSO' },
  { id: 'help', label: 'Help Center', href: '/help', icon: QuestionMarkCircleIcon, section: 'system', requiredPermissions: [] },

  // Platform
  { id: 'platform-tenants', label: 'Tenants', href: '/platform/tenants', icon: ServerStackIcon, section: 'platform', requiredPermissions: ['manage_tenants'] },
  { id: 'platform-features', label: 'Feature Registry', href: '/platform/features', icon: Cog6ToothIcon, section: 'platform', requiredPermissions: ['manage_features'] },
];

export const sectionLabels: Record<NavSection, string> = {
  overview: 'Overview',
  recruitment: 'Recruitment',
  hr_core: 'HR Management',
  talent: 'Talent & Performance',
  engagement: 'Engagement',
  workflow: 'Workflow & AI',
  analytics: 'Analytics',
  administration: 'Administration',
  personal: 'Personal',
  system: 'System',
  platform: 'Platform',
};
