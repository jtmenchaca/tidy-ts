import { z } from "zod";
import type { DataFrame } from "../types/dataframe.type.ts";
export type ZodDataFrame<T extends Record<string, unknown>> = z.ZodType<DataFrame<T>, DataFrame<T> | Record<string, unknown[]>>;
/**
 * Creates a Zod schema that parses columnar data into a typed DataFrame.
 * Follows the temporal-validator pattern: accepts either an existing DataFrame
 * (passthrough) or columnar data (validated + transformed).
 *
 * Usage:
 *   const schema = zDataFrame({ x: z.number(), y: z.string() });
 *   const df = schema.parse({ x: [1, 2], y: ["a", "b"] });
 *   // df is DataFrame<{ x: number; y: string }>
 */
export declare function zDataFrame<T extends z.ZodRawShape>(shape: T): ZodDataFrame<{
    [K in keyof T]: z.infer<T[K]>;
}>;
