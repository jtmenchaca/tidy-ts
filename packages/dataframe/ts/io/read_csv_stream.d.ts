import { z } from "zod";
import type { CSVOptions } from "./csv-parser.ts";
import { type DataFrame } from "../dataframe/index.ts";
import type { NAOpts } from "./types.ts";
/**
 * Read a large CSV file using streaming to avoid V8 string length limits
 *
 * @param path - File path to read from
 * @param schema - Zod schema for type validation and conversion
 * @param opts - Options for parsing
 * @returns A properly typed DataFrame based on the Zod schema
 *
 * @example
 * ```ts
 * const schema = z.object({
 *   id: z.number().int(),
 *   name: z.string(),
 * });
 *
 * const df = await readCSVStream("./large-file.csv", schema);
 * ```
 */
export declare function readCSVStream<S extends z.ZodObject<any>>(path: string, schema: S, opts: CSVOptions & NAOpts & {
    no_types: true;
}): Promise<DataFrame<any>>;
export declare function readCSVStream<S extends z.ZodObject<any>>(path: string, schema: S, opts?: CSVOptions & NAOpts): Promise<DataFrame<z.infer<S>>>;
