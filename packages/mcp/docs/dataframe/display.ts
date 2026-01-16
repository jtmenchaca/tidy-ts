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
    related: ["toString", "toArray", "columns", "nrows"],
    antiPatterns: [
      "❌ BAD: console.log(df.toArray())",
      "❌ BAD: console.log(df)",
    ],
    bestPractices: [
      "✓ GOOD: df.print() - formatted table output",
      "✓ GOOD: df.print('Title') - with descriptive title",
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
    related: ["print", "toArray"],
    bestPractices: [
      "✓ GOOD: Use toString() when you need the string for logging or file output",
      "✓ GOOD: Use print() for direct console output (more convenient)",
    ],
  },
};
