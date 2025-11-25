/**
 * @module tidyfetch
 *
 * Cross-runtime enhanced fetch API for Deno, Bun, and Node.js.
 *
 * tidyfetch provides a better fetch experience with:
 * - **Automatic JSON parsing** - Response bodies are automatically parsed based on content type
 * - **Auto JSON stringification** - Plain objects in body are automatically JSON.stringify'd
 * - **Type-safe responses** - Generic type parameter for full TypeScript inference
 * - **Configurable retries** - Automatic retry on specific status codes with delay
 * - **Request timeouts** - Configurable timeout with AbortController
 * - **Request/Response interceptors** - Hook into request lifecycle
 * - **Response caching** - Simple in-memory TTL-based cache
 * - **HTTP method shortcuts** - Convenient .get(), .post(), .put(), .patch(), .delete()
 * - **Factory pattern** - Create preconfigured instances with tidyfetch.create()
 * - **External AbortSignal** - Full cancellation control
 *
 * @example Basic usage
 * ```ts
 * import { tidyfetch } from "@tidy-ts/shims";
 *
 * // Simple GET with auto JSON parsing
 * const users = await tidyfetch<User[]>("/api/users");
 *
 * // POST with auto JSON body
 * const newUser = await tidyfetch<User>("/api/users", {
 *   method: "POST",
 *   body: { name: "Alice", email: "alice@example.com" }
 * });
 * ```
 *
 * @example Factory pattern for API clients
 * ```ts
 * const api = tidyfetch.create({
 *   baseURL: "https://api.example.com",
 *   headers: { "Authorization": `Bearer ${token}` },
 *   timeout: 10000
 * });
 *
 * const users = await api<User[]>("/users");
 * ```
 */

/**
 * Enhanced fetch options extending the standard RequestInit interface.
 *
 * Extends RequestInit with additional features for better DX:
 * - Query parameter handling
 * - Automatic JSON body serialization
 * - Retry logic configuration
 * - Request/response interceptors
 * - Response caching
 *
 * @example
 * ```ts
 * const options: FetchOptions = {
 *   baseURL: "https://api.example.com",
 *   query: { page: 1, limit: 10 },
 *   body: { name: "Alice" }, // Auto-stringified to JSON
 *   timeout: 5000,
 *   retry: 3,
 *   retryDelay: 1000,
 *   onRequest: ({ request }) => console.log("Fetching:", request.url),
 *   onResponse: ({ response }) => console.log("Status:", response.status),
 * };
 * ```
 */
export interface FetchOptions extends Omit<RequestInit, "body"> {
  /**
   * Base URL to prepend to the request URL.
   * Useful for API clients that always hit the same host.
   * @example baseURL: "https://api.example.com"
   */
  baseURL?: string;

  /**
   * Query parameters to append to the URL.
   * Undefined values are filtered out. Values are converted to strings.
   * @example query: { page: 1, limit: 10, search: undefined } → "?page=1&limit=10"
   */
  query?: Record<string, string | number | boolean | undefined>;

  /**
   * Request body. Plain objects are automatically JSON.stringify'd with
   * Content-Type: application/json header. Standard BodyInit types pass through unchanged.
   * @example body: { name: "Alice" } → '{"name":"Alice"}' with JSON content-type
   */
  body?: BodyInit | Record<string, unknown>;

  /**
   * Request timeout in milliseconds. 0 disables timeout.
   * When timeout is reached, the request is aborted with an AbortError.
   * @default 0 (no timeout)
   * @example timeout: 5000 → 5 second timeout
   */
  timeout?: number;

  /**
   * Number of times to retry the request on failure.
   * Only retries on network errors or status codes in retryStatusCodes.
   * @default 0 (no retries)
   * @example retry: 3 → Up to 3 retry attempts
   */
  retry?: number;

  /**
   * Delay in milliseconds between retry attempts.
   * Applied after each failed attempt before the next retry.
   * @default 0 (no delay)
   * @example retryDelay: 1000 → 1 second between retries
   */
  retryDelay?: number;

  /**
   * HTTP status codes that should trigger a retry.
   * Common choices: 408 (Timeout), 429 (Rate Limit), 5xx (Server Errors).
   * @default [408, 429, 500, 502, 503, 504]
   */
  retryStatusCodes?: number[];

  /**
   * Interceptor called before the request is sent.
   * Use for logging, adding headers, or modifying the request.
   * @example onRequest: ({ request }) => console.log("Fetching:", request.url)
   */
  onRequest?: (context: {
    request: Request;
    options: FetchOptions;
  }) => void | Promise<void>;

  /**
   * Interceptor called after a successful response (2xx status).
   * Use for logging, metrics, or response validation.
   * @example onResponse: ({ response }) => console.log("Status:", response.status)
   */
  onResponse?: (context: {
    request: Request;
    response: Response;
    options: FetchOptions;
  }) => void | Promise<void>;

  /**
   * Interceptor called when a response has an error status (non-2xx).
   * Called before retry logic. Use for error logging or custom error handling.
   * @example onResponseError: ({ response }) => console.error("Error:", response.status)
   */
  onResponseError?: (context: {
    request: Request;
    response: Response;
    options: FetchOptions;
  }) => void | Promise<void>;

  /**
   * Custom function to parse the response body.
   * Receives raw response text, returns parsed data.
   * Overrides responseType when provided.
   * @example parseResponse: (text) => JSON.parse(text, reviver)
   */
  parseResponse?: (text: string) => unknown;

  /**
   * Expected response type determining how the response is parsed.
   * - "json": Parse as JSON (default)
   * - "text": Return as string
   * - "blob": Return as Blob
   * - "arrayBuffer": Return as ArrayBuffer
   * - "stream": Return ReadableStream body
   * @default "json"
   */
  responseType?: "json" | "text" | "blob" | "arrayBuffer" | "stream";

  /**
   * Response cache TTL in milliseconds. 0 disables caching.
   * Caches successful responses in memory keyed by method + URL.
   * Cached responses are returned without making network requests.
   * @default 0 (no caching)
   * @example cacheTTL: 60000 → Cache for 1 minute
   */
  cacheTTL?: number;
}

/**
 * Enhanced fetch error with HTTP status information.
 *
 * Thrown when a request returns a non-2xx status code (after retry attempts exhausted).
 * Provides access to the status code, status text, and full Response object.
 *
 * @example
 * ```ts
 * try {
 *   await tidyfetch("/api/protected");
 * } catch (error) {
 *   if (error instanceof FetchError) {
 *     if (error.status === 401) {
 *       console.log("Unauthorized - please login");
 *     } else if (error.status === 404) {
 *       console.log("Resource not found");
 *     }
 *     // Access full response for more details
 *     const body = await error.response?.text();
 *   }
 * }
 * ```
 */
export class FetchError extends Error {
  /**
   * Creates a new FetchError.
   * @param message - Error message (typically "HTTP {status}: {statusText}")
   * @param status - HTTP status code (e.g., 404, 500)
   * @param statusText - HTTP status text (e.g., "Not Found", "Internal Server Error")
   * @param response - The full Response object for detailed inspection
   */
  constructor(
    message: string,
    public readonly status?: number,
    public readonly statusText?: string,
    public readonly response?: Response,
  ) {
    super(message);
    this.name = "FetchError";
  }
}

/**
 * Response object with parsed data attached.
 *
 * Returned by `tidyfetch.raw()`. Extends the standard Response interface
 * with a `_data` property containing the parsed response body.
 * The original Response body is still available via `.clone()`.
 *
 * @typeParam T - Type of the parsed response data
 *
 * @example
 * ```ts
 * const response = await tidyfetch.raw<User>("/api/users/1");
 *
 * // Access parsed data
 * console.log(response._data.name);
 *
 * // Access Response properties
 * console.log(response.status);        // 200
 * console.log(response.headers);       // Headers object
 *
 * // Clone and read body again if needed
 * const text = await response.clone().text();
 * ```
 */
export interface RawResponse<T = unknown> extends Response {
  /** The parsed response body */
  _data: T;
}

/** @internal Cache entry for response caching */
interface CacheEntry {
  data: unknown;
  expires: number;
}

/** @internal In-memory cache for responses */
const responseCache = new Map<string, CacheEntry>();

/**
 * Enhanced fetch function with automatic JSON parsing, error handling,
 * retries, timeouts, caching, and interceptors.
 *
 * Features:
 * - **Type-safe**: Pass a generic type for full TypeScript inference
 * - **Auto JSON**: Plain objects in body are stringified, responses are parsed
 * - **Retries**: Configurable retry logic for transient failures
 * - **Timeout**: Built-in request timeout with AbortController
 * - **Caching**: Optional in-memory response caching with TTL
 * - **Interceptors**: Hook into request/response lifecycle
 * - **Cancellation**: Supports external AbortSignal for cancellation
 *
 * @typeParam T - Type of the parsed response data
 * @param url - The URL to fetch (absolute, or relative if baseURL is provided)
 * @param options - Enhanced fetch options (see {@link FetchOptions})
 * @returns Promise resolving to the parsed response data
 * @throws {@link FetchError} When response status is not 2xx (after retries)
 * @throws {Error} AbortError when request times out or is cancelled
 *
 * @example Basic GET with type safety
 * ```ts
 * interface User { id: number; name: string; email: string; }
 *
 * const user = await tidyfetch<User>('/api/users/1');
 * console.log(user.name); // Full TypeScript inference
 * ```
 *
 * @example POST with auto JSON body
 * ```ts
 * const newUser = await tidyfetch<User>('/api/users', {
 *   method: 'POST',
 *   body: { name: 'Alice', email: 'alice@example.com' }
 * });
 * ```
 *
 * @example Retry with backoff
 * ```ts
 * const data = await tidyfetch('/api/flaky-endpoint', {
 *   retry: 3,
 *   retryDelay: 1000,
 *   retryStatusCodes: [502, 503, 504],
 *   timeout: 10000
 * });
 * ```
 *
 * @example With caching
 * ```ts
 * // Cache response for 5 minutes
 * const config = await tidyfetch('/api/config', { cacheTTL: 300000 });
 * ```
 *
 * @example With cancellation
 * ```ts
 * const controller = new AbortController();
 * setTimeout(() => controller.abort(), 5000);
 *
 * try {
 *   await tidyfetch('/api/slow', { signal: controller.signal });
 * } catch (e) {
 *   if (e.name === 'AbortError') console.log('Request cancelled');
 * }
 * ```
 */
export async function tidyfetch<T = unknown>(
  url: string,
  options: FetchOptions = {},
): Promise<T> {
  const {
    baseURL,
    query,
    timeout = 0,
    retry = 0,
    retryDelay = 0,
    retryStatusCodes = [408, 429, 500, 502, 503, 504],
    onRequest,
    onResponse,
    onResponseError,
    parseResponse,
    responseType = "json",
    cacheTTL = 0,
    signal: userSignal,
    ...fetchOptions
  } = options;

  // Build full URL
  let fullURL = baseURL ? `${baseURL}${url}` : url;

  // Append query parameters
  if (query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    }
    const queryString = params.toString();
    if (queryString) {
      fullURL += (fullURL.includes("?") ? "&" : "?") + queryString;
    }
  }

  // Check cache if TTL is set
  if (cacheTTL > 0) {
    const cacheKey = `${fetchOptions.method || "GET"}:${fullURL}`;
    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() < cached.expires) {
      return cached.data as T;
    }
  }

  // Auto-stringify JSON body and set content-type
  let processedBody = fetchOptions.body;
  const processedHeaders = fetchOptions.headers
    ? new Headers(fetchOptions.headers)
    : new Headers();

  if (
    processedBody &&
    typeof processedBody === "object" &&
    !(processedBody instanceof FormData) &&
    !(processedBody instanceof URLSearchParams) &&
    !(processedBody instanceof Blob) &&
    !(processedBody instanceof ArrayBuffer) &&
    !(processedBody instanceof ReadableStream)
  ) {
    processedBody = JSON.stringify(processedBody);
    if (!processedHeaders.has("content-type")) {
      processedHeaders.set("content-type", "application/json");
    }
  }

  let requestInit: RequestInit = {
    ...fetchOptions,
    body: processedBody as BodyInit,
    headers: processedHeaders,
  };

  // Call onRequest interceptor and allow it to modify options
  if (onRequest) {
    // For interceptor, we need a valid Request - use a dummy base for relative URLs
    const requestURL = fullURL.startsWith("/")
      ? `http://localhost${fullURL}`
      : fullURL;
    const tempRequest = new Request(requestURL, requestInit);
    await onRequest({ request: tempRequest, options });

    // Re-apply headers in case they were modified in the interceptor
    if (options.headers) {
      requestInit = {
        ...requestInit,
        headers: options.headers,
      };
    }
  }

  // Execute with retry logic
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retry; attempt++) {
    try {
      // Setup timeout and merge with user signal if provided
      const controller = new AbortController();
      const timeoutId = timeout > 0
        ? setTimeout(() => controller.abort(), timeout)
        : null;

      // Merge signals if user provided one
      let combinedSignal: AbortSignal = controller.signal;
      if (userSignal) {
        // Use AbortSignal.any if available (modern browsers/runtimes)
        if (AbortSignal.any) {
          combinedSignal = AbortSignal.any([controller.signal, userSignal]);
        } else {
          // Fallback: if user signal is already aborted, use it
          if (userSignal.aborted) {
            throw new DOMException("The operation was aborted", "AbortError");
          }
          // Otherwise, listen to both signals
          userSignal.addEventListener("abort", () => controller.abort());
        }
      }

      const fetchInit: RequestInit = {
        ...requestInit,
        signal: combinedSignal,
      };

      const response = await globalThis.fetch(fullURL, fetchInit);

      if (timeoutId !== null) clearTimeout(timeoutId);

      // Create a Request object for interceptors
      const requestForInterceptor = new Request(
        fullURL.startsWith("/") ? `http://localhost${fullURL}` : fullURL,
        requestInit,
      );

      // Handle non-ok responses
      if (!response.ok) {
        // Call onResponseError interceptor
        if (onResponseError) {
          await onResponseError({
            request: requestForInterceptor,
            response,
            options,
          });
        }

        // Check if we should retry
        if (retryStatusCodes.includes(response.status) && attempt < retry) {
          if (retryDelay > 0) {
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
          }
          continue;
        }

        // Throw error if not retrying
        throw new FetchError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          response.statusText,
          response,
        );
      }

      // Call onResponse interceptor
      if (onResponse) {
        await onResponse({
          request: requestForInterceptor,
          response,
          options,
        });
      }

      // Parse response
      let data: T;
      if (parseResponse) {
        const text = await response.text();
        data = parseResponse(text) as T;
      } else {
        switch (responseType) {
          case "json":
            data = (await response.json()) as T;
            break;
          case "text":
            data = (await response.text()) as T;
            break;
          case "blob":
            data = (await response.blob()) as T;
            break;
          case "arrayBuffer":
            data = (await response.arrayBuffer()) as T;
            break;
          case "stream":
            data = response.body as T;
            break;
          default:
            data = (await response.json()) as T;
        }
      }

      // Store in cache if TTL is set
      if (cacheTTL > 0) {
        const cacheKey = `${fetchOptions.method || "GET"}:${fullURL}`;
        responseCache.set(cacheKey, {
          data,
          expires: Date.now() + cacheTTL,
        });
      }

      return data;
    } catch (error) {
      lastError = error as Error;

      // Don't retry on abort errors or if we've exhausted retries
      if (
        error instanceof Error &&
        (error.name === "AbortError" || attempt >= retry)
      ) {
        throw error;
      }

      // Wait before retrying
      if (attempt < retry && retryDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  // If we get here, all retries failed
  throw lastError || new Error("Request failed");
}

/**
 * Factory function to create a preconfigured tidyfetch instance.
 *
 * Creates a new fetch function with default options baked in. Perfect for
 * creating API clients with shared configuration (baseURL, headers, timeout).
 * Options passed to individual calls are merged with the defaults.
 *
 * @param defaults - Default options to apply to all requests made with this instance
 * @returns A new tidyfetch function with the defaults applied
 *
 * @example Create an API client
 * ```ts
 * const api = tidyfetch.create({
 *   baseURL: 'https://api.example.com',
 *   headers: { 'Authorization': `Bearer ${token}` },
 *   timeout: 10000
 * });
 *
 * // All requests use the defaults
 * const users = await api<User[]>('/users');
 * const posts = await api<Post[]>('/posts', { query: { page: 2 } });
 * ```
 *
 * @example Create multiple API clients
 * ```ts
 * const publicApi = tidyfetch.create({
 *   baseURL: 'https://api.example.com/public'
 * });
 *
 * const adminApi = tidyfetch.create({
 *   baseURL: 'https://api.example.com/admin',
 *   headers: { 'X-Admin-Token': adminToken }
 * });
 * ```
 *
 * @example Override defaults per-request
 * ```ts
 * const api = tidyfetch.create({ timeout: 5000 });
 *
 * // This request has a longer timeout
 * await api('/slow-endpoint', { timeout: 30000 });
 * ```
 */
tidyfetch.create = (
  defaults: FetchOptions,
): <T = unknown>(url: string, options?: FetchOptions) => Promise<T> => {
  return <T = unknown>(url: string, options: FetchOptions = {}): Promise<T> => {
    // Merge headers properly
    const mergedHeaders = new Headers(defaults.headers);
    if (options.headers) {
      const optionHeaders = new Headers(options.headers);
      optionHeaders.forEach((value, key) => {
        mergedHeaders.set(key, value);
      });
    }

    // Merge query parameters
    const mergedQuery = {
      ...defaults.query,
      ...options.query,
    };

    const mergedOptions: FetchOptions = {
      ...defaults,
      ...options,
      headers: mergedHeaders,
      query: Object.keys(mergedQuery).length > 0 ? mergedQuery : undefined,
    };

    return tidyfetch<T>(url, mergedOptions);
  };
};

/**
 * Fetch with access to the full Response object plus parsed data.
 *
 * Unlike the main `tidyfetch()` which returns only the parsed data,
 * `tidyfetch.raw()` returns the complete Response object with the
 * parsed data attached as `_data`. Use this when you need access to
 * response headers, status codes, or other Response properties.
 *
 * @typeParam T - Type of the parsed response data
 * @param url - The URL to fetch
 * @param options - Enhanced fetch options (see {@link FetchOptions})
 * @returns Response object extended with `_data` property (see {@link RawResponse})
 * @throws {@link FetchError} When response status is not 2xx
 *
 * @example Access response headers and status
 * ```ts
 * const response = await tidyfetch.raw<User>('/api/users/1');
 *
 * console.log(response.status);                    // 200
 * console.log(response.headers.get('x-rate-limit')); // "100"
 * console.log(response._data.name);                // "Alice"
 * ```
 *
 * @example Check for specific headers
 * ```ts
 * const response = await tidyfetch.raw('/api/data');
 *
 * const etag = response.headers.get('etag');
 * const cacheControl = response.headers.get('cache-control');
 *
 * if (cacheControl?.includes('no-cache')) {
 *   // Handle uncacheable response
 * }
 * ```
 *
 * @example Conditional requests with ETag
 * ```ts
 * // First request - get ETag
 * const response1 = await tidyfetch.raw('/api/resource');
 * const etag = response1.headers.get('etag');
 *
 * // Subsequent request with If-None-Match
 * const response2 = await tidyfetch.raw('/api/resource', {
 *   headers: { 'If-None-Match': etag }
 * });
 * ```
 */
tidyfetch.raw = async <T = unknown>(
  url: string,
  options: FetchOptions = {},
): Promise<RawResponse<T>> => {
  const {
    baseURL,
    query,
    timeout = 0,
    retry = 0,
    retryDelay = 0,
    retryStatusCodes = [408, 429, 500, 502, 503, 504],
    onRequest,
    onResponse,
    onResponseError,
    parseResponse,
    responseType = "json",
    signal: userSignal,
    ...fetchOptions
  } = options;

  // Build full URL
  let fullURL = baseURL ? `${baseURL}${url}` : url;

  // Append query parameters
  if (query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    }
    const queryString = params.toString();
    if (queryString) {
      fullURL += (fullURL.includes("?") ? "&" : "?") + queryString;
    }
  }

  // Auto-stringify JSON body and set content-type
  let processedBody = fetchOptions.body;
  const processedHeaders = fetchOptions.headers
    ? new Headers(fetchOptions.headers)
    : new Headers();

  if (
    processedBody &&
    typeof processedBody === "object" &&
    !(processedBody instanceof FormData) &&
    !(processedBody instanceof URLSearchParams) &&
    !(processedBody instanceof Blob) &&
    !(processedBody instanceof ArrayBuffer) &&
    !(processedBody instanceof ReadableStream)
  ) {
    processedBody = JSON.stringify(processedBody);
    if (!processedHeaders.has("content-type")) {
      processedHeaders.set("content-type", "application/json");
    }
  }

  let requestInit: RequestInit = {
    ...fetchOptions,
    body: processedBody as BodyInit,
    headers: processedHeaders,
  };

  // Call onRequest interceptor
  if (onRequest) {
    const requestURL = fullURL.startsWith("/")
      ? `http://localhost${fullURL}`
      : fullURL;
    const tempRequest = new Request(requestURL, requestInit);
    await onRequest({ request: tempRequest, options });

    if (options.headers) {
      requestInit = {
        ...requestInit,
        headers: options.headers,
      };
    }
  }

  // Execute with retry logic
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retry; attempt++) {
    try {
      // Setup timeout and merge with user signal
      const controller = new AbortController();
      const timeoutId = timeout > 0
        ? setTimeout(() => controller.abort(), timeout)
        : null;

      let combinedSignal: AbortSignal = controller.signal;
      if (userSignal) {
        if (AbortSignal.any) {
          combinedSignal = AbortSignal.any([controller.signal, userSignal]);
        } else {
          if (userSignal.aborted) {
            throw new DOMException("The operation was aborted", "AbortError");
          }
          userSignal.addEventListener("abort", () => controller.abort());
        }
      }

      const fetchInit: RequestInit = {
        ...requestInit,
        signal: combinedSignal,
      };

      const response = await globalThis.fetch(fullURL, fetchInit);

      if (timeoutId !== null) clearTimeout(timeoutId);

      const requestForInterceptor = new Request(
        fullURL.startsWith("/") ? `http://localhost${fullURL}` : fullURL,
        requestInit,
      );

      // Handle non-ok responses
      if (!response.ok) {
        if (onResponseError) {
          await onResponseError({
            request: requestForInterceptor,
            response,
            options,
          });
        }

        if (retryStatusCodes.includes(response.status) && attempt < retry) {
          if (retryDelay > 0) {
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
          }
          continue;
        }

        throw new FetchError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          response.statusText,
          response,
        );
      }

      // Call onResponse interceptor
      if (onResponse) {
        await onResponse({
          request: requestForInterceptor,
          response,
          options,
        });
      }

      // Parse response
      let data: T;
      if (parseResponse) {
        const text = await response.clone().text();
        data = parseResponse(text) as T;
      } else {
        switch (responseType) {
          case "json":
            data = (await response.clone().json()) as T;
            break;
          case "text":
            data = (await response.clone().text()) as T;
            break;
          case "blob":
            data = (await response.clone().blob()) as T;
            break;
          case "arrayBuffer":
            data = (await response.clone().arrayBuffer()) as T;
            break;
          case "stream":
            data = response.body as T;
            break;
          default:
            data = (await response.clone().json()) as T;
        }
      }

      // Attach data to response
      const rawResponse = response as RawResponse<T>;
      rawResponse._data = data;

      return rawResponse;
    } catch (error) {
      lastError = error as Error;

      if (
        error instanceof Error &&
        (error.name === "AbortError" || attempt >= retry)
      ) {
        throw error;
      }

      if (attempt < retry && retryDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  throw lastError || new Error("Request failed");
};

/**
 * Direct access to the native fetch API.
 *
 * Bypasses all tidyfetch enhancements (auto JSON, retries, etc.) and
 * calls `globalThis.fetch` directly. Use when you need full control
 * over the Response object or want to avoid tidyfetch's processing.
 *
 * @param input - URL or Request object
 * @param init - Standard RequestInit options
 * @returns Standard Response promise
 *
 * @example Direct fetch access
 * ```ts
 * const response = await tidyfetch.native('/api/data');
 * const text = await response.text();
 * const headers = response.headers;
 * ```
 *
 * @example Stream handling
 * ```ts
 * const response = await tidyfetch.native('/api/stream');
 * const reader = response.body?.getReader();
 * // Process stream manually
 * ```
 */
tidyfetch.native = globalThis.fetch.bind(globalThis) as typeof fetch;

// ============================================================================
// HTTP Method Shortcuts
// ============================================================================

/**
 * Perform a GET request.
 *
 * Shorthand for `tidyfetch(url, { method: 'GET', ...options })`.
 * GET requests are typically used to retrieve resources.
 *
 * @typeParam T - Type of the response data
 * @param url - The URL to fetch
 * @param options - Additional fetch options (method is set automatically)
 * @returns Promise resolving to the parsed response data
 *
 * @example Basic GET
 * ```ts
 * const users = await tidyfetch.get<User[]>('/api/users');
 * ```
 *
 * @example GET with query parameters
 * ```ts
 * const user = await tidyfetch.get<User>('/api/users/1', {
 *   query: { include: 'posts,comments' }
 * });
 * ```
 *
 * @example GET with caching
 * ```ts
 * const config = await tidyfetch.get('/api/config', { cacheTTL: 60000 });
 * ```
 */
tidyfetch.get = <T = unknown>(
  url: string,
  options: FetchOptions = {},
): Promise<T> => tidyfetch<T>(url, { ...options, method: "GET" });

/**
 * Perform a POST request.
 *
 * Shorthand for `tidyfetch(url, { method: 'POST', ...options })`.
 * POST requests are typically used to create new resources.
 *
 * @typeParam T - Type of the response data
 * @param url - The URL to post to
 * @param options - Fetch options including body data
 * @returns Promise resolving to the parsed response data
 *
 * @example Create a resource
 * ```ts
 * const newUser = await tidyfetch.post<User>('/api/users', {
 *   body: { name: 'Alice', email: 'alice@example.com' }
 * });
 * ```
 *
 * @example POST with form data
 * ```ts
 * const formData = new FormData();
 * formData.append('file', file);
 * const result = await tidyfetch.post('/api/upload', { body: formData });
 * ```
 */
tidyfetch.post = <T = unknown>(
  url: string,
  options: FetchOptions = {},
): Promise<T> => tidyfetch<T>(url, { ...options, method: "POST" });

/**
 * Perform a PUT request.
 *
 * Shorthand for `tidyfetch(url, { method: 'PUT', ...options })`.
 * PUT requests are typically used to replace entire resources.
 *
 * @typeParam T - Type of the response data
 * @param url - The URL of the resource to replace
 * @param options - Fetch options including the new resource data
 * @returns Promise resolving to the parsed response data
 *
 * @example Replace a resource
 * ```ts
 * const updated = await tidyfetch.put<User>('/api/users/1', {
 *   body: { name: 'Alice Smith', email: 'alice@example.com', role: 'admin' }
 * });
 * ```
 */
tidyfetch.put = <T = unknown>(
  url: string,
  options: FetchOptions = {},
): Promise<T> => tidyfetch<T>(url, { ...options, method: "PUT" });

/**
 * Perform a PATCH request.
 *
 * Shorthand for `tidyfetch(url, { method: 'PATCH', ...options })`.
 * PATCH requests are typically used for partial updates to resources.
 *
 * @typeParam T - Type of the response data
 * @param url - The URL of the resource to update
 * @param options - Fetch options including the partial update data
 * @returns Promise resolving to the parsed response data
 *
 * @example Partial update
 * ```ts
 * const patched = await tidyfetch.patch<User>('/api/users/1', {
 *   body: { email: 'newemail@example.com' }
 * });
 * ```
 *
 * @example Update specific fields
 * ```ts
 * await tidyfetch.patch('/api/posts/123', {
 *   body: { title: 'Updated Title', updatedAt: new Date().toISOString() }
 * });
 * ```
 */
tidyfetch.patch = <T = unknown>(
  url: string,
  options: FetchOptions = {},
): Promise<T> => tidyfetch<T>(url, { ...options, method: "PATCH" });

/**
 * Perform a DELETE request.
 *
 * Shorthand for `tidyfetch(url, { method: 'DELETE', ...options })`.
 * DELETE requests are used to remove resources.
 *
 * @typeParam T - Type of the response data (often void or confirmation object)
 * @param url - The URL of the resource to delete
 * @param options - Additional fetch options
 * @returns Promise resolving to the parsed response data
 *
 * @example Delete a resource
 * ```ts
 * await tidyfetch.delete('/api/users/1');
 * ```
 *
 * @example Delete with confirmation response
 * ```ts
 * const result = await tidyfetch.delete<{ success: boolean; deletedAt: string }>(
 *   '/api/users/1'
 * );
 * console.log('Deleted at:', result.deletedAt);
 * ```
 *
 * @example Soft delete with body
 * ```ts
 * await tidyfetch.delete('/api/posts/123', {
 *   body: { reason: 'Spam content' }
 * });
 * ```
 */
tidyfetch.delete = <T = unknown>(
  url: string,
  options: FetchOptions = {},
): Promise<T> => tidyfetch<T>(url, { ...options, method: "DELETE" });
