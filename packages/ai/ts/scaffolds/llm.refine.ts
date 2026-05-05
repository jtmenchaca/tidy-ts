import { z } from "zod";
import { runScaffold, type ScaffoldStep } from "../scaffold.ts";
import type { RefineScaffold, InferRefineResult } from "./types.ts";

/**
 * Self-Refine: Draft → (Critique → Revise) × N rounds.
 * Returns the initial draft, all critique/revision rounds, and the final output.
 */
export async function refine<
  D extends z.ZodObject,
  C extends z.ZodObject,
  R extends z.ZodObject,
>({
  input,
  config,
}: {
  input: string;
  config: RefineScaffold<D, C, R>;
}): Promise<InferRefineResult<RefineScaffold<D, C, R>>> {
  const { drafter, critic, reviser, rounds: numRounds = 1, model: configModel } = config;
  const model = configModel ?? "gpt-5.4-mini";
  const steps: ScaffoldStep[] = [
    // Initial draft
    () => ({ instructions: drafter.instructions, schema: drafter.schema, model: drafter.model }),
  ];

  for (let _i = 0; _i < numRounds; _i++) {
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

  const results = await runScaffold({ input, model, steps, returnAll: true });

  const draft = results[0];
  const rounds = [];
  for (let i = 0; i < numRounds; i++) {
    rounds.push({
      critique: results[1 + i * 2],
      revision: results[2 + i * 2],
    });
  }

  return {
    draft,
    rounds,
    final: numRounds > 0 ? results[results.length - 1] : draft,
  } as InferRefineResult<RefineScaffold<D, C, R>>;
}
