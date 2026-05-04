import { LLM } from "@tidy-ts/ai";
import { expect } from "@std/expect";
import { z } from "zod";

Deno.test({
  name: "LLM.refine - improve a tweet",
  async fn() {
    const tweetSchema = z.object({
      tweet: z.string(),
      characterCount: z.number(),
    });

    const result = await LLM.refine({
      input:
        "Write a tweet announcing a new AI-powered code review tool called 'CodeLens AI'",
      drafter: {
        instructions:
          "Write a compelling tweet (under 280 chars) for the announcement. Include the character count.",
        schema: tweetSchema,
      },
      critic: {
        instructions:
          "Critique this tweet for: engagement potential, clarity, and whether it's under 280 characters. Suggest specific improvements.",
        schema: z.object({
          strengths: z.array(z.string()),
          weaknesses: z.array(z.string()),
          suggestions: z.array(z.string()),
        }),
      },
      reviser: {
        instructions:
          "Revise the tweet based on the critique. Keep it under 280 characters. Include the character count.",
        schema: tweetSchema,
      },
      rounds: 1,
    });

    expect(typeof result.tweet).toBe("string");
    expect(typeof result.characterCount).toBe("number");
    expect(result.tweet.length).toBeLessThanOrEqual(280);
    console.log(result);
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
