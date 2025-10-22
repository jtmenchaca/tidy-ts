import { ValibotJsonSchemaAdapter } from "@tmcp/adapter-valibot";
import { McpServer } from "tmcp";
import { setup_tools } from "./handlers/index.ts";

export const server = new McpServer(
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
      "This is the official Tidy-TS MCP server. Use it to discover DataFrame operations, get documentation, and find code examples for data analysis in TypeScript. Call tidy-list-operations to see all available operations, tidy-get-docs for detailed documentation, tidy-get-example for working code examples, and tidy-get-file-structure to inspect CSV/XLSX files before reading them.",
  },
);

export type TidyMcp = typeof server;

setup_tools(server);
