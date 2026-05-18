import type { DataFrame } from "../dataframe/index.ts";
interface WriteXLSXOpts {
    sheet?: string;
}
/**
 * Write a DataFrame to an XLSX file.
 *
 * Exports DataFrame data to XLSX format using zero external dependencies.
 * Handles strings, numbers, booleans, and dates. Dates are converted to
 * Excel serial numbers. The resulting file can be opened in Excel, LibreOffice, etc.
 *
 * Supports writing to specific sheets. If the file exists, it will be updated
 * with the new sheet data (replacing if the sheet exists, or adding if new).
 *
 * In browser environments, this triggers a file download instead of writing to disk.
 *
 * @param dataFrame - The DataFrame to export
 * @param path - File path where the XLSX file should be written (or filename for browser download)
 * @param opts - Options including sheet name (defaults to "Sheet1")
 *
 * @returns A Promise that resolves when the file is successfully written
 *
 * @example
 * ```ts
 * const df1 = createDataFrame([{ name: "Alice", age: 30 }]);
 * const df2 = createDataFrame([{ product: "Widget", price: 9.99 }]);
 *
 * // Write to Sheet1 (default)
 * await writeXLSX(df1, "./data.xlsx");
 *
 * // Write to a different sheet in the same file
 * await writeXLSX(df2, "./data.xlsx", { sheet: "Products" });
 *
 * // In browser, triggers a download
 * await writeXLSX(df, "report.xlsx");
 * ```
 */
export declare const writeXLSX: <Row extends Record<string, unknown>>(dataFrame: DataFrame<Row>, path: string, opts?: WriteXLSXOpts) => Promise<void>;
export {};
