import { LLM } from "@tidy-ts/ai";
import { expect } from "@std/expect";
import { z } from "zod";

Deno.test({
  name: "LLM.evaluate - generate and rate a slogan",
  async fn() {
    const ratingSchema = z.object({
      score: z.number().min(1).max(10),
      reasoning: z.string(),
    });

    const result = await LLM.evaluate({
      input: "Create a slogan for a coffee shop called 'Morning Brew'",
      config: {
        generator: {
          instructions:
            "Create a catchy, memorable slogan for the business described.",
          schema: z.object({ slogan: z.string() }),
        },
        evaluator: {
          instructions:
            "Rate the slogan for memorability (1-10) and brand fit (1-10). Is it catchy? Does it match a cozy coffee shop vibe?",
          schema: ratingSchema,
        },
        adjudicator: {
          instructions:
            "Given the slogan and evaluations, provide an overall score (average, rounded) and a final recommendation.",
          schema: z.object({
            slogan: z.string(),
            overallScore: z.number(),
            recommendation: z.enum(["use as-is", "revise", "discard"]),
          }),
        },
      },
    });

    expect(typeof result.generator.slogan).toBe("string");
    expect(typeof result.evaluator.score).toBe("number");
    expect(typeof result.evaluator.reasoning).toBe("string");
    expect(typeof result.adjudicator.slogan).toBe("string");
    expect(result.adjudicator.overallScore).toBeGreaterThanOrEqual(1);
    expect(result.adjudicator.overallScore).toBeLessThanOrEqual(10);
    expect(["use as-is", "revise", "discard"]).toContain(result.adjudicator.recommendation);
    console.log(result);
  },
});
