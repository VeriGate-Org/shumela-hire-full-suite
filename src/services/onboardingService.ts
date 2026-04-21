import { apiFetch } from '@/lib/api-fetch';

export interface OnboardingTemplateItem {
  id?: number;
  templateId?: number;
  title: string;
  description: string | null;
  category: 'DOCUMENTS' | 'IT_SETUP' | 'ORIENTATION' | 'COMPLIANCE' | 'BENEFITS';
  dueOffsetDays: number;
  isRequired: boolean;
  sortOrder: number;
}

export interface OnboardingTemplate {
  id: number;
  name: string;
  description: string | null;
  department: string | null;
  isActive: boolean;
  items: OnboardingTemplateItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingChecklistItem {
  id: number;
  checklistId: number;
  templateItemId: number | null;
  title: string;
  description: string | null;
  category: string;
  dueDate: string | null;
  isRequired: boolean;
  status: string;
  completedAt: string | null;
  completedBy: string | null;
  notes: string | null;
  sortOrder: number;
}

export interface OnboardingChecklist {
  id: number;
  employeeId: number;
  templateId: number;
  startDate: string;
  dueDate: string | null;
  status: string;
  assignedHrId: number | null;
  items: OnboardingChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistProgress {
  completed: number;
  total: number;
  percent: number;
  status: string;
}

export const onboardingService = {
  // Templates
  async getTemplates(): Promise<OnboardingTemplate[]> {
    const response = await apiFetch('/api/onboarding/templates');
    if (!response.ok) return [];
    return await response.json();
  },

  async getTemplate(id: number): Promise<OnboardingTemplate> {
    const response = await apiFetch(`/api/onboarding/templates/${id}`);
    if (!response.ok) throw new Error('Template not found');
    return await response.json();
  },

  async createTemplate(data: Partial<OnboardingTemplate>): Promise<OnboardingTemplate> {
    const response = await apiFetch('/api/onboarding/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to create template');
    }
    return await response.json();
  },

  async updateTemplate(id: number, data: Partial<OnboardingTemplate>): Promise<OnboardingTemplate> {
    const response = await apiFetch(`/api/onboarding/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to update template');
    }
    return await response.json();
  },

  async deleteTemplate(id: number): Promise<void> {
    const response = await apiFetch(`/api/onboarding/templates/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete template');
  },

  // Checklists
  async getChecklists(status?: string): Promise<OnboardingChecklist[]> {
    const params = status ? `?status=${status}` : '';
    const response = await apiFetch(`/api/onboarding/checklists${params}`);
    if (!response.ok) return [];
    return await response.json();
  },

  async getChecklistsByEmployee(employeeId: number): Promise<OnboardingChecklist[]> {
    const response = await apiFetch(`/api/onboarding/checklists/employee/${employeeId}`);
    if (!response.ok) return [];
    return await response.json();
  },

  async getChecklist(id: number): Promise<OnboardingChecklist> {
    const response = await apiFetch(`/api/onboarding/checklists/${id}`);
    if (!response.ok) throw new Error('Checklist not found');
    return await response.json();
  },

  async createChecklist(employeeId: number, templateId: number): Promise<OnboardingChecklist> {
    const response = await apiFetch('/api/onboarding/checklists', {
      method: 'POST',
      body: JSON.stringify({ employeeId, templateId }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to create checklist');
    }
    return await response.json();
  },

  async updateChecklistItem(checklistId: number, itemId: number, data: { status?: string; completedBy?: string; notes?: string }): Promise<OnboardingChecklist> {
    const response = await apiFetch(`/api/onboarding/checklists/${checklistId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to update item');
    }
    return await response.json();
  },

  async getProgress(checklistId: number): Promise<ChecklistProgress> {
    const response = await apiFetch(`/api/onboarding/checklists/${checklistId}/progress`);
    if (!response.ok) return { completed: 0, total: 0, percent: 0, status: 'UNKNOWN' };
    return await response.json();
  },
};
