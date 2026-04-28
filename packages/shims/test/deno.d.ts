import type { TestSubject, WrappedTestOptions } from "../test.ts";
/**
 * Deno-specific test implementation.
 * This function wraps the cross-runtime test interface around Deno's native test API.
 *
 * @param name - Test name/description
 * @param testFn - The actual test function to execute
 * @param options - Test configuration options
 */
export declare function wrappedTest(name: string, testFn: TestSubject, options?: WrappedTestOptions): Promise<void>;
