// deno-lint-ignore-file no-explicit-any
import type { DataFrame, GroupedDataFrame } from "../../dataframe/index.ts";

/**
 * Print DataFrame contents to console with optional message.
 * Returns the same DataFrame for chaining.
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
        if (value instanceof Date) return value.toISOString().length;
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
        displayValue = value.toISOString();
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
