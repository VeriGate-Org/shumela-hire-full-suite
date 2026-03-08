import { apiFetch } from '@/lib/api-fetch';

export interface TrainingCourse {
  id: number;
  title: string;
  code: string;
  description: string | null;
  deliveryMethod: string;
  category: string | null;
  provider: string | null;
  durationHours: number | null;
  maxParticipants: number | null;
  cost: number | null;
  isMandatory: boolean;
  isActive: boolean;
  sessionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingSession {
  id: number;
  courseId: number;
  courseTitle: string;
  courseCode: string;
  trainerName: string | null;
  location: string | null;
  startDate: string;
  endDate: string;
  status: string;
  availableSeats: number | null;
  enrollmentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingEnrollment {
  id: number;
  sessionId: number;
  courseTitle: string;
  courseCode: string;
  employeeId: number;
  employeeName: string;
  status: string;
  score: number | null;
  certificateUrl: string | null;
  enrolledAt: string;
  completedAt: string | null;
  sessionStartDate: string;
  sessionEndDate: string;
  createdAt: string;
}

export interface Certification {
  id: number;
  employeeId: number;
  employeeName: string;
  name: string;
  issuingBody: string | null;
  certificationNumber: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  status: string;
  documentUrl: string | null;
  expired: boolean;
  expiringSoon: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingAnalytics {
  totalCourses: number;
  activeCourses: number;
  mandatoryCourses: number;
  categories: string[];
  totalSessions: number;
  upcomingSessions: number;
  openSessions: number;
  totalEnrollments: number;
  completedEnrollments: number;
  activeCertifications: number;
  expiringCertifications: number;
  expiredCertifications: number;
}

export const trainingService = {
  // Courses
  async getCourses(params?: { activeOnly?: boolean; search?: string }): Promise<TrainingCourse[]> {
    const searchParams = new URLSearchParams();
    if (params?.activeOnly) searchParams.set('activeOnly', 'true');
    if (params?.search) searchParams.set('search', params.search);
    const query = searchParams.toString();
    const response = await apiFetch(`/api/training/courses${query ? '?' + query : ''}`);
    if (!response.ok) return [];
    return await response.json();
  },

  async getCourse(id: number): Promise<TrainingCourse> {
    const response = await apiFetch(`/api/training/courses/${id}`);
    if (!response.ok) throw new Error('Course not found');
    return await response.json();
  },

  async getCategories(): Promise<string[]> {
    const response = await apiFetch('/api/training/courses/categories');
    if (!response.ok) return [];
    return await response.json();
  },

  async createCourse(data: Partial<TrainingCourse>): Promise<TrainingCourse> {
    const response = await apiFetch('/api/training/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to create course');
    }
    return await response.json();
  },

  async updateCourse(id: number, data: Partial<TrainingCourse>): Promise<TrainingCourse> {
    const response = await apiFetch(`/api/training/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to update course');
    }
    return await response.json();
  },

  async deleteCourse(id: number): Promise<void> {
    const response = await apiFetch(`/api/training/courses/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete course');
  },

  // Sessions
  async getSessions(params?: { courseId?: number; upcoming?: boolean; openOnly?: boolean }): Promise<TrainingSession[]> {
    const searchParams = new URLSearchParams();
    if (params?.courseId) searchParams.set('courseId', params.courseId.toString());
    if (params?.upcoming) searchParams.set('upcoming', 'true');
    if (params?.openOnly) searchParams.set('openOnly', 'true');
    const query = searchParams.toString();
    const response = await apiFetch(`/api/training/sessions${query ? '?' + query : ''}`);
    if (!response.ok) return [];
    return await response.json();
  },

  async getSession(id: number): Promise<TrainingSession> {
    const response = await apiFetch(`/api/training/sessions/${id}`);
    if (!response.ok) throw new Error('Session not found');
    return await response.json();
  },

  async createSession(data: any): Promise<TrainingSession> {
    const response = await apiFetch('/api/training/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to create session');
    }
    return await response.json();
  },

  async updateSession(id: number, data: any): Promise<TrainingSession> {
    const response = await apiFetch(`/api/training/sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to update session');
    }
    return await response.json();
  },

  async openSession(id: number): Promise<TrainingSession> {
    const response = await apiFetch(`/api/training/sessions/${id}/open`, { method: 'PUT' });
    if (!response.ok) throw new Error('Failed to open session');
    return await response.json();
  },

  async closeSession(id: number): Promise<TrainingSession> {
    const response = await apiFetch(`/api/training/sessions/${id}/close`, { method: 'PUT' });
    if (!response.ok) throw new Error('Failed to close session');
    return await response.json();
  },

  async cancelSession(id: number): Promise<TrainingSession> {
    const response = await apiFetch(`/api/training/sessions/${id}/cancel`, { method: 'PUT' });
    if (!response.ok) throw new Error('Failed to cancel session');
    return await response.json();
  },

  // Enrollments
  async getEnrollments(params: { sessionId?: number; employeeId?: number }): Promise<TrainingEnrollment[]> {
    const searchParams = new URLSearchParams();
    if (params.sessionId) searchParams.set('sessionId', params.sessionId.toString());
    if (params.employeeId) searchParams.set('employeeId', params.employeeId.toString());
    const response = await apiFetch(`/api/training/enrollments?${searchParams}`);
    if (!response.ok) return [];
    return await response.json();
  },

  async enroll(sessionId: number, employeeId: number): Promise<TrainingEnrollment> {
    const response = await apiFetch('/api/training/enrollments', {
      method: 'POST',
      body: JSON.stringify({ sessionId, employeeId }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to enroll');
    }
    return await response.json();
  },

  async markAttended(id: number): Promise<TrainingEnrollment> {
    const response = await apiFetch(`/api/training/enrollments/${id}/attended`, { method: 'PUT' });
    if (!response.ok) throw new Error('Failed to mark attended');
    return await response.json();
  },

  async markCompleted(id: number, score?: number, certificateUrl?: string): Promise<TrainingEnrollment> {
    const params = new URLSearchParams();
    if (score !== undefined) params.set('score', score.toString());
    if (certificateUrl) params.set('certificateUrl', certificateUrl);
    const response = await apiFetch(`/api/training/enrollments/${id}/completed?${params}`, { method: 'PUT' });
    if (!response.ok) throw new Error('Failed to mark completed');
    return await response.json();
  },

  async cancelEnrollment(id: number): Promise<TrainingEnrollment> {
    const response = await apiFetch(`/api/training/enrollments/${id}/cancel`, { method: 'PUT' });
    if (!response.ok) throw new Error('Failed to cancel enrollment');
    return await response.json();
  },

  // Certifications
  async getCertifications(params?: { employeeId?: number; expiring?: boolean; expired?: boolean }): Promise<Certification[]> {
    const searchParams = new URLSearchParams();
    if (params?.employeeId) searchParams.set('employeeId', params.employeeId.toString());
    if (params?.expiring) searchParams.set('expiring', 'true');
    if (params?.expired) searchParams.set('expired', 'true');
    const query = searchParams.toString();
    const response = await apiFetch(`/api/training/certifications${query ? '?' + query : ''}`);
    if (!response.ok) return [];
    return await response.json();
  },

  async createCertification(data: any): Promise<Certification> {
    const response = await apiFetch('/api/training/certifications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to create certification');
    }
    return await response.json();
  },

  async updateCertification(id: number, data: any): Promise<Certification> {
    const response = await apiFetch(`/api/training/certifications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to update certification');
    }
    return await response.json();
  },

  async revokeCertification(id: number): Promise<void> {
    const response = await apiFetch(`/api/training/certifications/${id}/revoke`, { method: 'PUT' });
    if (!response.ok) throw new Error('Failed to revoke certification');
  },

  // Analytics
  async getAnalytics(): Promise<TrainingAnalytics> {
    const response = await apiFetch('/api/training/analytics');
    if (!response.ok) return {} as TrainingAnalytics;
    return await response.json();
  },
};
