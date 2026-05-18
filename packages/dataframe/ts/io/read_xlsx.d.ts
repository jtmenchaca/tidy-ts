import { z } from "zod";
import { type DataFrame } from "../dataframe/index.ts";
import type { NAOpts } from "./types.ts";
/**
 * Parse XLSX file and return rows as arrays of values (low-level API)
 *
 * @param pathOrBuffer - File path (Node.js/Deno) or ArrayBuffer/File/Blob (all environments)
 * @param opts - Options including sheet selection
 * @returns Array of rows, where each row is an array of string values
 */
export declare function parseXLSXRaw(pathOrBuffer: string | ArrayBuffer | File | Blob, opts?: {
    sheet?: string | number;
    skip?: number;
}): Promise<string[][]>;
export interface XLSXColumnFormat {
    column: string;
    formatCode: string;
    numFmtId: number;
}
interface ReadXLSXOpts extends NAOpts {
    sheet?: string | number;
    skip?: number;
}
/**
 * Read an XLSX file with Zod schema validation and type inference
 *
 * @param pathOrBuffer - File path (Node.js/Deno) or ArrayBuffer/File/Blob (all environments including browsers)
 * @param schema - Zod schema for type validation and conversion
 * @param opts - Options for parsing (NA values, trim, sheet selection)
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
 * const df = await readXLSX("./data.xlsx", schema);
 *
 * // Read from ArrayBuffer (browser-compatible)
 * const fileInput = document.querySelector('input[type="file"]');
 * const file = fileInput.files[0];
 * const arrayBuffer = await file.arrayBuffer();
 * const df2 = await readXLSX(arrayBuffer, schema);
 *
 * // Read from File object (browser-compatible)
 * const df3 = await readXLSX(file, schema, { sheet: "Sheet2" });
 *
 * // Read from specific sheet by index (0-based)
 * const df4 = await readXLSX("./data.xlsx", schema, { sheet: 1 });
 * ```
 */
export declare const readXLSX: {
    (pathOrBuffer: string | ArrayBuffer | File | Blob, opts: ReadXLSXOpts & {
        no_types: true;
    }): Promise<DataFrame<any>>;
    <S extends z.ZodObject<any>>(pathOrBuffer: string | ArrayBuffer | File | Blob, schema: S, opts: ReadXLSXOpts & {
        no_types: true;
    }): Promise<DataFrame<any>>;
    <S extends z.ZodObject<any>>(pathOrBuffer: string | ArrayBuffer | File | Blob, schema: S, opts?: ReadXLSXOpts): Promise<DataFrame<z.infer<S>>>;
};
/**
 * Read metadata about an XLSX file without full parsing
 *
 * Useful for inspecting file structure before deciding how to read it.
 * Shows available sheets and a preview of the first few rows.
 *
 * @param pathOrBuffer - File path (Node.js/Deno) or ArrayBuffer/File/Blob (all environments including browsers)
 * @param previewRows - Number of rows to preview (default: 5)
 * @param sheet - Which sheet to preview (default: first sheet)
 * @returns Metadata object with sheets list and row preview
 *
 * @example
 * ```ts
 * const meta = await readXLSXMetadata("./data.xlsx");
 * console.log("Available sheets:", meta.sheets);
 * console.log("First rows:", meta.preview.firstRows);
 *
 * // If row 0 looks like a note, use skip: 1
 * const df = await readXLSX("./data.xlsx", schema, { skip: 1 });
 * ```
 */
export declare const readXLSXMetadata: (pathOrBuffer: string | ArrayBuffer | File | Blob, options?: {
    previewRows?: number;
    sheet?: string | number;
}) => Promise<{
    sheets: {
        name: string;
        index: number;
    }[];
    defaultSheet: string;
    sheetName: string;
    headers: string[];
    totalRows: number;
    firstRows: string[][];
    columnFormats: XLSXColumnFormat[];
}>;
export {};
