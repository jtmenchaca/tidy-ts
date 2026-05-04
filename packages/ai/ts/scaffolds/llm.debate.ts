import { z } from "zod";
import { runScaffold } from "../scaffold.ts";
import type { ModelOption, StepDef } from "./types.ts";

/**
 * Debate/Adversarial: Generate → advocate FOR + advocate AGAINST → judge decides.
 */
export async function debate<T extends z.ZodObject>({
  debate: { input, proposition, advocate, critic },
  judge,
  model = "gpt-5.4-mini",
}: {
  debate: {
    input: string;
    proposition: StepDef;
    advocate: { instructions: string; schema: z.ZodObject; model?: ModelOption };
    critic: { instructions: string; schema: z.ZodObject; model?: ModelOption };
  };
  judge: { instructions: string; schema: T; model?: ModelOption };
  model?: ModelOption;
}): Promise<z.infer<T>> {
  return runScaffold({
    input,
    model,
    steps: [
      // Step 1: Generate the proposition
      () => ({
        instructions: proposition.instructions,
        schema: proposition.schema,
        model: proposition.model,
      }),
      // Step 2: Advocate and critic in parallel
      // deno-lint-ignore no-explicit-any
      (prev: any[]) => [
        {
          instructions: advocate.instructions,
          schema: advocate.schema,
          model: advocate.model,
          userInput: JSON.stringify(prev[0]),
        },
        {
          instructions: critic.instructions,
          schema: critic.schema,
          model: critic.model,
          userInput: JSON.stringify(prev[0]),
        },
      ],
      // Step 3: Judge
      // deno-lint-ignore no-explicit-any
      (prev: any[]) => ({
        instructions: judge.instructions,
        schema: judge.schema,
        model: judge.model,
        userInput:
          `Proposition: ${JSON.stringify(prev[0])}\n\nAdvocate (FOR): ${JSON.stringify(prev[1][0])}\n\nCritic (AGAINST): ${JSON.stringify(prev[1][1])}`,
      }),
    ],
  });
}
