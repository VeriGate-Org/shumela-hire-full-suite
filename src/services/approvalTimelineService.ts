import { ApprovalStep } from '../components/ApprovalTimeline';
import { apiFetch } from '@/lib/api-fetch';

/**
 * A single recorded approval action, as returned by the backend on a requisition.
 * Mirrors `com.arthmatic.shumelahire.entity.RequisitionApproval`.
 */
interface RequisitionApprovalRecord {
  role?: string;
  action?: 'SUBMIT' | 'APPROVE' | 'REJECT' | string;
  actorUserId?: string;
  actorName?: string;
  timestamp?: string;
  comment?: string;
}

interface RequisitionRecord {
  id?: string;
  status?: string;
  approvalHistory?: RequisitionApprovalRecord[];
}

/** Human label for an approval stage. Without this the raw enum token reaches the screen. */
export function formatApprovalRole(role?: string): string {
  if (!role) return 'Approver';
  const labels: Record<string, string> = {
    HR_MANAGER: 'HR Manager',
    HR: 'HR Manager',
    EXECUTIVE: 'Executive',
    HIRING_MANAGER: 'Hiring Manager',
    ADMIN: 'Administrator',
    UNKNOWN: 'Approver',
  };
  if (labels[role]) return labels[role];
  return role
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** The stage a requisition is currently awaiting, derived from its status. */
function pendingRoleForStatus(status?: string): string | null {
  switch (status) {
    case 'PENDING_HR_APPROVAL':
      return 'HR_MANAGER';
    case 'PENDING_EXECUTIVE_APPROVAL':
      return 'EXECUTIVE';
    default:
      return null;
  }
}

/**
 * Builds the approval timeline from the requisition's recorded approval history.
 *
 * Previously this derived a timeline from a `approvalHistory` field the backend never supplied,
 * against a hardcoded three-role ladder that did not match the backend's two-stage chain. The
 * result was that every step rendered as pending — even on an approved requisition — with one
 * step labelled with a raw enum token. The timeline is now built only from what actually happened,
 * plus the one stage the requisition is genuinely still awaiting.
 */
export class ApprovalTimelineService {
  async getApprovalTimelineForRequisition(requisitionId: string): Promise<ApprovalStep[]> {
    const response = await apiFetch(`/api/requisitions/${requisitionId}`);
    if (!response.ok) {
      return [];
    }

    const requisition: RequisitionRecord = await response.json();
    return this.buildTimeline(requisition);
  }

  /** Exposed separately so the mapping can be tested without a network call. */
  buildTimeline(requisition: RequisitionRecord | null): ApprovalStep[] {
    if (!requisition) return [];

    const history = requisition.approvalHistory ?? [];
    const steps: ApprovalStep[] = [];

    for (const entry of history) {
      if (entry.action === 'SUBMIT') {
        // The submission records the routing decision; surface it as the chain's first event.
        steps.push({
          role: 'Submitted',
          approverName: entry.actorName || 'Requisition raised',
          status: 'approved',
          timestamp: entry.timestamp,
          comment: entry.comment,
        });
        continue;
      }

      if (entry.action === 'APPROVE' || entry.action === 'REJECT') {
        steps.push({
          role: formatApprovalRole(entry.role),
          approverName: entry.actorName || 'Unnamed approver',
          status: entry.action === 'APPROVE' ? 'approved' : 'rejected',
          timestamp: entry.timestamp,
          comment: entry.comment,
        });
      }
    }

    // Append the stage still outstanding, if any.
    const pendingRole = pendingRoleForStatus(requisition.status);
    if (pendingRole) {
      steps.push({
        role: formatApprovalRole(pendingRole),
        approverName: 'Awaiting approval',
        status: 'pending',
        timestamp: undefined,
        comment: undefined,
      });
    }

    return steps;
  }
}

export const approvalTimelineService = new ApprovalTimelineService();
