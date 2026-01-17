#!/usr/bin/env -S deno run --allow-read --allow-env
/**
 * CLI for inspecting data file structure
 *
 * Usage:
 *   deno run --allow-read packages/dataframe/cli/peek.ts <file>
 *   npx @tidy-ts/dataframe peek <file>
 *
 * Examples:
 *   deno run --allow-read packages/dataframe/cli/peek.ts data.xlsx
 *   deno run --allow-read packages/dataframe/cli/peek.ts data.csv
 *   deno run --allow-read packages/dataframe/cli/peek.ts data.xlsx --sheet "Sheet2"
 *   deno run --allow-read packages/dataframe/cli/peek.ts data.csv --rows 10
 */

import { peek } from "../ts/io/peek.ts";

function printHelp() {
  console.log(`
peek - Inspect the structure of a data file (CSV, TSV, or XLSX)

Usage:
  peek <file> [options]

Arguments:
  file                  Path to the data file

Options:
  --rows <n>            Number of preview rows (default: 5)
  --sheet <name|index>  For XLSX: which sheet to preview (default: first sheet)
  --comma <char>        For CSV: field delimiter (default: ",")
  --help, -h            Show this help message

Examples:
  peek data.xlsx
  peek data.csv
  peek data.xlsx --sheet "Sheet2"
  peek data.xlsx --sheet 1
  peek data.csv --rows 10
  peek data.tsv --comma "\\t"
`);
}

async function main() {
  const args = Deno.args;

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printHelp();
    Deno.exit(0);
  }

  // Parse arguments
  let filePath: string | undefined;
  let previewRows = 5;
  let sheet: string | number | undefined;
  let comma: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--rows" && i + 1 < args.length) {
      previewRows = parseInt(args[++i], 10);
      if (isNaN(previewRows) || previewRows < 1) {
        console.error("Error: --rows must be a positive integer");
        Deno.exit(1);
      }
    } else if (arg === "--sheet" && i + 1 < args.length) {
      const sheetArg = args[++i];
      // Try to parse as number, otherwise use as string
      const num = parseInt(sheetArg, 10);
      sheet = isNaN(num) ? sheetArg : num;
    } else if (arg === "--comma" && i + 1 < args.length) {
      comma = args[++i];
      // Handle escaped tab
      if (comma === "\\t") comma = "\t";
    } else if (!arg.startsWith("-")) {
      filePath = arg;
    } else {
      console.error(`Error: Unknown option "${arg}"`);
      printHelp();
      Deno.exit(1);
    }
  }

  if (!filePath) {
    console.error("Error: No file path provided");
    printHelp();
    Deno.exit(1);
  }

  try {
    const result = await peek(filePath, {
      previewRows,
      sheet,
      comma,
    });
    console.log(result);
  } catch (error) {
    console.error(
      `Error: ${error instanceof Error ? error.message : String(error)}`,
    );
    Deno.exit(1);
  }
}

main();
