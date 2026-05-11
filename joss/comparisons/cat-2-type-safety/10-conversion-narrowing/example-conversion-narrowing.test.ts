/**
 * Error Class 10: Type Conversion and Narrowing
 *
 * Tidy-TS tracks types through conversions. A string column can't be
 * used in arithmetic. After parsing to number | null, the compiler
 * forces null handling before arithmetic.
 * Python silently coerces or propagates NaN. R warns on coercion.
 */
import { expect } from "@std/expect";
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import {
  captureOutcome,
  deriveCompileOutcomes,
  type Outcome,
  type ProbeResult,
  printComparisonTable,
  probePath,
  runPythonProbe,
  runRProbe,
} from "../../test-helpers.ts";

const BASE = import.meta.url;

const LABELS = [
  "10a: arithmetic on string col",
  "10b: arithmetic on nullable",
  "10c: mean after conversion",
];

let tsResults: ProbeResult[];
let pyResults: ProbeResult[];
let rResults: ProbeResult[];

const raw = createDataFrame([
  { lab_id: "L1", result_str: "1250" },
  { lab_id: "L2", result_str: "pending" },
]);

// ── Tidy-TS ────────────────────────────────────────────────────────────────

Deno.test("10 — Conversion Narrowing: Tidy-TS compile-time", () => {
  // 10a: Arithmetic on string column — compile error
  // @ts-expect-error: string * number is not valid
  raw.mutate({ doubled: (r) => r.result_str * 2 });

  // 10b: After conversion to number | null, arithmetic still blocked
  const parsed = raw.mutate({
    result_num: (r) => {
      const n = Number(r.result_str);
      return isNaN(n) ? null : n;
    },
  });
  // @ts-expect-error: number | null can't be multiplied
  parsed.mutate({ doubled: (r) => r.result_num * 2 });

  // 10c: mean() on nullable column returns number | null — arithmetic blocked
  const summary = parsed.groupBy("lab_id").summarize({
    avg: (g) => s.mean(g.result_num),
  });
  // @ts-expect-error: number | null can't be multiplied
  summary.mutate({ doubled: (r) => r.avg * 2 });
});

Deno.test("10 — Conversion Narrowing: Tidy-TS runtime", () => {
  // deno-lint-ignore no-explicit-any
  const r = raw as any;

  tsResults = [
    // 10a: String * number in mutate produces NaN — silent (JS coercion)
    captureOutcome(() => {
      // deno-lint-ignore no-explicit-any
      const df = r.mutate({ doubled: (row: any) => row.result_str * 2 });
      const rows = df.toArray();
      const nanCount = rows.filter((row: any) => Number.isNaN(row.doubled)).length;
      return `${nanCount} value coerced to NaN`;
    }),
    // 10b: Arithmetic on nullable (number | null) — silent (null * 2 = 0 in JS)
    captureOutcome(() => {
      // deno-lint-ignore no-explicit-any
      const parsed = r.mutate({ result_num: (row: any) => { const n = Number(row.result_str); return isNaN(n) ? null : n; } });
      // deno-lint-ignore no-explicit-any
      const df = parsed.mutate({ doubled: (row: any) => row.result_num * 2 });
      const rows = df.toArray();
      const zeroFromNull = rows.filter((row: any) => row.result_num === null).length;
      return `null*2=0, ${zeroFromNull} null coerced`;
    }),
    // 10c: Conversion result used in further operations — silent
    captureOutcome(() => {
      // deno-lint-ignore no-explicit-any
      const parsed = r.mutate({ result_num: (row: any) => { const n = Number(row.result_str); return isNaN(n) ? null : n; } });
      const rows = parsed.toArray();
      const nullCount = rows.filter((row: any) => row.result_num === null).length;
      return `${nullCount} unparseable became null`;
    }),
  ];
  expect(tsResults[0].outcome).toBe("silent" as Outcome);
  expect(tsResults[1].outcome).toBe("silent" as Outcome);
  expect(tsResults[2].outcome).toBe("silent" as Outcome);
});

// ── Python ─────────────────────────────────────────────────────────────────

Deno.test("10 — Conversion Narrowing: Python", () => {
  pyResults = runPythonProbe(probePath(BASE, "./probe.py"));
  expect(pyResults.length).toBe(3);
  // 10a: to_numeric with coerce — silent (unparseable becomes NaN)
  expect(pyResults[0].outcome).toBe("silent" as Outcome);
  // 10b: Arithmetic on NaN — silent (NaN propagates)
  expect(pyResults[1].outcome).toBe("silent" as Outcome);
  // 10c: mean() after conversion — silent (skips NaN)
  expect(pyResults[2].outcome).toBe("silent" as Outcome);
});

// ── R ──────────────────────────────────────────────────────────────────────

Deno.test("10 — Conversion Narrowing: R", () => {
  rResults = runRProbe(probePath(BASE, "./probe.R"));
  expect(rResults.length).toBe(3);
  // 10a: as.numeric() on non-numeric — warning (produces NA)
  expect(rResults[0].outcome).toBe("warning" as Outcome);
  // 10b: Arithmetic on NA — silent (NA propagates)
  expect(rResults[1].outcome).toBe("silent" as Outcome);
  // 10c: mean() with NA — silent (returns NA)
  expect(rResults[2].outcome).toBe("silent" as Outcome);
});

const TS_COMPILE = deriveCompileOutcomes(import.meta.url, LABELS);

Deno.test("10 — Conversion Narrowing: Summary", () => {
  printComparisonTable({
    title: "Error Class 10: Type Conversion and Narrowing",
    labels: LABELS,
    tsCompile: TS_COMPILE,
    tidyTS: tsResults,
    python: pyResults,
    r: rResults,
  });
});
