import { z } from "zod";
import { runScaffold } from "../scaffold.ts";
import type { ModelOption, StepDef } from "./types.ts";

/**
 * Ensemble + Synthesize: Multiple agents attempt the same task in parallel,
 * then a synthesizer picks the best or merges them.
 */
export async function ensemble<T extends z.ZodObject>({
  ensemble: { input, attempts },
  synthesizer,
  model = "gpt-5.4-mini",
}: {
  ensemble: { input: string; attempts: StepDef[] };
  synthesizer: { instructions: string; schema: T; model?: ModelOption };
  model?: ModelOption;
}): Promise<z.infer<T>> {
  return runScaffold({
    input,
    model,
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
}
