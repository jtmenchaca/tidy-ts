import type { z, ZodTypeAny } from "zod";
import { type DataFrame } from "../dataframe/index.ts";
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
export declare function readJSON<T extends ZodTypeAny>(pathOrContent: string, schema: T): Promise<z.infer<T> extends Array<infer U> ? (U extends Record<string, unknown> ? DataFrame<U> : never) : z.infer<T>>;
