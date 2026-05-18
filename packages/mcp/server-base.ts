import { ValibotJsonSchemaAdapter } from "@tmcp/adapter-valibot";
import { McpServer } from "tmcp";
export const server: McpServer = new McpServer(
  {
    name: "Tidy-TS MCP",
    version: "0.1.0",
    description:
      "The official Tidy-TS MCP server for DataFrame operations, statistics, and data analysis",
  },
  {
    adapter: new ValibotJsonSchemaAdapter(),
    capabilities: {
      tools: {},
      resources: {},
    },
    instructions:
      "This is the official Tidy-TS MCP server. Use it to discover DataFrame operations, charting/visualization (Vega-Lite via @tidy-ts/graph), statistics functions, cross-runtime compatibility shims, and data analysis tools in TypeScript. Call tidy-list-operations to see all available operations (categories include dataframe, graph, stats, stats-distributions, stats-tests, stats-compare, io, shims, string). Use tidy-get-docs for detailed documentation with examples, tidy-get-file-structure to inspect CSV/XLSX files before reading them, and tidy-get-package-version for latest JSR/npm versions. The shims module (@tidy-ts/shims) provides runtime-agnostic APIs for file system, environment variables, process management, and testing that work across Deno, Bun, and Node.js. Note: Charting lives in the separate @tidy-ts/graph package — call `graph({ df, ... })` (not `df.graph(...)`).",
  },
);
