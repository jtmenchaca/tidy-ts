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

    const critiqueSchema = z.object({
      strengths: z.array(z.string()),
      weaknesses: z.array(z.string()),
      suggestions: z.array(z.string()),
    });

    const result = await LLM.refine({
      input:
        "Write a tweet announcing a new AI-powered code review tool called 'CodeLens AI'",
      config: {
        drafter: {
          instructions:
            "Write a compelling tweet (under 280 chars) for the announcement. Include the character count.",
          schema: tweetSchema,
        },
        critic: {
          instructions:
            "Critique this tweet for: engagement potential, clarity, and whether it's under 280 characters. Suggest specific improvements.",
          schema: critiqueSchema,
        },
        reviser: {
          instructions:
            "Revise the tweet based on the critique. Keep it under 280 characters. Include the character count.",
          schema: tweetSchema,
        },
        rounds: 1,
      },
    });

    // Initial draft is exposed
    expect(typeof result.draft.tweet).toBe("string");
    expect(typeof result.draft.characterCount).toBe("number");

    // Critique/revision rounds are exposed
    expect(result.rounds.length).toBe(1);
    expect(result.rounds[0].critique.strengths.length).toBeGreaterThanOrEqual(0);
    expect(result.rounds[0].critique.suggestions.length).toBeGreaterThanOrEqual(0);
    expect(typeof result.rounds[0].revision.tweet).toBe("string");

    // Final output
    expect(typeof result.final.tweet).toBe("string");
    expect(typeof result.final.characterCount).toBe("number");
    expect(result.final.tweet.length).toBeLessThanOrEqual(280);
    console.log(result);
  },
});
