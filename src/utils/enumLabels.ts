/**
 * Centralized enum-to-display-name registry.
 * All frontend enum display labels should be sourced from here.
 */

export const ENUM_LABELS: Record<string, Record<string, string>> = {
  // Application & Pipeline
  applicationStatus: {
    SUBMITTED: 'Submitted',
    SCREENING: 'Screening',
    INTERVIEW_SCHEDULED: 'Interview Scheduled',
    INTERVIEW_COMPLETED: 'Interview Completed',
    REFERENCE_CHECK: 'Reference Check',
    OFFER_PENDING: 'Offer Pending',
    OFFERED: 'Offered',
    OFFER_ACCEPTED: 'Offer Accepted',
    OFFER_DECLINED: 'Offer Declined',
    HIRED: 'Hired',
    REJECTED: 'Rejected',
    WITHDRAWN: 'Withdrawn',
  },

  pipelineStage: {
    APPLICATION_RECEIVED: 'Application Received',
    INITIAL_SCREENING: 'Initial Screening',
    PHONE_SCREENING: 'Phone Screening',
    FIRST_INTERVIEW: 'First Interview',
    TECHNICAL_ASSESSMENT: 'Technical Assessment',
    SECOND_INTERVIEW: 'Second Interview',
    PANEL_INTERVIEW: 'Panel Interview',
    MANAGER_INTERVIEW: 'Manager Interview',
    FINAL_INTERVIEW: 'Final Interview',
    REFERENCE_CHECK: 'Reference Check',
    BACKGROUND_CHECK: 'Background Check',
    OFFER_PREPARATION: 'Offer Preparation',
    OFFER_EXTENDED: 'Offer Extended',
    OFFER_NEGOTIATION: 'Offer Negotiation',
    OFFER_ACCEPTED: 'Offer Accepted',
    HIRED: 'Hired',
    REJECTED: 'Rejected',
    WITHDRAWN: 'Withdrawn',
    OFFER_DECLINED: 'Offer Declined',
    NO_SHOW: 'No Show',
    DUPLICATE: 'Duplicate',
  },

  // Interview
  interviewStatus: {
    CONFIRMED: 'Confirmed',
    SCHEDULED: 'Scheduled',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    RESCHEDULED: 'Rescheduled',
    NO_SHOW: 'No Show',
    POSTPONED: 'Postponed',
  },

  interviewType: {
    PHONE: 'Phone Interview',
    VIDEO: 'Video Interview',
    IN_PERSON: 'In-Person Interview',
    PANEL: 'Panel Interview',
    TECHNICAL: 'Technical Interview',
    BEHAVIOURAL: 'Behavioural Interview',
    COMPETENCY: 'Competency Interview',
    GROUP: 'Group Interview',
    PRESENTATION: 'Presentation Interview',
    CASE_STUDY: 'Case Study Interview',
  },

  interviewRound: {
    SCREENING: 'Phone Screening',
    FIRST_ROUND: 'First Interview',
    TECHNICAL: 'Technical Assessment',
    SECOND_ROUND: 'Second Interview',
    PANEL: 'Panel Interview',
    MANAGER: 'Manager Interview',
    FINAL: 'Final Interview',
    OFFER: 'Offer Discussion',
  },

  interviewRecommendation: {
    HIRE: 'Recommend for Hire',
    CONSIDER: 'Consider with Reservations',
    REJECT: 'Do Not Recommend',
    ANOTHER_ROUND: 'Recommend Another Round',
    ON_HOLD: 'Put on Hold',
    SECOND_OPINION: 'Needs Second Opinion',
  },

  // Employment
  employmentType: {
    FULL_TIME: 'Full-time',
    PART_TIME: 'Part-time',
    CONTRACT: 'Contract',
    TEMPORARY: 'Temporary',
    FREELANCE: 'Freelance',
    INTERNSHIP: 'Internship',
    APPRENTICESHIP: 'Apprenticeship',
    VOLUNTEER: 'Volunteer',
  },

  experienceLevel: {
    ENTRY_LEVEL: 'Entry Level',
    JUNIOR: 'Junior',
    MID_LEVEL: 'Mid-Level',
    SENIOR: 'Senior',
    LEAD: 'Lead',
    EXECUTIVE: 'Executive',
    EXPERT: 'Expert',
  },

  // Offers
  offerStatus: {
    PENDING: 'Pending',
    DRAFT: 'Draft',
    PENDING_APPROVAL: 'Pending Approval',
    APPROVED: 'Approved',
    SENT: 'Sent',
    ACCEPTED: 'Accepted',
    DECLINED: 'Declined',
    REJECTED: 'Rejected',
    EXPIRED: 'Expired',
    NEGOTIATING: 'Negotiating',
    COUNTER_OFFERED: 'Counter Offered',
    UNDER_NEGOTIATION: 'Under Negotiation',
    AWAITING_SIGNATURE: 'Awaiting Signature',
    SIGNED: 'Signed',
    SUPERSEDED: 'Superseded',
    WITHDRAWN: 'Withdrawn',
  },

  offerType: {
    FULL_TIME_PERMANENT: 'Full-Time Permanent',
    PART_TIME_PERMANENT: 'Part-Time Permanent',
    CONTRACT_FIXED_TERM: 'Contract (Fixed Term)',
    CONTRACT_RENEWABLE: 'Contract (Renewable)',
    CONSULTANT: 'Consultant',
    INTERNSHIP: 'Internship',
    APPRENTICESHIP: 'Apprenticeship',
    TEMPORARY: 'Temporary',
    PROBATIONARY: 'Probationary',
    EXECUTIVE: 'Executive',
  },

  // Requisitions
  requisitionStatus: {
    DRAFT: 'Draft',
    SUBMITTED: 'Submitted',
    PENDING_HR_APPROVAL: 'Pending HR Approval',
    PENDING_HIRING_MANAGER_APPROVAL: 'Pending Manager Approval',
    PENDING_EXECUTIVE_APPROVAL: 'Pending Executive Approval',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
  },

  // Job Ads
  jobAdStatus: {
    DRAFT: 'Draft',
    PUBLISHED: 'Published',
    EXPIRED: 'Expired',
    UNPUBLISHED: 'Unpublished',
  },

  postingStatus: {
    DRAFT: 'Draft',
    ACTIVE: 'Active',
    PAUSED: 'Paused',
    CLOSED: 'Closed',
    EXPIRED: 'Expired',
  },

  publishingChannel: {
    internal: 'Internal Portal',
    external: 'Public Website',
    INTERNAL: 'Internal Portal',
    EXTERNAL: 'Public Website',
  },

  // Background Checks
  backgroundCheckStatus: {
    INITIATED: 'Initiated',
    PENDING_CONSENT: 'Pending Consent',
    IN_PROGRESS: 'In Progress',
    PARTIAL_RESULTS: 'Partial Results',
    COMPLETED: 'Completed',
    FAILED: 'Failed',
    CANCELLED: 'Cancelled',
  },

  backgroundCheckResult: {
    CLEAR: 'Clear',
    ADVERSE: 'Adverse',
    PENDING_REVIEW: 'Pending Review',
    INCONCLUSIVE: 'Inconclusive',
  },

  // Performance Management
  cycleStatus: {
    PLANNING: 'Planning',
    ACTIVE: 'Active',
    MID_YEAR: 'Mid-Year',
    FINAL_REVIEW: 'Final Review',
    CLOSED: 'Closed',
  },

  contractStatus: {
    DRAFT: 'Draft',
    SUBMITTED: 'Submitted',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    ACTIVE: 'Active',
  },

  goalType: {
    STRATEGIC: 'Strategic',
    OPERATIONAL: 'Operational',
    DEVELOPMENT: 'Development',
    BEHAVIORAL: 'Behavioural',
  },

  goalStatus: {
    NOT_STARTED: 'Not Started',
    IN_PROGRESS: 'In Progress',
    ON_TRACK: 'On Track',
    AT_RISK: 'At Risk',
    BEHIND: 'Behind',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  },

  kpiType: {
    QUANTITATIVE: 'Quantitative',
    QUALITATIVE: 'Qualitative',
    BEHAVIORAL: 'Behavioural',
  },

  reviewType: {
    MID_YEAR: 'Mid-Year',
    FINAL: 'Final',
  },

  reviewStatus: {
    PENDING: 'Pending',
    EMPLOYEE_SUBMITTED: 'Employee Submitted',
    MANAGER_SUBMITTED: 'Manager Submitted',
    COMPLETED: 'Completed',
  },

  evidenceType: {
    DOCUMENT: 'Document',
    PRESENTATION: 'Presentation',
    REPORT: 'Report',
    CERTIFICATE: 'Certificate',
    FEEDBACK: 'Feedback',
    OTHER: 'Other',
  },

  // Salary Recommendations
  salaryRecommendationStatus: {
    DRAFT: 'Draft',
    PENDING_REVIEW: 'Pending Review',
    RECOMMENDED: 'Recommended',
    PENDING_APPROVAL: 'Pending Approval',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    RETURNED: 'Returned',
    IMPLEMENTED: 'Implemented',
  },

  // Document Types
  documentType: {
    RESUME: 'Resume',
    COVER_LETTER: 'Cover Letter',
    ID_DOCUMENT: 'ID Document',
    QUALIFICATION: 'Qualification',
    REFERENCE: 'Reference',
    CERTIFICATE: 'Certificate',
    OTHER: 'Other',
  },

  // Severity / Priority / Impact
  urgency: {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    CRITICAL: 'Critical',
  },

  priority: {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    CRITICAL: 'Critical',
    URGENT: 'Urgent',
  },

  impact: {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    CRITICAL: 'Critical',
  },

  readiness: {
    READY_NOW: 'Ready Now',
    READY_1_YEAR: 'Ready in 1 Year',
    READY_2_YEARS: 'Ready in 2 Years',
    DEVELOPING: 'Developing',
    NOT_READY: 'Not Ready',
  },

  // Report / Format
  format: {
    PDF: 'PDF',
    CSV: 'CSV',
    EXCEL: 'Excel',
    HTML: 'HTML',
    JSON: 'JSON',
  },

  category: {
    HIRING: 'Hiring',
    PERFORMANCE: 'Performance',
    COMPLIANCE: 'Compliance',
    DIVERSITY: 'Diversity',
    BUDGET: 'Budget',
    RECRUITMENT: 'Recruitment',
    RETENTION: 'Retention',
    TRAINING: 'Training',
    COMPENSATION: 'Compensation',
    TALENT: 'Talent',
    WORKFORCE: 'Workforce',
    OPERATIONAL: 'Operational',
    STRATEGIC: 'Strategic',
  },

  // User Roles
  userRole: {
    ADMIN: 'Admin',
    HR: 'HR',
    HIRING_MANAGER: 'Hiring Manager',
    INTERVIEWER: 'Interviewer',
    EXECUTIVE: 'Executive',
    APPLICANT: 'Applicant',
    RECRUITER: 'Recruiter',
  },

  // Audit Actions
  auditAction: {
    CREATE: 'Create',
    UPDATE: 'Update',
    DELETE: 'Delete',
    APPROVE: 'Approve',
    REJECT: 'Reject',
    LOGIN: 'Login',
    EXPORT: 'Export',
    SUBMIT: 'Submit',
    WITHDRAW: 'Withdraw',
  },

  // Budget (executive pages use lowercase)
  budgetStatus: {
    on_track: 'On Track',
    over_budget: 'Over Budget',
    under_utilized: 'Under-Utilized',
    needs_attention: 'Needs Attention',
    approved: 'Approved',
    rejected: 'Rejected',
    pending: 'Pending',
    needs_info: 'Needs Info',
  },

  // Work Schedule
  workSchedule: {
    FIXED: 'Fixed',
    FLEXIBLE: 'Flexible',
    SHIFT: 'Shift',
    COMPRESSED: 'Compressed',
    ROTATING: 'Rotating',
  },

  remotePolicy: {
    FULLY_REMOTE: 'Fully Remote',
    HYBRID: 'Hybrid',
    ON_SITE: 'On-Site',
    REMOTE_FIRST: 'Remote-First',
  },

  leaveStatus: {
    DRAFT: 'Draft',
    PENDING: 'Pending',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    CANCELLED: 'Cancelled',
    RECALLED: 'Recalled',
  },

  attendanceStatus: {
    PRESENT: 'Present',
    LATE: 'Late',
    ABSENT: 'Absent',
    HALF_DAY: 'Half Day',
    ON_LEAVE: 'On Leave',
  },

  overtimeStatus: {
    PENDING: 'Pending',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
  },

  encashmentStatus: {
    PENDING: 'Pending',
    HR_APPROVED: 'HR Approved',
    FINANCE_APPROVED: 'Finance Approved',
    REJECTED: 'Rejected',
    PROCESSED: 'Processed',
  },
};

/** Universal fallback: SCREAMING_SNAKE_CASE to Title Case */
export function formatEnumValue(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Lookup with fallback to formatEnumValue. Tries exact match, then uppercase. */
export function getEnumLabel(domain: string, value: string): string {
  const domainMap = ENUM_LABELS[domain];
  if (!domainMap) return formatEnumValue(value);
  return domainMap[value] ?? domainMap[value.toUpperCase()] ?? formatEnumValue(value);
}

// Per-domain typed helpers
export const getStatusLabel = (value: string) => getEnumLabel('applicationStatus', value);
export const getInterviewTypeLabel = (value: string) => getEnumLabel('interviewType', value);
export const getInterviewRoundLabel = (value: string) => getEnumLabel('interviewRound', value);
export const getInterviewStatusLabel = (value: string) => getEnumLabel('interviewStatus', value);
export const getEmploymentTypeLabel = (value: string) => getEnumLabel('employmentType', value);
export const getExperienceLevelLabel = (value: string) => getEnumLabel('experienceLevel', value);
export const getOfferStatusLabel = (value: string) => getEnumLabel('offerStatus', value);
export const getOfferTypeLabel = (value: string) => getEnumLabel('offerType', value);
export const getRequisitionStatusLabel = (value: string) => getEnumLabel('requisitionStatus', value);
export const getJobAdStatusLabel = (value: string) => getEnumLabel('jobAdStatus', value);
export const getChannelLabel = (value: string) => getEnumLabel('publishingChannel', value);
export const getBackgroundCheckStatusLabel = (value: string) => getEnumLabel('backgroundCheckStatus', value);
export const getBackgroundCheckResultLabel = (value: string) => getEnumLabel('backgroundCheckResult', value);
export const getCycleStatusLabel = (value: string) => getEnumLabel('cycleStatus', value);
export const getContractStatusLabel = (value: string) => getEnumLabel('contractStatus', value);
export const getGoalTypeLabel = (value: string) => getEnumLabel('goalType', value);
export const getGoalStatusLabel = (value: string) => getEnumLabel('goalStatus', value);
export const getReviewTypeLabel = (value: string) => getEnumLabel('reviewType', value);
export const getReviewStatusLabel = (value: string) => getEnumLabel('reviewStatus', value);
export const getSalaryRecStatusLabel = (value: string) => getEnumLabel('salaryRecommendationStatus', value);
export const getDocumentTypeLabel = (value: string) => getEnumLabel('documentType', value);
export const getUrgencyLabel = (value: string) => getEnumLabel('urgency', value);
export const getPriorityLabel = (value: string) => getEnumLabel('priority', value);
export const getImpactLabel = (value: string) => getEnumLabel('impact', value);
export const getReadinessLabel = (value: string) => getEnumLabel('readiness', value);
export const getFormatLabel = (value: string) => getEnumLabel('format', value);
export const getCategoryLabel = (value: string) => getEnumLabel('category', value);
export const getUserRoleLabel = (value: string) => getEnumLabel('userRole', value);
export const getAuditActionLabel = (value: string) => getEnumLabel('auditAction', value);
