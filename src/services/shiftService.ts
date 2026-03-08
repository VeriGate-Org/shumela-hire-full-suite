import { apiFetch } from '@/lib/api-fetch';

export interface Shift {
  id: number;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  colorCode: string;
  isActive: boolean;
  createdAt: string;
}

export interface ShiftSchedule {
  id: number;
  employeeId: number;
  employeeName: string;
  department: string | null;
  shiftId: number;
  shiftName: string;
  shiftCode: string;
  shiftColorCode: string;
  startTime: string;
  endTime: string;
  scheduleDate: string;
  status: string;
  createdAt: string;
}

export const shiftService = {
  // Shifts
  async getShifts(activeOnly?: boolean): Promise<Shift[]> {
    const params = activeOnly ? '?activeOnly=true' : '';
    const response = await apiFetch(`/api/shifts${params}`);
    if (!response.ok) return [];
    return await response.json();
  },

  async createShift(data: {
    name: string;
    code: string;
    startTime: string;
    endTime: string;
    breakMinutes?: number;
    colorCode?: string;
  }): Promise<Shift> {
    const response = await apiFetch('/api/shifts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to create shift');
    }
    return await response.json();
  },

  // Schedules
  async getSchedules(startDate: string, endDate: string, department?: string): Promise<ShiftSchedule[]> {
    const params = new URLSearchParams({ startDate, endDate });
    if (department) params.set('department', department);
    const response = await apiFetch(`/api/shifts/schedules?${params}`);
    if (!response.ok) return [];
    return await response.json();
  },

  async assignShift(employeeId: number, shiftId: number, date: string): Promise<ShiftSchedule> {
    const params = new URLSearchParams({
      employeeId: employeeId.toString(),
      shiftId: shiftId.toString(),
      date,
    });
    const response = await apiFetch(`/api/shifts/schedules?${params}`, { method: 'POST' });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to assign shift');
    }
    return await response.json();
  },

  async getEmployeeSchedules(employeeId: number, startDate: string, endDate: string): Promise<ShiftSchedule[]> {
    const params = new URLSearchParams({
      employeeId: employeeId.toString(),
      startDate,
      endDate,
    });
    const response = await apiFetch(`/api/shifts/schedules/employee?${params}`);
    if (!response.ok) return [];
    return await response.json();
  },
};
