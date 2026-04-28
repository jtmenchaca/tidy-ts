/**
 * Cross-runtime testing framework
 * Provides a unified test API that works across Deno, Bun, and Node.js
 */
/**
 * Test subject function type.
 * This defines the signature that all test functions must follow.
 * The function receives a context object and a done callback for async tests.
 */
export type TestSubject = (context: unknown | undefined, // Runtime-specific test context (varies by runtime)
done: (value?: unknown) => void) => void | Promise<void>;
/**
 * Runtime independent test function interface.
 * This is the common interface that all runtime-specific test implementations must follow.
 */
export interface WrappedTest {
    (name: string, // Test name/description
    testFn: TestSubject, // The actual test function
    options?: WrappedTestOptions): Promise<void>;
}
/**
 * Runtime independent test options.
 * These options work across all supported runtimes.
 */
export interface WrappedTestOptions {
    timeout?: number;
    skip?: boolean;
    waitForCallback?: boolean;
}
/**
 * Defines and executes a single test.
 * This is the main test function that users call - it delegates to the runtime-specific implementation.
 *
 * @param name - The name/description of the test
 * @param testFn - The function containing the test logic (can be simple async function or TestSubject)
 * @param options - Optional test configuration (timeout, skip, etc.)
 */
export declare function test(name: string, testFn: (() => void | Promise<void>) | TestSubject, options?: WrappedTestOptions): Promise<void>;
