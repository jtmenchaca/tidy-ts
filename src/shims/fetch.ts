/**
 * @module tidyfetch
 *
 * Cross-runtime enhanced fetch API for Deno, Bun, and Node.js.
 *
 * tidyfetch provides a Result-based fetch experience with:
 * - **Result-based error handling** - Returns `Result<T, TidyFetchError>` for explicit error handling
 * - **Type-safe errors** - Discriminated union of specific error types (HTTPError, TimeoutError, etc.)
 * - **Automatic JSON parsing** - Response bodies are automatically parsed based on content type
 * - **Auto JSON stringification** - Plain objects in body are automatically JSON.stringify'd
 * - **Type-safe responses** - Generic type parameter for full TypeScript inference
 * - **Configurable retries** - Automatic retry on specific status codes with delay
 * - **Request timeouts** - Configurable timeout with AbortController
 * - **Request/Response interceptors** - Hook into request lifecycle
 * - **Response caching** - Simple in-memory TTL-based cache
 * - **HTTP method shortcuts** - Convenient .get(), .post(), .put(), .patch(), .delete()
 * - **Factory pattern** - Create preconfigured instances with tidyfetch.create()
 *
 * @example Basic usage with Result
 * ```ts
 * import { tidyfetch } from "@tidy-ts/shims";
 *
 * const result = await tidyfetch<User>("/api/users/1");
 *
 * if (!result.ok) {
 *   console.error("Failed:", result.error.message);
 *   return;
 * }
 *
 * console.log(result.value.name); // TypeScript knows this is User
 * ```
 *
 * @example Error handling with specific types
 * ```ts
 * const result = await tidyfetch<User>("/api/users/1");
 *
 * if (!result.ok) {
 *   if (result.error instanceof HTTPError) {
 *     console.log(`HTTP ${result.error.statusCode}: ${result.error.body}`);
 *   } else if (result.error instanceof TimeoutError) {
 *     console.log(`Timed out after ${result.error.timeout}ms`);
 *   }
 *   return;
 * }
 * ```
 */

// ============================================================================
// Result Type System
// ============================================================================

/**
 * Result type for explicit error handling.
 * Either a successful value or an error, never both.
 */
export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

/** Create a successful Result */
export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

/** Create an error Result */
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

// ============================================================================
// Error Type System
// ============================================================================

/** Helper type for custom errors with additional properties */
export type AppError<ErrorName extends string, Extra = object> =
  & Error
  & Extra
  & { name: ErrorName };

/**
 * Factory function to create custom error classes with type-safe properties.
 */
export function defineError<
  ErrorName extends string,
  Extra extends object = object,
>(
  name: ErrorName,
  messageTemplate: (extra: Extra) => string,
): { new (extra: Extra): AppError<ErrorName, Extra> } {
  class CustomError extends Error {
    constructor(extra: Extra) {
      super(messageTemplate(extra));
      Object.setPrototypeOf(this, new.target.prototype);
      this.name = name;
      Object.assign(this, extra);
    }
  }
  return CustomError as unknown as {
    new (extra: Extra): AppError<ErrorName, Extra>;
  };
}

// ============================================================================
// Fetch Error Types
// ============================================================================

/** Extra properties for NetworkError */
type NetworkErrorExtra = { message: string; url: string; cause?: Error };
/** Network-level error (DNS failure, connection refused, etc.) */
export const NetworkError: {
  new (extra: NetworkErrorExtra): AppError<"NetworkError", NetworkErrorExtra>;
} = defineError(
  "NetworkError",
  ({ message, url }: NetworkErrorExtra) => `Network error: ${message} [${url}]`,
);
export type NetworkError = AppError<"NetworkError", NetworkErrorExtra>;

/** Extra properties for TimeoutError */
type TimeoutErrorExtra = { url: string; timeout: number };
/** Request timed out */
export const TimeoutError: {
  new (extra: TimeoutErrorExtra): AppError<"TimeoutError", TimeoutErrorExtra>;
} = defineError(
  "TimeoutError",
  ({ url, timeout }: TimeoutErrorExtra) =>
    `Request timed out after ${timeout}ms [${url}]`,
);
export type TimeoutError = AppError<"TimeoutError", TimeoutErrorExtra>;

/** Extra properties for HTTPError */
type HTTPErrorExtra = {
  statusCode: number;
  statusText: string;
  url: string;
  body?: unknown;
  response: Response;
};
/** HTTP error (non-2xx status code) */
export const HTTPError: {
  new (extra: HTTPErrorExtra): AppError<"HTTPError", HTTPErrorExtra>;
} = defineError(
  "HTTPError",
  ({ statusCode, statusText, url }: HTTPErrorExtra) =>
    `HTTP ${statusCode} ${statusText} [${url}]`,
);
export type HTTPError = AppError<"HTTPError", HTTPErrorExtra>;

/** Extra properties for ParseError */
type ParseErrorExtra = { message: string; url: string; cause?: Error };
/** Failed to parse response body */
export const ParseError: {
  new (extra: ParseErrorExtra): AppError<"ParseError", ParseErrorExtra>;
} = defineError(
  "ParseError",
  ({ message, url }: ParseErrorExtra) =>
    `Failed to parse response: ${message} [${url}]`,
);
export type ParseError = AppError<"ParseError", ParseErrorExtra>;

/** Extra properties for AbortError */
type AbortErrorExtra = { url: string };
/** Request was aborted (by user or signal) */
export const AbortError: {
  new (extra: AbortErrorExtra): AppError<"AbortError", AbortErrorExtra>;
} = defineError(
  "AbortError",
  ({ url }: AbortErrorExtra) => `Request aborted [${url}]`,
);
export type AbortError = AppError<"AbortError", AbortErrorExtra>;

/** Union of all fetch error types */
export type TidyFetchError =
  | NetworkError
  | TimeoutError
  | HTTPError
  | ParseError
  | AbortError;

// ============================================================================
// FetchOptions Interface
// ============================================================================

/**
 * Enhanced fetch options extending the standard RequestInit interface.
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
  /** Base URL to prepend to the request URL */
  baseURL?: string;

  /** Query parameters to append to the URL (undefined values filtered out) */
  query?: Record<string, string | number | boolean | undefined>;

  /** Request body (plain objects auto-stringified to JSON) */
  body?: BodyInit | Record<string, unknown>;

  /** Request timeout in milliseconds (0 = no timeout) */
  timeout?: number;

  /** Number of retry attempts on failure */
  retry?: number;

  /** Delay between retry attempts in milliseconds */
  retryDelay?: number;

  /** HTTP status codes that should trigger a retry */
  retryStatusCodes?: number[];

  /** Interceptor called before request is sent */
  onRequest?: (context: {
    request: Request;
    options: FetchOptions;
  }) => void | Promise<void>;

  /** Interceptor called after successful response */
  onResponse?: (context: {
    request: Request;
    response: Response;
    options: FetchOptions;
  }) => void | Promise<void>;

  /** Interceptor called on error responses (before Result is returned) */
  onResponseError?: (context: {
    request: Request;
    response: Response;
    options: FetchOptions;
    error: TidyFetchError;
  }) => void | Promise<void>;

  /** Custom response parser */
  parseResponse?: (text: string) => unknown;

  /** Response type for parsing */
  responseType?: "json" | "text" | "blob" | "arrayBuffer" | "stream";

  /** Response cache TTL in milliseconds (0 = no caching) */
  cacheTTL?: number;
}

/**
 * Response object with parsed data attached.
 * Returned by `tidyfetch.raw()`.
 */
export interface RawResponse<T = unknown> extends Response {
  /** The parsed response body */
  _data: T;
}

// ============================================================================
// Internal Helpers
// ============================================================================

/** @internal Cache entry for response caching */
interface CacheEntry {
  data: unknown;
  expires: number;
}

/** @internal In-memory cache for responses */
const responseCache = new Map<string, CacheEntry>();

/** @internal Build full URL with query parameters */
function buildURL(
  url: string,
  baseURL?: string,
  query?: Record<string, string | number | boolean | undefined>,
): string {
  let fullURL = baseURL ? `${baseURL}${url}` : url;

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

  return fullURL;
}

/** @internal Process body and headers for JSON auto-stringify */
function processBody(
  body: BodyInit | Record<string, unknown> | undefined,
  headers: Headers,
): BodyInit | undefined {
  if (
    body &&
    typeof body === "object" &&
    !(body instanceof FormData) &&
    !(body instanceof URLSearchParams) &&
    !(body instanceof Blob) &&
    !(body instanceof ArrayBuffer) &&
    !(body instanceof ReadableStream)
  ) {
    if (!headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }
    return JSON.stringify(body);
  }
  return body as BodyInit | undefined;
}

/** @internal Parse response based on type */
async function parseResponseBody<T>(
  response: Response,
  responseType: string,
  parseResponse?: (text: string) => unknown,
  url?: string,
): Promise<Result<T, ParseError>> {
  try {
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
    return ok(data);
  } catch (e) {
    const cause = e instanceof Error ? e : new Error(String(e));
    return err(
      new ParseError({
        message: cause.message,
        url: url || "unknown",
        cause,
      }),
    );
  }
}

// ============================================================================
// Main tidyfetch Function
// ============================================================================

/**
 * Enhanced fetch function returning Result<T, TidyFetchError>.
 *
 * @typeParam T - Type of the parsed response data
 * @param url - The URL to fetch
 * @param options - Enhanced fetch options
 * @returns Result with either the parsed data or a typed error
 *
 * @example Basic usage
 * ```ts
 * const result = await tidyfetch<User>("/api/users/1");
 *
 * if (!result.ok) {
 *   console.error(result.error.message);
 *   return;
 * }
 *
 * console.log(result.value.name);
 * ```
 *
 * @example Error type checking
 * ```ts
 * const result = await tidyfetch<User>("/api/users/1");
 *
 * if (!result.ok) {
 *   if (result.error instanceof HTTPError) {
 *     console.log(`HTTP ${result.error.statusCode}`);
 *   } else if (result.error instanceof TimeoutError) {
 *     console.log(`Timed out after ${result.error.timeout}ms`);
 *   }
 *   return;
 * }
 * ```
 */
export async function tidyfetch<T = unknown>(
  url: string,
  options: FetchOptions = {},
): Promise<Result<T, TidyFetchError>> {
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

  const fullURL = buildURL(url, baseURL, query);

  // Check cache
  if (cacheTTL > 0) {
    const cacheKey = `${fetchOptions.method || "GET"}:${fullURL}`;
    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() < cached.expires) {
      return ok(cached.data as T);
    }
  }

  // Process body and headers
  const processedHeaders = fetchOptions.headers
    ? new Headers(fetchOptions.headers)
    : new Headers();
  const processedBody = processBody(fetchOptions.body, processedHeaders);

  let requestInit: RequestInit = {
    ...fetchOptions,
    body: processedBody,
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
      requestInit = { ...requestInit, headers: options.headers };
    }
  }

  // Execute with retry logic
  let lastError: TidyFetchError | null = null;

  for (let attempt = 0; attempt <= retry; attempt++) {
    try {
      // Setup timeout
      const controller = new AbortController();
      const timeoutId = timeout > 0
        ? setTimeout(() => controller.abort(), timeout)
        : null;

      // Merge signals
      let combinedSignal: AbortSignal = controller.signal;
      if (userSignal) {
        if (AbortSignal.any) {
          combinedSignal = AbortSignal.any([controller.signal, userSignal]);
        } else {
          if (userSignal.aborted) {
            return err(new AbortError({ url: fullURL }));
          }
          userSignal.addEventListener("abort", () => controller.abort());
        }
      }

      const fetchInit: RequestInit = { ...requestInit, signal: combinedSignal };

      let response: Response;
      try {
        response = await globalThis.fetch(fullURL, fetchInit);
      } catch (fetchError) {
        if (timeoutId !== null) clearTimeout(timeoutId);

        const e = fetchError instanceof Error
          ? fetchError
          : new Error(String(fetchError));

        // Check if it's an abort/timeout
        if (e.name === "AbortError") {
          if (timeout > 0) {
            return err(new TimeoutError({ url: fullURL, timeout }));
          }
          return err(new AbortError({ url: fullURL }));
        }

        // Network error - check if we should retry
        const networkErr = new NetworkError({
          message: e.message,
          url: fullURL,
          cause: e,
        });

        if (attempt < retry) {
          lastError = networkErr;
          if (retryDelay > 0) {
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
          }
          continue;
        }

        return err(networkErr);
      }

      if (timeoutId !== null) clearTimeout(timeoutId);

      const requestForInterceptor = new Request(
        fullURL.startsWith("/") ? `http://localhost${fullURL}` : fullURL,
        requestInit,
      );

      // Handle non-ok responses
      if (!response.ok) {
        // Try to read body for error context
        let body: unknown;
        try {
          body = await response.clone().json();
        } catch {
          try {
            body = await response.clone().text();
          } catch {
            body = undefined;
          }
        }

        const httpError = new HTTPError({
          statusCode: response.status,
          statusText: response.statusText,
          url: fullURL,
          body,
          response,
        });

        // Call onResponseError interceptor
        if (onResponseError) {
          await onResponseError({
            request: requestForInterceptor,
            response,
            options,
            error: httpError,
          });
        }

        // Check if we should retry
        if (retryStatusCodes.includes(response.status) && attempt < retry) {
          lastError = httpError;
          if (retryDelay > 0) {
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
          }
          continue;
        }

        return err(httpError);
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
      const parseResult = await parseResponseBody<T>(
        response,
        responseType,
        parseResponse,
        fullURL,
      );

      if (!parseResult.ok) {
        return parseResult;
      }

      // Store in cache
      if (cacheTTL > 0) {
        const cacheKey = `${fetchOptions.method || "GET"}:${fullURL}`;
        responseCache.set(cacheKey, {
          data: parseResult.value,
          expires: Date.now() + cacheTTL,
        });
      }

      return parseResult;
    } catch (e) {
      // Unexpected error
      const error = e instanceof Error ? e : new Error(String(e));
      const networkErr = new NetworkError({
        message: error.message,
        url: fullURL,
        cause: error,
      });

      if (attempt >= retry) {
        return err(networkErr);
      }

      lastError = networkErr;
      if (retryDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  // All retries exhausted
  return err(
    lastError || new NetworkError({
      message: "Request failed",
      url: fullURL,
    }),
  );
}

// ============================================================================
// tidyfetch.create - Factory function
// ============================================================================

/** Return type for tidyfetch.create() */
export type TidyFetchInstance = {
  <T = unknown>(
    url: string,
    options?: FetchOptions,
  ): Promise<Result<T, TidyFetchError>>;
};

/**
 * Factory function to create a preconfigured tidyfetch instance.
 *
 * @example
 * ```ts
 * const api = tidyfetch.create({
 *   baseURL: "https://api.example.com",
 *   headers: { "Authorization": `Bearer ${token}` },
 *   timeout: 10000
 * });
 *
 * const result = await api<User[]>("/users");
 * if (result.ok) {
 *   console.log(result.value);
 * }
 * ```
 */
tidyfetch.create = (defaults: FetchOptions): TidyFetchInstance => {
  const instance = <T = unknown>(
    url: string,
    options: FetchOptions = {},
  ): Promise<Result<T, TidyFetchError>> => {
    const mergedHeaders = new Headers(defaults.headers);
    if (options.headers) {
      const optionHeaders = new Headers(options.headers);
      optionHeaders.forEach((value, key) => {
        mergedHeaders.set(key, value);
      });
    }

    const mergedQuery = { ...defaults.query, ...options.query };

    const mergedOptions: FetchOptions = {
      ...defaults,
      ...options,
      headers: mergedHeaders,
      query: Object.keys(mergedQuery).length > 0 ? mergedQuery : undefined,
    };

    return tidyfetch<T>(url, mergedOptions);
  };

  return instance;
};

// ============================================================================
// tidyfetch.raw - Raw Response with Result
// ============================================================================

/**
 * Fetch with access to full Response object plus parsed data.
 * Returns Result<RawResponse<T>, TidyFetchError>.
 *
 * @example
 * ```ts
 * const result = await tidyfetch.raw<User>("/api/users/1");
 *
 * if (result.ok) {
 *   console.log(result.value.status);
 *   console.log(result.value.headers.get("x-rate-limit"));
 *   console.log(result.value._data.name);
 * }
 * ```
 */
tidyfetch.raw = async <T = unknown>(
  url: string,
  options: FetchOptions = {},
): Promise<Result<RawResponse<T>, TidyFetchError>> => {
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

  const fullURL = buildURL(url, baseURL, query);

  const processedHeaders = fetchOptions.headers
    ? new Headers(fetchOptions.headers)
    : new Headers();
  const processedBody = processBody(fetchOptions.body, processedHeaders);

  let requestInit: RequestInit = {
    ...fetchOptions,
    body: processedBody,
    headers: processedHeaders,
  };

  if (onRequest) {
    const requestURL = fullURL.startsWith("/")
      ? `http://localhost${fullURL}`
      : fullURL;
    const tempRequest = new Request(requestURL, requestInit);
    await onRequest({ request: tempRequest, options });

    if (options.headers) {
      requestInit = { ...requestInit, headers: options.headers };
    }
  }

  let lastError: TidyFetchError | null = null;

  for (let attempt = 0; attempt <= retry; attempt++) {
    try {
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
            return err(new AbortError({ url: fullURL }));
          }
          userSignal.addEventListener("abort", () => controller.abort());
        }
      }

      const fetchInit: RequestInit = { ...requestInit, signal: combinedSignal };

      let response: Response;
      try {
        response = await globalThis.fetch(fullURL, fetchInit);
      } catch (fetchError) {
        if (timeoutId !== null) clearTimeout(timeoutId);

        const e = fetchError instanceof Error
          ? fetchError
          : new Error(String(fetchError));

        if (e.name === "AbortError") {
          if (timeout > 0) {
            return err(new TimeoutError({ url: fullURL, timeout }));
          }
          return err(new AbortError({ url: fullURL }));
        }

        const networkErr = new NetworkError({
          message: e.message,
          url: fullURL,
          cause: e,
        });

        if (attempt < retry) {
          lastError = networkErr;
          if (retryDelay > 0) {
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
          }
          continue;
        }

        return err(networkErr);
      }

      if (timeoutId !== null) clearTimeout(timeoutId);

      const requestForInterceptor = new Request(
        fullURL.startsWith("/") ? `http://localhost${fullURL}` : fullURL,
        requestInit,
      );

      if (!response.ok) {
        let body: unknown;
        try {
          body = await response.clone().json();
        } catch {
          try {
            body = await response.clone().text();
          } catch {
            body = undefined;
          }
        }

        const httpError = new HTTPError({
          statusCode: response.status,
          statusText: response.statusText,
          url: fullURL,
          body,
          response,
        });

        if (onResponseError) {
          await onResponseError({
            request: requestForInterceptor,
            response,
            options,
            error: httpError,
          });
        }

        if (retryStatusCodes.includes(response.status) && attempt < retry) {
          lastError = httpError;
          if (retryDelay > 0) {
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
          }
          continue;
        }

        return err(httpError);
      }

      if (onResponse) {
        await onResponse({
          request: requestForInterceptor,
          response,
          options,
        });
      }

      // Parse response (clone to preserve original body)
      let data: T;
      try {
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
      } catch (e) {
        const cause = e instanceof Error ? e : new Error(String(e));
        return err(
          new ParseError({
            message: cause.message,
            url: fullURL,
            cause,
          }),
        );
      }

      const rawResponse = response as RawResponse<T>;
      rawResponse._data = data;

      return ok(rawResponse);
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      const networkErr = new NetworkError({
        message: error.message,
        url: fullURL,
        cause: error,
      });

      if (attempt >= retry) {
        return err(networkErr);
      }

      lastError = networkErr;
      if (retryDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  return err(
    lastError || new NetworkError({
      message: "Request failed",
      url: fullURL,
    }),
  );
};

// ============================================================================
// tidyfetch.native - Direct fetch access
// ============================================================================

/**
 * Direct access to the native fetch API.
 * Bypasses all tidyfetch enhancements.
 */
tidyfetch.native = globalThis.fetch.bind(globalThis) as typeof fetch;

// ============================================================================
// HTTP Method Shortcuts (Result-based)
// ============================================================================

/** GET request returning Result */
tidyfetch.get = <T = unknown>(
  url: string,
  options: FetchOptions = {},
): Promise<Result<T, TidyFetchError>> =>
  tidyfetch<T>(url, { ...options, method: "GET" });

/** POST request returning Result */
tidyfetch.post = <T = unknown>(
  url: string,
  options: FetchOptions = {},
): Promise<Result<T, TidyFetchError>> =>
  tidyfetch<T>(url, { ...options, method: "POST" });

/** PUT request returning Result */
tidyfetch.put = <T = unknown>(
  url: string,
  options: FetchOptions = {},
): Promise<Result<T, TidyFetchError>> =>
  tidyfetch<T>(url, { ...options, method: "PUT" });

/** PATCH request returning Result */
tidyfetch.patch = <T = unknown>(
  url: string,
  options: FetchOptions = {},
): Promise<Result<T, TidyFetchError>> =>
  tidyfetch<T>(url, { ...options, method: "PATCH" });

/** DELETE request returning Result */
tidyfetch.delete = <T = unknown>(
  url: string,
  options: FetchOptions = {},
): Promise<Result<T, TidyFetchError>> =>
  tidyfetch<T>(url, { ...options, method: "DELETE" });
