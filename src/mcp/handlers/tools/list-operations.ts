import type { TidyMcp } from "../../index.ts";
import * as v from "valibot";
import { getOperationsByCategory } from "../../docs/index.ts";

export function list_operations(server: TidyMcp) {
  const schema = v.object({
    category: v.optional(
      v.pipe(
        v.union([
          v.literal("dataframe"),
          v.literal("stats"),
          v.literal("io"),
          v.literal("all"),
        ]),
        v.description(
          'Filter by category: "dataframe" (DataFrame operations), "stats" (statistics), "io" (file I/O), or "all" (default)',
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

      const categoryNames: Record<string, string> = {
        dataframe: "DataFrame Operations",
        stats: "Statistics Functions",
        io: "I/O Operations",
      };

      for (const [cat, ops] of Object.entries(grouped)) {
        output += `## ${categoryNames[cat] || cat}\n\n`;
        for (const op of ops) {
          output += `- **${op.name}**: ${op.description}\n`;
        }
        output += "\n";
      }

      output += `\n---\n\n`;
      output += `**Total operations**: ${operations.length}\n\n`;
      output +=
        `Use \`tidy-get-docs\` with an operation name to see detailed documentation.\n`;
      output += `Use \`tidy-get-example\` to see working code examples.\n`;

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
