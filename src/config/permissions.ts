import { UserRole } from '@/contexts/AuthContext';

export const rolePermissions: Record<UserRole, string[]> = {
  PLATFORM_OWNER: [
    'view_dashboard',
    'platform_admin', 'manage_features', 'manage_tenants',
  ],
  ADMIN: [
    'view_admin_console',
    'view_approvals',
    'view_dashboard', 'manage_jobs', 'view_applications', 'view_applicants',
    'manage_pipeline', 'view_interviews', 'manage_offers', 'view_internal_jobs',
    'manage_applications', 'manage_workflow', 'view_salary_data',
    'view_analytics', 'view_recruiter_analytics', 'view_reports',
    'manage_permissions', 'view_audit_logs', 'manage_departments',
    'view_training', 'manage_training', 'manage_integrations', 'manage_requisitions',
    // HR module permissions
    'manage_leave', 'view_attendance', 'manage_attendance', 'manage_documents',
    'view_performance', 'manage_performance', 'manage_engagement',
    'manage_compliance', 'view_own_profile',
    // Company documents
    'view_company_documents', 'manage_company_documents',
    // New permissions
    'custom_fields:manage', 'manage_onboarding',
    'feed:view', 'feed:post', 'feed:moderate',
  ],
  EXECUTIVE: [
    'view_approvals',
    'view_dashboard', 'view_internal_jobs',
    'view_analytics', 'view_reports', 'manage_requisitions',
    // Read-only HR analytics access
    'view_performance', 'view_training',
  ],
  HR_MANAGER: [
    'view_admin_console',
    'view_approvals',
    'view_dashboard', 'manage_jobs', 'view_applications', 'view_applicants',
    'manage_pipeline', 'view_interviews', 'manage_offers', 'view_internal_jobs',
    'manage_applications', 'manage_workflow', 'view_salary_data',
    'view_analytics', 'view_recruiter_analytics', 'view_reports',
    'view_training', 'manage_training', 'manage_departments', 'manage_integrations', 'manage_requisitions',
    // HR module permissions
    'manage_leave', 'view_attendance', 'manage_attendance', 'manage_documents',
    'view_performance', 'manage_performance', 'manage_engagement',
    'manage_compliance', 'view_own_profile',
    // Company documents
    'view_company_documents', 'manage_company_documents',
    // New permissions
    'custom_fields:manage', 'manage_onboarding',
    'feed:view', 'feed:post', 'feed:moderate',
  ],
  LINE_MANAGER: [
    'view_dashboard', 'view_internal_jobs', 'view_own_profile',
    'view_training', 'view_performance',
    // Manager-specific
    'manage_leave', 'view_attendance', 'manage_attendance',
    // Self-service
    'manage_documents', 'view_company_documents',
    'manage_onboarding', 'feed:view', 'feed:post',
  ],
  HIRING_MANAGER: [
    'view_approvals',
    'view_dashboard', 'manage_jobs', 'view_applications',
    'manage_pipeline', 'view_interviews', 'manage_offers', 'view_internal_jobs',
    'view_analytics', 'manage_requisitions',
    // Reports: a hiring manager runs and reads recruitment reports on their own
    // vacancies. Granted alongside ReportingController, which class-level
    // restricted /api/reports to ADMIN/HR_MANAGER/EXECUTIVE — without that
    // change this permission would only have produced a nav entry that 403s.
    // Report EXPORT is deliberately not granted: ReportExportController remains
    // ADMIN/HR_MANAGER, and the 'report-export' nav entry is pinned to match.
    'view_reports',
    // Applicants and Application Management were ADMIN/HR_MANAGER/RECRUITER
    // only — Hiring Managers could already reach every backend endpoint
    // these pages need to view the pipeline (search/statistics/attention/
    // filter-options on ApplicationManagementController, and /api/applicants
    // itself, all already allow HIRING_MANAGER) but had no nav entry or
    // page-level permission to get there.
    'view_applicants', 'manage_applications',
  ],
  RECRUITER: [
    'view_approvals',
    'view_dashboard', 'manage_jobs', 'view_applications', 'view_applicants',
    'manage_pipeline', 'view_interviews', 'view_internal_jobs',
    'manage_applications', 'view_salary_data',
    'view_analytics', 'view_recruiter_analytics',
  ],
  INTERVIEWER: [
    'view_dashboard', 'view_interviews', 'view_internal_jobs',
  ],
  EMPLOYEE: [
    'view_dashboard', 'view_internal_jobs', 'view_own_profile',
    // Self-service access (employees use /employee/* pages, not admin pages)
    'manage_leave', 'view_attendance', 'manage_documents', 'view_company_documents',
    'feed:view', 'feed:post',
    // Same job-search self-service Applicants get — Browse Jobs, My
    // Applications, Interview Schedule, My Offers — since an Employee can
    // apply for internal or external roles just like an Applicant can.
    'browse_jobs', 'manage_own_applications', 'view_own_interviews', 'view_own_offers',
  ],
  APPLICANT: [
    'browse_jobs', 'manage_own_applications', 'view_own_profile',
    'view_own_interviews', 'view_own_offers', 'view_internal_jobs',
  ],
};

/**
 * What each permission is, in words a person configuring roles can act on.
 *
 * <p>The catalogue lives beside the defaults deliberately. The product carried <b>two</b>
 * permission vocabularies — this one, which every navigation entry and gate actually reads, and a
 * second inside the Java `PermissionService` (`dash_view`, `admin_roles`, …) that was rendered on
 * the role-permissions page and enforced nothing anywhere. An administrator could tick and untick
 * that matrix all afternoon and change nothing at all.
 *
 * <p>There is now one vocabulary, and it is this one. The server stores only <em>deviations</em>
 * from the defaults above, so these forty-five ids are never restated in another language where
 * they could drift apart again.
 */
export interface PermissionDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  level: 'read' | 'write' | 'admin';
}

export const PERMISSION_CATEGORIES: { id: string; name: string }[] = [
  { id: 'recruitment', name: 'Recruitment' },
  { id: 'candidates', name: 'Candidates & applications' },
  { id: 'interviews', name: 'Interviews & offers' },
  { id: 'analytics', name: 'Analytics & reporting' },
  { id: 'people', name: 'People & HR' },
  { id: 'documents', name: 'Documents' },
  { id: 'self', name: 'Self-service' },
  { id: 'admin', name: 'Administration' },
];

export const PERMISSION_CATALOGUE: PermissionDefinition[] = [
  { id: 'view_dashboard', name: 'View dashboard', description: 'See the role dashboard and its summaries', category: 'analytics', level: 'read' },
  { id: 'view_analytics', name: 'View analytics', description: 'Open the analytics section', category: 'analytics', level: 'read' },
  { id: 'view_recruiter_analytics', name: 'View recruiter analytics', description: 'See per-recruiter performance', category: 'analytics', level: 'read' },
  { id: 'view_reports', name: 'View reports', description: 'Open and export reports', category: 'analytics', level: 'read' },
  { id: 'view_salary_data', name: 'View salary data', description: 'See pay ranges and offer amounts', category: 'analytics', level: 'read' },

  { id: 'manage_jobs', name: 'Manage vacancies', description: 'Create, edit and publish job postings', category: 'recruitment', level: 'write' },
  { id: 'manage_requisitions', name: 'Manage requisitions', description: 'Raise and progress requisitions', category: 'recruitment', level: 'write' },
  { id: 'view_approvals', name: 'View approvals', description: 'See items awaiting an approval decision', category: 'recruitment', level: 'read' },
  { id: 'manage_workflow', name: 'Manage workflow', description: 'Configure approval and pipeline workflow', category: 'recruitment', level: 'admin' },
  { id: 'view_internal_jobs', name: 'View internal jobs', description: 'See the internal job board', category: 'recruitment', level: 'read' },

  { id: 'view_applications', name: 'View applications', description: 'Open application records', category: 'candidates', level: 'read' },
  { id: 'manage_applications', name: 'Manage applications', description: 'Change application state and details', category: 'candidates', level: 'write' },
  { id: 'view_applicants', name: 'View candidates', description: 'Open candidate profiles', category: 'candidates', level: 'read' },
  { id: 'manage_pipeline', name: 'Manage pipeline', description: 'Move candidates between stages', category: 'candidates', level: 'write' },

  { id: 'view_interviews', name: 'View interviews', description: 'See the interview schedule', category: 'interviews', level: 'read' },
  { id: 'manage_offers', name: 'Manage offers', description: 'Prepare, send and revise offers', category: 'interviews', level: 'write' },

  { id: 'view_performance', name: 'View performance', description: 'See performance reviews', category: 'people', level: 'read' },
  { id: 'manage_performance', name: 'Manage performance', description: 'Create and complete reviews', category: 'people', level: 'write' },
  { id: 'manage_engagement', name: 'Manage engagement', description: 'Run surveys and engagement programmes', category: 'people', level: 'write' },
  { id: 'view_training', name: 'View training', description: 'See training courses and enrolments', category: 'people', level: 'read' },
  { id: 'manage_training', name: 'Manage training', description: 'Create courses and manage enrolment', category: 'people', level: 'write' },
  { id: 'manage_leave', name: 'Manage leave', description: 'Request and approve leave', category: 'people', level: 'write' },
  { id: 'view_attendance', name: 'View attendance', description: 'See attendance records', category: 'people', level: 'read' },
  { id: 'manage_attendance', name: 'Manage attendance', description: 'Correct and approve attendance', category: 'people', level: 'write' },
  { id: 'manage_onboarding', name: 'Manage onboarding', description: 'Run onboarding for new starters', category: 'people', level: 'write' },

  { id: 'manage_documents', name: 'Manage documents', description: 'Upload and organise documents', category: 'documents', level: 'write' },
  { id: 'view_company_documents', name: 'View company documents', description: 'Read published company policies', category: 'documents', level: 'read' },
  { id: 'manage_company_documents', name: 'Manage company documents', description: 'Publish policies and require acknowledgement', category: 'documents', level: 'admin' },

  { id: 'browse_jobs', name: 'Browse jobs', description: 'Search and view open vacancies', category: 'self', level: 'read' },
  { id: 'manage_own_applications', name: 'Manage own applications', description: 'Apply for roles and track own applications', category: 'self', level: 'write' },
  { id: 'view_own_profile', name: 'View own profile', description: 'See and edit own profile', category: 'self', level: 'read' },
  { id: 'view_own_interviews', name: 'View own interviews', description: 'See own interview schedule', category: 'self', level: 'read' },
  { id: 'view_own_offers', name: 'View own offers', description: 'See offers made to oneself', category: 'self', level: 'read' },
  { id: 'feed:view', name: 'View the feed', description: 'Read the company feed', category: 'self', level: 'read' },
  { id: 'feed:post', name: 'Post to the feed', description: 'Publish to the company feed', category: 'self', level: 'write' },
  { id: 'feed:moderate', name: 'Moderate the feed', description: 'Remove or edit others’ posts', category: 'self', level: 'admin' },

  { id: 'view_admin_console', name: 'View the admin console', description: 'Open the administration home and see what needs attention', category: 'admin', level: 'read' },
  { id: 'manage_permissions', name: 'Manage permissions', description: 'Change what each role may do — this page', category: 'admin', level: 'admin' },
  { id: 'view_audit_logs', name: 'View audit logs', description: 'Read the tenant audit trail', category: 'admin', level: 'read' },
  { id: 'manage_departments', name: 'Manage departments', description: 'Add and retire departments', category: 'admin', level: 'admin' },
  { id: 'manage_compliance', name: 'Manage compliance', description: 'Handle consents, DSARs and reminders', category: 'admin', level: 'admin' },
  { id: 'manage_integrations', name: 'Manage integrations', description: 'Connect and configure integrations', category: 'admin', level: 'admin' },
  { id: 'custom_fields:manage', name: 'Manage custom fields', description: 'Define custom fields on records', category: 'admin', level: 'admin' },
  { id: 'platform_admin', name: 'Platform administration', description: 'Cross-tenant platform administration', category: 'admin', level: 'admin' },
  { id: 'manage_features', name: 'Manage features', description: 'Enable and disable product features', category: 'admin', level: 'admin' },
  { id: 'manage_tenants', name: 'Manage tenants', description: 'Create and configure tenants', category: 'admin', level: 'admin' },
];

/**
 * Permissions that cannot be revoked from the role that administers them.
 *
 * <p>Mirrors `PermissionService.LOCKED_PERMISSIONS` on the server, which is where it is enforced —
 * this copy only stops the interface offering a control the server will refuse. Removing
 * `manage_permissions` from ADMIN hides this page from the only people who could put it back, and
 * no amount of confirming makes that recoverable.
 */
export const LOCKED_PERMISSIONS: Partial<Record<UserRole, string[]>> = {
  ADMIN: ['manage_permissions'],
  PLATFORM_OWNER: ['platform_admin'],
};

export function isPermissionLocked(role: UserRole, permissionId: string): boolean {
  return (LOCKED_PERMISSIONS[role] ?? []).includes(permissionId);
}

/** One stored deviation from a role's defaults. */
export interface RolePermissionOverride {
  role: string;
  permissionId: string;
  granted: boolean;
}

/**
 * What a role may actually do: its defaults, plus grants, minus revocations.
 *
 * <p>Applying deviations to the defaults — rather than storing a snapshot of the whole set — means a
 * permission added to a role in a later release reaches every tenant, instead of being masked by a
 * copy taken the day an administrator first opened the page.
 */
export function effectivePermissions(
  role: UserRole,
  overrides: RolePermissionOverride[] = [],
): string[] {
  const effective = new Set(rolePermissions[role] ?? []);
  for (const o of overrides) {
    if (o.role !== role) continue;
    if (o.granted) effective.add(o.permissionId);
    else if (!isPermissionLocked(role, o.permissionId)) effective.delete(o.permissionId);
  }
  return [...effective];
}
