import { apiFetch } from '@/lib/api-fetch';

export interface EmployeeSkill {
  id?: number;
  employeeId: number;
  skillName: string;
  proficiencyLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  yearsExperience: number | null;
  certified: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmployeeEducation {
  id?: number;
  employeeId: number;
  institution: string;
  qualification: string;
  fieldOfStudy: string | null;
  startDate: string | null;
  endDate: string | null;
  grade: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export const employeeService = {
  // Skills
  async getSkills(employeeId: number): Promise<EmployeeSkill[]> {
    const response = await apiFetch(`/api/employee/skills?employeeId=${employeeId}`);
    if (!response.ok) return [];
    return await response.json();
  },

  async addSkill(employeeId: number, skill: Partial<EmployeeSkill>): Promise<EmployeeSkill> {
    const response = await apiFetch(`/api/employee/skills?employeeId=${employeeId}`, {
      method: 'POST',
      body: JSON.stringify(skill),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to add skill');
    }
    return await response.json();
  },

  async updateSkill(id: number, employeeId: number, skill: Partial<EmployeeSkill>): Promise<EmployeeSkill> {
    const response = await apiFetch(`/api/employee/skills/${id}?employeeId=${employeeId}`, {
      method: 'PUT',
      body: JSON.stringify(skill),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to update skill');
    }
    return await response.json();
  },

  async deleteSkill(id: number): Promise<void> {
    const response = await apiFetch(`/api/employee/skills/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete skill');
  },

  // Education
  async getEducation(employeeId: number): Promise<EmployeeEducation[]> {
    const response = await apiFetch(`/api/employee/education?employeeId=${employeeId}`);
    if (!response.ok) return [];
    return await response.json();
  },

  async addEducation(employeeId: number, education: Partial<EmployeeEducation>): Promise<EmployeeEducation> {
    const response = await apiFetch(`/api/employee/education?employeeId=${employeeId}`, {
      method: 'POST',
      body: JSON.stringify(education),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to add education');
    }
    return await response.json();
  },

  async updateEducation(id: number, employeeId: number, education: Partial<EmployeeEducation>): Promise<EmployeeEducation> {
    const response = await apiFetch(`/api/employee/education/${id}?employeeId=${employeeId}`, {
      method: 'PUT',
      body: JSON.stringify(education),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to update education');
    }
    return await response.json();
  },

  async deleteEducation(id: number): Promise<void> {
    const response = await apiFetch(`/api/employee/education/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete education');
  },
};
