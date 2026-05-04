import { LLM } from "@tidy-ts/ai";
import { expect } from "@std/expect";
import { z } from "zod";

Deno.test({
  name: "LLM.pipeline - translate then analyze",
  async fn() {
    const result = await LLM.pipeline({
      input: "The cat sat on the mat",
      steps: [
        {
          instructions:
            "Translate the input sentence to French. Return only the translation.",
          schema: z.object({ translation: z.string() }),
        },
        {
          instructions:
            "Given the previous translation result, count the number of words in the French translation and return it along with the translation.",
          schema: z.object({ translation: z.string(), wordCount: z.number() }),
        },
      ],
    });

    expect(typeof result.translation).toBe("string");
    expect(typeof result.wordCount).toBe("number");
    expect(result.wordCount).toBeGreaterThan(0);
    console.log(result);
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
