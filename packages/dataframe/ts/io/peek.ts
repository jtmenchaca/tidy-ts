/**
 * Peek functions for inspecting file structure
 *
 * These functions return markdown-formatted strings describing the structure
 * of data files, making it easy for AI assistants and developers to understand
 * file contents before reading them.
 */

import { readXLSXMetadata } from "./read_xlsx.ts";
import { readCSVMetadata } from "./read_csv.ts";

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
export async function peekXLSX(
  path: string,
  options: PeekXLSXOptions = {},
): Promise<string> {
  const { previewRows = 5, sheet } = options;

  const metadata = await readXLSXMetadata(path, {
    previewRows,
    sheet,
  });

  const sheetsInfo = metadata.sheets
    .map(
      (s) =>
        `  - **${s.name}** (index: ${s.index})${
          s.name === metadata.defaultSheet ? " ← default" : ""
        }`,
    )
    .join("\n");

  const headersInfo = metadata.headers
    .map((h, i) => `  ${i + 1}. **${h}**`)
    .join("\n");

  const previewTable = metadata.firstRows
    .slice(1) // Skip header row in preview
    .map((row, i) => {
      const cells = row.map((cell) => `"${cell}"`).join(" | ");
      return `  Row ${i + 1}: ${cells}`;
    })
    .join("\n");

  return `# XLSX File Structure

**File:** \`${path}\`
**Type:** Excel Spreadsheet (.xlsx)

## Available Sheets

${sheetsInfo}

## Column Headers (${metadata.headers.length} columns, Sheet: ${metadata.sheetName})

${headersInfo}

## Data Preview

**Total Rows:** ${metadata.totalRows}
**Preview:**

${previewTable}

---

**Usage Tips:**
- If row 0 looks like a note or title (not headers), use \`skip: 1\` when reading
- Use the sheet name or index to read specific sheets: \`readXLSX(path, schema, { sheet: "SheetName" })\`
- Headers are expected in the first non-skipped row

**Example Schema:**
\`\`\`typescript
const schema = z.object({
  ${metadata.headers.map((h) => `${h}: z.string()`).join(",\n  ")}
});
const df = await readXLSX("${path}", schema${
    sheet !== undefined ? `, { sheet: ${JSON.stringify(sheet)} }` : ""
  });
\`\`\`
`;
}

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
export async function peekCSV(
  path: string,
  options: PeekCSVOptions = {},
): Promise<string> {
  const { previewRows = 5, comma } = options;

  // Detect TSV from extension
  const extension = path.toLowerCase().split(".").pop();
  const csvComma = comma || (extension === "tsv" ? "\t" : ",");

  const metadata = await readCSVMetadata(path, {
    previewRows,
    comma: csvComma,
  });

  const headersInfo = metadata.headers
    .map((h, i) => `  ${i + 1}. **${h}**`)
    .join("\n");

  const previewTable = metadata.firstRows
    .map((row, i) => {
      const cells = row.map((cell) => `"${cell}"`).join(" | ");
      return `  Row ${i + 1}: ${cells}`;
    })
    .join("\n");

  return `# CSV File Structure

**File:** \`${path}\`
**Type:** Comma-Separated Values (.csv)
**Delimiter:** \`${csvComma === "\t" ? "\\t (tab)" : csvComma}\`

## Column Headers (${metadata.headers.length} columns)

${headersInfo}

## Data Preview

**Total Rows:** ${metadata.totalRows}
**Preview:**

${previewTable}

---

**Usage Tips:**
- Define a Zod schema matching the column headers
- Use appropriate types (z.string(), z.number(), z.date(), etc.)
- Use .optional() for columns that may have missing values
- Use .nullable() for columns that may have explicit null values

**Example Schema:**
\`\`\`typescript
const schema = z.object({
  ${metadata.headers.map((h) => `${h}: z.string()`).join(",\n  ")}
});
const df = await readCSV("${path}", schema);
\`\`\`
`;
}

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
export function peek(
  path: string,
  options: PeekXLSXOptions & PeekCSVOptions = {},
): Promise<string> {
  const extension = path.toLowerCase().split(".").pop();

  if (extension === "xlsx" || extension === "xls") {
    return peekXLSX(path, options);
  } else if (extension === "csv" || extension === "tsv") {
    return peekCSV(path, options);
  } else {
    return `## Unsupported File Type

File extension ".${extension}" is not supported.

Supported formats:
- CSV (.csv)
- TSV (.tsv)
- Excel (.xlsx, .xls)`;
  }
}
