import type { TidyMcp } from "../../index.ts";
import * as v from "valibot";
import {
  readCSVMetadata,
  readXLSXMetadata,
  // deno-lint-ignore no-import-prefix
} from "jsr:/@tidy-ts/dataframe@^1.0.35/";

export function get_file_structure(server: TidyMcp) {
  const schema = v.object({
    path: v.pipe(
      v.string(),
      v.description("The file path to the CSV or XLSX file"),
    ),
    preview_rows: v.optional(
      v.pipe(
        v.number(),
        v.description("Number of rows to preview (default: 5)"),
      ),
      5,
    ),
    sheet: v.optional(
      v.pipe(
        v.union([v.string(), v.number()]),
        v.description(
          "For XLSX only: Which sheet to preview - name (string) or index (number, 0-based). Defaults to first sheet.",
        ),
      ),
    ),
    comma: v.optional(
      v.pipe(
        v.string(),
        v.description(
          'For CSV only: Field delimiter/comma character (default: ",")',
        ),
      ),
    ),
  });

  type Input = v.InferInput<typeof schema>;

  server.tool(
    {
      name: "tidy-get-file-structure",
      description:
        "Inspect the structure of a CSV or XLSX file without full parsing. Automatically detects file type and shows headers/sheets and a preview of the first few rows. Use this before reading files to understand their structure.",
      // deno-lint-ignore no-explicit-any
      schema: schema as any,
    },
    async ({ path, preview_rows, sheet, comma }: Input) => {
      try {
        // Detect file type from extension
        const extension = path.toLowerCase().split(".").pop();

        if (extension === "xlsx" || extension === "xls") {
          // Handle XLSX files
          const metadata = await readXLSXMetadata(path, {
            previewRows: preview_rows,
            sheet,
          });

          const sheetsInfo = metadata.sheets
            .map(
              (s: { name: string; index: number }) =>
                `  - **${s.name}** (index: ${s.index})${
                  s.name === metadata.defaultSheet ? " ← default" : ""
                }`,
            )
            .join("\n");

          const headersInfo = metadata.headers
            .map((h: string, i: number) => `  ${i + 1}. **${h}**`)
            .join("\n");

          const previewTable = metadata.firstRows
            .slice(1) // Skip header row in preview
            .map((row: string[], i: number) => {
              const cells = row.map((cell: string) => `"${cell}"`).join(
                " | ",
              );
              return `  Row ${i + 1}: ${cells}`;
            })
            .join("\n");

          const output = `# XLSX File Structure

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
  ${
            metadata.headers
              .map((h: string) => `${h}: z.string()`)
              .join(",\n  ")
          }
});
const df = await readXLSX("${path}", schema${
            sheet ? `, { sheet: ${JSON.stringify(sheet)} }` : ""
          });
\`\`\`
`;

          return {
            content: [
              {
                type: "text",
                text: output,
              },
            ],
          };
        } else if (extension === "csv" || extension === "tsv") {
          // Handle CSV files
          const csvComma = comma || (extension === "tsv" ? "\t" : ",");
          const metadata = await readCSVMetadata(path, {
            previewRows: preview_rows,
            comma: csvComma,
          });

          const headersInfo = metadata.headers
            .map((h: string, i: number) => `  ${i + 1}. **${h}**`)
            .join("\n");

          const previewTable = metadata.firstRows
            .map((row: string[], i: number) => {
              const cells = row.map((cell: string) => `"${cell}"`).join(
                " | ",
              );
              return `  Row ${i + 1}: ${cells}`;
            })
            .join("\n");

          const output = `# CSV File Structure

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
  ${
            metadata.headers
              .map((h: string) => `${h}: z.string()`)
              .join(",\n  ")
          }
});
const df = await readCSV("${path}", schema);
\`\`\`
`;

          return {
            content: [
              {
                type: "text",
                text: output,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text:
                  `## Unsupported File Type\n\nFile extension ".${extension}" is not supported.\n\nSupported formats:\n- CSV (.csv)\n- TSV (.tsv)\n- Excel (.xlsx, .xls)`,
              },
            ],
          };
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text:
                `## Error Reading File Structure\n\nCould not read structure from \`${path}\`.\n\nError: ${error}`,
            },
          ],
        };
      }
    },
  );
}
