import { apiFetch } from '@/lib/api-fetch';

export interface LeaveType {
  id: number;
  name: string;
  code: string;
  description: string | null;
  defaultDaysPerYear: number;
  maxCarryForwardDays: number;
  requiresMedicalCertificate: boolean;
  medicalCertThresholdDays: number;
  isPaid: boolean;
  allowEncashment: boolean;
  encashmentRate: number | null;
  isActive: boolean;
  colorCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeavePolicy {
  id: number;
  leaveTypeId: number;
  leaveTypeName: string;
  name: string;
  description: string | null;
  accrualMethod: string;
  daysPerCycle: number;
  cycleStartMonth: number;
  minServiceMonths: number;
  applicableEmploymentTypes: string | null;
  applicableDepartments: string | null;
  allowNegativeBalance: boolean;
  maxConsecutiveDays: number | null;
  minNoticeDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveBalance {
  id: number;
  employeeId: number;
  employeeName: string;
  leaveTypeId: number;
  leaveTypeName: string;
  leaveTypeCode: string;
  colorCode: string;
  cycleYear: number;
  entitledDays: number;
  takenDays: number;
  pendingDays: number;
  carriedForwardDays: number;
  adjustmentDays: number;
  encashedDays: number;
  availableDays: number;
}

export interface LeaveEncashmentRequest {
  id: number;
  employeeId: number;
  employeeName: string;
  leaveTypeId: number;
  leaveTypeName: string;
  days: number;
  ratePerDay: number;
  totalAmount: number;
  status: string;
  reason: string | null;
  requestedAt: string;
  hrApprovedById: number | null;
  hrApprovedByName: string | null;
  hrApprovedAt: string | null;
  financeApprovedById: number | null;
  financeApprovedByName: string | null;
  financeApprovedAt: string | null;
  decisionComment: string | null;
  cycleYear: number;
}

export interface LeaveRequest {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeDepartment: string | null;
  leaveTypeId: number;
  leaveTypeName: string;
  leaveTypeCode: string;
  colorCode: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  isHalfDay: boolean;
  halfDayPeriod: string | null;
  reason: string | null;
  medicalCertificateUrl: string | null;
  status: string;
  approverId: number | null;
  approverName: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveCalendarEntry {
  id: number;
  employeeName: string;
  department: string | null;
  leaveTypeName: string;
  colorCode: string;
  startDate: string;
  endDate: string;
  status: string;
}

export interface PublicHoliday {
  id: number;
  name: string;
  holidayDate: string;
  isRecurring: boolean;
  country: string;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const leaveService = {
  // Leave Types
  async getLeaveTypes(activeOnly?: boolean): Promise<LeaveType[]> {
    const params = activeOnly ? '?activeOnly=true' : '';
    try {
      const response = await apiFetch(`/api/leave/types${params}`);
      if (!response.ok) {
        console.error(`Failed to fetch leave types: ${response.status} ${response.statusText}`);
        return [];
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching leave types:', error);
      return [];
    }
  },

  async createLeaveType(data: Partial<LeaveType>): Promise<LeaveType> {
    const response = await apiFetch('/api/leave/types', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to create leave type');
    }
    return await response.json();
  },

  async updateLeaveType(id: number, data: Partial<LeaveType>): Promise<LeaveType> {
    const response = await apiFetch(`/api/leave/types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to update leave type');
    }
    return await response.json();
  },

  // Leave Policies
  async getLeavePolicies(leaveTypeId?: number): Promise<LeavePolicy[]> {
    const params = leaveTypeId ? `?leaveTypeId=${leaveTypeId}` : '';
    try {
      const response = await apiFetch(`/api/leave/policies${params}`);
      if (!response.ok) {
        console.error(`Failed to fetch leave policies: ${response.status} ${response.statusText}`);
        return [];
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching leave policies:', error);
      return [];
    }
  },

  async createLeavePolicy(data: any): Promise<LeavePolicy> {
    const response = await apiFetch('/api/leave/policies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to create leave policy');
    }
    return await response.json();
  },

  // Balances
  async getBalances(employeeId: number, year?: number): Promise<LeaveBalance[]> {
    const params = new URLSearchParams({ employeeId: employeeId.toString() });
    if (year) params.set('year', year.toString());
    try {
      const response = await apiFetch(`/api/leave/balances?${params}`);
      if (!response.ok) {
        console.error(`Failed to fetch leave balances: ${response.status} ${response.statusText}`);
        return [];
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching leave balances:', error);
      return [];
    }
  },

  // Leave Requests
  async createLeaveRequest(employeeId: number, data: any): Promise<LeaveRequest> {
    const response = await apiFetch(`/api/leave/requests?employeeId=${employeeId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to create leave request');
    }
    return await response.json();
  },

  async getLeaveRequests(params: {
    employeeId?: number;
    status?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<LeaveRequest>> {
    const searchParams = new URLSearchParams();
    if (params.employeeId) searchParams.set('employeeId', params.employeeId.toString());
    if (params.status) searchParams.set('status', params.status);
    searchParams.set('page', (params.page ?? 0).toString());
    searchParams.set('size', (params.size ?? 20).toString());
    const response = await apiFetch(`/api/leave/requests?${searchParams}`);
    if (!response.ok) return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 };
    return await response.json();
  },

  async getLeaveRequest(id: number): Promise<LeaveRequest> {
    const response = await apiFetch(`/api/leave/requests/${id}`);
    if (!response.ok) throw new Error('Leave request not found');
    return await response.json();
  },

  async getPendingApprovals(managerId: number, page = 0, size = 20): Promise<PageResponse<LeaveRequest>> {
    const response = await apiFetch(`/api/leave/requests/pending?managerId=${managerId}&page=${page}&size=${size}`);
    if (!response.ok) return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 };
    return await response.json();
  },

  async approveRequest(id: number, approverId: number): Promise<LeaveRequest> {
    const response = await apiFetch(`/api/leave/requests/${id}/approve?approverId=${approverId}`, {
      method: 'PUT',
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to approve');
    }
    return await response.json();
  },

  async rejectRequest(id: number, approverId: number, reason?: string): Promise<LeaveRequest> {
    const response = await apiFetch(`/api/leave/requests/${id}/reject?approverId=${approverId}`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to reject');
    }
    return await response.json();
  },

  async cancelRequest(id: number, employeeId: number, reason?: string): Promise<LeaveRequest> {
    const response = await apiFetch(`/api/leave/requests/${id}/cancel?employeeId=${employeeId}`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to cancel');
    }
    return await response.json();
  },

  // Calendar
  async getCalendar(startDate: string, endDate: string, department?: string): Promise<LeaveCalendarEntry[]> {
    const params = new URLSearchParams({ startDate, endDate });
    if (department) params.set('department', department);
    const response = await apiFetch(`/api/leave/calendar?${params}`);
    if (!response.ok) return [];
    return await response.json();
  },

  // Analytics
  async getAnalytics(): Promise<Record<string, any>> {
    const response = await apiFetch('/api/leave/analytics');
    if (!response.ok) return {};
    return await response.json();
  },

  async getAnalyticsTrends(): Promise<Record<string, any>> {
    const response = await apiFetch('/api/leave/analytics/trends');
    if (!response.ok) return {};
    return await response.json();
  },

  // Public Holidays
  async getHolidays(): Promise<PublicHoliday[]> {
    const response = await apiFetch('/api/leave/holidays');
    if (!response.ok) return [];
    return await response.json();
  },

  async createHoliday(data: { name: string; holidayDate: string; isRecurring?: boolean; country?: string }): Promise<PublicHoliday> {
    const response = await apiFetch('/api/leave/holidays', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to create holiday');
    }
    return await response.json();
  },

  async deleteHoliday(id: number): Promise<void> {
    const response = await apiFetch(`/api/leave/holidays/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete holiday');
  },

  // Leave Encashment
  async requestEncashment(employeeId: number, data: { leaveTypeId: number; days: number; reason?: string }): Promise<LeaveEncashmentRequest> {
    const response = await apiFetch(`/api/leave/encashment?employeeId=${employeeId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to request encashment');
    }
    return await response.json();
  },

  async getEncashmentRequests(employeeId: number): Promise<LeaveEncashmentRequest[]> {
    const response = await apiFetch(`/api/leave/encashment?employeeId=${employeeId}`);
    if (!response.ok) return [];
    return await response.json();
  },

  async getPendingEncashmentHR(): Promise<LeaveEncashmentRequest[]> {
    const response = await apiFetch('/api/leave/encashment/pending/hr');
    if (!response.ok) return [];
    return await response.json();
  },

  async getPendingEncashmentFinance(): Promise<LeaveEncashmentRequest[]> {
    const response = await apiFetch('/api/leave/encashment/pending/finance');
    if (!response.ok) return [];
    return await response.json();
  },

  async hrApproveEncashment(id: number, approverId: number): Promise<LeaveEncashmentRequest> {
    const response = await apiFetch(`/api/leave/encashment/${id}/hr-approve?approverId=${approverId}`, {
      method: 'PUT',
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to approve');
    }
    return await response.json();
  },

  async financeApproveEncashment(id: number, approverId: number): Promise<LeaveEncashmentRequest> {
    const response = await apiFetch(`/api/leave/encashment/${id}/finance-approve?approverId=${approverId}`, {
      method: 'PUT',
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to approve');
    }
    return await response.json();
  },

  async rejectEncashment(id: number, approverId: number, comment?: string): Promise<LeaveEncashmentRequest> {
    const params = new URLSearchParams({ approverId: approverId.toString() });
    if (comment) params.set('comment', comment);
    const response = await apiFetch(`/api/leave/encashment/${id}/reject?${params}`, {
      method: 'PUT',
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to reject');
    }
    return await response.json();
  },
};
