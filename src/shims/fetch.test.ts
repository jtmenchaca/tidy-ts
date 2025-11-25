/**
 * Tests for cross-runtime enhanced fetch API
 */

import { expect } from "@std/expect";
import { tidyfetch } from "./fetch.ts";

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

Deno.test("tidyfetch - basic GET request with auto JSON parsing", async () => {
  const originalFetch = globalThis.fetch;

  try {
    // Mock successful JSON response
    // deno-lint-ignore require-await
    globalThis.fetch = async () =>
      createMockResponse({ message: "success", id: 123 });

    const result = await tidyfetch("/api/data");

    expect(result).toEqual({ message: "success", id: 123 });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("tidyfetch - handles query parameters", async () => {
  const originalFetch = globalThis.fetch;
  let capturedURL = "";

  try {
    // deno-lint-ignore require-await
    globalThis.fetch = async (input: RequestInfo | URL) => {
      capturedURL = typeof input === "string" ? input : input.toString();
      return createMockResponse({ success: true });
    };

    await tidyfetch("/api/users", {
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

    await tidyfetch("/users", {
      baseURL: "https://api.example.com",
    });

    expect(capturedURL).toBe("https://api.example.com/users");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

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

    await tidyfetch("/api/users", {
      method: "POST",
      body: { name: "John", age: 30 },
    });

    expect(capturedBody).toBe('{"name":"John","age":30}');
    expect(capturedHeaders?.get("content-type")).toBe("application/json");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("tidyfetch - throws on non-2xx status codes", async () => {
  const originalFetch = globalThis.fetch;

  try {
    // deno-lint-ignore require-await
    globalThis.fetch = async () =>
      createMockResponse("Not Found", 404, "Not Found");

    await expect(tidyfetch("/api/missing")).rejects.toThrow(
      "HTTP 404: Not Found",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("tidyfetch - retries on specified status codes", async () => {
  const originalFetch = globalThis.fetch;
  let attemptCount = 0;

  try {
    // deno-lint-ignore require-await
    globalThis.fetch = async () => {
      attemptCount++;
      // Fail first 2 times, succeed on 3rd
      if (attemptCount < 3) {
        return createMockResponse("Server Error", 500, "Internal Server Error");
      }
      return createMockResponse({ success: true });
    };

    const result = await tidyfetch("/api/data", {
      retry: 3,
      retryDelay: 10, // Small delay for testing
      retryStatusCodes: [500],
    });

    expect(attemptCount).toBe(3);
    expect(result).toEqual({ success: true });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("tidyfetch - respects timeout", async () => {
  const originalFetch = globalThis.fetch;

  try {
    // Mock slow response that actually delays
    globalThis.fetch = async (
      _input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      // Check if already aborted
      if (init?.signal?.aborted) {
        throw new DOMException("The operation was aborted", "AbortError");
      }

      // Wait for delay or abort
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

    await expect(
      tidyfetch("http://localhost/api/slow", { timeout: 50 }),
    ).rejects.toThrow();
  } finally {
    globalThis.fetch = originalFetch;
  }
});

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
    await tidyfetch("/api/data", {
      // deno-lint-ignore require-await
      async onRequest({ options }) {
        interceptorCalled = true;
        // Modify headers in interceptor
        if (!options.headers) {
          options.headers = new Headers();
        }
        if (options.headers instanceof Headers) {
          options.headers.set("X-Custom", "interceptor-value");
        }
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

    await tidyfetch("/api/data", {
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

Deno.test("tidyfetch - calls onResponseError interceptor", async () => {
  const originalFetch = globalThis.fetch;
  let errorInterceptorCalled = false;
  let capturedErrorStatus = 0;

  try {
    // deno-lint-ignore require-await
    globalThis.fetch = async () =>
      createMockResponse("Unauthorized", 401, "Unauthorized");

    try {
      await tidyfetch("/api/data", {
        // deno-lint-ignore require-await
        async onResponseError({ response }) {
          errorInterceptorCalled = true;
          capturedErrorStatus = response.status;
        },
      });
    } catch {
      // Expected to throw
    }

    expect(errorInterceptorCalled).toBe(true);
    expect(capturedErrorStatus).toBe(401);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("tidyfetch - supports custom parseResponse", async () => {
  const originalFetch = globalThis.fetch;

  try {
    // deno-lint-ignore require-await
    globalThis.fetch = async () =>
      createMockResponse('{"value": 42}', 200, "OK");

    const result = await tidyfetch("/api/data", {
      parseResponse: (text) => {
        const parsed = JSON.parse(text);
        return { custom: parsed.value * 2 };
      },
    });

    expect(result).toEqual({ custom: 84 });
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

    const textResult = await tidyfetch("/api/text", { responseType: "text" });
    expect(textResult).toBe("plain text");

    // Test blob response
    // deno-lint-ignore require-await
    globalThis.fetch = async () => new Response("blob data");

    const blobResult = await tidyfetch("/api/blob", { responseType: "blob" });
    expect(blobResult).toBeInstanceOf(Blob);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

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

    await api("/users");

    expect(capturedURL).toBe("https://api.example.com/users");
    expect(capturedHeaders?.get("x-api-key")).toBe("secret-key");
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

    await api("/users", {
      headers: { Authorization: "Bearer token" },
    });

    expect(capturedHeaders?.get("x-api-key")).toBe("key");
    expect(capturedHeaders?.get("authorization")).toBe("Bearer token");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("tidyfetch.create - merges query parameters", async () => {
  const originalFetch = globalThis.fetch;
  let capturedURL = "";

  try {
    // deno-lint-ignore require-await
    globalThis.fetch = async (input: RequestInfo | URL) => {
      capturedURL = typeof input === "string" ? input : input.toString();
      return createMockResponse({ success: true });
    };

    const api = tidyfetch.create({
      baseURL: "https://api.example.com",
      query: { apiVersion: "v2" },
    });

    await api("/users", {
      query: { page: 1 },
    });

    expect(capturedURL).toContain("apiVersion=v2");
    expect(capturedURL).toContain("page=1");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("tidyfetch.native - provides access to native fetch", () => {
  // tidyfetch.native is a reference to the native fetch function
  expect(typeof tidyfetch.native).toBe("function");
  // The name can be "fetch" or "bound fetch" depending on binding
  expect(tidyfetch.native.name).toContain("fetch");
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

    await tidyfetch("/api/users", {
      query: { page: 1, filter: undefined },
    });

    expect(capturedURL).toBe("/api/users?page=1");
    expect(capturedURL).not.toContain("filter");
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

    await tidyfetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    expect(capturedBody).toBeInstanceOf(FormData);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

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

    // Type argument provides full type safety
    const user = await tidyfetch<User>("/api/users/1");

    // TypeScript knows the shape of user
    expect(user.id).toBe(1);
    expect(user.name).toBe("Alice");
    expect(user.email).toBe("alice@example.com");
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

    // Array type argument
    const posts = await tidyfetch<Post[]>("/api/posts");

    expect(Array.isArray(posts)).toBe(true);
    expect(posts).toHaveLength(2);
    expect(posts[0].id).toBe(1);
    expect(posts[0].title).toBe("Post 1");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("tidyfetch.create - supports generic type argument", async () => {
  const originalFetch = globalThis.fetch;

  try {
    // deno-lint-ignore require-await
    globalThis.fetch = async () =>
      createMockResponse({ userId: 123, role: "admin" });

    interface AuthResponse {
      userId: number;
      role: string;
    }

    const api = tidyfetch.create({
      baseURL: "https://api.example.com",
    });

    // Generic type works with created instances
    const auth = await api<AuthResponse>("/auth/verify");

    expect(auth.userId).toBe(123);
    expect(auth.role).toBe("admin");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

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
    const result1 = await tidyfetch<CacheData>("/api/data", { cacheTTL: 1000 });
    expect(result1.count).toBe(1);
    expect(fetchCount).toBe(1);

    // Second call within TTL should return cached data
    const result2 = await tidyfetch<CacheData>("/api/data", { cacheTTL: 1000 });
    expect(result2.count).toBe(1); // Same data, not incremented
    expect(fetchCount).toBe(1); // Fetch not called again

    // Wait for cache to expire
    await new Promise((resolve) => setTimeout(resolve, 1100));

    // Third call after TTL should hit network again
    const result3 = await tidyfetch<CacheData>("/api/data", { cacheTTL: 1000 });
    expect(result3.count).toBe(2); // New fetch
    expect(fetchCount).toBe(2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("tidyfetch - supports external AbortSignal", async () => {
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = async (
      _input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      // Wait for abort or delay
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

    // Abort after 50ms
    setTimeout(() => controller.abort(), 50);

    await expect(
      tidyfetch("/api/slow", { signal: controller.signal }),
    ).rejects.toThrow();
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("tidyfetch.raw - returns Response with _data property", async () => {
  const originalFetch = globalThis.fetch;

  try {
    // deno-lint-ignore require-await
    globalThis.fetch = async () =>
      createMockResponse({ id: 123, name: "Test" }, 200, "OK");

    const response = await tidyfetch.raw("/api/data");

    // Should have Response properties
    expect(response.status).toBe(200);
    expect(response.statusText).toBe("OK");
    expect(response.ok).toBe(true);

    // Should have parsed data
    expect(response._data).toEqual({ id: 123, name: "Test" });

    // Should still be able to clone and read body
    const clone = response.clone();
    const text = await clone.text();
    expect(JSON.parse(text)).toEqual({ id: 123, name: "Test" });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

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

    await tidyfetch.get("/api/users");

    expect(capturedMethod).toBe("GET");
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

    await tidyfetch.post("/api/users", {
      body: { name: "Bob" },
    });

    expect(capturedMethod).toBe("POST");
    expect(JSON.parse(capturedBody)).toEqual({ name: "Bob" });
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

    await tidyfetch.put("/api/users/1", {
      body: { name: "Updated" },
    });

    expect(capturedMethod).toBe("PUT");
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

    await tidyfetch.patch("/api/users/1", {
      body: { email: "new@example.com" },
    });

    expect(capturedMethod).toBe("PATCH");
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

    await tidyfetch.delete("/api/users/1");

    expect(capturedMethod).toBe("DELETE");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
