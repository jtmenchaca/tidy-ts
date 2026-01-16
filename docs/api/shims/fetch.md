# Fetch

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [tidyfetch](#tidyfetch)
- [tidyfetch.create](#tidyfetchcreate)
- [tidyfetch.get](#tidyfetchget)
- [tidyfetch.post](#tidyfetchpost)
- [tidyfetch.raw](#tidyfetchraw)
- [RawResponse](#rawresponse)
- [TidyFetchError](#tidyfetcherror)
- [HTTPError](#httperror)
- [TimeoutError](#timeouterror)
- [NetworkError](#networkerror)
- [ParseError](#parseerror)
- [AbortError](#aborterror)

---

## tidyfetch

Cross-runtime enhanced fetch API returning Result<T, TidyFetchError>. Provides Result-based error handling, automatic JSON parsing, auto JSON stringification, configurable retries, request timeouts, interceptors, and response caching. Works in Deno, Bun, and Node.js.

### Signature

```typescript
tidyfetch<T>(options: { url: string; method?: string; body?: BodyInit | object; headers?: HeadersInit; timeout?: number; retry?: number; ... }): Promise<Result<T, TidyFetchError>>
```

### Import

```typescript
import { tidyfetch } from "@tidy-ts/shims";
```

### Parameters

- url: The URL to fetch (required)
- method: HTTP method (GET, POST, PUT, PATCH, DELETE)
- body: Request body (plain objects auto-stringified to JSON)
- headers: Request headers
- baseURL: Base URL to prepend
- query: Query parameters (Record<string, string | number | boolean | undefined>)
- timeout: Request timeout in ms (0 = no timeout)
- retry: Number of retry attempts
- retryDelay: Delay between retries in ms
- retryStatusCodes: HTTP status codes that trigger retry (default: [408, 429, 500, 502, 503, 504])
- responseType: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'stream'
- cacheTTL: Response cache TTL in ms (0 = no caching)
- signal: AbortSignal to cancel request
- onRequest: Interceptor called before request
- onResponse: Interceptor called after successful response
- onResponseError: Interceptor called on error responses

### Returns

Promise<Result<T, TidyFetchError>>

### Examples

```typescript
// Basic usage with Result
import { tidyfetch } from "@tidy-ts/shims";

const result = await tidyfetch<User>({ url: "/api/users/1" });

if (!result.ok) {
  console.error("Failed:", result.error.message);
  return;
}

console.log(result.value.name); // TypeScript knows this is User
// POST with body (auto JSON stringify)
const result = await tidyfetch<User>({
  url: "/api/users",
  method: "POST",
  body: { name: "Alice", email: "alice@example.com" },
});
// Error handling with specific types
const result = await tidyfetch<User>({ url: "/api/users/1" });

if (!result.ok) {
  if (result.error instanceof HTTPError) {
    console.log(`HTTP ${result.error.statusCode}: ${result.error.body}`);
  } else if (result.error instanceof TimeoutError) {
    console.log(`Timed out after ${result.error.timeout}ms`);
  }
  return;
}
// With retry and timeout
const result = await tidyfetch<Data>({
  url: "/api/data",
  timeout: 5000,
  retry: 3,
  retryDelay: 1000,
});
```

### Best Practices

- ✓ GOOD: Always check result.ok before accessing value
- ✓ GOOD: Use instanceof to narrow error types
- ✓ GOOD: Set timeout for production requests
- ✓ GOOD: Use tidyfetch.create for preconfigured instances

### Anti-patterns

- ❌ BAD: Ignoring error results
- ❌ BAD: Not setting timeouts on critical requests

### Related

`tidyfetch.create`, `tidyfetch.get`, `HTTPError`, `TidyFetchError`

---

## tidyfetch.create

Factory function to create a preconfigured tidyfetch instance. All default options are merged with per-request options, with per-request taking precedence.

### Signature

```typescript
tidyfetch.create(defaults: FetchOptions): TidyFetchInstance
```

### Import

```typescript
import { tidyfetch } from "@tidy-ts/shims";
```

### Parameters

- defaults: Default options for all requests (same as tidyfetch options)

### Returns

TidyFetchInstance - preconfigured fetch function

### Examples

```typescript
// Create API client with defaults
import { tidyfetch } from "@tidy-ts/shims";

const api = tidyfetch.create({
  baseURL: "https://api.example.com",
  headers: { "Authorization": `Bearer ${token}` },
  timeout: 10000
});

// Uses baseURL and headers from defaults
const result = await api<User[]>({ url: "/users" });
if (result.ok) {
  console.log(result.value);
}
// Override defaults per request
const result = await api<User>({
  url: "/admin/users/1",
  headers: { "X-Admin-Key": "secret" }, // merged with defaults
  timeout: 30000 // overrides default
});
```

### Best Practices

- ✓ GOOD: Create one instance per API/service
- ✓ GOOD: Set common headers like Authorization in defaults

### Related

`tidyfetch`, `TidyFetchError`

---

## tidyfetch.get

Shortcut for GET requests. Same as tidyfetch with method: 'GET' preset.

### Signature

```typescript
tidyfetch.get<T>(options: FetchOptions): Promise<Result<T, TidyFetchError>>
```

### Import

```typescript
import { tidyfetch } from "@tidy-ts/shims";
```

### Parameters

- options: All tidyfetch options except method

### Returns

Promise<Result<T, TidyFetchError>>

### Examples

```typescript
// GET request
const result = await tidyfetch.get<User[]>({
  url: "/api/users",
  query: { limit: 10, offset: 0 }
});
```

### Best Practices

- ✓ GOOD: Use for readable GET requests

### Related

`tidyfetch`, `tidyfetch.post`, `tidyfetch.put`

---

## tidyfetch.post

Shortcut for POST requests. Same as tidyfetch with method: 'POST' preset. Body objects are auto-stringified to JSON.

### Signature

```typescript
tidyfetch.post<T>(options: FetchOptions): Promise<Result<T, TidyFetchError>>
```

### Import

```typescript
import { tidyfetch } from "@tidy-ts/shims";
```

### Parameters

- options: All tidyfetch options except method

### Returns

Promise<Result<T, TidyFetchError>>

### Examples

```typescript
// POST request with JSON body
const result = await tidyfetch.post<User>({
  url: "/api/users",
  body: { name: "Alice", email: "alice@example.com" }
});
```

### Best Practices

- ✓ GOOD: Use for creating resources

### Related

`tidyfetch`, `tidyfetch.get`, `tidyfetch.put`

---

## tidyfetch.raw

Fetch with access to full Response object plus parsed data. Returns Result<RawResponse<T>, TidyFetchError> where RawResponse extends Response with _data property.

### Signature

```typescript
tidyfetch.raw<T>(options: FetchOptions): Promise<Result<RawResponse<T>, TidyFetchError>>
```

### Import

```typescript
import { tidyfetch, type RawResponse } from "@tidy-ts/shims";
```

### Parameters

- options: All tidyfetch options (no cacheTTL support)

### Returns

Promise<Result<RawResponse<T>, TidyFetchError>>

### Examples

```typescript
// Access response headers and parsed data
const result = await tidyfetch.raw<User>({ url: "/api/users/1" });

if (result.ok) {
  console.log(result.value.status);  // 200
  console.log(result.value.headers.get("x-rate-limit"));
  console.log(result.value._data.name);  // parsed User
}
```

### Best Practices

- ✓ GOOD: Use when you need response headers or status

### Related

`tidyfetch`, `RawResponse`

---

## RawResponse

Response object with parsed data attached. Returned by tidyfetch.raw(). Extends the native Response with a _data property containing the parsed response body.

### Signature

```typescript
interface RawResponse<T> extends Response { _data: T }
```

### Import

```typescript
import type { RawResponse } from "@tidy-ts/shims";
```

### Parameters

- T: Type of the parsed response data

### Returns

Response with _data property

### Examples

```typescript
// Type usage
import type { RawResponse } from "@tidy-ts/shims";

function handleResponse(res: RawResponse<User>) {
  console.log(res.status);
  console.log(res._data.name);
}
```

### Best Practices

- ✓ GOOD: Use with tidyfetch.raw when headers/status needed

### Related

`tidyfetch.raw`, `tidyfetch`

---

## TidyFetchError

Union of all fetch error types. Use instanceof to narrow to specific error types for detailed error handling.

### Signature

```typescript
type TidyFetchError = NetworkError | TimeoutError | HTTPError | ParseError | AbortError
```

### Import

```typescript
import type { TidyFetchError } from "@tidy-ts/shims";
```

### Returns

Discriminated union of fetch error types

### Examples

```typescript
// Handle different error types
import { tidyfetch, HTTPError, TimeoutError, NetworkError } from "@tidy-ts/shims";

const result = await tidyfetch<User>({ url: "/api/users/1" });

if (!result.ok) {
  const err = result.error;
  if (err instanceof HTTPError) {
    console.log(`HTTP ${err.statusCode}: ${err.statusText}`);
    console.log("Body:", err.body);
  } else if (err instanceof TimeoutError) {
    console.log(`Timeout after ${err.timeout}ms`);
  } else if (err instanceof NetworkError) {
    console.log(`Network error: ${err.message}`);
  }
}
```

### Best Practices

- ✓ GOOD: Use instanceof to narrow error types
- ✓ GOOD: Handle specific errors differently (retry on timeout, fail on 404)

### Related

`HTTPError`, `TimeoutError`, `NetworkError`, `ParseError`, `AbortError`

---

## HTTPError

HTTP error for non-2xx status codes. Contains the status code, status text, URL, response body (if parseable), and the original Response object.

### Signature

```typescript
class HTTPError extends Error { statusCode: number; statusText: string; url: string; body?: unknown; response: Response }
```

### Import

```typescript
import { HTTPError } from "@tidy-ts/shims";
```

### Parameters

- statusCode: HTTP status code (e.g., 404, 500)
- statusText: HTTP status text (e.g., 'Not Found')
- url: The request URL
- body: Parsed response body (if available)
- response: The original Response object

### Returns

HTTPError instance

### Examples

```typescript
// Handle HTTP errors
if (result.error instanceof HTTPError) {
  if (result.error.statusCode === 404) {
    console.log("Resource not found");
  } else if (result.error.statusCode === 401) {
    console.log("Unauthorized - please login");
  } else if (result.error.statusCode >= 500) {
    console.log("Server error - try again later");
  }
  // Access error body
  console.log(result.error.body);
}
```

### Best Practices

- ✓ GOOD: Check statusCode for specific error handling
- ✓ GOOD: Access body for API error messages

### Related

`TidyFetchError`, `tidyfetch`

---

## TimeoutError

Request timed out error. Contains the URL and configured timeout duration.

### Signature

```typescript
class TimeoutError extends Error { url: string; timeout: number }
```

### Import

```typescript
import { TimeoutError } from "@tidy-ts/shims";
```

### Parameters

- url: The request URL
- timeout: The timeout duration in ms

### Returns

TimeoutError instance

### Examples

```typescript
// Handle timeout
if (result.error instanceof TimeoutError) {
  console.log(`Request to ${result.error.url} timed out after ${result.error.timeout}ms`);
}
```

### Best Practices

- ✓ GOOD: Consider retry on timeout errors

### Related

`TidyFetchError`, `tidyfetch`

---

## NetworkError

Network-level error (DNS failure, connection refused, etc.). Contains the URL and optional cause error.

### Signature

```typescript
class NetworkError extends Error { url: string; cause?: Error }
```

### Import

```typescript
import { NetworkError } from "@tidy-ts/shims";
```

### Parameters

- message: Error description
- url: The request URL
- cause: Underlying error (optional)

### Returns

NetworkError instance

### Examples

```typescript
// Handle network errors
if (result.error instanceof NetworkError) {
  console.log("Network error - check your connection");
  console.log(result.error.cause?.message);
}
```

### Best Practices

- ✓ GOOD: Show user-friendly message for network errors
- ✓ GOOD: Consider retry with backoff

### Related

`TidyFetchError`, `tidyfetch`

---

## ParseError

Failed to parse response body. Typically occurs when response is not valid JSON but responseType is 'json'.

### Signature

```typescript
class ParseError extends Error { url: string; cause?: Error }
```

### Import

```typescript
import { ParseError } from "@tidy-ts/shims";
```

### Parameters

- message: Error description
- url: The request URL
- cause: Underlying parse error (optional)

### Returns

ParseError instance

### Examples

```typescript
// Handle parse errors
if (result.error instanceof ParseError) {
  console.log("Failed to parse response as JSON");
  console.log(result.error.cause?.message);
}
```

### Best Practices

- ✓ GOOD: Check responseType matches expected response

### Related

`TidyFetchError`, `tidyfetch`

---

## AbortError

Request was aborted by user or signal. Occurs when AbortController.abort() is called or signal is aborted.

### Signature

```typescript
class AbortError extends Error { url: string }
```

### Import

```typescript
import { AbortError } from "@tidy-ts/shims";
```

### Parameters

- url: The request URL

### Returns

AbortError instance

### Examples

```typescript
// Handle abort
if (result.error instanceof AbortError) {
  console.log("Request was cancelled");
}
```

### Best Practices

- ✓ GOOD: Use AbortSignal.timeout() for request timeouts
- ✓ GOOD: Abort requests when component unmounts

### Related

`TidyFetchError`, `tidyfetch`

---
