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

/** Force TypeScript to fully expand a type to a plain object literal in hover */
type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

/** Infer the output type from a StepDef */
type InferStep<T> = T extends StepDef<infer S> ? z.infer<S> : unknown;

// ============================================================================
// Evaluate: Generator → Evaluator → Adjudicator
// ============================================================================

export interface EvaluateScaffold<
  G extends z.ZodObject = z.ZodObject,
  E extends z.ZodObject = z.ZodObject,
  A extends z.ZodObject = z.ZodObject,
> {
  generator: StepDef<G>;
  evaluator: StepDef<E>;
  adjudicator: StepDef<A>;
  model?: ModelOption;
}

export interface EvaluateResult<
  G = Record<string, unknown>,
  E = Record<string, unknown>,
  A = Record<string, unknown>,
> {
  generator: G;
  evaluator: E;
  adjudicator: A;
}

/** Infer the Result type from a Config — expands to a plain object in hover */
export type InferEvaluateResult<C> = C extends EvaluateScaffold<infer G, infer E, infer A>
  ? Expand<{ generator: z.infer<G>; evaluator: z.infer<E>; adjudicator: z.infer<A> }>
  : never;

export function createEvaluateScaffold<
  G extends z.ZodObject,
  E extends z.ZodObject,
  A extends z.ZodObject,
>(config: EvaluateScaffold<G, E, A>): EvaluateScaffold<G, E, A> {
  return config;
}

// ============================================================================
// Pipeline: Step1 → Step2 → ... → StepN (linear chain)
// ============================================================================

/** Extract the last element of a tuple type */
type Last<T extends readonly unknown[]> = T extends readonly [...infer _Rest, infer L] ? L : never;

export interface PipelineScaffold<
  Steps extends readonly StepDef[] = readonly StepDef[],
> {
  steps: [...Steps];
  model?: ModelOption;
}

export interface PipelineResult<Final = Record<string, unknown>> {
  steps: unknown[];
  final: Final;
}

/** Infer the Result type from a Config — expands to a plain object in hover */
export type InferPipelineResult<C> = C extends PipelineScaffold<infer Steps>
  ? Expand<{ steps: unknown[]; final: InferStep<Last<Steps>> }>
  : never;

export function createPipelineScaffold<
  const Steps extends readonly StepDef[],
>(config: PipelineScaffold<Steps>): PipelineScaffold<Steps> {
  return config;
}

// ============================================================================
// Debate: Proposition → Advocate + Critic (parallel) → Judge
// ============================================================================

export interface DebateScaffold<
  P extends z.ZodObject = z.ZodObject,
  A extends z.ZodObject = z.ZodObject,
  C extends z.ZodObject = z.ZodObject,
  J extends z.ZodObject = z.ZodObject,
> {
  proposition: StepDef<P>;
  advocate: StepDef<A>;
  critic: StepDef<C>;
  judge: StepDef<J>;
  model?: ModelOption;
}

export interface DebateResult<
  P = Record<string, unknown>,
  A = Record<string, unknown>,
  C = Record<string, unknown>,
  J = Record<string, unknown>,
> {
  proposition: P;
  advocate: A;
  critic: C;
  judge: J;
}

/** Infer the Result type from a Config — expands to a plain object in hover */
export type InferDebateResult<C> = C extends DebateScaffold<infer P, infer A, infer Cr, infer J>
  ? Expand<{ proposition: z.infer<P>; advocate: z.infer<A>; critic: z.infer<Cr>; judge: z.infer<J> }>
  : never;

export function createDebateScaffold<
  P extends z.ZodObject,
  A extends z.ZodObject,
  C extends z.ZodObject,
  J extends z.ZodObject,
>(config: DebateScaffold<P, A, C, J>): DebateScaffold<P, A, C, J> {
  return config;
}

// ============================================================================
// Refine: Drafter → (Critic → Reviser) × N rounds
// ============================================================================

export interface RefineScaffold<
  D extends z.ZodObject = z.ZodObject,
  C extends z.ZodObject = z.ZodObject,
  R extends z.ZodObject = z.ZodObject,
> {
  drafter: StepDef<D>;
  critic: StepDef<C>;
  reviser: StepDef<R>;
  rounds?: number;
  model?: ModelOption;
}

export interface RefineResult<
  D = Record<string, unknown>,
  C = Record<string, unknown>,
  R = Record<string, unknown>,
> {
  draft: D;
  rounds: Array<{ critique: C; revision: R }>;
  final: R | D;
}

/** Infer the Result type from a Config — expands to a plain object in hover */
export type InferRefineResult<C> = C extends RefineScaffold<infer D, infer Cr, infer R>
  ? Expand<{ draft: z.infer<D>; rounds: Array<{ critique: z.infer<Cr>; revision: z.infer<R> }>; final: z.infer<R> | z.infer<D> }>
  : never;

export function createRefineScaffold<
  D extends z.ZodObject,
  C extends z.ZodObject,
  R extends z.ZodObject,
>(config: RefineScaffold<D, C, R>): RefineScaffold<D, C, R> {
  return config;
}

// ============================================================================
// Ensemble: N parallel attempts → Synthesizer
// ============================================================================

export interface EnsembleScaffold<
  S extends z.ZodObject = z.ZodObject,
> {
  attempts: StepDef[];
  synthesizer: StepDef<S>;
  model?: ModelOption;
}

export interface EnsembleResult<S = Record<string, unknown>> {
  attempts: unknown[];
  synthesizer: S;
}

/** Infer the Result type from a Config — expands to a plain object in hover */
export type InferEnsembleResult<C> = C extends EnsembleScaffold<infer S>
  ? Expand<{ attempts: unknown[]; synthesizer: z.infer<S> }>
  : never;

export function createEnsembleScaffold<
  S extends z.ZodObject,
>(config: EnsembleScaffold<S>): EnsembleScaffold<S> {
  return config;
}
