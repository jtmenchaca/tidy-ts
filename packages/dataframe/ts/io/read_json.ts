// JSON reading with Zod schema validation and type inference

import type { z, ZodTypeAny } from "zod";
import { readTextFile } from "@tidy-ts/shims";
import { createDataFrame, type DataFrame } from "../dataframe/index.ts";

/**
 * Detects if input is a file path or raw JSON content
 */
function isFilePath(input: string): boolean {
  // Check if it starts with JSON-like content
  const trimmed = input.trim();
  if (
    trimmed.startsWith("{") || trimmed.startsWith("[") ||
    trimmed.startsWith('"')
  ) {
    return false;
  }

  // Check for file-like patterns (has extension, doesn't contain JSON content, etc.)
  return !input.includes("\n") && (input.includes(".") || input.length < 100);
}

/**
 * Read JSON from a file or parse a JSON string with Zod schema validation.
 *
 * Accepts either a file path or raw JSON content string. Validates the data against
 * a Zod schema. For array schemas containing objects, automatically returns a DataFrame.
 * For other schemas, returns the validated data with inferred types.
 *
 * @param pathOrContent - File path to JSON file (Node.js/Deno) or raw JSON content string
 * @param schema - Zod schema for validation and type inference. Can be any Zod type:
 *   - `z.object({...})`: Returns a validated object
 *   - `z.array(z.object({...}))`: Returns a DataFrame with typed rows
 *   - Other Zod types: Returns validated data with inferred type
 *
 * @returns For array of objects, returns a DataFrame. For other types, returns the
 *   validated data with schema-inferred type.
 *
 * @example
 * // Read from file
 * import { z } from "zod";
 *
 * const ConfigSchema = z.object({
 *   apiUrl: z.string().url(),
 *   timeout: z.number().positive(),
 *   retries: z.number().int().min(0),
 * });
 *
 * const config = await readJSON("./config.json", ConfigSchema);
 *
 * @example
 * // Parse JSON string directly
 * const jsonString = '[{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]';
 * const UserSchema = z.array(z.object({
 *   name: z.string(),
 *   age: z.number(),
 * }));
 *
 * const df = await readJSON(jsonString, UserSchema);
 * // Returns DataFrame<{name: string, age: number}>
 *
 * @example
 * // Parse API response
 * const response = await fetch("https://api.example.com/users");
 * const jsonString = await response.text();
 * const df = await readJSON(jsonString, UserSchema);
 *
 * @example
 * // Read an array of objects as a DataFrame from file
 * const UserSchema = z.array(z.object({
 *   id: z.number(),
 *   name: z.string(),
 *   email: z.string().email(),
 *   age: z.number().optional(),
 * }));
 *
 * const users = await readJSON("./users.json", UserSchema);
 * // Returns DataFrame<{id: number, name: string, email: string, age?: number}>
 */
export async function readJSON<T extends ZodTypeAny>(
  pathOrContent: string,
  schema: T,
): Promise<
  z.infer<T> extends Array<infer U>
    ? (U extends Record<string, unknown> ? DataFrame<U> : never)
    : z.infer<T>
> {
  let rawContent: string;

  if (isFilePath(pathOrContent)) {
    // It's a file path - read from file
    rawContent = await readTextFile(pathOrContent);
  } else {
    // It's raw JSON content
    rawContent = pathOrContent;
  }

  // Parse JSON
  const data = JSON.parse(rawContent);

  // Validate with schema
  const result = schema.safeParse(data);

  if (!result.success) {
    throw new Error(`JSON validation failed: ${result.error.message}`);
  }

  // If the result is an array of objects, convert to DataFrame
  if (
    Array.isArray(result.data) && result.data.length > 0 &&
    typeof result.data[0] === "object"
  ) {
    // deno-lint-ignore no-explicit-any
    return createDataFrame(result.data) as any;
  }
  // deno-lint-ignore no-explicit-any
  return result.data as any;
}
