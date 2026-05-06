// Shared helpers for statistical test R source integration tests
// Mirrors glm-test-helpers.ts pattern

import { expect } from "@std/expect";

// -- Tolerance constants --

/** Default tolerance for all numerical comparisons against R reference values */
export const TOL = 1e-6;

// -- Assertion helpers --

export function assertClose(
  actual: number,
  expected: number,
  tol: number,
  label?: string,
) {
  if (actual === expected) return; // handles ±Infinity equality
  const diff = Math.abs(actual - expected);
  // Use relative tolerance for large values (like R's all.equal)
  const scale = Math.max(1, Math.abs(expected));
  if (diff / scale > tol) {
    throw new Error(
      `${label ?? ""} expected ${expected}, got ${actual} (diff=${diff}, rel=${diff / scale}, tol=${tol})`,
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

// -- R reference value extraction --

const rScriptRefCache = new Map<string, Record<string, unknown>>();

/**
 * Run a companion R script (JSON on stdout) and return parsed JSON.
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
  const result = JSON.parse(json, (_key, value) => {
    if (value === "Infinity") return Infinity;
    if (value === "-Infinity") return -Infinity;
    return value;
  }) as Record<string, unknown>;
  rScriptRefCache.set(rScriptPath, result);
  return result as T;
}
