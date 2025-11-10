import type { TidyMcp } from "../../index.ts";
import * as v from "valibot";
import { getExample, listExamples } from "../../docs/examples.ts";

export function get_example(server: TidyMcp) {
  server.tool(
    {
      name: "tidy-get-example",
      description:
        "Get working code examples for specific use cases. Returns complete, self-contained runnable code examples.",
      schema: v.object({
        use_case: v.pipe(
          v.string(),
          v.description(
            'The use case or example name (e.g., "getting-started", "grouping-aggregation", "stats-descriptive")',
          ),
        ),
      }),
    },
    ({ use_case }) => {
      const example = getExample(use_case);

      if (!example) {
        const availableExamples = listExamples()
          .map((ex) =>
            `- **${ex.name}** (${
              ex.name.toLowerCase().replace(/\s+/g, "-")
            }): ${ex.description}`
          )
          .join("\n");

        return {
          content: [
            {
              type: "text",
              text:
                `## Example Not Found\n\nCould not find example for "${use_case}".\n\n### Available Examples\n\n${availableExamples}`,
            },
          ],
        };
      }

      const output =
        `# ${example.name}\n\n${example.description}\n\n---\n\n\`\`\`typescript\n${example.code}\n\`\`\`\n\n**Note:** Install tidy-ts with \`npm install @tidy-ts/dataframe\` or \`deno add npm:@tidy-ts/dataframe\` to run this example.`;

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
