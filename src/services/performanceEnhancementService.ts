import { apiFetch } from '@/lib/api-fetch';

export interface FeedbackRequest {
  id: number;
  employeeId: number;
  employeeName: string;
  requesterId: number;
  requesterName: string;
  feedbackType: string;
  status: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackResponseDto {
  id: number;
  requestId: number;
  respondentId: number;
  respondentName: string;
  ratings: string | null;
  comments: string | null;
  strengths: string | null;
  improvements: string | null;
  submittedAt: string | null;
  createdAt: string;
}

export interface Pip {
  id: number;
  employeeId: number;
  employeeName: string;
  managerId: number;
  managerName: string;
  reason: string | null;
  startDate: string;
  endDate: string;
  status: string;
  outcome: string | null;
  milestones: PipMilestone[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface PipMilestone {
  id: number;
  pipId: number;
  title: string;
  description: string | null;
  targetDate: string;
  status: string;
  evidence: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface CompetencyFramework {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  competencies: Competency[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface Competency {
  id: number;
  frameworkId: number;
  name: string;
  description: string | null;
  category: string | null;
  proficiencyLevels: string | null;
  createdAt: string;
}

export interface EmployeeCompetency {
  id: number;
  employeeId: number;
  employeeName: string;
  competencyId: number;
  competencyName: string;
  category: string | null;
  currentLevel: number;
  targetLevel: number;
  assessedAt: string | null;
  assessorId: number | null;
  assessorName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SkillGap {
  competencyId: number;
  competencyName: string;
  frameworkName: string | null;
  category: string | null;
  currentLevel: number;
  targetLevel: number;
  gap: number;
  recommendedCourses: { courseId: number; courseTitle: string }[];
}

export interface TrainingRecommendation {
  courseId: number;
  courseTitle: string;
  category: string | null;
  deliveryMethod: string | null;
  durationHours: number | null;
  matchingCompetencies: string[];
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const performanceEnhancementService = {
  // ---- 360 Feedback ----
  async createFeedbackRequest(data: any): Promise<FeedbackRequest> {
    const response = await apiFetch('/api/performance/feedback/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to create feedback request');
    }
    return await response.json();
  },

  async getFeedbackRequest(id: number): Promise<FeedbackRequest> {
    const response = await apiFetch(`/api/performance/feedback/requests/${id}`);
    if (!response.ok) throw new Error('Feedback request not found');
    return await response.json();
  },

  async getFeedbackRequestsForEmployee(employeeId: number, page = 0, size = 20): Promise<PageResponse<FeedbackRequest>> {
    const response = await apiFetch(`/api/performance/feedback/requests/employee/${employeeId}?page=${page}&size=${size}`);
    if (!response.ok) return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 };
    return await response.json();
  },

  async getPendingFeedbackRequests(page = 0, size = 20): Promise<PageResponse<FeedbackRequest>> {
    const response = await apiFetch(`/api/performance/feedback/requests/pending?page=${page}&size=${size}`);
    if (!response.ok) return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 };
    return await response.json();
  },

  async submitFeedback(requestId: number, data: any): Promise<FeedbackResponseDto> {
    const response = await apiFetch(`/api/performance/feedback/requests/${requestId}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to submit feedback');
    }
    return await response.json();
  },

  async declineFeedbackRequest(requestId: number): Promise<void> {
    const response = await apiFetch(`/api/performance/feedback/requests/${requestId}/decline`, { method: 'PUT' });
    if (!response.ok) throw new Error('Failed to decline request');
  },

  async getFeedbackResponses(requestId: number): Promise<FeedbackResponseDto[]> {
    const response = await apiFetch(`/api/performance/feedback/requests/${requestId}/responses`);
    if (!response.ok) return [];
    return await response.json();
  },

  // ---- PIPs ----
  async createPip(data: any): Promise<Pip> {
    const response = await apiFetch('/api/performance/pips', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to create PIP');
    }
    return await response.json();
  },

  async getPip(id: number): Promise<Pip> {
    const response = await apiFetch(`/api/performance/pips/${id}`);
    if (!response.ok) throw new Error('PIP not found');
    return await response.json();
  },

  async getActivePips(page = 0, size = 20): Promise<PageResponse<Pip>> {
    const response = await apiFetch(`/api/performance/pips/active?page=${page}&size=${size}`);
    if (!response.ok) return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 };
    return await response.json();
  },

  async getPipsByEmployee(employeeId: number, page = 0, size = 20): Promise<PageResponse<Pip>> {
    const response = await apiFetch(`/api/performance/pips/employee/${employeeId}?page=${page}&size=${size}`);
    if (!response.ok) return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 };
    return await response.json();
  },

  async updatePipStatus(id: number, status: string, outcome?: string): Promise<Pip> {
    const params = new URLSearchParams({ status });
    if (outcome) params.set('outcome', outcome);
    const response = await apiFetch(`/api/performance/pips/${id}/status?${params}`, { method: 'PUT' });
    if (!response.ok) throw new Error('Failed to update PIP status');
    return await response.json();
  },

  async updateMilestoneStatus(milestoneId: number, status: string, evidence?: string): Promise<void> {
    const params = new URLSearchParams({ status });
    if (evidence) params.set('evidence', evidence);
    const response = await apiFetch(`/api/performance/pips/milestones/${milestoneId}/status?${params}`, { method: 'PUT' });
    if (!response.ok) throw new Error('Failed to update milestone');
  },

  // ---- Reviews ----
  async getReviews(params?: { cycleId?: number; employeeId?: string; status?: string }): Promise<any[]> {
    const searchParams = new URLSearchParams();
    if (params?.cycleId) searchParams.set('cycleId', params.cycleId.toString());
    if (params?.employeeId) searchParams.set('employeeId', params.employeeId);
    if (params?.status) searchParams.set('status', params.status);
    const qs = searchParams.toString();
    const response = await apiFetch(`/api/performance/reviews${qs ? `?${qs}` : ''}`);
    if (!response.ok) return [];
    return await response.json();
  },

  async getReview(id: number): Promise<any> {
    const response = await apiFetch(`/api/performance/reviews/${id}`);
    if (!response.ok) throw new Error('Review not found');
    return await response.json();
  },

  async createReview(contractId: number, reviewType: string): Promise<any> {
    const response = await apiFetch('/api/performance/reviews', {
      method: 'POST',
      body: JSON.stringify({ contractId, reviewType }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to create review');
    }
    return await response.json();
  },

  async submitSelfAssessment(id: number, data: { notes: string; rating: number; goalScores?: any[] }): Promise<any> {
    const response = await apiFetch(`/api/performance/reviews/${id}/self-assessment`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to submit self assessment');
    }
    return await response.json();
  },

  async submitManagerAssessment(id: number, data: { notes: string; rating: number; goalScores?: any[] }): Promise<any> {
    const response = await apiFetch(`/api/performance/reviews/${id}/manager-assessment`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to submit manager assessment');
    }
    return await response.json();
  },

  async completeReview(id: number): Promise<any> {
    const response = await apiFetch(`/api/performance/reviews/${id}/complete`, {
      method: 'PUT',
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to complete review');
    }
    return await response.json();
  },

  // ---- Competencies ----
  async createFramework(name: string, description?: string): Promise<CompetencyFramework> {
    const params = new URLSearchParams({ name });
    if (description) params.set('description', description);
    const response = await apiFetch(`/api/competencies/frameworks?${params}`, { method: 'POST' });
    if (!response.ok) throw new Error('Failed to create framework');
    return await response.json();
  },

  async getFrameworks(activeOnly = false): Promise<CompetencyFramework[]> {
    const response = await apiFetch(`/api/competencies/frameworks?activeOnly=${activeOnly}`);
    if (!response.ok) return [];
    return await response.json();
  },

  async getFramework(id: number): Promise<CompetencyFramework> {
    const response = await apiFetch(`/api/competencies/frameworks/${id}`);
    if (!response.ok) throw new Error('Framework not found');
    return await response.json();
  },

  async addCompetency(frameworkId: number, name: string, description?: string, category?: string, proficiencyLevels?: string): Promise<Competency> {
    const params = new URLSearchParams({ name });
    if (description) params.set('description', description);
    if (category) params.set('category', category);
    if (proficiencyLevels) params.set('proficiencyLevels', proficiencyLevels);
    const response = await apiFetch(`/api/competencies/frameworks/${frameworkId}/competencies?${params}`, { method: 'POST' });
    if (!response.ok) throw new Error('Failed to add competency');
    return await response.json();
  },

  async getEmployeeCompetencies(employeeId: string): Promise<EmployeeCompetency[]> {
    const response = await apiFetch(`/api/competencies/employees/${employeeId}`);
    if (!response.ok) return [];
    return await response.json();
  },

  async assessCompetency(employeeId: number, competencyId: number, currentLevel: number, targetLevel: number, assessorId?: number): Promise<EmployeeCompetency> {
    const params = new URLSearchParams({
      competencyId: competencyId.toString(),
      currentLevel: currentLevel.toString(),
      targetLevel: targetLevel.toString(),
    });
    if (assessorId) params.set('assessorId', assessorId.toString());
    const response = await apiFetch(`/api/competencies/employees/${employeeId}/assess?${params}`, { method: 'POST' });
    if (!response.ok) throw new Error('Failed to assess competency');
    return await response.json();
  },

  // Skill Gap Analysis
  async getSkillGaps(employeeId: string): Promise<SkillGap[]> {
    const response = await apiFetch(`/api/competencies/gaps/employee/${employeeId}`);
    if (!response.ok) return [];
    return await response.json();
  },

  async getDepartmentGaps(departmentId: string): Promise<SkillGap[]> {
    const response = await apiFetch(`/api/competencies/gaps/department/${departmentId}`);
    if (!response.ok) return [];
    return await response.json();
  },

  async getTrainingRecommendations(employeeId: string): Promise<TrainingRecommendation[]> {
    const response = await apiFetch(`/api/competencies/training/recommendations/${employeeId}`);
    if (!response.ok) return [];
    return await response.json();
  },
};
