import { z } from "zod";
import { type CSVOptions } from "./csv-parser.ts";
import { type DataFrame } from "../dataframe/index.ts";
import type { NAOpts } from "./types.ts";
export type CsvOptions = CSVOptions;
/**
 * Read a CSV file or parse CSV content with Zod schema validation and type inference
 *
 * @param pathOrContent - File path (Node.js/Deno), ArrayBuffer/File/Blob (all environments including browsers), or raw CSV content string
 * @param schema - Zod schema for type validation and conversion
 * @param opts - Options for reading/parsing
 * @returns A properly typed DataFrame based on the Zod schema
 *
 * @example
 * ```ts
 * import { z } from "zod";
 *
 * const schema = z.object({
 *   id: z.number().int(),
 *   name: z.string().min(1),
 *   email: z.string().email(),
 *   age: z.number().optional(),
 * });
 *
 * // Read from file path (Node.js/Deno)
 * const df1 = await readCSV("./data.csv", schema);
 *
 * // Parse from raw CSV content string
 * const csvContent = "id,name,email,age\\n1,Alice,alice@example.com,25\\n2,Bob,bob@example.com,30";
 * const df2 = await readCSV(csvContent, schema);
 *
 * // Read from ArrayBuffer (browser-compatible)
 * const fileInput = document.querySelector('input[type="file"]');
 * const file = fileInput.files[0];
 * const arrayBuffer = await file.arrayBuffer();
 * const df3 = await readCSV(arrayBuffer, schema);
 *
 * // Read from File object (browser-compatible)
 * const df4 = await readCSV(file, schema);
 *
 * // All are typed as DataFrame<z.output<typeof schema>>
 * ```
 */
export declare const readCSV: {
    (pathOrContent: string | ArrayBuffer | File | Blob, opts: CsvOptions & NAOpts & {
        no_types: true;
    }): Promise<DataFrame<any>>;
    <S extends z.ZodObject<any>>(pathOrContent: string | ArrayBuffer | File | Blob, schema: S, opts: CsvOptions & NAOpts & {
        no_types: true;
    }): Promise<DataFrame<any>>;
    <S extends z.ZodObject<any>>(pathOrContent: string | ArrayBuffer | File | Blob, schema: S, opts?: CsvOptions & NAOpts): Promise<DataFrame<z.infer<S>>>;
};
/**
 * Read metadata about a CSV file without full parsing
 *
 * Useful for inspecting file structure before deciding how to read it.
 * Shows column headers and a preview of the first few rows.
 *
 * @param pathOrContent - Either a file path to read from, or raw CSV content
 * @param previewRows - Number of rows to preview (default: 5)
 * @param opts - CSV parsing options (delimiter, quote character, etc.)
 * @returns Metadata object with headers and row preview
 *
 * @example
 * ```ts
 * const meta = await readCSVMetadata("./data.csv");
 * console.log("Columns:", meta.headers);
 * console.log("Preview:", meta.preview);
 *
 * // Then read with appropriate schema
 * const schema = z.object({
 *   id: z.number(),
 *   name: z.string(),
 *   // ... based on headers from metadata
 * });
 * const df = await readCSV("./data.csv", schema);
 * ```
 */
export declare const readCSVMetadata: (pathOrContent: string | ArrayBuffer | File | Blob, options?: {
    previewRows?: number;
    comma?: string;
}) => Promise<{
    headers: string[];
    totalRows: number;
    firstRows: string[][];
    delimiter: string;
}>;
