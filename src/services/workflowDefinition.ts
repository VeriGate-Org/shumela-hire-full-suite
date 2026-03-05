import { RequisitionStatus, WorkflowAction, ApprovalRole, WorkflowTransition } from '../types/workflow';

/**
 * BPMN-style Workflow Definition for Requisition Approval Process
 * 
 * Flow: Draft → Submitted → HR → Hiring Manager → Executive → Approved/Rejected
 * 
 * Each transition defines:
 * - from: source state
 * - to: target state  
 * - action: workflow action
 * - allowedRoles: who can perform this action
 * - requiresComment: whether comment is mandatory
 */
export const REQUISITION_WORKFLOW_TRANSITIONS: WorkflowTransition[] = [
  // Initial submission (Hiring Manager or HR creates and submits)
  {
    from: RequisitionStatus.DRAFT,
    to: RequisitionStatus.PENDING_HR_APPROVAL,
    action: WorkflowAction.SUBMIT,
    allowedRoles: [ApprovalRole.HR, ApprovalRole.HIRING_MANAGER],
    requiresComment: false
  },

  // HR Approval Stage
  {
    from: RequisitionStatus.PENDING_HR_APPROVAL,
    to: RequisitionStatus.PENDING_EXECUTIVE_APPROVAL,
    action: WorkflowAction.APPROVE,
    allowedRoles: [ApprovalRole.HR],
    requiresComment: false
  },
  {
    from: RequisitionStatus.PENDING_HR_APPROVAL,
    to: RequisitionStatus.REJECTED,
    action: WorkflowAction.REJECT,
    allowedRoles: [ApprovalRole.HR],
    requiresComment: true
  },

  // Executive Approval Stage
  {
    from: RequisitionStatus.PENDING_EXECUTIVE_APPROVAL,
    to: RequisitionStatus.APPROVED,
    action: WorkflowAction.APPROVE,
    allowedRoles: [ApprovalRole.EXECUTIVE],
    requiresComment: false
  },
  {
    from: RequisitionStatus.PENDING_EXECUTIVE_APPROVAL,
    to: RequisitionStatus.REJECTED,
    action: WorkflowAction.REJECT,
    allowedRoles: [ApprovalRole.EXECUTIVE],
    requiresComment: true
  }
];

/**
 * Workflow State Machine Configuration
 */
export const WORKFLOW_STATES = {
  [RequisitionStatus.DRAFT]: {
    name: 'Draft',
    description: 'Requisition is being created',
    color: 'gray',
    icon: '📝',
    isTerminal: false,
    allowedActions: [WorkflowAction.SUBMIT]
  },
  [RequisitionStatus.SUBMITTED]: {
    name: 'Submitted',
    description: 'Waiting for HR approval',
    color: 'blue',
    icon: '📋',
    isTerminal: false,
    allowedActions: [WorkflowAction.APPROVE, WorkflowAction.REJECT]
  },
  [RequisitionStatus.PENDING_HR_APPROVAL]: {
    name: 'Pending HR Approval',
    description: 'HR review in progress',
    color: 'yellow',
    icon: '👥',
    isTerminal: false,
    allowedActions: [WorkflowAction.APPROVE, WorkflowAction.REJECT]
  },
  [RequisitionStatus.PENDING_HIRING_MANAGER_APPROVAL]: {
    name: 'Pending Manager Approval',
    description: 'Hiring manager review in progress',
    color: 'orange',
    icon: '👔',
    isTerminal: false,
    allowedActions: [WorkflowAction.APPROVE, WorkflowAction.REJECT]
  },
  [RequisitionStatus.PENDING_EXECUTIVE_APPROVAL]: {
    name: 'Pending Executive Approval',
    description: 'Executive review in progress',
    color: 'purple',
    icon: '👑',
    isTerminal: false,
    allowedActions: [WorkflowAction.APPROVE, WorkflowAction.REJECT]
  },
  [RequisitionStatus.APPROVED]: {
    name: 'Approved',
    description: 'Requisition approved - ready for posting',
    color: 'green',
    icon: '✅',
    isTerminal: true,
    allowedActions: []
  },
  [RequisitionStatus.REJECTED]: {
    name: 'Rejected',
    description: 'Requisition rejected',
    color: 'red',
    icon: '❌',
    isTerminal: true,
    allowedActions: []
  }
};

/**
 * Get next approval role in sequence
 */
export function getNextApprovalRole(currentStatus: RequisitionStatus): ApprovalRole | null {
  switch (currentStatus) {
    case RequisitionStatus.PENDING_HR_APPROVAL:
      return ApprovalRole.HR;
    case RequisitionStatus.PENDING_EXECUTIVE_APPROVAL:
      return ApprovalRole.EXECUTIVE;
    default:
      return null;
  }
}

/**
 * Get allowed transitions from current state
 */
export function getAllowedTransitions(
  currentStatus: RequisitionStatus,
  userRole: ApprovalRole
): WorkflowTransition[] {
  return REQUISITION_WORKFLOW_TRANSITIONS.filter(
    transition => 
      transition.from === currentStatus && 
      transition.allowedRoles.includes(userRole)
  );
}

/**
 * Validate if transition is allowed
 */
export function isTransitionAllowed(
  fromStatus: RequisitionStatus,
  toStatus: RequisitionStatus,
  action: WorkflowAction,
  userRole: ApprovalRole
): boolean {
  const transition = REQUISITION_WORKFLOW_TRANSITIONS.find(
    t => t.from === fromStatus && 
         t.to === toStatus && 
         t.action === action
  );

  return transition ? transition.allowedRoles.includes(userRole) : false;
}

/**
 * Get workflow progress percentage
 */
export function getWorkflowProgress(status: RequisitionStatus): number {
  const progressMap: Record<string, number> = {
    [RequisitionStatus.DRAFT]: 0,
    [RequisitionStatus.SUBMITTED]: 20,
    [RequisitionStatus.PENDING_HR_APPROVAL]: 33,
    [RequisitionStatus.PENDING_HIRING_MANAGER_APPROVAL]: 50,
    [RequisitionStatus.PENDING_EXECUTIVE_APPROVAL]: 66,
    [RequisitionStatus.APPROVED]: 100,
    [RequisitionStatus.REJECTED]: 100
  };

  return progressMap[status] || 0;
}