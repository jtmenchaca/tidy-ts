/**
 * Custom error types for cross-runtime shims
 */

/**
 * Error thrown when a required API is not available in the current runtime
 */
export class UnavailableAPIError extends Error {
  constructor(api: string, runtime: string) {
    super(
      `${api} is not available in ${runtime}. This API requires a compatible runtime environment.`,
    );
    this.name = "UnavailableAPIError";
  }
}

/**
 * Error thrown when an unsupported runtime is detected
 */
export class UnsupportedRuntimeError extends Error {
  constructor(runtime: string, supported: string[]) {
    super(
      `Unsupported runtime: ${runtime}. Supported runtimes: ${
        supported.join(", ")
      }`,
    );
    this.name = "UnsupportedRuntimeError";
  }
}
