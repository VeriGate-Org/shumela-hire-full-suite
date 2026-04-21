/**
 * Centralized enum color registry with dark mode support.
 * All enum badge/pill colors should be sourced from here.
 */

export const PILL_VARIANTS: Record<string, string> = {
  gray: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600',
  green: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700',
  red: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900 dark:text-red-300 dark:border-red-700',
  yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700',
  orange: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-700',
  blue: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700',
  purple: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-700',
  teal: 'bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-900 dark:text-teal-300 dark:border-teal-700',
  gold: 'bg-gold-100 text-gold-800 border-gold-300 dark:bg-gold-900 dark:text-gold-300 dark:border-gold-700',
  emerald: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900 dark:text-emerald-300 dark:border-emerald-700',
  indigo: 'bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-900 dark:text-indigo-300 dark:border-indigo-700',
  slate: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600',
  amber: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900 dark:text-amber-300 dark:border-amber-700',
  greenSolid: 'bg-green-600 text-white border-green-600 dark:bg-green-700 dark:text-white dark:border-green-700',
  redSolid: 'bg-red-600 text-white border-red-600 dark:bg-red-700 dark:text-white dark:border-red-700',
};

export const ENUM_COLORS: Record<string, Record<string, string>> = {
  applicationStatus: {
    SUBMITTED: 'slate',
    SCREENING: 'gold',
    INTERVIEW_SCHEDULED: 'purple',
    INTERVIEW_COMPLETED: 'indigo',
    REFERENCE_CHECK: 'yellow',
    OFFER_PENDING: 'amber',
    OFFERED: 'emerald',
    OFFER_ACCEPTED: 'green',
    OFFER_DECLINED: 'orange',
    HIRED: 'greenSolid',
    REJECTED: 'red',
    WITHDRAWN: 'gray',
  },

  pipelineStage: {
    APPLICATION_RECEIVED: 'gray',
    INITIAL_SCREENING: 'gold',
    PHONE_SCREENING: 'gold',
    FIRST_INTERVIEW: 'purple',
    TECHNICAL_ASSESSMENT: 'purple',
    SECOND_INTERVIEW: 'purple',
    PANEL_INTERVIEW: 'purple',
    MANAGER_INTERVIEW: 'purple',
    FINAL_INTERVIEW: 'purple',
    REFERENCE_CHECK: 'yellow',
    BACKGROUND_CHECK: 'yellow',
    OFFER_PREPARATION: 'green',
    OFFER_EXTENDED: 'green',
    OFFER_NEGOTIATION: 'green',
    OFFER_ACCEPTED: 'green',
    HIRED: 'greenSolid',
    REJECTED: 'red',
    WITHDRAWN: 'gray',
    OFFER_DECLINED: 'orange',
    NO_SHOW: 'red',
    DUPLICATE: 'slate',
  },

  interviewStatus: {
    CONFIRMED: 'green',
    SCHEDULED: 'gold',
    IN_PROGRESS: 'blue',
    COMPLETED: 'gray',
    CANCELLED: 'red',
    RESCHEDULED: 'yellow',
    NO_SHOW: 'red',
    POSTPONED: 'amber',
  },

  interviewType: {
    PHONE: 'blue',
    VIDEO: 'purple',
    IN_PERSON: 'teal',
    PANEL: 'indigo',
    TECHNICAL: 'orange',
    BEHAVIOURAL: 'gold',
    COMPETENCY: 'emerald',
    GROUP: 'purple',
    PRESENTATION: 'amber',
    CASE_STUDY: 'blue',
  },

  interviewRecommendation: {
    HIRE: 'green',
    CONSIDER: 'yellow',
    REJECT: 'red',
    ANOTHER_ROUND: 'gold',
    ON_HOLD: 'gray',
    SECOND_OPINION: 'gold',
  },

  employmentType: {
    FULL_TIME: 'blue',
    PART_TIME: 'purple',
    CONTRACT: 'orange',
    TEMPORARY: 'amber',
    FREELANCE: 'teal',
    INTERNSHIP: 'green',
    APPRENTICESHIP: 'emerald',
    VOLUNTEER: 'gray',
  },

  offerStatus: {
    PENDING: 'yellow',
    DRAFT: 'gray',
    PENDING_APPROVAL: 'amber',
    APPROVED: 'blue',
    SENT: 'blue',
    ACCEPTED: 'green',
    DECLINED: 'red',
    REJECTED: 'red',
    EXPIRED: 'gray',
    NEGOTIATING: 'gold',
    COUNTER_OFFERED: 'gold',
    UNDER_NEGOTIATION: 'gold',
    AWAITING_SIGNATURE: 'orange',
    SIGNED: 'greenSolid',
    SUPERSEDED: 'gray',
    WITHDRAWN: 'red',
  },

  requisitionStatus: {
    DRAFT: 'gray',
    SUBMITTED: 'blue',
    PENDING_HR_APPROVAL: 'yellow',
    PENDING_HIRING_MANAGER_APPROVAL: 'orange',
    PENDING_EXECUTIVE_APPROVAL: 'purple',
    APPROVED: 'green',
    REJECTED: 'red',
  },

  jobAdStatus: {
    DRAFT: 'gray',
    PUBLISHED: 'green',
    EXPIRED: 'red',
    UNPUBLISHED: 'yellow',
  },

  postingStatus: {
    DRAFT: 'gray',
    ACTIVE: 'green',
    PAUSED: 'yellow',
    CLOSED: 'red',
    EXPIRED: 'gray',
  },

  backgroundCheckStatus: {
    INITIATED: 'blue',
    PENDING_CONSENT: 'amber',
    IN_PROGRESS: 'indigo',
    PARTIAL_RESULTS: 'purple',
    COMPLETED: 'emerald',
    FAILED: 'red',
    CANCELLED: 'gray',
  },

  backgroundCheckResult: {
    CLEAR: 'emerald',
    ADVERSE: 'red',
    PENDING_REVIEW: 'amber',
    INCONCLUSIVE: 'gray',
  },

  cycleStatus: {
    PLANNING: 'gray',
    ACTIVE: 'green',
    MID_YEAR: 'blue',
    FINAL_REVIEW: 'purple',
    CLOSED: 'red',
  },

  contractStatus: {
    DRAFT: 'gray',
    SUBMITTED: 'yellow',
    APPROVED: 'green',
    REJECTED: 'red',
    ACTIVE: 'blue',
  },

  goalType: {
    STRATEGIC: 'purple',
    OPERATIONAL: 'blue',
    DEVELOPMENT: 'green',
    BEHAVIORAL: 'orange',
  },

  goalStatus: {
    NOT_STARTED: 'gray',
    IN_PROGRESS: 'blue',
    ON_TRACK: 'green',
    AT_RISK: 'yellow',
    BEHIND: 'red',
    COMPLETED: 'emerald',
    CANCELLED: 'gray',
  },

  reviewStatus: {
    PENDING: 'yellow',
    EMPLOYEE_SUBMITTED: 'blue',
    MANAGER_SUBMITTED: 'purple',
    COMPLETED: 'green',
  },

  salaryRecommendationStatus: {
    DRAFT: 'gray',
    PENDING_REVIEW: 'yellow',
    RECOMMENDED: 'blue',
    PENDING_APPROVAL: 'orange',
    APPROVED: 'green',
    REJECTED: 'red',
    RETURNED: 'purple',
    IMPLEMENTED: 'emerald',
  },

  urgency: {
    LOW: 'gray',
    MEDIUM: 'blue',
    HIGH: 'orange',
    CRITICAL: 'red',
  },

  priority: {
    LOW: 'gray',
    MEDIUM: 'blue',
    HIGH: 'orange',
    CRITICAL: 'red',
    URGENT: 'redSolid',
  },

  impact: {
    LOW: 'gray',
    MEDIUM: 'blue',
    HIGH: 'orange',
    CRITICAL: 'red',
  },

  readiness: {
    READY_NOW: 'green',
    READY_1_YEAR: 'blue',
    READY_2_YEARS: 'yellow',
    DEVELOPING: 'orange',
    NOT_READY: 'red',
  },

  category: {
    HIRING: 'blue',
    PERFORMANCE: 'purple',
    COMPLIANCE: 'red',
    DIVERSITY: 'teal',
    BUDGET: 'amber',
    RECRUITMENT: 'gold',
    RETENTION: 'orange',
    TRAINING: 'green',
    COMPENSATION: 'emerald',
    TALENT: 'indigo',
    WORKFORCE: 'slate',
    OPERATIONAL: 'blue',
    STRATEGIC: 'purple',
  },

  userRole: {
    ADMIN: 'purple',
    HR: 'blue',
    HIRING_MANAGER: 'teal',
    INTERVIEWER: 'orange',
    EXECUTIVE: 'indigo',
    APPLICANT: 'green',
    RECRUITER: 'gold',
  },

  auditAction: {
    CREATE: 'green',
    UPDATE: 'gold',
    DELETE: 'red',
    APPROVE: 'green',
    REJECT: 'red',
    LOGIN: 'blue',
    EXPORT: 'purple',
    SUBMIT: 'blue',
    WITHDRAW: 'orange',
  },

  budgetStatus: {
    on_track: 'green',
    over_budget: 'red',
    under_utilized: 'gold',
    needs_attention: 'yellow',
    approved: 'green',
    rejected: 'red',
    pending: 'orange',
    needs_info: 'yellow',
  },

  leaveStatus: {
    DRAFT: 'gray',
    PENDING: 'yellow',
    APPROVED: 'green',
    REJECTED: 'red',
    CANCELLED: 'gray',
    RECALLED: 'orange',
  },

  attendanceStatus: {
    PRESENT: 'green',
    LATE: 'yellow',
    ABSENT: 'red',
    HALF_DAY: 'orange',
    ON_LEAVE: 'blue',
  },

  overtimeStatus: {
    PENDING: 'yellow',
    APPROVED: 'green',
    REJECTED: 'red',
  },

  encashmentStatus: {
    PENDING: 'yellow',
    HR_APPROVED: 'blue',
    FINANCE_APPROVED: 'green',
    REJECTED: 'red',
    PROCESSED: 'gray',
  },

  shiftStatus: {
    ACTIVE: 'green',
    INACTIVE: 'gray',
  },
};

/** Get Tailwind classes for an enum value's pill color. Tries exact match, then uppercase. */
export function getEnumColor(domain: string, value: string): string {
  const domainMap = ENUM_COLORS[domain];
  const variantKey = domainMap?.[value] ?? domainMap?.[value.toUpperCase()] ?? 'gray';
  return PILL_VARIANTS[variantKey] ?? PILL_VARIANTS.gray;
}

/** Get just the variant key (e.g. 'green', 'red') for custom usage */
export function getEnumVariant(domain: string, value: string): string {
  return ENUM_COLORS[domain]?.[value] ?? 'gray';
}
