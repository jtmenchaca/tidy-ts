import type { TidyMcp } from "../../index.ts";
import * as v from "valibot";
import {
  CATEGORY_DISPLAY_NAMES,
  getOperationsByCategory,
} from "../../docs/index.ts";

export function list_operations(server: TidyMcp) {
  const schema = v.object({
    category: v.optional(
      v.pipe(
        v.union([
          v.literal("dataframe"),
          v.literal("stats"),
          v.literal("stats-distributions"),
          v.literal("stats-tests"),
          v.literal("stats-compare"),
          v.literal("io"),
          v.literal("shims"),
          v.literal("string"),
          v.literal("all"),
        ]),
        v.description(
          'Filter by category: "dataframe", "stats", "stats-distributions", "stats-tests", "stats-compare", "io", "shims", "string", or "all" (default)',
        ),
      ),
      "all",
    ),
  });

  type Input = v.InferInput<typeof schema>;

  server.tool(
    {
      name: "tidy-list-operations",
      description:
        "Lists all available DataFrame operations, statistics functions, and I/O operations by category. Use this to discover what operations are available in tidy-ts.",
      // deno-lint-ignore no-explicit-any
      schema: schema as any,
    },
    ({ category = "all" }: Input) => {
      const operations = getOperationsByCategory(category);

      // Group by category for better organization
      const grouped: Record<string, typeof operations> = {};
      for (const op of operations) {
        if (!grouped[op.category]) {
          grouped[op.category] = [];
        }
        grouped[op.category].push(op);
      }

      // Format output
      let output = `# Tidy-TS Operations${
        category !== "all" ? ` (${category})` : ""
      }\n\n`;

      for (const [cat, ops] of Object.entries(grouped)) {
        output += `## ${CATEGORY_DISPLAY_NAMES[cat] || cat}\n\n`;
        for (const op of ops) {
          output += `- **${op.name}**: ${op.description}\n`;
        }
        output += "\n";
      }

      output += `\n---\n\n`;
      output += `**Total operations**: ${operations.length}\n\n`;
      output +=
        `Use \`tidy-get-docs\` with an operation name to see detailed documentation.\n`;

      return {
        content: [
          {
            type: "text",
            text: output,
          },
        ],
      };
    },
  );
}
