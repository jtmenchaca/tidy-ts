/**
 * Error Class 20: Implicit Type Coercion in Row Binding
 *
 * Tidy-TS's bindRows computes a merged type. When the same column
 * has different types across DataFrames, TypeScript requires them
 * to be compatible. The merged column becomes a union type.
 * Python silently coerces to 'object'. R errors or coerces.
 */
import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";
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
  "20a: bindRows type mismatch",
  "20b: arithmetic on mixed col",
];

// Collected results for the summary table
let tsResults: ProbeResult[];
let pyResults: ProbeResult[];
let rResults: ProbeResult[];

const numericDoses = createDataFrame([
  { drug: "Aspirin", dose: 325 },
  { drug: "Lisinopril", dose: 10 },
]);

const textDoses = createDataFrame([
  { drug: "Insulin", dose: "sliding scale" },
  { drug: "Warfarin", dose: "per INR" },
]);

// ── Tidy-TS ────────────────────────────────────────────────────────────────

Deno.test("20 — Implicit Type Coercion: Tidy-TS compile-time", () => {
  // bindRows merges dose as number | string — the union is explicit
  const combined = numericDoses.bindRows(textDoses);

  // 20a: Treating union column as single type — compile error, runtime throws
  // @ts-expect-error: toFixed not available on number | string
  expect(() => combined.mutate({ formatted: (r) => r.dose.toFixed(2) })).toThrow();

  // 20b: Arithmetic on union column — compile error
  // @ts-expect-error: number | string can't be multiplied
  combined.mutate({ doubled: (r) => r.dose * 2 });
});

Deno.test("20 — Implicit Type Coercion: Tidy-TS runtime", () => {
  // deno-lint-ignore no-explicit-any
  const n = numericDoses as any;

  // deno-lint-ignore no-explicit-any
  tsResults = [
    // 20a: bindRows with type mismatch — silent (JS allows mixed arrays)
    captureOutcome(() => { n.bindRows(textDoses as any); return "mixed types in column"; }),
    // 20b: Arithmetic on mixed column — silent (string * 2 = NaN in JS)
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => { n.bindRows(textDoses as any).mutate({ doubled: (r: any) => r.dose * 2 }); return "strings produce NaN"; }),
  ];

  expect(tsResults[0].outcome).toBe("silent" as Outcome);
  expect(tsResults[1].outcome).toBe("silent" as Outcome);
});

// ── Python ─────────────────────────────────────────────────────────────────

Deno.test("20 — Implicit Type Coercion: Python", () => {
  pyResults = runPythonProbe(probePath(BASE, "./probe.py"));
  expect(pyResults.length).toBe(2);
  // 20a: concat silently coerces to object dtype
  expect(pyResults[0].outcome).toBe("silent" as Outcome);
  // 20b: * 2 on mixed column repeats strings instead of multiplying
  expect(pyResults[1].outcome).toBe("silent" as Outcome);
});

// ── R ──────────────────────────────────────────────────────────────────────

Deno.test("20 — Implicit Type Coercion: R", () => {
  rResults = runRProbe(probePath(BASE, "./probe.R"));
  expect(rResults.length).toBe(2);
  // 20a: bind_rows with double + character — R errors
  expect(rResults[0].outcome).toBe("error" as Outcome);
  // 20b: bind_rows with logical + numeric — silent coercion
  expect(rResults[1].outcome).toBe("silent" as Outcome);
});

// ── Summary ────────────────────────────────────────────────────────────────

const TS_COMPILE = deriveCompileOutcomes(import.meta.url, LABELS);

Deno.test("20 — Implicit Type Coercion: Summary", () => {
  printComparisonTable({
    title: "Error Class 20: Implicit Type Coercion in Row Binding",
    labels: LABELS,
    tsCompile: TS_COMPILE,
    tidyTS: tsResults,
    python: pyResults,
    r: rResults,
  });
});
