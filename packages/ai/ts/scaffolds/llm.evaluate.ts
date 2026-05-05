import { z } from "zod";
import { runScaffold } from "../scaffold.ts";
import type { EvaluateScaffold, InferEvaluateResult } from "./types.ts";

/**
 * Evaluator/Adjudicator: Generate → evaluate → adjudicator synthesizes.
 * Returns all intermediate outputs keyed by step name.
 */
export async function evaluate<
  G extends z.ZodObject,
  E extends z.ZodObject,
  A extends z.ZodObject,
>({
  input,
  config,
}: {
  input: string;
  config: EvaluateScaffold<G, E, A>;
}): Promise<InferEvaluateResult<EvaluateScaffold<G, E, A>>> {
  const { generator, evaluator, adjudicator, model: configModel } = config;
  const model = configModel ?? "gpt-5.4-mini";
  const results = await runScaffold({
    input,
    model,
    returnAll: true,
    steps: [
      // Step 1: Generate
      () => ({ instructions: generator.instructions, schema: generator.schema, model: generator.model }),
      // Step 2: Evaluate
      // deno-lint-ignore no-explicit-any
      (prev: any[]) => ({
        instructions: evaluator.instructions,
        schema: evaluator.schema,
        model: evaluator.model,
        userInput: JSON.stringify(prev[0]),
      }),
      // Step 3: Adjudicator
      // deno-lint-ignore no-explicit-any
      (prev: any[]) => ({
        instructions: adjudicator.instructions,
        schema: adjudicator.schema,
        model: adjudicator.model,
        userInput: `Generated content: ${JSON.stringify(prev[0])}\n\nEvaluation: ${JSON.stringify(prev[1])}`,
      }),
    ],
  });
  return {
    generator: results[0],
    evaluator: results[1],
    adjudicator: results[2],
  } as InferEvaluateResult<EvaluateScaffold<G, E, A>>;
}
