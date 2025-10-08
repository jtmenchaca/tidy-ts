// Import shared types from the main test module
import type { TestSubject, WrappedTestOptions } from "./test.ts";

/**
 * Deno-specific test implementation.
 * This function wraps the cross-runtime test interface around Deno's native test API.
 *
 * @param name - Test name/description
 * @param testFn - The actual test function to execute
 * @param options - Test configuration options
 */
export function wrappedTest(
  name: string,
  testFn: TestSubject,
  options: WrappedTestOptions,
) {
  // @ts-ignore The Deno namespace isn't available in Node or Bun
  // Use Deno's native test API with our cross-runtime interface
  Deno.test({
    name, // Test name
    ignore: options?.skip || false, // Skip test if options.skip is true
    async fn(context) { // Deno provides a context object
      // Store the test function promise for cleanup
      let testFnPromise = undefined;

      // Create a promise that resolves when the done callback is called
      // This allows us to support both sync and async test patterns
      const callbackPromise = new Promise((resolve, reject) => {
        // Execute the test function with Deno's context and our done callback
        testFnPromise = testFn(context, (e) => {
          if (e) reject(e); // If done is called with an error, reject the promise
          else resolve(0); // If done is called without error, resolve the promise
        });
      });

      let timeoutId: number = -1; // Store the timeout ID for cleanup

      try {
        if (options.timeout) {
          // Create a timeout promise that rejects after the specified time
          const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => {
              reject(new Error("Test timed out"));
            }, options.timeout);
          });

          // Race between the test execution and timeout
          await Promise.race([
            options.waitForCallback ? callbackPromise : testFnPromise,
            timeoutPromise,
          ]);
        } else {
          // No timeout - just wait for the test to complete
          await options.waitForCallback ? callbackPromise : testFnPromise;
        }
      } catch (error) {
        // Re-throw any errors (including timeout errors)
        throw error;
      } finally {
        // Cleanup: clear timeout and ensure all promises are settled
        if (timeoutId) clearTimeout(timeoutId);
        await testFnPromise; // Wait for test function to complete
        if (options.waitForCallback) await callbackPromise; // Wait for done callback if needed
      }
    },
  });
}
