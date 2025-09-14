// deno-lint-ignore-file no-explicit-any
import { stringify } from "@std/csv/stringify";
import * as fs from "node:fs";
import type { DataFrame, GroupedDataFrame } from "../../dataframe/index.ts";

/**
 * Convert a DataFrame to CSV string format using @std/csv/stringify
 */
function dataFrameToCSV<T extends Record<string, unknown>>(
  dataFrame: DataFrame<T>,
): string {
  if (dataFrame.nrows() === 0) {
    return "";
  }

  const data = dataFrame.toArray();
  const columns = dataFrame.columns();

  return stringify(data, {
    headers: true,
    columns: columns,
  });
}

/**
 * Write DataFrame to CSV file and return the original DataFrame for chaining.
 */

// Grouped overload: preserve grouping type
export function writeCSV<
  Row extends Record<string, unknown>,
  GroupName extends keyof Row,
>(
  filePath: string,
): (df: GroupedDataFrame<Row, GroupName>) => GroupedDataFrame<Row, GroupName>;

// Ungrouped overload
export function writeCSV<Row extends Record<string, unknown>>(
  filePath: string,
): (df: DataFrame<Row>) => DataFrame<Row>;

// Implementation
export function writeCSV<Row extends Record<string, unknown>>(
  filePath: string,
) {
  return (df: DataFrame<Row> | GroupedDataFrame<Row>): any => {
    const csvString = dataFrameToCSV(df as DataFrame<Row>);

    // Use node:fs for file writing (works in both Node.js and Deno)
    try {
      fs.writeFileSync(filePath, csvString, "utf8");
    } catch (error) {
      // Browser environment fallback - trigger download
      if (typeof globalThis !== "undefined" && globalThis.navigator) {
        const blob = new Blob([csvString], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = globalThis.document.createElement("a");
        a.href = url;
        a.download = filePath.split("/").pop() || "data.csv";
        globalThis.document.body.appendChild(a);
        a.click();
        globalThis.document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        throw new Error(`Failed to write file: ${error}`);
      }
    }

    // Return the same DataFrame for chaining
    return df;
  };
}
