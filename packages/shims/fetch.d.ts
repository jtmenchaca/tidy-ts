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
 * const result = await tidyfetch<User>({ url: "/api/users/1" });
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
 * const result = await tidyfetch<User>({ url: "/api/users/1" });
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
import { type AppError, type Result } from "./result.ts";
/** Extra properties for NetworkError */
type NetworkErrorExtra = {
    message: string;
    url: string;
    cause?: Error;
};
/** Network-level error (DNS failure, connection refused, etc.) */
export declare const NetworkError: {
    new (extra: NetworkErrorExtra): AppError<"NetworkError", NetworkErrorExtra>;
};
export type NetworkError = AppError<"NetworkError", NetworkErrorExtra>;
/** Extra properties for TimeoutError */
type TimeoutErrorExtra = {
    url: string;
    timeout: number;
};
/** Request timed out */
export declare const TimeoutError: {
    new (extra: TimeoutErrorExtra): AppError<"TimeoutError", TimeoutErrorExtra>;
};
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
export declare const HTTPError: {
    new (extra: HTTPErrorExtra): AppError<"HTTPError", HTTPErrorExtra>;
};
export type HTTPError = AppError<"HTTPError", HTTPErrorExtra>;
/** Extra properties for ParseError */
type ParseErrorExtra = {
    message: string;
    url: string;
    cause?: Error;
};
/** Failed to parse response body */
export declare const ParseError: {
    new (extra: ParseErrorExtra): AppError<"ParseError", ParseErrorExtra>;
};
export type ParseError = AppError<"ParseError", ParseErrorExtra>;
/** Extra properties for AbortError */
type AbortErrorExtra = {
    url: string;
};
/** Request was aborted (by user or signal) */
export declare const AbortError: {
    new (extra: AbortErrorExtra): AppError<"AbortError", AbortErrorExtra>;
};
export type AbortError = AppError<"AbortError", AbortErrorExtra>;
/** Union of all fetch error types */
export type TidyFetchError = NetworkError | TimeoutError | HTTPError | ParseError | AbortError;
/**
 * Response object with parsed data attached.
 * Returned by `tidyfetch.raw()`.
 */
export interface RawResponse<T = unknown> extends Response {
    /** The parsed response body */
    _data: T;
}
/** Type for the function returned by tidyfetch.create */
type TidyFetchInstance = <T = unknown>(options: {
    url: string;
    baseURL?: string;
    query?: Record<string, string | number | boolean | undefined>;
    timeout?: number;
    retry?: number;
    retryDelay?: number;
    retryStatusCodes?: number[];
    onRequest?: (context: {
        request: Request;
        url: string;
    }) => void | Promise<void>;
    onResponse?: (context: {
        request: Request;
        response: Response;
        url: string;
    }) => void | Promise<void>;
    onResponseError?: (context: {
        request: Request;
        response: Response;
        url: string;
        error: TidyFetchError;
    }) => void | Promise<void>;
    parseResponse?: (text: string) => unknown;
    responseType?: "json" | "text" | "blob" | "arrayBuffer" | "stream";
    cacheTTL?: number;
    signal?: AbortSignal | null;
    method?: string;
    headers?: HeadersInit;
    body?: BodyInit | Record<string, unknown>;
    mode?: RequestMode;
    credentials?: RequestCredentials;
    cache?: RequestCache;
    redirect?: RequestRedirect;
    referrer?: string;
    referrerPolicy?: ReferrerPolicy;
    integrity?: string;
    keepalive?: boolean;
    priority?: RequestPriority;
}) => Promise<Result<T, TidyFetchError>>;
/**
 * Enhanced fetch function returning Result<T, TidyFetchError>.
 *
 * @typeParam T - Type of the parsed response data
 * @returns Result with either the parsed data or a typed error
 *
 * @example Basic usage
 * ```ts
 * const result = await tidyfetch<User>({ url: "/api/users/1" });
 *
 * if (!result.ok) {
 *   console.error(result.error.message);
 *   return;
 * }
 *
 * console.log(result.value.name);
 * ```
 *
 * @example POST with body
 * ```ts
 * const result = await tidyfetch<User>({
 *   url: "/api/users",
 *   method: "POST",
 *   body: { name: "Alice" },
 * });
 * ```
 */
export declare function tidyfetch<T = unknown>({ url, baseURL, query, timeout, retry, retryDelay, retryStatusCodes, onRequest, onResponse, onResponseError, parseResponse, responseType, cacheTTL, signal: userSignal, method, headers, body, mode, credentials, cache, redirect, referrer, referrerPolicy, integrity, keepalive, priority, }: {
    /** The URL to fetch (required) */
    url: string;
    /** Base URL to prepend to the request URL */
    baseURL?: string;
    /** Query parameters to append to the URL (undefined values filtered out) */
    query?: Record<string, string | number | boolean | undefined>;
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
        url: string;
    }) => void | Promise<void>;
    /** Interceptor called after successful response */
    onResponse?: (context: {
        request: Request;
        response: Response;
        url: string;
    }) => void | Promise<void>;
    /** Interceptor called on error responses (before Result is returned) */
    onResponseError?: (context: {
        request: Request;
        response: Response;
        url: string;
        error: TidyFetchError;
    }) => void | Promise<void>;
    /** Custom response parser */
    parseResponse?: (text: string) => unknown;
    /** Response type for parsing */
    responseType?: "json" | "text" | "blob" | "arrayBuffer" | "stream";
    /** Response cache TTL in milliseconds (0 = no caching) */
    cacheTTL?: number;
    /** AbortSignal to cancel request */
    signal?: AbortSignal | null;
    /** HTTP method (GET, POST, PUT, PATCH, DELETE, etc.) */
    method?: string;
    /** Request headers */
    headers?: HeadersInit;
    /** Request body (plain objects auto-stringified to JSON) */
    body?: BodyInit | Record<string, unknown>;
    /** Request mode (cors, no-cors, same-origin, navigate) */
    mode?: RequestMode;
    /** Credentials mode (omit, same-origin, include) */
    credentials?: RequestCredentials;
    /** Cache mode (default, no-store, reload, no-cache, force-cache, only-if-cached) */
    cache?: RequestCache;
    /** Redirect mode (follow, error, manual) */
    redirect?: RequestRedirect;
    /** Referrer URL or empty string */
    referrer?: string;
    /** Referrer policy */
    referrerPolicy?: ReferrerPolicy;
    /** Subresource integrity hash */
    integrity?: string;
    /** Keep connection alive after page unloads */
    keepalive?: boolean;
    /** Request priority hint */
    priority?: RequestPriority;
}): Promise<Result<T, TidyFetchError>>;
export declare namespace tidyfetch {
    export var create: ({ baseURL: defaultBaseURL, query: defaultQuery, timeout: defaultTimeout, retry: defaultRetry, retryDelay: defaultRetryDelay, retryStatusCodes: defaultRetryStatusCodes, onRequest: defaultOnRequest, onResponse: defaultOnResponse, onResponseError: defaultOnResponseError, parseResponse: defaultParseResponse, responseType: defaultResponseType, cacheTTL: defaultCacheTTL, signal: defaultSignal, method: defaultMethod, headers: defaultHeaders, body: defaultBody, mode: defaultMode, credentials: defaultCredentials, cache: defaultCache, redirect: defaultRedirect, referrer: defaultReferrer, referrerPolicy: defaultReferrerPolicy, integrity: defaultIntegrity, keepalive: defaultKeepalive, priority: defaultPriority, }?: {
        baseURL?: string;
        query?: Record<string, string | number | boolean | undefined>;
        timeout?: number;
        retry?: number;
        retryDelay?: number;
        retryStatusCodes?: number[];
        onRequest?: (context: {
            request: Request;
            url: string;
        }) => void | Promise<void>;
        onResponse?: (context: {
            request: Request;
            response: Response;
            url: string;
        }) => void | Promise<void>;
        onResponseError?: (context: {
            request: Request;
            response: Response;
            url: string;
            error: TidyFetchError;
        }) => void | Promise<void>;
        parseResponse?: (text: string) => unknown;
        responseType?: "json" | "text" | "blob" | "arrayBuffer" | "stream";
        cacheTTL?: number;
        signal?: AbortSignal | null;
        method?: string;
        headers?: HeadersInit;
        body?: BodyInit | Record<string, unknown>;
        mode?: RequestMode;
        credentials?: RequestCredentials;
        cache?: RequestCache;
        redirect?: RequestRedirect;
        referrer?: string;
        referrerPolicy?: ReferrerPolicy;
        integrity?: string;
        keepalive?: boolean;
        priority?: RequestPriority;
    }) => TidyFetchInstance;
    export var raw: <T = unknown>({ url, baseURL, query, timeout, retry, retryDelay, retryStatusCodes, onRequest, onResponse, onResponseError, parseResponse, responseType, signal: userSignal, method, headers, body, mode, credentials, cache, redirect, referrer, referrerPolicy, integrity, keepalive, priority, }: {
        url: string;
        baseURL?: string;
        query?: Record<string, string | number | boolean | undefined>;
        timeout?: number;
        retry?: number;
        retryDelay?: number;
        retryStatusCodes?: number[];
        onRequest?: (context: {
            request: Request;
            url: string;
        }) => void | Promise<void>;
        onResponse?: (context: {
            request: Request;
            response: Response;
            url: string;
        }) => void | Promise<void>;
        onResponseError?: (context: {
            request: Request;
            response: Response;
            url: string;
            error: TidyFetchError;
        }) => void | Promise<void>;
        parseResponse?: (text: string) => unknown;
        responseType?: "json" | "text" | "blob" | "arrayBuffer" | "stream";
        signal?: AbortSignal | null;
        method?: string;
        headers?: HeadersInit;
        body?: BodyInit | Record<string, unknown>;
        mode?: RequestMode;
        credentials?: RequestCredentials;
        cache?: RequestCache;
        redirect?: RequestRedirect;
        referrer?: string;
        referrerPolicy?: ReferrerPolicy;
        integrity?: string;
        keepalive?: boolean;
        priority?: RequestPriority;
    }) => Promise<Result<RawResponse<T>, TidyFetchError>>;
    export var native: typeof fetch;
    export var get: <T = unknown>({ url, baseURL, query, timeout, retry, retryDelay, retryStatusCodes, onRequest, onResponse, onResponseError, parseResponse, responseType, cacheTTL, signal, headers, mode, credentials, cache, redirect, referrer, referrerPolicy, integrity, keepalive, priority, }: {
        url: string;
        baseURL?: string;
        query?: Record<string, string | number | boolean | undefined>;
        timeout?: number;
        retry?: number;
        retryDelay?: number;
        retryStatusCodes?: number[];
        onRequest?: (context: {
            request: Request;
            url: string;
        }) => void | Promise<void>;
        onResponse?: (context: {
            request: Request;
            response: Response;
            url: string;
        }) => void | Promise<void>;
        onResponseError?: (context: {
            request: Request;
            response: Response;
            url: string;
            error: TidyFetchError;
        }) => void | Promise<void>;
        parseResponse?: (text: string) => unknown;
        responseType?: "json" | "text" | "blob" | "arrayBuffer" | "stream";
        cacheTTL?: number;
        signal?: AbortSignal | null;
        headers?: HeadersInit;
        mode?: RequestMode;
        credentials?: RequestCredentials;
        cache?: RequestCache;
        redirect?: RequestRedirect;
        referrer?: string;
        referrerPolicy?: ReferrerPolicy;
        integrity?: string;
        keepalive?: boolean;
        priority?: RequestPriority;
    }) => Promise<Result<T, TidyFetchError>>;
    export var post: <T = unknown>({ url, baseURL, query, timeout, retry, retryDelay, retryStatusCodes, onRequest, onResponse, onResponseError, parseResponse, responseType, cacheTTL, signal, headers, body, mode, credentials, cache, redirect, referrer, referrerPolicy, integrity, keepalive, priority, }: {
        url: string;
        baseURL?: string;
        query?: Record<string, string | number | boolean | undefined>;
        timeout?: number;
        retry?: number;
        retryDelay?: number;
        retryStatusCodes?: number[];
        onRequest?: (context: {
            request: Request;
            url: string;
        }) => void | Promise<void>;
        onResponse?: (context: {
            request: Request;
            response: Response;
            url: string;
        }) => void | Promise<void>;
        onResponseError?: (context: {
            request: Request;
            response: Response;
            url: string;
            error: TidyFetchError;
        }) => void | Promise<void>;
        parseResponse?: (text: string) => unknown;
        responseType?: "json" | "text" | "blob" | "arrayBuffer" | "stream";
        cacheTTL?: number;
        signal?: AbortSignal | null;
        headers?: HeadersInit;
        body?: BodyInit | Record<string, unknown>;
        mode?: RequestMode;
        credentials?: RequestCredentials;
        cache?: RequestCache;
        redirect?: RequestRedirect;
        referrer?: string;
        referrerPolicy?: ReferrerPolicy;
        integrity?: string;
        keepalive?: boolean;
        priority?: RequestPriority;
    }) => Promise<Result<T, TidyFetchError>>;
    export var put: <T = unknown>({ url, baseURL, query, timeout, retry, retryDelay, retryStatusCodes, onRequest, onResponse, onResponseError, parseResponse, responseType, cacheTTL, signal, headers, body, mode, credentials, cache, redirect, referrer, referrerPolicy, integrity, keepalive, priority, }: {
        url: string;
        baseURL?: string;
        query?: Record<string, string | number | boolean | undefined>;
        timeout?: number;
        retry?: number;
        retryDelay?: number;
        retryStatusCodes?: number[];
        onRequest?: (context: {
            request: Request;
            url: string;
        }) => void | Promise<void>;
        onResponse?: (context: {
            request: Request;
            response: Response;
            url: string;
        }) => void | Promise<void>;
        onResponseError?: (context: {
            request: Request;
            response: Response;
            url: string;
            error: TidyFetchError;
        }) => void | Promise<void>;
        parseResponse?: (text: string) => unknown;
        responseType?: "json" | "text" | "blob" | "arrayBuffer" | "stream";
        cacheTTL?: number;
        signal?: AbortSignal | null;
        headers?: HeadersInit;
        body?: BodyInit | Record<string, unknown>;
        mode?: RequestMode;
        credentials?: RequestCredentials;
        cache?: RequestCache;
        redirect?: RequestRedirect;
        referrer?: string;
        referrerPolicy?: ReferrerPolicy;
        integrity?: string;
        keepalive?: boolean;
        priority?: RequestPriority;
    }) => Promise<Result<T, TidyFetchError>>;
    export var patch: <T = unknown>({ url, baseURL, query, timeout, retry, retryDelay, retryStatusCodes, onRequest, onResponse, onResponseError, parseResponse, responseType, cacheTTL, signal, headers, body, mode, credentials, cache, redirect, referrer, referrerPolicy, integrity, keepalive, priority, }: {
        url: string;
        baseURL?: string;
        query?: Record<string, string | number | boolean | undefined>;
        timeout?: number;
        retry?: number;
        retryDelay?: number;
        retryStatusCodes?: number[];
        onRequest?: (context: {
            request: Request;
            url: string;
        }) => void | Promise<void>;
        onResponse?: (context: {
            request: Request;
            response: Response;
            url: string;
        }) => void | Promise<void>;
        onResponseError?: (context: {
            request: Request;
            response: Response;
            url: string;
            error: TidyFetchError;
        }) => void | Promise<void>;
        parseResponse?: (text: string) => unknown;
        responseType?: "json" | "text" | "blob" | "arrayBuffer" | "stream";
        cacheTTL?: number;
        signal?: AbortSignal | null;
        headers?: HeadersInit;
        body?: BodyInit | Record<string, unknown>;
        mode?: RequestMode;
        credentials?: RequestCredentials;
        cache?: RequestCache;
        redirect?: RequestRedirect;
        referrer?: string;
        referrerPolicy?: ReferrerPolicy;
        integrity?: string;
        keepalive?: boolean;
        priority?: RequestPriority;
    }) => Promise<Result<T, TidyFetchError>>;
    var _a: <T = unknown>({ url, baseURL, query, timeout, retry, retryDelay, retryStatusCodes, onRequest, onResponse, onResponseError, parseResponse, responseType, cacheTTL, signal, headers, body, mode, credentials, cache, redirect, referrer, referrerPolicy, integrity, keepalive, priority, }: {
        url: string;
        baseURL?: string;
        query?: Record<string, string | number | boolean | undefined>;
        timeout?: number;
        retry?: number;
        retryDelay?: number;
        retryStatusCodes?: number[];
        onRequest?: (context: {
            request: Request;
            url: string;
        }) => void | Promise<void>;
        onResponse?: (context: {
            request: Request;
            response: Response;
            url: string;
        }) => void | Promise<void>;
        onResponseError?: (context: {
            request: Request;
            response: Response;
            url: string;
            error: TidyFetchError;
        }) => void | Promise<void>;
        parseResponse?: (text: string) => unknown;
        responseType?: "json" | "text" | "blob" | "arrayBuffer" | "stream";
        cacheTTL?: number;
        signal?: AbortSignal | null;
        headers?: HeadersInit;
        body?: BodyInit | Record<string, unknown>;
        mode?: RequestMode;
        credentials?: RequestCredentials;
        cache?: RequestCache;
        redirect?: RequestRedirect;
        referrer?: string;
        referrerPolicy?: ReferrerPolicy;
        integrity?: string;
        keepalive?: boolean;
        priority?: RequestPriority;
    }) => Promise<Result<T, TidyFetchError>>;
    export { _a as delete };
}
export {};
