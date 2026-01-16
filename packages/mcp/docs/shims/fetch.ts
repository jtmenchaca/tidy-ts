import type { DocEntry } from "../mcp-types.ts";

export const fetchDocs: Record<string, DocEntry> = {
  tidyfetch: {
    name: "tidyfetch",
    category: "shims",
    signature:
      "tidyfetch<T>(options: { url: string; method?: string; body?: BodyInit | object; headers?: HeadersInit; timeout?: number; retry?: number; ... }): Promise<Result<T, TidyFetchError>>",
    description:
      "Cross-runtime enhanced fetch API returning Result<T, TidyFetchError>. Provides Result-based error handling, automatic JSON parsing, auto JSON stringification, configurable retries, request timeouts, interceptors, and response caching. Works in Deno, Bun, and Node.js.",
    imports: [
      'import { tidyfetch } from "@tidy-ts/shims";',
    ],
    parameters: [
      "url: The URL to fetch (required)",
      "method: HTTP method (GET, POST, PUT, PATCH, DELETE)",
      "body: Request body (plain objects auto-stringified to JSON)",
      "headers: Request headers",
      "baseURL: Base URL to prepend",
      "query: Query parameters (Record<string, string | number | boolean | undefined>)",
      "timeout: Request timeout in ms (0 = no timeout)",
      "retry: Number of retry attempts",
      "retryDelay: Delay between retries in ms",
      "retryStatusCodes: HTTP status codes that trigger retry (default: [408, 429, 500, 502, 503, 504])",
      "responseType: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'stream'",
      "cacheTTL: Response cache TTL in ms (0 = no caching)",
      "signal: AbortSignal to cancel request",
      "onRequest: Interceptor called before request",
      "onResponse: Interceptor called after successful response",
      "onResponseError: Interceptor called on error responses",
    ],
    returns: "Promise<Result<T, TidyFetchError>>",
    examples: [
      '// Basic usage with Result\nimport { tidyfetch } from "@tidy-ts/shims";\n\nconst result = await tidyfetch<User>({ url: "/api/users/1" });\n\nif (!result.ok) {\n  console.error("Failed:", result.error.message);\n  return;\n}\n\nconsole.log(result.value.name); // TypeScript knows this is User',
      '// POST with body (auto JSON stringify)\nconst result = await tidyfetch<User>({\n  url: "/api/users",\n  method: "POST",\n  body: { name: "Alice", email: "alice@example.com" },\n});',
      '// Error handling with specific types\nconst result = await tidyfetch<User>({ url: "/api/users/1" });\n\nif (!result.ok) {\n  if (result.error instanceof HTTPError) {\n    console.log(`HTTP ${result.error.statusCode}: ${result.error.body}`);\n  } else if (result.error instanceof TimeoutError) {\n    console.log(`Timed out after ${result.error.timeout}ms`);\n  }\n  return;\n}',
      '// With retry and timeout\nconst result = await tidyfetch<Data>({\n  url: "/api/data",\n  timeout: 5000,\n  retry: 3,\n  retryDelay: 1000,\n});',
    ],
    related: [
      "tidyfetch.create",
      "tidyfetch.get",
      "HTTPError",
      "TidyFetchError",
    ],
    bestPractices: [
      "✓ GOOD: Always check result.ok before accessing value",
      "✓ GOOD: Use instanceof to narrow error types",
      "✓ GOOD: Set timeout for production requests",
      "✓ GOOD: Use tidyfetch.create for preconfigured instances",
    ],
    antiPatterns: [
      "❌ BAD: Ignoring error results",
      "❌ BAD: Not setting timeouts on critical requests",
    ],
  },

  "tidyfetch.create": {
    name: "tidyfetch.create",
    category: "shims",
    signature: "tidyfetch.create(defaults: FetchOptions): TidyFetchInstance",
    description:
      "Factory function to create a preconfigured tidyfetch instance. All default options are merged with per-request options, with per-request taking precedence.",
    imports: [
      'import { tidyfetch } from "@tidy-ts/shims";',
    ],
    parameters: [
      "defaults: Default options for all requests (same as tidyfetch options)",
    ],
    returns: "TidyFetchInstance - preconfigured fetch function",
    examples: [
      '// Create API client with defaults\nimport { tidyfetch } from "@tidy-ts/shims";\n\nconst api = tidyfetch.create({\n  baseURL: "https://api.example.com",\n  headers: { "Authorization": `Bearer ${token}` },\n  timeout: 10000\n});\n\n// Uses baseURL and headers from defaults\nconst result = await api<User[]>({ url: "/users" });\nif (result.ok) {\n  console.log(result.value);\n}',
      '// Override defaults per request\nconst result = await api<User>({\n  url: "/admin/users/1",\n  headers: { "X-Admin-Key": "secret" }, // merged with defaults\n  timeout: 30000 // overrides default\n});',
    ],
    related: ["tidyfetch", "TidyFetchError"],
    bestPractices: [
      "✓ GOOD: Create one instance per API/service",
      "✓ GOOD: Set common headers like Authorization in defaults",
    ],
  },

  "tidyfetch.get": {
    name: "tidyfetch.get",
    category: "shims",
    signature:
      "tidyfetch.get<T>(options: FetchOptions): Promise<Result<T, TidyFetchError>>",
    description:
      "Shortcut for GET requests. Same as tidyfetch with method: 'GET' preset.",
    imports: [
      'import { tidyfetch } from "@tidy-ts/shims";',
    ],
    parameters: [
      "options: All tidyfetch options except method",
    ],
    returns: "Promise<Result<T, TidyFetchError>>",
    examples: [
      '// GET request\nconst result = await tidyfetch.get<User[]>({\n  url: "/api/users",\n  query: { limit: 10, offset: 0 }\n});',
    ],
    related: ["tidyfetch", "tidyfetch.post", "tidyfetch.put"],
    bestPractices: [
      "✓ GOOD: Use for readable GET requests",
    ],
  },

  "tidyfetch.post": {
    name: "tidyfetch.post",
    category: "shims",
    signature:
      "tidyfetch.post<T>(options: FetchOptions): Promise<Result<T, TidyFetchError>>",
    description:
      "Shortcut for POST requests. Same as tidyfetch with method: 'POST' preset. Body objects are auto-stringified to JSON.",
    imports: [
      'import { tidyfetch } from "@tidy-ts/shims";',
    ],
    parameters: [
      "options: All tidyfetch options except method",
    ],
    returns: "Promise<Result<T, TidyFetchError>>",
    examples: [
      '// POST request with JSON body\nconst result = await tidyfetch.post<User>({\n  url: "/api/users",\n  body: { name: "Alice", email: "alice@example.com" }\n});',
    ],
    related: ["tidyfetch", "tidyfetch.get", "tidyfetch.put"],
    bestPractices: [
      "✓ GOOD: Use for creating resources",
    ],
  },

  "tidyfetch.raw": {
    name: "tidyfetch.raw",
    category: "shims",
    signature:
      "tidyfetch.raw<T>(options: FetchOptions): Promise<Result<RawResponse<T>, TidyFetchError>>",
    description:
      "Fetch with access to full Response object plus parsed data. Returns Result<RawResponse<T>, TidyFetchError> where RawResponse extends Response with _data property.",
    imports: [
      'import { tidyfetch, type RawResponse } from "@tidy-ts/shims";',
    ],
    parameters: [
      "options: All tidyfetch options (no cacheTTL support)",
    ],
    returns: "Promise<Result<RawResponse<T>, TidyFetchError>>",
    examples: [
      '// Access response headers and parsed data\nconst result = await tidyfetch.raw<User>({ url: "/api/users/1" });\n\nif (result.ok) {\n  console.log(result.value.status);  // 200\n  console.log(result.value.headers.get("x-rate-limit"));\n  console.log(result.value._data.name);  // parsed User\n}',
    ],
    related: ["tidyfetch", "RawResponse"],
    bestPractices: [
      "✓ GOOD: Use when you need response headers or status",
    ],
  },

  RawResponse: {
    name: "RawResponse",
    category: "shims",
    signature: "interface RawResponse<T> extends Response { _data: T }",
    description:
      "Response object with parsed data attached. Returned by tidyfetch.raw(). Extends the native Response with a _data property containing the parsed response body.",
    imports: [
      'import type { RawResponse } from "@tidy-ts/shims";',
    ],
    parameters: [
      "T: Type of the parsed response data",
    ],
    returns: "Response with _data property",
    examples: [
      '// Type usage\nimport type { RawResponse } from "@tidy-ts/shims";\n\nfunction handleResponse(res: RawResponse<User>) {\n  console.log(res.status);\n  console.log(res._data.name);\n}',
    ],
    related: ["tidyfetch.raw", "tidyfetch"],
    bestPractices: [
      "✓ GOOD: Use with tidyfetch.raw when headers/status needed",
    ],
  },

  TidyFetchError: {
    name: "TidyFetchError",
    category: "shims",
    signature:
      "type TidyFetchError = NetworkError | TimeoutError | HTTPError | ParseError | AbortError",
    description:
      "Union of all fetch error types. Use instanceof to narrow to specific error types for detailed error handling.",
    imports: [
      'import type { TidyFetchError } from "@tidy-ts/shims";',
    ],
    parameters: [],
    returns: "Discriminated union of fetch error types",
    examples: [
      '// Handle different error types\nimport { tidyfetch, HTTPError, TimeoutError, NetworkError } from "@tidy-ts/shims";\n\nconst result = await tidyfetch<User>({ url: "/api/users/1" });\n\nif (!result.ok) {\n  const err = result.error;\n  if (err instanceof HTTPError) {\n    console.log(`HTTP ${err.statusCode}: ${err.statusText}`);\n    console.log("Body:", err.body);\n  } else if (err instanceof TimeoutError) {\n    console.log(`Timeout after ${err.timeout}ms`);\n  } else if (err instanceof NetworkError) {\n    console.log(`Network error: ${err.message}`);\n  }\n}',
    ],
    related: [
      "HTTPError",
      "TimeoutError",
      "NetworkError",
      "ParseError",
      "AbortError",
    ],
    bestPractices: [
      "✓ GOOD: Use instanceof to narrow error types",
      "✓ GOOD: Handle specific errors differently (retry on timeout, fail on 404)",
    ],
  },

  HTTPError: {
    name: "HTTPError",
    category: "shims",
    signature:
      "class HTTPError extends Error { statusCode: number; statusText: string; url: string; body?: unknown; response: Response }",
    description:
      "HTTP error for non-2xx status codes. Contains the status code, status text, URL, response body (if parseable), and the original Response object.",
    imports: [
      'import { HTTPError } from "@tidy-ts/shims";',
    ],
    parameters: [
      "statusCode: HTTP status code (e.g., 404, 500)",
      "statusText: HTTP status text (e.g., 'Not Found')",
      "url: The request URL",
      "body: Parsed response body (if available)",
      "response: The original Response object",
    ],
    returns: "HTTPError instance",
    examples: [
      '// Handle HTTP errors\nif (result.error instanceof HTTPError) {\n  if (result.error.statusCode === 404) {\n    console.log("Resource not found");\n  } else if (result.error.statusCode === 401) {\n    console.log("Unauthorized - please login");\n  } else if (result.error.statusCode >= 500) {\n    console.log("Server error - try again later");\n  }\n  // Access error body\n  console.log(result.error.body);\n}',
    ],
    related: ["TidyFetchError", "tidyfetch"],
    bestPractices: [
      "✓ GOOD: Check statusCode for specific error handling",
      "✓ GOOD: Access body for API error messages",
    ],
  },

  TimeoutError: {
    name: "TimeoutError",
    category: "shims",
    signature:
      "class TimeoutError extends Error { url: string; timeout: number }",
    description:
      "Request timed out error. Contains the URL and configured timeout duration.",
    imports: [
      'import { TimeoutError } from "@tidy-ts/shims";',
    ],
    parameters: [
      "url: The request URL",
      "timeout: The timeout duration in ms",
    ],
    returns: "TimeoutError instance",
    examples: [
      "// Handle timeout\nif (result.error instanceof TimeoutError) {\n  console.log(`Request to ${result.error.url} timed out after ${result.error.timeout}ms`);\n}",
    ],
    related: ["TidyFetchError", "tidyfetch"],
    bestPractices: [
      "✓ GOOD: Consider retry on timeout errors",
    ],
  },

  NetworkError: {
    name: "NetworkError",
    category: "shims",
    signature:
      "class NetworkError extends Error { url: string; cause?: Error }",
    description:
      "Network-level error (DNS failure, connection refused, etc.). Contains the URL and optional cause error.",
    imports: [
      'import { NetworkError } from "@tidy-ts/shims";',
    ],
    parameters: [
      "message: Error description",
      "url: The request URL",
      "cause: Underlying error (optional)",
    ],
    returns: "NetworkError instance",
    examples: [
      '// Handle network errors\nif (result.error instanceof NetworkError) {\n  console.log("Network error - check your connection");\n  console.log(result.error.cause?.message);\n}',
    ],
    related: ["TidyFetchError", "tidyfetch"],
    bestPractices: [
      "✓ GOOD: Show user-friendly message for network errors",
      "✓ GOOD: Consider retry with backoff",
    ],
  },

  ParseError: {
    name: "ParseError",
    category: "shims",
    signature: "class ParseError extends Error { url: string; cause?: Error }",
    description:
      "Failed to parse response body. Typically occurs when response is not valid JSON but responseType is 'json'.",
    imports: [
      'import { ParseError } from "@tidy-ts/shims";',
    ],
    parameters: [
      "message: Error description",
      "url: The request URL",
      "cause: Underlying parse error (optional)",
    ],
    returns: "ParseError instance",
    examples: [
      '// Handle parse errors\nif (result.error instanceof ParseError) {\n  console.log("Failed to parse response as JSON");\n  console.log(result.error.cause?.message);\n}',
    ],
    related: ["TidyFetchError", "tidyfetch"],
    bestPractices: [
      "✓ GOOD: Check responseType matches expected response",
    ],
  },

  AbortError: {
    name: "AbortError",
    category: "shims",
    signature: "class AbortError extends Error { url: string }",
    description:
      "Request was aborted by user or signal. Occurs when AbortController.abort() is called or signal is aborted.",
    imports: [
      'import { AbortError } from "@tidy-ts/shims";',
    ],
    parameters: [
      "url: The request URL",
    ],
    returns: "AbortError instance",
    examples: [
      '// Handle abort\nif (result.error instanceof AbortError) {\n  console.log("Request was cancelled");\n}',
    ],
    related: ["TidyFetchError", "tidyfetch"],
    bestPractices: [
      "✓ GOOD: Use AbortSignal.timeout() for request timeouts",
      "✓ GOOD: Abort requests when component unmounts",
    ],
  },
};
