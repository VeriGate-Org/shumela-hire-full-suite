import {
  HomeIcon,
  DocumentTextIcon,
  CalendarIcon,
  ChartBarIcon,
  BriefcaseIcon,
  UsersIcon,
  Squares2X2Icon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  AcademicCapIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  BuildingOffice2Icon,
  CurrencyDollarIcon,
  PresentationChartBarIcon,
  MagnifyingGlassIcon,
  DocumentCheckIcon,
  Cog6ToothIcon,
  ServerStackIcon,
  QuestionMarkCircleIcon,
  UserGroupIcon,
  SparklesIcon,
  ClockIcon,
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
  RocketLaunchIcon,
  MegaphoneIcon,
  AdjustmentsHorizontalIcon,
  UserPlusIcon,
  BanknotesIcon,
  BellIcon,
  IdentificationIcon,
  WrenchIcon,
  BoltIcon,
  CpuChipIcon,
  ChatBubbleLeftIcon,
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
import type { UserRole } from '@/contexts/AuthContext';

export type NavSection = 'overview' | 'recruitment' | 'hr_core' | 'talent' | 'engagement' | 'workflow' | 'analytics' | 'administration' | 'personal' | 'system' | 'platform' | 'communication' | 'integrations' | 'candidate_portal';

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
  /**
   * Restricts this entry to specific roles, on top of requiredPermissions.
   * Use sparingly — only when two roles share a permission but the entry
   * should still appear for just one of them (e.g. an item duplicated into
   * a section a role keeps visible, while its usual section is hidden for
   * that role via ROLE_HIDDEN_SECTIONS).
   */
  allowedRoles?: UserRole[];
}

export const navigationRegistry: NavigationEntry[] = [
  // Overview
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: Squares2X2Icon, section: 'overview', requiredPermissions: ['view_dashboard'] },

  // Recruitment — job lifecycle
  { id: 'job-postings', label: 'Job Postings', href: '/job-postings', icon: BriefcaseIcon, iconSolid: BriefcaseIconSolid, section: 'recruitment', requiredPermissions: ['manage_jobs'], requiredFeature: 'RECRUITMENT' },
  { id: 'job-templates', label: 'Job Templates', href: '/job-templates', icon: DocumentTextIcon, section: 'recruitment', requiredPermissions: ['manage_jobs'], requiredFeature: 'RECRUITMENT' },
  { id: 'requisitions', label: 'Requisitions', href: '/requisitions', icon: ClipboardDocumentListIcon, section: 'recruitment', requiredPermissions: ['manage_requisitions'], requiredFeature: 'RECRUITMENT' },
  { id: 'internal-jobs', label: 'Internal Jobs', href: '/internal/jobs', icon: BuildingOfficeIcon, section: 'recruitment', requiredPermissions: ['view_internal_jobs'], requiredFeature: 'RECRUITMENT' },

  // Candidates — people and pipeline
  { id: 'applications', label: 'Applications', href: '/applications', icon: DocumentTextIcon, iconSolid: DocumentTextIconSolid, section: 'recruitment', requiredPermissions: ['view_applications'], requiredFeature: 'RECRUITMENT' },
  { id: 'applicants', label: 'Applicants', href: '/applicants', icon: UsersIcon, iconSolid: UsersIconSolid, section: 'recruitment', requiredPermissions: ['view_applicants'], requiredFeature: 'RECRUITMENT' },
  { id: 'pipeline', label: 'Pipeline', href: '/pipeline', icon: Squares2X2Icon, section: 'recruitment', requiredPermissions: ['manage_pipeline'], requiredFeature: 'RECRUITMENT' },
  // talent-pools and agencies share the view_applicants permission with the
  // 'applicants' entry above (deliberately — a HIRING_MANAGER giving
  // HIRING_MANAGER that permission so they can see Applicants would
  // otherwise also silently unlock these two, which weren't asked for and
  // aren't backed by any HIRING_MANAGER-accessible endpoint the same way
  // Applicants/Application Management now are). allowedRoles pins them back
  // to their original role set regardless of who else picks up the
  // permission in the future.
  { id: 'talent-pools', label: 'Talent Pools', href: '/talent-pools', icon: UserGroupIcon, section: 'recruitment', requiredPermissions: ['view_applicants'], requiredFeature: 'RECRUITMENT', allowedRoles: ['ADMIN', 'HR_MANAGER', 'RECRUITER'] },
  { id: 'agencies', label: 'Agencies', href: '/agencies', icon: BuildingOffice2Icon, section: 'recruitment', requiredPermissions: ['view_applicants'], requiredFeature: 'RECRUITMENT', allowedRoles: ['ADMIN', 'HR_MANAGER', 'RECRUITER'] },

  // Scheduling — interviews, offers, compensation
  { id: 'interviews', label: 'Interviews', href: '/interviews', icon: CalendarIcon, iconSolid: CalendarIconSolid, section: 'recruitment', requiredPermissions: ['view_interviews'], requiredFeature: 'RECRUITMENT' },
  { id: 'offers', label: 'Offers', href: '/offers', icon: CurrencyDollarIcon, section: 'recruitment', requiredPermissions: ['manage_offers'], requiredFeature: 'RECRUITMENT' },
  // One queue over every approval this person holds authority for. The page existed from #317
  // and had no way in: it was reachable only by typing the URL, or through the Workflow screen's
  // Approvals tab. A queue nobody can find is a queue nobody works.
  //
  // view_approvals is granted to exactly the five roles the endpoint admits, so the menu entry and
  // GET /api/approvals/pending cannot disagree about who this is for.
  { id: 'approvals', label: 'Approvals', href: '/approvals', icon: CheckCircleIcon, section: 'recruitment', requiredPermissions: ['view_approvals'], requiredFeature: 'RECRUITMENT' },
  { id: 'salary-recommendations', label: 'Salary Recommendations', href: '/salary-recommendations', icon: CurrencyDollarIcon, section: 'recruitment', requiredPermissions: ['view_salary_data'], requiredFeature: 'RECRUITMENT' },

  // HR Core — leave, time & attendance, employee self-service
  // Every entry in this section must carry a requiredFeature from the HR_CORE
  // module. An untagged entry can never lock, so it survives module gating and
  // renders an HR item inside a recruitment-only tenant — which is exactly how
  // Employee Directory, Add Employee, Payslips and Expense Submission were
  // showing on the IDC tenant (modules = RECRUITMENT,AI,ANALYTICS,ADMINISTRATION).
  { id: 'employee-directory', label: 'Employee Directory', href: '/employee', icon: UsersIcon, section: 'hr_core', requiredPermissions: ['view_own_profile'], requiredFeature: 'EMPLOYEE_SELF_SERVICE' },
  { id: 'leave', label: 'Leave Management', href: '/leave', icon: CalendarIcon, section: 'hr_core', requiredPermissions: ['manage_leave'], requiredFeature: 'LEAVE_MANAGEMENT' },
  { id: 'payslips', label: 'Payslips', href: '/payroll/payslips', icon: BanknotesIcon, section: 'hr_core', requiredPermissions: ['view_own_profile'], requiredFeature: 'EMPLOYEE_SELF_SERVICE' },
  { id: 'time-attendance', label: 'Time & Attendance', href: '/time-attendance', icon: ClockIcon, section: 'hr_core', requiredPermissions: ['view_attendance'], requiredFeature: 'TIME_ATTENDANCE' },
  { id: 'overtime-log', label: 'Overtime Log', href: '/time-attendance/overtime', icon: ClockIcon, section: 'hr_core', requiredPermissions: ['view_attendance'], requiredFeature: 'TIME_ATTENDANCE' },
  { id: 'shift-scheduling', label: 'Shift Scheduling', href: '/shift-scheduling', icon: ArrowPathIcon, section: 'hr_core', requiredPermissions: ['manage_attendance'], requiredFeature: 'SHIFT_SCHEDULING' },
  { id: 'expense-submission', label: 'Expense Submission', href: '/expenses', icon: CurrencyDollarIcon, section: 'hr_core', requiredPermissions: ['view_own_profile'], requiredFeature: 'EMPLOYEE_SELF_SERVICE' },
  { id: 'employee-self-service', label: 'My HR Portal', href: '/employee/portal', icon: UserIcon, section: 'hr_core', requiredPermissions: ['view_own_profile'], requiredFeature: 'EMPLOYEE_SELF_SERVICE' },
  { id: 'employee-documents', label: 'Documents', href: '/employee/documents', icon: FolderIcon, section: 'hr_core', requiredPermissions: ['manage_documents'], requiredFeature: 'EMPLOYEE_DOCUMENTS' },
  { id: 'company-documents', label: 'Company Docs', href: '/employee/company-documents', icon: DocumentDuplicateIcon, section: 'hr_core', requiredPermissions: ['view_company_documents'], requiredFeature: 'COMPANY_DOCUMENTS' },
  { id: 'onboarding', label: 'Onboarding', href: '/onboarding', icon: RocketLaunchIcon, section: 'hr_core', requiredPermissions: ['manage_documents'], requiredFeature: 'EMPLOYEE_SELF_SERVICE' },
  { id: 'my-development', label: 'My Development', href: '/employee/development', icon: LightBulbIcon, section: 'hr_core', requiredPermissions: ['view_own_profile'], requiredFeature: 'EMPLOYEE_SELF_SERVICE' },
  { id: 'my-performance', label: 'My Performance', href: '/employee/performance', icon: PresentationChartBarIcon, section: 'hr_core', requiredPermissions: ['view_own_profile'], requiredFeature: 'EMPLOYEE_SELF_SERVICE' },

  // Talent & Performance — training, performance, competencies
  { id: 'performance', label: 'Performance', href: '/performance', icon: PresentationChartBarIcon, section: 'talent', requiredPermissions: ['view_performance'], requiredFeature: 'TRAINING_MANAGEMENT' },
  { id: 'training', label: 'Training', href: '/training', icon: AcademicCapIcon, section: 'talent', requiredPermissions: ['view_training'], requiredFeature: 'TRAINING_MANAGEMENT' },
  { id: 'training-admin', label: 'Training Admin', href: '/training/admin', icon: AcademicCapIcon, section: 'talent', requiredPermissions: ['manage_training'], requiredFeature: 'TRAINING_MANAGEMENT' },
  { id: 'training-idps', label: 'Development Plans', href: '/training/idps', icon: LightBulbIcon, section: 'talent', requiredPermissions: ['view_training'], requiredFeature: 'TRAINING_MANAGEMENT' },
  { id: 'performance-reviews', label: 'Reviews', href: '/performance/reviews', icon: ClipboardDocumentListIcon, section: 'talent', requiredPermissions: ['manage_performance'], requiredFeature: 'TRAINING_MANAGEMENT' },
  { id: '360-reviews', label: '360 Reviews', href: '/performance/360', icon: ArrowPathIcon, section: 'talent', requiredPermissions: ['view_performance'], requiredFeature: 'TRAINING_MANAGEMENT' },
  { id: 'performance-pips', label: 'Improvement Plans', href: '/performance/pips', icon: ExclamationTriangleIcon, section: 'talent', requiredPermissions: ['manage_performance'], requiredFeature: 'TRAINING_MANAGEMENT' },
  { id: 'competencies', label: 'Competency Framework', href: '/competencies', icon: LightBulbIcon, section: 'talent', requiredPermissions: ['manage_performance'], requiredFeature: 'COMPETENCY_MAPPING' },

  // Engagement — surveys, recognition, social feed, wellness
  { id: 'engagement', label: 'Engagement', href: '/engagement', icon: HeartIcon, section: 'engagement', requiredPermissions: ['manage_engagement'], requiredFeature: 'EMPLOYEE_ENGAGEMENT' },
  { id: 'surveys', label: 'Pulse Surveys', href: '/engagement/surveys', icon: ChatBubbleLeftRightIcon, section: 'engagement', requiredPermissions: ['manage_engagement'], requiredFeature: 'PULSE_SURVEYS' },
  { id: 'recognition', label: 'Recognition', href: '/engagement/recognition', icon: TrophyIcon, section: 'engagement', requiredPermissions: ['view_own_profile'], requiredFeature: 'RECOGNITION_REWARDS' },
  { id: 'social-feed', label: 'Social Feed', href: '/feed', icon: MegaphoneIcon, section: 'engagement', requiredPermissions: ['feed:view'], requiredFeature: 'SOCIAL_FEED' },
  { id: 'wellness', label: 'Wellness', href: '/engagement/wellness', icon: HeartIcon, section: 'engagement', requiredPermissions: ['view_own_profile'], requiredFeature: 'EMPLOYEE_ENGAGEMENT' },

  // AI Tools (single-link section)
  { id: 'ai-tools', label: 'AI Tools', href: '/ai-tools', icon: CpuChipIcon, section: 'workflow', requiredPermissions: ['manage_jobs'], requiredFeature: 'AI_ENABLED' },

  // Analytics
  // An analytics entry must be gated on the module that owns the DATA, not on
  // ADVANCED_ANALYTICS — that only says the tenant bought analytics, not which
  // subject areas it has. HR Analytics and Employee Reports report on
  // employees (HR_CORE); Performance Analytics reports on performance (TALENT,
  // the same feature /performance itself uses). Gating all three on
  // ADVANCED_ANALYTICS put HR reporting in the sidebar of a recruitment-only
  // tenant that had legitimately licensed the Analytics module.
  { id: 'analytics', label: 'Analytics', href: '/analytics', icon: ChartBarIcon, iconSolid: ChartBarIconSolid, section: 'analytics', requiredPermissions: ['view_analytics'] },
  { id: 'hr-analytics', label: 'HR Analytics', href: '/analytics/hr-overview', icon: PresentationChartBarIcon, section: 'analytics', requiredPermissions: ['view_analytics'], requiredFeature: 'EMPLOYEE_SELF_SERVICE' },
  // The five HR analytics screens. All were built, all are wired to endpoints that exist, and
  // none was in this list — so nobody could reach them. Gated exactly as HR Analytics above,
  // because they are the same module and the same data.
  { id: 'attendance-analytics', label: 'Attendance Analytics', href: '/analytics/attendance', icon: ClockIcon, section: 'analytics', requiredPermissions: ['view_analytics'], requiredFeature: 'EMPLOYEE_SELF_SERVICE' },
  { id: 'engagement-analytics', label: 'Engagement Analytics', href: '/analytics/engagement', icon: HeartIcon, section: 'analytics', requiredPermissions: ['view_analytics'], requiredFeature: 'EMPLOYEE_SELF_SERVICE' },
  { id: 'compliance-analytics', label: 'Compliance Analytics', href: '/analytics/compliance', icon: ShieldCheckIcon, section: 'analytics', requiredPermissions: ['view_analytics'], requiredFeature: 'EMPLOYEE_SELF_SERVICE' },
  { id: 'workforce-planning', label: 'Workforce Planning', href: '/analytics/workforce-planning', icon: UserGroupIcon, section: 'analytics', requiredPermissions: ['view_analytics'], requiredFeature: 'EMPLOYEE_SELF_SERVICE' },
  { id: 'ld-analytics', label: 'L&D Analytics', href: '/analytics/training', icon: AcademicCapIcon, section: 'analytics', requiredPermissions: ['view_analytics'], requiredFeature: 'TRAINING_MANAGEMENT' },
  // Distinct from L&D Analytics above: that one reads /api/analytics/training for organisation-wide
  // measures, this one is the training module's own view over its courses and enrolments.
  { id: 'training-analytics', label: 'Training Reports', href: '/training/analytics', icon: AcademicCapIcon, section: 'analytics', requiredPermissions: ['view_training'], requiredFeature: 'TRAINING_MANAGEMENT' },
  { id: 'leave-analytics', label: 'Leave Analytics', href: '/leave/analytics', icon: CalendarIcon, section: 'analytics', requiredPermissions: ['view_analytics'], requiredFeature: 'EMPLOYEE_SELF_SERVICE' },
  { id: 'executive-reports', label: 'Executive Reports', href: '/executive/reports', icon: PresentationChartBarIcon, section: 'analytics', requiredPermissions: ['view_reports'], allowedRoles: ['ADMIN', 'EXECUTIVE', 'HR_MANAGER'] },
  { id: 'performance-analytics', label: 'Performance Analytics', href: '/performance-analytics', icon: ChartBarIcon, section: 'analytics', requiredPermissions: ['view_analytics'], requiredFeature: 'TRAINING_MANAGEMENT' },
  { id: 'recruiter-dashboard', label: 'Recruiter Analytics', href: '/recruiter-dashboard', icon: PresentationChartBarIcon, section: 'analytics', requiredPermissions: ['view_recruiter_analytics'], requiredFeature: 'RECRUITMENT' },
  { id: 'reports', label: 'Reports', href: '/reports', icon: DocumentCheckIcon, section: 'analytics', requiredPermissions: ['view_reports'] },
  // Pinned to the roles ReportExportController actually admits. HIRING_MANAGER
  // holds view_reports (to read reports) but not export rights, and an entry
  // that appears and then 403s is worse than no entry.
  { id: 'report-export', label: 'Report Export', href: '/reports/export', icon: DocumentCheckIcon, section: 'analytics', requiredPermissions: ['view_reports'], requiredFeature: 'REPORT_EXPORT', allowedRoles: ['ADMIN', 'HR_MANAGER'] },

  // Administration
  { id: 'permissions', label: 'Role Permissions', href: '/admin/permissions', icon: ShieldCheckIcon, section: 'administration', requiredPermissions: ['manage_permissions'] },
  { id: 'audit-logs', label: 'Audit Logs', href: '/admin/audit-logs', icon: ClipboardDocumentListIcon, section: 'administration', requiredPermissions: ['view_audit_logs'] },
  { id: 'departments', label: 'Departments', href: '/admin/departments', icon: BuildingOfficeIcon, section: 'administration', requiredPermissions: ['manage_departments'] },
  { id: 'compliance', label: 'Compliance', href: '/admin/compliance', icon: ExclamationTriangleIcon, section: 'administration', requiredPermissions: ['manage_compliance'], requiredFeature: 'POPIA_COMPLIANCE' },
  { id: 'branding', label: 'Branding', href: '/admin/branding', icon: SwatchIcon, section: 'administration', requiredPermissions: ['manage_permissions'], requiredFeature: 'CUSTOM_BRANDING' },
  { id: 'document-templates', label: 'Document Templates', href: '/admin/document-templates', icon: DocumentDuplicateIcon, section: 'administration', requiredPermissions: ['manage_permissions'], requiredFeature: 'DOCUMENT_TEMPLATES' },
  { id: 'company-documents-admin', label: 'Company Documents', href: '/admin/company-documents', icon: FolderIcon, section: 'administration', requiredPermissions: ['manage_company_documents'], requiredFeature: 'COMPANY_DOCUMENTS' },
  { id: 'document-retention', label: 'Document Retention', href: '/admin/document-retention', icon: ClockIcon, section: 'administration', requiredPermissions: ['manage_company_documents'], requiredFeature: 'DOCUMENT_RETENTION' },
  { id: 'custom-fields', label: 'Custom Fields', href: '/settings/custom-fields', icon: AdjustmentsHorizontalIcon, section: 'administration', requiredPermissions: ['custom_fields:manage'] },

  // Integrations (moved from system + workflow)
  { id: 'integrations', label: 'Integrations', href: '/integrations', icon: GlobeAltIcon, section: 'integrations', requiredPermissions: ['manage_integrations'] },
  { id: 'sage-integration', label: 'Sage Integration', href: '/integrations/sage', icon: ServerStackIcon, section: 'integrations', requiredPermissions: ['manage_integrations'], requiredFeature: 'SAGE_300_PEOPLE' },
  { id: 'sso-configuration', label: 'SSO Configuration', href: '/integrations/sso', icon: ShieldCheckIcon, section: 'integrations', requiredPermissions: ['manage_integrations'], requiredFeature: 'AD_SSO' },
  { id: 'workflow', label: 'Workflow Management', href: '/workflow', icon: Squares2X2Icon, section: 'integrations', requiredPermissions: ['manage_workflow'], requiredFeature: 'WORKFLOW_MANAGEMENT' },

  // Candidate Portal
  { id: 'candidate-portal', label: 'Candidate Portal', href: '/candidate', icon: IdentificationIcon, section: 'candidate_portal', requiredPermissions: ['browse_jobs'] },
  { id: 'candidate-interviews', label: 'Interviews & Offers', href: '/candidate/interviews', icon: CalendarIcon, section: 'candidate_portal', requiredPermissions: ['view_own_interviews'] },

  // Communication — staff-portal features, not ATS ones. Gated on the HR_CORE
  // module for the same reason the HR section is: they were untagged, so they
  // could never lock, and an ATS-only tenant was getting an internal-comms
  // section it had not licensed. Hiding the /notifications PAGE does not touch
  // the header notification bell, which is NotificationsPanel, not this entry.
  { id: 'messaging', label: 'Messaging', href: '/messages', icon: ChatBubbleLeftRightIcon, section: 'communication', requiredPermissions: ['view_own_profile'], requiredFeature: 'EMPLOYEE_SELF_SERVICE' },
  { id: 'notifications-search', label: 'Notifications & Search', href: '/notifications', icon: BellIcon, section: 'communication', requiredPermissions: ['view_own_profile'], requiredFeature: 'EMPLOYEE_SELF_SERVICE' },
  { id: 'it-support', label: 'IT Support', href: '/support', icon: WrenchIcon, section: 'communication', requiredPermissions: ['view_own_profile'], requiredFeature: 'EMPLOYEE_SELF_SERVICE' },

  // Personal (Applicant-facing; Employees share this section too — see
  // ROLE_HIDDEN_SECTIONS.EMPLOYEE and rolePermissions.EMPLOYEE)
  { id: 'browse-jobs', label: 'Browse Jobs', href: '/candidate/jobs', icon: MagnifyingGlassIcon, section: 'personal', requiredPermissions: ['browse_jobs'] },
  { id: 'my-applications', label: 'My Applications', href: '/candidate/applications', icon: DocumentTextIcon, section: 'personal', requiredPermissions: ['manage_own_applications'] },
  // Points at the CANDIDATE profile, so it belongs to people who have one.
  // Every staff role also holds view_own_profile, which put a lone "My Profile"
  // under Personal in an administrator's sidebar, linking to the wrong page.
  // Not feature-gated: an Applicant must keep this whatever the tenant licenses.
  { id: 'my-profile', label: 'My Profile', href: '/candidate/profile', icon: UsersIcon, section: 'personal', requiredPermissions: ['view_own_profile'], allowedRoles: ['APPLICANT', 'EMPLOYEE'] },
  { id: 'interview-schedule', label: 'Interview Schedule', href: '/candidate/interviews', icon: CalendarIcon, section: 'personal', requiredPermissions: ['view_own_interviews'] },
  { id: 'my-offers', label: 'My Offers', href: '/candidate/offers', icon: CurrencyDollarIcon, section: 'personal', requiredPermissions: ['view_own_offers'] },
  // Employees also have 'view_internal_jobs' via the (now-hidden) Recruitment
  // section's 'internal-jobs' entry — this duplicate keeps it reachable under
  // Personal for Employees specifically, without also surfacing it for
  // Applicants (who hold the same permission but shouldn't see it here).
  { id: 'employee-internal-jobs', label: 'Internal Jobs', href: '/internal/jobs', icon: BuildingOfficeIcon, section: 'personal', requiredPermissions: ['view_internal_jobs'], requiredFeature: 'RECRUITMENT', allowedRoles: ['EMPLOYEE'] },

  // System
  { id: 'help', label: 'Help Center', href: '/help', icon: QuestionMarkCircleIcon, section: 'system', requiredPermissions: [] },

  // Platform
  { id: 'platform-tenants', label: 'Tenants', href: '/platform/tenants', icon: ServerStackIcon, section: 'platform', requiredPermissions: ['manage_tenants'] },
  { id: 'platform-features', label: 'Feature Registry', href: '/platform/features', icon: Cog6ToothIcon, section: 'platform', requiredPermissions: ['manage_features'] },
];

export const SECTION_ORDER: NavSection[] = [
  'overview',
  'recruitment',
  'hr_core',
  'talent',
  'engagement',
  'analytics',
  'administration',
  'integrations',
  'candidate_portal',
  'communication',
  'workflow',
  'personal',
  'system',
  'platform',
];

export const SECTION_ICONS: Record<NavSection, ComponentType<any>> = {
  overview: Squares2X2Icon,
  recruitment: BriefcaseIcon,
  hr_core: UsersIcon,
  talent: TrophyIcon,
  engagement: HeartIcon,
  analytics: ChartBarIcon,
  administration: ShieldCheckIcon,
  integrations: BoltIcon,
  candidate_portal: UserPlusIcon,
  communication: ChatBubbleLeftIcon,
  workflow: CpuChipIcon,
  personal: UserIcon,
  system: Cog6ToothIcon,
  platform: ServerStackIcon,
};

export const SINGLE_LINK_SECTIONS = new Set<NavSection>(['overview', 'workflow']);

// Applicants and Employees share the same simplified nav: just Personal
// (browsing jobs, tracking applications, profile/interviews/offers, and for
// Employees an added Internal Jobs entry — see 'employee-internal-jobs'
// above) plus System. Recruitment, HR, Communication, and Candidate Portal
// are recruiter-facing sections that would otherwise leak through because
// some of their items only require broad permissions (e.g. view_own_profile,
// view_internal_jobs) that both roles also hold.
const ROLE_HIDDEN_SECTIONS: Partial<Record<UserRole, NavSection[]>> = {
  APPLICANT: ['recruitment', 'hr_core', 'communication', 'candidate_portal'],
  EMPLOYEE: ['recruitment', 'hr_core', 'communication', 'candidate_portal'],
};

export function getHiddenSectionsForRole(role?: UserRole): NavSection[] {
  if (!role) return [];
  return ROLE_HIDDEN_SECTIONS[role] || [];
}

export const sectionLabels: Record<NavSection, string> = {
  overview: 'Overview',
  recruitment: 'Recruitment',
  hr_core: 'HR',
  talent: 'Talent',
  engagement: 'Engagement',
  workflow: 'AI Tools',
  analytics: 'Analytics',
  administration: 'Administration',
  integrations: 'Integrations',
  candidate_portal: 'Candidate Portal',
  communication: 'Communication',
  personal: 'Personal',
  system: 'System',
  platform: 'Platform',
};
