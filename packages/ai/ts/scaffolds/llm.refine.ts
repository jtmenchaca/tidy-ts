import { z } from "zod";
import { runScaffold, type ScaffoldStep } from "../scaffold.ts";
import type { ModelOption } from "./types.ts";

/**
 * Self-Refine: Draft → Critique → Revise, repeated for N rounds.
 */
export async function refine<T extends z.ZodObject>({
  input,
  drafter,
  critic,
  reviser,
  rounds = 1,
  model = "gpt-5.4-mini",
}: {
  input: string;
  drafter: { instructions: string; schema: T; model?: ModelOption };
  critic: { instructions: string; schema: z.ZodObject; model?: ModelOption };
  reviser: { instructions: string; schema: T; model?: ModelOption };
  rounds?: number;
  model?: ModelOption;
}): Promise<z.infer<T>> {
  const steps: ScaffoldStep[] = [
    // Initial draft
    () => ({ instructions: drafter.instructions, schema: drafter.schema, model: drafter.model }),
  ];

  for (let _i = 0; _i < rounds; _i++) {
    // Critique the latest draft
    // deno-lint-ignore no-explicit-any
    steps.push((prev: any[]) => ({
      instructions: critic.instructions,
      schema: critic.schema,
      model: critic.model,
      userInput: `Draft to critique: ${JSON.stringify(prev[prev.length - 1])}\n\nOriginal request: ${input}`,
    }));
    // Revise using the critique
    // deno-lint-ignore no-explicit-any
    steps.push((prev: any[]) => ({
      instructions: reviser.instructions,
      schema: reviser.schema,
      model: reviser.model,
      userInput:
        `Original request: ${input}\n\nCurrent draft: ${JSON.stringify(prev[prev.length - 2])}\n\nCritique: ${JSON.stringify(prev[prev.length - 1])}`,
    }));
  }

  return runScaffold({ input, model, steps });
}
