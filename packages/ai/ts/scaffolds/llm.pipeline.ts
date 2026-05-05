import { runScaffold } from "../scaffold.ts";
import type { PipelineScaffold, InferPipelineResult, StepDef } from "./types.ts";

/**
 * Linear pipeline: Step A → Step B → Step C.
 * Each step's output is JSON-stringified and passed as userInput to the next.
 * Returns all intermediate outputs plus the typed final result.
 */
export async function pipeline<Steps extends readonly StepDef[]>({
  input,
  config,
}: {
  input: string;
  config: PipelineScaffold<Steps>;
}): Promise<InferPipelineResult<PipelineScaffold<Steps>>> {
  const { steps, model: configModel } = config;
  const model = configModel ?? "gpt-5.4-mini";
  const results = await runScaffold({
    input,
    model,
    returnAll: true,
    steps: steps.map((step, i) =>
      // deno-lint-ignore no-explicit-any
      (prev: any[]) => ({
        instructions: step.instructions,
        schema: step.schema,
        model: step.model,
        userInput: i === 0
          ? undefined
          : `Previous result: ${JSON.stringify(prev[i - 1])}\n\nOriginal input: ${input}`,
      })
    ),
  });
  return {
    steps: results,
    final: results[results.length - 1],
  } as InferPipelineResult<PipelineScaffold<Steps>>;
}
