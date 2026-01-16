/**
 * Tests for Result utilities: tryAsync
 */

import { expect } from "@std/expect";
import { type AppError, defineError, tryAsync } from "./result.ts";

// ============================================================================
// Common Error Types for Tests
// ============================================================================

const TestError = defineError(
  "TestError",
  ({ cause }: { cause: string }) => `Test error: ${cause}`,
);
type TestError = AppError<"TestError", { cause: string }>;

const toTestError = (e: unknown): TestError =>
  new TestError({ cause: e instanceof Error ? e.message : String(e) });

// ============================================================================
// tryAsync Tests
// ============================================================================

Deno.test("tryAsync - returns ok result for successful async operation", async () => {
  const result = await tryAsync({
    fn: () => Promise.resolve({ data: "test" }),
    mapError: toTestError,
  });

  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.value).toEqual({ data: "test" });
  }
});

Deno.test("tryAsync - returns err result for rejected promise", async () => {
  const result = await tryAsync({
    fn: () => Promise.reject(new Error("async failure")),
    mapError: toTestError,
  });

  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error.name).toBe("TestError");
    expect(result.error.cause).toBe("async failure");
  }
});

Deno.test("tryAsync - handles thrown errors in fn", async () => {
  const result = await tryAsync({
    fn: () => {
      throw new Error("thrown error");
    },
    mapError: toTestError,
  });

  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error.cause).toBe("thrown error");
  }
});

Deno.test("tryAsync - handles non-Error rejections", async () => {
  const result = await tryAsync({
    fn: () => Promise.reject("string rejection"),
    mapError: toTestError,
  });

  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error.name).toBe("TestError");
    expect(result.error.cause).toBe("string rejection");
  }
});

Deno.test("tryAsync - uses custom error mapper with context", async () => {
  const FetchError = defineError(
    "FetchError",
    ({ url, cause }: { url: string; cause: string }) =>
      `Fetch failed for ${url}: ${cause}`,
  );
  type FetchError = AppError<"FetchError", { url: string; cause: string }>;

  const url = "https://example.com/api";
  const result = await tryAsync({
    fn: () => Promise.reject(new Error("Network error")),
    mapError: (e) =>
      new FetchError({
        url,
        cause: e instanceof Error ? e.message : String(e),
      }),
  });

  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error.name).toBe("FetchError");
    expect(result.error.url).toBe(url);
    expect(result.error.cause).toBe("Network error");
  }
});

Deno.test("tryAsync - mapper receives original error type", async () => {
  let capturedError: unknown;

  const result = await tryAsync({
    fn: () => Promise.reject(new TypeError("type error")),
    mapError: (e) => {
      capturedError = e;
      return new TestError({ cause: "mapped" });
    },
  });

  expect(result.ok).toBe(false);
  expect(capturedError).toBeInstanceOf(TypeError);
});

// ============================================================================
// Real-world Usage Patterns
// ============================================================================

Deno.test("tryAsync - database query pattern", async () => {
  const DatabaseError = defineError(
    "DatabaseError",
    ({ query, cause }: { query: string; cause: string }) =>
      `Query failed [${query}]: ${cause}`,
  );
  type DatabaseError = AppError<
    "DatabaseError",
    { query: string; cause: string }
  >;

  // Simulate a database client
  const db = {
    query: (sql: string) => {
      if (sql.includes("invalid")) {
        return Promise.reject(new Error("SQL syntax error"));
      }
      return Promise.resolve([{ id: 1, name: "User" }]);
    },
  };

  const makeQuery = (sql: string) =>
    tryAsync({
      fn: () => db.query(sql),
      mapError: (e) =>
        new DatabaseError({
          query: sql,
          cause: e instanceof Error ? e.message : String(e),
        }),
    });

  // Successful query
  const goodResult = await makeQuery("SELECT * FROM users");
  expect(goodResult.ok).toBe(true);
  if (goodResult.ok) {
    expect(goodResult.value).toEqual([{ id: 1, name: "User" }]);
  }

  // Failed query - error has typed context
  const badResult = await makeQuery("invalid sql");
  expect(badResult.ok).toBe(false);
  if (!badResult.ok) {
    expect(badResult.error.name).toBe("DatabaseError");
    expect(badResult.error.query).toBe("invalid sql");
    expect(badResult.error.cause).toBe("SQL syntax error");
  }
});

Deno.test("tryAsync - file operation pattern", async () => {
  const FileError = defineError(
    "FileError",
    ({ path, operation }: { path: string; operation: string }) =>
      `File ${operation} failed: ${path}`,
  );
  type FileError = AppError<"FileError", { path: string; operation: string }>;

  const path = "/non/existent/file.txt";
  const result = await tryAsync({
    fn: () => Deno.readTextFile(path),
    mapError: () => new FileError({ path, operation: "read" }),
  });

  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error.name).toBe("FileError");
    expect(result.error.path).toBe(path);
    expect(result.error.operation).toBe("read");
  }
});
