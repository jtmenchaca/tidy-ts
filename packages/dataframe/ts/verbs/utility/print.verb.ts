// deno-lint-ignore-file no-explicit-any

/**
 * Format a Date in UTC time (ISO 8601 format with Z suffix).
 * Shows the date/time in UTC timezone for consistent time-series display.
 */
function formatDateUTC(date: Date): string {
  return date.toISOString();
}

/**
 * Render a cell value as a string for tabular display.
 *
 * Objects + arrays are JSON-stringified instead of `String()`'d (which
 * would yield `[object Object]` for plain objects). Single source of
 * truth so width calculation + the rendered cell agree. */
function formatCell(value: unknown): string {
  if (value === null) return "(null)";
  if (value === undefined) return "(undefined)";
  if (value instanceof Date) return formatDateUTC(value);
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

/**
 * Print DataFrame contents to console with optional formatting.
 *
 * Displays a formatted table representation of the DataFrame in the console.
 * Useful for debugging and data inspection. Returns the original DataFrame
 * for chaining. Supports custom formatting options and optional messages.
 */
export function print(
  messageOrOpts?: any,
  opts?: any,
) {
  return (df: any): any => {
    // Handle both string message and options
    const resolvedOpts = typeof messageOrOpts === "string" ? opts : messageOrOpts;

    if (typeof messageOrOpts === "string") {
      console.log(messageOrOpts);
    }

    if (resolvedOpts?.expand) {
      // Use raw row data for expanded view (bypass toTable's object stringification)
      printExpanded(df.toArray(), Object.keys(df.toArray()[0] || {}));
    } else {
      printTable(df.toTable(resolvedOpts), {
        showIndex: resolvedOpts?.showIndex,
        colorRows: resolvedOpts?.colorRows,
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
      ...data.map((row) => formatCell((row as any)[col]).length),
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
      const displayValue = formatCell((row as any)[col]);
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

/**
 * Print rows in expanded format — one row per block with nested objects shown as indented JSON.
 */
function printExpanded(data: object[], columns: string[]): void {
  data.forEach((row, index) => {
    console.log(`── Row ${index} ${"─".repeat(40)}`);
    for (const col of columns) {
      const value = (row as any)[col];
      if (value === null) {
        console.log(`  ${col}: (null)`);
      } else if (value === undefined) {
        console.log(`  ${col}: (undefined)`);
      } else if (value instanceof Date) {
        console.log(`  ${col}: ${formatDateUTC(value)}`);
      } else if (typeof value === "object") {
        console.log(`  ${col}:`);
        const json = JSON.stringify(value, null, 4);
        for (const line of json.split("\n")) {
          console.log(`    ${line}`);
        }
      } else {
        console.log(`  ${col}: ${value}`);
      }
    }
  });
}
