import { z } from "zod";

export type ModelOption =
  | "gpt-4.1-mini"
  | "gpt-4.1"
  | "gpt-5-mini"
  | "gpt-5.4-mini";

/** A single step definition: instructions + schema + optional model override */
export interface StepDef<T extends z.ZodObject = z.ZodObject> {
  instructions: string;
  schema: T;
  model?: ModelOption;
}

/** Config for the evaluate scaffold */
export interface EvaluateConfig<
  G extends z.ZodObject = z.ZodObject,
  E extends z.ZodObject = z.ZodObject,
  A extends z.ZodObject = z.ZodObject,
> {
  generator: StepDef<G>;
  evaluator: StepDef<E>;
  adjudicator: StepDef<A>;
  model?: ModelOption;
}

/** Result of the evaluate scaffold — exposes all intermediate outputs */
export interface EvaluateResult<
  G extends z.ZodObject = z.ZodObject,
  E extends z.ZodObject = z.ZodObject,
  A extends z.ZodObject = z.ZodObject,
> {
  generator: z.infer<G>;
  evaluator: z.infer<E>;
  adjudicator: z.infer<A>;
}

/** Factory that infers G, E, A from the step schemas */
export function createEvaluateConfig<
  G extends z.ZodObject,
  E extends z.ZodObject,
  A extends z.ZodObject,
>(config: EvaluateConfig<G, E, A>): EvaluateConfig<G, E, A> {
  return config;
}
