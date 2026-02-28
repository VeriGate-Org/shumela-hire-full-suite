import { apiClient, PaginatedResponse, PaginationParams } from './apiClient';

// DEPRECATED: This file uses /api/jobs/* endpoints which do not exist on the backend.
// The backend uses /api/job-postings/* (see JobPostingController.java).
// The JobPosting type below diverges from the backend enum — it uses lowercase statuses
// and includes 'paused'/'archived' which do not exist on the backend.
// The analyticsApi and workflowApi exports are retained for now as they are re-exported by services/index.ts.

// Job Management API Service
export interface JobPosting {
  id: number;
  title: string;
  description: string;
  department: string;
  location: string;
  employmentType: 'full_time' | 'part_time' | 'contract' | 'internship';
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  status: 'draft' | 'published' | 'paused' | 'closed' | 'archived';
  statusDisplayName: string;
  statusCssClass: string;
  statusIcon: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  skills: JobSkill[];
  tags: string[];
  applicationDeadline?: string;
  publishedAt?: string;
  closedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  applicationCount: number;
  viewCount: number;
  isUrgent: boolean;
  isRemoteAllowed: boolean;
  applicationUrl?: string;
}

export interface JobSkill {
  id: number;
  name: string;
  category: string;
  isRequired: boolean;
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface JobTemplate {
  id: number;
  name: string;
  description: string;
  category: string;
  department: string;
  templateData: Partial<JobPosting>;
  isActive: boolean;
  usageCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobStatistics {
  total: number;
  byStatus: Record<string, number>;
  byDepartment: Record<string, number>;
  byEmploymentType: Record<string, number>;
  averageApplications: number;
  averageTimeToFill: number;
  topPerformingJobs: Array<{
    id: number;
    title: string;
    applicationCount: number;
    conversionRate: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    posted: number;
    filled: number;
    applications: number;
  }>;
}

export interface JobFilters {
  status?: string;
  department?: string;
  location?: string;
  employmentType?: string;
  experienceLevel?: string;
  skills?: string[];
  salaryMin?: number;
  salaryMax?: number;
  isRemoteAllowed?: boolean;
  isUrgent?: boolean;
  createdFrom?: string;
  createdTo?: string;
}

class JobApiService {
  // Get all job postings
  async getJobs(
    filters?: JobFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<JobPosting>> {
    const params = {
      ...filters,
      ...pagination,
      skills: filters?.skills?.join(','),
    };
    
    return apiClient.get<PaginatedResponse<JobPosting>>('/api/jobs', params);
  }

  // Get job by ID
  async getJob(id: number): Promise<JobPosting> {
    return apiClient.get<JobPosting>(`/api/jobs/${id}`);
  }

  // Create new job
  async createJob(jobData: Partial<JobPosting>): Promise<JobPosting> {
    return apiClient.post<JobPosting>('/api/jobs', jobData);
  }

  // Update job
  async updateJob(id: number, jobData: Partial<JobPosting>): Promise<JobPosting> {
    return apiClient.put<JobPosting>(`/api/jobs/${id}`, jobData);
  }

  // Update job status
  async updateJobStatus(id: number, status: JobPosting['status']): Promise<JobPosting> {
    return apiClient.patch<JobPosting>(`/api/jobs/${id}/status`, { status });
  }

  // Publish job
  async publishJob(id: number): Promise<JobPosting> {
    return apiClient.post<JobPosting>(`/api/jobs/${id}/publish`);
  }

  // Unpublish job
  async unpublishJob(id: number, reason?: string): Promise<JobPosting> {
    return apiClient.post<JobPosting>(`/api/jobs/${id}/unpublish`, { reason });
  }

  // Close job
  async closeJob(id: number, reason?: string): Promise<JobPosting> {
    return apiClient.post<JobPosting>(`/api/jobs/${id}/close`, { reason });
  }

  // Archive job
  async archiveJob(id: number): Promise<JobPosting> {
    return apiClient.post<JobPosting>(`/api/jobs/${id}/archive`);
  }

  // Duplicate job
  async duplicateJob(id: number, title?: string): Promise<JobPosting> {
    return apiClient.post<JobPosting>(`/api/jobs/${id}/duplicate`, { title });
  }

  // Get job statistics
  async getStatistics(filters?: Partial<JobFilters>): Promise<JobStatistics> {
    return apiClient.get<JobStatistics>('/api/jobs/statistics', filters);
  }

  // Search jobs
  async searchJobs(
    query: string,
    filters?: JobFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<JobPosting>> {
    const params = {
      q: query,
      ...filters,
      ...pagination,
      skills: filters?.skills?.join(','),
    };
    
    return apiClient.get<PaginatedResponse<JobPosting>>('/api/jobs/search', params);
  }

  // Get job applications
  async getJobApplications(
    jobId: number,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<any>> {
    return apiClient.get<PaginatedResponse<any>>(`/api/jobs/${jobId}/applications`, pagination);
  }

  // Bulk update jobs
  async bulkUpdateJobs(
    jobIds: number[],
    updates: Partial<Pick<JobPosting, 'status' | 'tags' | 'isUrgent'>>
  ): Promise<JobPosting[]> {
    return apiClient.patch<JobPosting[]>('/api/jobs/bulk', {
      jobIds,
      updates,
    });
  }

  // Get job templates
  async getJobTemplates(
    filters?: {
      category?: string;
      department?: string;
      isActive?: boolean;
    }
  ): Promise<JobTemplate[]> {
    return apiClient.get<JobTemplate[]>('/api/job-templates', filters);
  }

  // Create job from template
  async createJobFromTemplate(templateId: number, overrides?: Partial<JobPosting>): Promise<JobPosting> {
    return apiClient.post<JobPosting>(`/api/job-templates/${templateId}/create-job`, overrides);
  }

  // Get job skills
  async getJobSkills(category?: string): Promise<JobSkill[]> {
    const params = category ? { category } : undefined;
    return apiClient.get<JobSkill[]>('/api/jobs/skills', params);
  }
}

// Analytics API Service
export interface RecruitmentMetrics {
  totalApplications: number;
  totalJobs: number;
  totalHires: number;
  averageTimeToHire: number;
  conversionRate: number;
  costPerHire: number;
  sourcingEffectiveness: Array<{
    source: string;
    applications: number;
    hires: number;
    conversionRate: number;
  }>;
  departmentMetrics: Array<{
    department: string;
    openPositions: number;
    applications: number;
    hires: number;
    avgTimeToHire: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    applications: number;
    hires: number;
    jobsPosted: number;
  }>;
}

export interface PipelineMetrics {
  stages: Array<{
    stage: string;
    count: number;
    percentage: number;
    averageTimeInStage: number;
  }>;
  conversionRates: Array<{
    fromStage: string;
    toStage: string;
    rate: number;
  }>;
  bottlenecks: Array<{
    stage: string;
    averageTime: number;
    count: number;
  }>;
}

export interface PerformanceMetrics {
  recruiters: Array<{
    id: number;
    name: string;
    totalApplicationsReviewed: number;
    totalHires: number;
    averageTimeToHire: number;
    conversionRate: number;
    performance: 'excellent' | 'good' | 'average' | 'needs_improvement';
  }>;
  departments: Array<{
    name: string;
    totalPositions: number;
    filledPositions: number;
    fillRate: number;
    averageTimeToFill: number;
  }>;
  interviewers: Array<{
    id: number;
    name: string;
    interviewsConducted: number;
    averageRating: number;
    onTimeRate: number;
  }>;
}

export interface RecruitmentAnalytics {
  timeRange: {
    from: string;
    to: string;
  };
  overview: RecruitmentMetrics;
  pipeline: PipelineMetrics;
  performance: PerformanceMetrics;
  insights: Array<{
    type: 'positive' | 'negative' | 'neutral';
    title: string;
    description: string;
    value?: number;
    change?: number;
    recommendation?: string;
  }>;
}

class AnalyticsApiService {
  // Get recruitment metrics
  async getRecruitmentMetrics(
    dateFrom?: string,
    dateTo?: string,
    department?: string
  ): Promise<RecruitmentMetrics> {
    const params = {
      dateFrom,
      dateTo,
      department,
    };
    
    return apiClient.get<RecruitmentMetrics>('/api/analytics/recruitment-metrics', params);
  }

  // Get pipeline metrics
  async getPipelineMetrics(
    dateFrom?: string,
    dateTo?: string,
    department?: string
  ): Promise<PipelineMetrics> {
    const params = {
      dateFrom,
      dateTo,
      department,
    };
    
    return apiClient.get<PipelineMetrics>('/api/analytics/pipeline-metrics', params);
  }

  // Get performance metrics
  async getPerformanceMetrics(
    dateFrom?: string,
    dateTo?: string,
    department?: string
  ): Promise<PerformanceMetrics> {
    const params = {
      dateFrom,
      dateTo,
      department,
    };
    
    return apiClient.get<PerformanceMetrics>('/api/analytics/performance-metrics', params);
  }

  // Get comprehensive analytics
  async getAnalytics(
    dateFrom?: string,
    dateTo?: string,
    department?: string
  ): Promise<RecruitmentAnalytics> {
    const params = {
      dateFrom,
      dateTo,
      department,
    };
    
    return apiClient.get<RecruitmentAnalytics>('/api/analytics/comprehensive', params);
  }

  // Get custom report data
  async getCustomReportData(
    reportConfig: {
      metrics: string[];
      groupBy: string[];
      filters: Record<string, any>;
      dateRange: {
        from: string;
        to: string;
      };
    }
  ): Promise<any> {
    return apiClient.post<any>('/api/analytics/custom-report', reportConfig);
  }

  // Get dashboard widgets data
  async getDashboardWidgets(
    widgets: string[],
    dateFrom?: string,
    dateTo?: string
  ): Promise<Record<string, any>> {
    const params = {
      widgets: widgets.join(','),
      dateFrom,
      dateTo,
    };
    
    return apiClient.get<Record<string, any>>('/api/analytics/dashboard-widgets', params);
  }

  // Export analytics data
  async exportAnalytics(
    type: 'recruitment' | 'pipeline' | 'performance' | 'comprehensive',
    format: 'csv' | 'xlsx' | 'pdf',
    dateFrom?: string,
    dateTo?: string,
    department?: string
  ): Promise<Blob> {
    const params = new URLSearchParams();
    
    [
      ['type', type],
      ['format', format],
      ['dateFrom', dateFrom],
      ['dateTo', dateTo],
      ['department', department],
    ].forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key as string, value.toString());
      }
    });
    
    const response = await fetch(`${apiClient['baseURL']}/api/analytics/export?${params.toString()}`, {
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

  // Get real-time metrics
  async getRealTimeMetrics(): Promise<{
    activeApplications: number;
    scheduledInterviews: number;
    pendingOffers: number;
    newApplicationsToday: number;
    interviewsCompletedToday: number;
    offersExtendedToday: number;
  }> {
    return apiClient.get<any>('/api/analytics/real-time');
  }
}

// Workflow API Service (integrating with Day 8 workflow system)
export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'running' | 'completed' | 'failed' | 'paused' | 'cancelled';
  startedAt: string;
  completedAt?: string;
  triggeredBy: string;
  context: Record<string, any>;
  currentStep?: number;
  totalSteps: number;
  executionLog: Array<{
    id: string;
    timestamp: string;
    step: number;
    action: string;
    status: string;
    message: string;
    duration?: number;
  }>;
  error?: string;
}

class WorkflowApiService {
  // Execute workflow
  async executeWorkflow(workflowId: string, context?: Record<string, any>): Promise<WorkflowExecution> {
    return apiClient.post<WorkflowExecution>(`/api/workflows/${workflowId}/execute`, { context });
  }

  // Get workflow executions
  async getExecutions(
    workflowId?: string,
    status?: string,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<WorkflowExecution>> {
    const params = {
      workflowId,
      status,
      ...pagination,
    };
    
    return apiClient.get<PaginatedResponse<WorkflowExecution>>('/api/workflows/executions', params);
  }

  // Get execution by ID
  async getExecution(executionId: string): Promise<WorkflowExecution> {
    return apiClient.get<WorkflowExecution>(`/api/workflows/executions/${executionId}`);
  }

  // Stop execution
  async stopExecution(executionId: string): Promise<WorkflowExecution> {
    return apiClient.post<WorkflowExecution>(`/api/workflows/executions/${executionId}/stop`);
  }

  // Retry execution
  async retryExecution(executionId: string): Promise<WorkflowExecution> {
    return apiClient.post<WorkflowExecution>(`/api/workflows/executions/${executionId}/retry`);
  }

  // Get workflow statistics
  async getWorkflowStatistics(): Promise<{
    totalExecutions: number;
    successRate: number;
    averageExecutionTime: number;
    activeWorkflows: number;
    failedExecutions: number;
    byWorkflow: Array<{
      workflowId: string;
      workflowName: string;
      executions: number;
      successRate: number;
      averageTime: number;
    }>;
  }> {
    return apiClient.get<any>('/api/workflows/statistics');
  }
}

// Export service instances
export const jobApi = new JobApiService();
export const analyticsApi = new AnalyticsApiService();
export const workflowApi = new WorkflowApiService();
