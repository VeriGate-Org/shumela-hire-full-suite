import { apiFetch } from '@/lib/api-fetch';
import type { LookupsData } from '@/types/lookups';

export const FALLBACK_LOOKUPS: LookupsData = {
  employmentTypes: [
    { value: 'FULL_TIME', label: 'Full-time', description: 'Standard full-time employment', cssClass: 'bg-blue-100 text-blue-800', icon: '💼' },
    { value: 'PART_TIME', label: 'Part-time', description: 'Part-time employment with reduced hours', cssClass: 'bg-green-100 text-green-800', icon: '⏱️' },
    { value: 'CONTRACT', label: 'Contract', description: 'Fixed-term contract position', cssClass: 'bg-purple-100 text-purple-800', icon: '📋' },
    { value: 'TEMPORARY', label: 'Temporary', description: 'Temporary position for specific duration', cssClass: 'bg-yellow-100 text-yellow-800', icon: '⏰' },
    { value: 'FREELANCE', label: 'Freelance', description: 'Independent contractor/freelance work', cssClass: 'bg-indigo-100 text-indigo-800', icon: '🎯' },
    { value: 'INTERNSHIP', label: 'Internship', description: 'Internship or training position', cssClass: 'bg-orange-100 text-orange-800', icon: '🎓' },
    { value: 'APPRENTICESHIP', label: 'Apprenticeship', description: 'Formal apprenticeship program', cssClass: 'bg-pink-100 text-pink-800', icon: '🔧' },
    { value: 'VOLUNTEER', label: 'Volunteer', description: 'Volunteer position', cssClass: 'bg-gray-100 text-gray-800', icon: '❤️' },
  ],
  experienceLevels: [
    { value: 'ENTRY_LEVEL', label: 'Entry Level', description: '0-2 years of experience', minYears: 0, maxYears: 2, cssClass: 'bg-green-100 text-green-800', icon: '🌱' },
    { value: 'JUNIOR', label: 'Junior', description: '1-3 years of experience', minYears: 1, maxYears: 3, cssClass: 'bg-blue-100 text-blue-800', icon: '🌿' },
    { value: 'MID_LEVEL', label: 'Mid-Level', description: '3-6 years of experience', minYears: 3, maxYears: 6, cssClass: 'bg-yellow-100 text-yellow-800', icon: '🌳' },
    { value: 'SENIOR', label: 'Senior', description: '6-10 years of experience', minYears: 6, maxYears: 10, cssClass: 'bg-orange-100 text-orange-800', icon: '🏆' },
    { value: 'LEAD', label: 'Lead', description: '8+ years with leadership experience', minYears: 8, maxYears: 15, cssClass: 'bg-purple-100 text-purple-800', icon: '👑' },
    { value: 'EXECUTIVE', label: 'Executive', description: '10+ years with executive experience', minYears: 10, maxYears: 25, cssClass: 'bg-red-100 text-red-800', icon: '💎' },
    { value: 'EXPERT', label: 'Expert', description: '15+ years of specialized expertise', minYears: 15, maxYears: 30, cssClass: 'bg-indigo-100 text-indigo-800', icon: '🎯' },
  ],
  interviewTypes: [
    { value: 'PHONE', label: 'Phone Interview', isRemote: true, requiresLocation: false },
    { value: 'VIDEO', label: 'Video Interview', isRemote: true, requiresLocation: false },
    { value: 'IN_PERSON', label: 'In-Person Interview', isRemote: false, requiresLocation: true },
    { value: 'PANEL', label: 'Panel Interview', isRemote: false, requiresLocation: true },
    { value: 'TECHNICAL', label: 'Technical Interview', isRemote: false, requiresLocation: false },
    { value: 'BEHAVIOURAL', label: 'Behavioural Interview', isRemote: false, requiresLocation: false },
    { value: 'COMPETENCY', label: 'Competency Interview', isRemote: false, requiresLocation: false },
    { value: 'GROUP', label: 'Group Interview', isRemote: false, requiresLocation: true },
    { value: 'PRESENTATION', label: 'Presentation Interview', isRemote: false, requiresLocation: true },
    { value: 'CASE_STUDY', label: 'Case Study Interview', isRemote: false, requiresLocation: false },
  ],
  interviewRounds: [
    { value: 'SCREENING', label: 'Phone Screening', order: 1 },
    { value: 'FIRST_ROUND', label: 'First Interview', order: 2 },
    { value: 'TECHNICAL', label: 'Technical Assessment', order: 3 },
    { value: 'SECOND_ROUND', label: 'Second Interview', order: 4 },
    { value: 'PANEL', label: 'Panel Interview', order: 5 },
    { value: 'MANAGER', label: 'Manager Interview', order: 6 },
    { value: 'FINAL', label: 'Final Interview', order: 7 },
    { value: 'OFFER', label: 'Offer Discussion', order: 8 },
  ],
  applicationStatuses: [
    { value: 'SUBMITTED', label: 'Submitted', description: 'Application has been submitted and is pending review', cssClass: 'bg-blue-100 text-blue-800' },
    { value: 'SCREENING', label: 'Screening', description: 'Application is being reviewed by HR/Recruiter', cssClass: 'bg-yellow-100 text-yellow-800' },
    { value: 'INTERVIEW_SCHEDULED', label: 'Interview Scheduled', description: 'Interview has been scheduled with the candidate', cssClass: 'bg-purple-100 text-purple-800' },
    { value: 'INTERVIEW_COMPLETED', label: 'Interview Completed', description: 'Interview has been completed, awaiting decision', cssClass: 'bg-purple-100 text-purple-800' },
    { value: 'REFERENCE_CHECK', label: 'Reference Check', description: 'Checking candidate references', cssClass: 'bg-indigo-100 text-indigo-800' },
    { value: 'OFFER_PENDING', label: 'Offer Pending', description: 'Offer is being prepared', cssClass: 'bg-green-100 text-green-800' },
    { value: 'OFFERED', label: 'Offered', description: 'Job offer has been extended to candidate', cssClass: 'bg-green-100 text-green-800' },
    { value: 'OFFER_ACCEPTED', label: 'Offer Accepted', description: 'Candidate has accepted the job offer', cssClass: 'bg-emerald-100 text-emerald-800' },
    { value: 'OFFER_DECLINED', label: 'Offer Declined', description: 'Candidate has declined the job offer', cssClass: 'bg-orange-100 text-orange-800' },
    { value: 'REJECTED', label: 'Rejected', description: 'Application has been rejected', cssClass: 'bg-red-100 text-red-800' },
    { value: 'WITHDRAWN', label: 'Withdrawn', description: 'Application has been withdrawn by candidate', cssClass: 'bg-red-100 text-red-800' },
    { value: 'HIRED', label: 'Hired', description: 'Candidate has been successfully hired and onboarded', cssClass: 'bg-emerald-100 text-emerald-800' },
  ],
  positionLevels: [
    { value: 'JUNIOR', label: 'Junior' },
    { value: 'MID', label: 'Mid' },
    { value: 'SENIOR', label: 'Senior' },
    { value: 'LEAD', label: 'Lead' },
    { value: 'PRINCIPAL', label: 'Principal' },
    { value: 'DIRECTOR', label: 'Director' },
    { value: 'VP', label: 'VP' },
    { value: 'C_SUITE', label: 'C-Suite' },
  ],
  applicationSources: [
    { value: 'EXTERNAL', label: 'Job Board / Website', category: 'BOTH' },
    { value: 'INTERNAL', label: 'Internal Posting', category: 'BOTH' },
    { value: 'REFERRAL', label: 'Employee Referral', category: 'BOTH' },
    { value: 'RECRUITER', label: 'Recruiter Contact', category: 'BOTH' },
    { value: 'SOCIAL_MEDIA', label: 'Social Media', category: 'BOTH' },
    { value: 'LINKEDIN', label: 'LinkedIn', category: 'REPORT' },
    { value: 'INDEED', label: 'Indeed', category: 'REPORT' },
    { value: 'PNET', label: 'PNet', category: 'REPORT' },
    { value: 'CAREER_JUNCTION', label: 'CareerJunction', category: 'REPORT' },
    { value: 'CAREER_FAIR', label: 'Career Fair', category: 'REPORT' },
    { value: 'COMPANY_WEBSITE', label: 'Company Website', category: 'REPORT' },
    { value: 'DIRECT_APPLICATION', label: 'Direct Application', category: 'REPORT' },
    { value: 'OTHER', label: 'Other', category: 'FORM' },
  ],
  salaryCurrencies: [
    { value: 'ZAR', label: 'ZAR (South African Rand)', code: 'ZAR' },
    { value: 'USD', label: 'USD (US Dollar)', code: 'USD' },
    { value: 'EUR', label: 'EUR (Euro)', code: 'EUR' },
    { value: 'GBP', label: 'GBP (British Pound)', code: 'GBP' },
  ],
  leaveAccrualMethods: [
    { value: 'ANNUAL', label: 'Annual' },
    { value: 'MONTHLY', label: 'Monthly' },
    { value: 'BIWEEKLY', label: 'Bi-Weekly' },
    { value: 'ON_HIRE_DATE', label: 'On Hire Date' },
  ],
  sageEntityTypes: [
    { value: 'EMPLOYEE', label: 'Employee' },
    { value: 'DEPARTMENT', label: 'Department' },
    { value: 'POSITION', label: 'Position' },
    { value: 'SALARY', label: 'Salary' },
    { value: 'LEAVE', label: 'Leave' },
    { value: 'COST_CENTRE', label: 'Cost Centre' },
    { value: 'TAX', label: 'Tax' },
    { value: 'BENEFITS', label: 'Benefits' },
  ],
  sageSyncDirections: [
    { value: 'INBOUND', label: 'Inbound (Sage to ShumelaHire)' },
    { value: 'OUTBOUND', label: 'Outbound (ShumelaHire to Sage)' },
    { value: 'BIDIRECTIONAL', label: 'Bidirectional' },
  ],
  sageSyncFrequencies: [
    { value: 'EVERY_15_MINUTES', label: 'Every 15 Minutes', cronExpression: '0 */15 * * * *' },
    { value: 'EVERY_30_MINUTES', label: 'Every 30 Minutes', cronExpression: '0 */30 * * * *' },
    { value: 'HOURLY', label: 'Hourly', cronExpression: '0 0 * * * *' },
    { value: 'EVERY_6_HOURS', label: 'Every 6 Hours', cronExpression: '0 0 */6 * * *' },
    { value: 'DAILY', label: 'Daily (midnight)', cronExpression: '0 0 0 * * *' },
    { value: 'WEEKLY', label: 'Weekly (Sunday midnight)', cronExpression: '0 0 0 * * SUN' },
    { value: 'MONTHLY', label: 'Monthly (1st at midnight)', cronExpression: '0 0 0 1 * *' },
    { value: 'CUSTOM', label: 'Custom Cron Expression', cronExpression: '' },
  ],
  contactSubjects: [
    { value: 'GENERAL_ENQUIRY', label: 'General Enquiry' },
    { value: 'SALES', label: 'Sales' },
    { value: 'SUPPORT', label: 'Support' },
    { value: 'PARTNERSHIP', label: 'Partnership' },
  ],
  workflowTriggers: [
    { id: 'app_received', type: 'application_received' as const, name: 'Application Received', description: 'Triggered when a new job application is submitted' },
    { id: 'interview_scheduled', type: 'interview_scheduled' as const, name: 'Interview Scheduled', description: 'Triggered when an interview is scheduled with a candidate' },
    { id: 'interview_completed', type: 'interview_completed' as const, name: 'Interview Completed', description: 'Triggered when an interview is marked as completed' },
    { id: 'offer_extended', type: 'offer_extended' as const, name: 'Offer Extended', description: 'Triggered when a job offer is extended to a candidate' },
    { id: 'offer_accepted', type: 'offer_accepted' as const, name: 'Offer Accepted', description: 'Triggered when a candidate accepts a job offer' },
    { id: 'manual', type: 'manual' as const, name: 'Manual Trigger', description: 'Manually triggered by a user when needed' },
  ],
  workflowActionTypes: [
    { type: 'send_email', name: 'Send Email', description: 'Send automated email to specified recipients', icon: '📧', config: { recipients: { type: 'array', label: 'Recipients', required: true }, subject: { type: 'string', label: 'Subject', required: true }, template: { type: 'select', label: 'Email Template', required: true } } },
    { type: 'create_task', name: 'Create Task', description: 'Create a task for team members', icon: '✅', config: { assignee: { type: 'select', label: 'Assignee', required: true }, title: { type: 'string', label: 'Task Title', required: true }, description: { type: 'text', label: 'Description', required: false }, dueDate: { type: 'number', label: 'Due in (days)', required: false } } },
    { type: 'update_status', name: 'Update Status', description: 'Update application or candidate status', icon: '🔄', config: { entity: { type: 'select', label: 'Entity Type', required: true }, status: { type: 'select', label: 'New Status', required: true } } },
    { type: 'schedule_interview', name: 'Schedule Interview', description: 'Automatically schedule interview with candidate', icon: '📅', config: { interviewer: { type: 'select', label: 'Interviewer', required: true }, duration: { type: 'number', label: 'Duration (minutes)', required: true }, type: { type: 'select', label: 'Interview Type', required: true } } },
    { type: 'generate_report', name: 'Generate Report', description: 'Generate and send automated report', icon: '📊', config: { reportTemplate: { type: 'select', label: 'Report Template', required: true }, recipients: { type: 'array', label: 'Recipients', required: true } } },
    { type: 'approve_request', name: 'Approve Request', description: 'Automatically approve pending requests', icon: '✅', config: { requestType: { type: 'select', label: 'Request Type', required: true } } },
    { type: 'notify_team', name: 'Notify Team', description: 'Send notification to team members', icon: '🔔', config: { team: { type: 'select', label: 'Team', required: true }, message: { type: 'text', label: 'Message', required: true }, channel: { type: 'select', label: 'Notification Channel', required: true } } },
  ],
};

export const lookupService = {
  async getAll(): Promise<LookupsData> {
    try {
      const response = await apiFetch('/api/lookups');
      if (!response.ok) return FALLBACK_LOOKUPS;
      const data = await response.json();
      return data as LookupsData;
    } catch {
      return FALLBACK_LOOKUPS;
    }
  },
};
