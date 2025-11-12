/**
 * Cross-runtime testing framework
 * Provides a unified test API that works across Deno, Bun, and Node.js
 */

import { currentRuntime, Runtime } from "./detect.ts";

/**
 * Test subject function type.
 * This defines the signature that all test functions must follow.
 * The function receives a context object and a done callback for async tests.
 */
export type TestSubject = (
  context: unknown | undefined, // Runtime-specific test context (varies by runtime)
  done: (value?: unknown) => void, // Callback to signal test completion (for async tests)
) => void | Promise<void>; // Can be sync or async

/**
 * Runtime independent test function interface.
 * This is the common interface that all runtime-specific test implementations must follow.
 */
export interface WrappedTest {
  (
    name: string, // Test name/description
    testFn: TestSubject, // The actual test function
    options?: WrappedTestOptions, // Optional test configuration
  ): Promise<void>; // Returns a promise that resolves when test completes
}

/**
 * Runtime independent test options.
 * These options work across all supported runtimes.
 */
export interface WrappedTestOptions {
  timeout?: number; // Timeout duration in milliseconds (optional)
  skip?: boolean; // Whether to skip the test (optional)
  waitForCallback?: boolean; // Whether to wait for the done-callback to be called (for async tests)
}

// Variable to hold the runtime-specific test implementation
let wrappedTestToUse: WrappedTest;

import { UnsupportedRuntimeError } from "./errors.ts";

// Dynamically import the appropriate test implementation based on detected runtime
if (currentRuntime === Runtime.Deno) {
  const { wrappedTest } = await import("./test/deno.ts");
  wrappedTestToUse = wrappedTest;
} else if (currentRuntime === Runtime.Node) {
  const { wrappedTest } = await import("./test/node.ts");
  wrappedTestToUse = wrappedTest;
} else if (currentRuntime === Runtime.Bun) {
  const { wrappedTest } = await import("./test/bun.ts");
  wrappedTestToUse = wrappedTest;
} else {
  throw new UnsupportedRuntimeError(
    currentRuntime,
    [Runtime.Deno, Runtime.Node, Runtime.Bun],
  );
}

/**
 * Defines and executes a single test.
 * This is the main test function that users call - it delegates to the runtime-specific implementation.
 *
 * @param name - The name/description of the test
 * @param testFn - The function containing the test logic (can be simple async function or TestSubject)
 * @param options - Optional test configuration (timeout, skip, etc.)
 */
export async function test(
  name: string,
  testFn: (() => void | Promise<void>) | TestSubject,
  options: WrappedTestOptions = {},
) {
  // If testFn is a simple async function (no parameters), wrap it
  if (testFn.length === 0) {
    const simpleTestFn = testFn as () => void | Promise<void>;
    await wrappedTestToUse(name, async (_, done) => {
      await simpleTestFn();
      done();
    }, options);
  } else {
    // It's already a TestSubject with context/done parameters
    await wrappedTestToUse(name, testFn as TestSubject, options);
  }
}
