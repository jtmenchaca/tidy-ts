// Shared helpers for GLM R source integration tests
// Mirrors survival-test-helpers.ts pattern

import { expect } from "@std/expect";

// ── Tolerance constants ──────────────────────────────────────────────────────

/** Default tolerance for all numerical comparisons against R reference values.
 *  Set to 5e-6 to accommodate derived quantities (e.g. Wald CI = coef ± z*SE)
 *  where multiplication amplifies small precision differences. */
export const TOL = 1e-6;

/** Exact match tolerance for identical/integer results */
export const TOL_EXACT = 1e-10;

// ── Assertion helpers ────────────────────────────────────────────────────────

export function assertClose(
  actual: number,
  expected: number,
  tol: number,
  label?: string,
) {
  const diff = Math.abs(actual - expected);
  if (diff > tol) {
    throw new Error(
      `${label ?? ""} expected ${expected}, got ${actual} (diff=${diff}, tol=${tol})`,
    );
  }
}

export function assertArrayClose(
  actual: number[],
  expected: number[],
  tol: number,
  label?: string,
) {
  expect(actual.length).toBe(expected.length);
  for (let i = 0; i < actual.length; i++) {
    assertClose(actual[i], expected[i], tol, `${label ?? ""}[${i}]`);
  }
}

// ── R reference value extraction ─────────────────────────────────────────────

const rScriptRefCache = new Map<string, Record<string, unknown>>();

/**
 * Run a companion `*-source-test.R` script (JSON on stdout) and return parsed JSON.
 */
export function getReferenceFromRScript<T = Record<string, unknown>>(
  rScriptPath: string,
): T {
  const cached = rScriptRefCache.get(rScriptPath);
  if (cached) return cached as T;

  const cmd = new Deno.Command("Rscript", {
    args: [rScriptPath],
    stdout: "piped",
    stderr: "piped",
  });
  const { code, stdout, stderr } = cmd.outputSync();
  if (code !== 0) {
    const err = new TextDecoder().decode(stderr);
    throw new Error(`Rscript failed for "${rScriptPath}": ${err}`);
  }
  const json = new TextDecoder().decode(stdout);
  const result = JSON.parse(json) as Record<string, unknown>;
  rScriptRefCache.set(rScriptPath, result);
  return result as T;
}
