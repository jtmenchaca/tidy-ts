// Shared helpers for target trial emulation integration tests

import { expect } from "@std/expect";
import { DatabaseSync } from "node:sqlite";

// ── Tolerance constants ──────────────────────────────────────────────────────
// SEQTaRget R tests use tolerance = 1e-2 for coefficient comparisons

/** Default tolerance for numerical comparisons against R reference values */
export const TOL = 1e-2;

/** Tighter tolerance for survival curves (no bootstrap noise) */
export const TOL_SURV = 1e-4;

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
  "../fixtures/targetTrial/targetTrial.db",
  import.meta.url,
).pathname;

interface SEQRow {
  ID: number;
  time: number;
  eligible: number;
  outcome: number;
  tx_init: number;
  sex: number;
  N: number;
  L: number;
  P: number;
  excusedZero: number;
  excusedOne: number;
}

interface SEQLTFURow extends SEQRow {
  LTFU: number;
  eligible_cense: number;
}

/** Load a table from the targetTrial SQLite fixture database */
export function loadTable<T>(table: string): T[] {
  const db = new DatabaseSync(DB_PATH);
  const rows = db.prepare(`SELECT * FROM ${table}`).all() as T[];
  db.close();
  return rows;
}

/** Load SEQdata dataset */
export function loadSEQdata(): SEQRow[] {
  return loadTable<SEQRow>("SEQdata");
}

/** Load SEQdata_LTFU dataset */
export function loadSEQdataLTFU(): SEQLTFURow[] {
  return loadTable<SEQLTFURow>("SEQdata_LTFU");
}

/** Load SEQdata_multitreatment dataset */
export function loadSEQdataMulti(): SEQRow[] {
  return loadTable<SEQRow>("SEQdata_multitreatment");
}

/** Convert row-based data to ColumnarData format for WASM */
// deno-lint-ignore no-explicit-any
export function toColumnarData(
  rows: any[],
  numericCols: string[],
  categoricalCols: string[] = [],
): { numeric: Record<string, number[]>; categorical: Record<string, string[]>; nrows: number } {
  const numeric: Record<string, number[]> = {};
  const categorical: Record<string, string[]> = {};

  for (const col of numericCols) {
    numeric[col] = rows.map((r) => r[col] as number);
  }
  for (const col of categoricalCols) {
    categorical[col] = rows.map((r) => String(r[col]));
  }

  return { numeric, categorical, nrows: rows.length };
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
