// deno-lint-ignore-file no-explicit-any
import { parquetWriteBuffer, parquetWriteFile, type BasicType } from "hyparquet-writer";
import type { DataFrame, GroupedDataFrame } from "../../dataframe/index.ts";

/**
 * Convert a DataFrame to Parquet column-oriented format for hyparquet-writer
 */
function dataFrameToColumnData<T extends Record<string, unknown>>(
  dataFrame: DataFrame<T>,
): any[] {
  if (dataFrame.nrows() === 0) {
    return [];
  }

  const data = dataFrame.toArray();
  const columns = dataFrame.columns();

  return columns.map((columnName) => {
    const columnData = data.map((row) => row[columnName]);

    // Determine the Parquet type based on the first non-null value
    let type: BasicType = "STRING"; // default

    for (const value of columnData) {
      if (value != null) {
        if (typeof value === "number") {
          type = Number.isInteger(value) ? "INT32" : "DOUBLE";
        } else if (typeof value === "boolean") {
          type = "BOOLEAN";
        } else if (value instanceof Date) {
          type = "TIMESTAMP";
          // Convert dates to milliseconds for Parquet
          const convertedData = columnData.map((val) =>
            val instanceof Date ? val.getTime() : val === null ? null : val
          );
          return {
            name: columnName,
            data: convertedData,
            type,
          };
        } else {
          type = "STRING";
        }
        break;
      }
    }

    return {
      name: columnName,
      data: columnData,
      type,
    };
  });
}

/**
 * Write DataFrame to Parquet file and return the original DataFrame for chaining.
 */

// Grouped overload: preserve grouping type
export function writeParquet<
  Row extends Record<string, unknown>,
  GroupName extends keyof Row,
>(
  filePath: string,
): (df: GroupedDataFrame<Row, GroupName>) => GroupedDataFrame<Row, GroupName>;

// Ungrouped overload
export function writeParquet<Row extends Record<string, unknown>>(
  filePath: string,
): (df: DataFrame<Row>) => DataFrame<Row>;

// Implementation
export function writeParquet<Row extends Record<string, unknown>>(
  filePath: string,
) {
  return (df: DataFrame<Row> | GroupedDataFrame<Row>): any => {
    const columnData = dataFrameToColumnData(df as DataFrame<Row>);

    // Use hyparquet-writer for file writing
    try {
      parquetWriteFile({
        filename: filePath,
        columnData,
      });
    } catch (error) {
      // Browser environment fallback - create ArrayBuffer and trigger download
      if (typeof globalThis !== "undefined" && globalThis.navigator && globalThis.document) {
        const arrayBuffer = parquetWriteBuffer({ columnData });
        const blob = new Blob([arrayBuffer], {
          type: "application/octet-stream",
        });
        const url = URL.createObjectURL(blob);
        const a = globalThis.document.createElement("a");
        a.href = url;
        a.download = filePath.split("/").pop() || "data.parquet";
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

/**
 * Convert DataFrame to Parquet ArrayBuffer
 */
export function toParquetBuffer<Row extends Record<string, unknown>>() {
  return (df: DataFrame<Row>): ArrayBuffer => {
    const columnData = dataFrameToColumnData(df);
    return parquetWriteBuffer({ columnData });
  };
}
