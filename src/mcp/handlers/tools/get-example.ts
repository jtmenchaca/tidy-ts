import type { TidyMcp } from "../../index.ts";
import * as v from "valibot";
import { getExample, listExamples } from "../../docs/examples.ts";

export function get_example(server: TidyMcp) {
  server.tool(
    {
      name: "tidy-get-example",
      description:
        "Get working code examples for specific use cases. Returns complete, runnable code from the examples directory.",
      schema: v.object({
        use_case: v.pipe(
          v.string(),
          v.description(
            'The use case or example name (e.g., "getting-started", "grouping-aggregation", "stats-descriptive")',
          ),
        ),
      }),
    },
    async ({ use_case }) => {
      const example = getExample(use_case);

      if (!example) {
        const availableExamples = listExamples()
          .map((ex) => `- **${ex.name}** (${use_case}): ${ex.description}`)
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

      // Read the example file
      let fileContent: string;
      try {
        fileContent = await Deno.readTextFile(example.path);
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text:
                `## Error Reading Example\n\nCould not read example file at \`${example.path}\`.\n\nError: ${error}`,
            },
          ],
        };
      }

      const output =
        `# ${example.name}\n\n${example.description}\n\n---\n\n\`\`\`typescript\n${fileContent}\n\`\`\`\n`;

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
