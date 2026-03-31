// Shared helpers for sandwich package integration tests

import { expect } from "@std/expect";
import { DatabaseSync } from "node:sqlite";

// ── Tolerance constants ──────────────────────────────────────────────────────

/** Default tolerance for numerical comparisons against R reference values */
export const TOL = 1e-6;

/** Tolerance for Stata comparisons (lower precision) */
export const TOL_STATA = 1e-5;

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

/** Assert two matrices (flattened column-major as R emits) are close */
export function assertMatrixClose(
  actual: number[][],
  expectedFlat: number[],
  tol: number,
  label?: string,
) {
  const k = actual.length;
  expect(expectedFlat.length).toBe(k * k);
  for (let col = 0; col < k; col++) {
    for (let row = 0; row < k; row++) {
      const idx = col * k + row;
      assertClose(
        actual[row][col],
        expectedFlat[idx],
        tol,
        `${label ?? ""}[${row}][${col}]`,
      );
    }
  }
}

// ── Data loading ─────────────────────────────────────────────────────────────

const DB_PATH = new URL(
  "../fixtures/sandwich/sandwich.db",
  import.meta.url,
).pathname;

/** Load a table from the sandwich SQLite fixture database */
export function loadTable<T>(table: string): T[] {
  const db = new DatabaseSync(DB_PATH);
  const rows = db.prepare(`SELECT * FROM "${table}"`).all() as T[];
  db.close();
  return rows;
}

/** PetersenCL dataset row shape */
export interface PetersenCLRow {
  firm: number;
  year: number;
  x: number;
  y: number;
}

/** Load PetersenCL dataset */
export function loadPetersenCL(): PetersenCLRow[] {
  return loadTable<PetersenCLRow>("PetersenCL");
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
