import type { DataFrame } from "../../dataframe/index.ts";
import type { Frequency } from "./downsample.types.ts";

/**
 * Fill method for upsampling.
 * - "forward": Carry forward the last known value (forward fill)
 * - "backward": Use the next known value (backward fill)
 */
export type FillMethod = "forward" | "backward";

/**
 * Upsample arguments with time column and fill method.
 *
 * @template Row - The row type of the DataFrame
 * @template TimeCol - The time column name (must be keyof Row)
 */
export type UpsampleArgs<
  Row extends Record<string, unknown>,
  TimeCol extends keyof Row,
> = {
  timeColumn: TimeCol;
  frequency: Frequency;
  fillMethod: FillMethod;
  startDate?: Date;
  endDate?: Date;
};

/**
 * Method signature for upsample on DataFrame.
 */
export type UpsampleMethod<Row extends object> = <
  TimeCol extends keyof Row,
>(
  args: UpsampleArgs<Row & Record<string, unknown>, TimeCol>,
  // deno-lint-ignore no-explicit-any
) => DataFrame<any>;
