// Base API configuration and utilities
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
  requestId?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
  /** Opaque cursor for DynamoDB cursor-based pagination. When provided, `page` is ignored. */
  cursor?: string;
}

/**
 * Paginated response that supports both JPA page-based and DynamoDB cursor-based pagination.
 * - JPA responses include `totalElements`, `totalPages`, `number`, `first`, `last`.
 * - DynamoDB responses include `nextCursor` (opaque token) and may omit totals.
 */
export interface PaginatedResponse<T> {
  content: T[];
  /** Total element count. Present for JPA; may be undefined for DynamoDB. */
  totalElements?: number;
  /** Total pages. Present for JPA; may be undefined for DynamoDB. */
  totalPages?: number;
  size: number;
  /** Current page number (0-based). Present for JPA; may be undefined for DynamoDB. */
  number?: number;
  first: boolean;
  last: boolean;
  empty: boolean;
  /** Opaque cursor pointing to the next page. Present for DynamoDB cursor-based responses. */
  nextCursor?: string;
}

export interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export class ApiClient {
  private baseURL: string;
  private timeout: number;
  private retryAttempts: number;
  private retryDelay: number;
  private requestInterceptors: Array<(config: any) => any> = [];
  private responseInterceptors: Array<{
    onSuccess: (response: any) => any;
    onError: (error: any) => any;
  }> = [];

  constructor(config: ApiClientConfig = {}) {
    this.baseURL = config.baseURL
      || process.env.NEXT_PUBLIC_API_URL
      || '';
    this.timeout = config.timeout || 30000;
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    attempt = 1
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (attempt < this.retryAttempts && this.shouldRetry(error)) {
        console.warn(`API request failed (attempt ${attempt}/${this.retryAttempts}), retrying...`, error);
        await this.sleep(this.retryDelay * attempt);
        return this.executeWithRetry(operation, attempt + 1);
      }
      throw error;
    }
  }

  private shouldRetry(error: any): boolean {
    // Retry on network errors or 5xx status codes
    return (
      error.name === 'NetworkError' ||
      error.code === 'NETWORK_ERROR' ||
      (error.status >= 500 && error.status < 600) ||
      error.code === 'TIMEOUT'
    );
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    
    if (!response.ok) {
      let errorData: any;
      
      try {
        if (contentType?.includes('application/json')) {
          errorData = await response.json();
        } else {
          errorData = { message: await response.text() };
        }
      } catch {
        errorData = { message: `HTTP ${response.status} ${response.statusText}` };
      }

      const apiError: ApiError = {
        code: errorData.code || `HTTP_${response.status}`,
        message: errorData.message || `Request failed with status ${response.status}`,
        details: errorData.details,
        timestamp: new Date().toISOString(),
      };

      throw apiError;
    }

    if (contentType?.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text() as any;
  }

  // Interceptor methods
  addRequestInterceptor(interceptor: (config: any) => any): void {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(
    onSuccess: (response: any) => any,
    onError?: (error: any) => any
  ): void {
    this.responseInterceptors.push({
      onSuccess,
      onError: onError || ((error) => Promise.reject(error)),
    });
  }

  // Direct request method for retry scenarios
  async request(config: any): Promise<any> {
    const { method, url, data, ...options } = config;
    
    return this.executeWithRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(`${this.baseURL}${url}`, {
          method: method.toUpperCase(),
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          body: data ? JSON.stringify(data) : undefined,
          signal: controller.signal,
          ...options,
        });

        return await this.handleResponse(response);
      } finally {
        clearTimeout(timeoutId);
      }
    });
  }

  private applyRequestInterceptors(config: any): any {
    return this.requestInterceptors.reduce((acc, interceptor) => interceptor(acc), config);
  }

  private async applyResponseInterceptors(responsePromise: Promise<any>): Promise<any> {
    try {
      let response = await responsePromise;
      
      for (const interceptor of this.responseInterceptors) {
        response = await interceptor.onSuccess(response);
      }
      
      return response;
    } catch (error) {
      let finalError = error;
      
      for (const interceptor of this.responseInterceptors) {
        try {
          finalError = await interceptor.onError(finalError);
        } catch (interceptorError) {
          finalError = interceptorError;
        }
      }
      
      throw finalError;
    }
  }

  async get<T>(
    endpoint: string,
    params?: Record<string, any>,
    options: RequestInit = {}
  ): Promise<T> {
    const url = new URL(`${this.baseURL}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return this.executeWithRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          signal: controller.signal,
          ...options,
        });

        return await this.handleResponse<T>(response);
      } finally {
        clearTimeout(timeoutId);
      }
    });
  }

  async post<T>(
    endpoint: string,
    data?: any,
    options: RequestInit = {}
  ): Promise<T> {
    return this.executeWithRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          body: data ? JSON.stringify(data) : undefined,
          signal: controller.signal,
          ...options,
        });

        return await this.handleResponse<T>(response);
      } finally {
        clearTimeout(timeoutId);
      }
    });
  }

  async put<T>(
    endpoint: string,
    data?: any,
    options: RequestInit = {}
  ): Promise<T> {
    return this.executeWithRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          body: data ? JSON.stringify(data) : undefined,
          signal: controller.signal,
          ...options,
        });

        return await this.handleResponse<T>(response);
      } finally {
        clearTimeout(timeoutId);
      }
    });
  }

  async patch<T>(
    endpoint: string,
    data?: any,
    options: RequestInit = {}
  ): Promise<T> {
    return this.executeWithRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          body: data ? JSON.stringify(data) : undefined,
          signal: controller.signal,
          ...options,
        });

        return await this.handleResponse<T>(response);
      } finally {
        clearTimeout(timeoutId);
      }
    });
  }

  async delete<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    return this.executeWithRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          signal: controller.signal,
          ...options,
        });

        return await this.handleResponse<T>(response);
      } finally {
        clearTimeout(timeoutId);
      }
    });
  }

  // File upload method
  async uploadFile<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, any>,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      
      formData.append('file', file);
      
      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, String(value));
        });
      }

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText);
            resolve(result);
          } catch {
            resolve(xhr.responseText as any);
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(error);
          } catch {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timeout'));
      });

      xhr.timeout = this.timeout;
      xhr.open('POST', `${this.baseURL}${endpoint}`);
      xhr.send(formData);
    });
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Request/Response interceptors
export class ApiInterceptors {
  private static requestInterceptors: Array<(config: RequestInit) => RequestInit | Promise<RequestInit>> = [];
  private static responseInterceptors: Array<(response: Response) => Response | Promise<Response>> = [];

  static addRequestInterceptor(interceptor: (config: RequestInit) => RequestInit | Promise<RequestInit>) {
    this.requestInterceptors.push(interceptor);
  }

  static addResponseInterceptor(interceptor: (response: Response) => Response | Promise<Response>) {
    this.responseInterceptors.push(interceptor);
  }

  static async processRequest(config: RequestInit): Promise<RequestInit> {
    let processedConfig = config;
    
    for (const interceptor of this.requestInterceptors) {
      processedConfig = await interceptor(processedConfig);
    }
    
    return processedConfig;
  }

  static async processResponse(response: Response): Promise<Response> {
    let processedResponse = response;
    
    for (const interceptor of this.responseInterceptors) {
      processedResponse = await interceptor(processedResponse);
    }
    
    return processedResponse;
  }
}

// Authentication interceptor — uses Cognito session token when available,
// falls back to sessionStorage for dev mock auth
ApiInterceptors.addRequestInterceptor(async (config) => {
  let token: string | null = null;

  // Try Cognito session first
  try {
    const { fetchAuthSession } = await import('aws-amplify/auth');
    const session = await fetchAuthSession({ forceRefresh: false });
    // Use ID token consistently — it carries custom:tenant_id, cognito:groups,
    // and other claims the backend reads for authorization and tenant resolution.
    token = session.tokens?.idToken?.toString()
      || session.tokens?.accessToken?.toString() || null;
  } catch {
    // Cognito not configured or no session — fall back to mock
  }

  // Fall back to session storage (dev mock auth)
  if (!token && typeof window !== 'undefined') {
    token = sessionStorage.getItem('jwt_token');
  }

  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

// Tenant header interceptor — injects X-Tenant-Id from subdomain
ApiInterceptors.addRequestInterceptor(async (config) => {
  const { getTenantSubdomain } = await import('@/lib/tenant-utils');
  const tenantSubdomain = getTenantSubdomain();
  config.headers = {
    ...config.headers,
    'X-Tenant-Id': tenantSubdomain,
  };
  return config;
});

// Error handling interceptor
ApiInterceptors.addResponseInterceptor(async (response) => {
  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
  return response;
});
