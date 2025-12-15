/**
 * @module result
 *
 * Type-safe Result pattern for explicit error handling.
 *
 * The Result type provides a way to handle errors without exceptions,
 * making error handling explicit and type-safe. Functions that can fail
 * return `Result<T, E>` instead of throwing exceptions.
 *
 * @example Basic usage
 * ```ts
 * import { ok, err, type Result } from "@tidy-ts/shims";
 *
 * function divide(a: number, b: number): Result<number, string> {
 *   if (b === 0) return err("Division by zero");
 *   return ok(a / b);
 * }
 *
 * const result = divide(10, 2);
 * if (result.ok) {
 *   console.log(result.value); // 5
 * } else {
 *   console.error(result.error);
 * }
 * ```
 *
 * @example Custom error types with defineError
 * ```ts
 * import { defineError, type AppError } from "@tidy-ts/shims";
 *
 * const ValidationError = defineError(
 *   "ValidationError",
 *   ({ field, message }: { field: string; message: string }) =>
 *     `Validation failed for ${field}: ${message}`
 * );
 *
 * type ValidationError = AppError<"ValidationError", { field: string; message: string }>;
 *
 * const error = new ValidationError({ field: "email", message: "Invalid format" });
 * console.log(error.name);  // "ValidationError"
 * console.log(error.field); // "email"
 * ```
 */

// ============================================================================
// Result Type System
// ============================================================================

/**
 * Result type for explicit error handling.
 * Either a successful value or an error, never both.
 *
 * @example
 * ```ts
 * const result: Result<User, Error> = await fetchUser(1);
 *
 * if (result.ok) {
 *   // TypeScript knows result.value is User
 *   console.log(result.value.name);
 * } else {
 *   // TypeScript knows result.error is Error
 *   console.error(result.error.message);
 * }
 * ```
 */
export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

/**
 * Create a successful Result.
 *
 * @example
 * ```ts
 * const success = ok(42);
 * // success.ok === true
 * // success.value === 42
 * ```
 */
export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

/**
 * Create an error Result.
 *
 * @example
 * ```ts
 * const failure = err(new Error("Something went wrong"));
 * // failure.ok === false
 * // failure.error.message === "Something went wrong"
 * ```
 */
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

// ============================================================================
// Error Type System
// ============================================================================

/**
 * Helper type for custom errors with additional properties.
 * Used with `defineError` to create typed error classes.
 *
 * @example
 * ```ts
 * type MyError = AppError<"MyError", { code: number }>;
 * // MyError extends Error with name: "MyError" and code: number
 * ```
 */
export type AppError<ErrorName extends string, Extra = object> =
  & Error
  & Extra
  & { name: ErrorName };

/**
 * Factory function to create custom error classes with type-safe properties.
 *
 * Creates an error class that:
 * - Extends Error with proper prototype chain
 * - Has a fixed `name` property
 * - Has additional typed properties from the `Extra` type
 *
 * @param name - The error name (becomes `error.name`)
 * @param messageTemplate - Function that generates error message from extra properties
 * @returns Constructor for the custom error class
 *
 * @example
 * ```ts
 * const NotFoundError = defineError(
 *   "NotFoundError",
 *   ({ resource, id }: { resource: string; id: string }) =>
 *     `${resource} with id ${id} not found`
 * );
 *
 * const error = new NotFoundError({ resource: "User", id: "123" });
 * console.log(error.name);     // "NotFoundError"
 * console.log(error.resource); // "User"
 * console.log(error.id);       // "123"
 * console.log(error.message);  // "User with id 123 not found"
 * ```
 */
export function defineError<
  ErrorName extends string,
  Extra extends object = object,
>(
  name: ErrorName,
  messageTemplate: (extra: Extra) => string,
): { new (extra: Extra): AppError<ErrorName, Extra> } {
  class CustomError extends Error {
    constructor(extra: Extra) {
      super(messageTemplate(extra));
      Object.setPrototypeOf(this, new.target.prototype);
      this.name = name;
      Object.assign(this, extra);
    }
  }
  return CustomError as unknown as {
    new (extra: Extra): AppError<ErrorName, Extra>;
  };
}

// ============================================================================
// Async Utilities
// ============================================================================

/**
 * Wrap an async operation in a Result, catching any thrown errors.
 *
 * Requires an error mapper to transform caught exceptions into typed errors.
 * This ensures explicit error handling consistent with tidy-ts patterns.
 *
 * @param fn - Async function to execute
 * @param mapError - Function to transform caught errors into typed errors
 * @returns Promise resolving to Result with the value or mapped error
 *
 * @example Database query
 * ```ts
 * import { tryAsync, defineError, type AppError } from "@tidy-ts/shims";
 *
 * const DatabaseError = defineError(
 *   "DatabaseError",
 *   ({ query, cause }: { query: string; cause: string }) =>
 *     `Query failed: ${cause} [${query}]`
 * );
 * type DatabaseError = AppError<"DatabaseError", { query: string; cause: string }>;
 *
 * const query = "SELECT * FROM users";
 * const result = await tryAsync({
 *   fn: () => db.query(query),
 *   mapError: (e) => new DatabaseError({
 *     query,
 *     cause: e instanceof Error ? e.message : String(e)
 *   })
 * });
 *
 * if (!result.ok) {
 *   console.error(result.error.query); // typed access to query
 * }
 * ```
 *
 * @example File operations
 * ```ts
 * const FileError = defineError(
 *   "FileError",
 *   ({ path, operation }: { path: string; operation: string }) =>
 *     `File ${operation} failed: ${path}`
 * );
 * type FileError = AppError<"FileError", { path: string; operation: string }>;
 *
 * const path = "config.json";
 * const result = await tryAsync({
 *   fn: () => Deno.readTextFile(path),
 *   mapError: () => new FileError({ path, operation: "read" })
 * });
 * ```
 */
export async function tryAsync<T, E>({
  fn,
  mapError,
}: {
  fn: () => Promise<T>;
  mapError: (error: unknown) => E;
}): Promise<Result<T, E>> {
  try {
    const value = await fn();
    return ok(value);
  } catch (error) {
    return err(mapError(error));
  }
}
