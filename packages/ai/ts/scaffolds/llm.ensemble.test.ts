import { LLM } from "@tidy-ts/ai";
import { expect } from "@std/expect";
import { z } from "zod";

Deno.test({
  name: "LLM.ensemble - generate and pick best tagline",
  async fn() {
    const taglineSchema = z.object({
      tagline: z.string(),
      tone: z.string(),
    });
 
    const result = await LLM.ensemble({
      ensemble: {
        input:
        "Create a tagline for a sustainable fashion brand called 'EverGreen'",
        attempts: [
            {
              instructions: "Write a playful, fun tagline. Describe its tone.",
              schema: taglineSchema,
            },
            {
              instructions:
                "Write a serious, aspirational tagline. Describe its tone.",
              schema: taglineSchema,
            },
            {
              instructions:
                "Write a minimalist, zen-like tagline. Describe its tone.",
              schema: taglineSchema,
            },
          ],
      },
      synthesizer: {
        instructions:
          "Review all tagline attempts. Pick the best one or combine elements from multiple. Explain your choice.",
        schema: z.object({
          chosenTagline: z.string(),
          reasoning: z.string(),
          source: z.enum([
            "attempt_1",
            "attempt_2",
            "attempt_3",
            "combined",
          ]),
        }),
      },
    });

    expect(typeof result.chosenTagline).toBe("string");
    expect(typeof result.reasoning).toBe("string");
    expect(["attempt_1", "attempt_2", "attempt_3", "combined"]).toContain(
      result.source,
    );
    console.log(result);
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
