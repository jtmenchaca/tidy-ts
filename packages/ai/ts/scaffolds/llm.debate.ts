import { z } from "zod";
import { runScaffold } from "../scaffold.ts";
import type { DebateScaffold, InferDebateResult } from "./types.ts";

/**
 * Debate/Adversarial: Proposition → Advocate + Critic (parallel) → Judge.
 * Returns all intermediate outputs keyed by step name.
 */
export async function debate<
  P extends z.ZodObject,
  A extends z.ZodObject,
  C extends z.ZodObject,
  J extends z.ZodObject,
>({
  input,
  config,
}: {
  input: string;
  config: DebateScaffold<P, A, C, J>;
}): Promise<InferDebateResult<DebateScaffold<P, A, C, J>>> {
  const { proposition, advocate, critic, judge, model: configModel } = config;
  const model = configModel ?? "gpt-5.4-mini";
  const results = await runScaffold({
    input,
    model,
    returnAll: true,
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
  return {
    proposition: results[0],
    advocate: results[1][0],
    critic: results[1][1],
    judge: results[2],
  } as InferDebateResult<DebateScaffold<P, A, C, J>>;
}
