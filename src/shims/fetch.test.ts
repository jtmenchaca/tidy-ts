/**
 * Tests for cross-runtime enhanced fetch API with Result-based error handling
 */

import { expect } from "@std/expect";
import {
  AbortError,
  HTTPError,
  NetworkError,
  ParseError,
  tidyfetch,
  TimeoutError,
} from "./fetch.ts";

// Mock server response helper
function createMockResponse(
  // deno-lint-ignore no-explicit-any
  body: any,
  status = 200,
  statusText = "OK",
): Response {
  const isJson = typeof body === "object" && body !== null;
  return new Response(isJson ? JSON.stringify(body) : body, {
    status,
    statusText,
    headers: {
      "content-type": isJson ? "application/json" : "text/plain",
    },
  });
}

// ============================================================================
// Basic Result-based API Tests
// ============================================================================

Deno.test("tidyfetch - returns ok Result on success", async () => {
  const originalFetch = globalThis.fetch;

  try {
    // deno-lint-ignore require-await
    globalThis.fetch = async () =>
      createMockResponse({ message: "success", id: 123 });

    const result = await tidyfetch<{ message: string; id: number }>({
      url: "/api/data",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ message: "success", id: 123 });
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("tidyfetch - returns err Result with HTTPError on non-2xx", async () => {
  const originalFetch = globalThis.fetch;

  try {
    // deno-lint-ignore require-await
    globalThis.fetch = async () =>
      createMockResponse({ error: "Not Found" }, 404, "Not Found");

    const result = await tidyfetch({ url: "/api/missing" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(HTTPError);
      expect(result.error.name).toBe("HTTPError");
      expect((result.error as HTTPError).statusCode).toBe(404);
      expect((result.error as HTTPError).statusText).toBe("Not Found");
      expect((result.error as HTTPError).body).toEqual({ error: "Not Found" });
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("tidyfetch - returns TimeoutError on timeout", async () => {
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = async (
      _input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      if (init?.signal?.aborted) {
        throw new DOMException("The operation was aborted", "AbortError");
      }

      await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, 200);
        if (init?.signal) {
          init.signal.addEventListener("abort", () => {
            clearTimeout(timer);
            reject(new DOMException("The operation was aborted", "AbortError"));
          });
        }
      });

      return createMockResponse({ data: "slow" });
    };

    const result = await tidyfetch({
      url: "http://localhost/api/slow",
      timeout: 50,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(TimeoutError);
      expect(result.error.name).toBe("TimeoutError");
      expect((result.error as TimeoutError).timeout).toBe(50);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("tidyfetch - returns AbortError when cancelled", async () => {
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = async (
      _input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, 200);
        if (init?.signal) {
          init.signal.addEventListener("abort", () => {
            clearTimeout(timer);
            reject(new DOMException("The operation was aborted", "AbortError"));
          });
        }
      });
      return createMockResponse({ data: "completed" });
    };

    const controller = new AbortController();
    setTimeout(() => controller.abort(), 50);

    const result = await tidyfetch({
      url: "/api/slow",
      signal: controller.signal,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(AbortError);
      expect(result.error.name).toBe("AbortError");
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("tidyfetch - returns ParseError on invalid JSON", async () => {
  const originalFetch = globalThis.fetch;

  try {
    // deno-lint-ignore require-await
    globalThis.fetch = async () =>
      new Response("not valid json", { status: 200 });

    const result = await tidyfetch({ url: "/api/data" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(ParseError);
      expect(result.error.name).toBe("ParseError");
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("tidyfetch - returns NetworkError on network failure", async () => {
  const originalFetch = globalThis.fetch;

  try {
    // deno-lint-ignore require-await
    globalThis.fetch = async () => {
      throw new Error("Network failure");
    };

    const result = await tidyfetch({ url: "/api/data" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(NetworkError);
      expect(result.error.name).toBe("NetworkError");
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ============================================================================
// Query Parameters and URL Building
// ============================================================================

Deno.test("tidyfetch - handles query parameters", async () => {
  const originalFetch = globalThis.fetch;
  let capturedURL = "";

  try {
    // deno-lint-ignore require-await
    globalThis.fetch = async (input: RequestInfo | URL) => {
      capturedURL = typeof input === "string" ? input : input.toString();
      return createMockResponse({ success: true });
    };

    await tidyfetch({
      url: "/api/users",
      query: { page: 2, limit: 10, active: true },
    });

    expect(capturedURL).toBe("/api/users?page=2&limit=10&active=true");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("tidyfetch - handles baseURL", async () => {
  const originalFetch = globalThis.fetch;
  let capturedURL = "";

  try {
    // deno-lint-ignore require-await
    globalThis.fetch = async (input: RequestInfo | URL) => {
      capturedURL = typeof input === "string" ? input : input.toString();
      return createMockResponse({ success: true });
    };

    await tidyfetch({
      url: "/users",
      baseURL: "https://api.example.com",
    });

    expect(capturedURL).toBe("https://api.example.com/users");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("tidyfetch - handles undefined query values", async () => {
  const originalFetch = globalThis.fetch;
  let capturedURL = "";

  try {
    // deno-lint-ignore require-await
    globalThis.fetch = async (input: RequestInfo | URL) => {
      capturedURL = typeof input === "string" ? input : input.toString();
      return createMockResponse({ success: true });
    };

    await tidyfetch({
      url: "/api/users",
      query: { page: 1, filter: undefined },
    });

    expect(capturedURL).toBe("/api/users?page=1");
    expect(capturedURL).not.toContain("filter");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ============================================================================
// Body Processing
// ============================================================================

Deno.test("tidyfetch - auto-stringifies JSON body", async () => {
  const originalFetch = globalThis.fetch;
  let capturedBody = "";
  let capturedHeaders: Headers | undefined;

  try {
    // deno-lint-ignore require-await
    globalThis.fetch = async (
      _input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      capturedBody = init?.body as string;
      capturedHeaders = new Headers(init?.headers);
      return createMockResponse({ success: true });
    };

    await tidyfetch({
      url: "/api/users",
      method: "POST",
      body: { name: "John", age: 30 },
    });

    expect(capturedBody).toBe('{"name":"John","age":30}');
    expect(capturedHeaders?.get("content-type")).toBe("application/json");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("tidyfetch - preserves non-JSON body types", async () => {
  const originalFetch = globalThis.fetch;
  // deno-lint-ignore no-explicit-any
  let capturedBody: any;

  try {
    // deno-lint-ignore require-await
    globalThis.fetch = async (
      _input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      capturedBody = init?.body;
      return createMockResponse({ success: true });
    };

    const formData = new FormData();
    formData.append("key", "value");

    await tidyfetch({
      url: "/api/upload",
      method: "POST",
      body: formData,
    });

    expect(capturedBody).toBeInstanceOf(FormData);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ============================================================================
// Retry Logic
// ============================================================================

Deno.test("tidyfetch - retries on specified status codes", async () => {
  const originalFetch = globalThis.fetch;
  let attemptCount = 0;

  try {
    // deno-lint-ignore require-await
    globalThis.fetch = async () => {
      attemptCount++;
      if (attemptCount < 3) {
        return createMockResponse("Server Error", 500, "Internal Server Error");
      }
      return createMockResponse({ success: true });
    };

    const result = await tidyfetch<{ success: boolean }>({
      url: "/api/data",
      retry: 3,
      retryDelay: 10,
      retryStatusCodes: [500],
    });

    expect(attemptCount).toBe(3);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ success: true });
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("tidyfetch - returns error after all retries exhausted", async () => {
  const originalFetch = globalThis.fetch;
  let attemptCount = 0;

  try {
    // deno-lint-ignore require-await
    globalThis.fetch = async () => {
      attemptCount++;
      return createMockResponse("Server Error", 500, "Internal Server Error");
    };

    const result = await tidyfetch({
      url: "/api/data",
      retry: 2,
      retryDelay: 10,
      retryStatusCodes: [500],
    });

    expect(attemptCount).toBe(3); // Initial + 2 retries
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(HTTPError);
      expect((result.error as HTTPError).statusCode).toBe(500);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ============================================================================
// Interceptors
// ============================================================================

Deno.test("tidyfetch - calls onRequest interceptor", async () => {
  const originalFetch = globalThis.fetch;
  let interceptorCalled = false;
  let capturedHeaders: Headers | undefined;

  try {
    // deno-lint-ignore require-await
    globalThis.fetch = async (
      _input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      capturedHeaders = new Headers(init?.headers);
      return createMockResponse({ success: true });
    };

    await tidyfetch({
      url: "/api/data",
      headers: { "X-Custom": "interceptor-value" },
      onRequest() {
        interceptorCalled = true;
      },
    });

    expect(interceptorCalled).toBe(true);
    expect(capturedHeaders?.get("x-custom")).toBe("interceptor-value");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("tidyfetch - calls onResponse interceptor", async () => {
  const originalFetch = globalThis.fetch;
  let interceptorCalled = false;
  let capturedStatus = 0;

  try {
    // deno-lint-ignore require-await
    globalThis.fetch = async () => createMockResponse({ data: "test" });

    await tidyfetch({
      url: "/api/data",
      // deno-lint-ignore require-await
      async onResponse({ response }) {
        interceptorCalled = true;
        capturedStatus = response.status;
      },
    });

    expect(interceptorCalled).toBe(true);
    expect(capturedStatus).toBe(200);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("tidyfetch - calls onResponseError interceptor with error", async () => {
  const originalFetch = globalThis.fetch;
  let errorInterceptorCalled = false;
  let capturedError: unknown;

  try {
    // deno-lint-ignore require-await
    globalThis.fetch = async () =>
      createMockResponse("Unauthorized", 401, "Unauthorized");

    await tidyfetch({
      url: "/api/data",
      // deno-lint-ignore require-await
      async onResponseError({ error }) {
        errorInterceptorCalled = true;
        capturedError = error;
      },
    });

    expect(errorInterceptorCalled).toBe(true);
    expect(capturedError).toBeInstanceOf(HTTPError);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ============================================================================
// Response Parsing
// ============================================================================

Deno.test("tidyfetch - supports custom parseResponse", async () => {
  const originalFetch = globalThis.fetch;

  try {
    // deno-lint-ignore require-await
    globalThis.fetch = async () =>
      createMockResponse('{"value": 42}', 200, "OK");

    const result = await tidyfetch<{ custom: number }>({
      url: "/api/data",
      parseResponse: (text) => {
        const parsed = JSON.parse(text);
        return { custom: parsed.value * 2 };
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ custom: 84 });
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("tidyfetch - supports different response types", async () => {
  const originalFetch = globalThis.fetch;

  try {
    // Test text response
    // deno-lint-ignore require-await
    globalThis.fetch = async () => new Response("plain text");

    const textResult = await tidyfetch<string>({
      url: "/api/text",
      responseType: "text",
    });
    expect(textResult.ok).toBe(true);
    if (textResult.ok) {
      expect(textResult.value).toBe("plain text");
    }

    // Test blob response
    // deno-lint-ignore require-await
    globalThis.fetch = async () => new Response("blob data");

    const blobResult = await tidyfetch<Blob>({
      url: "/api/blob",
      responseType: "blob",
    });
    expect(blobResult.ok).toBe(true);
    if (blobResult.ok) {
      expect(blobResult.value).toBeInstanceOf(Blob);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ============================================================================
// Caching
// ============================================================================

Deno.test("tidyfetch - supports caching with TTL", async () => {
  const originalFetch = globalThis.fetch;
  let fetchCount = 0;

  try {
    // deno-lint-ignore require-await
    globalThis.fetch = async () => {
      fetchCount++;
      return createMockResponse({ data: "cached", count: fetchCount });
    };

    interface CacheData {
      data: string;
      count: number;
    }

    // First call should hit the network
    const result1 = await tidyfetch<CacheData>({
      url: "/api/data",
      cacheTTL: 1000,
    });
    expect(result1.ok).toBe(true);
    if (result1.ok) {
      expect(result1.value.count).toBe(1);
    }
    expect(fetchCount).toBe(1);

    // Second call within TTL should return cached data
    const result2 = await tidyfetch<CacheData>({
      url: "/api/data",
      cacheTTL: 1000,
    });
    expect(result2.ok).toBe(true);
    if (result2.ok) {
      expect(result2.value.count).toBe(1);
    }
    expect(fetchCount).toBe(1);

    // Wait for cache to expire
    await new Promise((resolve) => setTimeout(resolve, 1100));

    // Third call after TTL should hit network again
    const result3 = await tidyfetch<CacheData>({
      url: "/api/data",
      cacheTTL: 1000,
    });
    expect(result3.ok).toBe(true);
    if (result3.ok) {
      expect(result3.value.count).toBe(2);
    }
    expect(fetchCount).toBe(2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ============================================================================
// tidyfetch.create Tests
// ============================================================================

Deno.test("tidyfetch.create - creates instance with defaults", async () => {
  const originalFetch = globalThis.fetch;
  let capturedURL = "";
  let capturedHeaders: Headers | undefined;

  try {
    // deno-lint-ignore require-await
    globalThis.fetch = async (
      input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      capturedURL = typeof input === "string" ? input : input.toString();
      capturedHeaders = new Headers(init?.headers);
      return createMockResponse({ success: true });
    };

    const api = tidyfetch.create({
      baseURL: "https://api.example.com",
      headers: { "X-API-Key": "secret-key" },
      timeout: 5000,
    });

    const result = await api({ url: "/users" });

    expect(capturedURL).toBe("https://api.example.com/users");
    expect(capturedHeaders?.get("x-api-key")).toBe("secret-key");
    expect(result.ok).toBe(true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("tidyfetch.create - merges options with defaults", async () => {
  const originalFetch = globalThis.fetch;
  let capturedHeaders: Headers | undefined;

  try {
    // deno-lint-ignore require-await
    globalThis.fetch = async (
      _input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      capturedHeaders = new Headers(init?.headers);
      return createMockResponse({ success: true });
    };

    const api = tidyfetch.create({
      baseURL: "https://api.example.com",
      headers: { "X-API-Key": "key" },
    });

    await api({
      url: "/users",
      headers: { Authorization: "Bearer token" },
    });

    expect(capturedHeaders?.get("x-api-key")).toBe("key");
    expect(capturedHeaders?.get("authorization")).toBe("Bearer token");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ============================================================================
// tidyfetch.raw Tests
// ============================================================================

Deno.test("tidyfetch.raw - returns Result with RawResponse", async () => {
  const originalFetch = globalThis.fetch;

  try {
    // deno-lint-ignore require-await
    globalThis.fetch = async () =>
      createMockResponse({ id: 123, name: "Test" }, 200, "OK");

    const result = await tidyfetch.raw<{ id: number; name: string }>({
      url: "/api/data",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe(200);
      expect(result.value.statusText).toBe("OK");
      expect(result.value.ok).toBe(true);
      expect(result.value._data).toEqual({ id: 123, name: "Test" });
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("tidyfetch.raw - returns err Result on error", async () => {
  const originalFetch = globalThis.fetch;

  try {
    // deno-lint-ignore require-await
    globalThis.fetch = async () =>
      createMockResponse("Not Found", 404, "Not Found");

    const result = await tidyfetch.raw({ url: "/api/missing" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(HTTPError);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ============================================================================
// HTTP Method Shortcuts
// ============================================================================

Deno.test("tidyfetch.get - performs GET request", async () => {
  const originalFetch = globalThis.fetch;
  let capturedMethod = "";

  try {
    // deno-lint-ignore require-await
    globalThis.fetch = async (
      _input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      capturedMethod = init?.method || "GET";
      return createMockResponse({ success: true });
    };

    const result = await tidyfetch.get({ url: "/api/users" });

    expect(capturedMethod).toBe("GET");
    expect(result.ok).toBe(true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("tidyfetch.post - performs POST request", async () => {
  const originalFetch = globalThis.fetch;
  let capturedMethod = "";
  let capturedBody = "";

  try {
    // deno-lint-ignore require-await
    globalThis.fetch = async (
      _input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      capturedMethod = init?.method || "";
      capturedBody = init?.body as string;
      return createMockResponse({ id: 456 });
    };

    const result = await tidyfetch.post({
      url: "/api/users",
      body: { name: "Bob" },
    });

    expect(capturedMethod).toBe("POST");
    expect(JSON.parse(capturedBody)).toEqual({ name: "Bob" });
    expect(result.ok).toBe(true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("tidyfetch.put - performs PUT request", async () => {
  const originalFetch = globalThis.fetch;
  let capturedMethod = "";

  try {
    // deno-lint-ignore require-await
    globalThis.fetch = async (
      _input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      capturedMethod = init?.method || "";
      return createMockResponse({ updated: true });
    };

    const result = await tidyfetch.put({
      url: "/api/users/1",
      body: { name: "Updated" },
    });

    expect(capturedMethod).toBe("PUT");
    expect(result.ok).toBe(true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("tidyfetch.patch - performs PATCH request", async () => {
  const originalFetch = globalThis.fetch;
  let capturedMethod = "";

  try {
    // deno-lint-ignore require-await
    globalThis.fetch = async (
      _input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      capturedMethod = init?.method || "";
      return createMockResponse({ patched: true });
    };

    const result = await tidyfetch.patch({
      url: "/api/users/1",
      body: { email: "new@example.com" },
    });

    expect(capturedMethod).toBe("PATCH");
    expect(result.ok).toBe(true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("tidyfetch.delete - performs DELETE request", async () => {
  const originalFetch = globalThis.fetch;
  let capturedMethod = "";

  try {
    // deno-lint-ignore require-await
    globalThis.fetch = async (
      _input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      capturedMethod = init?.method || "";
      return createMockResponse({ deleted: true });
    };

    const result = await tidyfetch.delete({ url: "/api/users/1" });

    expect(capturedMethod).toBe("DELETE");
    expect(result.ok).toBe(true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ============================================================================
// tidyfetch.native
// ============================================================================

Deno.test("tidyfetch.native - provides access to native fetch", () => {
  expect(typeof tidyfetch.native).toBe("function");
  expect(tidyfetch.native.name).toContain("fetch");
});

// ============================================================================
// Generic Type Support
// ============================================================================

Deno.test("tidyfetch - supports TypeScript generic type argument", async () => {
  const originalFetch = globalThis.fetch;

  try {
    // deno-lint-ignore require-await
    globalThis.fetch = async () =>
      createMockResponse({ id: 1, name: "Alice", email: "alice@example.com" });

    interface User {
      id: number;
      name: string;
      email: string;
    }

    const result = await tidyfetch<User>({ url: "/api/users/1" });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe(1);
      expect(result.value.name).toBe("Alice");
      expect(result.value.email).toBe("alice@example.com");
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("tidyfetch - generic type with arrays", async () => {
  const originalFetch = globalThis.fetch;

  try {
    // deno-lint-ignore require-await
    globalThis.fetch = async () =>
      createMockResponse([
        { id: 1, title: "Post 1" },
        { id: 2, title: "Post 2" },
      ]);

    interface Post {
      id: number;
      title: string;
    }

    const result = await tidyfetch<Post[]>({ url: "/api/posts" });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Array.isArray(result.value)).toBe(true);
      expect(result.value).toHaveLength(2);
      expect(result.value[0].id).toBe(1);
      expect(result.value[0].title).toBe("Post 1");
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});
