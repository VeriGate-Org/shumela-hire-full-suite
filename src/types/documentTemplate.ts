export type DocumentTemplateType =
  | 'OFFER_LETTER'
  | 'CONTRACT'
  | 'REJECTION_EMAIL'
  | 'WELCOME_EMAIL'
  | 'NDA'
  | 'PROBATION_LETTER'
  | 'CONFIRMATION_LETTER';

export interface DocumentTemplate {
  id: number;
  type: DocumentTemplateType;
  name: string;
  subject?: string;
  content: string;
  placeholders?: string;
  isDefault: boolean;
  isArchived: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const DOCUMENT_TEMPLATE_TYPES: Record<DocumentTemplateType, string> = {
  OFFER_LETTER: 'Offer Letter',
  CONTRACT: 'Contract',
  REJECTION_EMAIL: 'Rejection Email',
  WELCOME_EMAIL: 'Welcome Email',
  NDA: 'Non-Disclosure Agreement',
  PROBATION_LETTER: 'Probation Letter',
  CONFIRMATION_LETTER: 'Confirmation Letter',
};

export const EMAIL_TYPES: DocumentTemplateType[] = ['REJECTION_EMAIL', 'WELCOME_EMAIL'];

export interface DocumentPlaceholder {
  key: string;
  label: string;
  description: string;
  example: string;
}

export const DOCUMENT_PLACEHOLDERS: DocumentPlaceholder[] = [
  { key: 'candidateName', label: 'Candidate Name', description: 'Full name of the candidate', example: 'Jane Smith' },
  { key: 'jobTitle', label: 'Job Title', description: 'Title of the position', example: 'Senior Software Engineer' },
  { key: 'department', label: 'Department', description: 'Department name', example: 'Engineering' },
  { key: 'startDate', label: 'Start Date', description: 'Expected start date', example: '1 April 2026' },
  { key: 'salary', label: 'Salary', description: 'Offered salary amount', example: 'R 850,000 per annum' },
  { key: 'companyName', label: 'Company Name', description: 'Organization name', example: 'Acme Corp' },
  { key: 'managerName', label: 'Manager Name', description: 'Hiring manager name', example: 'John Doe' },
  { key: 'offerDeadline', label: 'Offer Deadline', description: 'Deadline to accept the offer', example: '15 March 2026' },
];
