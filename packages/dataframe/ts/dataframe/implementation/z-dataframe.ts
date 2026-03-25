import { z } from "zod";
import type { DataFrame } from "../types/dataframe.type.ts";
import { createDataFrame } from "./create-dataframe.ts";

export type ZodDataFrame<T extends Record<string, unknown>> = z.ZodType<
  DataFrame<T>,
  DataFrame<T> | Record<string, unknown[]>
>;

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
export function zDataFrame<T extends z.ZodRawShape>(
  shape: T,
): ZodDataFrame<{ [K in keyof T]: z.infer<T[K]> }> {
  type Row = { [K in keyof T]: z.infer<T[K]> };

  const columnarShape = Object.fromEntries(
    Object.entries(shape).map(([key, s]) => [key, z.array(s)]),
  ) as { [K in keyof T]: z.ZodArray<T[K]> };

  const fromColumnar = z.object(columnarShape).transform((columns, ctx) => {
    try {
      return createDataFrame({
        columns: columns as Record<string, readonly unknown[]>,
      }) as unknown as DataFrame<Row>;
    } catch (error: unknown) {
      ctx.addIssue(
        `Failed to create DataFrame: ${
          (error as { message?: string }).message ?? "unknown error"
        }`,
      );
      return z.NEVER;
    }
  });

  // deno-lint-ignore no-explicit-any
  const instance = z.custom<DataFrame<Row>>((val: any) =>
    val != null && typeof val === "object" && typeof val.nrows === "function" &&
    typeof val.columns === "function"
  );

  return z.union([instance, fromColumnar]) as ZodDataFrame<Row>;
}
