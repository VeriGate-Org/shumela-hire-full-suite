// This typed API service is not currently used by pages — applications/page.tsx and
// ApplicationManagementConsole.tsx use apiFetch directly.
import { apiClient, PaginatedResponse, PaginationParams } from './apiClient';

// Application Management API Service
export interface Application {
  id: number;
  jobTitle: string;
  applicantName: string;
  applicantEmail: string;
  status: 'submitted' | 'reviewed' | 'interview_scheduled' | 'interview_completed' | 'offer_extended' | 'hired' | 'rejected';
  statusDisplayName: string;
  statusCssClass: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rating?: number;
  skillMatch?: number;
  experienceYears?: number;
  coverLetter?: string;
  resumeUrl?: string;
  phoneNumber?: string;
  location?: string;
  canBeWithdrawn: boolean;
  canBeEdited: boolean;
  notes?: ApplicationNote[];
  interviews?: Interview[];
  tags?: string[];
}

export interface ApplicationNote {
  id: number;
  content: string;
  createdBy: string;
  createdAt: string;
  isPrivate: boolean;
}

export interface Interview {
  id: number;
  type: 'phone' | 'video' | 'onsite';
  round: string;
  scheduledAt: string;
  durationMinutes: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  interviewerName?: string;
  interviewerEmail?: string;
  location?: string;
  meetingLink?: string;
  feedback?: InterviewFeedback;
  rescheduleCount: number;
  createdBy: string;
  createdAt: string;
}

export interface InterviewFeedback {
  id: number;
  rating: number;
  technicalSkills?: number;
  communication?: number;
  culturalFit?: number;
  overallRecommendation: 'strong_hire' | 'hire' | 'no_hire' | 'strong_no_hire';
  comments?: string;
  strengths?: string;
  concerns?: string;
  submittedAt: string;
}

export interface ApplicationStatistics {
  total: number;
  byStatus: Record<string, number>;
  averageRating: number;
  averageTimeToHire: number;
  conversionRate: number;
  monthlyTrends: Array<{
    month: string;
    applications: number;
    hires: number;
  }>;
}

export interface ApplicationFilters {
  status?: string;
  jobTitle?: string;
  minRating?: number;
  maxRating?: number;
  dateFrom?: string;
  dateTo?: string;
  skillMatch?: number;
  experienceYears?: number;
  location?: string;
}

class ApplicationApiService {
  // Get all applications with filtering and pagination
  async getApplications(
    filters?: ApplicationFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Application>> {
    const params = {
      ...filters,
      ...pagination,
    };
    
    return apiClient.get<PaginatedResponse<Application>>('/api/applications', params);
  }

  // Get application by ID
  async getApplication(id: number): Promise<Application> {
    return apiClient.get<Application>(`/api/applications/${id}`);
  }

  // Create new application
  async createApplication(applicationData: Partial<Application>): Promise<Application> {
    return apiClient.post<Application>('/api/applications', applicationData);
  }

  // Update application
  async updateApplication(id: number, applicationData: Partial<Application>): Promise<Application> {
    return apiClient.put<Application>(`/api/applications/${id}`, applicationData);
  }

  // Update application status
  async updateApplicationStatus(id: number, status: Application['status'], notes?: string): Promise<Application> {
    return apiClient.patch<Application>(`/api/applications/${id}/status`, { status, notes });
  }

  // Rate application
  async rateApplication(id: number, rating: number, notes?: string): Promise<Application> {
    return apiClient.patch<Application>(`/api/applications/${id}/rating`, { rating, notes });
  }

  // Add note to application
  async addNote(applicationId: number, note: Partial<ApplicationNote>): Promise<ApplicationNote> {
    return apiClient.post<ApplicationNote>(`/api/applications/${applicationId}/notes`, note);
  }

  // Get application statistics
  async getStatistics(filters?: Partial<ApplicationFilters>): Promise<ApplicationStatistics> {
    return apiClient.get<ApplicationStatistics>('/api/applications/statistics', filters);
  }

  // Get high-rated applications
  async getHighRatedApplications(minRating = 4, limit = 10): Promise<Application[]> {
    return apiClient.get<Application[]>('/api/applications/high-rated', { minRating, limit });
  }

  // Bulk update applications
  async bulkUpdateApplications(
    applicationIds: number[],
    updates: Partial<Pick<Application, 'status' | 'rating' | 'tags'>>
  ): Promise<Application[]> {
    return apiClient.patch<Application[]>('/api/applications/bulk', {
      applicationIds,
      updates,
    });
  }

  // Export applications
  async exportApplications(
    filters?: ApplicationFilters,
    format: 'csv' | 'xlsx' | 'json' = 'csv'
  ): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries({ ...filters, format }).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    } else {
      params.append('format', format);
    }
    
    const response = await fetch(`${apiClient['baseURL']}/api/applications/export?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return await response.blob();
  }

  // Upload resume
  async uploadResume(
    applicationId: number,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{ resumeUrl: string }> {
    return apiClient.uploadFile<{ resumeUrl: string }>(
      `/api/applications/${applicationId}/resume`,
      file,
      {},
      onProgress
    );
  }

  // Search applications
  async searchApplications(
    query: string,
    filters?: ApplicationFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Application>> {
    const params = {
      q: query,
      ...filters,
      ...pagination,
    };
    
    return apiClient.get<PaginatedResponse<Application>>('/api/applications/search', params);
  }

  // Get application timeline
  async getApplicationTimeline(applicationId: number): Promise<Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    user: string;
    metadata?: any;
  }>> {
    return apiClient.get<Array<any>>(`/api/applications/${applicationId}/timeline`);
  }
}

// Interview Management API Service
export interface InterviewSlot {
  id?: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  interviewerId?: number;
  interviewerName?: string;
}

export interface InterviewScheduleRequest {
  applicationId: number;
  interviewerId: number;
  type: Interview['type'];
  round: string;
  startTime: string;
  durationMinutes: number;
  location?: string;
  meetingLink?: string;
  notes?: string;
}

export interface InterviewStatistics {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  averageDuration: number;
  averageRating: number;
  completionRate: number;
  monthlyTrends: Array<{
    month: string;
    scheduled: number;
    completed: number;
  }>;
}

class InterviewApiService {
  // Get all interviews
  async getInterviews(
    filters?: {
      status?: Interview['status'];
      type?: Interview['type'];
      interviewerId?: number;
      applicationId?: number;
      dateFrom?: string;
      dateTo?: string;
    },
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Interview>> {
    const params = {
      ...filters,
      ...pagination,
    };
    
    return apiClient.get<PaginatedResponse<Interview>>('/api/interviews', params);
  }

  // Get interview by ID
  async getInterview(id: number): Promise<Interview> {
    return apiClient.get<Interview>(`/api/interviews/${id}`);
  }

  // Schedule interview
  async scheduleInterview(scheduleData: InterviewScheduleRequest): Promise<Interview> {
    return apiClient.post<Interview>('/api/interviews/schedule', scheduleData);
  }

  // Update interview
  async updateInterview(id: number, interviewData: Partial<Interview>): Promise<Interview> {
    return apiClient.put<Interview>(`/api/interviews/${id}`, interviewData);
  }

  // Cancel interview
  async cancelInterview(id: number, reason?: string): Promise<Interview> {
    return apiClient.patch<Interview>(`/api/interviews/${id}/cancel`, { reason });
  }

  // Reschedule interview
  async rescheduleInterview(
    id: number,
    newStartTime: string,
    reason?: string
  ): Promise<Interview> {
    return apiClient.patch<Interview>(`/api/interviews/${id}/reschedule`, {
      newStartTime,
      reason,
    });
  }

  // Submit feedback
  async submitFeedback(interviewId: number, feedback: Partial<InterviewFeedback>): Promise<InterviewFeedback> {
    return apiClient.post<InterviewFeedback>(`/api/interviews/${interviewId}/feedback`, feedback);
  }

  // Get available slots
  async getAvailableSlots(
    interviewerId: number,
    dateFrom: string,
    dateTo: string,
    durationMinutes: number
  ): Promise<InterviewSlot[]> {
    const params = {
      interviewerId,
      dateFrom,
      dateTo,
      durationMinutes,
    };
    
    return apiClient.get<InterviewSlot[]>('/api/interviews/available-slots', params);
  }

  // Get interview statistics
  async getStatistics(filters?: {
    interviewerId?: number;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<InterviewStatistics> {
    return apiClient.get<InterviewStatistics>('/api/interviews/statistics', filters);
  }

  // Get interviewer calendar
  async getInterviewerCalendar(
    interviewerId: number,
    dateFrom: string,
    dateTo: string
  ): Promise<Interview[]> {
    const params = {
      interviewerId,
      dateFrom,
      dateTo,
    };
    
    return apiClient.get<Interview[]>('/api/interviews/calendar', params);
  }

  // Bulk reschedule interviews
  async bulkRescheduleInterviews(
    interviewIds: number[],
    reason: string
  ): Promise<Interview[]> {
    return apiClient.patch<Interview[]>('/api/interviews/bulk-reschedule', {
      interviewIds,
      reason,
    });
  }
}

// Export service instances
export const applicationApi = new ApplicationApiService();
export const interviewApi = new InterviewApiService();
