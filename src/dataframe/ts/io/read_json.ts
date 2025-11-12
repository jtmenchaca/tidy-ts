// JSON reading with Zod schema validation and type inference

import type { z, ZodTypeAny } from "zod";
import { readTextFile } from "@tidy-ts/shims";
import { createDataFrame, type DataFrame } from "../dataframe/index.ts";

/**
 * Read a JSON file with Zod schema validation and type inference.
 *
 * Loads JSON data from a file and validates it against a Zod schema. For array schemas
 * containing objects, automatically returns a DataFrame. For other schemas, returns the
 * validated data with inferred types. Throws an error if validation fails or if the
 * file cannot be read.
 *
 * @param filePath - Path to the JSON file to read (Node.js/Deno only)
 * @param schema - Zod schema for validation and type inference. Can be any Zod type:
 *   - `z.object({...})`: Returns a validated object
 *   - `z.array(z.object({...}))`: Returns a DataFrame with typed rows
 *   - Other Zod types: Returns validated data with inferred type
 *
 * @returns For array of objects, returns a DataFrame. For other types, returns the
 *   validated data with schema-inferred type.
 *
 * @example
 * // Read a simple configuration object
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
 * // Read an array of objects as a DataFrame
 * const UserSchema = z.array(z.object({
 *   id: z.number(),
 *   name: z.string(),
 *   email: z.string().email(),
 *   age: z.number().optional(),
 * }));
 *
 * const users = await readJSON("./users.json", UserSchema);
 * // Returns DataFrame<{id: number, name: string, email: string, age?: number}>
 *
 * @example
 * // With complex nested schema
 * const schema = z.array(z.object({
 *   user: z.object({ id: z.number(), name: z.string() }),
 *   posts: z.array(z.object({ title: z.string(), views: z.number() }))
 * }));
 * const data = await readJSON("./data.json", schema);
 */
export async function readJSON<T extends ZodTypeAny>(
  filePath: string,
  schema: T,
): Promise<
  z.infer<T> extends Array<infer U>
    ? (U extends Record<string, unknown> ? DataFrame<U> : never)
    : z.infer<T>
> {
  // Read the JSON file
  const rawContent = await readTextFile(filePath);

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
