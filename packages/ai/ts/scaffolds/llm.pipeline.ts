import { z } from "zod";
import { runScaffold } from "../scaffold.ts";
import type { ModelOption, StepDef } from "./types.ts";

/**
 * Linear pipeline: Step A → Step B → Step C.
 * Each step's output is JSON-stringified and passed as userInput to the next.
 */
export async function pipeline<T extends z.ZodObject>({
  input,
  steps,
  model = "gpt-5.4-mini",
}: {
  input: string;
  steps: StepDef[];
  model?: ModelOption;
}): Promise<z.infer<T>> {
  return runScaffold({
    input,
    model,
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
}
