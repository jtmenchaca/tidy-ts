import { LLM } from "@tidy-ts/ai";
import { expect } from "@std/expect";
import { z } from "zod";

Deno.test({
  name: "LLM.debate - should pineapple go on pizza",
  async fn() {
    const argumentSchema = z.object({
      position: z.string(),
      keyPoints: z.array(z.string()),
    });

    const result = await LLM.debate({
      debate: {
        input: "Should pineapple be allowed on pizza?",
        proposition: {
          instructions:
            "State the proposition clearly: 'Pineapple belongs on pizza.' Provide a brief thesis.",
          schema: z.object({ thesis: z.string() }),
        },
        advocate: {
          instructions:
            "You are a passionate advocate FOR pineapple on pizza. Make your 3 strongest arguments.",
          schema: argumentSchema,
        },
        critic: {
          instructions:
            "You are a passionate critic AGAINST pineapple on pizza. Make your 3 strongest counterarguments.",
          schema: argumentSchema,
        },
      },
      judge: {
        instructions:
          "You are an impartial judge. Weigh both sides and deliver a verdict with reasoning.",
        schema: z.object({
          verdict: z.enum(["for", "against", "undecided"]),
          reasoning: z.string(),
          winningArgument: z.string(),
        }),
      },
    });

    expect(["for", "against", "undecided"]).toContain(result.verdict);
    expect(typeof result.reasoning).toBe("string");
    expect(typeof result.winningArgument).toBe("string");
    console.log(result);
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
