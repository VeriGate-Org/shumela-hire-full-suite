import {
  SalaryRecommendation,
  SalaryRecommendationCreateRequest,
  SalaryRecommendationProvideRequest,
  SalaryRecommendationStatus,
} from '@/types/salaryRecommendation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Mock data store for development
const mockRecommendations: SalaryRecommendation[] = []; // TODO: Remove mock data store
let nextId = 3;

function getAuthHeaders(): Record<string, string> {
  const token = sessionStorage.getItem('jwt_token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function tryApi<T>(path: string, options?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...getAuthHeaders(), ...options?.headers },
    });
    if (response.ok) return response.json();
  } catch {
    // API unavailable, fall through to mock
  }
  return null;
}

export const salaryRecommendationService = {
  async getAll(): Promise<SalaryRecommendation[]> {
    const data = await tryApi<SalaryRecommendation[]>('/api/salary-recommendations');
    return data ?? [...mockRecommendations];
  },

  async getById(id: number): Promise<SalaryRecommendation> {
    const data = await tryApi<SalaryRecommendation>(`/api/salary-recommendations/${id}`);
    if (data) return data;
    const found = mockRecommendations.find(r => r.id === id);
    if (!found) throw new Error('Recommendation not found');
    return { ...found };
  },

  async create(request: SalaryRecommendationCreateRequest): Promise<SalaryRecommendation> {
    const data = await tryApi<SalaryRecommendation>('/api/salary-recommendations', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    if (data) return data;

    const rec: SalaryRecommendation = {
      id: nextId++,
      recommendationNumber: 'SR-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      status: SalaryRecommendationStatus.DRAFT,
      ...request,
      requestedBy: 'current-user',
      requiresApproval: true,
      approvalLevelRequired: (request.proposedTargetSalary ?? 0) > 200000 ? 2 : 1,
      currency: 'ZAR',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockRecommendations.push(rec);
    return { ...rec };
  },

  async submitForReview(id: number): Promise<SalaryRecommendation> {
    const data = await tryApi<SalaryRecommendation>(`/api/salary-recommendations/${id}/submit`, { method: 'POST' });
    if (data) return data;

    const rec = mockRecommendations.find(r => r.id === id);
    if (!rec) throw new Error('Not found');
    rec.status = SalaryRecommendationStatus.PENDING_REVIEW;
    rec.updatedAt = new Date().toISOString();
    return { ...rec };
  },

  async provideRecommendation(id: number, request: SalaryRecommendationProvideRequest): Promise<SalaryRecommendation> {
    const data = await tryApi<SalaryRecommendation>(`/api/salary-recommendations/${id}/recommend`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
    if (data) return data;

    const rec = mockRecommendations.find(r => r.id === id);
    if (!rec) throw new Error('Not found');
    rec.recommendedSalary = request.recommendedSalary;
    rec.recommendationJustification = request.recommendationJustification;
    rec.status = request.recommendedSalary > 200000
      ? SalaryRecommendationStatus.PENDING_APPROVAL
      : SalaryRecommendationStatus.RECOMMENDED;
    rec.recommendedAt = new Date().toISOString();
    rec.updatedAt = new Date().toISOString();
    return { ...rec };
  },

  async approve(id: number, approvalNotes?: string): Promise<SalaryRecommendation> {
    const data = await tryApi<SalaryRecommendation>(`/api/salary-recommendations/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approvalNotes }),
    });
    if (data) return data;

    const rec = mockRecommendations.find(r => r.id === id);
    if (!rec) throw new Error('Not found');
    rec.status = SalaryRecommendationStatus.APPROVED;
    rec.approvedAt = new Date().toISOString();
    rec.approvalNotes = approvalNotes;
    rec.updatedAt = new Date().toISOString();
    return { ...rec };
  },

  async reject(id: number, rejectionReason: string): Promise<SalaryRecommendation> {
    const data = await tryApi<SalaryRecommendation>(`/api/salary-recommendations/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejectionReason }),
    });
    if (data) return data;

    const rec = mockRecommendations.find(r => r.id === id);
    if (!rec) throw new Error('Not found');
    rec.status = SalaryRecommendationStatus.REJECTED;
    rec.rejectionReason = rejectionReason;
    rec.updatedAt = new Date().toISOString();
    return { ...rec };
  },

  async getPendingReview(): Promise<SalaryRecommendation[]> {
    const data = await tryApi<SalaryRecommendation[]>('/api/salary-recommendations/pending-review');
    return data ?? mockRecommendations.filter(r => r.status === SalaryRecommendationStatus.PENDING_REVIEW);
  },

  async getPendingApproval(): Promise<SalaryRecommendation[]> {
    const data = await tryApi<SalaryRecommendation[]>('/api/salary-recommendations/pending-approval');
    return data ?? mockRecommendations.filter(r => r.status === SalaryRecommendationStatus.PENDING_APPROVAL);
  },
};
