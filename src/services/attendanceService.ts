import { apiFetch } from '@/lib/api-fetch';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string | null;
  clockIn: string;
  clockOut: string | null;
  clockMethod: string;
  clockInLatitude: number | null;
  clockInLongitude: number | null;
  clockOutLatitude: number | null;
  clockOutLongitude: number | null;
  status: string;
  totalHours: number | null;
  notes: string | null;
  createdAt: string;
}

export interface Geofence {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  address: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface OvertimeRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  hours: number;
  reason: string | null;
  status: string;
  approverId: string | null;
  approverName: string | null;
  approvedAt: string | null;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const attendanceService = {
  // Clock In/Out
  async clockIn(employeeId: string, method = 'MANUAL', latitude?: number, longitude?: number): Promise<AttendanceRecord> {
    const params = new URLSearchParams({ employeeId, method });
    if (latitude != null) params.set('latitude', latitude.toString());
    if (longitude != null) params.set('longitude', longitude.toString());
    const response = await apiFetch(`/api/attendance/clock-in?${params}`, { method: 'POST' });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to clock in');
    }
    return await response.json();
  },

  async clockOut(employeeId: string, latitude?: number, longitude?: number): Promise<AttendanceRecord> {
    const params = new URLSearchParams({ employeeId });
    if (latitude != null) params.set('latitude', latitude.toString());
    if (longitude != null) params.set('longitude', longitude.toString());
    const response = await apiFetch(`/api/attendance/clock-out?${params}`, { method: 'POST' });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to clock out');
    }
    return await response.json();
  },

  // Records
  async getRecords(employeeId: string, page = 0, size = 20): Promise<PageResponse<AttendanceRecord>> {
    const response = await apiFetch(`/api/attendance/records?employeeId=${employeeId}&page=${page}&size=${size}`);
    if (!response.ok) return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 };
    return await response.json();
  },

  async getTeamAttendance(department: string, startDate: string, endDate: string): Promise<AttendanceRecord[]> {
    const params = new URLSearchParams({ department, startDate, endDate });
    const response = await apiFetch(`/api/attendance/team?${params}`);
    if (!response.ok) return [];
    return await response.json();
  },

  // Overtime
  async submitOvertime(employeeId: string, date: string, hours: number, reason?: string): Promise<OvertimeRecord> {
    const params = new URLSearchParams({ employeeId, date, hours: hours.toString() });
    if (reason) params.set('reason', reason);
    const response = await apiFetch(`/api/attendance/overtime?${params}`, { method: 'POST' });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to submit overtime');
    }
    return await response.json();
  },

  async approveOvertime(id: string, approverId: string): Promise<OvertimeRecord> {
    const response = await apiFetch(`/api/attendance/overtime/${id}/approve?approverId=${approverId}`, { method: 'PUT' });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to approve overtime');
    }
    return await response.json();
  },

  async rejectOvertime(id: string, approverId: string): Promise<OvertimeRecord> {
    const response = await apiFetch(`/api/attendance/overtime/${id}/reject?approverId=${approverId}`, { method: 'PUT' });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to reject overtime');
    }
    return await response.json();
  },

  async getOvertime(employeeId: string, page = 0, size = 20): Promise<PageResponse<OvertimeRecord>> {
    const response = await apiFetch(`/api/attendance/overtime?employeeId=${employeeId}&page=${page}&size=${size}`);
    if (!response.ok) return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 };
    return await response.json();
  },

  async getPendingOvertime(page = 0, size = 20): Promise<PageResponse<OvertimeRecord>> {
    const response = await apiFetch(`/api/attendance/overtime/pending?page=${page}&size=${size}`);
    if (!response.ok) return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 };
    return await response.json();
  },

  // Geofences
  async getGeofences(): Promise<Geofence[]> {
    const response = await apiFetch('/api/geofences');
    if (!response.ok) return [];
    return await response.json();
  },

  async createGeofence(data: { name: string; latitude: number; longitude: number; radiusMeters?: number; address?: string }): Promise<Geofence> {
    const response = await apiFetch('/api/geofences', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to create geofence');
    }
    return await response.json();
  },

  // Status
  async getStatus(employeeId: string): Promise<AttendanceRecord | { clockedIn: false }> {
    const response = await apiFetch(`/api/attendance/status?employeeId=${employeeId}`);
    if (!response.ok) throw new Error('Failed to get status');
    return await response.json();
  },

  // Manual Entry
  async createManualEntry(data: { employeeId: string; clockIn: string; clockOut: string; notes?: string }): Promise<AttendanceRecord> {
    const response = await apiFetch('/api/attendance/manual', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to create manual entry');
    }
    return await response.json();
  },

  async approveManualEntry(id: string, approverId: string): Promise<AttendanceRecord> {
    const response = await apiFetch(
      `/api/attendance/manual/${id}/approve?approverId=${encodeURIComponent(approverId)}`,
      { method: 'PUT' }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to approve entry');
    }
    return await response.json();
  },

  async deleteGeofence(id: string): Promise<void> {
    const response = await apiFetch(`/api/geofences/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete geofence');
  },

  async validateLocation(latitude: number, longitude: number): Promise<boolean> {
    const response = await apiFetch(`/api/geofences/validate?latitude=${latitude}&longitude=${longitude}`, { method: 'POST' });
    if (!response.ok) return false;
    const data = await response.json();
    return data.withinGeofence;
  },
};
