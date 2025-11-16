import type { TidyMcp } from "../../index.ts";
import * as v from "valibot";
import { DOCS, getDocumentation } from "../../docs/index.ts";

export function get_docs(server: TidyMcp) {
  const schema = v.object({
    topic: v.pipe(
      v.union([v.string(), v.array(v.string())]),
      v.description(
        'Operation name(s) to get documentation for (e.g., "mutate", "groupBy", "mean", ["filter", "select"])',
      ),
    ),
  });

  type Input = v.InferInput<typeof schema>;

  server.tool(
    {
      name: "tidy-get-docs",
      description:
        "Get detailed documentation for specific DataFrame operations or statistics functions. Supports single topic or array of topics.",
      // deno-lint-ignore no-explicit-any
      schema: schema as any,
    },
    ({ topic }: Input) => {
      const topics = Array.isArray(topic) ? topic : [topic];

      const results = topics.map((t) => {
        const doc = getDocumentation(t);

        if (!doc) {
          return {
            success: false,
            content:
              `## ${t}\n\n**Error**: Documentation not found for "${t}".\n\nUse \`tidy-list-operations\` to see all available operations.`,
          };
        }

        let output = `## ${doc.name}\n\n`;
        output += `**Category**: ${doc.category}\n\n`;
        output += `${doc.description}\n\n`;

        if (doc.imports && doc.imports.length > 0) {
          output += `### Import\n\`\`\`typescript\n`;
          output += doc.imports.join("\n");
          output += `\n\`\`\`\n\n`;
        }

        output +=
          `### Signature\n\`\`\`typescript\n${doc.signature}\n\`\`\`\n\n`;

        if (doc.parameters && doc.parameters.length > 0) {
          output += `### Parameters\n`;
          for (const param of doc.parameters) {
            output += `- ${param}\n`;
          }
          output += "\n";
        }

        if (doc.returns) {
          output += `### Returns\n${doc.returns}\n\n`;
        }

        if (doc.examples && doc.examples.length > 0) {
          output += `### Examples\n\`\`\`typescript\n`;
          output += doc.examples.join("\n\n");
          output += `\n\`\`\`\n\n`;
        }

        if (doc.antiPatterns && doc.antiPatterns.length > 0) {
          output += `### Anti-Patterns (Avoid These)\n`;
          for (const pattern of doc.antiPatterns) {
            output += `${pattern}\n`;
          }
          output += "\n";
        }

        if (doc.bestPractices && doc.bestPractices.length > 0) {
          output += `### Best Practices\n`;
          for (const practice of doc.bestPractices) {
            output += `${practice}\n`;
          }
          output += "\n";
        }

        if (doc.related && doc.related.length > 0) {
          output += `### Related\n${doc.related.join(", ")}\n\n`;
        }

        return {
          success: true,
          content: output,
        };
      });

      const hasAnySuccess = results.some((r) => r.success);
      let finalText = results.map((r) => r.content).join("\n---\n\n");

      if (!hasAnySuccess) {
        finalText += `\n\n---\n\n**Available operations**: ${
          Object.keys(DOCS).join(", ")
        }\n`;
      }

      return {
        content: [
          {
            type: "text",
            text: finalText,
          },
        ],
      };
    },
  );
}
