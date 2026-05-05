import { z } from "zod";
import { runScaffold } from "../scaffold.ts";
import type { EnsembleScaffold, InferEnsembleResult } from "./types.ts";

/**
 * Ensemble + Synthesize: Multiple agents attempt the same task in parallel,
 * then a synthesizer picks the best or merges them.
 * Returns all attempt outputs plus the typed synthesizer result.
 */
export async function ensemble<S extends z.ZodObject>({
  input,
  config,
}: {
  input: string;
  config: EnsembleScaffold<S>;
}): Promise<InferEnsembleResult<EnsembleScaffold<S>>> {
  const { attempts, synthesizer, model: configModel } = config;
  const model = configModel ?? "gpt-5.4-mini";
  const results = await runScaffold({
    input,
    model,
    returnAll: true,
    steps: [
      // Step 1: All attempts in parallel
      () =>
        attempts.map((a) => ({
          instructions: a.instructions,
          schema: a.schema,
          model: a.model,
        })),
      // Step 2: Synthesizer
      // deno-lint-ignore no-explicit-any
      (prev: any[]) => ({
        instructions: synthesizer.instructions,
        schema: synthesizer.schema,
        model: synthesizer.model,
        userInput:
          `Original request: ${input}\n\nAttempts:\n${prev[0].map((r: unknown, i: number) => `Attempt ${i + 1}: ${JSON.stringify(r)}`).join("\n\n")}`,
      }),
    ],
  });
  return {
    attempts: results[0],
    synthesizer: results[1],
  } as InferEnsembleResult<EnsembleScaffold<S>>;
}
