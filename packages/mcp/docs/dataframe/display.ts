import type { DocEntry } from "../mcp-types.ts";

export const displayDocs: Record<string, DocEntry> = {
  print: {
    name: "print",
    category: "dataframe",
    signature: "print(title?: string): void",
    description:
      "Display the DataFrame in a formatted table. Use this instead of console.log().",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: [
      "title: Optional title to display above the table",
    ],
    returns: "void",
    examples: [
      "df.print()",
      'df.print("Sales Analysis:")',
      'result.groupBy("region").summarize({ total: g => s.sum(g.sales) }).print("Regional Totals:")',
    ],
    related: ["toString", "toRows", "columns", "nrows"],
    antiPatterns: [
      "❌ BAD: console.log(df.toRows()) or logging full row arrays for inspection — use print()",
      "❌ BAD: console.log(df)",
    ],
    bestPractices: [
      "✓ GOOD: df.print() - formatted table output",
      "✓ GOOD: df.print('Title') - with descriptive title",
    ],
  },

  toRows: {
    name: "toRows",
    category: "dataframe",
    signature: "toRows(): Row[]",
    description:
      "Materialize the DataFrame as a plain array of row objects (respects the current filter mask). Prefer this over the deprecated `toArray()` alias, which delegates to `toRows()`. For display use `print()` / `toString()`; for one column use `df.col` or `extract()`.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: [],
    returns: "Mutable Row[] (one object per visible row)",
    examples: [
      "const rows = df.toRows();",
      "// After filter: only visible rows\nconst active = df.filter((r) => r.status === \"active\").toRows();",
    ],
    related: ["print", "toString", "extract", "columns"],
    bestPractices: [
      "✓ GOOD: Use toRows() when an API needs plain objects (serialization, tests, small tables)",
      "✓ GOOD: Prefer column access or extract() over row materialization for large data",
    ],
    antiPatterns: [
      "❌ BAD: toRows().map((r) => r.x) to read one column — use df.x or extract(\"x\")",
    ],
  },

  toString: {
    name: "toString",
    category: "dataframe",
    signature: "toString(title?: string): string",
    description:
      "Get a string representation of the DataFrame in table format. Returns the same formatted output as print() but as a string.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: [
      "title: Optional title to display above the table",
    ],
    returns: "string - formatted table representation",
    examples: [
      "const tableStr = df.toString()",
      'const tableStr = df.toString("Sales Data")',
      "console.log(df.toString()) // Manual printing",
    ],
    related: ["print", "toRows"],
    bestPractices: [
      "✓ GOOD: Use toString() when you need the string for logging or file output",
      "✓ GOOD: Use print() for direct console output (more convenient)",
    ],
  },
};
