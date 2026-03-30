// Shared helpers for survival package integration tests

import { expect } from "@std/expect";
import { DatabaseSync } from "node:sqlite";

// ── Tolerance constants ──────────────────────────────────────────────────────
// Aligned with plan thresholds for R validation

/** Default tolerance for all numerical comparisons against R reference values */
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

// ── Data loading ─────────────────────────────────────────────────────────────

const DB_PATH = new URL(
  "../fixtures/survival/survival.db",
  import.meta.url,
).pathname;

/** Load a table from the survival SQLite fixture database */
export function loadTable<T>(table: string): T[] {
  const db = new DatabaseSync(DB_PATH);
  const rows = db.prepare(`SELECT * FROM ${table}`).all() as T[];
  db.close();
  return rows;
}

/** AML dataset row shape */
export interface AmlRow {
  time: number;
  status: number;
  x: string;
}

/** Load AML dataset */
export function loadAml(): AmlRow[] {
  return loadTable<AmlRow>("cancer_aml");
}

// ── R reference value extraction ─────────────────────────────────────────────

const EXTRACT_R_PATH = new URL(
  "./source-tests/extract-reference.R",
  import.meta.url,
).pathname;

const refCache = new Map<string, Record<string, unknown>>();
const rScriptRefCache = new Map<string, Record<string, unknown>>();

/** Run extract-reference.R for a test name and return parsed JSON */
export function getReferenceValues<T = Record<string, unknown>>(
  testName: string,
): T {
  const cached = refCache.get(testName);
  if (cached) return cached as T;

  const cmd = new Deno.Command("Rscript", {
    args: [EXTRACT_R_PATH, testName],
    stdout: "piped",
    stderr: "piped",
  });
  const { code, stdout, stderr } = cmd.outputSync();
  if (code !== 0) {
    const err = new TextDecoder().decode(stderr);
    throw new Error(`Rscript failed for "${testName}": ${err}`);
  }
  const json = new TextDecoder().decode(stdout);
  const result = JSON.parse(json) as Record<string, unknown>;
  refCache.set(testName, result);
  return result as T;
}

/**
 * Run a companion `*-source-test.R` script (JSON on stdout) and return parsed JSON.
 * Prefer this when the R reference lives alongside the `.test.ts` file.
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
