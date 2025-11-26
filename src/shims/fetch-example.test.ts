/**
 * Enhanced Fetch API Examples
 *
 * Demonstrates the key features of @tidy-ts/shims fetch wrapper
 * with Result-based error handling.
 */

import { expect } from "@std/expect";
import { HTTPError, tidyfetch } from "./fetch.ts";

Deno.test("Example: Basic GET with auto JSON parsing", async () => {
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = () =>
      Promise.resolve(
        new Response(JSON.stringify({ users: ["Alice", "Bob"] })),
      );

    const result = await tidyfetch<{ users: string[] }>({
      url: "https://api.example.com/users",
    });

    if (!result.ok) {
      throw new Error("Request failed");
    }

    // Result-based: check ok and access value
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.users).toEqual(["Alice", "Bob"]);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("Example: POST with auto JSON stringification", async () => {
  const originalFetch = globalThis.fetch;
  let capturedBody = "";

  try {
    globalThis.fetch = (_input, init?: RequestInit) => {
      capturedBody = init?.body as string;
      return Promise.resolve(
        new Response(JSON.stringify({ id: 123, name: "Alice" })),
      );
    };

    const result = await tidyfetch<{ id: number; name: string }>({
      url: "https://api.example.com/users",
      method: "POST",
      body: { name: "Alice", email: "alice@example.com" },
    });

    expect(JSON.parse(capturedBody)).toEqual({
      name: "Alice",
      email: "alice@example.com",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe(123);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("Example: Retry on server errors", async () => {
  const originalFetch = globalThis.fetch;
  let attemptCount = 0;

  try {
    globalThis.fetch = () => {
      attemptCount++;
      if (attemptCount < 3) {
        return Promise.resolve(new Response("Server Error", { status: 500 }));
      }
      return Promise.resolve(new Response(JSON.stringify({ success: true })));
    };

    const result = await tidyfetch<{ success: boolean }>({
      url: "https://api.example.com/data",
      retry: 3,
      retryDelay: 10,
    });

    expect(attemptCount).toBe(3);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.success).toBe(true);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("Example: Factory pattern with shared config", async () => {
  const originalFetch = globalThis.fetch;
  let capturedHeaders: Headers | undefined;

  try {
    globalThis.fetch = (_input, init?: RequestInit) => {
      capturedHeaders = new Headers(init?.headers);
      return Promise.resolve(new Response(JSON.stringify({ data: "test" })));
    };

    // Create API client with defaults - returns Result by default
    const api = tidyfetch.create({
      baseURL: "https://api.example.com",
      headers: {
        "X-API-Key": "secret-key",
        "User-Agent": "MyApp/1.0",
      },
      timeout: 5000,
    });

    const result = await api({ url: "/users" });

    expect(result.ok).toBe(true);
    expect(capturedHeaders?.get("x-api-key")).toBe("secret-key");
    expect(capturedHeaders?.get("user-agent")).toBe("MyApp/1.0");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("Example: Request interceptor for auth", async () => {
  const originalFetch = globalThis.fetch;
  let capturedHeaders: Headers | undefined;

  try {
    globalThis.fetch = (_input, init?: RequestInit) => {
      capturedHeaders = new Headers(init?.headers);
      return Promise.resolve(
        new Response(JSON.stringify({ authorized: true })),
      );
    };

    await tidyfetch({
      url: "https://api.example.com/protected",
      onRequest({ options }) {
        // Add auth token dynamically
        if (!options.headers) {
          options.headers = new Headers();
        }
        if (options.headers instanceof Headers) {
          options.headers.set("Authorization", "Bearer dynamic-token");
        }
      },
    });

    expect(capturedHeaders?.get("authorization")).toBe("Bearer dynamic-token");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("Example: Query parameters", async () => {
  const originalFetch = globalThis.fetch;
  let capturedURL = "";

  try {
    globalThis.fetch = (input: RequestInfo | URL) => {
      capturedURL = typeof input === "string" ? input : input.toString();
      return Promise.resolve(new Response(JSON.stringify({ results: [] })));
    };

    await tidyfetch({
      url: "https://api.example.com/search",
      query: {
        q: "typescript",
        page: 1,
        limit: 20,
      },
    });

    expect(capturedURL).toBe(
      "https://api.example.com/search?q=typescript&page=1&limit=20",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("Example: TypeScript type safety with generics", async () => {
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = () =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            id: 42,
            username: "alice_dev",
            email: "alice@example.com",
            createdAt: "2024-01-01",
          }),
        ),
      );

    // Define your response type
    interface User {
      id: number;
      username: string;
      email: string;
      createdAt: string;
    }

    // Use generic type for full autocompletion and type checking
    const result = await tidyfetch<User>({
      url: "https://api.example.com/user/42",
    });

    // TypeScript knows all properties and their types
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe(42);
      expect(result.value.username).toBe("alice_dev");
      expect(result.value.email).toBe("alice@example.com");
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("Example: Handling errors with Result pattern", async () => {
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = () =>
      Promise.resolve(
        new Response(JSON.stringify({ error: "Not Found" }), { status: 404 }),
      );

    const result = await tidyfetch({ url: "https://api.example.com/missing" });

    // Check if request failed
    expect(result.ok).toBe(false);
    if (!result.ok) {
      // Access the typed error
      expect(result.error).toBeInstanceOf(HTTPError);
      expect(result.error.name).toBe("HTTPError");
      if (result.error instanceof HTTPError) {
        expect(result.error.statusCode).toBe(404);
      }
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});
