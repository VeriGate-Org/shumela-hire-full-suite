// Performance Management Types
export interface PerformanceCycle {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  midYearDeadline: string;
  finalReviewDeadline: string;
  status: CycleStatus;
  tenantId: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  isDefault: boolean;
}

export interface PerformanceContract {
  id: string;
  cycle: PerformanceCycle;
  employeeId: string;
  employeeName: string;
  employeeNumber?: string;
  managerId: string;
  managerName: string;
  department?: string;
  jobTitle?: string;
  jobLevel?: string;
  status: ContractStatus;
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  approvalComments?: string;
  rejectionReason?: string;
  version: number;
  goals: PerformanceGoal[];
  reviews: PerformanceReview[];
}

export interface PerformanceGoal {
  id: string;
  contractId: string;
  title: string;
  description?: string;
  type: GoalType;
  weighting: number;
  targetValue?: string;
  measurementCriteria?: string;
  smartCriteria?: string;
  isActive: boolean;
  sortOrder?: number;
  kpis: GoalKPI[];
}

export interface GoalKPI {
  id: string;
  goalId: string;
  name: string;
  description?: string;
  targetValue?: string;
  measurementUnit?: string;
  weighting: number;
  type: KPIType;
  sortOrder?: number;
}

export interface PerformanceReview {
  id: string;
  contractId: string;
  type: ReviewType;
  status: ReviewStatus;
  selfAssessmentNotes?: string;
  selfRating?: number;
  selfSubmittedAt?: string;
  managerAssessmentNotes?: string;
  managerRating?: number;
  managerSubmittedAt?: string;
  finalRating?: number;
  completedAt?: string;
  dueDate?: string;
  goalScores: ReviewGoalScore[];
  evidenceFiles: ReviewEvidence[];
}

export interface ReviewGoalScore {
  id: string;
  reviewId: string;
  goalId: string;
  selfScore?: number;
  selfComments?: string;
  managerScore?: number;
  managerComments?: string;
  finalScore?: number;
}

export interface ReviewEvidence {
  id: string;
  reviewId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  contentType: string;
  description?: string;
  evidenceType: EvidenceType;
  uploadedBy: string;
  uploadedAt: string;
}

export interface PerformanceTemplate {
  id: string;
  name: string;
  description?: string;
  department?: string;
  jobLevel?: string;
  jobFamily?: string;
  goalTemplate?: string;
  kpiTemplate?: string;
  isActive: boolean;
  isDefault: boolean;
}

// Enums
export enum CycleStatus {
  PLANNING = 'PLANNING',
  ACTIVE = 'ACTIVE',
  MID_YEAR = 'MID_YEAR',
  FINAL_REVIEW = 'FINAL_REVIEW',
  CLOSED = 'CLOSED'
}

export enum ContractStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ACTIVE = 'ACTIVE'
}

export enum GoalType {
  STRATEGIC = 'STRATEGIC',
  OPERATIONAL = 'OPERATIONAL',
  DEVELOPMENT = 'DEVELOPMENT',
  BEHAVIORAL = 'BEHAVIORAL'
}

export enum KPIType {
  QUANTITATIVE = 'QUANTITATIVE',
  QUALITATIVE = 'QUALITATIVE',
  BEHAVIORAL = 'BEHAVIORAL'
}

export enum ReviewType {
  MID_YEAR = 'MID_YEAR',
  FINAL = 'FINAL'
}

export enum ReviewStatus {
  PENDING = 'PENDING',
  EMPLOYEE_SUBMITTED = 'EMPLOYEE_SUBMITTED',
  MANAGER_SUBMITTED = 'MANAGER_SUBMITTED',
  COMPLETED = 'COMPLETED'
}

export enum EvidenceType {
  DOCUMENT = 'DOCUMENT',
  PRESENTATION = 'PRESENTATION',
  REPORT = 'REPORT',
  CERTIFICATE = 'CERTIFICATE',
  FEEDBACK = 'FEEDBACK',
  OTHER = 'OTHER'
}

// Request/Response Types
export interface CreateCycleRequest {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  midYearDeadline: string;
  finalReviewDeadline: string;
}

export interface CreateContractRequest {
  cycleId: string;
  employeeId: string;
  employeeName: string;
  employeeNumber?: string;
  managerId: string;
  managerName: string;
  department?: string;
  jobTitle?: string;
  jobLevel?: string;
  templateId?: string;
  goals: CreateGoalRequest[];
}

export interface CreateGoalRequest {
  title: string;
  description?: string;
  type: GoalType;
  weighting: number;
  targetValue?: string;
  measurementCriteria?: string;
  kpis: CreateKPIRequest[];
}

export interface CreateKPIRequest {
  name: string;
  description?: string;
  targetValue?: string;
  measurementUnit?: string;
  weighting: number;
  type: KPIType;
}

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  department?: string;
  jobLevel?: string;
  jobFamily?: string;
  goalTemplate?: string;
  kpiTemplate?: string;
}

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString();
};

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString();
};

export const isDatePast = (dateString: string): boolean => {
  return new Date(dateString) < new Date();
};

export const getDaysUntil = (dateString: string): number => {
  const targetDate = new Date(dateString);
  const today = new Date();
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};