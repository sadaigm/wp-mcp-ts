/**
 * WordPress REST API Client
 * Handles communication with WordPress sites via the REST API
 */

export interface ErrorResponse {
  error: true;
  status_code?: number;
  message: string;
}

type ApiResponse<T = unknown> = T | ErrorResponse;

/**
 * WordPress API Client class
 */
export class WordPressClient {
  private baseUrl: string;
  private username: string;
  private appPassword: string;
  private authHeader: string;

  constructor(wpUrl: string, username: string, appPassword: string) {
    if (!wpUrl) {
      throw new Error('WP_URL environment variable must be set');
    }
    if (!username || !appPassword) {
      throw new Error('WP_USERNAME and WP_APP_PASSWORD environment variables must be set');
    }

    // Remove trailing slash from base URL
    this.baseUrl = wpUrl.replace(/\/$/, '');
    this.username = username;
    this.appPassword = appPassword;

    // Pre-compute auth header
    const credentials = Buffer.from(`${username}:${appPassword}`).toString('base64');
    this.authHeader = `Basic ${credentials}`;
  }

  /**
   * Get the full API URL for an endpoint
   */
  private getApiUrl(endpoint: string): string {
    return `${this.baseUrl}/wp-json/wp/v2/${endpoint}`;
  }

  /**
   * Make an HTTP request to the WordPress API
   */
  async makeRequest<T = unknown>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: unknown,
    params?: Record<string, string | number | boolean>,
    requireAuth = false
  ): Promise<ApiResponse<T>> {
    const url = this.getApiUrl(endpoint);

    // Build query string
    const queryParams = params ? new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    ).toString() : '';

    const fullUrl = queryParams ? `${url}?${queryParams}` : url;

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add auth header for POST/PUT/DELETE or when explicitly required
    if (['POST', 'PUT', 'DELETE'].includes(method) || requireAuth) {
      headers['Authorization'] = this.authHeader;
    }

    // Log request
    console.log(`[WordPress API] ${method} ${fullUrl}`);
    if (params) console.log(`[WordPress API] Params:`, JSON.stringify(params));
    if (data) console.log(`[WordPress API] Data:`, JSON.stringify(data).substring(0, 200) + '...');

    try {
      const response = await fetch(fullUrl, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      const responseText = await response.text();
      let responseData: unknown;

      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      // Log response
      console.log(`[WordPress API] Response Status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorResult: ErrorResponse = {
          error: true,
          status_code: response.status,
          message: typeof responseData === 'string' ? responseData : JSON.stringify(responseData),
        };
        console.error(`[WordPress API] Error:`, JSON.stringify(errorResult));
        return errorResult;
      }

      return responseData as T;
    } catch (error) {
      const errorResult: ErrorResponse = {
        error: true,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
      console.error(`[WordPress API] Exception:`, JSON.stringify(errorResult));
      return errorResult;
    }
  }

  /**
   * GET request
   */
  async get<T = unknown>(
    endpoint: string,
    params?: Record<string, string | number | boolean>,
    requireAuth = false
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>('GET', endpoint, undefined, params, requireAuth);
  }

  /**
   * POST request
   */
  async post<T = unknown>(
    endpoint: string,
    data?: unknown,
    params?: Record<string, string | number | boolean>
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>('POST', endpoint, data, params);
  }

  /**
   * PUT request
   */
  async put<T = unknown>(
    endpoint: string,
    data?: unknown,
    params?: Record<string, string | number | boolean>
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>('PUT', endpoint, data, params);
  }

  /**
   * DELETE request
   */
  async delete<T = unknown>(
    endpoint: string,
    params?: Record<string, string | number | boolean>
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>('DELETE', endpoint, undefined, params);
  }
}

/**
 * Create a WordPress client from environment variables
 */
export function createClientFromEnv(): WordPressClient {
  const wpUrl = process.env.WP_URL || '';
  const username = process.env.WP_USERNAME || '';
  const appPassword = process.env.WP_APP_PASSWORD || '';

  return new WordPressClient(wpUrl, username, appPassword);
}

/**
 * Check if response is an error
 */
export function isError<T>(response: ApiResponse<T>): response is ErrorResponse {
  return typeof response === 'object' && response !== null && 'error' in response && response.error === true;
}
