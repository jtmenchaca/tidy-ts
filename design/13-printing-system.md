# Printing System

## Design Goals and Implementation

| Design Goal | Implementation |
|------------|----------------|
| **Readable table output** | Format DataFrame as nicely formatted table. Handles alignment, borders, and spacing. |
| **Handle large DataFrames** | Show first N rows with "..." indicator. Don't try to print millions of rows. |
| **Handle wide DataFrames** | Truncate columns when too wide. Option to transpose for wide tables. |
| **Format different value types** | Handles null, undefined, numbers, strings, dates correctly. Shows them in readable format. |
| **Multiple output formats** | Console output (`print()`), string (`toString()`), markdown (`toMarkdown()`), Node.js inspect. |

## Formatting Features

| Feature | Implementation |
|---------|----------------|
| **Cell values** | Formats null as "null", undefined as empty, numbers with proper precision, dates as ISO strings. |
| **Column width** | Clips long values with ellipsis. Configurable max width. |
| **Row limits** | Shows first N rows (default 20) with "..." if more rows exist. |
| **Column limits** | Can truncate columns when table is too wide. |
| **Transpose option** | Swap rows/columns for wide tables (many columns, few rows). |

## Options

| Option | Purpose |
|--------|---------|
| `maxRows` | Number of rows to display before truncating |
| `maxColWidth` | Maximum column width before clipping |
| `includeRowIndex` | Show row indices in output |
| `transpose` | Swap rows/columns for wide tables |

## Implementation

| Goal | Implementation |
|------|----------------|
| **Efficient formatting** | Uses columnar store directly. Formats cells on-demand during printing. No need to convert to rows first. |
| **Multiple formats** | Same formatting logic, different output targets (console, string, markdown). |
