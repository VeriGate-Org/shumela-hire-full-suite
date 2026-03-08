import {
  DocumentTemplate,
  DocumentTemplateType,
  DOCUMENT_PLACEHOLDERS,
} from '../types/documentTemplate';
import { apiFetch } from '@/lib/api-fetch';

export interface DocumentTemplateFilters {
  search?: string;
  type?: DocumentTemplateType;
  showArchived?: boolean;
}

export class DocumentTemplateService {
  async createTemplate(
    data: Omit<DocumentTemplate, 'id' | 'createdAt' | 'updatedAt'>,
    createdBy: string
  ): Promise<DocumentTemplate> {
    const response = await apiFetch('/api/document-templates', {
      method: 'POST',
      body: JSON.stringify({ ...data, createdBy }),
    });
    if (!response.ok) throw new Error('Failed to create template');
    const result = await response.json();
    return result.data || result;
  }

  async getTemplate(id: number): Promise<DocumentTemplate | null> {
    const response = await apiFetch(`/api/document-templates/${id}`);
    if (!response.ok) return null;
    const result = await response.json();
    return result.data || result;
  }

  async getAllTemplates(filters?: DocumentTemplateFilters): Promise<DocumentTemplate[]> {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.type) params.set('type', filters.type);
    if (filters?.showArchived) params.set('showArchived', 'true');

    const query = params.toString();
    const response = await apiFetch(`/api/document-templates${query ? `?${query}` : ''}`);
    if (!response.ok) return [];
    const result = await response.json();
    return result.data || result || [];
  }

  async updateTemplate(
    id: number,
    updates: Partial<DocumentTemplate>
  ): Promise<DocumentTemplate | null> {
    const response = await apiFetch(`/api/document-templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    if (!response.ok) return null;
    const result = await response.json();
    return result.data || result;
  }

  async deleteTemplate(id: number): Promise<boolean> {
    const response = await apiFetch(`/api/document-templates/${id}`, { method: 'DELETE' });
    return response.ok;
  }

  async duplicateTemplate(id: number): Promise<DocumentTemplate | null> {
    const response = await apiFetch(`/api/document-templates/${id}/duplicate`, {
      method: 'POST',
    });
    if (!response.ok) return null;
    const result = await response.json();
    return result.data || result;
  }

  async setDefault(id: number): Promise<DocumentTemplate | null> {
    const response = await apiFetch(`/api/document-templates/${id}/default`, {
      method: 'PUT',
    });
    if (!response.ok) return null;
    const result = await response.json();
    return result.data || result;
  }

  async previewTemplate(id: number, sampleData: Record<string, string>): Promise<string | null> {
    const response = await apiFetch(`/api/document-templates/${id}/preview`, {
      method: 'POST',
      body: JSON.stringify(sampleData),
    });
    if (!response.ok) return null;
    const result = await response.json();
    return result.content;
  }

  replacePlaceholders(content: string, data: Record<string, string>): string {
    let result = content;
    for (const [key, value] of Object.entries(data)) {
      const placeholder = key.startsWith('{{') ? key : `{{${key}}}`;
      const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
      result = result.replace(regex, value || '');
    }
    return result;
  }

  getAvailablePlaceholders() {
    return DOCUMENT_PLACEHOLDERS;
  }
}

export const documentTemplateService = new DocumentTemplateService();
