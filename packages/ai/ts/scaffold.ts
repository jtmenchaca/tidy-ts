import { Agent, run, user } from "@openai/agents";
import { z } from "zod";

/*───────────────────────────────────────────────────────────────────────────┐
│  Types                                                                     │
└───────────────────────────────────────────────────────────────────────────*/

/** Configuration for a single agent step in a scaffold */
export interface ScaffoldStepConfig<T extends z.ZodObject = z.ZodObject> {
  instructions: string;
  schema: T;
  /** Override the user input for this step. If omitted, uses the scaffold's initial input. */
  userInput?: string;
  model?: "gpt-4.1-mini" | "gpt-4.1" | "gpt-5-mini" | "gpt-5.4-mini";
}

/**
 * A scaffold step is a function that receives prior step results
 * and returns either:
 * - A single ScaffoldStepConfig (runs one agent)
 * - An array of ScaffoldStepConfigs (runs agents in parallel)
 */
// deno-lint-ignore no-explicit-any
export type ScaffoldStep = (prev: any[]) => ScaffoldStepConfig | ScaffoldStepConfig[];

/** Options for runScaffold */
export interface ScaffoldOptions {
  /** The initial input/prompt that starts the scaffold */
  input: string;
  /** Array of step functions that define the scaffold pipeline */
  steps: ScaffoldStep[];
  /** Default model for all steps (can be overridden per step) */
  model?: "gpt-4.1-mini" | "gpt-4.1" | "gpt-5-mini" | "gpt-5.4-mini";
  /** If true, return the full array of all step results instead of just the last */
  returnAll?: boolean;
}

/*───────────────────────────────────────────────────────────────────────────┐
│  Implementation                                                            │
└───────────────────────────────────────────────────────────────────────────*/

async function executeStep(
  config: ScaffoldStepConfig,
  defaultInput: string,
  defaultModel: "gpt-4.1-mini" | "gpt-4.1" | "gpt-5-mini" | "gpt-5.4-mini",
): Promise<z.infer<typeof config.schema>> {
  const agent = new Agent({
    name: "scaffold-agent",
    model: config.model ?? defaultModel,
    instructions: config.instructions,
    outputType: config.schema,
  });

  const input = config.userInput ?? defaultInput;
  const result = await run(agent, [user(input)]);
  return result.finalOutput as z.infer<typeof config.schema>;
}

/**
 * Run a multi-step agent scaffold.
 *
 * Each step is a function that receives an array of all prior step outputs
 * and returns either a single agent config or an array of configs (for parallel execution).
 *
 * @example
 * ```ts
 * // Linear: translate then compare
 * const result = await LLM.runScaffold({
 *   input: "Hello world",
 *   steps: [
 *     () => ({ instructions: "Translate to pig latin", schema: z.object({ pigLatin: z.string() }) }),
 *     (prev) => ({ instructions: "Compare lengths", userInput: `Original: "Hello world", Translated: "${prev[0].pigLatin}"`, schema: z.object({ difference: z.number() }) }),
 *   ],
 * });
 *
 * // Parallel evaluators + adjudicator
 * const result = await LLM.runScaffold({
 *   input: "Write a haiku",
 *   steps: [
 *     () => ({ instructions: "Write a haiku", schema: z.object({ haiku: z.string() }) }),
 *     (prev) => [
 *       { instructions: "Rate creativity", userInput: prev[0].haiku, schema: ratingSchema },
 *       { instructions: "Rate form", userInput: prev[0].haiku, schema: ratingSchema },
 *     ],
 *     (prev) => ({ instructions: "Synthesize ratings", userInput: JSON.stringify(prev[1]), schema: finalSchema }),
 *   ],
 * });
 * ```
 */
// deno-lint-ignore no-explicit-any
export async function runScaffold(options: ScaffoldOptions): Promise<any> {
  const { input, steps, model = "gpt-5.4-mini", returnAll = false } = options;
  // deno-lint-ignore no-explicit-any
  const results: any[] = [];

  for (const stepFn of steps) {
    const config = stepFn(results);

    if (Array.isArray(config)) {
      // Parallel execution
      const parallelResults = await Promise.all(
        config.map((c) => executeStep(c, input, model)),
      );
      results.push(parallelResults);
    } else {
      // Single agent execution
      const result = await executeStep(config, input, model);
      results.push(result);
    }
  }

  return returnAll ? results : results[results.length - 1];
}
