import type { DocEntry } from "../mcp-types.ts";

export const resultDocs: Record<string, DocEntry> = {
  Result: {
    name: "Result",
    category: "shims",
    signature:
      "type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }",
    description:
      "Type-safe Result pattern for explicit error handling. Either a successful value or an error, never both. Functions that can fail return Result<T, E> instead of throwing exceptions, making error handling explicit and type-safe.",
    imports: [
      'import { type Result } from "@tidy-ts/shims";',
    ],
    parameters: [
      "T: Type of the success value",
      "E: Type of the error",
    ],
    returns:
      "Discriminated union with ok boolean, value on success, error on failure",
    examples: [
      '// Basic Result handling\nimport { type Result } from "@tidy-ts/shims";\n\nconst result: Result<User, Error> = await fetchUser(1);\n\nif (result.ok) {\n  // TypeScript knows result.value is User\n  console.log(result.value.name);\n} else {\n  // TypeScript knows result.error is Error\n  console.error(result.error.message);\n}',
      "// Type narrowing with Result\nfunction processResult(result: Result<number, string>) {\n  if (result.ok) {\n    return result.value * 2; // value is number\n  }\n  throw new Error(result.error); // error is string\n}",
    ],
    related: ["ok", "err", "tryAsync", "AppError"],
    bestPractices: [
      "✓ GOOD: Use Result for operations that can fail predictably",
      "✓ GOOD: Narrow types with if (result.ok) checks",
      "✓ GOOD: Return typed errors instead of throwing exceptions",
      "✓ GOOD: Use with async operations via tryAsync",
    ],
    antiPatterns: [
      "❌ BAD: Using Result for operations that should never fail",
      "❌ BAD: Throwing inside Result-returning functions",
    ],
  },

  ok: {
    name: "ok",
    category: "shims",
    signature: "ok<T>(value: T): Result<T, never>",
    description:
      "Create a successful Result. The returned Result has ok: true and contains the value. The error type is 'never' indicating this Result cannot be an error.",
    imports: [
      'import { ok } from "@tidy-ts/shims";',
    ],
    parameters: [
      "value: The success value to wrap",
    ],
    returns: "Result<T, never> - A successful Result containing the value",
    examples: [
      '// Create success Result\nimport { ok, type Result } from "@tidy-ts/shims";\n\nconst success = ok(42);\n// success.ok === true\n// success.value === 42',
      '// Return from function\nfunction divide(a: number, b: number): Result<number, string> {\n  if (b === 0) return err("Division by zero");\n  return ok(a / b);\n}\n\nconst result = divide(10, 2);\nif (result.ok) {\n  console.log(result.value); // 5\n}',
    ],
    related: ["err", "Result"],
    bestPractices: [
      "✓ GOOD: Use ok() for successful return values",
      "✓ GOOD: Combine with err() for complete Result handling",
    ],
  },

  err: {
    name: "err",
    category: "shims",
    signature: "err<E>(error: E): Result<never, E>",
    description:
      "Create an error Result. The returned Result has ok: false and contains the error. The value type is 'never' indicating this Result cannot be a success.",
    imports: [
      'import { err } from "@tidy-ts/shims";',
    ],
    parameters: [
      "error: The error value to wrap",
    ],
    returns: "Result<never, E> - An error Result containing the error",
    examples: [
      '// Create error Result\nimport { err, type Result } from "@tidy-ts/shims";\n\nconst failure = err(new Error("Something went wrong"));\n// failure.ok === false\n// failure.error.message === "Something went wrong"',
      "// Return from function\nfunction parseNumber(str: string): Result<number, string> {\n  const num = parseInt(str, 10);\n  if (isNaN(num)) return err(`Invalid number: ${str}`);\n  return ok(num);\n}",
    ],
    related: ["ok", "Result"],
    bestPractices: [
      "✓ GOOD: Use err() for error return values",
      "✓ GOOD: Use typed errors for better error handling",
    ],
  },

  tryAsync: {
    name: "tryAsync",
    category: "shims",
    signature: "tryAsync<T, E>({ fn, mapError }): Promise<Result<T, E>>",
    description:
      "Wrap an async operation in a Result, catching any thrown errors. Requires an error mapper to transform caught exceptions into typed errors. This ensures explicit error handling consistent with tidy-ts patterns.",
    imports: [
      'import { tryAsync } from "@tidy-ts/shims";',
    ],
    parameters: [
      "fn: Async function to execute (returns Promise<T>)",
      "mapError: Function to transform caught errors into typed errors (error: unknown) => E",
    ],
    returns: "Promise<Result<T, E>> - Result with value or mapped error",
    examples: [
      '// Database query with typed error\nimport { tryAsync, defineError, type AppError } from "@tidy-ts/shims";\n\nconst DatabaseError = defineError(\n  "DatabaseError",\n  ({ query, cause }: { query: string; cause: string }) =>\n    `Query failed: ${cause} [${query}]`\n);\ntype DatabaseError = AppError<"DatabaseError", { query: string; cause: string }>;\n\nconst query = "SELECT * FROM users";\nconst result = await tryAsync({\n  fn: () => db.query(query),\n  mapError: (e) => new DatabaseError({\n    query,\n    cause: e instanceof Error ? e.message : String(e)\n  })\n});\n\nif (!result.ok) {\n  console.error(result.error.query); // typed access\n}',
      '// File operations\nconst FileError = defineError(\n  "FileError",\n  ({ path, operation }: { path: string; operation: string }) =>\n    `File ${operation} failed: ${path}`\n);\n\nconst path = "config.json";\nconst result = await tryAsync({\n  fn: () => Deno.readTextFile(path),\n  mapError: () => new FileError({ path, operation: "read" })\n});',
    ],
    related: ["Result", "ok", "err", "defineError"],
    bestPractices: [
      "✓ GOOD: Always provide a mapError function for explicit error typing",
      "✓ GOOD: Use with async operations that might throw",
      "✓ GOOD: Create custom error types with defineError for better error context",
    ],
    antiPatterns: [
      "❌ BAD: Returning the raw caught error without mapping",
    ],
  },

  defineError: {
    name: "defineError",
    category: "shims",
    signature:
      "defineError<ErrorName, Extra>(name: ErrorName, messageTemplate: (extra: Extra) => string): { new (extra: Extra): AppError<ErrorName, Extra> }",
    description:
      "Factory function to create custom error classes with type-safe properties. Creates an error class that extends Error with proper prototype chain, has a fixed name property, and has additional typed properties from the Extra type.",
    imports: [
      'import { defineError, type AppError } from "@tidy-ts/shims";',
    ],
    parameters: [
      "name: The error name (becomes error.name)",
      "messageTemplate: Function that generates error message from extra properties",
    ],
    returns: "Constructor for the custom error class",
    examples: [
      '// Define custom error\nimport { defineError, type AppError } from "@tidy-ts/shims";\n\nconst NotFoundError = defineError(\n  "NotFoundError",\n  ({ resource, id }: { resource: string; id: string }) =>\n    `${resource} with id ${id} not found`\n);\ntype NotFoundError = AppError<"NotFoundError", { resource: string; id: string }>;\n\nconst error = new NotFoundError({ resource: "User", id: "123" });\nconsole.log(error.name);     // "NotFoundError"\nconsole.log(error.resource); // "User"\nconsole.log(error.id);       // "123"\nconsole.log(error.message);  // "User with id 123 not found"',
      '// Validation error\nconst ValidationError = defineError(\n  "ValidationError",\n  ({ field, message }: { field: string; message: string }) =>\n    `Validation failed for ${field}: ${message}`\n);\ntype ValidationError = AppError<"ValidationError", { field: string; message: string }>;\n\nconst err = new ValidationError({ field: "email", message: "Invalid format" });\nconsole.log(err.field); // "email"',
    ],
    related: ["AppError", "Result", "tryAsync"],
    bestPractices: [
      "✓ GOOD: Define both class and type with same name for clean usage",
      "✓ GOOD: Include context properties useful for debugging",
      "✓ GOOD: Use descriptive message templates",
    ],
  },

  AppError: {
    name: "AppError",
    category: "shims",
    signature:
      "type AppError<ErrorName extends string, Extra = object> = Error & Extra & { name: ErrorName }",
    description:
      "Helper type for custom errors with additional properties. Used with defineError to create typed error classes. Extends Error with a specific name and extra typed properties.",
    imports: [
      'import { type AppError } from "@tidy-ts/shims";',
    ],
    parameters: [
      "ErrorName: String literal type for the error name",
      "Extra: Object type with additional properties (default: object)",
    ],
    returns: "Type that extends Error with name and extra properties",
    examples: [
      '// Define error type\nimport { defineError, type AppError } from "@tidy-ts/shims";\n\n// Define class\nconst MyError = defineError(\n  "MyError",\n  ({ code }: { code: number }) => `Error code: ${code}`\n);\n\n// Define matching type\ntype MyError = AppError<"MyError", { code: number }>;\n\n// Use in function signatures\nfunction processData(): Result<Data, MyError> {\n  if (invalid) {\n    return err(new MyError({ code: 400 }));\n  }\n  return ok(data);\n}',
    ],
    related: ["defineError", "Result"],
    bestPractices: [
      "✓ GOOD: Define type alias alongside defineError class",
      "✓ GOOD: Use in Result error position for type-safe error handling",
    ],
  },
};
