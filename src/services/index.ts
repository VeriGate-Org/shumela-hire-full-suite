// API Services Index

// Core API Client
export { apiClient } from './api/apiClient';
export type { ApiError, PaginatedResponse, PaginationParams } from './api/apiClient';

// Job API — DEPRECATED: jobApi uses /api/jobs/* endpoints which don't exist on backend.
// Backend uses /api/job-postings/* (JobPostingController). analyticsApi/workflowApi retained.
export { jobApi, analyticsApi, workflowApi } from './api/jobApi';
export type {
  JobPosting,
  JobSkill,
  JobTemplate,
  JobStatistics,
  JobFilters,
  RecruitmentMetrics,
  PipelineMetrics,
  PerformanceMetrics,
  RecruitmentAnalytics,
  WorkflowExecution,
} from './api/jobApi';

// Authentication Service
export { authService, initializeAuth, PERMISSIONS } from './authService';
export type {
  LoginCredentials,
  AuthUser,
  AuthResponse,
  RefreshTokenResponse,
  PasswordResetRequest,
  PasswordReset,
  ChangePasswordRequest,
  UpdateProfileRequest,
  AuthEvent,
} from './authService';

// WebSocket Service
export {
  webSocketService,
  notificationService,
  initializeWebSocket
} from './webSocketService';
export type {
  WebSocketEvent,
  ApplicationStatusUpdate,
  InterviewScheduled,
  WorkflowStatusUpdate,
  NewApplicationReceived,
  OfferStatusUpdate,
  SystemNotification,
  ConnectionStatus,
  WebSocketOptions,
} from './webSocketService';

// Document Template Service
export { documentTemplateService, DocumentTemplateService } from './documentTemplateService';
export type { DocumentTemplateFilters } from './documentTemplateService';

// Import services for internal use
import { authService, initializeAuth } from './authService';
import { webSocketService, initializeWebSocket } from './webSocketService';

// Initialize all services
export const initializeServices = () => {
  initializeAuth();

  // WebSocket setup for dev mode
  authService.getToken().then(token => {
    if (token) {
      initializeWebSocket(token);
    }
  });
};

// Service health check
export const checkServiceHealth = async () => {
  const { apiClient } = await import('./api/apiClient');
  const results = {
    api: false,
    auth: false,
    websocket: false,
  };

  try {
    await apiClient.get('/api/health');
    results.api = true;
  } catch (error) {
    console.error('API health check failed:', error);
  }

  try {
    results.auth = authService.isAuthenticated();
  } catch (error) {
    console.error('Auth health check failed:', error);
  }

  try {
    results.websocket = webSocketService.isConnected();
  } catch (error) {
    console.error('WebSocket health check failed:', error);
  }

  return results;
};

// Service status information
export const getServiceStatus = () => {
  return {
    auth: {
      isAuthenticated: authService.isAuthenticated(),
    },
    websocket: {
      status: webSocketService.getConnectionStatus(),
      reconnectAttempts: webSocketService.getReconnectAttempts(),
    },
  };
};
