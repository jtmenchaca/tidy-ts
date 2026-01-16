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
      "This is the official Tidy-TS MCP server. Use it to discover DataFrame operations, statistics functions, cross-runtime compatibility shims, and data analysis tools in TypeScript. Call tidy-list-operations to see all available operations (including 'shims' category for cross-runtime APIs), tidy-get-docs for detailed documentation, tidy-get-example for working code examples, and tidy-get-file-structure to inspect CSV/XLSX files before reading them. The shims module (@tidy-ts/shims) provides runtime-agnostic APIs for file system, environment variables, process management, and testing that work across Deno, Bun, and Node.js.",
  },
);
