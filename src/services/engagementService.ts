import { apiFetch } from '@/lib/api-fetch';

export interface Survey {
  id: string;
  title: string;
  description: string | null;
  status: string;
  isAnonymous: boolean;
  startDate: string | null;
  endDate: string | null;
  createdBy: string | null;
  questions: SurveyQuestion[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface SurveyQuestion {
  id: string;
  surveyId: string;
  questionText: string;
  questionType: string;
  options: string | null;
  displayOrder: number;
  isRequired: boolean;
  createdAt: string;
}

export interface SurveyResults {
  surveyId: string;
  surveyTitle: string;
  totalRespondents: number;
  questionResults: QuestionResult[];
}

export interface QuestionResult {
  questionId: string;
  questionText: string;
  questionType: string;
  averageRating: number | null;
  textResponses: string[];
  responseCount: number;
}

export interface Recognition {
  id: string;
  fromEmployeeId: string;
  fromEmployeeName: string;
  toEmployeeId: string;
  toEmployeeName: string;
  category: string;
  message: string | null;
  points: number;
  isPublic: boolean;
  createdAt: string;
}

export interface WellnessProgram {
  id: string;
  name: string;
  description: string | null;
  programType: string;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  maxParticipants: number | null;
  currentParticipants: number;
  createdAt: string;
  updatedAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface LeaderboardEntry {
  employeeId: string;
  employeeName: string;
  totalPoints: number;
}

export const engagementService = {
  // ---- Surveys ----
  async createSurvey(createdBy: string, data: any): Promise<Survey> {
    const response = await apiFetch(`/api/engagement/surveys?createdBy=${createdBy}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to create survey');
    }
    return await response.json();
  },

  async getSurvey(id: string): Promise<Survey> {
    const response = await apiFetch(`/api/engagement/surveys/${id}`);
    if (!response.ok) throw new Error('Survey not found');
    return await response.json();
  },

  async getSurveys(page = 0, size = 20): Promise<PageResponse<Survey>> {
    const response = await apiFetch(`/api/engagement/surveys?page=${page}&size=${size}`);
    if (!response.ok) return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 };
    return await response.json();
  },

  async getActiveSurveys(): Promise<Survey[]> {
    const response = await apiFetch('/api/engagement/surveys/active');
    if (!response.ok) return [];
    return await response.json();
  },

  async activateSurvey(id: string): Promise<Survey> {
    const response = await apiFetch(`/api/engagement/surveys/${id}/activate`, { method: 'PUT' });
    if (!response.ok) throw new Error('Failed to activate survey');
    return await response.json();
  },

  async closeSurvey(id: string): Promise<Survey> {
    const response = await apiFetch(`/api/engagement/surveys/${id}/close`, { method: 'PUT' });
    if (!response.ok) throw new Error('Failed to close survey');
    return await response.json();
  },

  async submitSurveyResponse(surveyId: string, data: any): Promise<void> {
    const response = await apiFetch(`/api/engagement/surveys/${surveyId}/respond`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to submit response');
    }
  },

  async getSurveyResults(surveyId: string): Promise<SurveyResults> {
    const response = await apiFetch(`/api/engagement/surveys/${surveyId}/results`);
    if (!response.ok) throw new Error('Failed to get results');
    return await response.json();
  },

  async deleteSurvey(id: string): Promise<void> {
    const response = await apiFetch(`/api/engagement/surveys/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete survey');
  },

  // ---- Recognitions ----
  async giveRecognition(data: any): Promise<Recognition> {
    const response = await apiFetch('/api/engagement/recognitions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to give recognition');
    }
    return await response.json();
  },

  async getRecognitionsReceived(employeeId: string, _page = 0, _size = 20): Promise<PageResponse<Recognition>> {
    const response = await apiFetch(`/api/engagement/recognitions/received?employeeId=${employeeId}`);
    if (!response.ok) return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 };
    return await response.json();
  },

  async getRecognitionsGiven(employeeId: string, page = 0, size = 20): Promise<PageResponse<Recognition>> {
    const response = await apiFetch(`/api/engagement/recognitions/given?employeeId=${employeeId}&page=${page}&size=${size}`);
    if (!response.ok) return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 };
    return await response.json();
  },

  async getPublicRecognitions(page = 0, size = 20): Promise<PageResponse<Recognition>> {
    const response = await apiFetch(`/api/engagement/recognitions/public?page=${page}&size=${size}`);
    if (!response.ok) return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 };
    return await response.json();
  },

  async getLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
    try {
      const response = await apiFetch(`/api/engagement/recognitions/leaderboard?limit=${limit}`);
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : (data?.content || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  },

  // ---- Wellness Programs ----
  async createWellnessProgram(data: any): Promise<WellnessProgram> {
    const response = await apiFetch('/api/engagement/wellness', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to create program');
    }
    return await response.json();
  },

  async getWellnessPrograms(page = 0, size = 20): Promise<PageResponse<WellnessProgram>> {
    const response = await apiFetch(`/api/engagement/wellness?page=${page}&size=${size}`);
    if (!response.ok) return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 };
    return await response.json();
  },

  async getActiveWellnessPrograms(): Promise<WellnessProgram[]> {
    const response = await apiFetch('/api/engagement/wellness/active');
    if (!response.ok) return [];
    return await response.json();
  },

  async joinWellnessProgram(programId: string, employeeId: string): Promise<void> {
    const response = await apiFetch(`/api/engagement/wellness/${programId}/join?employeeId=${employeeId}`, {
      method: 'POST',
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to join program');
    }
  },

  async leaveWellnessProgram(programId: string, employeeId: string): Promise<void> {
    const response = await apiFetch(`/api/engagement/wellness/${programId}/leave?employeeId=${employeeId}`, {
      method: 'POST',
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to leave program');
    }
  },
};
