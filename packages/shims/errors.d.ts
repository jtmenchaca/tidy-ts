/**
 * Custom error types for cross-runtime shims
 */
/**
 * Error thrown when a required API is not available in the current runtime
 */
export declare class UnavailableAPIError extends Error {
    constructor(api: string, runtime: string);
}
/**
 * Error thrown when an unsupported runtime is detected
 */
export declare class UnsupportedRuntimeError extends Error {
    constructor(runtime: string, supported: string[]);
}
