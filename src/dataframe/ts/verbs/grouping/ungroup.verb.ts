import {
  createDataFrame,
  type DataFrame,
  type GroupedDataFrame,
} from "../../dataframe/index.ts";

/**
 * Remove grouping from a grouped DataFrame, returning a regular DataFrame
 * If the DataFrame is already ungrouped, returns the same DataFrame
 */
export function ungroup<Row extends object>(
  df: DataFrame<Row> | GroupedDataFrame<Row, keyof Row>,
): DataFrame<Row> {
  // If already ungrouped, return as-is
  // deno-lint-ignore no-explicit-any
  if (!(df as any).__groups) {
    return df as DataFrame<Row>;
  }

  // Create a new DataFrame from the existing data without groups
  const data: Row[] = [];
  for (let i = 0; i < df.nrows(); i++) {
    data.push(df[i]);
  }

  return createDataFrame(data) as DataFrame<Row>;
}
