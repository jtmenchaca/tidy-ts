// Survival analysis WASM bindings

import { initWasm, wasmInternal } from "./wasm-init.ts";

// ── Result interfaces ──────────────────────────────────────────────────────

interface CoxphResult {
  coefficients: number[];
  var: number[][];
  loglik: [number, number];
  score: number;
  iter: number;
  method: string;
  means: number[];
  n: number;
  nevent: number;
  linearPredictors: number[];
  residuals: number[];
  scoreResiduals: number[][];
  predictorNames: string[];
}

export interface SurvfitResult {
  time: number[];
  nRisk: number[];
  nEvent: number[];
  nCensor: number[];
  surv: number[];
  cumhaz: number[];
  stdErr: number[];
  stdChaz: number[];
  strata?: number[];
  strataNames?: string[];
}

export interface SurvdiffResult {
  n: number[];
  obs: number[];
  exp: number[];
  var: number[][];
  chisq: number;
  df: number;
  pvalue: number;
}

export interface SchoenfeldResult {
  time: number[];
  residuals: number[][];
}

export interface SurvSplitResult {
  row: number[];
  interval: number[];
  start: number[];
  end: number[];
  censor: boolean[];
}

export interface ConcordanceResult {
  count: number[];
  influence: number[][];
  resid: number[][] | null;
}

export interface FineGrayResult {
  row: number[];
  start: number[];
  stop: number[];
  status: number[];
  wt: number[];
  add: number[];
}

export interface SurvfitCoxResult {
  time: number[];
  nRisk: number[];
  nEvent: number[];
  surv: number[];
  cumhaz: number[];
  stdErr: number[];
}

// ── Options interfaces ─────────────────────────────────────────────────────


/** Counting-process Cox — tuning and weights (mirrors fields passed to WASM). */
export interface CoxphCountingOptions {
  method?: "breslow" | "efron";
  maxiter?: number;
  eps?: number;
  init?: number[];
  nocenter?: boolean;
  weights?: number[];
  offset?: number[];
  strata?: number[];
}

export interface SurvfitOptions {
  groups?: number[];
  weights?: number[];
  stype?: number;
  influence?: number;
}

/** Cox-based survival curve — start and prediction controls. */
export interface SurvfitCoxOptions {
  start?: number[];
  coef?: number[];
  covariates?: Record<string, number[]>;
  offset?: number[];
  weights?: number[];
  stype?: number;
  ctype?: number;
  censor?: boolean;
  newx?: number[];
  means?: number[];
  varMatrix?: number[][];
}

export interface SurvdiffOptions {
  rho?: number;
  strata?: number[];
}

export interface ResidualOptions {
  type?:
    | "martingale"
    | "mart"
    | "score"
    | "schoenfeld"
    | "scho"
    | "deviance"
    | "dfbeta"
    | "dfbetas";
  method?: "breslow" | "efron" | "exact";
  weights?: number[];
  offset?: number[];
  strata?: number[];
  var?: number[][];
}

export interface ConcordanceOptions {
  reverse?: boolean;
}

export interface CoxResidualsCountingOptions {
  type?: "mart" | "score" | "scho";
  method?: "breslow" | "efron";
  weights?: number[];
  strata?: number[];
}

// ── Functions ──────────────────────────────────────────────────────────────

/**
 * Fit a Cox proportional hazards model.
 *
 * @param time - Event/censoring times
 * @param status - Event indicators (1 = event, 0 = censored)
 * @param covariates - Map of covariate name → numeric array (all arrays must be the same length as time)
 * @param method - Tie-handling method: "efron" (default in R), "breslow", or "exact"
 * @param maxiter - Maximum Newton-Raphson iterations (default 25)
 * @param eps - Convergence tolerance (default 1e-9)
 * @param weights - Case weights, one per observation (default all 1s)
 * @param offset - Offset term added to the linear predictor (default all 0s)
 * @param strata - Stratum indicator per observation, integer-coded (default single stratum)
 * @param init - Initial coefficient values (default all 0s)
 * @param nocenter - If true, skip mean-centering of covariates. When false (default),
 *   covariates where all values are in {-1, 0, 1} are not centered (matches R behavior).
 *
 * @returns CoxphResult with coefficients, variance matrix, log-likelihood [null, fitted],
 *   score test statistic, martingale residuals, score residuals, and linear predictors
 *   (all in original input order).
 */
export function coxph({
  time,
  status,
  covariates,
  method,
  maxiter,
  eps,
  weights,
  offset,
  strata,
  init,
  nocenter,
}: {
  time: number[];
  status: number[];
  covariates: Record<string, number[]>;
  method: "breslow" | "efron" | "exact";
  maxiter?: number;
  eps?: number;
  weights?: number[];
  offset?: number[];
  strata?: number[];
  init?: number[];
  nocenter?: boolean;
}
): CoxphResult {
  initWasm();
  return wasmInternal.coxph_wasm(
    JSON.stringify(time),
    JSON.stringify(status),
    JSON.stringify(covariates),
    JSON.stringify({ method, maxiter, eps, weights, offset, strata, init, nocenter }),
  ) as CoxphResult;
}

export function survfit({
  time,
  status,
  options,
}: {
  time: number[];
  status: number[];
  options?: SurvfitOptions;
}): SurvfitResult {
  initWasm();
  return wasmInternal.survfit_km_wasm(
    JSON.stringify(time),
    JSON.stringify(status),
    JSON.stringify(options ?? {}),
  ) as SurvfitResult;
}

export function survdiff({
  time,
  status,
  group,
  options,
}: {
  time: number[];
  status: number[];
  group: number[];
  options?: SurvdiffOptions;
}): SurvdiffResult {
  initWasm();
  return wasmInternal.survdiff_wasm(
    JSON.stringify(time),
    JSON.stringify(status),
    JSON.stringify(group),
    JSON.stringify(options ?? {}),
  ) as SurvdiffResult;
}

export function coxResiduals({
  time,
  status,
  coef,
  covariates,
  options,
}: {
  time: number[];
  status: number[];
  coef: number[];
  covariates: Record<string, number[]>;
  options?: ResidualOptions;
}): number[] | number[][] | SchoenfeldResult {
  initWasm();
  return wasmInternal.cox_residuals_wasm(
    JSON.stringify(time),
    JSON.stringify(status),
    JSON.stringify(coef),
    JSON.stringify(covariates),
    JSON.stringify(options ?? {}),
  );
}

function survSplit({
  tstart,
  tstop,
  cut,
}: {
  tstart: number[];
  tstop: number[];
  cut: number[];
}): SurvSplitResult {
  initWasm();
  return wasmInternal.survsplit_wasm(
    JSON.stringify(tstart),
    JSON.stringify(tstop),
    JSON.stringify(cut),
  ) as SurvSplitResult;
}

export function concordance({
  time,
  status,
  x,
  options,
}: {
  time: number[];
  status: number[];
  x: number[];
  options?: ConcordanceOptions;
}): ConcordanceResult {
  initWasm();
  return wasmInternal.concordance_wasm(
    JSON.stringify(time),
    JSON.stringify(status),
    JSON.stringify(x),
    JSON.stringify(options ?? {}),
  ) as ConcordanceResult;
}

export function survfitCox({
  time,
  status,
  options,
}: {
  time: number[];
  status: number[];
  options?: SurvfitCoxOptions;
}): SurvfitCoxResult {
  initWasm();
  const o = options ?? {};
  return wasmInternal.survfit_cox_wasm(
    JSON.stringify({
      time,
      start: o.start,
      status,
      coef: o.coef ?? [],
      covariates: o.covariates ?? {},
      offset: o.offset,
      weights: o.weights,
      stype: o.stype,
      ctype: o.ctype,
      censor: o.censor,
      newx: o.newx,
      means: o.means,
      var: o.varMatrix,
    }),
  ) as SurvfitCoxResult;
}

export function coxphCounting({
  start,
  stop,
  status,
  covariates,
  options,
}: {
  start: number[];
  stop: number[];
  status: number[];
  covariates: Record<string, number[]>;
  options?: CoxphCountingOptions;
}): CoxphResult {
  initWasm();
  const o = options ?? {};
  return wasmInternal.coxph_counting_wasm(
    JSON.stringify({
      start,
      stop,
      status,
      covariates,
      method: o.method,
      maxiter: o.maxiter,
      eps: o.eps,
      init: o.init,
      nocenter: o.nocenter,
      weights: o.weights,
      offset: o.offset,
      strata: o.strata,
    }),
  ) as CoxphResult;
}

export function coxResidualsCounting({
  start,
  stop,
  status,
  coef,
  covariates,
  options,
}: {
  start: number[];
  stop: number[];
  status: number[];
  coef: number[];
  covariates: Record<string, number[]>;
  options?: CoxResidualsCountingOptions;
}): number[] | number[][] | SchoenfeldResult {
  initWasm();
  return wasmInternal.cox_residuals_counting_wasm(
    JSON.stringify({
      start,
      stop,
      status,
      coef,
      covariates,
      ...(options ?? {}),
    }),
  );
}

export function finegray({
  tstop,
  status,
  tstart,
  etype,
  strata,
  id,
  weights,
  counting,
}: {
  tstop: number[];
  status: number[];
  tstart?: number[];
  etype?: number;
  strata?: number[];
  id?: number[];
  weights?: number[];
  counting?: boolean;
}): FineGrayResult {
  initWasm();
  return wasmInternal.finegray_wasm(
    JSON.stringify({
      tstart: tstart ?? tstop.map(() => 0),
      tstop,
      status,
      etype,
      strata,
      id,
      weights,
      counting,
    }),
  ) as FineGrayResult;
}
