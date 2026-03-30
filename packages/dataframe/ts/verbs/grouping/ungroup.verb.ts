import { createDataFrame } from "../../dataframe/index.ts";

/**
 * Remove grouping from a grouped DataFrame, returning a regular DataFrame
 * If the DataFrame is already ungrouped, returns the same DataFrame
 */
export function ungroup(
  df: any,
): any {
  // If already ungrouped, return as-is
  // deno-lint-ignore no-explicit-any
  if (!(df as any).__groups) {
    return df;
  }

  // Create a new DataFrame from the existing data without groups
  const data: any[] = [];
  for (let i = 0; i < df.nrows(); i++) {
    data.push(df[i]);
  }

  return createDataFrame(data);
}
