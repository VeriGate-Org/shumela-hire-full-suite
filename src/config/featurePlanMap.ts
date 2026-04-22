/**
 * Maps each feature code to the minimum plan that includes it.
 * Derived from V019__seed_hrms_module_features.sql — lowest plan in included_plans.
 */
export const FEATURE_MINIMUM_PLAN: Record<string, string> = {
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
};
