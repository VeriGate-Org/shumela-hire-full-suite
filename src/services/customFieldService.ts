import { apiFetch } from '@/lib/api-fetch';

export interface CustomField {
  id: number;
  fieldName: string;
  fieldLabel: string;
  fieldType: string;
  entityType: string;
  isRequired: boolean;
  isActive: boolean;
  options: string | null;
  defaultValue: string | null;
  sortOrder: number;
  createdAt: string;
}

export const customFieldService = {
  async getFieldsByEntityType(entityType: string): Promise<CustomField[]> {
    const response = await apiFetch(`/api/custom-fields/entity/${entityType}`);
    if (!response.ok) return [];
    return await response.json();
  },

  async getAllFieldsByEntityType(entityType: string): Promise<CustomField[]> {
    const response = await apiFetch(`/api/custom-fields/entity/${entityType}/all`);
    if (!response.ok) return [];
    return await response.json();
  },

  async createField(data: Partial<CustomField>): Promise<CustomField> {
    const response = await apiFetch('/api/custom-fields', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Failed to create field');
    }
    return await response.json();
  },

  async updateField(id: number, data: Partial<CustomField>): Promise<CustomField> {
    const response = await apiFetch(`/api/custom-fields/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Failed to update field');
    }
    return await response.json();
  },

  async deleteField(id: number): Promise<void> {
    const response = await apiFetch(`/api/custom-fields/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete field');
  },
};
