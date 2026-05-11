/**
 * Error Class 6: Schema Validation at Data Boundaries
 *
 * Tidy-TS uses readCSV with Zod schemas to validate types at load time.
 * Non-numeric values in numeric columns and null in non-null columns
 * are rejected with errors. After loading, the DataFrame is fully typed —
 * accessing nonexistent columns is a compile error.
 *
 * Python silently infers types (strings in numeric columns become object dtype).
 * R warns on coercion but silently produces NA.
 */
import { expect } from "@std/expect";
import { readCSV } from "@tidy-ts/dataframe";
import { z } from "zod";
import {
  captureOutcome,
  deriveCompileOutcomes,
  type Outcome,
  printComparisonTable,
  type ProbeResult,
  probePath,
  runPythonProbe,
  runRProbe,
} from "../../test-helpers.ts";

const BASE = import.meta.url;

const LABELS = [
  "6a: non-numeric in numeric col",
  "6b: missing column after load",
  "6c: empty cells in non-null col",
];

const LabSchema = z.object({
  lab_id: z.string(),
  result_value: z.coerce.number(),
});

// Pre-load a valid DataFrame so the compile-time test has a typed instance
const labsDf = await readCSV("lab_id,result_value\nL1,100\nL2,200\n", LabSchema);

// Collected results for the summary table
let tsResults: ProbeResult[];
let pyResults: ProbeResult[];
let rResults: ProbeResult[];

// ── Tidy-TS ────────────────────────────────────────────────────────────────

Deno.test("06 — Schema Validation: Tidy-TS compile-time", () => {
  // 6a: CSV content is only known at runtime — no compile-time error for bad values. compile: N/A

  // 6b: After readCSV with a schema, the type system knows exactly which columns
  // exist. Accessing a column outside the schema is a compile error.
  // @ts-expect-error: missing_col doesn't exist in LabSchema
  expect(() => labsDf.mutate({ x: (r) => r.missing_col })).toThrow();

  // 6c: Empty cells in non-null columns — same as 6a, runtime validation. compile: N/A
});

Deno.test("06 — Schema Validation: Tidy-TS runtime", async () => {
  // deno-lint-ignore no-explicit-any
  const df = labsDf as any;

  tsResults = [
    // 6a: Non-numeric in numeric col — readCSV rejects "pending" via Zod
    await (async (): Promise<ProbeResult> => {
      try {
        await readCSV("lab_id,result_value\nL1,100\nL2,pending\nL3,200\n", LabSchema);
        return { outcome: "silent", message: "no error", result: null };
      } catch (e) {
        return { outcome: "error", message: (e as Error).message, result: null };
      }
    })(),
    // 6b: Accessing missing column after load — proxy throws
    captureOutcome(() => {
      // deno-lint-ignore no-explicit-any
      df.mutate({ x: (r: any) => r.missing_col });
    }),
    // 6c: Null in non-null column — readCSV rejects empty cell via Zod
    await (async (): Promise<ProbeResult> => {
      try {
        await readCSV("lab_id,result_value\nL1,100\nL2,\nL3,200\n", LabSchema);
        return { outcome: "silent", message: "no error", result: null };
      } catch (e) {
        return { outcome: "error", message: (e as Error).message, result: null };
      }
    })(),
  ];

  expect(tsResults[0].outcome).toBe("error" as Outcome);
  expect(tsResults[1].outcome).toBe("error" as Outcome);
  expect(tsResults[2].outcome).toBe("error" as Outcome);
});

// ── Python ─────────────────────────────────────────────────────────────────

Deno.test("06 — Schema Validation: Python", () => {
  pyResults = runPythonProbe(probePath(BASE, "./probe.py"));
  expect(pyResults.length).toBe(3);
  // 6a: Non-numeric in numeric column — silent (dtype becomes object)
  expect(pyResults[0].outcome).toBe("silent" as Outcome);
  // 6b: Missing column accessed after load — runtime error
  expect(pyResults[1].outcome).toBe("error" as Outcome);
  // 6c: Empty cells in column — silent (becomes NaN)
  expect(pyResults[2].outcome).toBe("silent" as Outcome);
});

// ── R ──────────────────────────────────────────────────────────────────────

Deno.test("06 — Schema Validation: R", () => {
  rResults = runRProbe(probePath(BASE, "./probe.R"));
  expect(rResults.length).toBe(3);
  // 6a: Non-numeric in numeric column — warning (coerced to NA)
  expect(rResults[0].outcome).toBe("warning" as Outcome);
  // 6b: Missing column accessed after load — runtime error
  expect(rResults[1].outcome).toBe("error" as Outcome);
  // 6c: Empty cells in column — silent (becomes NA)
  expect(rResults[2].outcome).toBe("silent" as Outcome);
});

// ── Summary ────────────────────────────────────────────────────────────────

const TS_COMPILE = deriveCompileOutcomes(import.meta.url, LABELS);

Deno.test("06 — Schema Validation: Summary", () => {
  printComparisonTable({
    title: "Error Class 06: Schema Validation at Data Boundaries",
    labels: LABELS,
    tsCompile: TS_COMPILE,
    tidyTS: tsResults,
    python: pyResults,
    r: rResults,
  });
});
