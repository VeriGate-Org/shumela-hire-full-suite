/**
 * Module-based feature mapping.
 * Each module maps to the set of features it grants.
 * Used as a client-side fallback when the backend API is unavailable.
 */
export const MODULE_FEATURES: Record<string, string[]> = {
  RECRUITMENT: ['RECRUITMENT', 'POPIA_COMPLIANCE'],
  AI: ['AI_ENABLED', 'AI_SEARCH', 'AI_EMAIL_DRAFTER', 'AI_JOB_DESCRIPTION', 'AI_SALARY_BENCHMARK'],
  ANALYTICS: ['ADVANCED_ANALYTICS', 'REPORT_EXPORT'],
  ADMINISTRATION: ['CUSTOM_BRANDING'],
  HR_CORE: ['LEAVE_MANAGEMENT', 'TIME_ATTENDANCE', 'SHIFT_SCHEDULING', 'EMPLOYEE_SELF_SERVICE', 'EMPLOYEE_DOCUMENTS', 'COMPANY_DOCUMENTS', 'DOCUMENT_RETENTION', 'GEOFENCING'],
  TALENT: ['TRAINING_MANAGEMENT', 'COMPETENCY_MAPPING', 'JOB_TEMPLATES', 'INTERNAL_MOBILITY'],
  ENGAGEMENT: ['EMPLOYEE_ENGAGEMENT', 'PULSE_SURVEYS', 'RECOGNITION_REWARDS', 'SOCIAL_FEED'],
  COMPLIANCE: ['LABOUR_RELATIONS', 'DOCUMENT_TEMPLATES', 'POPIA_COMPLIANCE'],
  INTEGRATIONS: ['SAGE_300_PEOPLE', 'AD_SSO', 'WORKFLOW_MANAGEMENT', 'AGENCY_MANAGEMENT'],
};

/**
 * Maps each feature code to the minimum plan that includes it.
 * Derived from V019__seed_hrms_module_features.sql — lowest plan in included_plans.
 */
export const FEATURE_MINIMUM_PLAN: Record<string, string> = {
  RECRUITMENT: 'Starter',
  LEAVE_MANAGEMENT: 'Starter',
  TIME_ATTENDANCE: 'Standard',
  SHIFT_SCHEDULING: 'Standard',
  EMPLOYEE_SELF_SERVICE: 'Starter',
  EMPLOYEE_DOCUMENTS: 'Starter',
  TRAINING_MANAGEMENT: 'Standard',
  COMPETENCY_MAPPING: 'Enterprise',
  EMPLOYEE_ENGAGEMENT: 'Standard',
  PULSE_SURVEYS: 'Standard',
  RECOGNITION_REWARDS: 'Enterprise',
  WORKFLOW_MANAGEMENT: 'Standard',
  AI_ENABLED: 'Standard',
  AI_SEARCH: 'Standard',
  AI_EMAIL_DRAFTER: 'Standard',
  AI_JOB_DESCRIPTION: 'Standard',
  AI_SALARY_BENCHMARK: 'Standard',
  ADVANCED_ANALYTICS: 'Standard',
  REPORT_EXPORT: 'Starter',
  POPIA_COMPLIANCE: 'Starter',
  LABOUR_RELATIONS: 'Standard',
  CUSTOM_BRANDING: 'Enterprise',
  DOCUMENT_TEMPLATES: 'Standard',
  SAGE_300_PEOPLE: 'Standard',
  AD_SSO: 'Standard',
  SOCIAL_FEED: 'Standard',
  GEOFENCING: 'Standard',
  COMPANY_DOCUMENTS: 'Standard',
  DOCUMENT_RETENTION: 'Enterprise',
  JOB_TEMPLATES: 'Standard',
  INTERNAL_MOBILITY: 'Standard',
  AGENCY_MANAGEMENT: 'Enterprise',
};
