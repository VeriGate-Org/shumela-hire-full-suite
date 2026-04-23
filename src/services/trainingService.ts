import { apiFetch } from '@/lib/api-fetch';

export interface TrainingCourse {
  id: string;
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
  id: string;
  courseId: string;
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
  id: string;
  sessionId: string;
  courseTitle: string;
  courseCode: string;
  employeeId: string;
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
  id: string;
  employeeId: string;
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

export interface TrainingAttendanceRecord {
  id: string;
  sessionId: string;
  enrollmentId: string | null;
  employeeId: string;
  employeeName?: string;
  attended: boolean;
  checkInTime: string | null;
  notes: string | null;
  createdAt: string;
}

export interface TrainingEvaluation {
  id: string;
  sessionId: string;
  employeeId: string;
  overallRating: number;
  contentRating: number | null;
  instructorRating: number | null;
  relevanceRating: number | null;
  comments: string | null;
  createdAt: string;
}

export interface EvaluationSummary {
  count: number;
  averageOverall: number;
  averageContent: number;
  averageInstructor: number;
  averageRelevance: number;
}

export interface IDPGoal {
  id?: string;
  planId?: string;
  title: string;
  description: string | null;
  targetDate: string | null;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  linkedCourseId: string | null;
  linkedCertificationId: string | null;
  sortOrder: number;
}

export interface IndividualDevelopmentPlan {
  id: string;
  employeeId: string;
  title: string;
  description: string | null;
  startDate: string | null;
  targetDate: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  managerId: string | null;
  goals: IDPGoal[];
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

  async getCourse(id: string): Promise<TrainingCourse> {
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

  async updateCourse(id: string, data: Partial<TrainingCourse>): Promise<TrainingCourse> {
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

  async deleteCourse(id: string): Promise<void> {
    const response = await apiFetch(`/api/training/courses/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete course');
  },

  // Sessions
  async getSessions(params?: { courseId?: string; upcoming?: boolean; openOnly?: boolean }): Promise<TrainingSession[]> {
    const searchParams = new URLSearchParams();
    if (params?.courseId) searchParams.set('courseId', params.courseId);
    if (params?.upcoming) searchParams.set('upcoming', 'true');
    if (params?.openOnly) searchParams.set('openOnly', 'true');
    const query = searchParams.toString();
    const response = await apiFetch(`/api/training/sessions${query ? '?' + query : ''}`);
    if (!response.ok) return [];
    return await response.json();
  },

  async getSession(id: string): Promise<TrainingSession> {
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

  async updateSession(id: string, data: any): Promise<TrainingSession> {
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

  async openSession(id: string): Promise<TrainingSession> {
    const response = await apiFetch(`/api/training/sessions/${id}/open`, { method: 'PUT' });
    if (!response.ok) throw new Error('Failed to open session');
    return await response.json();
  },

  async closeSession(id: string): Promise<TrainingSession> {
    const response = await apiFetch(`/api/training/sessions/${id}/close`, { method: 'PUT' });
    if (!response.ok) throw new Error('Failed to close session');
    return await response.json();
  },

  async cancelSession(id: string): Promise<TrainingSession> {
    const response = await apiFetch(`/api/training/sessions/${id}/cancel`, { method: 'PUT' });
    if (!response.ok) throw new Error('Failed to cancel session');
    return await response.json();
  },

  // Enrollments
  async getEnrollments(params: { sessionId?: string; employeeId?: string }): Promise<TrainingEnrollment[]> {
    const searchParams = new URLSearchParams();
    if (params.sessionId) searchParams.set('sessionId', params.sessionId);
    if (params.employeeId) searchParams.set('employeeId', params.employeeId);
    const response = await apiFetch(`/api/training/enrollments?${searchParams}`);
    if (!response.ok) return [];
    return await response.json();
  },

  async enroll(sessionId: string, employeeId: string): Promise<TrainingEnrollment> {
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

  async markAttended(id: string): Promise<TrainingEnrollment> {
    const response = await apiFetch(`/api/training/enrollments/${id}/attended`, { method: 'PUT' });
    if (!response.ok) throw new Error('Failed to mark attended');
    return await response.json();
  },

  async markCompleted(id: string, score?: number, certificateUrl?: string): Promise<TrainingEnrollment> {
    const params = new URLSearchParams();
    if (score !== undefined) params.set('score', score.toString());
    if (certificateUrl) params.set('certificateUrl', certificateUrl);
    const response = await apiFetch(`/api/training/enrollments/${id}/completed?${params}`, { method: 'PUT' });
    if (!response.ok) throw new Error('Failed to mark completed');
    return await response.json();
  },

  async cancelEnrollment(id: string): Promise<TrainingEnrollment> {
    const response = await apiFetch(`/api/training/enrollments/${id}/cancel`, { method: 'PUT' });
    if (!response.ok) throw new Error('Failed to cancel enrollment');
    return await response.json();
  },

  // Certifications
  async getCertifications(params?: { employeeId?: string; expiring?: boolean; expired?: boolean }): Promise<Certification[]> {
    const searchParams = new URLSearchParams();
    if (params?.employeeId) searchParams.set('employeeId', params.employeeId);
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

  async updateCertification(id: string, data: any): Promise<Certification> {
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

  async revokeCertification(id: string): Promise<void> {
    const response = await apiFetch(`/api/training/certifications/${id}/revoke`, { method: 'PUT' });
    if (!response.ok) throw new Error('Failed to revoke certification');
  },

  // Attendance
  async getAttendance(sessionId: string): Promise<TrainingAttendanceRecord[]> {
    const response = await apiFetch(`/api/training/sessions/${sessionId}/attendance`);
    if (!response.ok) return [];
    return await response.json();
  },

  async recordAttendance(sessionId: string, records: Partial<TrainingAttendanceRecord>[]): Promise<TrainingAttendanceRecord[]> {
    const response = await apiFetch(`/api/training/sessions/${sessionId}/attendance`, {
      method: 'POST',
      body: JSON.stringify(records),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to record attendance');
    }
    return await response.json();
  },

  async updateAttendanceRecord(sessionId: string, attendanceId: string, data: { attended?: boolean; notes?: string }): Promise<TrainingAttendanceRecord> {
    const response = await apiFetch(`/api/training/sessions/${sessionId}/attendance/${attendanceId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update attendance');
    return await response.json();
  },

  // Evaluations
  async getEvaluations(sessionId: string): Promise<TrainingEvaluation[]> {
    const response = await apiFetch(`/api/training/sessions/${sessionId}/evaluations`);
    if (!response.ok) return [];
    return await response.json();
  },

  async submitEvaluation(sessionId: string, data: Partial<TrainingEvaluation>): Promise<TrainingEvaluation> {
    const response = await apiFetch(`/api/training/sessions/${sessionId}/evaluations`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to submit evaluation');
    }
    return await response.json();
  },

  async getEvaluationSummary(sessionId: string): Promise<EvaluationSummary> {
    const response = await apiFetch(`/api/training/sessions/${sessionId}/evaluations/summary`);
    if (!response.ok) return { count: 0, averageOverall: 0, averageContent: 0, averageInstructor: 0, averageRelevance: 0 };
    return await response.json();
  },

  // IDPs
  async getIDPs(params: { employeeId?: string; managerId?: string }): Promise<IndividualDevelopmentPlan[]> {
    const searchParams = new URLSearchParams();
    if (params.employeeId) searchParams.set('employeeId', params.employeeId);
    if (params.managerId) searchParams.set('managerId', params.managerId);
    const response = await apiFetch(`/api/training/idps?${searchParams}`);
    if (!response.ok) return [];
    return await response.json();
  },

  async getIDP(id: string): Promise<IndividualDevelopmentPlan> {
    const response = await apiFetch(`/api/training/idps/${id}`);
    if (!response.ok) {
      let msg = 'IDP not found';
      try {
        const err = await response.json();
        msg = err.message || err.error || msg;
      } catch { /* ignore parse error */ }
      throw new Error(msg);
    }
    return await response.json();
  },

  async createIDP(data: Partial<IndividualDevelopmentPlan>): Promise<IndividualDevelopmentPlan> {
    const response = await apiFetch('/api/training/idps', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to create IDP');
    }
    return await response.json();
  },

  async updateIDP(id: string, data: Partial<IndividualDevelopmentPlan>): Promise<IndividualDevelopmentPlan> {
    const response = await apiFetch(`/api/training/idps/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to update IDP');
    }
    return await response.json();
  },

  async deleteIDP(id: string): Promise<void> {
    const response = await apiFetch(`/api/training/idps/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete IDP');
  },

  async addIDPGoal(planId: string, goal: Partial<IDPGoal>): Promise<IndividualDevelopmentPlan> {
    const response = await apiFetch(`/api/training/idps/${planId}/goals`, {
      method: 'POST',
      body: JSON.stringify(goal),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to add goal');
    }
    return await response.json();
  },

  async updateIDPGoal(planId: string, goalId: string, data: { status?: string; title?: string }): Promise<IndividualDevelopmentPlan> {
    const response = await apiFetch(`/api/training/idps/${planId}/goals/${goalId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update goal');
    return await response.json();
  },

  // Analytics
  async getAnalytics(): Promise<TrainingAnalytics> {
    const response = await apiFetch('/api/training/analytics');
    if (!response.ok) return {} as TrainingAnalytics;
    return await response.json();
  },
};
