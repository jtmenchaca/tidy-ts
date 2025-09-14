// JSON reading with Zod schema validation and type inference

import type { z, ZodTypeAny } from "zod";
import * as fs from "node:fs/promises";
import { createDataFrame, type DataFrame } from "../dataframe/index.ts";

/**
 * Read a JSON file with Zod schema validation and type inference
 *
 * @param filePath - Path to the JSON file
 * @param schema - Zod schema for type validation
 * @returns For array schemas, returns a DataFrame. Otherwise returns the validated data.
 *
 * @example
 * ```ts
 * import { z } from "zod";
 * import { read_json } from "@tidy-ts/dataframe";
 *
 * // For a simple object
 * const ConfigSchema = z.object({
 *   apiUrl: z.string().url(),
 *   timeout: z.number().positive(),
 *   retries: z.number().int().min(0),
 * });
 *
 * const config = await read_json("./config.json", ConfigSchema);
 * // config is typed as z.infer<typeof ConfigSchema>
 *
 * // For an array of objects (returns DataFrame)
 * const UserSchema = z.array(z.object({
 *   id: z.number(),
 *   name: z.string(),
 *   email: z.string().email(),
 *   age: z.number().optional(),
 * }));
 *
 * const users = await read_json("./users.json", UserSchema);
 * // users is typed as DataFrame<{id: number, name: string, ...}>
 * ```
 */
export async function read_json<T extends ZodTypeAny>(
  filePath: string,
  schema: T,
): Promise<
  z.infer<T> extends Array<infer U>
    ? (U extends Record<string, unknown> ? DataFrame<U> : never)
    : z.infer<T>
> {
  // Read the JSON file
  const rawContent = await fs.readFile(filePath, "utf8");

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
