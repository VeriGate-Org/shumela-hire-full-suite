export enum RequisitionStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  PENDING_HR_APPROVAL = 'PENDING_HR_APPROVAL',
  PENDING_HIRING_MANAGER_APPROVAL = 'PENDING_HIRING_MANAGER_APPROVAL',
  PENDING_EXECUTIVE_APPROVAL = 'PENDING_EXECUTIVE_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum WorkflowAction {
  SUBMIT = 'SUBMIT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT'
}

export enum ApprovalRole {
  HR = 'HR_MANAGER',
  HIRING_MANAGER = 'HIRING_MANAGER',
  EXECUTIVE = 'EXECUTIVE'
}

export interface WorkflowTransition {
  from: RequisitionStatus;
  to: RequisitionStatus;
  action: WorkflowAction;
  allowedRoles: ApprovalRole[];
  requiresComment?: boolean;
}

export interface RequisitionData {
  id: string;
  jobTitle: string;
  department: string;
  location: string;
  employmentType: string;
  salaryMin?: number;
  salaryMax?: number;
  description: string;
  status: RequisitionStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  currentApprovalStep?: ApprovalRole;
  approvalHistory: ApprovalHistoryEntry[];
}

export interface ApprovalHistoryEntry {
  id: string;
  requisitionId: string;
  action: WorkflowAction;
  fromStatus: RequisitionStatus;
  toStatus: RequisitionStatus;
  approverRole: ApprovalRole;
  approverId: string;
  approverName: string;
  comment?: string;
  timestamp: Date;
}

export interface AuditLogEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  userId: string;
  userRole: string;
  details: string | null;
  timestamp: Date;
}