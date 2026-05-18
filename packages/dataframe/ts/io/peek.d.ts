/**
 * Peek functions for inspecting file structure
 *
 * These functions return markdown-formatted strings describing the structure
 * of data files, making it easy for AI assistants and developers to understand
 * file contents before reading them.
 */
interface PeekOptions {
    /** Number of rows to preview (default: 5) */
    previewRows?: number;
}
interface PeekXLSXOptions extends PeekOptions {
    /** Which sheet to preview - name (string) or index (number, 0-based). Defaults to first sheet. */
    sheet?: string | number;
}
interface PeekCSVOptions extends PeekOptions {
    /** Field delimiter/comma character (default: ",") */
    comma?: string;
}
/**
 * Inspect the structure of an XLSX file and return a markdown-formatted description.
 *
 * Returns information about:
 * - Available sheets
 * - Column headers
 * - Preview of first few rows
 * - Example schema for reading
 *
 * @param path - Path to the XLSX file
 * @param options - Options for preview
 * @returns Markdown-formatted string describing the file structure
 *
 * @example
 * ```ts
 * const info = await peekXLSX("./data.xlsx");
 * console.log(info);
 * // # XLSX File Structure
 * // **File:** `./data.xlsx`
 * // ...
 * ```
 */
export declare function peekXLSX(path: string, options?: PeekXLSXOptions): Promise<string>;
/**
 * Inspect the structure of a CSV file and return a markdown-formatted description.
 *
 * Returns information about:
 * - Column headers
 * - Preview of first few rows
 * - Example schema for reading
 *
 * @param path - Path to the CSV file
 * @param options - Options for preview
 * @returns Markdown-formatted string describing the file structure
 *
 * @example
 * ```ts
 * const info = await peekCSV("./data.csv");
 * console.log(info);
 * // # CSV File Structure
 * // **File:** `./data.csv`
 * // ...
 * ```
 */
export declare function peekCSV(path: string, options?: PeekCSVOptions): Promise<string>;
/**
 * Inspect the structure of a data file (CSV or XLSX) and return a markdown-formatted description.
 *
 * Automatically detects file type from extension.
 *
 * @param path - Path to the data file
 * @param options - Options for preview
 * @returns Markdown-formatted string describing the file structure
 *
 * @example
 * ```ts
 * const info = await peek("./data.xlsx");
 * console.log(info);
 * ```
 */
export declare function peek(path: string, options?: PeekXLSXOptions & PeekCSVOptions): Promise<string>;
export {};
