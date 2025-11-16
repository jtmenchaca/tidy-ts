// deno-lint-ignore-file no-explicit-any
import type { DataFrame, GroupedDataFrame } from "../../dataframe/index.ts";

/**
 * Format a Date in local time (ISO-like format without Z suffix).
 * Shows the date/time as it appears in local timezone.
 */
function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const ms = String(date.getMilliseconds()).padStart(3, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}`;
}

/**
 * Print DataFrame contents to console with optional formatting.
 *
 * Displays a formatted table representation of the DataFrame in the console.
 * Useful for debugging and data inspection. Returns the original DataFrame
 * for chaining. Supports custom formatting options and optional messages.
 *
 * @param messageOrOpts - Optional message to print before the table, or formatting options
 * @param opts - Formatting options (only used if first parameter is a message)
 *   - `maxCols`: Maximum number of columns to display
 *   - `maxWidth`: Maximum width for each column
 *   - `transpose`: Display table transposed (rows as columns)
 *   - `showIndex`: Show row indices
 *   - `colorRows`: Alternate row background colors for better readability
 *
 * @returns The original DataFrame for chaining
 *
 * @example
 * // Simple print
 * df.print()
 *
 * @example
 * // Print with message
 * df.print("User data:")
 *
 * @example
 * // Print with formatting options
 * df.print({ showIndex: true, colorRows: true })
 *
 * @example
 * // Print with message and options
 * df.print("Debug output:", { maxCols: 5, showIndex: true })
 *
 * @example
 * // Chain with other operations
 * df.filter(row => row.age > 18)
 *   .print("Adults only:")
 *   .select("name", "email")
 */
// Grouped overload: preserve grouping type
export function print<
  Row extends Record<string, unknown>,
  GroupName extends keyof Row,
>(
  messageOrOpts?: string | {
    maxCols?: number;
    maxWidth?: number;
    transpose?: boolean;
    showIndex?: boolean;
    colorRows?: boolean;
  },
  opts?: {
    maxCols?: number;
    maxWidth?: number;
    transpose?: boolean;
    showIndex?: boolean;
    colorRows?: boolean;
  },
): (df: GroupedDataFrame<Row, GroupName>) => GroupedDataFrame<Row, GroupName>;

/**
 * Print DataFrame contents to console with optional formatting.
 *
 * Displays a formatted table representation of the DataFrame in the console.
 * Useful for debugging and data inspection. Returns the original DataFrame
 * for chaining. Supports custom formatting options and optional messages.
 *
 * @param messageOrOpts - Optional message to print before the table, or formatting options
 * @param opts - Formatting options (only used if first parameter is a message)
 *   - `maxCols`: Maximum number of columns to display
 *   - `maxWidth`: Maximum width for each column
 *   - `transpose`: Display table transposed (rows as columns)
 *   - `showIndex`: Show row indices
 *   - `colorRows`: Alternate row background colors for better readability
 *
 * @returns The original DataFrame for chaining
 *
 * @example
 * // Simple print
 * df.print()
 *
 * @example
 * // Print with message
 * df.print("User data:")
 *
 * @example
 * // Print with formatting options
 * df.print({ showIndex: true, colorRows: true })
 *
 * @example
 * // Print with message and options
 * df.print("Debug output:", { maxCols: 5, showIndex: true })
 *
 * @example
 * // Chain with other operations
 * df.filter(row => row.age > 18)
 *   .print("Adults only:")
 *   .select("name", "email")
 */
// Ungrouped overload
export function print<Row extends Record<string, unknown>>(
  messageOrOpts?: string | {
    maxCols?: number;
    maxWidth?: number;
    transpose?: boolean;
    showIndex?: boolean;
    colorRows?: boolean;
  },
  opts?: {
    maxCols?: number;
    maxWidth?: number;
    transpose?: boolean;
    showIndex?: boolean;
    colorRows?: boolean;
  },
): (df: DataFrame<Row>) => DataFrame<Row>;

// Implementation
export function print<Row extends Record<string, unknown>>(
  messageOrOpts?: any,
  opts?: any,
) {
  return (df: DataFrame<Row> | GroupedDataFrame<Row>): any => {
    // Handle both string message and options
    if (typeof messageOrOpts === "string") {
      console.log(messageOrOpts);
      printTable((df as any).toTable(opts), {
        showIndex: opts?.showIndex,
        colorRows: opts?.colorRows,
      });
    } else {
      printTable((df as any).toTable(messageOrOpts), {
        showIndex: messageOrOpts?.showIndex,
        colorRows: messageOrOpts?.colorRows,
      });
    }

    // Return the same DataFrame for chaining
    return df;
  };
}

// ANSI color codes for alternating row backgrounds
const ANSI_RESET = "\x1b[0m";
const ANSI_BG_LIGHT_GRAY = "\x1b[48;5;255m\x1b[30m"; // Extremely light gray background, black text

/**
 * Custom table printer with optional index column and alternating row colors
 */
function printTable(
  data: object[],
  options?: { showIndex?: boolean; colorRows?: boolean },
): void {
  if (data.length === 0) {
    console.log("[Empty DataFrame]");
    return;
  }

  const showIndex = options?.showIndex ?? false;
  const alternateRows = options?.colorRows ?? false; // Colors disabled by default, enabled with colorRows

  // Get all columns from the data
  const columns = Object.keys(data[0]);

  // Add index column if requested
  const allColumns = showIndex ? ["(idx)"] : [];
  allColumns.push(...columns);

  // Calculate column widths
  const widths: Record<string, number> = {};

  if (showIndex) {
    widths["(idx)"] = Math.max(
      "(idx)".length,
      String(data.length - 1).length,
    );
  }

  columns.forEach((col) => {
    widths[col] = Math.max(
      col.length,
      ...data.map((row) => {
        const value = (row as any)[col];
        if (value === null) return "(null)".length;
        if (value === undefined) return "(undefined)".length;
        if (value instanceof Date) return formatDateLocal(value).length;
        return String(value).length;
      }),
    );
  });

  // Print header
  const headerRow = allColumns.map((col) => col.padEnd(widths[col])).join(
    " │ ",
  );
  const topBorder = allColumns.map((col) => "─".repeat(widths[col])).join(
    "─┬─",
  );
  const middleBorder = allColumns.map((col) => "─".repeat(widths[col])).join(
    "─┼─",
  );
  const bottomBorder = allColumns.map((col) => "─".repeat(widths[col])).join(
    "─┴─",
  );

  console.log("┌─" + topBorder + "─┐");
  console.log("│ " + headerRow + " │");
  console.log("├─" + middleBorder + "─┤");

  // Print data rows
  data.forEach((row, index) => {
    const rowData = [];

    if (showIndex) {
      rowData.push(String(index).padEnd(widths["(idx)"]));
    }

    columns.forEach((col) => {
      const value = (row as any)[col];
      let displayValue: string;

      if (value === null) {
        displayValue = "(null)";
      } else if (value === undefined) {
        displayValue = "(undefined)";
      } else if (value instanceof Date) {
        // Format date in local time (ISO-like format without Z)
        displayValue = formatDateLocal(value);
      } else {
        displayValue = String(value);
      }

      rowData.push(displayValue.padEnd(widths[col]));
    });

    // Apply alternating row colors if enabled
    const rowContent = rowData.join(" │ ");
    if (alternateRows && index % 2 === 1) {
      // Color the content including the spaces next to borders, but not the borders themselves
      console.log(
        "│" + ANSI_BG_LIGHT_GRAY + " " + rowContent + " " + ANSI_RESET + "│",
      );
    } else {
      console.log("│ " + rowContent + " │");
    }
  });

  console.log("└─" + bottomBorder + "─┘");
}
