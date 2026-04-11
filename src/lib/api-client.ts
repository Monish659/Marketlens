/**
 * API client utility for making authenticated requests to user-specific endpoints
 */

export interface ApiClientOptions {
  baseUrl?: string;
  getAccessToken?: () => Promise<string | null>;
}

export class ApiClient {
  private baseUrl: string;
  private getAccessToken?: () => Promise<string | null>;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl || '';
    this.getAccessToken = options.getAccessToken;
  }

  /**
   * Make an authenticated API request
   */
  async request<T = any>(
    endpoint: string,
    options: RequestInit & { requireAuth?: boolean } = {}
  ): Promise<T> {
    const { requireAuth = true, ...fetchOptions } = options;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Merge existing headers
    if (fetchOptions.headers) {
      Object.assign(headers, fetchOptions.headers);
    }

    // Add authentication header if required
    if (requireAuth) {
      const token = await this.getAccessToken?.();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else if (process.env.NODE_ENV === 'development') {
        // Fallback for development - use a test user ID
        headers['x-user-id'] = 'dev_user_' + Math.random().toString(36).substr(2, 9);
      } else {
        throw new Error('Authentication token required');
      }
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * POST request helper
   */
  async post<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  /**
   * GET request helper
   */
  async get<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
      ...options,
    });
  }

  /**
   * PUT request helper
   */
  async put<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  /**
   * DELETE request helper
   */
  async delete<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      ...options,
    });
  }
}

/**
 * Create an API client instance with Auth0 integration
 */
export function createApiClient(getAccessToken?: () => Promise<string | null>): ApiClient {
  return new ApiClient({
    getAccessToken,
  });
}

/**
 * Example usage with Auth0
 */
export function createAuth0ApiClient(auth0GetToken: () => Promise<string>): ApiClient {
  return new ApiClient({
    getAccessToken: async () => {
      try {
        return await auth0GetToken();
      } catch (error) {
        console.error('Failed to get Auth0 token:', error);
        return null;
      }
    },
  });
}
