// Import Node.js built-in test module for type safety
import { test } from "node:test";
// Import shared types from the main test module
import type { TestSubject, WrappedTestOptions } from "../test.ts";

/**
 * Transform cross-runtime options to Node.js test options.
 * Node.js test API has slightly different option names and structure.
 *
 * @param options - Cross-runtime test options
 * @returns Node.js-specific test options
 */
function transformOptions(options?: WrappedTestOptions) {
  return {
    skip: options?.skip || false, // Map skip option directly
    timeout: options?.timeout, // Map timeout option directly
  };
}

/**
 * Node.js-specific test implementation.
 * This function wraps the cross-runtime test interface around Node.js's native test API.
 *
 * @param name - Test name/description
 * @param testFn - The actual test function to execute
 * @param options - Test configuration options
 */
export function wrappedTest(
  name: string,
  testFn: TestSubject,
  options?: WrappedTestOptions,
): Promise<void> {
  const opts = options ?? {};
  // Use Node.js's native test API with our cross-runtime interface
  return new Promise<void>((resolve, reject) => {
    // Node.js test context type varies, so we use any here
    // deno-lint-ignore no-explicit-any
    test(name, transformOptions(opts), async (context: any) => {
      // Node.js provides a context object with test utilities

      // Store the test function promise for cleanup
      let testFnPromise = undefined;

      // Create a promise that resolves when the done callback is called
      // This allows us to support both sync and async test patterns
      const callbackPromise = new Promise((resolve, reject) => {
        // Execute the test function with Node.js's context and our done callback
        testFnPromise = testFn(context, (e) => {
          if (e) reject(e); // If done is called with an error, reject the promise
          else resolve(0); // If done is called without error, resolve the promise
        });
      });

      try {
        // If the test expects a callback, wait for it to be called
        if (opts.waitForCallback) await callbackPromise;

        // Always wait for the test function to complete
        await testFnPromise;
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}
