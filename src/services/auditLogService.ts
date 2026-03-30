import { AuditLogEntry } from '../types/workflow';
import { apiFetch } from '@/lib/api-fetch';

export interface PaginatedAuditLogs {
  logs: AuditLogEntry[];
  /** Total element count. Present for JPA; may be 0 for DynamoDB cursor-based responses. */
  totalElements: number;
  /** Total pages. Present for JPA; may be 0 for DynamoDB cursor-based responses. */
  totalPages: number;
  currentPage: number;
  pageSize: number;
  /** Opaque cursor for fetching the next page (DynamoDB cursor-based pagination). */
  nextCursor?: string;
}

function parseAuditLog(raw: any): AuditLogEntry {
  return {
    id: raw.id || '',
    entityType: raw.entityType || '',
    entityId: raw.entityId || '',
    action: raw.action || '',
    userId: raw.userId || '',
    userRole: raw.userRole || '',
    details: typeof raw.details === 'string' ? (() => { try { return JSON.parse(raw.details); } catch { return { message: raw.details }; } })() : (raw.details || {}),
    timestamp: new Date(raw.timestamp || raw.createdAt || Date.now()),
  };
}

async function fetchAuditLogs(path: string): Promise<AuditLogEntry[]> {
  const response = await apiFetch(path);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const result = await response.json();
  const items = result.content || result.data || result || [];
  return Array.isArray(items) ? items.map(parseAuditLog) : [];
}

/**
 * Audit Log Service
 * Connects to the backend audit API endpoints
 */
export class AuditLogService {
  async logWorkflowTransition(
    requisitionId: string,
    fromStatus: string,
    toStatus: string,
    userId: string,
    userRole: string,
    comment?: string,
    _customTimestamp?: Date
  ): Promise<AuditLogEntry> {
    const action = toStatus === 'REJECTED' ? 'REJECT' : 'APPROVE';
    const response = await apiFetch('/api/audit', {
      method: 'POST',
      body: JSON.stringify({
        entityType: 'Requisition',
        entityId: requisitionId,
        action: `workflow_${action.toLowerCase()}`,
        userId,
        userRole,
        details: { action, fromStatus, toStatus, comment: comment || undefined },
      }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return parseAuditLog(await response.json());
  }

  async logRequisitionCreated(
    requisitionId: string,
    userId: string,
    userRole: string,
    requisitionData: Record<string, unknown> | Date
  ): Promise<AuditLogEntry> {
    const data = requisitionData instanceof Date ? {} : requisitionData;
    const response = await apiFetch('/api/audit', {
      method: 'POST',
      body: JSON.stringify({
        entityType: 'Requisition',
        entityId: requisitionId,
        action: 'created',
        userId,
        userRole,
        details: {
          jobTitle: data.jobTitle,
          department: data.department,
          location: data.location,
          employmentType: data.employmentType,
        },
      }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return parseAuditLog(await response.json());
  }

  async logRequisitionUpdated(
    requisitionId: string,
    userId: string,
    userRole: string,
    changes: Record<string, unknown>
  ): Promise<AuditLogEntry> {
    const response = await apiFetch('/api/audit', {
      method: 'POST',
      body: JSON.stringify({
        entityType: 'Requisition',
        entityId: requisitionId,
        action: 'updated',
        userId,
        userRole,
        details: { changes },
      }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return parseAuditLog(await response.json());
  }

  async logUserAuthentication(
    userId: string,
    userRole: string,
    action: 'login' | 'logout',
    ipAddress?: string
  ): Promise<AuditLogEntry> {
    const response = await apiFetch('/api/audit', {
      method: 'POST',
      body: JSON.stringify({
        entityType: 'User',
        entityId: userId,
        action: `auth_${action}`,
        userId,
        userRole,
        details: { action, ipAddress, timestamp: new Date().toISOString() },
      }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return parseAuditLog(await response.json());
  }

  async logRoleSwitch(
    userId: string,
    fromRole: string,
    toRole: string
  ): Promise<AuditLogEntry> {
    const response = await apiFetch('/api/audit', {
      method: 'POST',
      body: JSON.stringify({
        entityType: 'User',
        entityId: userId,
        action: 'role_switch',
        userId,
        userRole: toRole,
        details: { fromRole, toRole, reason: 'demo_role_switch' },
      }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return parseAuditLog(await response.json());
  }

  async getRequisitionAuditLogs(requisitionId: string): Promise<AuditLogEntry[]> {
    return fetchAuditLogs(`/api/audit/entity/${requisitionId}`);
  }

  async getAllRequisitionAuditLogs(): Promise<AuditLogEntry[]> {
    return fetchAuditLogs('/api/audit/all');
  }

  async getUserAuditLogs(userId: string): Promise<AuditLogEntry[]> {
    return fetchAuditLogs(`/api/audit/user/${userId}`);
  }

  async getRecentAuditLogs(limit: number = 50): Promise<AuditLogEntry[]> {
    return fetchAuditLogs(`/api/audit/all?size=${limit}&sort=timestamp&direction=DESC`);
  }

  /**
   * Fetch audit logs with pagination. Supports both page-based (JPA) and
   * cursor-based (DynamoDB) pagination. When `cursor` is provided, `page` is ignored.
   */
  async getAllAuditLogs(page: number = 0, size: number = 50, cursor?: string): Promise<PaginatedAuditLogs> {
    try {
      // Prefer cursor-based pagination when a cursor is provided (DynamoDB)
      const paginationParam = cursor
        ? `cursor=${encodeURIComponent(cursor)}`
        : `page=${page}`;
      const response = await apiFetch(`/api/audit/all?${paginationParam}&size=${size}&sort=timestamp&direction=DESC`);
      if (!response.ok) {
        // Return empty result instead of throwing for API errors
        return { logs: [], totalElements: 0, totalPages: 0, currentPage: page, pageSize: size };
      }
      const result = await response.json();

      // Parse Spring Data Page response format (JPA) or DynamoDB cursor response
      const items = result.content || result.data || result || [];
      const logs = Array.isArray(items) ? items.map(parseAuditLog) : [];

      return {
        logs,
        totalElements: result.totalElements ?? logs.length,
        totalPages: result.totalPages ?? 1,
        currentPage: result.number ?? page,
        pageSize: result.size ?? size,
        nextCursor: result.nextCursor,
      };
    } catch {
      // Return graceful empty result on network/parse errors
      return { logs: [], totalElements: 0, totalPages: 0, currentPage: page, pageSize: size };
    }
  }
}

// Export singleton instance
export const auditLogService = new AuditLogService();
